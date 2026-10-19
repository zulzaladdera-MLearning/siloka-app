import { describe, it, expect } from 'vitest';
import { fetchAvailableLetterTypes } from '../../../services/letterService';
import { isMandiriPersonalDocument, isDosenTanpaJabatan } from '../../../utils/authGuards';

describe('Pengelompokan 2 Kategori Naskah Dosen & Resolusi SSOT Penandatangan', () => {
  const mockDosen = {
    id: 'usr-dosen-ft',
    nama_lengkap: 'Dr. Aris Martono, S.T., M.Kom.',
    role: 'DOSEN',
    role_slug: 'drafter',
    is_pejabat: false,
    roleLabel: 'Dosen Jurusan Teknik Elektro',
    unit_kerja_id: 'UN58.13.1',
    kode_unit: 'UN58.13.1',
    unit_kerja_nama: 'Jurusan Teknik Elektro FT',
    nip: '198805212015041002'
  };

  const mockUsersSSOT = [
    {
      id: 'usr-kajur-01',
      nama_lengkap: 'Dr. Ir. Hendra Gunawan, M.T.',
      jabatan: 'Ketua Jurusan Teknik Elektro',
      kode_unit: 'UN58.13.1',
      nip: '197608122002121001',
      is_pejabat: true,
      role: 'PEJABAT'
    },
    {
      id: 'usr-dekan-01',
      nama_lengkap: 'Dr. Nurul Hiron, S.T., M.Eng.',
      jabatan: 'Dekan Fakultas Teknik',
      kode_unit: 'UN58.13',
      nip: '197306282000031001',
      is_pejabat: true,
      role: 'PEJABAT'
    },
    {
      id: 'usr-rektor-01',
      nama_lengkap: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
      jabatan: 'Rektor Universitas Siliwangi',
      kode_unit: 'UN58',
      nip: '196708161996031001',
      is_pejabat: true,
      role: 'PEJABAT'
    }
  ];

  it('1. Memastikan guard isDosenTanpaJabatan mengenali dosen fungsional tanpa jabatan struktural', () => {
    expect(isDosenTanpaJabatan(mockDosen)).toBe(true);
    expect(isDosenTanpaJabatan(mockUsersSSOT[0])).toBe(false); // Kajur bukan dosen non-jabatan
    expect(isDosenTanpaJabatan(mockUsersSSOT[1])).toBe(false); // Dekan bukan dosen non-jabatan
  });

  it('2. fetchAvailableLetterTypes mengembalikan 11 template naskah dosen dengan pemisahan Mandiri vs Draf', async () => {
    const res = await fetchAvailableLetterTypes(mockDosen, mockUsersSSOT);
    expect(res).toBeDefined();
    expect(res.types).toBeDefined();
    expect(res.types.length).toBe(11);

    const mandiriTypes = res.types.filter((t) => t.is_mandiri);
    const konsepTypes = res.types.filter((t) => !t.is_mandiri);

    expect(mandiriTypes.length).toBe(6);
    expect(konsepTypes.length).toBe(5);

    // Verifikasi 6 Naskah Mandiri
    const mandiriCodes = mandiriTypes.map((t) => t.kode_jenis_naskah);
    expect(mandiriCodes).toContain('NOTA_DINAS');
    expect(mandiriCodes).toContain('SURAT_PERNYATAAN');
    expect(mandiriCodes).toContain('LAPORAN');
    expect(mandiriCodes).toContain('TELAAH_STAF');
    expect(mandiriCodes).toContain('BERITA_ACARA');
    expect(mandiriCodes).toContain('NOTULA');

    // Verifikasi 5 Naskah Konsep / Draf Pimpinan
    const konsepCodes = konsepTypes.map((t) => t.kode_jenis_naskah);
    expect(konsepCodes).toContain('SURAT_TUGAS_LEMBAR');
    expect(konsepCodes).toContain('SURAT_TUGAS_KOLOM');
    expect(konsepCodes).toContain('SURAT_DINAS');
    expect(konsepCodes).toContain('SURAT_KETERANGAN');
    expect(konsepCodes).toContain('SURAT_PENGANTAR');
  });

  it('3. Naskah Mandiri menyediakan opsi Diri Sendiri (Default DOSEN_MANDIRI) dan Pejabat Terkait', async () => {
    const res = await fetchAvailableLetterTypes(mockDosen, mockUsersSSOT);
    const notaDinas = res.types.find((t) => t.kode_jenis_naskah === 'NOTA_DINAS');

    expect(notaDinas).toBeDefined();
    expect(notaDinas.is_mandiri).toBe(true);
    expect(notaDinas.can_choose_signatory).toBe(true);
    expect(notaDinas.available_signatories.length).toBeGreaterThanOrEqual(2);

    // Opsi pertama wajib Diri Sendiri (Dosen Pembuat)
    expect(notaDinas.available_signatories[0].role_penandatangan).toBe('DOSEN_MANDIRI');
    expect(notaDinas.available_signatories[0].nama_gelar).toBe(mockDosen.nama_lengkap);
    expect(notaDinas.available_signatories[0].nip).toBe(mockDosen.nip);
    expect(notaDinas.default_signatory_id).toBe(notaDinas.available_signatories[0].id);

    // Memuat opsi pejabat terkait (Kajur dan Dekan) jika isi naskah membutuhkan pengesahan atasan
    const hasKajur = notaDinas.available_signatories.some((s) => s.role_penandatangan === 'KETUA_JURUSAN');
    const hasDekan = notaDinas.available_signatories.some((s) => s.role_penandatangan === 'DEKAN');
    expect(hasKajur).toBe(true);
    expect(hasDekan).toBe(true);
  });

  it('4. Strict SSOT: Pejabat yang belum di-CRUD oleh Super Admin TIDAK MUNCUL di dropdown (Zero Mock/Fallback)', async () => {
    // Pada mockUsersSSOT, Super Admin HANYA mendaftarkan 3 akun: Kajur, Dekan, Rektor (Wadek 1 & Wadek 2 belum dibuat)
    const res = await fetchAvailableLetterTypes(mockDosen, mockUsersSSOT);
    const stLembar = res.types.find((t) => t.kode_jenis_naskah === 'SURAT_TUGAS_LEMBAR');

    expect(stLembar).toBeDefined();
    expect(stLembar.is_mandiri).toBe(false);
    expect(stLembar.can_choose_signatory).toBe(true);

    const signers = stLembar.available_signatories;
    // Wajib tepat 3 pejabat murni dari SSOT, tidak boleh ada inject fallback tiruan
    expect(signers.length).toBe(3);

    const hasKajur = signers.some((s) => s.role_penandatangan === 'KETUA_JURUSAN' && s.nama_gelar.includes('Hendra Gunawan'));
    const hasDekan = signers.some((s) => s.role_penandatangan === 'DEKAN' && s.nama_gelar.includes('Nurul Hiron'));
    const hasRektor = signers.some((s) => s.role_penandatangan === 'REKTOR' && s.nama_gelar.includes('Aripin'));
    const hasWadek1 = signers.some((s) => s.role_penandatangan === 'WAKIL_DEKAN_1');
    const hasWadek2 = signers.some((s) => s.role_penandatangan === 'WAKIL_DEKAN_2');

    expect(hasKajur).toBe(true);
    expect(hasDekan).toBe(true);
    expect(hasRektor).toBe(true);
    // Wadek 1 & Wadek 2 wajib TIDAK MUNCUL karena belum di-CRUD
    expect(hasWadek1).toBe(false);
    expect(hasWadek2).toBe(false);
  });

  it('4b. SSOT Lengkap: Ketika Super Admin mendaftarkan Wadek 1 dan Wadek 2, hierarki 5 pejabat lengkap terpetakan dengan delegasi mandat', async () => {
    const mockUsersSSOTLengkap = [
      ...mockUsersSSOT,
      {
        id: 'usr-wadek1-01',
        nama_lengkap: 'Dr. Ade Rustiana, Drs., M.Si.',
        jabatan: 'Wakil Dekan Bidang Akademik dan Kemahasiswaan Fakultas Teknik',
        kode_unit: 'UN58.13',
        nip: '196801021992031002',
        is_pejabat: true,
        role: 'PEJABAT'
      },
      {
        id: 'usr-wadek2-01',
        nama_lengkap: 'Dr. Ir. Nurul Hiron, S.T., M.M., M.Eng.',
        jabatan: 'Wakil Dekan Bidang Keuangan dan Umum Fakultas Teknik',
        kode_unit: 'UN58.13',
        nip: '197508192021211003',
        is_pejabat: true,
        role: 'PEJABAT'
      }
    ];

    const res = await fetchAvailableLetterTypes(mockDosen, mockUsersSSOTLengkap);
    const stLembar = res.types.find((t) => t.kode_jenis_naskah === 'SURAT_TUGAS_LEMBAR');

    expect(stLembar).toBeDefined();
    const signers = stLembar.available_signatories;
    expect(signers.length).toBe(5);

    const wadek1 = signers.find((s) => s.role_penandatangan === 'WAKIL_DEKAN_1');
    const wadek2 = signers.find((s) => s.role_penandatangan === 'WAKIL_DEKAN_2');
    expect(wadek1).toBeDefined();
    expect(wadek2).toBeDefined();

    // Format delegasi mandat Tata Naskah Dinas UNSIL (Pasal 45) untuk Wadek
    expect(wadek1.format_an).toContain('a.n. Dekan');
    expect(wadek1.format_an).toContain('Wakil Dekan Bidang Akademik');
    expect(wadek2.format_an).toContain('a.n. Dekan');
    expect(wadek2.format_an).toContain('Wakil Dekan Bidang Keuangan');
  });

  it('4c. Skenario Zero Official: Ketika belum ada pimpinan yang di-CRUD di Manajemen Pengguna', async () => {
    // Hanya ada akun dosen, belum ada satupun akun pimpinan/pejabat
    const mockZeroOfficialUsers = [mockDosen];
    const res = await fetchAvailableLetterTypes(mockDosen, mockZeroOfficialUsers);
    
    // Naskah Mandiri tetap dapat dibuat mandiri oleh Dosen
    const notaDinas = res.types.find((t) => t.kode_jenis_naskah === 'NOTA_DINAS');
    expect(notaDinas.available_signatories.length).toBe(1);
    expect(notaDinas.available_signatories[0].role_penandatangan).toBe('DOSEN_MANDIRI');
    expect(notaDinas.default_signatory_id).toBe(notaDinas.available_signatories[0].id);
    expect(notaDinas.available_signatories[0].id).toBe(`dosen-self-${mockDosen.id}`);

    // Naskah Draf Usulan Pimpinan aman (kosong dan tidak crash)
    const stLembar = res.types.find((t) => t.kode_jenis_naskah === 'SURAT_TUGAS_LEMBAR');
    expect(stLembar.available_signatories.length).toBe(0);
    expect(stLembar.can_choose_signatory).toBe(false);
    expect(stLembar.default_signatory).toBeNull();
    expect(stLembar.workflow_preview).toContain('Menunggu Penetapan Pejabat');
  });

  it('5. Helper isMandiriPersonalDocument konsisten membedakan kedua kelompok naskah', () => {
    // Mandiri
    expect(isMandiriPersonalDocument({ jenis_naskah: 'NOTA_DINAS' })).toBe(true);
    expect(isMandiriPersonalDocument({ templateId: 'laporan' })).toBe(true);
    expect(isMandiriPersonalDocument({ jenis_naskah: 'TELAAH_STAF' })).toBe(true);
    expect(isMandiriPersonalDocument({ templateId: 'pernyataan' })).toBe(true);
    expect(isMandiriPersonalDocument({ jenis_naskah: 'BERITA_ACARA' })).toBe(true);
    expect(isMandiriPersonalDocument({ jenis_naskah: 'NOTULA' })).toBe(true);

    // Konsep / Draf Pimpinan
    expect(isMandiriPersonalDocument({ jenis_naskah: 'SURAT_TUGAS_LEMBAR' })).toBe(false);
    expect(isMandiriPersonalDocument({ templateId: 'tugas' })).toBe(false);
    expect(isMandiriPersonalDocument({ jenis_naskah: 'SURAT_DINAS' })).toBe(false);
    expect(isMandiriPersonalDocument({ jenis_naskah: 'SURAT_KETERANGAN' })).toBe(false);
    expect(isMandiriPersonalDocument({ jenis_naskah: 'SURAT_PENGANTAR' })).toBe(false);
  });

  it('6. Anti-Slop: Teks penjelasan tidak mengekspos istilah teknis database atau kode internal kaku', async () => {
    const res = await fetchAvailableLetterTypes(mockDosen, mockUsersSSOT);
    res.types.forEach((t) => {
      const text = `${t.nama_jenis_naskah} ${t.catatan_kewenangan} ${t.badge_keterangan}`;
      expect(text).not.toMatch(/SELECT \* FROM/i);
      expect(text).not.toMatch(/tbl_users|tm_user/i);
      expect(text).not.toMatch(/is_pejabat|id_unit/i);
      expect(text).not.toMatch(/POSTGRES_ACID/i);
    });
  });

  it('7. Skenario Pascasarjana: Resolusi otomatis ke Koordinator Prodi, Wakil Direktur, dan Direktur Pascasarjana', async () => {
    const mockDosenPasca = {
      id: 'usr-dosen-pasca',
      nama_lengkap: 'Dr. Hj. Siti Rohmah, M.Si.',
      role: 'DOSEN',
      unit_kerja_id: 'UN58.17.1',
      kode_unit: 'UN58.17.1',
      unit_kerja_nama: 'Magister Manajemen Pascasarjana',
      nip: '198204122008012001'
    };

    const mockUsersPascaSSOT = [
      {
        id: 'usr-koorprodi-01',
        nama_lengkap: 'Dr. H. Ahmad Sudrajat, M.M.',
        jabatan: 'Koordinator Program Studi Magister Manajemen',
        kode_unit: 'UN58.17.1',
        nip: '197505102003121002',
        is_pejabat: true,
        role: 'PEJABAT'
      },
      {
        id: 'usr-wadir-01',
        nama_lengkap: 'Dr. Hj. Nina Herlina, M.Si.',
        jabatan: 'Wakil Direktur Pascasarjana',
        kode_unit: 'UN58.17',
        nip: '197203152000032001',
        is_pejabat: true,
        role: 'PEJABAT'
      },
      {
        id: 'usr-direktur-01',
        nama_lengkap: 'Prof. Dr. H. Iis Marwan, M.Pd.',
        jabatan: 'Direktur Program Pascasarjana',
        kode_unit: 'UN58.17',
        nip: '196503121990021001',
        is_pejabat: true,
        role: 'PEJABAT'
      }
    ];

    const res = await fetchAvailableLetterTypes(mockDosenPasca, mockUsersPascaSSOT);
    const stLembar = res.types.find((t) => t.kode_jenis_naskah === 'SURAT_TUGAS_LEMBAR');

    expect(stLembar).toBeDefined();
    const signers = stLembar.available_signatories;

    // Memastikan Koorprodi terpetakan dengan tepat
    const koorprodi = signers.find((s) => s.role_penandatangan === 'KETUA_JURUSAN');
    expect(koorprodi).toBeDefined();
    expect(koorprodi.display_role_label).toContain('Koordinator Program Studi');
    expect(koorprodi.nama_gelar).toContain('Ahmad Sudrajat');

    // Memastikan Wadir terpetakan dengan mandat a.n. Direktur
    const wadir = signers.find((s) => s.role_penandatangan === 'WAKIL_DEKAN_1');
    expect(wadir).toBeDefined();
    expect(wadir.display_role_label).toContain('Wakil Direktur Pascasarjana');
    expect(wadir.format_an).toContain('a.n. Direktur');

    // Memastikan Direktur terpetakan
    const direktur = signers.find((s) => s.role_penandatangan === 'DEKAN');
    expect(direktur).toBeDefined();
    expect(direktur.display_role_label).toContain('Direktur Program Pascasarjana');
    expect(direktur.nama_gelar).toContain('Iis Marwan');
  });
});
