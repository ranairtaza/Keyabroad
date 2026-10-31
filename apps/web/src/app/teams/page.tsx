"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Mail, Globe } from "lucide-react";
import Hover3DWrapper from "@/components/Hover3DWrapper";
import { supabase } from "@keyabroad/auth/legacy";

export default function TeamsPage() {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        let members: any[] = [];
        const { data, error } = await supabase
          .from('team_members')
          .select('id, name, role, location, image, description, email, status')
          .eq('status', 'active');
        
        if (!error && data && data.length > 0) {
          members = data;
        } else {
          // Graceful fallback to verified staff profiles if team_members is restricted by RLS
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, role, designation, avatar_url, email, is_active')
            .in('role', ['admin', 'staff', 'owner'])
            .eq('is_active', true)
            .not('full_name', 'is', null);

          if (profileData && profileData.length > 0) {
            members = profileData.map((p: any) => ({
              id: p.id,
              name: p.full_name,
              role: p.designation || (p.role === 'owner' ? 'CEO/Founder' : p.role === 'admin' ? 'Admin' : 'Counselor'),
              location: 'Head Office',
              image: p.avatar_url,
              description: `A vital part of our expert team, bringing invaluable experience to KeyAbroad.`,
              email: p.email,
              status: 'active'
            }));
          }
        }

        if (members.length > 0) {
          const roleHierarchy = [
            "ceo/founder",
            "admin/ceo",
            "system admin",
            "admin",
            "operations head",
            "branch manager",
            "lead educational counsellor",
            "visa processing specialist",
            "language instructor",
            "career guidance expert",
            "student success coordinator",
            "marketing executive",
            "social media & marketing executive",
            "social media manager",
            "admission and marketing executive",
            "internee"
          ];
          
          const sortedData = [...members].sort((a, b) => {
            const rankA = roleHierarchy.indexOf(a.role?.toLowerCase() || "");
            const rankB = roleHierarchy.indexOf(b.role?.toLowerCase() || "");
            return (rankA === -1 ? 99 : rankA) - (rankB === -1 ? 99 : rankB);
          });

          setTeamMembers(sortedData);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeam();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Section */}
      <div className="bg-primary text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-full bg-secondary opacity-20" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Meet the Experts Behind Your Success</h1>
          <p className="text-xl max-w-2xl mx-auto text-blue-50">
            Get to know the dedicated mentors and specialists committed to making your international education dreams a reality.
          </p>
        </div>
      </div>

      {/* Team Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Team Directory Empty</h3>
            <p className="text-slate-500 text-lg">We are currently updating our team directory. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
            <Hover3DWrapper key={index} intensity="subtle" className="h-full">
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 h-full flex flex-col group">
                <div className="relative h-64 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                  {member.image ? (
                    <Image 
                      src={member.image} 
                      alt={member.name || 'Team Member'}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-4xl font-bold text-slate-300">{(member.name || 'U').charAt(0)}</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6 gap-4">
                    <button className="bg-white p-2 rounded-full text-primary hover:text-secondary hover:scale-110 transition-all">
                      <Globe size={20} />
                    </button>
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="bg-white p-2 rounded-full text-primary hover:text-secondary hover:scale-110 transition-all">
                        <Mail size={20} />
                      </a>
                    )}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{member.name}</h3>
                  <p className="text-secondary font-medium text-sm mb-4">{member.role}</p>
                  <p className="text-slate-600 text-sm flex-grow">
                    {member.description || `A vital part of our expert team, bringing invaluable experience to our ${member.location || 'Faisalabad'} branch.`}
                  </p>
                  {member.email && (
                    <a href={`mailto:${member.email}`} className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-primary bg-blue-50 hover:bg-blue-100 py-2 rounded-lg transition-colors border border-blue-100">
                      <Mail size={16} /> {member.email}
                    </a>
                  )}
                </div>
              </div>
            </Hover3DWrapper>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
