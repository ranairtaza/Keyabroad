"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"login" | "forgot" | "reset">("login");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Welcome back to KeyAbroad Workspace!");
        window.location.href = "/";
      }
    } catch (err: any) {
      toast.error(err.message || "A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Recovery OTP sent to your email!");
      setView("reset");
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      toast.error("Please enter the OTP and your new password.");
      return;
    }
    setLoading(true);
    
    // Verify OTP first, which logs the user in if successful
    const { error: verifyError } = await supabase.auth.verifyOtp({ 
      email, 
      token: otp, 
      type: 'recovery' 
    });

    if (verifyError) {
      toast.error(`Invalid or expired OTP: ${verifyError.message}`);
      setLoading(false);
      return;
    }

    // Now update the password for the newly authenticated session
    const { error: updateError } = await supabase.auth.updateUser({ 
      password: newPassword 
    });

    if (updateError) {
      toast.error(updateError.message);
    } else {
      toast.success("Password reset successfully! You can now log in.");
      setView("login");
      setPassword("");
      setNewPassword("");
      setOtp("");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-50">
      <div className="absolute top-0 right-0 w-[50%] h-full bg-primary opacity-10" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}></div>
      <div className="absolute bottom-0 left-0 w-[50%] h-full bg-secondary opacity-10" style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}></div>
      
      <div className="bg-white border border-slate-200 p-10 rounded-2xl shadow-2xl w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Key<span className="text-primary">Abroad</span> Workspace</h1>
          <p className="text-slate-600">Welcome to your command center.</p>
        </div>
        
        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Company Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@keyabroad.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <button type="button" onClick={() => setView("forgot")} className="text-xs font-semibold text-primary hover:text-blue-600 transition-colors">Forgot Password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Secure Login"
              )}
            </button>
          </form>
        )}

        {view === "forgot" && (
          <form onSubmit={handleSendOTP} className="space-y-5">
            <p className="text-sm text-slate-600 mb-4 text-center">Enter your company email to receive a secure recovery OTP code.</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Company Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@keyabroad.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Send OTP"
              )}
            </button>
            <button type="button" onClick={() => setView("login")} className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700 mt-2">
              Back to Login
            </button>
          </form>
        )}

        {view === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <p className="text-sm text-slate-600 mb-4 text-center">We sent a 6-digit OTP code to <strong className="text-slate-900">{email}</strong>.</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">OTP Code</label>
              <input 
                type="text" 
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-center tracking-[0.5em] text-lg font-bold text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                maxLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Reset Password"
              )}
            </button>
            <button type="button" onClick={() => setView("login")} className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700 mt-2">
              Cancel
            </button>
          </form>
        )}
        
        <p className="text-center text-slate-500 text-sm mt-8">
          Only authorized personnel have access. Contact IT for support.
        </p>
      </div>
    </div>
  );
}
