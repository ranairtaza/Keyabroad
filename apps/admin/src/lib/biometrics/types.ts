export type BiometricEventType = 'CHECK_IN' | 'CHECK_OUT' | 'BREAK_IN' | 'BREAK_OUT' | 'UNKNOWN';

export type BiometricVerificationMethod = 
  | 'FINGERPRINT' 
  | 'FACE' 
  | 'RFID' 
  | 'PIN' 
  | 'PASSWORD' 
  | 'MANUAL' 
  | 'OTHER';

export type EventProcessingStatus = 
  | 'RECEIVED' 
  | 'PROCESSED' 
  | 'UNMATCHED' 
  | 'FAILED' 
  | 'IGNORED';

export type DeviceStatus = 'active' | 'inactive' | 'maintenance';

export interface BiometricDevice {
  id: string;
  device_name: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  branch_location: string;
  connection_type: string;
  adapter_type: string;
  status: DeviceStatus;
  api_key_hash?: string | null;
  last_heartbeat?: string | null;
  last_sync?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EmployeeBiometricMapping {
  id: string;
  employee_id: number;
  device_id?: string | null;
  biometric_user_id: string;
  status: 'active' | 'inactive';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  employee_name?: string;
  employee_email?: string;
}

export interface NormalizedBiometricEvent {
  deviceId: string;
  biometricUserId: string;
  eventTimestamp: string; // ISO 8601 string
  eventType: BiometricEventType;
  verificationMethod: BiometricVerificationMethod;
  externalEventId?: string | null;
  rawMetadata?: Record<string, any>;
}

export interface IdentityResolutionResult {
  status: 'MATCHED' | 'UNMATCHED' | 'INACTIVE' | 'INVALID_DEVICE';
  employeeId?: number;
  employeeName?: string;
  mappingId?: string;
  error?: string;
}

export interface IngestionResult {
  eventId: string;
  status: EventProcessingStatus;
  idempotencyHash: string;
  isDuplicate: boolean;
  resolvedEmployeeId?: number | null;
  resolvedEmployeeName?: string | null;
  error?: string | null;
  actionTaken?: 'CHECK_IN_RECORDED' | 'CHECK_OUT_RECORDED' | 'DUPLICATE_IGNORED' | 'UNMATCHED_LOGGED' | 'INACTIVE_IGNORED' | 'ERROR_LOGGED';
}

export interface BatchIngestionSummary {
  totalReceived: number;
  processed: number;
  duplicates: number;
  unmatched: number;
  failed: number;
  ignored: number;
  results: IngestionResult[];
}
