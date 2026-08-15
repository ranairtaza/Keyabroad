"use client";

import { useState } from "react";
import { Calculator, DollarSign, Euro, PoundSterling, Landmark, Plane, GraduationCap, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@keyabroad/ui/components/button";
import { Card } from "@keyabroad/ui/components/card";

const DESTINATIONS = {
  UK: { currency: "£", rate: 355, symbol: PoundSterling, tuition: [12000, 30000], living: 12000, visa: 490 },
  USA: { currency: "$", rate: 278, symbol: DollarSign, tuition: [15000, 50000], living: 15000, visa: 510 },
  Australia: { currency: "A$", rate: 182, symbol: DollarSign, tuition: [20000, 45000], living: 24500, visa: 710 },
  Canada: { currency: "C$", rate: 205, symbol: DollarSign, tuition: [15000, 35000], living: 20635, visa: 150 },
  Europe: { currency: "€", rate: 300, symbol: Euro, tuition: [3000, 15000], living: 10000, visa: 80 }
};

type DestKey = keyof typeof DESTINATIONS;

export default function CostCalculatorPage() {
  const [dest, setDest] = useState<DestKey>("UK");
  const [degree, setDegree] = useState<"bachelors" | "masters">("masters");
  const [scholarship, setScholarship] = useState(0);

  const selected = DESTINATIONS[dest];
  const Icon = selected.symbol;
  
  // Calculate Base Costs
  const avgTuition = degree === "masters" 
    ? selected.tuition[0] + (selected.tuition[1] - selected.tuition[0]) * 0.3 
    : selected.tuition[0] + (selected.tuition[1] - selected.tuition[0]) * 0.6;
    
  const discountedTuition = Math.max(0, avgTuition - scholarship);
  
  const totalForeign = discountedTuition + selected.living + selected.visa;
  const totalPKR = totalForeign * selected.rate;

  const formatPKR = (val: number) => {
    return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(val);
  };

  const formatForeign = (val: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Calculator size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 font-heading">Study Abroad Cost Calculator</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Get an instant estimate of your total study abroad expenses including tuition, living costs, and visa fees.
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
                  {Object.keys(DESTINATIONS).map((d) => (
                    <button 
                      key={d}
                      onClick={() => setDest(d as DestKey)}
                      className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                        dest === d 
                        ? 'bg-primary border-primary text-white shadow-md' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-primary/30 hover:bg-blue-50'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Degree Level */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">2. Degree Level</label>
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
                  <span>3. Expected Scholarship</span>
                  <span className="text-primary">{selected.currency}{formatForeign(scholarship)}</span>
                </label>
                <p className="text-xs text-slate-400 mb-4">Move the slider to estimate cost with a scholarship.</p>
                <input 
                  type="range" 
                  min="0" 
                  max="15000" 
                  step="500" 
                  value={scholarship}
                  onChange={(e) => setScholarship(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-7">
            <Card className="h-full p-6 md:p-8 bg-slate-900 text-white border-slate-800 rounded-3xl relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
              
              <h2 className="text-2xl font-bold mb-8 font-heading flex items-center">
                <Landmark className="mr-3 text-emerald-400" /> Cost Breakdown for {dest}
              </h2>

              <div className="space-y-6 mb-8 relative z-10">
                <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mr-4">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold">Tuition Fees (1st Year)</h3>
                      <p className="text-sm text-slate-400">After scholarship</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{selected.currency}{formatForeign(discountedTuition)}</p>
                    <p className="text-sm text-slate-400">~ PKR {formatPKR(discountedTuition * selected.rate)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mr-4">
                      <Landmark size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold">Living Expenses</h3>
                      <p className="text-sm text-slate-400">Required maintenance</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{selected.currency}{formatForeign(selected.living)}</p>
                    <p className="text-sm text-slate-400">~ PKR {formatPKR(selected.living * selected.rate)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mr-4">
                      <Plane size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold">Visa & Processing</h3>
                      <p className="text-sm text-slate-400">Embassy fees</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{selected.currency}{formatForeign(selected.visa)}</p>
                    <p className="text-sm text-slate-400">~ PKR {formatPKR(selected.visa * selected.rate)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-700 mt-auto relative z-10">
                <p className="text-slate-400 mb-2 uppercase tracking-widest text-xs font-bold">Estimated Total (1st Year)</p>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                      PKR {formatPKR(totalPKR)}
                    </span>
                    <p className="text-slate-400 mt-2 font-medium">({selected.currency}{formatForeign(totalForeign)} total)</p>
                  </div>
                  <Button size="lg" className="rounded-xl h-14 px-8 shadow-lg shadow-primary/20" asChild>
                    <a href="/contact">Get Exact Quote <ArrowRight className="ml-2 w-5 h-5" /></a>
                  </Button>
                </div>
              </div>

              <div className="mt-8 flex items-start gap-3 text-sm text-slate-500 bg-slate-950/50 p-4 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <p>These figures are careful estimates based on current exchange rates ({selected.currency}1 = PKR {selected.rate}) and average university fees. Your actual costs may vary. Contact our counselors for a precise assessment.</p>
              </div>

            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
