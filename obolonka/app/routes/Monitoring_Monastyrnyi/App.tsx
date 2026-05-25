import { useState, useEffect, useRef } from 'react';
import {HISTORY_API_URL, STATUS_API_URL, MQTT_WEBSOCKETS_API_URL,
  SIMULATOR_CONTROL_TOPIC, SENSOR_DATA_TOPIC, SIMULATOR_STATUS_TOPIC} from "./local_consts"
import mqtt from 'mqtt';
import {
  Cpu, Smartphone, Refrigerator
} from 'lucide-react';
import type {HistoryPoint, SystemStatus, ConsumerDevice, IngestorStatus} from './types';
import { Dashboard } from './components/Dashboard.tsx';

let globalMqttClient: mqtt.MqttClient | null = null;



const MAX_CHART_POINTS = 50;

const MonitoringApp = () => {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [isMqttConnected, setIsMqttConnected] = useState(false);
  const isMqttConnectedRef = useRef(isMqttConnected);
  useEffect(() => {
    isMqttConnectedRef.current = isMqttConnected;
  }, [isMqttConnected]);
  const [ingestorInfo, setIngestorInfo] = useState<IngestorStatus | null>({
    status: 'waiting',
    lastRecordTime: null,
    secondsSinceLastRecord: null,
    message: 'Очікування на відповідь від бази даних'
  });
  const lastDataTime = useRef<number>(Date.now());

  const [status, setStatus] = useState<SystemStatus>({
    solarPower: 0,
    chargePower: 0,
    dischargePower: 0,
    solarV: 0,
    solarA: 0,
    dischargeV: 0,
    dischargeA: 0,
    batteryCharge: 82,
    batteryTemp: 24.5,
    mpptEfficiency: 0,
  });

  const [devices, setDevices] = useState<ConsumerDevice[]>([
    { id: 'dev1', name: 'Прилад 1', consumption: 0, voltage: 0, current: 0, icon: Cpu, color: 'text-indigo-500' },
    { id: 'dev2', name: 'Прилад 2', consumption: 0, voltage: 0, current: 0, icon: Refrigerator, color: 'text-amber-500' },
    { id: 'dev3', name: 'Прилад 3', consumption: 0, voltage: 0, current: 0, icon: Smartphone, color: 'text-emerald-500' },
  ]);

  const [isSimulatorOn, setIsSimulatorOn] = useState(true);
  const [isSimulatorPending, setIsSimulatorPending] = useState(false);
  const lastToggleTime = useRef<number>(0);
  const waitingForFirstData = useRef<boolean>(false);

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  useEffect(() => {
     fetch(HISTORY_API_URL)
         .then(res => res.json())
         .then(data => {
           const historyData = data.map((d: any) => ({
             timestamp: new Date(d.time).getTime(),
             time: formatTime(new Date(d.time)),
             solar: d.solar_p || 0,
             consumption: d.discharge_p || 0,
             solar_v: d.solar_v || 0,
             solar_i: d.solar_i || 0,
             charge_v: d.charge_v || 0,
             charge_i: d.charge_i || 0,
             discharge_v: d.discharge_v || 0,
             discharge_i: d.discharge_i || 0,
           })).sort((a: any, b: any) => a.timestamp - b.timestamp)
              .slice(-MAX_CHART_POINTS);
  
           setHistory(historyData);
         })
         .catch(err => console.error("History load failed", err));

     // Підключення до MQTT сервера
    if (!globalMqttClient) {
      globalMqttClient = mqtt.connect(MQTT_WEBSOCKETS_API_URL, {
        clientId: 'smart_ui_' + Math.random().toString(16).substring(2, 8),
        username: 'frontend',
        password: 'frontend_pass',
      });
    }

    const client = globalMqttClient;
    client.on('connect', () => {
      client.subscribe([SENSOR_DATA_TOPIC, SIMULATOR_STATUS_TOPIC]);
    });

    const handleMessage = (topic: string, message: Buffer) => {
      try {
        const payloadStr = message.toString();

        if (topic === SIMULATOR_STATUS_TOPIC) {
          const newState = payloadStr === 'ON';
          setIsSimulatorOn(newState);
          
          if (newState) {
            // When simulator turns ON, we might still want to wait for first data
            // before clearing the pending state, but let's see if we are in that mode.
            if (!waitingForFirstData.current) {
              setIsSimulatorPending(false);
            }
          } else {
            // When simulator turns OFF, we can clear pending immediately
            setIsSimulatorPending(false);
            waitingForFirstData.current = false;
          }
          return;
        }

        const payload = JSON.parse(payloadStr);

        if (topic === SENSOR_DATA_TOPIC) {
          if (payload.status === 'online') {
            setIsMqttConnected(true);
            if (waitingForFirstData.current) {
              waitingForFirstData.current = false;
              setIsSimulatorPending(false);
            }
          } else if (payload.status === 'offline') {
            setIsMqttConnected(false);
            setDevices(prev => prev.map(d => ({ ...d, voltage: 0, current: 0, consumption: 0 })));
            return;
          }
          // The check below is redundant now but kept for safety if status is undefined
          if (payload.status === undefined) { 
             setIsMqttConnected(true);
          }
          lastDataTime.current = Date.now();

          const pS = (payload.solar?.v || 0) * (payload.solar?.i || 0);
          const pD = (payload.discharge?.v || 0) * (payload.discharge?.i || 0);
          const dataTimestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();

          setStatus(prev => ({
            ...prev,
            solarPower: pS,
            solarV: payload.solar?.v || 0,
            solarA: payload.solar?.i || 0,
            chargePower: (payload.charge?.v || 0) * (payload.charge?.i || 0),
            dischargePower: pD,
            dischargeV: payload.discharge?.v || 0,
            dischargeA: payload.discharge?.i || 0,
            batteryCharge: payload.battery?.charge || prev.batteryCharge,
            mpptEfficiency: pS > 0 ? (((payload.charge?.v || 0) * (payload.charge?.i || 0)) / pS) * 100 : 0,
          }));

          setHistory(prev => {
            const newPoint: HistoryPoint = {
              timestamp: dataTimestamp.getTime(),
              time: formatTime(dataTimestamp),
              solar: pS,
              consumption: pD,
              solar_v: payload.solar?.v || 0,
              solar_i: payload.solar?.i || 0,
              charge_v: payload.charge?.v || 0,
              charge_i: payload.charge?.i || 0,
              discharge_v: payload.discharge?.v || 0,
              discharge_i: payload.discharge?.i || 0
            };
            return [...prev, newPoint].sort((a, b) => a.timestamp - b.timestamp).slice(-MAX_CHART_POINTS);
          });

          if (payload.devices) {
            setDevices(prev => prev.map(d => {
              const devData = payload.devices[d.id];
              return devData ? { ...d, voltage: devData.v, current: devData.i, consumption: devData.v * devData.i } : d;
            }));
          }
        }
      } catch (e) { console.error("Data error", e); }
    };

    client.on('message', handleMessage);

    const intervalMqttMonitoring = setInterval(() => {
      if (Date.now() - lastDataTime.current > 5000) {
        setIsMqttConnected(false);
        setDevices(prev => prev.map(d => ({ ...d, voltage: 0, current: 0, consumption: 0 })));
      }
    }, 2000);

    const intervalIngestorMonitoring = setInterval(() => {
      // Check ingestor status
      if(!isMqttConnectedRef.current){
        setIngestorInfo({
          status: "error",
          errorDetails: "Система Офлайн, дані не передаються і нема що зберігати"
        })
        return
      }
      fetch(STATUS_API_URL)
          .then(res => res.json())
          .then(data => setIngestorInfo(data))
          .catch(() => setIngestorInfo({
            status: "error",
            errorDetails: "Не вийшло встановити зв'язок з History-API модулем. Стан бази даних невідомий"
          }));
    }, 10000)

    return () => {
      client.removeListener('message', handleMessage);
      clearInterval(intervalMqttMonitoring);
      clearInterval(intervalIngestorMonitoring);
    };
  }, []);

  const toggleSimulator = () => {
    const now = Date.now();
    if (isSimulatorPending || (now - lastToggleTime.current < 3000)) {
      console.log("Toggle suppressed: pending or cooldown active");
      return;
    }
    
    lastToggleTime.current = now;
    setIsSimulatorPending(true);
    
    const nextState = isSimulatorOn ? 'OFF' : 'ON';
    if (nextState === 'ON') {
      waitingForFirstData.current = true;
    }
    
    globalMqttClient?.publish(SIMULATOR_CONTROL_TOPIC, nextState, { qos: 1 });
  };

    return (
        <Dashboard
            history={history}
            status={status}
            devices={devices}
            isMqttConnected={isMqttConnected}
            ingestorInfo={ingestorInfo}
            isSimulatorOn={isSimulatorOn}
            isSimulatorPending={isSimulatorPending}
            onToggleSimulator={toggleSimulator}
        />
  );
};

export default MonitoringApp;