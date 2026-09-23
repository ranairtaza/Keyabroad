import { NormalizedBiometricEvent } from '../types';
import { BiometricAdapter, ValidationResult } from './types';

const FORBIDDEN_TEMPLATE_KEYS = [
  'fingerprint_template',
  'fingerprint_data',
  'face_template',
  'face_embedding',
  'biometric_template',
  'template_data',
  'template_base64',
  'bio_data',
  'facial_feature_vector',
  'minutiae',
  'iris_data',
  'palm_template',
  'raw_image',
  'face_image',
  'fingerprint_image',
  'biometric_blob',
  'embedding',
  'raw_minutiae',
  'raw_fingerprint',
  'raw_face',
];

const VALID_EVENT_TYPES = new Set(['CHECK_IN', 'CHECK_OUT', 'BREAK_IN', 'BREAK_OUT', 'UNKNOWN']);
const VALID_VERIFICATION_METHODS = new Set([
  'FINGERPRINT',
  'FACE',
  'RFID',
  'PIN',
  'PASSWORD',
  'MANUAL',
  'OTHER',
]);

const MAX_PAYLOAD_BYTES = 64 * 1024; // 64 KB
const MAX_METADATA_BYTES = 8 * 1024; // 8 KB

export class GenericBiometricAdapter implements BiometricAdapter {
  public name = 'GenericBiometricAdapter';

  /**
   * Scans an object recursively to ensure no biometric template or raw biometric data exists.
   */
  public static scanForProhibitedBiometricData(obj: any, path: string = ''): string | null {
    if (!obj || typeof obj !== 'object') return null;

    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      const currentPath = path ? `${path}.${key}` : key;

      for (const forbidden of FORBIDDEN_TEMPLATE_KEYS) {
        if (lowerKey.includes(forbidden)) {
          return `TEMPLATE REJECTION: Prohibited biometric template/image key detected at '${currentPath}'. Storing biometric templates is strictly forbidden.`;
        }
      }

      const val = obj[key];
      if (typeof val === 'string') {
        // Reject suspiciously large base64 template blobs in metadata (> 4KB string)
        if (val.length > 4096 && !val.includes(' ') && (lowerKey.includes('data') || lowerKey.includes('template') || lowerKey.includes('raw'))) {
          return `TEMPLATE REJECTION: Prohibited raw binary/base64 template payload detected in field '${currentPath}'.`;
        }
      } else if (typeof val === 'object') {
        const nestedError = this.scanForProhibitedBiometricData(val, currentPath);
        if (nestedError) return nestedError;
      }
    }

