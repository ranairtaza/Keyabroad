"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Fingerprint,
  Cpu,
  Users,
  ListOrdered,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  Server,
  Key,
  Shield,
  Clock,
  Radio,
  AlertTriangle,
  Copy,
  Check
} from "lucide-react";
import toast from "react-hot-toast";
import { useRole } from "@/components/RoleContext";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface ComputedDeviceHealth {
  state: "ONLINE" | "OFFLINE" | "NEVER_CONNECTED" | "DISABLED" | "ERROR";
  lastHeartbeat: string | null;
  lastEventAt: string | null;
  lastAuthenticatedAt: string | null;
  lastSync: string | null;
  errorCount: number;
  lastError: string | null;
  offlineThresholdMinutes: number;
}

interface BiometricDevice {
  id: string;
  device_name: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  branch_location: string;
  connection_type: string;
  adapter_type: string;
  status: "active" | "inactive" | "disabled" | "error";
  last_heartbeat?: string | null;
  last_event_at?: string | null;
  last_authenticated_at?: string | null;
  last_sync?: string | null;
  error_count?: number;
  last_error?: string | null;
  offline_threshold_minutes?: number;
  health?: ComputedDeviceHealth;
}

interface DeviceCredentialSummary {
  id: string;
  key_name: string;
  key_prefix: string;
  status: "active" | "revoked" | "expired";
  expires_at: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  last_used_at: string | null;
  created_by: string;
  created_at: string;
}

interface BiometricMapping {
  id: string;
  employee_id: number;
  device_id?: string | null;
  biometric_user_id: string;
  status: "active" | "inactive";
  created_at: string;
  notes?: string;
  team_members?: { name: string; email: string };
  biometric_devices?: { device_name: string; branch_location: string };
}

interface AttendanceEvent {
  id: string;
  device_id: string;
  employee_id?: number | null;
  biometric_user_id: string;
  event_timestamp: string;
  event_type: string;
  verification_method: string;
  external_event_id?: string | null;
  processing_status: "PROCESSED" | "UNMATCHED" | "FAILED" | "IGNORED" | "RECEIVED";
  processing_error?: string | null;
  team_members?: { name: string };
  biometric_devices?: { device_name: string };
}

