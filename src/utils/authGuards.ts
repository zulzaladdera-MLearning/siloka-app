/**
 * Authentication & Authorization Guards (SILOKA UNSIL) - TypeScript definitions
 * Standardized Role-Based Access Control (RBAC) validation & canonical role normalization
 * Strictly adheres to Peraturan Rektor UNSIL No. 3/2023 & SK Rektor No. 2803/2023
 */

export type CanonicalRole = 
  | 'SUPER_ADMIN' 
  | 'REKTOR' 
  | 'WAREK'
  | 'DEKAN' 
  | 'WADEK'
  | 'KAPRODI' 
  | 'DOSEN_NON_JABATAN' 
  | 'DOSEN'
  | 'STAFF_TU' 
  | 'ARSIPARIS'
  | 'PENGAWAS';

export { normalizeRole, isSuperAdminUser, hasCanonicalRole } from './authGuards.js';