    return null;
  }

  /**
   * Static validator for convenient gateway use.
   */
  public static validate(rawPayload: unknown): ValidationResult {
    const errors: string[] = [];

    if (!rawPayload) {
      return { valid: false, errors: ['Payload cannot be empty.'] };
    }

    // 1. Total payload size check (< 64KB)
    const payloadJson = JSON.stringify(rawPayload);
    const payloadBytes = Buffer.byteLength(payloadJson, 'utf8');
    if (payloadBytes > MAX_PAYLOAD_BYTES) {
      return {
        valid: false,
        errors: [`Payload size (${payloadBytes} bytes) exceeds 64KB maximum limit of ${MAX_PAYLOAD_BYTES} bytes.`],
      };
    }

    // 2. Scan for forbidden biometric template data
    const templateError = GenericBiometricAdapter.scanForProhibitedBiometricData(rawPayload);
    if (templateError) {
      return { valid: false, errors: [templateError] };
    }

    // 3. Normalize to array for inspection
    const rawList = Array.isArray(rawPayload) ? rawPayload : [rawPayload];
    if (rawList.length === 0) {
      return { valid: false, errors: ['Payload event list is empty.'] };
    }

    if (rawList.length > 500) {
      return { valid: false, errors: ['Batch size exceeds maximum limit of 500 events per ingestion request.'] };
    }

    const sanitizedEvents: NormalizedBiometricEvent[] = [];

    for (let i = 0; i < rawList.length; i++) {
      const item = rawList[i];
      if (!item || typeof item !== 'object') {
        errors.push(`Item at index ${i} is not a valid object.`);
        continue;
      }

      // Check biometricUserId
      const biometricUserId = String(item.biometricUserId || item.biometric_user_id || item.userId || item.pin || '').trim();
      if (!biometricUserId) {
        errors.push(`Item at index ${i}: missing mandatory 'biometricUserId' parameter.`);
      }

      // Check eventTimestamp
      const rawTimestamp = item.eventTimestamp || item.event_timestamp || item.timestamp || item.time;
      let parsedDate: Date | null = null;
      if (rawTimestamp) {
        if (typeof rawTimestamp === 'number') {
          parsedDate = new Date(rawTimestamp > 1e11 ? rawTimestamp : rawTimestamp * 1000);
        } else if (typeof rawTimestamp === 'string') {
          parsedDate = new Date(rawTimestamp);
        }
      }

      if (!parsedDate || isNaN(parsedDate.getTime())) {
        errors.push(`Item at index ${i}: invalid event timestamp format.`);
      } else {
        const nowMs = Date.now();
        const futureLimit = nowMs + 24 * 60 * 60 * 1000;
        const pastLimit = nowMs - 365 * 24 * 60 * 60 * 1000;

        if (parsedDate.getTime() > futureLimit) {
          errors.push(`Item at index ${i}: event timestamp cannot be in the future (> 24 hours).`);
        } else if (parsedDate.getTime() < pastLimit) {
          errors.push(`Item at index ${i}: event timestamp cannot be older than 365 days.`);
        }
      }

      // Check eventType with common alias mappings
      let rawType = String(item.eventType || item.event_type || item.type || 'CHECK_IN').toUpperCase().trim();
      if (rawType === '0' || rawType === 'IN' || rawType === 'CHECKIN') rawType = 'CHECK_IN';
      if (rawType === '1' || rawType === 'OUT' || rawType === 'CHECKOUT') rawType = 'CHECK_OUT';
      if (rawType === '4' || rawType === 'BREAK_IN') rawType = 'BREAK_IN';
      if (rawType === '5' || rawType === 'BREAK_OUT') rawType = 'BREAK_OUT';

      const eventType = (VALID_EVENT_TYPES.has(rawType) ? rawType : 'UNKNOWN') as NormalizedBiometricEvent['eventType'];

      // Check verificationMethod with common alias mappings
      let rawMethod = String(item.verificationMethod || item.verification_method || item.verify_type || 'FINGERPRINT').toUpperCase().trim();
      if (rawMethod === 'FP' || rawMethod === '1') rawMethod = 'FINGERPRINT';
      if (rawMethod === 'FACE' || rawMethod === '15') rawMethod = 'FACE';
      if (rawMethod === 'CARD' || rawMethod === 'RFID' || rawMethod === '2') rawMethod = 'RFID';
      if (rawMethod === 'PIN' || rawMethod === 'PWD' || rawMethod === 'PASSWORD' || rawMethod === '3') rawMethod = 'PIN';

      const verificationMethod = (VALID_VERIFICATION_METHODS.has(rawMethod) ? rawMethod : 'OTHER') as NormalizedBiometricEvent['verificationMethod'];

      // Check rawMetadata size (< 8KB)
      const rawMetadata = item.rawMetadata || item.raw_metadata || item.metadata || {};
      const metadataBytes = Buffer.byteLength(JSON.stringify(rawMetadata), 'utf8');
      if (metadataBytes > MAX_METADATA_BYTES) {
        errors.push(`Item at index ${i}: raw_metadata size (${metadataBytes} bytes) exceeds limit of ${MAX_METADATA_BYTES} bytes.`);
      }

      if (errors.length === 0) {
        sanitizedEvents.push({
          deviceId: String(item.deviceId || item.device_id || ''),
          biometricUserId,
          eventTimestamp: parsedDate ? parsedDate.toISOString() : new Date().toISOString(),
          eventType,
          verificationMethod,
          externalEventId: item.externalEventId || item.external_event_id ? String(item.externalEventId || item.external_event_id) : undefined,
          rawMetadata: typeof rawMetadata === 'object' ? rawMetadata : {},
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedEvents: errors.length === 0 ? sanitizedEvents : undefined,
    };
  }

  /**
   * Static normalizer for convenient gateway use.
   */
  public static normalize(rawPayload: unknown, authenticatedDeviceId: string): NormalizedBiometricEvent[] {
    const validation = GenericBiometricAdapter.validate(rawPayload);
    if (!validation.valid || !validation.sanitizedEvents) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return validation.sanitizedEvents.map(ev => ({
      ...ev,
      deviceId: authenticatedDeviceId,
    }));
  }

  /**
   * Instance validate method satisfying BiometricAdapter interface.
   */
  public validate(rawPayload: unknown): ValidationResult {
    return GenericBiometricAdapter.validate(rawPayload);
  }

  /**
   * Instance normalize method satisfying BiometricAdapter interface.
   */
  public normalize(rawPayload: unknown, authenticatedDeviceId: string): NormalizedBiometricEvent[] {
    return GenericBiometricAdapter.normalize(rawPayload, authenticatedDeviceId);
  }
}
