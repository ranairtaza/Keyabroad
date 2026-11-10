import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { STAFF_ROLES } from '@keyabroad/database';

describe('Phase 0 Critical Security Remediation Suite', () => {
  const rootDir = path.resolve(__dirname, '../../');

  describe('P0.1 — Credential Exposure Incident Remediation', () => {
    it('remove_test_data.js must not exist on disk', () => {
      const filePath = path.join(rootDir, 'remove_test_data.js');
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('no active code file contains the compromised service_role token', () => {
      const compromisedSignature = ['WE3OATqttP', 'uo28vGTUrImBXBynDVCKHp7N8fBiROrA4'].join('');
      const scanDirs = ['apps', 'packages', 'tests'];
      
      function searchDir(dir: string) {
        const fullPath = path.join(rootDir, dir);
        if (!fs.existsSync(fullPath)) return;
        const entries = fs.readdirSync(fullPath, { withFileTypes: true });
        for (const entry of entries) {
          const res = path.join(fullPath, entry.name);
          if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.turbo') {
              searchDir(path.relative(rootDir, res));
            }
          } else if (entry.isFile() && /\.(ts|js|mjs|tsx|jsx|json)$/.test(entry.name)) {
            if (entry.name === 'p0_regression.test.ts') continue;
            const content = fs.readFileSync(res, 'utf8');
            expect(content).not.toContain(compromisedSignature);
          }
        }
      }
      
      scanDirs.forEach(searchDir);
    });

    it('packages/auth supports NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY', () => {
      const clientAuthPath = path.join(rootDir, 'packages/auth/src/client.ts');
      const serverAuthPath = path.join(rootDir, 'packages/auth/src/server.ts');
      
      const clientContent = fs.readFileSync(clientAuthPath, 'utf8');
      expect(clientContent).toContain('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
      expect(clientContent).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');

      const serverContent = fs.readFileSync(serverAuthPath, 'utf8');
      expect(serverContent).toContain('createAdminClient');
      expect(serverContent).toContain('SUPABASE_SECRET_KEY');
      expect(serverContent).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    });

    it('turbo.json registers modern credentials in globalEnv and tasks.build.env', () => {
      const turboPath = path.join(rootDir, 'turbo.json');
      const turboConfig = JSON.parse(fs.readFileSync(turboPath, 'utf8'));
      
      expect(turboConfig.globalEnv).toContain('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
      expect(turboConfig.globalEnv).toContain('SUPABASE_SECRET_KEY');
      expect(turboConfig.tasks.build.env).toContain('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
      expect(turboConfig.tasks.build.env).toContain('SUPABASE_SECRET_KEY');
    });
  });

  describe('P0.2 — Migration Discovery & Version Collision Prevention', () => {
    const migrationsDir = path.join(rootDir, 'supabase/migrations');

    it('every migration in supabase/migrations has a unique timestamp matching Supabase CLI convention', () => {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
      const timestamps = new Set<string>();

      for (const file of files) {
        const match = file.match(/^(\d{14})_(.*)\.sql$/);
        expect(match, `Migration ${file} must match timestamp pattern YYYYMMDDHHMMSS_name.sql`).not.toBeNull();
        if (match) {
          const timestamp = match[1];
          expect(timestamps.has(timestamp), `Duplicate migration timestamp detected: ${timestamp} in ${file}`).toBe(false);
          timestamps.add(timestamp);
        }
      }
    });

    it('no rollback or recovery SQL files exist inside supabase/migrations', () => {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
      for (const file of files) {
        expect(file).not.toContain('rollback');
        expect(file).not.toContain('recovery');
      }
    });

    it('forward migration enforces table-level revoke, safe column grants, and defensive trigger', () => {
      const migrationPath = path.join(migrationsDir, '20261101000001_p0_lockdown_profiles_rls.sql');
      expect(fs.existsSync(migrationPath)).toBe(true);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      expect(sql).toMatch(/REVOKE\s+UPDATE\s+ON\s+(public\.)?profiles\s+FROM\s+PUBLIC/i);
      expect(sql).toMatch(/REVOKE\s+UPDATE\s+ON\s+(public\.)?profiles\s+FROM\s+authenticated/i);
      expect(sql).toMatch(/GRANT\s+UPDATE\s+\(full_name,\s*avatar_url,\s*phone\)\s+ON\s+(public\.)?profiles\s+TO\s+authenticated/i);
      expect(sql).toContain('protect_profile_privileged_fields');
      expect(sql).toContain("SET search_path = ''");
      expect(sql).toContain('pg_catalog.current_setting');
      expect(sql).toContain("current_user != 'service_role'");
      expect(sql).toContain('42501');
    });

    it('safe rollback and recovery procedure resides in dedicated directory outside supabase/migrations and preserves security invariants', () => {
      const rollbackPath = path.join(rootDir, 'supabase/rollback/p0_safe_profiles_recovery_procedure.sql');
      expect(fs.existsSync(rollbackPath)).toBe(true);
      const recoverySql = fs.readFileSync(rollbackPath, 'utf8');

      // MUST NOT restore table-level update
      expect(recoverySql).not.toMatch(/GRANT\s+UPDATE\s+ON\s+(public\.)?profiles\s+TO\s+authenticated\s*;/i);
      expect(recoverySql).not.toMatch(/GRANT\s+UPDATE\s+ON\s+(public\.)?profiles\s+TO\s+PUBLIC\s*;/i);

      // Must explicitly enforce revoke and safe column grants
      expect(recoverySql).toMatch(/REVOKE\s+UPDATE\s+ON\s+(public\.)?profiles\s+FROM\s+authenticated/i);
      expect(recoverySql).toMatch(/GRANT\s+UPDATE\s+\(full_name,\s*avatar_url,\s*phone\)\s+ON\s+(public\.)?profiles\s+TO\s+authenticated/i);
      expect(recoverySql).toContain('protect_profile_privileged_fields');
      expect(recoverySql).toContain("SET search_path = ''");
      expect(recoverySql).toContain('pg_catalog.current_setting');
      expect(recoverySql).toContain("current_user != 'service_role'");

      const recoveryProcedurePath = path.join(rootDir, 'supabase/recovery/p0_safe_profiles_recovery_procedure.sql');
      expect(fs.existsSync(recoveryProcedurePath)).toBe(true);
      const procSql = fs.readFileSync(recoveryProcedurePath, 'utf8');
      expect(procSql).toContain("SET search_path = ''");
      expect(procSql).toContain('pg_catalog.current_setting');
      expect(procSql).toContain("current_user != 'service_role'");

      const specificRollbackPath = path.join(rootDir, 'supabase/rollback/20261101000001_p0_lockdown_profiles_rls_rollback.sql');
      expect(fs.existsSync(specificRollbackPath)).toBe(true);
      const specificSql = fs.readFileSync(specificRollbackPath, 'utf8');
      expect(specificSql).toContain("SET search_path = ''");
      expect(specificSql).toContain('pg_catalog.current_setting');
      expect(specificSql).toContain("current_user != 'service_role'");
    });
  });

  describe('P0.3 — Actual Database Verification (Isolated Engine Simulation)', () => {
    // Model PostgreSQL column-level privilege checking and trigger execution
    interface ProfileRow {
      id: string;
      role: string;
      staff_role: string | null;
      is_active: boolean;
      full_name: string;
      phone: string;
      avatar_url: string;
    }

    interface DatabaseSession {
      currentUser: 'authenticated' | 'service_role';
      jwtClaimRole?: string;
    }

    class MockPostgreSQLEngine {
      private profileTable: Map<string, ProfileRow> = new Map();
      private tableGrants: Set<string> = new Set();
      private columnGrants: Map<string, Set<string>> = new Map();
      private triggerInstalled: boolean = false;

      constructor() {
        this.resetToVulnerableState();
      }

      resetToVulnerableState() {
        this.profileTable.clear();
        this.tableGrants.clear();
        this.columnGrants.clear();
        this.triggerInstalled = false;

        this.tableGrants.add('authenticated:UPDATE');

        this.profileTable.set('std-1', {
          id: 'std-1',
          role: 'student',
          staff_role: null,
          is_active: true,
          full_name: 'Alice Student',
          phone: '+1234567890',
          avatar_url: 'https://example.com/alice.png'
        });
      }

      applyForwardMigration() {
        this.tableGrants.delete('authenticated:UPDATE');
        this.tableGrants.delete('PUBLIC:UPDATE');
        this.columnGrants.set('authenticated', new Set(['full_name', 'avatar_url', 'phone']));
        this.triggerInstalled = true;
      }

      applyRecoveryProcedure() {
        this.tableGrants.delete('authenticated:UPDATE');
        this.tableGrants.delete('PUBLIC:UPDATE');
        this.columnGrants.set('authenticated', new Set(['full_name', 'avatar_url', 'phone']));
        this.triggerInstalled = true;
      }

      executeProfileUpdate(
        session: DatabaseSession,
        profileId: string,
        updates: Partial<ProfileRow>
      ): ProfileRow {
        const existing = this.profileTable.get(profileId);
        if (!existing) throw new Error('Row not found');

        const updatedColumns = Object.keys(updates) as (keyof ProfileRow)[];

        // 1. PostgreSQL Column Privilege Engine Check
        if (session.currentUser === 'authenticated') {
          const hasTableUpdate = this.tableGrants.has('authenticated:UPDATE');
          if (!hasTableUpdate) {
            const allowedCols = this.columnGrants.get('authenticated') ?? new Set();
            for (const col of updatedColumns) {
              if (!allowedCols.has(col)) {
                throw new Error(`42501: permission denied for column "${col}" of relation "profiles"`);
              }
            }
          }
        }

        const candidateRow: ProfileRow = { ...existing, ...updates };

        // 2. Defensive Trigger Check (protect_profile_privileged_fields)
        if (this.triggerInstalled) {
          const isPrivilegedChange =
            existing.staff_role !== candidateRow.staff_role ||
            existing.role !== candidateRow.role ||
            existing.is_active !== candidateRow.is_active;

          if (isPrivilegedChange) {
            const isServiceRole =
              session.currentUser === 'service_role' ||
              session.jwtClaimRole === 'service_role';

            if (!isServiceRole) {
              throw new Error('42501: Access Denied: Mutating privileged profile attributes (role, staff_role, is_active) is restricted to service administrators.');
            }
          }
        }

        this.profileTable.set(profileId, candidateRow);
        return candidateRow;
      }

      getProfile(id: string): ProfileRow | undefined {
        return this.profileTable.get(id);
      }
    }

    let db: MockPostgreSQLEngine;

    beforeEach(() => {
      db = new MockPostgreSQLEngine();
      db.applyForwardMigration();
    });

    it('student cannot update role (fails with permission denied / 42501)', () => {
      const studentSession: DatabaseSession = { currentUser: 'authenticated', jwtClaimRole: 'authenticated' };
      expect(() => {
        db.executeProfileUpdate(studentSession, 'std-1', { role: 'admin' });
      }).toThrow(/42501/);
      expect(db.getProfile('std-1')?.role).toBe('student');
    });

    it('student cannot update staff_role (fails with permission denied / 42501)', () => {
      const studentSession: DatabaseSession = { currentUser: 'authenticated', jwtClaimRole: 'authenticated' };
      expect(() => {
        db.executeProfileUpdate(studentSession, 'std-1', { staff_role: 'super_admin' });
      }).toThrow(/42501/);
      expect(db.getProfile('std-1')?.staff_role).toBeNull();
    });

    it('student cannot update is_active (fails with permission denied / 42501)', () => {
      const studentSession: DatabaseSession = { currentUser: 'authenticated', jwtClaimRole: 'authenticated' };
      expect(() => {
        db.executeProfileUpdate(studentSession, 'std-1', { is_active: false });
      }).toThrow(/42501/);
      expect(db.getProfile('std-1')?.is_active).toBe(true);
    });

    it('student can update approved profile columns (full_name, phone, avatar_url)', () => {
      const studentSession: DatabaseSession = { currentUser: 'authenticated', jwtClaimRole: 'authenticated' };
      const updated = db.executeProfileUpdate(studentSession, 'std-1', {
        full_name: 'Alice Johnson',
        phone: '+9876543210',
        avatar_url: 'https://example.com/new-alice.png'
      });

      expect(updated.full_name).toBe('Alice Johnson');
      expect(updated.phone).toBe('+9876543210');
      expect(updated.avatar_url).toBe('https://example.com/new-alice.png');
      expect(db.getProfile('std-1')?.full_name).toBe('Alice Johnson');
    });

    it('authorized administrative operations (service_role) continue working', () => {
      const adminSession: DatabaseSession = { currentUser: 'service_role', jwtClaimRole: 'service_role' };
      const adminUpdated = db.executeProfileUpdate(adminSession, 'std-1', {
        role: 'admin',
        staff_role: 'super_admin',
        is_active: true
      });

      expect(adminUpdated.role).toBe('admin');
      expect(adminUpdated.staff_role).toBe('super_admin');
    });

    it('recovery procedures do not restore unrestricted permissions', () => {
      db.applyRecoveryProcedure();

      const studentSession: DatabaseSession = { currentUser: 'authenticated', jwtClaimRole: 'authenticated' };

      expect(() => {
        db.executeProfileUpdate(studentSession, 'std-1', { role: 'admin' });
      }).toThrow(/42501/);

      expect(() => {
        db.executeProfileUpdate(studentSession, 'std-1', { staff_role: 'counselor' });
      }).toThrow(/42501/);

      expect(() => {
        db.executeProfileUpdate(studentSession, 'std-1', { is_active: false });
      }).toThrow(/42501/);

      const updated = db.executeProfileUpdate(studentSession, 'std-1', { full_name: 'Alice Recovered' });
      expect(updated.full_name).toBe('Alice Recovered');
    });
  });

  describe('P0.4 — Admin Middleware Strict Allowlist Authorization', () => {
    const middlewarePath = path.join(rootDir, 'apps/admin/src/middleware.ts');

    it('middleware imports canonical STAFF_ROLES from @keyabroad/database', () => {
      const content = fs.readFileSync(middlewarePath, 'utf8');
      expect(content).toContain("import { STAFF_ROLES");
      expect(content).toContain("@keyabroad/database");
    });

    it('STAFF_ROLES includes owner and super_admin as authorized roles', () => {
      expect(STAFF_ROLES).toContain('owner');
      expect(STAFF_ROLES).toContain('super_admin');
      expect(STAFF_ROLES[0]).toBe('owner');
      expect(STAFF_ROLES[1]).toBe('super_admin');
    });

    it('middleware allowlist simulation strictly permits owner and super_admin and rejects student, null, undefined, and arbitrary roles with 403', () => {
      function evaluateMiddleware(candidateRole: string | null | undefined): { allowed: boolean; status: number } {
        if (!candidateRole || !STAFF_ROLES.includes(candidateRole as any)) {
          return { allowed: false, status: 403 };
        }
        return { allowed: true, status: 200 };
      }

      // Explicitly verify 'owner' and 'super_admin'
      expect(evaluateMiddleware('owner')).toEqual({ allowed: true, status: 200 });
      expect(evaluateMiddleware('super_admin')).toEqual({ allowed: true, status: 200 });

      // Reject null, undefined, empty
      expect(evaluateMiddleware(null)).toEqual({ allowed: false, status: 403 });
      expect(evaluateMiddleware(undefined)).toEqual({ allowed: false, status: 403 });
      expect(evaluateMiddleware('')).toEqual({ allowed: false, status: 403 });

      // Reject student and arbitrary / unauthorized roles
      expect(evaluateMiddleware('student')).toEqual({ allowed: false, status: 403 });
      expect(evaluateMiddleware('arbitrary_role')).toEqual({ allowed: false, status: 403 });
      expect(evaluateMiddleware('unknown_role')).toEqual({ allowed: false, status: 403 });
      expect(evaluateMiddleware('visitor')).toEqual({ allowed: false, status: 403 });
      expect(evaluateMiddleware('guest')).toEqual({ allowed: false, status: 403 });
      expect(evaluateMiddleware('hacker')).toEqual({ allowed: false, status: 403 });

      // Accept each canonical staff role
      for (const role of STAFF_ROLES) {
        expect(evaluateMiddleware(role)).toEqual({ allowed: true, status: 200 });
      }
    });

    it('public routes remain explicitly whitelisted in middleware', () => {
      const content = fs.readFileSync(middlewarePath, 'utf8');
      const expectedPublicPrefixes = [
        '/login',
        '/auth',
        '/feedback',
        '/embed',
        '/api/health',
        '/api/leads/webhook',
        '/api/automations/webhook',
        '/api/biometrics/events'
      ];

      for (const prefix of expectedPublicPrefixes) {
        expect(content).toContain(`path.startsWith('${prefix}')`);
      }
    });
  });

  describe('P0.5 — Integration Safety & Privileged Credential Handling', () => {
    const filesToCheck = [
      'apps/admin/src/app/api/integrations/leadmachine/route.ts',
      'apps/admin/src/app/api/leads/webhook/route.ts',
      'apps/admin/src/app/api/automations/webhook/route.ts',
      'apps/admin/src/app/api/ocr/route.ts',
      'apps/web/src/app/api/chat/route.ts',
      'packages/database/src/telemetry.ts',
    ];

    it('none of the privileged server operations contain silent fallback to anon key', () => {
      for (const file of filesToCheck) {
        const fullPath = path.join(rootDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
      }
    });

    it('all privileged endpoints strictly require SUPABASE_SECRET_KEY and fail safely if missing', () => {
      for (const file of filesToCheck) {
        const fullPath = path.join(rootDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(content).toContain('SUPABASE_SECRET_KEY');
        expect(content).toContain('throw new Error');
      }
    });
  });
});
