# Phase 5 Hardware Identification

**HARDWARE BLOCKED — NO PHYSICAL DEVICE AVAILABLE**

Since no physical biometric device is currently attached or accessible to the agent environment, we cannot complete the hardware integration or perform live physical testing at this time.

## Software Adapter Contract
When a physical device is procured, the adapter implementation must fulfill the following conceptual contract to integrate with the existing Phase 4 biometric gateway:

```typescript
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface NormalizedBiometricEvent {
  deviceId: string;
  biometricUserId: string;
  timestamp: string; // ISO-8601
  eventType: 'CHECK_IN' | 'CHECK_OUT' | 'UNKNOWN';
  metadata?: Record<string, any>;
}

export interface DeviceHealthResult {
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  lastHeartbeat?: string;
  batteryLevel?: number;
  firmwareVersion?: string;
}

export interface BiometricAdapter {
  validatePayload(input: unknown): ValidationResult;
  normalizeEvent(input: unknown): NormalizedBiometricEvent;
  normalizeBatch?(input: unknown): NormalizedBiometricEvent[];
  healthCheck?(): Promise<DeviceHealthResult>;
}
```

## Hardware Requirements / Purchase Specification
To ensure compatibility with the KeyAbroad biometric gateway, the procured physical biometric device must meet the following technical requirements:

1. **Network Connectivity**: Ethernet or Wi-Fi capable for real-time or batch event transmission.
2. **Communication Protocol**:
   - HTTP/HTTPS Webhook capability (Push mode - preferred), OR
   - REST API (Pull mode).
3. **Data Payload**: Must transmit punch records containing at least:
   - Unique Device Identifier (Serial Number or MAC)
   - Biometric User ID (String or Integer)
   - Event Timestamp
   - Event Type/Punch State (Check-In / Check-Out)
4. **Security**: Support for configuring custom headers (e.g., API keys/Bearer tokens) for webhook authentication to the KeyAbroad gateway.
5. **No Cloud Lock-in**: The device must be capable of sending data directly to the KeyAbroad API without requiring an intermediate vendor cloud subscription (unless the vendor cloud API allows seamless webhook forwarding).

Once a device meeting these specifications is procured, we can resume Phase 5 integration by implementing the specific adapter, registering the physical device, mapping employees, and conducting real hardware acceptance tests.
