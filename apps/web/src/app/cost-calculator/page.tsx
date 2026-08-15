"use client";

import { useState, useEffect } from "react";
import { Calculator, Landmark, Plane, GraduationCap, ArrowRight, Plus, X, Building, FileCheck } from "lucide-react";
import { Button } from "@keyabroad/ui/components/button";
import { Card } from "@keyabroad/ui/components/card";
import { Input } from "@keyabroad/ui/components/input";
import { createClient } from "@keyabroad/auth/client";
import toast from "react-hot-toast";

type Country = {
  id: string;
  name: string;
  currency_code: string;
  exchange_rate_to_pkr: number;
  average_living_cost_per_year: number;
  visa_fee: number;
};

type University = {
  id: string;
  name: string;
  country_id: string;
  avg_bachelors_tuition: number;
  avg_masters_tuition: number;
  required_documents: string[];
};

export default function CostCalculatorPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>("");
  const [degree, setDegree] = useState<"bachelors" | "masters">("masters");
  const [scholarship, setScholarship] = useState(0);
  
  // Custom Expenses
  const [customExpenses, setCustomExpenses] = useState<{name: string, amount: number}[]>([]);
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");

  // Live Exchange Rate
  const [liveExchangeRate, setLiveExchangeRate] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: cData } = await supabase.from('countries').select('*').order('name');
    if (cData) {
      setCountries(cData);
      if (cData.length > 0) setSelectedCountryId(cData[0].id);
    }
    const { data: uData } = await supabase.from('universities').select('*').order('name');
    if (uData) setUniversities(uData);
    setLoading(false);
  };

  const selectedCountry = countries.find(c => c.id === selectedCountryId);
  const availableUniversities = universities.filter(u => u.country_id === selectedCountryId);
  const selectedUniversity = availableUniversities.find(u => u.id === selectedUniversityId) || availableUniversities[0];

  // Fetch Live Exchange Rate when Country Changes
  useEffect(() => {
    if (selectedCountry?.currency_code) {
      fetch(`https://api.exchangerate-api.com/v4/latest/${selectedCountry.currency_code}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.rates && data.rates.PKR) {
            setLiveExchangeRate(data.rates.PKR);
          } else {
            setLiveExchangeRate(null);
          }
        })
        .catch(() => setLiveExchangeRate(null));
    }
  }, [selectedCountryId, selectedCountry?.currency_code]);

  // Set default university when country changes
  useEffect(() => {
    if (availableUniversities.length > 0 && (!selectedUniversityId || !availableUniversities.find(u => u.id === selectedUniversityId))) {
      setSelectedUniversityId(availableUniversities[0].id);
    }
  }, [selectedCountryId, availableUniversities]);

  const addCustomExpense = () => {
    if (newExpenseName && newExpenseAmount && Number(newExpenseAmount) > 0) {
      setCustomExpenses([...customExpenses, { name: newExpenseName, amount: Number(newExpenseAmount) }]);
      setNewExpenseName("");
      setNewExpenseAmount("");
    }
  };

  const removeCustomExpense = (index: number) => {
    setCustomExpenses(customExpenses.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading Cost Calculator...</div>;
  }

  if (!selectedCountry) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">No destinations configured.</div>;
  }

  // Calculate Base Costs
  const currency = selectedCountry.currency_code || "$";
  const exchangeRate = liveExchangeRate || selectedCountry.exchange_rate_to_pkr || 278;
  
  const avgTuition = selectedUniversity 
    ? (degree === "masters" ? selectedUniversity.avg_masters_tuition : selectedUniversity.avg_bachelors_tuition) 
    : 15000;
    
  const discountedTuition = Math.max(0, avgTuition - scholarship);
  
  const totalCustom = customExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const livingCost = selectedCountry.average_living_cost_per_year || 0;
  const visaFee = selectedCountry.visa_fee || 0;
  
  const totalForeign = discountedTuition + livingCost + visaFee + totalCustom;
  const totalPKR = totalForeign * exchangeRate;

  const formatPKR = (val: number) => new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(val);
  const formatForeign = (val: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Calculator size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 font-heading">Study Abroad Cost Calculator</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Get a precise estimate of your study abroad expenses tailored to your dream university and degree.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-8">
            <Card className="p-6 md:p-8 bg-white border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl">
              
              {/* Destination */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">1. Select Destination</label>
                <div className="grid grid-cols-2 gap-3">
                  {countries.map((c) => (
                    <button 
                      key={c.id}
                      onClick={() => setSelectedCountryId(c.id)}
                      className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                        selectedCountryId === c.id 
                        ? 'bg-primary border-primary text-white shadow-md' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-primary/30 hover:bg-blue-50'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* University */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">2. Target University</label>
                {availableUniversities.length === 0 ? (
                  <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">No universities found for {selectedCountry.name}.</p>
                ) : (
                  <select 
                    value={selectedUniversityId}
                    onChange={(e) => setSelectedUniversityId(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {availableUniversities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                )}
              </div>

              {/* Degree Level */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">3. Degree Level</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setDegree("bachelors")}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                      degree === "bachelors" ? 'bg-primary border-primary text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Bachelors
                  </button>
                  <button 
                    onClick={() => setDegree("masters")}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                      degree === "masters" ? 'bg-primary border-primary text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Masters
                  </button>
                </div>
              </div>

              {/* Scholarship */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider flex justify-between">
                  <span>4. Expected Scholarship</span>
                  <span className="text-primary">{currency} {formatForeign(scholarship)}</span>
                </label>
                <p className="text-xs text-slate-400 mb-4">Move the slider to estimate cost with a scholarship.</p>
                <input 
                  type="range" 
                  min="0" 
                  max={avgTuition} 
                  step="500" 
                  value={scholarship}
                  onChange={(e) => setScholarship(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Custom Expenses */}
              <div className="pt-6 border-t border-slate-200 mt-8">
                <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">5. Add Custom Expenses</label>
                <p className="text-xs text-slate-400 mb-4">Add flights, health insurance, or miscellaneous fees ({currency}).</p>
                <div className="flex gap-2 mb-4">
                  <Input 
                    placeholder="e.g. Flight Ticket" 
                    value={newExpenseName} 
                    onChange={e => setNewExpenseName(e.target.value)}
                    className="flex-1"
                  />
                  <Input 
                    type="number" 
                    placeholder="Amount" 
                    value={newExpenseAmount} 
                    onChange={e => setNewExpenseAmount(e.target.value)}
                    className="w-24"
                  />
                  <Button onClick={addCustomExpense} variant="secondary" size="icon"><Plus className="w-4 h-4" /></Button>
                </div>
                
                {customExpenses.length > 0 && (
                  <div className="space-y-2">
                    {customExpenses.map((exp, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-sm">
                        <span className="font-medium text-slate-700">{exp.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-900 font-bold">{currency} {formatForeign(exp.amount)}</span>
                          <button onClick={() => removeCustomExpense(idx)} className="text-red-400 hover:text-red-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </Card>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-7">
            <div className="sticky top-28 space-y-6">
              
              <Card className="p-8 bg-slate-900 border-slate-800 text-white rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-end mb-8 border-b border-slate-700 pb-8">
                    <div>
                      <p className="text-slate-400 font-medium mb-2 uppercase tracking-wider text-sm">Estimated Total Cost</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-bold font-heading text-white">
                          <span className="text-3xl text-primary font-sans mr-2">PKR</span>
                          {formatPKR(totalPKR)}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-2 flex items-center gap-2">
                        <span>≈ {currency} {formatForeign(totalForeign)}</span>
                        {liveExchangeRate ? (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                            Live Rate
                          </span>
                        ) : (
                          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">Static Rate</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Cost Breakdown (Year 1)</h3>
                    
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <GraduationCap size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-white group-hover:text-primary transition-colors">Tuition Fee</p>
                          <p className="text-xs text-slate-400">{degree === "masters" ? "Masters" : "Bachelors"} Degree</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{currency} {formatForeign(avgTuition)}</p>
                      </div>
                    </div>

                    {scholarship > 0 && (
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 group-hover:bg-green-400 group-hover:text-slate-900 transition-colors">
                            <ArrowRight size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-green-400">Scholarship Applied</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-400">-{currency} {formatForeign(scholarship)}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 group-hover:bg-blue-400 group-hover:text-white transition-colors">
                          <Landmark size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-white group-hover:text-blue-400 transition-colors">Living Expenses</p>
                          <p className="text-xs text-slate-400">Average per year</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{currency} {formatForeign(livingCost)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-orange-400 group-hover:bg-orange-400 group-hover:text-white transition-colors">
                          <Plane size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-white group-hover:text-orange-400 transition-colors">Visa & Processing</p>
                          <p className="text-xs text-slate-400">One-time fee</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{currency} {formatForeign(visaFee)}</p>
                      </div>
                    </div>

                    {customExpenses.length > 0 && (
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-purple-400 group-hover:bg-purple-400 group-hover:text-white transition-colors">
                            <Plus size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-white group-hover:text-purple-400 transition-colors">Custom Expenses</p>
                            <p className="text-xs text-slate-400">{customExpenses.length} items added</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{currency} {formatForeign(totalCustom)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Required Documents Alert */}
              {selectedUniversity && selectedUniversity.required_documents?.length > 0 && (
                <Card className="p-6 bg-blue-50 border-blue-200 shadow-sm rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <FileCheck className="text-blue-600" size={24} />
                    <h3 className="font-bold text-slate-800">Required Documents for {selectedUniversity.name}</h3>
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedUniversity.required_documents.map((doc, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                        <div className="mt-1 w-4 h-4 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        </div>
                        {doc}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                <h3 className="font-bold text-slate-800 mb-2">Ready to start your journey?</h3>
                <p className="text-sm text-slate-600 mb-6">Book a free counseling session with our experts to discuss these costs and explore scholarship options in detail.</p>
                <Button className="w-full sm:w-auto">
                  Book Free Consultation <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
