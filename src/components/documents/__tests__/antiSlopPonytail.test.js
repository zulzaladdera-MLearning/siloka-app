import { describe, it, expect } from 'vitest';
import {
  sanitizeUiText,
  sanitizeErrorMessage,
  auditTextForSlop,
  todayIso,
  formatDateId
} from '../../../utils/antiSlopGuard';

describe('Anti-Slop & Ponytail Runtime Guard (SILOKA UNSIL)', () => {
  it('filters backend SQL, table names, and foreign key jargon from UI text', () => {
    const raw =
      "SELECT * FROM tbl_document_drafts WHERE pembuat_id = 'usr-1' (Dependent Dropdown) FK: JBT_FT_DEKAN";
    const cleaned = sanitizeUiText(raw);

    expect(cleaned).not.toContain('SELECT * FROM');
    expect(cleaned).not.toContain('tbl_document_drafts');
    expect(cleaned).not.toContain('Dependent Dropdown');
    expect(cleaned).toContain('Kode: JBT_FT_DEKAN');
  });

  it('replaces technical error codes and database exceptions with actionable user copy', () => {
    const rawErr = 'Error 500: Database transaction commit failed. Request query invalid.';
    expect(sanitizeErrorMessage(rawErr)).toBe(
      'Gagal menyimpan perubahan. Silakan periksa kembali kelengkapan data Anda.'
    );
  });

  it('audits strings and reports detected anti-slop violations', () => {
    const findings = auditTextForSlop('POSTGRES_ACID_COMMITTED pada tbl_users');
    expect(findings.length).toBeGreaterThanOrEqual(2);
  });

  it('provides ponytail native stdlib date helpers without external libraries', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(formatDateId('2026-09-29')).toContain('2026');
  });
});
