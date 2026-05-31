export interface BatteryData {
  id: number;
  name: string;
  voltage: number;
  current: number;
  soh: number;
  status: 'ACTIVE' | 'DEGRADED' | 'FAILED' | 'DISCONNECTED';
  relay_closed: boolean;
  temperature: number;
  max_current: number;
}

export interface LoadData {
  id: number;
  name: string;
  name_uk: string;
  priority: 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL';
  power_watts: number;
  status: 'ACTIVE' | 'SHED';
}

export interface SystemStateData {
  mode: string;
  stability_score: number;
  risk_level: string;
  active_batteries: number;
  total_batteries: number;
  total_load_watts: number;
  active_load_watts: number;
  shed_load_watts: number;
  system_voltage: number;
  system_current: number;
  last_action: string | null;
  actions_log: string[];
}

export interface FuzzyData {
  stability_score: number;
  risk_level: string;
  shed_optional: number;
  shed_important: number;
  recommended_mode: string;
}

export interface Snapshot {
  tick: number;
  timestamp: string;
  scenario: string;
  state: SystemStateData;
  batteries: BatteryData[];
  loads: LoadData[];
  fuzzy: FuzzyData;
}
