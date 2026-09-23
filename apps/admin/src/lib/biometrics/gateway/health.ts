import { ComputedDeviceHealth, DeviceHealthState } from './types';

export interface DeviceTelemetryInput {
  status?: string | null;
  last_heartbeat?: string | null;
  last_event_at?: string | null;
  last_authenticated_at?: string | null;
  last_sync?: string | null;
  error_count?: number | null;
  consecutive_error_count?: number | null;
  last_error?: string | null;
  offline_threshold_minutes?: number | null;
}

/**
 * Computes deterministic device health state based on real device status and telemetry timestamps.
 * 
 * Rules:
 * 1. DISABLED: device.status === 'inactive' | 'disabled'
 * 2. ERROR: device.status === 'error' or consecutive_error_count >= 5
 * 3. NEVER_CONNECTED: No telemetry timestamps exist
 * 4. ONLINE: Most recent timestamp within offline_threshold_minutes (default 15 min)
 * 5. OFFLINE: Most recent timestamp exceeds offline_threshold_minutes
 */
export function computeDeviceHealth(
  device: DeviceTelemetryInput,
  now: Date = new Date()
): ComputedDeviceHealth {
  const thresholdMinutes = device.offline_threshold_minutes || 15;
  const thresholdMs = thresholdMinutes * 60 * 1000;
  const errorCount = device.error_count || 0;
  const consecutiveErrorCount = device.consecutive_error_count || 0;
  const lastError = device.last_error || null;

  const timestamps = [
    device.last_heartbeat,
    device.last_event_at,
    device.last_authenticated_at,
    device.last_sync
  ].filter((t): t is string => !!t);

  let state: DeviceHealthState = 'NEVER_CONNECTED';

  if (device.status === 'inactive' || device.status === 'disabled') {
    state = 'DISABLED';
  } else if (device.status === 'error' || consecutiveErrorCount >= 5) {
    state = 'ERROR';
  } else if (timestamps.length === 0) {
    state = 'NEVER_CONNECTED';
  } else {
    // Find the most recent timestamp among all real telemetry signals
    const mostRecentMs = Math.max(...timestamps.map(t => new Date(t).getTime()));
    const timeSinceLastActivity = now.getTime() - mostRecentMs;

    if (timeSinceLastActivity <= thresholdMs) {
      state = 'ONLINE';
    } else {
      state = 'OFFLINE';
    }
  }

  return {
    state,
    lastHeartbeat: device.last_heartbeat || null,
    lastEventAt: device.last_event_at || null,
    lastAuthenticatedAt: device.last_authenticated_at || null,
    lastSync: device.last_sync || null,
    errorCount,
    consecutiveErrorCount,
    lastError,
    offlineThresholdMinutes: thresholdMinutes
  };
}
