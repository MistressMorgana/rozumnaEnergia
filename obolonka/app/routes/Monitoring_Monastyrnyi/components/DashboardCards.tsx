import type { ConsumerDevice, IngestorStatus} from '../types';

export const StatCard = ({ title, value, unit, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2 transition-all hover:shadow-md">
        <div className={`p-2 w-fit rounded-lg ${color}`}><Icon size={24} className="text-white" /></div>
        <div>
            <p className="text-slate-500 text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">
                {value.toFixed(1)}
                <span className="text-xl text-slate-400"> {unit}</span>
            </h3>
        </div>
    </div>
);

export const ConsumerCard = ({ device }: { device: ConsumerDevice }) => {
    const Icon = device.icon;
    const isOnline = device.consumption > 0.1;
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:border-indigo-100">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-slate-50 ${device.color}`}><Icon size={24} /></div>
                <div>
                    <h3 className="font-bold text-slate-800">{device.name}</h3>
                    <span className={`text-xs font-medium uppercase ${isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>{isOnline ? 'Працює' : 'Вимкнений'}</span></div>
            </div>
            <div className="text-right">
                <p className="text-lg font-bold text-slate-800">{device.consumption.toFixed(1)} Вт</p>
                <p className="text-[10px] text-slate-400">{device.voltage.toFixed(1)} В / {device.current.toFixed(2)} A</p>
            </div>
        </div>
    );
};



export const IngestorCard = ({ data }: {data: IngestorStatus}) => {
    // Стан завантаження (поки fetch не повернув результат)
    if (!data) {
        return (
            <div className="max-w-sm p-5 bg-white border border-gray-200 rounded-xl shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-3 bg-gray-100 rounded w-full"></div>
                    <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                </div>
            </div>
        );
    }

    const isError = data.status === 'error';

    return (
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm transition-all">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Статус бази даних
                </h3>

                <div className="flex items-center gap-2">
                    {/* Пульсуючий індикатор для активного стану */}
                    <span className="relative flex h-3 w-3">
            {!isError && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            )}
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${
                            data.status === 'active' ? 'bg-green-500': data.status === 'waiting' ? 'bg-blue-400' : 'bg-red-500'
                        }`}></span>
          </span>
                    <span className={`text-sm font-bold ${ data.status === 'active' ? 'text-green-600': data.status === 'waiting' ? 'text-blue-600' : 'text-red-600'}`}>
            {
                data.status === 'active' ? 'Йде запис даних':
                    data.status === 'waiting' ? "Очікує запису даних":
                        'Помилка'
            }
          </span>
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <p className="text-xs text-gray-400">Останній запис:</p>
                    <p className="text-sm font-mono text-gray-800">
                        {data.lastRecordTime
                            ? new Date(data.lastRecordTime).toLocaleString('uk-UA')
                            : 'Дані відсутні'}
                    </p>
                </div>

                {data.secondsSinceLastRecord != null && (
                    <div>
                        <p className="text-xs text-gray-400">Час з моменту останнього запису</p>
                        <p className={`text-lg font-bold ${
                            data.secondsSinceLastRecord > 70 ? 'text-orange-500' : 'text-green-600'
                        }`}>
                            {Math.floor(data.secondsSinceLastRecord)} сек.{data.status == "waiting" ? ", переконайтеся, що база даних та Ingestor API функціонують та зачекайте кілька хвилин": ""}
                        </p>
                    </div>
                )}

                {data.message && (
                    <p className="text-xs text-blue-500 italic mt-2">
                        {data.message}
                    </p>
                )}
            </div>

            {/* Візуальна шкала "свіжості" (70 секунд — це 100%) */}
            {(data.status === 'active') && data.secondsSinceLastRecord != null && data.secondsSinceLastRecord < 70 && (
                <div className="mt-4 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-500 transition-all duration-1000"
                        style={{ width: `${Math.max(0, 100 - (data.secondsSinceLastRecord / 70) * 100)}%` }}
                    ></div>
                </div>
            )}

            {
                isError && (
                    <p className="text-red-600"> Помилка:
                        {
                            data.errorDetails ?? "Детальних відомостей про помилку немає"
                        }
                    </p>
                )
            }
        </div>
    );
};
