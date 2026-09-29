/**
 * TypeScript Typings for Leadership Mutation & Position Assignment Engine
 * SILOKA Universitas Siliwangi
 */

export type AssignmentStatus = 'DEFINITIF' | 'PLT' | 'PLH';

export interface Position {
  id: string; // UUID
  position_code: string;
  name: string;
  unit_id: string;
  unit_name?: string;
  parent_unit_id?: string;
  faculty_id?: string;
  level?: string;
  can_sign_policy?: boolean;
  default_role_key: string;
  created_at?: string;
  current_occupant?: {
    assignment_id: string;
    user_id: string;
    nama_lengkap: string;
    nip: string;
    status: AssignmentStatus;
    decree_number: string;
    start_date: string;
  } | null;
}

export interface PositionAssignment {
  id: string; // UUID
  position_id: string;
  user_id: string;
  status: AssignmentStatus;
  decree_number: string;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  notes?: string | null;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface MutationPayload {
  targetUserId: string; // UUID or id_user or nip
  positionId: string; // UUID or position_code
  status: AssignmentStatus;
  decreeNumber: string; // e.g., 'SK Rektor No. 2803/UN58/OT/2023'
  startDate: string; // YYYY-MM-DD
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface MutationResult {
  success: boolean;
  message: string;
  mutation: {
    assignmentId: string;
    positionCode: string;
    positionName: string;
    newHolderId: string;
    previousHolderId: string | null;
    status: AssignmentStatus;
    decreeNumber: string;
    startDate: string;
  };
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor_id: string;
  target_user_id: string | null;
  details: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

