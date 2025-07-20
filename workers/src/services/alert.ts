import { Env } from '../types';
import { getBeijingTimeISOString } from '../utils/time';

export async function insertAlert(
  env: Env,
  alert: {
    name: string,
    severity: string,
    message: string,
    metric_name?: string,
    metric_value?: number,
    metric_unit?: string,
    context?: any,
    timestamp?: string,
    resolved?: number,
    resolved_at?: string
  }
) {
  await env.DB.prepare(
    `INSERT INTO alerts (name, severity, message, timestamp, metric_name, metric_value, metric_unit, context, resolved, resolved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    alert.name,
    alert.severity,
    alert.message,
    alert.timestamp ?? getBeijingTimeISOString(),
    alert.metric_name ?? null,
    alert.metric_value ?? null,
    alert.metric_unit ?? null,
    alert.context ? JSON.stringify(alert.context) : null,
    alert.resolved ?? 0,
    alert.resolved_at ?? getBeijingTimeISOString()
  ).run();
} 