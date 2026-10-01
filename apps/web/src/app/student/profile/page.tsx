"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@keyabroad/auth/client';
import { Card, CardContent, CardHeader, CardTitle } from '@keyabroad/ui/components/card';
import { Input } from '@keyabroad/ui/components/input';
import { Label } from '@keyabroad/ui/components/label';
import { Button } from '@keyabroad/ui/components/button';
import { User, Save, Loader2, CheckCircle2 } from 'lucide-react';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        setLoading(false);
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.session.user.id)
        .single();
        
      if (data) {
        setProfile(data);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;
    
    setSaving(true);
    setSuccess(false);
    setErrorMsg('');
    
    const formData = new FormData(e.currentTarget);
    const updates = {
      first_name: formData.get('firstName') as string,
      last_name: formData.get('lastName') as string,
      nationality: formData.get('nationality') as string,
      passport_number: formData.get('passport') as string,
    };
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);
      
    setSaving(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setProfile({ ...profile, ...updates });
    } else {
      setErrorMsg("Failed to save profile. Please try again.");
    }
  };

  if (loading) return <div className="p-8 text-center flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
  if (!profile) return <div className="p-8 text-center">Please log in to view your profile.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information.</p>
      </div>
      
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2 border border-green-100">
          <CheckCircle2 size={18} /> Profile updated successfully!
        </div>
      )}
      
      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 border border-red-100">
          {errorMsg}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" defaultValue={profile.first_name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" defaultValue={profile.last_name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={profile.email} disabled className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input id="nationality" name="nationality" defaultValue={profile.nationality} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passport">Passport Number</Label>
                <Input id="passport" name="passport" defaultValue={profile.passport_number} />
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={saving} className="flex items-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
