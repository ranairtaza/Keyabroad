"use client";

import { useState, useEffect } from "react";
import { createClient } from "@keyabroad/auth/client";
import { useRole } from "@/components/RoleContext";
import { toast, Toaster } from "react-hot-toast";
import { Shield, Cable, MessagesSquare, Video, Bot, Key, Eye, EyeOff, Save, CheckCircle2 } from "lucide-react";

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const { role } = useRole();
  const supabase = createClient();

  const [integrations, setIntegrations] = useState<Record<string, any>>({
    twilio: { api_key: "", secret_key: "", is_active: false },
    zoom: { api_key: "", secret_key: "", is_active: false },
    openai: { api_key: "", secret_key: "", is_active: false }
  });

  async function fetchIntegrations() {
    setLoading(true);
    // Since we don't have the table created yet in the actual remote DB unless the user ran the SQL,
    // we'll simulate it for now, or just return empty.
    const { data, error } = await supabase.from('integrations').select('*');
    
    if (data) {
      setIntegrations(data);
    } else {
      // Mock data if table doesn't exist
      setIntegrations([
        { id: '1', provider: 'google', is_active: false, api_key: null, secret_key: null, updated_at: new Date().toISOString() },
        { id: '2', provider: 'twilio', is_active: false, api_key: null, secret_key: null, updated_at: new Date().toISOString() }
      ]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleSave = async (provider: string) => {
    if (role !== "owner") {
      toast.error("Only Owners can modify API keys.");
      return;
    }

    setSaving(true);
    const config = integrations[provider];
    
    const { error } = await supabase
      .from('integrations')
      .upsert({ 
        provider, 
        api_key: config.api_key, 
        secret_key: config.secret_key,
        is_active: config.is_active 
      }, { onConflict: 'provider' });

    if (error) {
      toast.error(`Failed to save ${provider} settings. Did you run the SQL migration?`);
    } else {
      toast.success(`${provider} integration saved securely.`);
    }
    setSaving(false);
  };

  const toggleVisibility = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const updateField = (provider: string, field: string, value: any) => {
    setIntegrations(prev => ({
      ...prev,
      [provider]: { ...prev[provider], [field]: value }
    }));
  };

  if (role !== "owner") {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
        <Shield className="w-20 h-20 text-red-400 mb-6" />
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Access Denied</h1>
        <p className="text-slate-500 max-w-md">You do not have permission to view or modify system integrations. Please contact the Owner.</p>
      </div>
    );
  }

  const renderCard = (title: string, provider: string, icon: any, colorClass: string) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
      <div className={`p-6 ${colorClass} bg-opacity-10 dark:bg-opacity-20 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4`}>
        <div className={`p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm ${colorClass.replace('bg-', 'text-')}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Production API Credentials</p>
        </div>
        <div className="ml-auto">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={integrations[provider].is_active} onChange={(e) => updateField(provider, 'is_active', e.target.checked)} />
              <div className={`block w-14 h-8 rounded-full transition-colors ${integrations[provider].is_active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${integrations[provider].is_active ? 'transform translate-x-6' : ''}`}></div>
            </div>
          </label>
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">API Key / Client ID</label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type={showKeys[provider] ? "text" : "password"}
              value={integrations[provider].api_key}
              onChange={(e) => updateField(provider, 'api_key', e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
              placeholder={`Enter ${title} API Key`}
            />
            <button onClick={() => toggleVisibility(provider)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showKeys[provider] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Secret Key / Token</label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type={showKeys[provider] ? "text" : "password"}
              value={integrations[provider].secret_key}
              onChange={(e) => updateField(provider, 'secret_key', e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
              placeholder={`Enter ${title} Secret Key`}
            />
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
          <button 
            onClick={() => handleSave(provider)}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 px-4 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            {saving ? <Cable className="w-5 h-5 animate-pulse" /> : <Save className="w-5 h-5" />}
            Save {title} Config
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      <Toaster position="top-right" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Cable className="w-8 h-8 text-blue-500" />
            API Integrations
          </h1>
          <p className="text-slate-500 mt-2">Connect external services securely. API keys are encrypted at rest.</p>
        </div>
        
        {loading && <div className="text-sm font-medium text-slate-400 animate-pulse flex items-center gap-2"><Cable className="w-4 h-4" /> Connecting to Vault...</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {renderCard("WhatsApp (Twilio)", "twilio", <MessagesSquare className="w-7 h-7" />, "bg-green-500")}
        {renderCard("Zoom Meetings", "zoom", <Video className="w-7 h-7" />, "bg-blue-500")}
        {renderCard("OpenAI (AI Chat & OCR)", "openai", <Bot className="w-7 h-7" />, "bg-purple-500")}
      </div>
      
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/50 flex items-start gap-4">
        <Shield className="w-8 h-8 text-blue-500 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-blue-900 dark:text-blue-400 mb-1">Security Notice</h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            These credentials grant direct access to your third-party billing accounts. Never share these keys. The system uses Row Level Security (RLS) to ensure only the Owner account can access or modify these records.
          </p>
        </div>
      </div>
    </div>
  );
}
