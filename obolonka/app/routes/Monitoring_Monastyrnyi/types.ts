// --- Interfaces ---
interface HistoryPoint {
    timestamp: number;
    time: string;
    solar: number;
    consumption: number;
    solar_v: number;
    solar_i: number;
    charge_v: number;
    charge_i: number;
    discharge_v: number;
    discharge_i: number;
}

interface SystemStatus {
    solarPower: number;
    chargePower: number;
    dischargePower: number;
    solarV: number;
    solarA: number;
    dischargeV: number;
    dischargeA: number;
    batteryCharge: number;
    batteryTemp: number;
    mpptEfficiency: number;
}

interface ConsumerDevice {
    id: string;
    name: string;
    consumption: number;
    voltage: number;
    current: number;
    icon: any;
    color: string;
}

interface IngestorStatus {
    status: 'active' | 'error' | 'waiting';
    lastRecordTime?: string | null;
    secondsSinceLastRecord?: number | null;
    message?: string; // Для випадку, коли даних немає > 24 год,
    errorDetails?: string;
}


export type {HistoryPoint, ConsumerDevice, SystemStatus, IngestorStatus};