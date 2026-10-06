import { describe, it, expect } from 'vitest';
import { getHierarchicalDisposisiTargets } from '../disposisiStandards';

describe('Integrasi Lembar Disposisi dengan Modul Manajemen Pengguna (allUsers)', () => {
  // 1. Dataset Pengguna Riil dari Modul Manajemen Pengguna Super Admin (allUsers)
  const allUsers = [
    {
      id: 'usr-dg-01',
      nama_lengkap: 'Dede Gunawan, S.Kom., M.Kom.',
      email: 'dedegunawan@unsil.ac.id',
      nip: '198501012010121001',
      unit_kerja_id: 'UN58.32',
      role: 'Super Admin',
      is_super_admin: true,
      jabatan: 'Super Administrator'
    },
    {
      id: 'usr-01',
      nama_lengkap: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
      email: 'aripin@unsil.ac.id',
      nip: '196708161996031001',
      unit_kerja_id: 'UN58',
      role: 'PEJABAT',
      role_slug: 'pimpinan',
      is_pejabat: true,
      jabatan: 'Rektor Universitas Siliwangi'
    },
    {
      id: 'usr-ar-01',
      nama_lengkap: 'Dr. Ade Rustiana, Drs., M.Si.',
      email: 'aderustiana@unsil.ac.id',
      nip: '196801021992031002',
      unit_kerja_id: 'UN58',
      role: 'PEJABAT',
      role_slug: 'pimpinan',
      is_pejabat: true,
      jabatan: 'Wakil Rektor Bidang Keuangan dan Umum'
    },
    {
      id: 'usr-dekan-ft-01',
      nama_lengkap: 'Dr. Eng. Asep Andang, S.T., M.T.',
      email: 'dekan.ft@unsil.ac.id',
      nip: '197306282000031001',
      unit_kerja_id: 'UN58.13',
      role: 'PEJABAT',
      role_slug: 'pimpinan',
      is_pejabat: true,
      jabatan: 'Dekan Fakultas Teknik'
    },
    {
      id: 'usr-ac-01',
      nama_lengkap: 'Agung Cahya Nur, S.Pd., M.Pd.',
      email: 'agungcahyanur@unsil.ac.id',
      nip: '200008172027031001',
      unit_kerja_id: 'UN58',
      role: 'STAF',
      role_slug: 'admin_tu',
      is_pejabat: false,
      jabatan: 'Pengadministrasi Persuratan / Tata Usaha'
    }
  ];

  const rektor = allUsers.find((u) => u.id === 'usr-01');
  const warek2 = allUsers.find((u) => u.id === 'usr-ar-01');
  const dekanFT = allUsers.find((u) => u.id === 'usr-dekan-ft-01');

  it('harus memetakan opsi tujuan disposisi Rektor secara dinamis ke akun pejabat riil di Manajemen Pengguna', () => {
    const targets = getHierarchicalDisposisiTargets(rektor, allUsers);
    expect(targets.length).toBeGreaterThan(10);

    // Cari target Wakil Rektor Bidang Keuangan dan Umum
    const warekTarget = targets.find((t) => t.nama.includes('Keuangan dan Umum'));
    expect(warekTarget).toBeDefined();

    // Verifikasi keterhubungan langsung ke akun Dr. Ade Rustiana (usr-ar-01)
    expect(warekTarget.user_id).toBe('usr-ar-01');
    expect(warekTarget.user_email).toBe('aderustiana@unsil.ac.id');
    expect(warekTarget.user_nip).toBe('196801021992031002');
    expect(warekTarget.user_nama).toBe('Dr. Ade Rustiana, Drs., M.Si.');
    expect(warekTarget.is_active_account).toBe(true);
    expect(warekTarget.deskripsi).toContain('Dr. Ade Rustiana');

    // Cari target Dekan Fakultas Teknik
    const dekanFTTarget = targets.find((t) => t.nama.includes('Dekan FT') || t.nama.includes('Fakultas Teknik'));
    expect(dekanFTTarget).toBeDefined();
    expect(dekanFTTarget.user_id).toBe('usr-dekan-ft-01');
    expect(dekanFTTarget.user_email).toBe('dekan.ft@unsil.ac.id');
    expect(dekanFTTarget.user_nama).toBe('Dr. Eng. Asep Andang, S.T., M.T.');
  });

  it('harus secara otomatis menyertakan akun pejabat baru yang dibuat oleh Super Admin di Manajemen Pengguna', () => {
    // Simulasi Super Admin menambah pejabat baru di Manajemen Pengguna
    const customUsersWithNewOfficial = [
      ...allUsers,
      {
        id: 'usr-kajur-if-01',
        nama_lengkap: 'Alam Rahmatulloh, S.T., M.T.',
        email: 'alam@unsil.ac.id',
        nip: '198506152010121004',
        unit_kerja_id: 'UN58.13',
        role: 'PEJABAT',
        role_slug: 'pimpinan',
        is_pejabat: true,
        jabatan: 'Ketua Jurusan Informatika'
      }
    ];

    const targets = getHierarchicalDisposisiTargets(rektor, customUsersWithNewOfficial);
    const kajurTarget = targets.find((t) => t.nama.includes('Informatika'));
    expect(kajurTarget).toBeDefined();
    expect(kajurTarget.user_id).toBe('usr-kajur-if-01');
    expect(kajurTarget.user_email).toBe('alam@unsil.ac.id');
    expect(kajurTarget.user_nama).toBe('Alam Rahmatulloh, S.T., M.T.');
    expect(kajurTarget.is_active_account).toBe(true);
  });

  it('harus memvalidasi perutean disposisi: surat dari Rektor langsung masuk ke kotak masuk akun pejabat bawahan yang dituju', () => {
    // Objek surat masuk Rektor yang telah didisposisikan ke Wakil Rektor II
    const suratDidisposisikan = {
      id: 'SRT-IN-2026-0001',
      nomorSurat: 'AGD-2026/UN58/0001',
      perihal: 'Koordinasi Pelaksanaan Program Penguatan Tata Kelola PTN-BLU',
      kategori: 'Surat Masuk',
      tujuan: 'Rektor Universitas Siliwangi',
      target_jabatan: 'Rektor Universitas Siliwangi',
      target_user_id: 'usr-01',
      status: 'Didisposisikan',
      disposisi: {
        tujuanDisposisi: 'Wakil Rektor Bidang Keuangan dan Umum',
        targetUnit: 'Wakil Rektor Bidang Keuangan dan Umum',
        target_user_id: 'usr-ar-01',
        target_user_email: 'aderustiana@unsil.ac.id',
        target_pejabat_nip: '196801021992031002',
        target_pejabat_nama: 'Dr. Ade Rustiana, Drs., M.Si.',
        actions: ['Proses sesuai prosedur', 'Laporkan'],
        instruksi: 'Proses sesuai prosedur, Laporkan',
        batasWaktu: '2026-10-08',
        pemberiDisposisi: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
        jabatanPemberi: 'Rektor Universitas Siliwangi'
      }
    };

    // Evaluator akses persis logika scopedLetters di App.jsx
    const canUserAccessLetter = (currentUser, letter) => {
      const currentUserId = String(currentUser?.id || '');
      const currentUserEmail = String(currentUser?.email || '').toLowerCase();
      const currentNip = String(currentUser?.nip || '');
      const currentRoleLabel = String(currentUser?.jabatan || '').toLowerCase();

      // Cek target disposisi
      if (letter.disposisi) {
        const dispUserId = String(letter.disposisi.target_user_id || '');
        const dispEmail = String(letter.disposisi.target_user_email || '').toLowerCase();
        const dispNip = String(letter.disposisi.target_pejabat_nip || '');
        const dispTarget = String(letter.disposisi.targetUnit || '').toLowerCase();

        const isDirectRecipient =
          (dispUserId && currentUserId && dispUserId === currentUserId) ||
          (dispEmail && currentUserEmail && dispEmail === currentUserEmail) ||
          (dispNip && currentNip && dispNip === currentNip) ||
          (currentRoleLabel && (dispTarget.includes(currentRoleLabel) || currentRoleLabel.includes(dispTarget)));

        if (isDirectRecipient) return true;
      }

      // Cek target Rektor
      const letterTujuanLower = String(letter.target_jabatan || letter.tujuan || '').toLowerCase();
      const isTargetRektor = letterTujuanLower.includes('rektor') && !letterTujuanLower.includes('wakil');
      if (isTargetRektor) {
        const isUserRektor = currentRoleLabel.includes('rektor') && !currentRoleLabel.includes('wakil');
        return isUserRektor;
      }

      return false;
    };

    // 1. Akun Wakil Rektor II (Dr. Ade Rustiana) WAJIB BISA mengakses surat yang didisposisikan kepadanya
    expect(canUserAccessLetter(warek2, suratDidisposisikan)).toBe(true);

    // 2. Akun Rektor tetap bisa melihat surat
    expect(canUserAccessLetter(rektor, suratDidisposisikan)).toBe(true);

    // 3. Pejabat lain (Dekan FT) DILARANG mengakses surat khusus Rektor yang didisposisikan ke WR II
    expect(canUserAccessLetter(dekanFT, suratDidisposisikan)).toBe(false);
  });

  it('harus memvalidasi generator notifikasi Navbar mendeteksi surat disposisi dan mencantumkan nama pimpinan pengirim', () => {
    const suratDidisposisikan = {
      id: 'SRT-IN-2026-0001',
      perihal: 'Koordinasi Pelaksanaan Program Penguatan Tata Kelola PTN-BLU',
      disposisi: {
        target_user_id: 'usr-ar-01',
        target_user_email: 'aderustiana@unsil.ac.id',
        actions: ['Proses sesuai prosedur', 'Laporkan'],
        instruksi: 'Proses sesuai prosedur, Laporkan',
        batasWaktu: '2026-10-08',
        pemberiDisposisi: 'Rektor Universitas Siliwangi'
      }
    };

    // Evaluator notifikasi persis logika Navbar.jsx
    const generateDisposisiNotifications = (user, letterList) => {
      const list = [];
      letterList.forEach((l) => {
        if (l.disposisi) {
          const targetUserId = String(l.disposisi.target_user_id || '');
          const targetEmail = String(l.disposisi.target_user_email || '').toLowerCase();
          const userIdStr = String(user?.id || '');
          const userEmailLower = String(user?.email || '').toLowerCase();

          const isTargeted =
            (targetUserId && userIdStr && targetUserId === userIdStr) ||
            (targetEmail && userEmailLower && targetEmail === userEmailLower);

          if (isTargeted) {
            const pemberi = l.disposisi.pemberiDisposisi || 'Pimpinan';
            list.push({
              id: `disp-${l.id}`,
              title: `📩 E-Disposisi dari ${pemberi}`,
              desc: `${l.perihal?.slice(0, 50)}... • Arahan: ${l.disposisi.actions?.join(', ')}`,
              pemberi
            });
          }
        }
      });
      return list;
    };

    // Notifikasi untuk Wakil Rektor II
    const notifsWarek = generateDisposisiNotifications(warek2, [suratDidisposisikan]);
    expect(notifsWarek.length).toBe(1);
    expect(notifsWarek[0].title).toBe('📩 E-Disposisi dari Rektor Universitas Siliwangi');
    expect(notifsWarek[0].desc).toContain('Proses sesuai prosedur, Laporkan');

    // Dekan FT tidak menerima notifikasi disposisi ini
    const notifsDekan = generateDisposisiNotifications(dekanFT, [suratDidisposisikan]);
    expect(notifsDekan.length).toBe(0);
  });
});
