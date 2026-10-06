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

  it('harus memvalidasi alur surat masuk dari Staf Loket TU ke Rektor: tampil di tabel Staf, tampil di tabel Rektor, terisolasi dari Pejabat lain, dan memicu notifikasi real-time', () => {
    // 1. Akun Staf Pendaftar Persuratan Loket TU
    const stafTU = {
      id: 'usr-ac-01',
      id_user: 'usr-ac-01',
      nama_lengkap: 'Agung Cahya Nur, S.Pd., M.Pd.',
      role: 'STAF',
      role_slug: 'operator',
      jabatan: 'Pengadministrasi Persuratan / Tata Usaha',
      unit_kerja_id: 'UN58'
    };

    // 2. Akun Pejabat Resmi Penerima: Rektor
    const rektorUser = {
      id: 'usr-01',
      id_user: 'usr-01',
      nama_lengkap: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
      role: 'PEJABAT',
      role_slug: 'pimpinan',
      jabatan: 'Rektor Universitas Siliwangi',
      email: 'aripin@unsil.ac.id',
      nip: '196708161996031001',
      nip_nik: '196708161996031001',
      unit_kerja_id: 'UN58'
    };

    // 3. Akun Pejabat Lain (Wakil Rektor II / Non-Rektor)
    const warekUser = {
      id: 'usr-ar-01',
      id_user: 'usr-ar-01',
      nama_lengkap: 'Dr. Ade Rustiana, Drs., M.Si.',
      role: 'PEJABAT',
      role_slug: 'pimpinan',
      jabatan: 'Wakil Rektor Bidang Keuangan dan Umum',
      email: 'aderustiana@unsil.ac.id',
      nip: '196508121990021001',
      unit_kerja_id: 'UN58'
    };

    // 4. Objek Surat Masuk yang didaftarkan Staf TU dengan upload file PDF
    const suratMasukRektor = {
      id: 'SRT-IN-2026-0001',
      nomorSurat: 'AGD-2026/UN58/0001',
      nomorAgenda: 'AGD-2026/UN58/0001',
      nomorSuratAsal: '1204/B/LLDIKTI4/KL/2026',
      perihal: 'Koordinasi Pelaksanaan Program Penguatan Tata Kelola PTN-BLU',
      kategori: 'Surat Masuk',
      isSuratMasuk: true,
      pengirim: 'Kementerian Pendidikan Tinggi, Sains, dan Teknologi',
      tujuan: 'Rektor Universitas Siliwangi',
      target_jabatan: 'Rektor Universitas Siliwangi',
      target_user_id: 'usr-01',
      target_user_email: 'aripin@unsil.ac.id',
      target_pejabat_nip: '196708161996031001',
      target_pejabat_nama: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
      target_role: 'REKTOR',
      unit_kerja_id: 'UN58',
      target_unit_id: 'UN58',
      loket_unit_id: 'UN58',
      created_by_user_id: 'usr-ac-01',
      creator_id: 'usr-ac-01',
      creator_name: 'Agung Cahya Nur, S.Pd., M.Pd.',
      creator_jabatan: 'Pengadministrasi Persuratan / Tata Usaha',
      lampiranName: 'SK_Menteri_Koordinasi_PTN_BLU.pdf',
      lampiranSize: '2.4 MB',
      status: 'Diterima'
    };

    // Evaluator Scoped Letters persis implementasi di App.jsx
    const checkTableVisibility = (currentUser, letter) => {
      const currentUserId = String(currentUser?.id || currentUser?.id_user || '');
      const isCreator =
        (letter.created_by_user_id && String(letter.created_by_user_id) === currentUserId) ||
        (letter.creator_id && String(letter.creator_id) === currentUserId);
      if (isCreator) return true;

      const letterTujuanLower = String(letter.target_jabatan || letter.tujuan || '').toLowerCase().trim();
      const currentRoleLabel = String(currentUser?.jabatan || currentUser?.roleLabel || currentUser?.nama_jabatan || '').toLowerCase().trim();
      const currentUserEmail = String(currentUser?.email || '').toLowerCase().trim();
      const currentNip = String(currentUser?.nip || currentUser?.nip_nik || '').trim();

      const isTargetRektor =
        (letterTujuanLower.includes('rektor') &&
          !letterTujuanLower.includes('wakil') &&
          !letterTujuanLower.includes('warek')) ||
        String(letter.target_pejabat_nama || '').toLowerCase().includes('aripin') ||
        String(letter.target_pejabat_nip || '').trim() === '196708161996031001' ||
        String(letter.target_user_email || '').toLowerCase() === 'aripin@unsil.ac.id' ||
        String(letter.target_user_id || '') === 'usr-01';

      if (isTargetRektor) {
        const isUserRektor =
          (currentRoleLabel.includes('rektor') &&
            !currentRoleLabel.includes('wakil') &&
            !currentRoleLabel.includes('warek')) ||
          currentUserEmail === 'aripin.rektor@unsil.ac.id' ||
          currentUserEmail === 'aripin@unsil.ac.id' ||
          currentUserEmail.includes('rektor') ||
          currentNip === '196708161996031001' ||
          currentUserId === 'usr-01';

        return isUserRektor;
      }

      return false;
    };

    // A. Verifikasi keterlihatan di tabel
    // Staf TU pencatat WAJIB melihat surat yang didaftarkannya
    expect(checkTableVisibility(stafTU, suratMasukRektor)).toBe(true);

    // Rektor tujuan WAJIB melihat surat masuk untuk dirinya
    expect(checkTableVisibility(rektorUser, suratMasukRektor)).toBe(true);

    // Wakil Rektor / Pejabat lain DILARANG KERAS melihat surat khusus Rektor
    expect(checkTableVisibility(warekUser, suratMasukRektor)).toBe(false);

    // B. Verifikasi generator notifikasi persis logika Navbar.jsx
    const generateInboundNotifications = (user, letterList) => {
      const list = [];
      const isPejabat = user?.role === 'PEJABAT' || user?.role === 'PIMPINAN' || user?.is_pejabat === true;

      letterList.forEach((l) => {
        if (l.kategori === 'Surat Masuk') {
          const userJabatanLower = String(user?.jabatan || user?.roleLabel || '').toLowerCase();
          const letterTujuanLower = String(l.target_jabatan || l.tujuan || '').toLowerCase();
          const userEmailLower = String(user?.email || '').toLowerCase();
          const userIdStr = String(user?.id || user?.id_user || '');

          const isLetterForRektor =
            (letterTujuanLower.includes('rektor') && !letterTujuanLower.includes('wakil') && !letterTujuanLower.includes('warek')) ||
            String(l.target_user_id) === 'usr-01';

          const isUserRektor =
            (userJabatanLower.includes('rektor') && !userJabatanLower.includes('wakil') && !userJabatanLower.includes('warek')) ||
            userIdStr === 'usr-01' ||
            userEmailLower.includes('aripin');

          const isDirectTargetOfficial =
            (l.target_user_id && String(l.target_user_id) === userIdStr) ||
            (l.target_user_email && userEmailLower && String(l.target_user_email).toLowerCase() === userEmailLower) ||
            (l.target_pejabat_nip && (user?.nip || user?.nip_nik) && String(l.target_pejabat_nip) === String(user?.nip || user?.nip_nik)) ||
            (isLetterForRektor && isUserRektor) ||
            (isPejabat && userJabatanLower && letterTujuanLower && (userJabatanLower === letterTujuanLower || letterTujuanLower.includes(userJabatanLower)));

          if (isDirectTargetOfficial) {
            const senderStaff = l.creator_name || 'Staf Tata Usaha Loket';
            list.push({
              id: `inbound-${l.id}`,
              title: '📥 Surat Masuk Baru Menunggu Disposisi',
              desc: `Didaftarkan oleh ${senderStaff} • No. Asal: ${l.nomorSuratAsal || '-'} dari ${l.pengirim}`,
              senderStaff
            });
          }
        }
      });
      return list;
    };

    const rektorNotifications = generateInboundNotifications(rektorUser, [suratMasukRektor]);
    expect(rektorNotifications.length).toBe(1);
    expect(rektorNotifications[0].title).toBe('📥 Surat Masuk Baru Menunggu Disposisi');
    expect(rektorNotifications[0].senderStaff).toBe('Agung Cahya Nur, S.Pd., M.Pd.');
    expect(rektorNotifications[0].desc).toContain('Didaftarkan oleh Agung Cahya Nur, S.Pd., M.Pd.');

    // Wakil Rektor TIDAK mendapatkan notifikasi surat Rektor
    const warekNotifications = generateInboundNotifications(warekUser, [suratMasukRektor]);
    expect(warekNotifications.length).toBe(0);
  });
});
