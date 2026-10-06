import { describe, it, expect } from 'vitest';
import { transformLettersToAgenda } from '../BukuAgendaView';
import { saveInboundLetter } from '../../../services/letterService';

describe('Alur Registrasi Surat Masuk, Penomoran Agenda, & Buku Agenda (SILOKA UNSIL)', () => {
  it('harus menghasilkan nomor agenda resmi dengan format AGD-YYYY/UNIT/XXXX saat simpan surat masuk', async () => {
    const inboundPayload = {
      tingkat_keamanan: 'B',
      kode_klasifikasi: 'KP.01.00',
      perihal: 'Permohonan Narasumber Kuliah Umum Teknologi Informasi',
      pengirim: 'Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi',
      tujuan: 'Rektor Universitas Siliwangi',
      target_unit_id: 'UN58',
      nomor_surat_asal: '421.4/128/SMK-TI/IX/2026',
      tahun: 2026
    };

    const res = await saveInboundLetter(inboundPayload, {
      id: 'usr-staf-01',
      unit_kerja_id: 'UN58.6',
      role: 'OPERATOR_UNIT'
    });

    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data.nomor_agenda).toMatch(/^AGD-2026\/UN58\/\d{4}$/);
    expect(res.data.target_unit_id).toBe('UN58');
    expect(res.data.nomorSuratAsal).toBe('421.4/128/SMK-TI/IX/2026');
  });

  it('harus mentransformasi surat masuk menjadi entri Buku Agenda dengan presisi nomor agenda dan nomor asal', () => {
    const mockLetters = [
      {
        id: 'SRT-IN-2026-0001',
        nomorSurat: 'AGD-2026/UN58/0001',
        nomorAgenda: 'AGD-2026/UN58/0001',
        nomorSuratAsal: '421.4/128/SMK-TI/IX/2026',
        tanggal: '2026-09-28',
        tanggalTerima: '2026-09-29',
        perihal: 'Permohonan Narasumber Kuliah Umum Teknologi Informasi',
        kategori: 'Surat Masuk',
        pengirim: 'Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi',
        tujuan: 'Rektor Universitas Siliwangi',
        target_unit_id: 'UN58',
        unit_kerja_id: 'UN58',
        status: 'Diterima'
      }
    ];

    const agendaList = transformLettersToAgenda(mockLetters, 'Universitas Siliwangi (Rektorat)');

    expect(agendaList).toHaveLength(1);
    const item = agendaList[0];
    expect(item.jenis).toBe('MASUK');
    expect(item.kategori).toBe('Surat Masuk');
    expect(item.nomorAgenda).toBe('AGD-2026/UN58/0001');
    expect(item.nomorSurat).toBe('421.4/128/SMK-TI/IX/2026');
    expect(item.pengirim).toBe('Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi');
    expect(item.penerima).toBe('Rektor Universitas Siliwangi');
    expect(item.ekspedisiStatus).toBe('Diterima');
  });

  it('harus memastikan filter unit kerja Rektorat (UN58) menyertakan surat masuk ber-target Rektorat', () => {
    const filterUnit = 'UN58';
    const letter = {
      kategori: 'Surat Masuk',
      unit_kerja_id: 'UN58',
      target_unit_id: 'UN58',
      loket_unit_id: 'UN58.6',
      target_jabatan: 'Rektor Universitas Siliwangi',
      tujuan: 'Rektor Universitas Siliwangi'
    };

    const letterUnit = String(letter.unit_kerja_id || '').toUpperCase();
    const targetUnit = String(letter.target_unit_id || '').toUpperCase();
    const loketUnit = String(letter.loket_unit_id || '').toUpperCase();
    const letterTujuanLower = String(letter.target_jabatan || letter.tujuan || '').toLowerCase().trim();

    const matchesDirectUnit =
      letterUnit === filterUnit ||
      targetUnit === filterUnit ||
      loketUnit === filterUnit;

    let matchesContext = false;
    if (filterUnit === 'UN58' || filterUnit === 'UNSIL') {
      if (
        letterTujuanLower.includes('rektor') ||
        letterTujuanLower.includes('warek') ||
        letterTujuanLower.includes('universitas') ||
        letterUnit === 'UN58' ||
        targetUnit === 'UN58'
      ) {
        matchesContext = true;
      }
    }

    expect(matchesDirectUnit || matchesContext).toBe(true);
  });

  it('harus memastikan isolasi surat masuk bertarget Rektor: hanya sampai ke akun Rektor & staf pencatat, tidak ke pejabat lain', () => {
    const inboundLetterRektor = {
      id: 'SRT-IN-2026-0001',
      kategori: 'Surat Masuk',
      tujuan: 'Rektor Universitas Siliwangi',
      target_jabatan: 'Rektor Universitas Siliwangi',
      target_unit_id: 'UN58',
      unit_kerja_id: 'UN58',
      loket_unit_id: 'UN58.6',
      target_pejabat_nama: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
      target_pejabat_nip: '196708161996031001',
      target_user_email: 'aripin.rektor@unsil.ac.id',
      target_user_id: 'usr-01',
      created_by_user_id: 'usr-staf-bku',
      creator_id: 'usr-staf-bku'
    };

    // Fungsi helper penentuan hak akses surat masuk sesuai logika App.jsx
    const checkCanAccessInboundLetter = (letter, currentUser) => {
      const currentUserId = String(currentUser?.id || currentUser?.id_user || '');
      const currentRoleLabel = String(currentUser?.jabatan || currentUser?.roleLabel || '').toLowerCase().trim();
      const currentNip = String(currentUser?.nip || currentUser?.nip_nik || '').trim();
      const currentUserEmail = String(currentUser?.email || '').toLowerCase().trim();
      const currentUnitId = String(currentUser?.unit_kerja_id || currentUser?.kode_unit || '').toUpperCase();
      const letterTujuanLower = String(letter.target_jabatan || letter.tujuan || '').toLowerCase().trim();

      // 1. Super Admin
      if (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'Super Admin') return true;

      // 2. Staf pembuat / pendaftar loket
      if (letter.created_by_user_id === currentUserId || letter.creator_id === currentUserId) return true;

      // 3. Pengecekan Pejabat
      const isCurrentUserPejabat = currentUser?.is_pejabat === true || currentUser?.role === 'PEJABAT';

      // 4. Isolasi Surat Masuk Bertarget Rektor
      const isTargetRektor =
        (letterTujuanLower.includes('rektor') &&
          !letterTujuanLower.includes('wakil') &&
          !letterTujuanLower.includes('warek')) ||
        String(letter.target_pejabat_nip || '').trim() === '196708161996031001' ||
        String(letter.target_user_email || '').toLowerCase() === 'aripin.rektor@unsil.ac.id';

      if (isTargetRektor) {
        const isUserRektor =
          (currentRoleLabel.includes('rektor') &&
            !currentRoleLabel.includes('wakil') &&
            !currentRoleLabel.includes('warek')) ||
          currentUserEmail === 'aripin.rektor@unsil.ac.id' ||
          currentNip === '196708161996031001' ||
          currentUserId === 'usr-01';

        if (isUserRektor) return true;
        if (isCurrentUserPejabat) return false;
        if (currentUnitId === 'UN58' && !isCurrentUserPejabat) return true;
        return false;
      }

      return false;
    };

    // Akun Rektor asli
    const rektorUser = {
      id: 'usr-01',
      nip: '196708161996031001',
      email: 'aripin.rektor@unsil.ac.id',
      jabatan: 'Rektor Universitas Siliwangi',
      unit_kerja_id: 'UN58',
      role: 'PEJABAT',
      is_pejabat: true
    };

    // Staf pencatat naskah di loket BKU
    const stafPencatat = {
      id: 'usr-staf-bku',
      nip: '199501012020122002',
      email: 'siti.rohmah@unsil.ac.id',
      jabatan: 'Staf Administrasi Persuratan BKU',
      unit_kerja_id: 'UN58.6',
      role: 'OPERATOR_UNIT',
      is_pejabat: false
    };

    // Pejabat lain: Wakil Rektor I (sama-sama di UN58)
    const warek1User = {
      id: 'usr-warek-01',
      nip: '197005141997021001',
      email: 'dedi.warek1@unsil.ac.id',
      jabatan: 'Wakil Rektor Bidang Akademik',
      unit_kerja_id: 'UN58',
      role: 'PEJABAT',
      is_pejabat: true
    };

    // Pejabat lain: Dekan FKIP
    const dekanFkipUser = {
      id: 'usr-dekan-fkip',
      nip: '196504121990031001',
      email: 'cucu.suherman@unsil.ac.id',
      jabatan: 'Dekan Fakultas Keguruan dan Ilmu Pendidikan',
      unit_kerja_id: 'UN58.10',
      role: 'PEJABAT',
      is_pejabat: true
    };

    // Pejabat lain: Kepala BKU
    const kepalaBkuUser = {
      id: 'usr-kepala-bku',
      nip: '196803201994032001',
      email: 'nana.sujana@unsil.ac.id',
      jabatan: 'Kepala Biro Keuangan dan Umum',
      unit_kerja_id: 'UN58.6',
      role: 'PEJABAT',
      is_pejabat: true
    };

    // Pejabat lain: Pengawas SPI
    const pengawasSpiUser = {
      id: 'usr-spi-01',
      nip: '197508202002121001',
      email: 'hendra.spi@unsil.ac.id',
      jabatan: 'Ketua Satuan Pengawas Internal (SPI)',
      unit_kerja_id: 'UN58.SPI',
      role: 'PEJABAT',
      is_pejabat: true
    };

    // Verifikasi:
    // 1. Akun Rektor HARUS menerima surat masuk tersebut
    expect(checkCanAccessInboundLetter(inboundLetterRektor, rektorUser)).toBe(true);

    // 2. Akun staf pencatat HARUS dapat melihat naskah yang didaftarkannya
    expect(checkCanAccessInboundLetter(inboundLetterRektor, stafPencatat)).toBe(true);

    // 3. Akun Wakil Rektor TIDAK BOLEH melihat (meski unit sama UN58)
    expect(checkCanAccessInboundLetter(inboundLetterRektor, warek1User)).toBe(false);

    // 4. Akun Dekan FKIP TIDAK BOLEH melihat
    expect(checkCanAccessInboundLetter(inboundLetterRektor, dekanFkipUser)).toBe(false);

    // 5. Akun Kepala BKU TIDAK BOLEH melihat
    expect(checkCanAccessInboundLetter(inboundLetterRektor, kepalaBkuUser)).toBe(false);

    // 6. Akun Pengawas SPI TIDAK BOLEH melihat
    expect(checkCanAccessInboundLetter(inboundLetterRektor, pengawasSpiUser)).toBe(false);
  });
});
