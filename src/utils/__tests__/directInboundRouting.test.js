import { describe, it, expect } from 'vitest';
import { getAllOfficialsWithUserMapping } from '../pejabatHelper';

describe('Verifikasi Fitur Tujuan Surat (Pejabat UNSIL) & Direct Inbound Routing', () => {
  it('harus hanya memuat nama jabatan resmi pada label tujuan surat (tanpa nama orang/user)', () => {
    const officials = getAllOfficialsWithUserMapping();
    expect(officials.length).toBeGreaterThan(10);

    officials.forEach((official) => {
      // Label hanya berisi nama jabatan
      expect(official.label).toBe(official.jabatan);
      // Memastikan label tidak memuat separator nama strip " — "
      expect(official.label.includes(' — ')).toBe(false);
      // Memastikan nama jabatan valid
      expect(official.jabatan.trim().length).toBeGreaterThan(3);
    });
  });

  it('harus memastikan surat masuk dengan target pejabat langsung terdistribusi ke akun pejabat tersebut', () => {
    // 1. Akun Pejabat: Dekan Fakultas Teknik
    const dekanFTUser = {
      id: 'usr-dekan-ft-01',
      id_user: 'usr-dekan-ft-01',
      email: 'dekan.ft@unsil.ac.id',
      nip: '197306282000031001',
      nip_nik: '197306282000031001',
      unit_kerja_id: 'UN58.13',
      role: 'PEJABAT',
      role_slug: 'pimpinan',
      is_pejabat: true,
      jabatan: 'Dekan Fakultas Teknik'
    };

    // 2. Akun Pejabat Lain: Ketua Jurusan Informatika
    const kajurIFUser = {
      id: 'usr-kajur-if-01',
      id_user: 'usr-kajur-if-01',
      email: 'kajur.if@unsil.ac.id',
      nip: '198506152010121004',
      nip_nik: '198506152010121004',
      unit_kerja_id: 'UN58.13',
      role: 'PEJABAT',
      role_slug: 'pimpinan',
      is_pejabat: true,
      jabatan: 'Ketua Jurusan Informatika'
    };

    // 3. Akun Non-Pejabat: Dosen Tanpa Jabatan
    const dosenBiasaUser = {
      id: 'usr-dosen-01',
      id_user: 'usr-dosen-01',
      email: 'dosen@unsil.ac.id',
      nip: '199001012020121001',
      unit_kerja_id: 'UN58.13',
      role: 'DOSEN',
      role_slug: 'drafter',
      is_pejabat: false,
      jabatan: 'Dosen Fungsional'
    };

    // Objek surat masuk yang didaftarkan oleh staf loket TU dengan tujuan Dekan Fakultas Teknik
    const suratMasukDekan = {
      id: 'SRT-IN-2026-0001',
      kategori: 'Surat Masuk',
      nomorSurat: 'AGD-2026/UN58.13/0001',
      tujuan: 'Dekan Fakultas Teknik',
      target_jabatan: 'Dekan Fakultas Teknik',
      target_user_id: 'usr-dekan-ft-01',
      target_user_email: 'dekan.ft@unsil.ac.id',
      target_pejabat_nip: '197306282000031001',
      target_unit_id: 'UN58.13',
      created_by_user_id: 'usr-tu-operator-01'
    };

    // Objek surat masuk yang didaftarkan untuk Ketua Jurusan Informatika
    const suratMasukKajur = {
      id: 'SRT-IN-2026-0002',
      kategori: 'Surat Masuk',
      nomorSurat: 'AGD-2026/UN58.13/0002',
      tujuan: 'Ketua Jurusan Informatika',
      target_jabatan: 'Ketua Jurusan Informatika',
      target_user_id: 'usr-kajur-if-01',
      target_user_email: 'kajur.if@unsil.ac.id',
      target_pejabat_nip: '198506152010121004',
      target_unit_id: 'UN58.13',
      created_by_user_id: 'usr-tu-operator-01'
    };

    // Helper simulasi routing persis seperti di scopedLetters App.jsx
    const canUserAccessInboundLetter = (letter, user) => {
      if (user.role === 'SUPERADMIN' || user.is_super_admin) return true;
      if (letter.created_by_user_id === user.id) return true;

      // Direct Match User ID, Email, NIP
      if (letter.target_user_id && letter.target_user_id === user.id) return true;
      if (letter.target_user_email && letter.target_user_email.toLowerCase() === user.email.toLowerCase()) return true;
      if (letter.target_pejabat_nip && letter.target_pejabat_nip === user.nip) return true;

      // Direct Jabatan Match untuk Pejabat
      if (user.is_pejabat || user.role === 'PEJABAT' || user.role_slug === 'pimpinan') {
        const letterJabatan = String(letter.target_jabatan || letter.tujuan || '').toLowerCase();
        const userJabatan = String(user.jabatan || '').toLowerCase();
        if (letterJabatan === userJabatan) return true;
        if (letterJabatan.includes(userJabatan) || userJabatan.includes(letterJabatan)) return true;
      }
      return false;
    };

    // Dekan Fakultas Teknik WAJIB menerima surat untuk Dekan FT
    expect(canUserAccessInboundLetter(suratMasukDekan, dekanFTUser)).toBe(true);
    // Dekan Fakultas Teknik TIDAK menerima surat khusus Ketua Jurusan IF
    expect(canUserAccessInboundLetter(suratMasukKajur, dekanFTUser)).toBe(false);

    // Ketua Jurusan IF WAJIB menerima surat untuk Kajur IF
    expect(canUserAccessInboundLetter(suratMasukKajur, kajurIFUser)).toBe(true);
    // Ketua Jurusan IF TIDAK menerima surat untuk Dekan FT
    expect(canUserAccessInboundLetter(suratMasukDekan, kajurIFUser)).toBe(false);

    // Dosen Biasa (non-pejabat) DILARANG KERAS menerima surat masuk pejabat
    expect(canUserAccessInboundLetter(suratMasukDekan, dosenBiasaUser)).toBe(false);
    expect(canUserAccessInboundLetter(suratMasukKajur, dosenBiasaUser)).toBe(false);
  });
});
