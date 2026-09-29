import { describe, it, expect, vi } from 'vitest';
import {
  OTK_UNSIL_MASTER_UNITS,
  getAvailablePositionsByUnit,
  executeUnitMutationOrAssignment
} from '../../../../server/controllers/unitMutationController.js';
import { OTK_UNSIL_GROUPED_UNITS } from '../../admin/UnitMutationManager.jsx';

const createMockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = vi.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((payload) => {
    res.body = payload;
    return res;
  });
  return res;
};

describe('Mutasi Unit Kerja & Dependent SOTK Jabatan (tbl_master_jabatan & tbl_unit_jabatan_map)', () => {
  it('1. Memastikan seluruh 5 kategori struktur OTK UNSIL tersedia lengkap (Pimpinan, Biro, 7 Fakultas+Pasca, Lembaga LPPM/LPMPP, 5 UPA)', () => {
    expect(OTK_UNSIL_GROUPED_UNITS.length).toBe(5);
    const codes = OTK_UNSIL_MASTER_UNITS.map((u) => u.kode_unit);
    expect(codes).toEqual(
      expect.arrayContaining([
        'REKTORAT', 'SENAT', 'SPI', 'DEWAN_PENYANTUN',
        'BAKPK', 'BKU',
        'FKIP', 'FEB', 'FP', 'FT', 'FISIP', 'FIK', 'FAI', 'PASCA',
        'LPPM', 'LPMPP',
        'UPA_PERPUS', 'UPA_TIK', 'UPA_BAHASA', 'UPA_PKKM', 'UPA_LUK'
      ])
    );
  });

  it('2. Endpoint GET /api/v1/unit-kerja/:unit_id/jabatan-tersedia mengembalikan daftar jabatan baku khusus unit LPPM (11 jabatan), LPMPP (8 jabatan), dan Fakultas Teknik (FT)', async () => {
    const resLppm = createMockRes();
    await getAvailablePositionsByUnit({ params: { unit_id: 'LPPM' } }, resLppm);
    expect(resLppm.statusCode).toBe(200);
    const lppmNames = resLppm.body.data.map((j) => j.nama_jabatan);
    expect(lppmNames).toEqual([
      'Kepala LPPM',
      'Koordinator Pusat Penelitian',
      'Koordinator Pusat Pengabdian Kepada Masyarakat',
      'Kepala Pusat Penguatan Studi Literasi dan Publikasi Ilmiah, Hak Kekayaan Intelektual, Paten dan Sertifikat Produk',
      'Kepala Pusat Studi Halal',
      'Kepala Pusat Kerja Sama dan Alumni',
      'Kepala Pusat Manajemen Inovasi dan Inkubator Bisnis',
      'Kepala Pusat Kajian Pengembangan Teknologi, Informasi, Kolaborasi Industri dan Energi',
      'Kepala Pusat Gender, Disabilitas, dan Kesehatan',
      'Kepala Pusat Studi Bencana dan Lingkungan Hidup',
      'Kepala Pusat Pemberdayaan Masyarakat, Pembangunan dan Pengembangan Pedesaaan'
    ]);

    const resLpmpp = createMockRes();
    await getAvailablePositionsByUnit({ params: { unit_id: 'LPMPP' } }, resLpmpp);
    expect(resLpmpp.statusCode).toBe(200);
    const lpmppNames = resLpmpp.body.data.map((j) => j.nama_jabatan);
    expect(lpmppNames).toEqual([
      'Kepala',
      'Sekretaris',
      'Koordinator Pusat Penjaminan Mutu',
      'Koordinator Pusat Pengembangan Pembelajaran',
      'Kepala Pusat Audit Mutu Internal',
      'Kepala Pusat Inovasi Pembelajaran, Media Pembelajaran, e-learning, Sumber-sumber Belajar, dan Pengembangan Profesi',
      'Kepala Pusat Pendidikan Karakter, Bimbingan, Konseling, dan Layanan Psikologi',
      'Kepala Pusat Pengkajian dan Pengembangan Mata Kuliah Wajib Kurikulum (MKWK), dan Mata Kuliah Wajib Institusi (MKWI)'
    ]);

    const resFt = createMockRes();
    await getAvailablePositionsByUnit({ params: { unit_id: 'FT' } }, resFt);
    expect(resFt.statusCode).toBe(200);
    const ftNames = resFt.body.data.map((j) => j.nama_jabatan);
    expect(ftNames).toEqual(
      expect.arrayContaining([
        'Dekan',
        'Wakil Dekan Bidang Akademik dan Kemahasiswaan',
        'Wakil Dekan Bidang Keuangan dan Umum',
        'Ketua Jurusan Teknik Sipil',
        'Ketua Jurusan Teknik Elektro',
        'Ketua Jurusan Informatika',
        'Ketua Jurusan Sistem Informasi',
        'Ketua Jurusan Sains Data',
        'Sekretaris Jurusan Informatika',
        'Kepala Subbagian Umum Fakultas'
      ])
    );

    const resFkip = createMockRes();
    await getAvailablePositionsByUnit({ params: { unit_id: 'FKIP' } }, resFkip);
    expect(resFkip.statusCode).toBe(200);
    const fkipNames = resFkip.body.data.map((j) => j.nama_jabatan);
    expect(fkipNames).toEqual(
      expect.arrayContaining([
        'Dekan',
        'Wakil Dekan Bidang Akademik dan Kemahasiswaan',
        'Wakil Dekan Bidang Keuangan dan Umum',
        'Ketua Jurusan Pendidikan Masyarakat',
        'Ketua Jurusan Pendidikan Bahasa Indonesia',
        'Ketua Jurusan Pendidikan Matematika',
        'Ketua Jurusan Pendidikan Seni Pertunjukan',
        'Sekretaris Jurusan Pendidikan Bahasa Inggris',
        'Kepala Subbagian Umum Fakultas'
      ])
    );

    const resRektorat = createMockRes();
    await getAvailablePositionsByUnit({ params: { unit_id: 'REKTORAT' } }, resRektorat);
    expect(resRektorat.statusCode).toBe(200);
    expect(resRektorat.body.data.map((j) => j.nama_jabatan)).toEqual([
      'Rektor',
      'Wakil Rektor Bidang Akademik',
      'Wakil Rektor Bidang Keuangan dan Umum',
      'Wakil Rektor Bidang Kemahasiswaan dan Alumni'
    ]);
  });

  it('3. Menolak (HTTP 422 InvalidUnitPositionMapping) jika jabatan_tujuan_id tidak legal secara SOTK di unit tujuan (contoh: JBT_DEKAN pada unit LPPM)', async () => {
    const req = {
      user: { id: '1', nama: 'Super Admin SILOKA', role: 'Super Admin' },
      body: {
        id_pegawai: 'u-raka-101',
        nama_pegawai: 'Raka Ahmad Nur, S.T., M.Sc.',
        nip_pegawai: '19901122026',
        unit_asal_id: 'FT',
        unit_tujuan_id: 'LPPM',
        jabatan_tujuan_id: 'JBT_DEKAN', // Dekan tidak ada di LPPM!
        jenis_perubahan: 'Tugas Tambahan / Sekunder',
        nomor_sk: '842/UN58/KP.04.02/2026',
        tanggal_mulai: '2026-09-28'
      }
    };
    const res = createMockRes();
    await executeUnitMutationOrAssignment(req, res);

    expect(res.statusCode).toBe(422);
    expect(res.body.error).toBe('InvalidUnitPositionMapping');
  });

  it('4. Menolak (HTTP 422) pemilihan unit kerja tujuan yang sama dengan unit kerja asal (misal: FT -> FT)', async () => {
    const req = {
      user: { id: '1', nama: 'Super Admin SILOKA', role: 'Super Admin' },
      body: {
        id_pegawai: 'u-raka-101',
        nama_pegawai: 'Raka Ahmad Nur, S.T., M.Sc.',
        nip_pegawai: '19901122026',
        unit_asal_id: 'FT',
        unit_tujuan_id: 'FT',
        jabatan_tujuan_id: 'JBT_KAJUR',
        jenis_perubahan: 'Tugas Tambahan / Sekunder',
        nomor_sk: '842/UN58/KP.04.02/2026',
        tanggal_mulai: '2026-09-28'
      }
    };
    const res = createMockRes();
    await executeUnitMutationOrAssignment(req, res);

    expect(res.statusCode).toBe(422);
    expect(res.body.error).toBe('SameUnitConflict');
  });

  it('5. Mengeksekusi kasus penggunaan: Dosen Fakultas Teknik (FT) diberi Tugas Tambahan di LPPM dengan jabatan_tujuan_id JBT_KOOR_PUSLIT secara atomik', async () => {
    const req = {
      user: { id: '1', nama: 'Super Admin SILOKA', role: 'Super Admin' },
      body: {
        id_pegawai: 'u-raka-101',
        nama_pegawai: 'Raka Ahmad Nur, S.T., M.Sc.',
        nip_pegawai: '19901122026',
        unit_asal_id: 'FT',
        unit_tujuan_id: 'LPPM',
        jabatan_tujuan_id: 'JBT_KOOR_PUSLIT',
        jenis_perubahan: 'Tugas Tambahan / Sekunder',
        nomor_sk: '842/UN58/KP.04.02/2026',
        tanggal_mulai: '2026-09-28',
        tanggal_selesai: '2027-12-31'
      }
    };
    const res = createMockRes();
    await executeUnitMutationOrAssignment(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unit_asal_id).toBe('FT');
    expect(res.body.data.unit_tujuan_id).toBe('LPPM');
    expect(res.body.data.jabatan_tujuan_id).toBe('JBT_KOOR_PUSLIT');
    expect(res.body.data.jabatan_penugasan).toBe('Koordinator Pusat Penelitian');
    expect(res.body.data.jenis_perubahan).toBe('Tugas Tambahan / Sekunder');
    expect(res.body.data.rbac_five_mechanisms).toBeDefined();
  });

  it('6. Mengaktifkan 5 Mekanisme Context-Aware RBAC & Tupoksi Otomatis saat Dosen diangkat menjadi DEKAN FT (UN58.13) serta Auto-Expire ke DOSEN_BIASA saat SK berakhir', async () => {
    const reqActiveSk = {
      user: { id: '1', nama: 'Super Admin SILOKA', role: 'Super Admin' },
      body: {
        id_pegawai: 'u-dekan-ft',
        nama_pegawai: 'Prof. Dr. H. Iman Hidayat, M.T.',
        nip_pegawai: '198504122015041002',
        unit_asal_id: 'LPPM',
        unit_tujuan_id: 'FT',
        jabatan_tujuan_id: 'JBT_DEKAN',
        jenis_perubahan: 'Tugas Tambahan / Sekunder',
        nomor_sk: '901/UN58/OT/2026',
        tanggal_mulai: '2026-01-01',
        tanggal_selesai: '2028-12-31'
      }
    };
    const resActive = createMockRes();
    await executeUnitMutationOrAssignment(reqActiveSk, resActive);

    expect(resActive.statusCode).toBe(200);
    const rbac = resActive.body.data.rbac_five_mechanisms;
    expect(rbac.mekanisme_1_role_permission_matrix.active_role_key).toBe('DEKAN');
    expect(rbac.mekanisme_1_role_permission_matrix.templates_sign_authority).toContain('Peraturan / SE Dekan');
    expect(rbac.mekanisme_2_three_pillar_mapping.pilar_3_unit_kerja.kode_otk).toBe('UN58.13');
    expect(rbac.mekanisme_3_dynamic_workflow_routing.routing_query_sql).toContain("unit_kerja_id = 'UN58.13'");
    expect(rbac.mekanisme_4_specific_modules_activation.modul_tte_bsre.enabled).toBe(true);
    expect(rbac.mekanisme_4_specific_modules_activation.modul_e_disposisi.enabled).toBe(true);
    expect(
      rbac.mekanisme_4_specific_modules_activation.modul_klasifikasi_rahasia_skkaad.allowed_levels
    ).toEqual(['SR', 'R', 'T', 'B']);
    expect(rbac.mekanisme_5_context_switcher_and_sk.sk_auto_expiration.is_expired).toBe(false);

    // Simulasikan SK telah berakhir (Auto-Expiration kembali ke DOSEN_BIASA)
    const reqExpiredSk = {
      ...reqActiveSk,
      body: {
        ...reqActiveSk.body,
        tanggal_selesai: '2023-12-31'
      }
    };
    const resExpired = createMockRes();
    await executeUnitMutationOrAssignment(reqExpiredSk, resExpired);
    const rbacExpired = resExpired.body.data.rbac_five_mechanisms;
    expect(rbacExpired.mekanisme_5_context_switcher_and_sk.sk_auto_expiration.is_expired).toBe(true);
    expect(rbacExpired.mekanisme_1_role_permission_matrix.active_role_key).toBe('DOSEN_BIASA');
    expect(rbacExpired.mekanisme_4_specific_modules_activation.modul_tte_bsre.enabled).toBe(false);
  });
});

