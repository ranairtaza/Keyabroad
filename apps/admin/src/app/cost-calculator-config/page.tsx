"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/auth/client";
import { Save, Building, MapPin, Search, Plus, RefreshCw, X } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/lib/ui/components/card";
import { Input } from "@/lib/ui/components/input";
import { Button } from "@/lib/ui/components/button";

type Country = {
  id: string;
  name: string;
  currency_code: string;
  exchange_rate_to_pkr: number;
  average_living_cost_per_year: number;
  visa_fee: number;
  health_insurance_cost: number;
  flight_ticket_cost: number;
  bank_statement_amount: number;
  embassy_fee: number;
  consultant_fee: number;
  miscellaneous_cost: number;
  scholarship_max_amount: number;
};

type University = {
  id: string;
  name: string;
  country_id: string;
  required_documents: string[];
  avg_bachelors_tuition: number;
  avg_masters_tuition: number;
  application_fee: number;
  slug?: string;
  description?: string;
};

export default function CostCalculatorConfigPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingRate, setFetchingRate] = useState(false);
  
  const [newDoc, setNewDoc] = useState("");
  
  // Add University Modal State
  const [isAddUniModalOpen, setIsAddUniModalOpen] = useState(false);
  const [newUniName, setNewUniName] = useState("");

  const supabase = createClient();

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

  useEffect(() => {
    fetchData();
  }, []);

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
      bank_statement_amount: selectedCountry.bank_statement_amount,
      embassy_fee: selectedCountry.embassy_fee,
      consultant_fee: selectedCountry.consultant_fee,
      miscellaneous_cost: selectedCountry.miscellaneous_cost,
      scholarship_max_amount: selectedCountry.scholarship_max_amount,
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

  const handleAddUniversity = async () => {
    if (!selectedCountry) {
      toast.error("Please select a country first.");
      return;
    }
    if (!newUniName.trim()) {
      toast.error("University name cannot be empty.");
      return;
    }

    setSaving(true);
    
    // Create a slug for the new university
    const slug = newUniName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const { data, error } = await supabase.from('universities').insert([{
      name: newUniName,
      country_id: selectedCountry.id,
      slug: slug,
      required_documents: [],
      avg_bachelors_tuition: 0,
      avg_masters_tuition: 0,
      application_fee: 0
    }]).select();

    if (error) {
      toast.error(error.message);
    } else if (data && data.length > 0) {
      toast.success("University added successfully!");
      setUniversities([...universities, data[0]]);
      setSelectedUniversity(data[0]);
      setIsAddUniModalOpen(false);
      setNewUniName("");
    }
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

  const fetchLiveExchangeRate = async () => {
    if (!selectedCountry?.currency_code) {
      toast.error("Please enter a currency code first.");
      return;
    }
    setFetchingRate(true);
    try {
      const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${selectedCountry.currency_code.toUpperCase()}`);
      const data = await res.json();
      const pkrRate = data.rates["PKR"];
      if (pkrRate) {
        setSelectedCountry({ ...selectedCountry, exchange_rate_to_pkr: pkrRate });
        toast.success(`Live rate retrieved: 1 ${selectedCountry.currency_code.toUpperCase()} = ${pkrRate} PKR`);
      } else {
        toast.error("Could not find PKR conversion rate for this currency.");
      }
    } catch (err) {
      toast.error("Failed to fetch live exchange rate.");
    }
    setFetchingRate(false);
  };

  const formatPKR = (amount: number, rate: number = selectedCountry?.exchange_rate_to_pkr || 0) => {
    if (!amount || !rate) return "PKR 0";
    return `≈ PKR ${(amount * rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // Filter universities based on selected country
  const filteredUniversities = selectedCountry 
    ? universities.filter(u => u.country_id === selectedCountry.id)
    : universities;

  if (loading) return <div className="p-8">Loading data...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Cost Calculator Config</h1>
        <p className="text-slate-500">Manage living costs, visa fees, exchange rates, tuitions, and required documents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* COUNTRIES SECTION */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl relative">
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
              onChange={(e) => {
                const country = countries.find(c => c.id === e.target.value) || null;
                setSelectedCountry(country);
                // Reset selected university when country changes
                if (country && selectedUniversity?.country_id !== country.id) {
                  setSelectedUniversity(null);
                }
              }}
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
                <label className="block text-sm font-medium mb-1">Exchange Rate (to PKR)</label>
                <div className="flex gap-2">
                  <Input 
                    type="number"
                    value={selectedCountry.exchange_rate_to_pkr || 0} 
                    onChange={e => setSelectedCountry({...selectedCountry, exchange_rate_to_pkr: Number(e.target.value)})} 
                  />
                  <Button 
                    variant="outline" 
                    onClick={fetchLiveExchangeRate} 
                    disabled={fetchingRate}
                    title="Fetch Live Rate"
                    className="flex-shrink-0"
                  >
                    <RefreshCw size={16} className={fetchingRate ? "animate-spin" : ""} />
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Used to convert local currency costs into PKR.</p>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium">Average Living Cost / Year (in {selectedCountry.currency_code || 'local currency'})</label>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatPKR(selectedCountry.average_living_cost_per_year)}</span>
                </div>
                <Input 
                  type="number"
                  value={selectedCountry.average_living_cost_per_year || 0} 
                  onChange={e => setSelectedCountry({...selectedCountry, average_living_cost_per_year: Number(e.target.value)})} 
                />
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium">Visa Fee (in {selectedCountry.currency_code || 'local currency'})</label>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatPKR(selectedCountry.visa_fee)}</span>
                </div>
                <Input 
                  type="number"
                  value={selectedCountry.visa_fee || 0} 
                  onChange={e => setSelectedCountry({...selectedCountry, visa_fee: Number(e.target.value)})} 
                />
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium">Health Insurance Cost / Year</label>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatPKR(selectedCountry.health_insurance_cost)}</span>
                </div>
                <Input 
                  type="number"
                  value={selectedCountry.health_insurance_cost || 0} 
                  onChange={e => setSelectedCountry({...selectedCountry, health_insurance_cost: Number(e.target.value)})} 
                />
              </div>
              
               <div>
                 <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium">Flight Ticket Cost</label>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatPKR(selectedCountry.flight_ticket_cost)}</span>
                 </div>
                 <Input 
                   type="number"
                   value={selectedCountry.flight_ticket_cost || 0} 
                   onChange={e => setSelectedCountry({...selectedCountry, flight_ticket_cost: Number(e.target.value)})} 
                 />
               </div>
               
               <div>
                 <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium">Bank Statement Amount</label>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatPKR(selectedCountry.bank_statement_amount)}</span>
                 </div>
                 <Input 
                   type="number"
                   value={selectedCountry.bank_statement_amount || 0} 
                   onChange={e => setSelectedCountry({...selectedCountry, bank_statement_amount: Number(e.target.value)})} 
                 />
               </div>
               
               <div>
                 <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium">Embassy Fee</label>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatPKR(selectedCountry.embassy_fee)}</span>
                 </div>
                 <Input 
                   type="number"
                   value={selectedCountry.embassy_fee || 0} 
                   onChange={e => setSelectedCountry({...selectedCountry, embassy_fee: Number(e.target.value)})} 
                 />
               </div>
               
               <div>
                 <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium">Consultant / Agent Fee</label>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatPKR(selectedCountry.consultant_fee)}</span>
                 </div>
                 <Input 
                   type="number"
                   value={selectedCountry.consultant_fee || 0} 
                   onChange={e => setSelectedCountry({...selectedCountry, consultant_fee: Number(e.target.value)})} 
                 />
               </div>
               
               <div>
                 <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium">Miscellaneous Cost</label>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatPKR(selectedCountry.miscellaneous_cost)}</span>
                 </div>
                 <Input 
                   type="number"
                   value={selectedCountry.miscellaneous_cost || 0} 
                   onChange={e => setSelectedCountry({...selectedCountry, miscellaneous_cost: Number(e.target.value)})} 
                 />
               </div>
               
               <div>
                 <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium">Scholarship Max Amount</label>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatPKR(selectedCountry.scholarship_max_amount)}</span>
                 </div>
                 <Input 
                   type="number"
                   value={selectedCountry.scholarship_max_amount || 0} 
                   onChange={e => setSelectedCountry({...selectedCountry, scholarship_max_amount: Number(e.target.value)})} 
                 />
               </div>
              
              <Button onClick={saveCountry} disabled={saving} className="w-full mt-4 flex items-center gap-2">
                <Save size={16} /> Save Country Settings
              </Button>
            </div>
          )}
        </Card>

        {/* UNIVERSITIES SECTION */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Building size={20} />
            </div>
            <h2 className="text-xl font-bold">University Settings</h2>
          </div>
          
          <div className="mb-6 flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Select University to Edit</label>
              <select 
                className="w-full p-2 border rounded-lg bg-slate-50"
                value={selectedUniversity?.id || ""}
                onChange={(e) => setSelectedUniversity(universities.find(u => u.id === e.target.value) || null)}
                disabled={!selectedCountry}
              >
                <option value="">
                  {selectedCountry ? "-- Choose University --" : "-- Select a Country First --"}
                </option>
                {filteredUniversities.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => setIsAddUniModalOpen(true)} 
                disabled={!selectedCountry}
                className="h-[42px] px-3"
                title="Add New University"
              >
                <Plus size={20} />
              </Button>
            </div>
          </div>

          {!selectedCountry && (
            <div className="text-center py-10 text-slate-400">
              <MapPin size={40} className="mx-auto mb-3 opacity-20" />
              <p>Please select a country in the left panel first to view its universities.</p>
            </div>
          )}

          {selectedCountry && !selectedUniversity && filteredUniversities.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <Building size={40} className="mx-auto mb-3 opacity-20" />
              <p>No universities found for this country.</p>
              <Button onClick={() => setIsAddUniModalOpen(true)} variant="outline" className="mt-4">
                <Plus size={16} className="mr-2" /> Add University
              </Button>
            </div>
          )}

          {selectedCountry && selectedUniversity && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800">Average Tuitions (per year)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-xs font-medium">Bachelors Tuition</label>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{formatPKR(selectedUniversity.avg_bachelors_tuition)}</span>
                    </div>
                    <Input 
                      type="number"
                      value={selectedUniversity.avg_bachelors_tuition || 0} 
                      onChange={e => setSelectedUniversity({...selectedUniversity, avg_bachelors_tuition: Number(e.target.value)})} 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-xs font-medium">Masters Tuition</label>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{formatPKR(selectedUniversity.avg_masters_tuition)}</span>
                    </div>
                    <Input 
                      type="number"
                      value={selectedUniversity.avg_masters_tuition || 0} 
                      onChange={e => setSelectedUniversity({...selectedUniversity, avg_masters_tuition: Number(e.target.value)})} 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-xs font-medium">Application Fee</label>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{formatPKR(selectedUniversity.application_fee)}</span>
                    </div>
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

      {/* Add University Modal */}
      {isAddUniModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Add New University</h3>
              <button onClick={() => setIsAddUniModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <div className="p-2 border rounded-lg bg-slate-50 text-slate-600 font-medium">
                  {selectedCountry?.name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">University Name</label>
                <Input 
                  value={newUniName} 
                  onChange={e => setNewUniName(e.target.value)} 
                  placeholder="e.g. University of Toronto"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsAddUniModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddUniversity} disabled={saving}>
                {saving ? "Saving..." : "Add University"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
