export type HealthStatus = 'ok' | 'degraded';

export interface HealthCheckData {
  status: HealthStatus;
  service: string;
  database: 'connected' | 'disconnected';
  timestamp: string;
}
