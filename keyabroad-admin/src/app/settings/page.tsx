"use client";

import { motion } from "framer-motion";
import { User, Bell, Shield, Key, Globe, Moon, Sun, Save, Camera, Trash2 } from "lucide-react";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { useRole } from "@/components/RoleContext";
import { useTheme } from "@/components/ThemeContext";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import ImageCropperModal from "@/components/ImageCropperModal";

export default function SettingsPage() {
  const { role, currentUser, updateUser } = useRole();
  const [activeTab, setActiveTab] = useState("profile");
  const { theme, setTheme } = useTheme();
  const [profilePic, setProfilePic] = useState<string | null>(currentUser?.image || null);
  const [name, setName] = useState(currentUser?.name || "");
  const [designation, setDesignation] = useState(currentUser?.designation || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [securityView, setSecurityView] = useState<"change" | "forgot" | "reset">("change");
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image is too large! Please choose a picture under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImageSrc(event.target?.result as string);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
    // Clear the input value so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = async (croppedBase64: string) => {
    setProfilePic(croppedBase64);
    updateUser({ image: croppedBase64 });
    if (currentUser?.email) {
      await supabase.from('team_members').update({ image: croppedBase64 }).eq('email', currentUser.email);
    }
    toast.success("Profile picture updated and saved!");
    setIsCropperOpen(false);
    setSelectedImageSrc(null);
  };

  const handleRemoveImage = async () => {
    const defaultImg = "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff";
    setProfilePic(null);
    updateUser({ image: defaultImg });
    if (currentUser?.email) {
      await supabase.from('team_members').update({ image: defaultImg }).eq('email', currentUser.email);
    }
    toast.success("Profile picture removed.");
  };

  const handleSave = async () => {
    updateUser({ name, designation, phone });
    if (currentUser?.email) {
      const updateData: any = { name };
      if (role === "owner") {
        updateData.role = designation;
      }
      await supabase.from('team_members').update(updateData).eq('email', currentUser.email);
    }
    toast.success("Settings saved successfully!");
  };

  const handleRestrictedAction = (actionName: string) => {
    toast.error(`Access Denied: You need Owner approval to ${actionName}.`);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }
    
    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast.error(`Failed to change password: ${error.message}`);
    } else {
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
    }
    setIsChangingPassword(false);
  };

  const handleSendOTP = async () => {
    if (!currentUser?.email) return;
    setIsChangingPassword(true);
    const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Recovery OTP sent to your email!");
      setSecurityView("reset");
    }
    setIsChangingPassword(false);
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword || newPassword.length < 6) {
      toast.error("Please enter the OTP and a new password (min 6 chars).");
      return;
    }
    setIsChangingPassword(true);
    
    if (!currentUser?.email) return;

    // Verify OTP first
    const { error: verifyError } = await supabase.auth.verifyOtp({ 
      email: currentUser.email, 
      token: otp, 
      type: 'recovery' 
    });

    if (verifyError) {
      toast.error(`Invalid or expired OTP: ${verifyError.message}`);
      setIsChangingPassword(false);
      return;
    }

    // Now update the password
    const { error: updateError } = await supabase.auth.updateUser({ 
      password: newPassword 
    });

    if (updateError) {
      toast.error(updateError.message);
    } else {
      toast.success("Password reset successfully!");
      setSecurityView("change");
      setCurrentPassword("");
      setNewPassword("");
      setOtp("");
    }
    setIsChangingPassword(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === "profile" ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <User size={18} /> Profile Info
          </button>
          <button 
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === "notifications" ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Bell size={18} /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === "security" ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Shield size={18} /> Security
          </button>
          <button 
            onClick={() => setActiveTab("preferences")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === "preferences" ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Globe size={18} /> Preferences
          </button>
        </div>

        {/* Content Area */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 min-h-[500px] transition-colors duration-300">
          {activeTab === "profile" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Profile Information</h2>
              
              {/* Profile Picture Section */}
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
                <div className="relative w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-slate-400" />
                  )}
                </div>
                <div className="flex gap-3">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-primary hover:bg-blue-600 text-white shadow-sm`}
                  >
                    <Camera size={16} /> Change Picture
                  </button>
                  <button 
                    onClick={() => handleRemoveImage()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-red-50 hover:bg-red-100 text-red-600 border border-red-100`}
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-600">Full Name</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-primary transition-colors" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-600">Email Address</label>
                  <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-500 cursor-not-allowed" defaultValue={currentUser?.email || ""} disabled />
                  <p className="text-xs text-slate-500 mt-1">Email address cannot be changed.</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-600">Phone Number</label>
                  <input type="tel" placeholder="+1 234 567 8900" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-primary transition-colors" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-600">Role / Designation</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-primary transition-colors" value={designation} onChange={(e) => setDesignation(e.target.value)} disabled={role !== "owner"} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Notification Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-900">Email Alerts</h4>
                    <p className="text-sm text-slate-600">Receive daily summary emails of new leads.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-900">Task Assignment</h4>
                    <p className="text-sm text-slate-600">Get notified when a new task is assigned to you.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Security Settings</h2>
              
              {securityView === "change" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center max-w-md">
                    <p className="text-sm text-slate-600">Update your password securely.</p>
                    <button onClick={() => setSecurityView("forgot")} className="text-sm font-semibold text-primary hover:text-blue-600 transition-colors">
                      Forgot Password?
                    </button>
                  </div>
                  <div className="space-y-2 max-w-md">
                    <label className="text-sm font-medium text-slate-600">Current Password</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <label className="text-sm font-medium text-slate-600">New Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <button 
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-lg transition-colors border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? "Changing..." : "Change Password"}
                  </button>
                </div>
              )}

              {securityView === "forgot" && (
                <div className="space-y-4 max-w-md">
                  <p className="text-sm text-slate-600 mb-4">We will send a 6-digit OTP code to your registered email: <strong className="text-slate-900">{currentUser?.email}</strong></p>
                  
                  <button 
                    onClick={handleSendOTP}
                    disabled={isChangingPassword}
                    className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex justify-center items-center disabled:opacity-50"
                  >
                    {isChangingPassword ? "Sending..." : "Send OTP to Email"}
                  </button>
                  <button onClick={() => setSecurityView("change")} className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700 mt-2">
                    Back
                  </button>
                </div>
              )}

              {securityView === "reset" && (
                <div className="space-y-4 max-w-md">
                  <p className="text-sm text-slate-600 mb-4">Enter the 6-digit OTP code sent to your email and your new password.</p>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">OTP Code</label>
                    <input 
                      type="text" 
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="123456" 
                      maxLength={6}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-center tracking-[0.5em] text-lg font-bold text-slate-900 focus:outline-none focus:border-primary transition-colors" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-primary transition-colors" 
                    />
                  </div>
                  
                  <button 
                    onClick={handleResetPassword}
                    disabled={isChangingPassword}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex justify-center items-center disabled:opacity-50"
                  >
                    {isChangingPassword ? "Resetting..." : "Reset Password"}
                  </button>
                  <button onClick={() => setSecurityView("change")} className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700 mt-2">
                    Cancel
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "preferences" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">System Preferences</h2>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-600">Theme Preference</label>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setTheme("dark")}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${theme === 'dark' ? 'bg-slate-50 dark:bg-slate-700 border-2 border-primary text-slate-900 dark:text-white font-medium' : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                      <Moon size={18} className={theme === 'dark' ? "text-primary" : ""} /> Dark Mode
                    </button>
                    <button 
                      onClick={() => setTheme("light")}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${theme === 'light' ? 'bg-slate-50 dark:bg-slate-700 border-2 border-primary text-slate-900 dark:text-white font-medium' : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                      <Sun size={18} className={theme === 'light' ? "text-primary" : ""} /> Light Mode
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-w-md">
                  <label className="text-sm font-medium text-slate-600">Language</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:border-primary transition-colors appearance-none">
                    <option value="en">English (US)</option>
                    <option value="ur">Urdu (PK)</option>
                    <option value="es">Spanish (ES)</option>
                    <option value="de">German (DE)</option>
                    <option value="fr">French (FR)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Footer */}
          <div className="mt-12 pt-6 border-t border-slate-200 flex justify-end">
            <button 
              onClick={() => handleSave()}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg bg-primary text-white hover:bg-blue-600`}
            >
              <Save size={18} /> Save Changes
            </button>
          </div>
        </motion.div>
      </div>

      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={selectedImageSrc}
        onClose={() => {
          setIsCropperOpen(false);
          setSelectedImageSrc(null);
        }}
        onCropComplete={handleCropComplete}
      />
    </motion.div>
  );
}
