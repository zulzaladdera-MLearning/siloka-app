import { describe, it, expect } from 'vitest';
import { isLetterSignatureRequest, canLetterBeDisposed } from '../letterActionPolicy';
import { getHierarchicalDisposisiTargets, isDisposisiAuthorizedOfficial } from '../disposisiStandards';

describe('Verifikasi Integritas Lembar Arahan Disposisi Pejabat (QuickDisposisiModal)', () => {
  const dekanFTUser = {
    id: 'usr-dekan-ft-01',
    nama_lengkap: 'Dr. Eng. Asep Andang, S.T., M.T.',
    email: 'dekan.ft@unsil.ac.id',
    nip: '197306282000031001',
    unit_kerja_id: 'UN58.13',
    unit: 'Fakultas Teknik',
    role: 'PEJABAT',
    role_slug: 'pimpinan',
    is_pejabat: true,
    jabatan: 'Dekan Fakultas Teknik'
  };

  const rektorUser = {
    id: 'usr-rektor-01',
    nama_lengkap: 'Prof. Dr. Ir. H. Nundang Busaeri, M.T., IPU., ASEAN Eng.',
    email: 'rektor@unsil.ac.id',
    nip: '196502201990031002',
    unit_kerja_id: 'UN58',
    unit: 'Universitas Siliwangi',
    role: 'PEJABAT',
    role_slug: 'pimpinan',
    is_pejabat: true,
    jabatan: 'Rektor'
  };

  const kajurIFUser = {
    id: 'usr-kajur-if-01',
    nama_lengkap: 'Alam Rahmatulloh, S.T., M.T.',
    email: 'kajur.if@unsil.ac.id',
    nip: '198506152010121004',
    unit_kerja_id: 'UN58.13',
    unit: 'Fakultas Teknik',
    role: 'PEJABAT',
    role_slug: 'pimpinan',
    is_pejabat: true,
    jabatan: 'Ketua Jurusan Informatika'
  };

  const suratMasukFT = {
    id: 'SRT-IN-FT-999',
    kategori: 'Surat Masuk',
    nomorSurat: '001/KOMINFO/IX/2026',
    nomorAgenda: 'AGD-2026/FT/0088',
    perihal: 'Permohonan Kerja Sama Riset AI dan Smart Campus',
    pengirim: 'Kementerian Komunikasi dan Digital',
    tujuan: 'Dekan Fakultas Teknik',
    sifat: 'Segera',
    status: 'Diterima'
  };

  const suratPermohonanTte = {
    id: 'DRAFT-TTE-001',
    kategori: 'Surat Keluar',
    perihal: 'Draft Surat Keputusan Dekan',
    tujuan_aksi: 'TTD',
    status: 'Diparaf'
  };

  it('harus memvalidasi bahwa pejabat berhak mendisposisikan surat masuk naskah dinas', () => {
    expect(canLetterBeDisposed(suratMasukFT, dekanFTUser)).toBe(true);
    expect(canLetterBeDisposed(suratMasukFT, rektorUser)).toBe(true);
    expect(canLetterBeDisposed(suratMasukFT, kajurIFUser)).toBe(true);
  });

  it('harus memblokir mutlak naskah permohonan TTE agar tidak didisposisikan', () => {
    expect(isLetterSignatureRequest(suratPermohonanTte)).toBe(true);
    expect(canLetterBeDisposed(suratPermohonanTte, dekanFTUser)).toBe(false);
  });

  it('harus menghasilkan daftar subordinat berjenjang yang tepat untuk Dekan Fakultas Teknik', () => {
    const targets = getHierarchicalDisposisiTargets(dekanFTUser);
    expect(targets.length).toBeGreaterThan(0);
    // Subordinat Dekan FT harus memuat Wakil Dekan dan Ketua Jurusan / KTU
    const hasWadek = targets.some((t) => t.nama.toLowerCase().includes('wakil dekan'));
    const hasKajur = targets.some((t) => t.nama.toLowerCase().includes('ketua jurusan') || t.nama.toLowerCase().includes('koordinator'));
    expect(hasWadek).toBe(true);
    expect(hasKajur).toBe(true);
  });

  it('harus menghasilkan daftar subordinat berjenjang yang tepat untuk Ketua Jurusan', () => {
    const targets = getHierarchicalDisposisiTargets(kajurIFUser);
    expect(targets.length).toBeGreaterThan(0);
    const hasSekjur = targets.some((t) => t.nama.toLowerCase().includes('sekretaris') || t.nama.toLowerCase().includes('laboratorium'));
    expect(hasSekjur).toBe(true);
  });
});