export default function BiometricsAdminPage() {
  const { role } = useRole();
  const isAdmin = role === "owner" || (role && role.toLowerCase().includes("admin"));

  const [activeTab, setActiveTab] = useState<string>("devices");

  // Data states
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [mappings, setMappings] = useState<BiometricMapping[]>([]);
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals & Selected Device
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<BiometricDevice | null>(null);
  const [deviceCredentials, setDeviceCredentials] = useState<DeviceCredentialSummary[]>([]);
  const [deviceRecentEvents, setDeviceRecentEvents] = useState<AttendanceEvent[]>([]);

  // Key reveal states
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Key rotation dialog
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [rotationGraceHours, setRotationGraceHours] = useState(24);

  // Form states
  const [deviceForm, setDeviceForm] = useState({
    deviceName: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    branchLocation: "Main Office",
    connectionType: "ETHERNET",
    adapterType: "GENERIC_PULL",
    status: "active",
    offlineThresholdMinutes: 15,
  });

  const [mappingForm, setMappingForm] = useState({
    employeeId: "",
    deviceId: "",
    biometricUserId: "",
    status: "active",
    notes: "",
  });

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/biometrics/devices", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setDevices(json.data || []);
      }
    } catch {
      toast.error("Failed to load biometric devices.");
    }
  };

  const fetchMappings = async () => {
    try {
      const res = await fetch("/api/biometrics/mappings", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setMappings(json.data || []);
      }
    } catch {
      toast.error("Failed to load employee mappings.");
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/biometrics/events?limit=100", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setEvents(json.data || []);
      }
    } catch {
      toast.error("Failed to load attendance events.");
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { createClient } = await import("@/lib/auth/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("team_members")
        .select("id, name, email, status")
        .eq("status", "active");
      setTeamMembers(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchDevices(), fetchMappings(), fetchEvents(), fetchTeamMembers()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openDeviceDetails = async (dev: BiometricDevice) => {
    setSelectedDevice(dev);
    setIsDetailsModalOpen(true);
    try {
      const res = await fetch(`/api/biometrics/devices/${dev.id}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setSelectedDevice(json.data);
        setDeviceCredentials(json.data.credentials || []);
        setDeviceRecentEvents(json.data.recentEvents || []);
      }
    } catch {
      toast.error("Failed to fetch device details.");
    }
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/biometrics/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deviceForm),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to register device.");
      } else {
        toast.success(data.message || "Device registered successfully!");
        setGeneratedApiKey(data.apiKey || null);
        fetchDevices();
        if (!data.apiKey) {
          setIsDeviceModalOpen(false);
        }
      }
    } catch {
      toast.error("Network error while registering device.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRotateKey = async () => {
    if (!selectedDevice) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/biometrics/devices/${selectedDevice.id}/rotate-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gracePeriodHours: rotationGraceHours }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to rotate device key.");
      } else {
        toast.success("Key rotated! Copy the new secret token below.");
        setGeneratedApiKey(data.apiKey);
        setIsRotateModalOpen(false);
        openDeviceDetails(selectedDevice);
      }
    } catch {
      toast.error("Network error while rotating key.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeKey = async (credentialId: string) => {
    if (!selectedDevice) return;
    if (!confirm("Are you sure you want to revoke this credential immediately? The device will fail authentication until updated with a new key.")) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/biometrics/devices/${selectedDevice.id}/revoke-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to revoke key.");
      } else {
        toast.success("Credential revoked.");
        openDeviceDetails(selectedDevice);
      }
    } catch {
      toast.error("Network error while revoking key.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDeviceStatus = async (device: BiometricDevice) => {
    const newStatus = device.status === "active" ? "inactive" : "active";
    setSubmitting(true);
    try {
      const res = await fetch(`/api/biometrics/devices/${device.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update device status.");
      } else {
        toast.success(`Device '${device.device_name}' marked as ${newStatus}.`);
        fetchDevices();
      }
    } catch {
      toast.error("Network error while updating device.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        employeeId: parseInt(mappingForm.employeeId, 10),
        biometricUserId: mappingForm.biometricUserId,
        status: mappingForm.status,
        notes: mappingForm.notes,
      };
      if (mappingForm.deviceId && mappingForm.deviceId.trim().length > 0) {
        payload.deviceId = mappingForm.deviceId;
      }

      const res = await fetch("/api/biometrics/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save mapping.");
      } else {
        toast.success(data.message || "Mapping saved successfully!");
        setIsMappingModalOpen(false);
        setMappingForm({
          employeeId: "",
          deviceId: "",
          biometricUserId: "",
          status: "active",
          notes: "",
        });
        fetchMappings();
      }
    } catch {
      toast.error("Network error while saving mapping.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReprocessUnmatched = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/biometrics/events/reprocess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to reprocess events.");
      } else {
        toast.success(data.message || "Reprocessing complete!");
        fetchEvents();
      }
    } catch {
      toast.error("Network error while reprocessing events.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    toast.success("Copied to clipboard!");
  };

  const renderHealthBadge = (health?: ComputedDeviceHealth) => {
    const state = health?.state || "NEVER_CONNECTED";
    switch (state) {
      case "ONLINE":
        return (
          <Badge variant="success" dot size="sm">
            ONLINE
          </Badge>
        );
      case "OFFLINE":
        return (
          <Badge variant="warning" dot size="sm">
            OFFLINE
          </Badge>
        );
      case "ERROR":
        return (
          <Badge variant="danger" dot size="sm">
            ERROR
          </Badge>
        );
      case "DISABLED":
        return (
          <Badge variant="danger" size="sm">
            DISABLED
          </Badge>
        );
      case "NEVER_CONNECTED":
      default:
        return (
          <Badge variant="default" size="sm">
            NEVER CONNECTED
          </Badge>
        );
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center shadow-lg">
        <AlertCircle size={48} className="mx-auto text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h2>
        <p className="text-slate-500 text-sm">
          You do not have administrative privileges to manage biometric hardware and terminal identity mappings.
        </p>
      </div>
    );
  }

  const onlineDevicesCount = devices.filter((d) => d.health?.state === "ONLINE").length;
  const processedEventsCount = events.filter((e) => e.processing_status === "PROCESSED").length;
  const unmatchedEventsCount = events.filter((e) => e.processing_status === "UNMATCHED").length;

  const tabsList = [
    { id: "devices", label: "Devices & Terminals", icon: <Cpu size={16} />, count: devices.length },
    {
      id: "mappings",
      label: "Employee Mappings",
      icon: <Users size={16} />,
      count: mappings.length,
    },
    { id: "events", label: "Event Ledger", icon: <ListOrdered size={16} />, count: events.length },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <PageHeader
        category="Hardware & Ingestion Gateway"
        title="Biometric Gateway & Terminal Registry"
        description="Vendor-neutral biometric hardware registry, tokenized machine authentication, and real-time punch ingestion ledger."
        icon={<Fingerprint size={24} />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={() => {
                loadAll();
                toast.success("Biometrics data refreshed");
              }}
            >
              Refresh
            </Button>
            {activeTab === "devices" && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => {
                  setGeneratedApiKey(null);
                  setDeviceForm({
                    deviceName: "",
                    manufacturer: "",
                    model: "",
                    serialNumber: "",
                    branchLocation: "Main Office",
                    connectionType: "ETHERNET",
                    adapterType: "GENERIC_PULL",
                    status: "active",
                    offlineThresholdMinutes: 15,
                  });
                  setIsDeviceModalOpen(true);
                }}
              >
                Register Terminal
              </Button>
            )}
            {activeTab === "mappings" && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setIsMappingModalOpen(true)}
              >
                Add Mapping
              </Button>
            )}
            {activeTab === "events" && (
              <Button
                variant="secondary"
                size="sm"
                loading={submitting}
                icon={<RefreshCw size={14} />}
                onClick={handleReprocessUnmatched}
              >
                Reprocess Unmatched
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Devices"
          value={devices.length}
          subtitle={`${onlineDevicesCount} online terminals`}
          icon={<Cpu size={20} />}
          variant="primary"
        />
        <StatCard
          title="Staff Mappings"
          value={mappings.length}
          subtitle="Biometric identities"
          icon={<Users size={20} />}
          variant="default"
        />
        <StatCard
          title="Processed Punches"
          value={processedEventsCount}
          subtitle="Successfully matched"
          icon={<CheckCircle2 size={20} />}
          variant="success"
        />
        <StatCard
          title="Unmatched Punches"
          value={unmatchedEventsCount}
          subtitle="Awaiting mapping"
          icon={<AlertCircle size={20} />}
          variant={unmatchedEventsCount > 0 ? "warning" : "default"}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-start">
        <Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* TAB 1: DEVICES */}
      {activeTab === "devices" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Registered Biometric Terminals</CardTitle>
                <CardDescription>
                  Hardware terminals provisioned across branch locations with live telemetry & credential management
                </CardDescription>
              </div>
              <Badge variant="info" size="sm">
                {devices.length} Devices
              </Badge>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="p-4 font-bold">Device Name</th>
                    <th className="p-4 font-bold">Manufacturer & Model</th>
                    <th className="p-4 font-bold">Serial Number</th>
                    <th className="p-4 font-bold">Location</th>
                    <th className="p-4 font-bold">Adapter</th>
                    <th className="p-4 font-bold">Health State</th>
                    <th className="p-4 font-bold">Last Activity</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-500" />
                        Loading devices...
                      </td>
                    </tr>
                  ) : devices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No biometric devices registered yet. Click &quot;Register Terminal&quot; to add one.
                      </td>
                    </tr>
                  ) : (
                    devices.map((dev) => (
                      <tr
                        key={dev.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Server size={16} className="text-sky-500 shrink-0" />
                          <span>{dev.device_name}</span>
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300">
                          {dev.manufacturer} - <span className="text-slate-500">{dev.model}</span>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                          {dev.serial_number}
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300">
                          {dev.branch_location}
                        </td>
                        <td className="p-4">
                          <Badge variant="default" size="sm">
                            {dev.adapter_type}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {renderHealthBadge(dev.health)}
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {dev.last_event_at
                            ? new Date(dev.last_event_at).toLocaleString()
                            : dev.last_authenticated_at
                            ? new Date(dev.last_authenticated_at).toLocaleString()
                            : "Never"}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Shield size={13} />}
                              onClick={() => openDeviceDetails(dev)}
                            >
                              Security & Details
                            </Button>
                            <Button
                              variant={dev.status === "active" ? "danger" : "secondary"}
                              size="sm"
                              icon={<Power size={13} />}
                              disabled={submitting}
                              onClick={() => handleToggleDeviceStatus(dev)}
                            >
                              {dev.status === "active" ? "Deactivate" : "Activate"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* TAB 2: MAPPINGS */}
      {activeTab === "mappings" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Employee Biometric Identity Mappings</CardTitle>
                <CardDescription>
                  Maps terminal enrollment PINs and user IDs to verified employee profiles
                </CardDescription>
              </div>
              <Badge variant="info" size="sm">
                {mappings.length} Active Mappings
              </Badge>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="p-4 font-bold">Employee</th>
                    <th className="p-4 font-bold">Terminal User ID</th>
                    <th className="p-4 font-bold">Device Scope</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold">Created Date</th>
                    <th className="p-4 font-bold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        Loading mappings...
                      </td>
                    </tr>
                  ) : mappings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No employee biometric mappings defined yet.
                      </td>
                    </tr>
                  ) : (
                    mappings.map((m) => (
                      <tr
                        key={m.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {m.team_members?.name || `Employee #${m.employee_id}`}
                          </div>
                          <div className="text-xs text-slate-500">{m.team_members?.email}</div>
                        </td>
                        <td className="p-4">
                          <Badge variant="info" size="sm" className="font-mono font-bold">
                            {m.biometric_user_id}
                          </Badge>
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300">
                          {m.biometric_devices?.device_name ? (
                            <span className="flex items-center gap-1.5 font-medium">
                              <Server size={14} className="text-slate-400" />
                              {m.biometric_devices.device_name} ({m.biometric_devices.branch_location})
                            </span>
                          ) : (
                            <Badge variant="success" size="sm">
                              GLOBAL (All Devices)
                            </Badge>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={m.status === "active" ? "success" : "danger"}
                            dot
                            size="sm"
                          >
                            {m.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {new Date(m.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-xs text-slate-400 italic">{m.notes || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* TAB 3: EVENTS */}
      {activeTab === "events" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Biometric Event Ingestion Ledger</CardTitle>
                <CardDescription>
                  Raw and normalized stream of biometric punches received from terminals
                </CardDescription>
              </div>
              <Badge variant="info" size="sm">
                Live Audit Ledger
              </Badge>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="p-4 font-bold">Timestamp</th>
                    <th className="p-4 font-bold">Device</th>
                    <th className="p-4 font-bold">Biometric ID</th>
                    <th className="p-4 font-bold">Resolved Employee</th>
                    <th className="p-4 font-bold">Event Type</th>
                    <th className="p-4 font-bold">Method</th>
                    <th className="p-4 font-bold">Processing Status</th>
                    <th className="p-4 font-bold">Diagnostics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Loading events...
                      </td>
                    </tr>
                  ) : events.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No biometric events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    events.map((ev) => (
                      <tr
                        key={ev.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-4 text-xs font-mono text-slate-600 dark:text-slate-400">
                          {new Date(ev.event_timestamp).toLocaleString()}
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                          {ev.biometric_devices?.device_name || ev.device_id.substring(0, 8)}
                        </td>
                        <td className="p-4 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {ev.biometric_user_id}
                        </td>
                        <td className="p-4">
                          {ev.team_members?.name ? (
                            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-emerald-500" />
                              {ev.team_members.name}
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 italic text-xs">
                              Unresolved
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={
                              ev.event_type === "CHECK_IN"
                                ? "info"
                                : ev.event_type === "CHECK_OUT"
                                ? "warning"
                                : "default"
                            }
                            size="sm"
                            className="font-mono"
                          >
                            {ev.event_type}
                          </Badge>
                        </td>
                        <td className="p-4 text-xs text-slate-600 dark:text-slate-400 font-mono">
                          {ev.verification_method}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={
                              ev.processing_status === "PROCESSED"
                                ? "success"
                                : ev.processing_status === "UNMATCHED"
                                ? "warning"
                                : ev.processing_status === "FAILED"
                                ? "danger"
                                : "default"
                            }
                            dot
                            size="sm"
                          >
                            {ev.processing_status}
                          </Badge>
                        </td>
                        <td
                          className="p-4 text-xs text-slate-500 max-w-xs truncate"
                          title={ev.processing_error || ""}
                        >
                          {ev.processing_error || "OK"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Modal: Device Details & Security */}
      {selectedDevice && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Terminal Security: ${selectedDevice.device_name}`}
          subtitle={`Hardware S/N: ${selectedDevice.serial_number} • Location: ${selectedDevice.branch_location}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Key Reveal Alert if recently generated */}
            {generatedApiKey && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                  <AlertTriangle size={18} />
                  <span>New Machine Ingestion Key Generated</span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-300">
                  Copy this key now. For zero-trust security, this token is stored exclusively as a cryptographic SHA-256 hash and cannot be recovered later.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedApiKey}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg font-mono text-xs text-slate-900 dark:text-white"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    icon={copiedKey ? <Check size={14} /> : <Copy size={14} />}
                    onClick={() => copyToClipboard(generatedApiKey)}
                  >
                    {copiedKey ? "Copied" : "Copy Key"}
                  </Button>
                </div>
              </div>
            )}

            {/* Health & Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="text-xs text-slate-500">Status</div>
                <div className="mt-1">{renderHealthBadge(selectedDevice.health)}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="text-xs text-slate-500">Last Auth</div>
                <div className="text-xs font-medium text-slate-900 dark:text-white mt-1">
                  {selectedDevice.last_authenticated_at
                    ? new Date(selectedDevice.last_authenticated_at).toLocaleTimeString()
                    : "None"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="text-xs text-slate-500">Last Event</div>
                <div className="text-xs font-medium text-slate-900 dark:text-white mt-1">
                  {selectedDevice.last_event_at
                    ? new Date(selectedDevice.last_event_at).toLocaleTimeString()
                    : "None"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="text-xs text-slate-500">Error Count</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                  {selectedDevice.error_count || 0}
                </div>
              </div>
            </div>

            {/* Device Credentials Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Key size={16} className="text-sky-500" />
                    Machine Credentials
                  </h4>
                  <p className="text-xs text-slate-500">Cryptographic tokens authorized for device-to-cloud push</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RefreshCw size={13} />}
                  onClick={() => setIsRotateModalOpen(true)}
                >
                  Rotate Key
                </Button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Key Prefix</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Last Used</th>
                      <th className="p-3">Created</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {deviceCredentials.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-500">
                          No active credentials found for this device.
                        </td>
                      </tr>
                    ) : (
                      deviceCredentials.map((cred) => (
                        <tr key={cred.id}>
                          <td className="p-3 font-mono text-sky-600 dark:text-sky-400 font-medium">
                            {cred.key_prefix}...
                          </td>
                          <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                            {cred.key_name}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={cred.status === "active" ? "success" : "danger"}
                              dot={cred.status === "active"}
                              size="sm"
                            >
                              {cred.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3 text-slate-500">
                            {cred.last_used_at ? new Date(cred.last_used_at).toLocaleDateString() : "Never"}
                          </td>
                          <td className="p-3 text-slate-500">
                            {new Date(cred.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-right">
                            {cred.status === "active" && (
                              <Button
                                variant="danger"
                                size="sm"
                                disabled={submitting}
                                onClick={() => handleRevokeKey(cred.id)}
                              >
                                Revoke
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent 5 Ingested Events */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Radio size={16} className="text-emerald-500" />
                Recent Terminal Events
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Biometric ID</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {deviceRecentEvents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500">
                          No events received from this terminal yet.
                        </td>
                      </tr>
                    ) : (
                      deviceRecentEvents.slice(0, 5).map((ev) => (
                        <tr key={ev.id}>
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                            {new Date(ev.event_timestamp).toLocaleString()}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {ev.biometric_user_id}
                          </td>
                          <td className="p-3">
                            <Badge variant={ev.event_type === "CHECK_IN" ? "info" : "warning"} size="sm">
                              {ev.event_type}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={ev.processing_status === "PROCESSED" ? "success" : "warning"}
                              dot
                              size="sm"
                            >
                              {ev.processing_status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Rotate Key Confirmation */}
      <Modal
        isOpen={isRotateModalOpen}
        onClose={() => setIsRotateModalOpen(false)}
        title="Rotate Machine Credential"
        subtitle="Generate a new cryptographic key for this device"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400">
            Rotating the credential creates a new secret key. You can allow an optional grace period so the old key remains valid while the physical terminal is reconfigured.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Grace Period (Hours)
            </label>
            <select
              value={rotationGraceHours}
              onChange={(e) => setRotationGraceHours(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none"
            >
              <option value={0}>0 Hours (Immediate Revocation of Old Key)</option>
              <option value={1}>1 Hour Grace Period</option>
              <option value={12}>12 Hours Grace Period</option>
              <option value={24}>24 Hours Grace Period (Recommended)</option>
              <option value={72}>72 Hours Grace Period</option>
            </select>
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsRotateModalOpen(false)}
              className="w-1/2"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={submitting}
              onClick={handleRotateKey}
              className="w-1/2"
            >
              Generate & Rotate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Register Device */}
      <Modal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        title="Register Biometric Terminal"
        subtitle="Provision a physical terminal or cloud gateway device"
        maxWidth="lg"
      >
        {generatedApiKey ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
              <h4 className="font-bold text-emerald-800 dark:text-emerald-300">
                Device Provisioned Successfully
              </h4>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Please copy the machine token below for the hardware adapter or gateway. For zero-trust security, this token is never stored in plaintext and cannot be retrieved again.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Machine API Key Token
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedApiKey}
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                />
                <Button
                  variant="primary"
                  size="sm"
                  icon={copiedKey ? <Check size={14} /> : <Copy size={14} />}
                  onClick={() => copyToClipboard(generatedApiKey)}
                >
                  {copiedKey ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setGeneratedApiKey(null);
                setIsDeviceModalOpen(false);
              }}
              className="w-full"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleRegisterDevice} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Device Name
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Main Office Turnstile Terminal"
                value={deviceForm.deviceName}
                onChange={(e) => setDeviceForm({ ...deviceForm, deviceName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Manufacturer
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Generic / ZKTeco"
                  value={deviceForm.manufacturer}
                  onChange={(e) => setDeviceForm({ ...deviceForm, manufacturer: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Model
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Biometric-Pro-V2"
                  value={deviceForm.model}
                  onChange={(e) => setDeviceForm({ ...deviceForm, model: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Serial Number
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. SN-8893-X9"
                  value={deviceForm.serialNumber}
                  onChange={(e) => setDeviceForm({ ...deviceForm, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Branch Location
                </label>
                <input
                  type="text"
                  value={deviceForm.branchLocation}
                  onChange={(e) => setDeviceForm({ ...deviceForm, branchLocation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Connection Type
                </label>
                <select
                  value={deviceForm.connectionType}
                  onChange={(e) => setDeviceForm({ ...deviceForm, connectionType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none"
                >
                  <option value="ETHERNET">Ethernet (LAN)</option>
                  <option value="WIFI">Wi-Fi</option>
                  <option value="4G">4G / Cellular</option>
                  <option value="CLOUD">Cloud Gateway</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Adapter Type
                </label>
                <select
                  value={deviceForm.adapterType}
                  onChange={(e) => setDeviceForm({ ...deviceForm, adapterType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none"
                >
                  <option value="GENERIC_PULL">Generic Pull Adapter</option>
                  <option value="PUSH_WEBHOOK">Push Webhook</option>
                  <option value="CLOUD_RELAY">Cloud Relay</option>
                  <option value="DIRECT_SOCKET">Direct Socket Service</option>
                </select>
              </div>
            </div>

            <div className="pt-3">
              <Button variant="primary" size="lg" loading={submitting} className="w-full">
                Register Terminal
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Add Employee Mapping */}
      <Modal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        title="Map Employee Biometric ID"
        subtitle="Associate a terminal PIN or enrollment ID with a directory team member"
        maxWidth="md"
      >
        <form onSubmit={handleSaveMapping} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Employee
            </label>
            <select
              required
              value={mappingForm.employeeId}
              onChange={(e) => setMappingForm({ ...mappingForm, employeeId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none"
            >
              <option value="">-- Choose Employee --</option>
              {teamMembers.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name} ({tm.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Terminal Biometric User ID / PIN
            </label>
            <input
              required
              type="text"
              placeholder="e.g. 104 or FP-001"
              value={mappingForm.biometricUserId}
              onChange={(e) => setMappingForm({ ...mappingForm, biometricUserId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-sky-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Device Scope (Optional)
            </label>
            <select
              value={mappingForm.deviceId}
              onChange={(e) => setMappingForm({ ...mappingForm, deviceId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none"
            >
              <option value="">Global (Valid Across All Terminals)</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.device_name} ({d.branch_location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Enrolled on Primary Turnstile"
              value={mappingForm.notes}
              onChange={(e) => setMappingForm({ ...mappingForm, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="pt-3">
            <Button variant="primary" size="lg" loading={submitting} className="w-full">
              Save Biometric Mapping
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
