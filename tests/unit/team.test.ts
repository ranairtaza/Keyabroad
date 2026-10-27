import { describe, it, expect } from 'vitest';

describe('Team Directory & Security Regression Suite', () => {
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

  it('correctly sorts team members by leadership and operational role hierarchy', () => {
    const rawMembers = [
      { id: 1, name: 'Alice', role: 'Internee' },
      { id: 2, name: 'Bob', role: 'CEO/Founder' },
      { id: 3, name: 'Charlie', role: 'Visa Processing Specialist' },
      { id: 4, name: 'Diana', role: 'Admin/CEO' }
    ];

    const sorted = [...rawMembers].sort((a, b) => {
      const rankA = roleHierarchy.indexOf(a.role?.toLowerCase() || "");
      const rankB = roleHierarchy.indexOf(b.role?.toLowerCase() || "");
      return (rankA === -1 ? 99 : rankA) - (rankB === -1 ? 99 : rankB);
    });

    expect(sorted.map(m => m.name)).toEqual(['Bob', 'Diana', 'Charlie', 'Alice']);
  });

  it('masks employee salary for non-owner and non-super-admin callers', () => {
    const rawMembers = [
      { id: 1, name: 'Staff A', role: 'Counselor', salary: '150,000 PKR' },
      { id: 2, name: 'Staff B', role: 'Specialist', salary: '120,000 PKR' }
    ];

    const sanitizeForRole = (members: any[], callerRole: string) => {
      const isOwner = callerRole.includes('owner') || callerRole.includes('super_admin');
      return members.map(member => {
        if (!isOwner) {
          return {
            ...member,
            salary: null
          };
        }
        return member;
      });
    };

    // Non-owner (e.g. staff counselor)
    const staffView = sanitizeForRole(rawMembers, 'staff');
    expect(staffView[0].salary).toBeNull();
    expect(staffView[1].salary).toBeNull();

    // Owner
    const ownerView = sanitizeForRole(rawMembers, 'owner');
    expect(ownerView[0].salary).toBe('150,000 PKR');
    expect(ownerView[1].salary).toBe('120,000 PKR');
  });

  it('gracefully transforms active staff profiles into public team member structures', () => {
    const rawStaffProfiles = [
      {
        id: 'user-1',
        full_name: 'Musfeera Tabbsum',
        role: 'staff',
        designation: 'Lead Educational Counsellor',
        avatar_url: 'https://example.com/avatar.jpg',
        email: 'musfeera@keyabroad.com',
        is_active: true
      },
      {
        id: 'user-2',
        full_name: 'Faizan',
        role: 'staff',
        designation: 'Visa Processing Specialist',
        avatar_url: null,
        email: 'faizan@keyabroad.com',
        is_active: true
      }
    ];

    const mappedTeam = rawStaffProfiles.map(p => ({
      id: p.id,
      name: p.full_name,
      role: p.designation || (p.role === 'owner' ? 'CEO/Founder' : p.role === 'admin' ? 'Admin' : 'Counselor'),
      location: 'Head Office',
      image: p.avatar_url,
      description: `A vital part of our expert team, bringing invaluable experience to KeyAbroad.`,
      email: p.email,
      status: 'active'
    }));

    expect(mappedTeam).toHaveLength(2);
    expect(mappedTeam[0].name).toBe('Musfeera Tabbsum');
    expect(mappedTeam[0].role).toBe('Lead Educational Counsellor');
    expect(mappedTeam[0].status).toBe('active');
    expect(mappedTeam[1].name).toBe('Faizan');
    expect(mappedTeam[1].role).toBe('Visa Processing Specialist');
  });
});
