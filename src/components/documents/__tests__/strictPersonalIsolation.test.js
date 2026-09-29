import { describe, it, expect } from 'vitest';
import {
  isDosenTanpaJabatan,
  getQueueAccessPolicy,
  isLetterOwnedByUser,
  isMandiriPersonalDocument
} from '../../../utils/authGuards';
import { getLetterActionCapabilities } from '../../../utils/letterActionPolicy';

describe('Strict Personal Isolation (SKKAAD SK Rektor UNSIL No. 2803 Tahun 2023)', () => {
  const dosenA = {
    id: 'u-raka-101',
    id_user: 'u-raka-101',
    nama_lengkap: 'Raka Ahmad Nur, S.T., M.Sc.',
    nip_nik: '19901122026',
    email: 'raka@unsil.ac.id',
    role: 'DOSEN',
    roleLabel: 'Dosen Tanpa Jabatan',
    unit_kerja_id: 'UN58.13',
    is_pejabat: false
  };

  const dosenB = {
    id: 'u-aris-201',
    id_user: 'u-aris-201',
    nama_lengkap: 'Dr. Aris Martono, M.Kom.',
    nip_nik: '198504122015041002',
    email: 'aris.martono@unsil.ac.id',
    role: 'DOSEN_NON_JABATAN',
    roleLabel: 'Dosen Tanpa Jabatan',
    unit_kerja_id: 'UN58.13', // Sama-sama di Fakultas Teknik
    is_pejabat: false
  };

  const dekanFT = {
    id: 'u-dekan-ft',
    nama_lengkap: 'Prof. Dr. Eng. Ir. H. Imanudin, M.T.',
    role: 'PEJABAT',
    roleLabel: 'Dekan Fakultas Teknik',
    unit_kerja_id: 'UN58.13',
    is_pejabat: true
  };

  const stafTuFT = {
    id: 'u-tu-ft',
    nama_lengkap: 'Arif Hidayat, S.T.',
    role: 'ADMIN_UNIT',
    roleLabel: 'Operator Tata Usaha FT',
    unit_kerja_id: 'UN58.13',
    is_pejabat: false
  };

  const superAdmin = {
    id: 1,
    nama_lengkap: 'Super Admin SILOKA',
    role: 'Super Admin',
    id_role: 1
  };

  const draftNotaDinasDosenA = {
    id: 'ND-RAKA-01',
    nomorSurat: 'DRAFT/ND/FT/2026',
    perihal: 'Nota Dinas Usulan Honorarium & Praktikum oleh Raka',
    jenis_naskah: 'NOTA_DINAS',
    status: 'Diparaf',
    tteVerified: false,
    unit_kerja_id: 'UN58.13',
    creator_id: 'u-raka-101',
    creator_email: 'raka@unsil.ac.id',
    creator_name: 'Raka Ahmad Nur, S.T., M.Sc.'
  };

  const draftSuratTugasDosenA = {
    id: 'ST-RAKA-02',
    nomorSurat: '[Menunggu Penomoran TU]',
    perihal: 'Draft Konsep Surat Tugas Pemateri Seminar oleh Raka',
    jenis_naskah: 'SURAT_TUGAS',
    status: 'Diparaf',
    tteVerified: false,
    unit_kerja_id: 'UN58.13',
    creator_id: 'u-raka-101',
    creator_email: 'raka@unsil.ac.id',
    creator_name: 'Raka Ahmad Nur, S.T., M.Sc.'
  };

  it('1. Mengidentifikasi Dosen Tanpa Jabatan vs 3 Entitas Pengecualian Akses Massal', () => {
    expect(isDosenTanpaJabatan(dosenA)).toBe(true);
    expect(isDosenTanpaJabatan(dosenB)).toBe(true);
    expect(isDosenTanpaJabatan(dekanFT)).toBe(false);
    expect(isDosenTanpaJabatan(stafTuFT)).toBe(false);
    expect(isDosenTanpaJabatan(superAdmin)).toBe(false);

    expect(getQueueAccessPolicy(dosenA).mode).toBe('STRICT_PERSONAL_ISOLATION');
    expect(getQueueAccessPolicy(dosenA).canViewMassQueue).toBe(false);

    expect(getQueueAccessPolicy(dekanFT).mode).toBe('MASS_QUEUE_PIMPINAN');
    expect(getQueueAccessPolicy(dekanFT).canViewMassQueue).toBe(true);

    expect(getQueueAccessPolicy(stafTuFT).mode).toBe('MASS_QUEUE_TU_ARSIPARIS');
    expect(getQueueAccessPolicy(stafTuFT).canViewMassQueue).toBe(true);

    expect(getQueueAccessPolicy(superAdmin).mode).toBe('MASS_QUEUE_SUPER_ADMIN');
    expect(getQueueAccessPolicy(superAdmin).canViewMassQueue).toBe(true);
  });

  it('2. Mengisolasi ketat draf Dosen A dari Dosen B meskipun berada di Fakultas yang sama', () => {
    // Dosen A adalah pemilik sah drafnya sendiri
    expect(isLetterOwnedByUser(draftNotaDinasDosenA, dosenA)).toBe(true);
    // Dosen B DILARANG melihat draf milik Dosen A (false)
    expect(isLetterOwnedByUser(draftNotaDinasDosenA, dosenB)).toBe(false);
  });

  it('3. Mengizinkan Dosen A membubuhkan TTE pada Naskah Mandiri miliknya, dan memblokir Dosen B', () => {
    expect(isMandiriPersonalDocument(draftNotaDinasDosenA)).toBe(true);
    expect(isMandiriPersonalDocument(draftSuratTugasDosenA)).toBe(false);

    // Dosen A bisa TTE Nota Dinas miliknya sendiri
    expect(getLetterActionCapabilities(draftNotaDinasDosenA, dosenA).canSign).toBe(true);
    // Dosen B TIDAK bisa TTE Nota Dinas milik Dosen A
    expect(getLetterActionCapabilities(draftNotaDinasDosenA, dosenB).canSign).toBe(false);
    // Untuk Konsep Surat Tugas, TTE dilakukan oleh Dekan FT (bukan Dosen A sendiri)
    expect(getLetterActionCapabilities(draftSuratTugasDosenA, dosenA).canSign).toBe(false);
    expect(getLetterActionCapabilities(draftSuratTugasDosenA, dekanFT).canSign).toBe(true);
  });
});
