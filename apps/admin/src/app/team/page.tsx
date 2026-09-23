"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Hover3DWrapper from "@/components/Hover3DWrapper";
import { Lock, Plus, UserX, Shield, MoreVertical, Briefcase, Calendar, Mail, MapPin, Banknote, Edit, Check, Camera, Trash2, X, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useRole } from "@/components/RoleContext";
import toast from "react-hot-toast";
import { supabase } from "@/lib/auth/legacy";

export default function TeamDirectoryPage() {
  const { role, currentUser } = useRole();
  const [activeTab, setActiveTab] = useState<"active" | "resigned">("active");
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [assignRoleDropdownId, setAssignRoleDropdownId] = useState<number | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [newEmployeeForm, setNewEmployeeForm] = useState({ name: "", email: "", role: "Visa Processing Specialist", location: "", salary: "", joined: "" });
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
  const [resignedEmployees, setResignedEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTeam = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('team_members').select('*').order('id', { ascending: true });
    
    if (error) {
      console.error(error);
      toast.error("Failed to load team from database.");
    } else if (data) {
      const roleHierarchy = [
        "ceo/founder",
        "admin/ceo",
        "system admin",
        "admin",
        "operations head",
        "branch manager",
        "lead educational counsellor",
        "visa processing specialist",
        "career guidance expert",
        "student success coordinator",
        "marketing executive",
        "social media & marketing executive",
        "social media manager",
        "admission and marketing executive",
        "internee"
      ];
      
      const sortedData = [...data].sort((a, b) => {
        const rankA = roleHierarchy.indexOf(a.role?.toLowerCase() || "");
        const rankB = roleHierarchy.indexOf(b.role?.toLowerCase() || "");
        return (rankA === -1 ? 99 : rankA) - (rankB === -1 ? 99 : rankB);
      });

      setActiveEmployees(sortedData.filter(emp => emp.status === 'active'));
      setResignedEmployees(sortedData.filter(emp => emp.status === 'resigned'));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const availableRoles = [
    "CEO/Founder",
    "Admin/CEO",
    "Admin",
    "Accountant",
    "Language Instructor",
    "Lead Educational Counsellor",
    "Visa Processing Specialist",
    "Career Guidance Expert",
    "Student Success Coordinator",
    "Marketing Executive",
    "Social Media & Marketing Executive",
    "Social Media Manager",
    "Admission and Marketing Executive",
    "Branch Manager",
    "Operations Head",
    "Internee"
  ];

  const handleRestrictedAction = (actionName: string) => {
    toast.error(`Access Denied: You need Owner/Admin approval to ${actionName}.`);
  };

  const handleResign = async (emp: any) => {
    if (role !== "owner") {
      handleRestrictedAction("remove an employee");
      return;
    }
    
    const workedTo = "Today";
    
    const { error } = await supabase
      .from('team_members')
      .update({ status: 'resigned', worked_from: emp.joined, worked_to: workedTo })
      .eq('id', emp.id);

    if (error) {
      toast.error("Database error while resigning employee.");
      return;
    }

    toast.success(`${emp.name} has been moved to the Resigned record.`);
    fetchTeam();
  };

  /**
   * Protected Employee Deletion with Historical Integrity Check
   */
  const handleDelete = async (emp: any) => {
    if (role !== "owner") {
      handleRestrictedAction("delete an employee");
      setOpenDropdownId(null);
      return;
    }

    if (!confirm(`Are you sure you want to delete ${emp.name}? If attendance history exists, deletion will be rejected to protect legal audit records.`)) {
      setOpenDropdownId(null);
      return;
    }

    try {
      const res = await fetch('/api/team/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: emp.id })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Cannot delete employee.", { duration: 6000 });
      } else {
        toast.success(data.message || `${emp.name} deleted successfully.`);
        fetchTeam();
      }
    } catch {
      toast.error("Network error during deletion request.");
    } finally {
      setOpenDropdownId(null);
    }
  };

  const handleEditProfile = (emp: any) => {
    if (role !== "owner" && currentUser?.email !== emp.email) {
      handleRestrictedAction("edit a profile");
      setOpenDropdownId(null);
      return;
    }
    setEditingEmployee({ ...emp });
    setIsEditModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updateData: any = {
      name: editingEmployee.name,
      location: editingEmployee.location,
      image: editingEmployee.image,
      description: editingEmployee.description
    };

    if (role === "owner") {
      updateData.email = editingEmployee.email;
      updateData.joined = editingEmployee.joined;
      updateData.salary = editingEmployee.salary;
    }

    const { error } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', editingEmployee.id);

    if (error) {
      toast.error("Database error while saving profile: " + error.message);
      return;
    }

    toast.success(`${editingEmployee.name}'s profile updated!`);
    setIsEditModalOpen(false);
    fetchTeam();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image is too large! Please choose a picture under 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setEditingEmployee({ ...editingEmployee, image: base64String });
        toast.success("Picture attached! (Don't forget to click Save Changes)");
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Protected Server-side Role Assignment
   */
  const handleAssignRole = async (emp: any, newRole: string) => {
    if (role !== "owner") {
      handleRestrictedAction("assign roles");
      return;
    }

    try {
      const res = await fetch('/api/team/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: emp.id, newRole })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update role.");
      } else {
        toast.success(data.message || `Role successfully changed to ${newRole}`);
        fetchTeam();
      }
    } catch {
      toast.error("Network error while updating role.");
    } finally {
      setAssignRoleDropdownId(null);
    }
  };

  const handleAddEmployeeClick = () => {
    if (role !== "owner") {
      handleRestrictedAction("add a new employee");
      return;
    }
    setNewEmployeeForm({ name: "", email: "", role: "Visa Processing Specialist", location: "", salary: "", joined: "" });
    setIsAddModalOpen(true);
  };

  const handleCreateEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const res = await fetch('/api/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployeeForm)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || "Failed to create employee.");
      } else {
        toast.success(data.message || "Employee account created successfully!");
        setIsAddModalOpen(false);
        fetchTeam();
      }
    } catch {
      toast.error("Network error while creating employee.");
    } finally {
      setIsCreating(false);
    }
  };

  const container: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item: any = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };
  const closeAllDropdowns = () => { setOpenDropdownId(null); setAssignRoleDropdownId(null); };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><RefreshCw className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <motion.div className="space-y-6 max-w-7xl mx-auto pb-12" variants={container} initial="hidden" animate="show" onClick={closeAllDropdowns}>
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
        <div>
          <motion.h2 variants={item} className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Team Directory</motion.h2>
          <motion.p variants={item} className="text-slate-600 dark:text-slate-400">Manage employee roles, onboarding, and lifecycle records.</motion.p>
        </div>
        <motion.button 
          variants={item} whileHover={role === "owner" ? { scale: 1.05 } : {}} whileTap={role === "owner" ? { scale: 0.95 } : {}}
          onClick={handleAddEmployeeClick}
          className={`px-5 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${role === "owner" ? "bg-primary text-white hover:bg-blue-600" : "bg-slate-100 text-slate-500 cursor-not-allowed"}`}
        >
          {role !== "owner" ? <Lock size={18} /> : <Plus size={18} />} Add Employee
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-white dark:bg-slate-800 p-1 rounded-xl w-max border border-slate-200 dark:border-slate-700 transition-colors duration-300">
        <button onClick={(e) => { e.stopPropagation(); setActiveTab("active"); }} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${activeTab === "active" ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
          Active Staff ({activeEmployees.length})
        </button>
        <button onClick={(e) => { e.stopPropagation(); setActiveTab("resigned"); }} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${activeTab === "resigned" ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
          Resigned Record ({resignedEmployees.length})
        </button>
      </div>

      {/* Content Grid */}
      <AnimatePresence mode="wait">
        {activeTab === "active" && (
          <motion.div key="active" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeEmployees.map((emp) => (
              <Hover3DWrapper key={emp.id} intensity="subtle">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-visible h-full flex flex-col relative z-20 group transition-colors duration-300">
                  <div className="h-24 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 relative rounded-t-2xl">
                    <div className="absolute top-4 right-4 z-30">
                      <button onClick={(e) => { e.stopPropagation(); setAssignRoleDropdownId(null); setOpenDropdownId(openDropdownId === emp.id ? null : emp.id); }} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        <MoreVertical size={20} />
                      </button>
                      <AnimatePresence>
                        {openDropdownId === emp.id && (
                          <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 transition-colors duration-300">
                            {(role === "owner" || currentUser?.email === emp.email) && (
                              <button onClick={(e) => { e.stopPropagation(); handleEditProfile(emp); }} className="w-full text-left px-4 py-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <Edit size={16} /> Edit Profile
                              </button>
                            )}
                            {role === "owner" && (
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(emp); }} className="w-full text-left px-4 py-3 flex items-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-slate-100 dark:border-slate-700">
                                <Trash2 size={16} /> Delete Profile
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="px-6 pb-6 flex-grow flex flex-col items-center -mt-12 text-center">
                    <div className="relative w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden shadow-lg mb-4 bg-slate-100 dark:bg-slate-700 z-10 transition-colors duration-300">
                      <Image src={emp.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`} alt={emp.name} fill className="object-cover" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{emp.name}</h3>
                    <p className="text-sm font-medium text-secondary mb-4 bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">{emp.role}</p>
                    
                    <div className="w-full space-y-3 mt-auto relative z-10 text-left pl-2">
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400"><Mail size={16} /> <span className="truncate">{emp.email}</span></div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400"><MapPin size={16} /> <span>{emp.location}</span></div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400"><Calendar size={16} /> <span>Joined {emp.joined}</span></div>
                      {(role === "owner" || currentUser?.email === emp.email) && (
                        <div className="flex items-center gap-3 text-sm font-medium text-green-600 bg-green-50 p-2 rounded-lg border border-green-100 -ml-2"><Banknote size={16} /> <span>{emp.salary}</span></div>
                      )}
                    </div>
                  </div>
                  {role === "owner" && (
                    <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/80 flex gap-2 rounded-b-2xl z-10 relative transition-colors duration-300">
                      <div className="flex-1 relative">
                        <button onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); setAssignRoleDropdownId(assignRoleDropdownId === emp.id ? null : emp.id); }} className={`w-full py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-colors ${assignRoleDropdownId === emp.id ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"}`}>
                          <Shield size={14} /> Role
                        </button>
                        <AnimatePresence>
                          {assignRoleDropdownId === emp.id && (
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute bottom-[calc(100%+8px)] left-0 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[100] transition-colors duration-300">
                              <div className="p-2 border-b border-slate-200 dark:border-slate-700"><span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-2">Assign New Role</span></div>
                              <div className="max-h-96 overflow-y-auto">
                                {availableRoles.map(availableRole => (
                                  <button key={availableRole} onClick={(e) => { e.stopPropagation(); handleAssignRole(emp, availableRole); }} className="w-full text-left px-4 py-2.5 flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    <span>{availableRole}</span>{emp.role === availableRole && <Check size={14} className="text-secondary" />}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleResign(emp); }} className="flex-1 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-colors bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40">
                        <UserX size={14} /> Resign
                      </button>
                    </div>
                  )}
                </div>
              </Hover3DWrapper>
            ))}
          </motion.div>
        )}

        {activeTab === "resigned" && (
          <motion.div key="resigned" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm transition-colors duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm transition-colors duration-300">
                    <th className="p-4 font-semibold">Employee</th>
                    <th className="p-4 font-semibold">Former Role</th>
                    <th className="p-4 font-semibold">Tenure</th>
                    <th className="p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {resignedEmployees.map((emp) => (
                    <tr key={emp.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="p-4 flex items-center gap-4">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600 grayscale opacity-70">
                          <Image src={emp.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`} alt={emp.name} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{emp.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{emp.email}</p>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-700 dark:text-slate-300">{emp.role}</td>
                      <td className="p-4"><div className="text-sm font-medium text-slate-900 dark:text-white">{emp.worked_from || 'Unknown'} - {emp.worked_to || 'Unknown'}</div></td>
                      <td className="p-4 flex gap-2">
                        <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100">Resigned</span>
                        <button onClick={() => handleDelete(emp)} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="Delete permanently"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {resignedEmployees.length === 0 && (<tr><td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">No resigned employees on record.</td></tr>)}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditModalOpen && editingEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800 shrink-0">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Profile</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full p-2 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSaveProfile} className="flex flex-col overflow-hidden h-full">
                <div className="p-6 space-y-6 overflow-y-auto">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-700">
                      {editingEmployee.image ? <Image src={editingEmployee.image} alt="Profile" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center"><UserX size={32} className="text-slate-400" /></div>}
                    </div>
                    <div className="flex gap-2">
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"><Camera size={14} /> Upload</button>
                      <button type="button" onClick={() => setEditingEmployee({ ...editingEmployee, image: null })} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"><Trash2 size={14} /> Remove</button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label><input required type="text" value={editingEmployee.name} onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label><input required type="email" value={editingEmployee.email} onChange={e => setEditingEmployee({...editingEmployee, email: e.target.value})} disabled={role !== "owner"} className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white ${role !== 'owner' ? 'opacity-60 cursor-not-allowed' : ''}`} /></div>
                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Office Location</label><input type="text" value={editingEmployee.location} onChange={e => setEditingEmployee({...editingEmployee, location: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Joining Date</label><input type="text" value={editingEmployee.joined} onChange={e => setEditingEmployee({...editingEmployee, joined: e.target.value})} disabled={role !== "owner"} className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white ${role !== 'owner' ? 'opacity-60 cursor-not-allowed' : ''}`} /></div>
                      <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Salary</label><input type="text" value={editingEmployee.salary} onChange={e => setEditingEmployee({...editingEmployee, salary: e.target.value})} disabled={role !== "owner"} className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white ${role !== 'owner' ? 'opacity-60 cursor-not-allowed' : ''}`} /></div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">About / Bio</label>
                      <textarea rows={3} value={editingEmployee.description || ""} onChange={e => setEditingEmployee({...editingEmployee, description: e.target.value})} placeholder="A vital part of our expert team..." className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white resize-none" />
                    </div>
                  </div>
                </div>
                <div className="p-5 border-t border-slate-100 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800">
                  <button type="submit" className="w-full py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-md">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800 shrink-0">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add New Employee</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full p-2 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateEmployeeSubmit} className="flex flex-col overflow-hidden h-full">
                <div className="p-6 space-y-4 overflow-y-auto">
                  <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                    This will create a dashboard login account for the employee. Account setup and access links should be sent via Supabase Magic Link onboarding.
                  </p>
                  <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label><input required type="text" value={newEmployeeForm.name} onChange={e => setNewEmployeeForm({...newEmployeeForm, name: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Email</label><input required type="email" value={newEmployeeForm.email} onChange={e => setNewEmployeeForm({...newEmployeeForm, email: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white" /></div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Initial Role</label>
                    <select required value={newEmployeeForm.role} onChange={e => setNewEmployeeForm({...newEmployeeForm, role: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white">
                      {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Office Location</label><input required type="text" placeholder="e.g., Lahore Office" value={newEmployeeForm.location} onChange={e => setNewEmployeeForm({...newEmployeeForm, location: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-white" /></div>
                </div>
                <div className="p-5 border-t border-slate-100 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800">
                  <button type="submit" disabled={isCreating} className="w-full flex items-center justify-center py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-70">
                    {isCreating ? "Creating Account..." : "Create Employee Account"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
