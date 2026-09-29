/**
 * Automated Test Suite: Auth Guards & Role Normalization Engine
 * Tests strict RBAC isolation, Super Admin identification, and form decoupling
 * Universiti Siliwangi (UNSIL) - SILOKA Persuratan
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRole, isSuperAdminUser, hasCanonicalRole } from '../authGuards.js';
import { requireSuperAdmin, checkIsSuperAdmin } from '../../../server/middleware/authMiddleware.js';

describe('1. Role Normalization Engine (normalizeRole)', () => {
  it('should normalize standard canonical strings to UPPERCASE SNAKE_CASE', () => {
    assert.equal(normalizeRole('SUPER_ADMIN'), 'SUPER_ADMIN');
    assert.equal(normalizeRole('Super Admin'), 'SUPER_ADMIN');
    assert.equal(normalizeRole('super_admin'), 'SUPER_ADMIN');
    assert.equal(normalizeRole('super admin'), 'SUPER_ADMIN');
  });

  it('should clean parentheses and whitespace from complex role labels', () => {
    assert.equal(normalizeRole('Dosen (Non-Jabatan)'), 'DOSEN_NON_JABATAN');
    assert.equal(normalizeRole('Staf Administrasi Akademik'), 'STAF_ADMINISTRASI_AKADEMIK');
    assert.equal(normalizeRole('Staf-Keuangan'), 'STAF_KEUANGAN');
  });

  it('should safely handle empty, null, and undefined values', () => {
    assert.equal(normalizeRole(null), '');
    assert.equal(normalizeRole(undefined), '');
    assert.equal(normalizeRole(''), '');
    assert.equal(normalizeRole('   '), '');
  });
});

describe('2. Deterministic Super Admin Verification (isSuperAdminUser)', () => {
  it('should return true for all variations of Super Admin strings', () => {
    assert.equal(isSuperAdminUser({ role: 'SUPER_ADMIN' }), true);
    assert.equal(isSuperAdminUser({ role: 'Super Admin' }), true);
    assert.equal(isSuperAdminUser({ role: 'super_admin' }), true);
    assert.equal(isSuperAdminUser({ role: 'super admin' }), true);
    assert.equal(isSuperAdminUser({ role: 'SUPERADMIN' }), true);
  });

  it('should recognize role_key, role_name, or roleLabel aliases', () => {
    assert.equal(isSuperAdminUser({ role_key: 'SUPER_ADMIN' }), true);
    assert.equal(isSuperAdminUser({ role_name: 'Super Admin' }), true);
    assert.equal(isSuperAdminUser({ roleLabel: 'Super Admin' }), true);
  });

  it('should recognize numeric id_role === 1 as Super Admin regardless of string label', () => {
    assert.equal(isSuperAdminUser({ id_role: 1, role: 'Administrator' }), true);
    assert.equal(isSuperAdminUser({ id_role: '1' }), true);
  });

  it('should recognize boolean flags is_super_admin or isSuperAdmin', () => {
    assert.equal(isSuperAdminUser({ is_super_admin: true, role: 'STAFF' }), true);
    assert.equal(isSuperAdminUser({ isSuperAdmin: true }), true);
  });

  it('should recognize Super Admin in multi-role array', () => {
    assert.equal(isSuperAdminUser({ roles: ['DOSEN_NON_JABATAN', 'SUPER_ADMIN'] }), true);
    assert.equal(isSuperAdminUser({ roles: [{ name: 'Super Admin' }] }), true);
    assert.equal(isSuperAdminUser({ roles: [{ id_role: 1, name: 'Root' }] }), true);
  });

  it('should strictly return false for non-Super Admin users', () => {
    assert.equal(isSuperAdminUser({ role: 'DOSEN_NON_JABATAN', id_role: 7 }), false);
    assert.equal(isSuperAdminUser({ role: 'Dosen (Non-Jabatan)', id_role: 7 }), false);
    assert.equal(isSuperAdminUser({ role: 'Staf Keuangan', id_role: 2 }), false);
    assert.equal(isSuperAdminUser({ role: 'Dekan', id_role: 8 }), false);
    assert.equal(isSuperAdminUser({ role: 'Rektor', id_role: 8 }), false);
    assert.equal(isSuperAdminUser(null), false);
    assert.equal(isSuperAdminUser(undefined), false);
    assert.equal(isSuperAdminUser({}), false);
  });
});

describe('3. State Decoupling: Operator Session vs Form Target Role', () => {
  it('should NOT alter operator authorization when form selects Dosen (Non-Jabatan)', () => {
    const operatorSession = {
      id_user: 1,
      nama: 'Administrator Utama',
      email: 'admin@unsil.ac.id',
      role: 'Super Admin',
      id_role: 1
    };

    const targetFormData = {
      nama_lengkap: 'Raka Ahmad Nur, S.T., M.Sc.',
      nip_nik: '2001061520241211001',
      id_role: 7, // Dosen (Non-Jabatan)
      targetRole: 'DOSEN_NON_JABATAN',
      kode_unit_kerja: 'FT'
    };

    // The operator MUST remain authorized as Super Admin
    assert.equal(isSuperAdminUser(operatorSession), true);

    // The target user MUST evaluate to false (non-Super Admin)
    assert.equal(isSuperAdminUser(targetFormData), false);

    // Form selection must have ZERO impact on operator authorization status
    const isAuthorizedOperator = isSuperAdminUser(operatorSession);
    assert.equal(isAuthorizedOperator, true);
  });
});

describe('4. Backend Middleware Authorization (requireSuperAdmin)', () => {
  it('should allow Super Admin with Bearer superadmin-secret-token', () => {
    const req = {
      headers: {
        authorization: 'Bearer superadmin-secret-token'
      }
    };
    let nextCalled = false;
    const res = {
      status: () => res,
      json: () => res
    };
    const next = () => { nextCalled = true; };

    requireSuperAdmin(req, res, next);
    assert.equal(nextCalled, true);
    assert.equal(req.user.role, 'SUPER_ADMIN');
  });

  it('should protect Super Admin token even if form header sends x-user-role: DOSEN_NON_JABATAN', () => {
    const req = {
      headers: {
        authorization: 'Bearer superadmin-secret-token',
        'x-user-role': 'DOSEN_NON_JABATAN' // Accidental/target header
      }
    };
    let nextCalled = false;
    const res = {
      status: () => res,
      json: () => res
    };
    const next = () => { nextCalled = true; };

    requireSuperAdmin(req, res, next);
    // Super Admin Bearer token MUST take precedence and grant access
    assert.equal(nextCalled, true);
    assert.equal(req.user.role, 'SUPER_ADMIN');
  });

  it('should allow valid JWT payload containing Super Admin role', () => {
    const tokenPayload = { role: 'Super Admin', id_user: 1 };
    const base64 = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
    const req = {
      headers: {
        authorization: `Bearer siloka_jwt.${base64}.12345`
      }
    };
    let nextCalled = false;
    const res = {
      status: () => res,
      json: () => res
    };
    const next = () => { nextCalled = true; };

    requireSuperAdmin(req, res, next);
    assert.equal(nextCalled, true);
  });

  it('should reject non-Super Admin with HTTP 403 and exact Indonesian error message', () => {
    const req = {
      headers: {
        authorization: 'Bearer non-super-token',
        'x-user-role': 'DOSEN_NON_JABATAN'
      },
      user: {
        role: 'DOSEN_NON_JABATAN'
      }
    };
    let statusCode = null;
    let jsonBody = null;
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (body) => {
        jsonBody = body;
        return res;
      }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireSuperAdmin(req, res, next);
    assert.equal(nextCalled, false);
    assert.equal(statusCode, 403);
    assert.equal(
      jsonBody.message,
      'Akses terlarang. Modul Pengaturan Sistem hanya boleh diakses oleh role Super Admin.'
    );
  });
});

