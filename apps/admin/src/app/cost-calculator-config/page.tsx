"use client";

import { useState, useEffect } from "react";
import { createClient } from "@keyabroad/auth/client";
import { Save, Building, MapPin, Search } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@keyabroad/ui/components/card";
import { Input } from "@keyabroad/ui/components/input";
import { Button } from "@keyabroad/ui/components/button";

type Country = {
  id: string;
  name: string;
  currency_code: string;
  exchange_rate_to_pkr: number;
  average_living_cost_per_year: number;
  visa_fee: number;
  health_insurance_cost: number;
  flight_ticket_cost: number;
};

type University = {
  id: string;
  name: string;
  country_id: string;
  required_documents: string[];
  avg_bachelors_tuition: number;
  avg_masters_tuition: number;
  application_fee: number;
};

export default function CostCalculatorConfigPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newDoc, setNewDoc] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch countries
    const { data: cData } = await supabase.from('countries').select('*').order('name');
    if (cData) setCountries(cData);
    
    // Fetch universities
    const { data: uData } = await supabase.from('universities').select('*').order('name');
    if (uData) setUniversities(uData);

    setLoading(false);
  };

  const saveCountry = async () => {
    if (!selectedCountry) return;
    setSaving(true);
    const { error } = await supabase.from('countries').update({
      currency_code: selectedCountry.currency_code,
      exchange_rate_to_pkr: selectedCountry.exchange_rate_to_pkr,
      average_living_cost_per_year: selectedCountry.average_living_cost_per_year,
      visa_fee: selectedCountry.visa_fee,
      health_insurance_cost: selectedCountry.health_insurance_cost,
      flight_ticket_cost: selectedCountry.flight_ticket_cost,
    }).eq('id', selectedCountry.id);
    
    if (error) toast.error(error.message);
    else toast.success("Country cost settings saved!");
    setSaving(false);
  };

  const saveUniversity = async () => {
    if (!selectedUniversity) return;
    setSaving(true);
    const { error } = await supabase.from('universities').update({
      avg_bachelors_tuition: selectedUniversity.avg_bachelors_tuition,
      avg_masters_tuition: selectedUniversity.avg_masters_tuition,
      application_fee: selectedUniversity.application_fee,
      required_documents: selectedUniversity.required_documents || []
    }).eq('id', selectedUniversity.id);
    
    if (error) toast.error(error.message);
    else toast.success("University cost & document settings saved!");
    setSaving(false);
  };

  const addDocument = () => {
    if (!selectedUniversity || !newDoc) return;
    setSelectedUniversity({
      ...selectedUniversity,
      required_documents: [...(selectedUniversity.required_documents || []), newDoc]
    });
    setNewDoc("");
  };

  const removeDocument = (index: number) => {
    if (!selectedUniversity) return;
    const docs = [...(selectedUniversity.required_documents || [])];
    docs.splice(index, 1);
    setSelectedUniversity({ ...selectedUniversity, required_documents: docs });
  };

  if (loading) return <div className="p-8">Loading data...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Cost Calculator Config</h1>
        <p className="text-slate-500">Manage living costs, visa fees, exchange rates, tuitions, and required documents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* COUNTRIES SECTION */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <h2 className="text-xl font-bold">Destination Settings</h2>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Country to Edit</label>
            <select 
              className="w-full p-2 border rounded-lg bg-slate-50"
              value={selectedCountry?.id || ""}
              onChange={(e) => setSelectedCountry(countries.find(c => c.id === e.target.value) || null)}
            >
              <option value="">-- Choose Country --</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {selectedCountry && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Currency Code (e.g., GBP, USD)</label>
                <Input 
                  value={selectedCountry.currency_code || ''} 
                  onChange={e => setSelectedCountry({...selectedCountry, currency_code: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Manual Exchange Rate (to PKR)</label>
                <p className="text-xs text-slate-400 mb-2">Used as a fallback if the live exchange API fails.</p>
                <Input 
                  type="number"
                  value={selectedCountry.exchange_rate_to_pkr || 0} 
                  onChange={e => setSelectedCountry({...selectedCountry, exchange_rate_to_pkr: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Average Living Cost / Year (in local currency)</label>
                <Input 
                  type="number"
                  value={selectedCountry.average_living_cost_per_year || 0} 
                  onChange={e => setSelectedCountry({...selectedCountry, average_living_cost_per_year: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Visa Fee (in local currency)</label>
                <Input 
                  type="number"
                  value={selectedCountry.visa_fee || 0} 
                  onChange={e => setSelectedCountry({...selectedCountry, visa_fee: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Health Insurance Cost / Year (in local currency)</label>
                <Input 
                  type="number"
                  value={selectedCountry.health_insurance_cost || 0} 
                  onChange={e => setSelectedCountry({...selectedCountry, health_insurance_cost: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Flight Ticket Cost (in local currency)</label>
                <Input 
                  type="number"
                  value={selectedCountry.flight_ticket_cost || 0} 
                  onChange={e => setSelectedCountry({...selectedCountry, flight_ticket_cost: Number(e.target.value)})} 
                />
              </div>
              
              <Button onClick={saveCountry} disabled={saving} className="w-full mt-4 flex items-center gap-2">
                <Save size={16} /> Save Country Settings
              </Button>
            </div>
          )}
        </Card>

        {/* UNIVERSITIES SECTION */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Building size={20} />
            </div>
            <h2 className="text-xl font-bold">University Settings</h2>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select University to Edit</label>
            <select 
              className="w-full p-2 border rounded-lg bg-slate-50"
              value={selectedUniversity?.id || ""}
              onChange={(e) => setSelectedUniversity(universities.find(u => u.id === e.target.value) || null)}
            >
              <option value="">-- Choose University --</option>
              {universities.map(u => <option key={u.id} value={u.id}>{u.name} ({(countries.find(c => c.id === u.country_id)?.name || 'Unknown')})</option>)}
            </select>
          </div>

          {selectedUniversity && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800">Average Tuitions (per year)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Bachelors Tuition</label>
                    <Input 
                      type="number"
                      value={selectedUniversity.avg_bachelors_tuition || 0} 
                      onChange={e => setSelectedUniversity({...selectedUniversity, avg_bachelors_tuition: Number(e.target.value)})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Masters Tuition</label>
                    <Input 
                      type="number"
                      value={selectedUniversity.avg_masters_tuition || 0} 
                      onChange={e => setSelectedUniversity({...selectedUniversity, avg_masters_tuition: Number(e.target.value)})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Application Fee</label>
                    <Input 
                      type="number"
                      value={selectedUniversity.application_fee || 0} 
                      onChange={e => setSelectedUniversity({...selectedUniversity, application_fee: Number(e.target.value)})} 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800">Required Documents</h3>
                <div className="flex gap-2">
                  <Input 
                    value={newDoc} 
                    onChange={e => setNewDoc(e.target.value)} 
                    placeholder="e.g. Passport Copy" 
                    onKeyDown={e => e.key === 'Enter' && addDocument()}
                  />
                  <Button type="button" onClick={addDocument} variant="outline">Add</Button>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border flex flex-wrap gap-2">
                  {(!selectedUniversity.required_documents || selectedUniversity.required_documents.length === 0) && (
                    <span className="text-sm text-slate-400">No documents added yet.</span>
                  )}
                  {selectedUniversity.required_documents?.map((doc, idx) => (
                    <div key={idx} className="bg-white border text-sm px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
                      {doc}
                      <button onClick={() => removeDocument(idx)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={saveUniversity} disabled={saving} className="w-full mt-4 flex items-center gap-2">
                <Save size={16} /> Save University Settings
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
