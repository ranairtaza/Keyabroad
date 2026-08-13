"use client";

import { useState } from "react";
import { Calendar, Clock, User, Phone, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@keyabroad/auth/legacy";

export default function BookAppointmentPage() {
  const [formData, setFormData] = useState({
    student_name: "",
    phone: "",
    appointment_date: "",
    appointment_time: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTimes = [
    "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", 
    "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
  ];

  // Get tomorrow's date for minimum booking date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('appointments').insert([{
        student_name: formData.student_name,
        phone: formData.phone,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        status: 'scheduled'
      }]);

      if (insertError) throw insertError;
      
      setSuccess(true);
      
      // Also notify admins (simulated for now, would use real notify endpoint)
      await supabase.from('notifications').insert([{
        recipient: 'Admin',
        message: `New appointment booked by ${formData.student_name} for ${formData.appointment_date}`
      }]);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Book a Consultation</h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Schedule a free 1-on-1 counseling session with our expert advisors to discuss your study abroad journey.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
              <p className="text-slate-600 mb-6">
                Thank you, {formData.student_name}. Your appointment is scheduled for {new Date(formData.appointment_date).toLocaleDateString()} at {formData.appointment_time}.
              </p>
              <p className="text-sm text-slate-500 mb-8">
                One of our counselors will contact you shortly to confirm the details.
              </p>
              <button 
                onClick={() => { setSuccess(false); setFormData({student_name:"", phone:"", appointment_date:"", appointment_time:""}); }}
                className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors"
              >
                Book Another Session
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-3 text-sm">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        required
                        value={formData.student_name}
                        onChange={e => setFormData({...formData, student_name: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="tel" 
                        required
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="+92 300 1234567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Preferred Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="date" 
                        required
                        min={minDate}
                        value={formData.appointment_date}
                        onChange={e => setFormData({...formData, appointment_date: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Preferred Time</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {availableTimes.map(time => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setFormData({...formData, appointment_time: time})}
                          className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                            formData.appointment_time === time 
                              ? 'bg-primary border-primary text-white shadow-md' 
                              : 'bg-white border-slate-200 text-slate-600 hover:border-primary/50 hover:bg-slate-50'
                          }`}
                        >
                          <Clock size={14} className={formData.appointment_time === time ? 'text-white' : 'text-slate-400'} />
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <button 
                    type="submit"
                    disabled={loading || !formData.appointment_time}
                    className="w-full bg-primary hover:bg-blue-600 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Confirm Booking"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
