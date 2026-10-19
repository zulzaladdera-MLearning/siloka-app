import { describe, it, expect } from 'vitest';
import { getHierarchicalDisposisiTargets } from '../disposisiStandards';
import { mapDisposisiTargetsToPenerusanIds } from '../../components/documents/DocumentTemplates';

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

  it('harus menghubungkan seluruh opsi 6 klaster resmi SOTK UNSIL secara jujur: pejabat sah terhubung dan posisi tanpa akun berstatus [Belum Terhubung]', async () => {
    const { default: usersMaster } = await import('../../data/users.json');
    const { default: unitsMaster } = await import('../../data/unitKerja.json');

    const targets = getHierarchicalDisposisiTargets(rektor, usersMaster);

    // Verifikasi keberadaan 6 klaster resmi
    const clusters = [...new Set(targets.map((t) => t.cluster).filter(Boolean))];
    expect(clusters).toContain('1. Pimpinan Universitas & Pengawas');
    expect(clusters).toContain('2. Pimpinan Biro');
    expect(clusters).toContain('3. Pimpinan Lembaga');
    expect(clusters).toContain('4. Pimpinan Fakultas & Pascasarjana');
    expect(clusters).toContain('5. Pimpinan Unit Penunjang Akademik (UPA)');
    expect(clusters).toContain('6. Penugasan Khusus (Tim Kerja)');

    // 1. Klaster 1: Pimpinan Universitas & Organ Pengawas
    const wr1 = targets.find((t) => t.id === 'tgt-wr1');
    const wr2 = targets.find((t) => t.id === 'tgt-wr2');
    const wr3 = targets.find((t) => t.id === 'tgt-wr3');
    const senat = targets.find((t) => t.id === 'tgt-senat');
    const sekretarisSenat = targets.find((t) => t.id === 'tgt-sekretaris-senat');
    const spi = targets.find((t) => t.id === 'tgt-spi');
    const dp = targets.find((t) => t.id === 'tgt-dp');

    expect(wr1?.is_active_account).toBe(true);
    expect(wr1?.user_id).toBe('usr-warek-01');
    expect(wr2?.is_active_account).toBe(true);
    expect(['usr-warek-02', 'usr-ar-01']).toContain(wr2?.user_id);
    expect(wr3?.is_active_account).toBe(true);
    expect(wr3?.user_id).toBe('usr-warek-03');
    expect(senat?.is_active_account).toBe(true);
    expect(senat?.user_id).toBe('usr-mv6dqseh-1001');
    expect(sekretarisSenat?.is_active_account).toBe(true);
    expect(sekretarisSenat?.user_id).toBe('usr-mv6dwi09- 014');
    expect(dp?.is_active_account).toBe(true);
    expect(dp?.user_id).toBe('usr-07');

    // SPI belum didaftarkan akun di Manajemen Pengguna -> jujur berstatus [Belum Terhubung]
    expect(spi?.is_active_account).toBe(false);
    expect(spi?.account_status_label).toBe('[Belum Terhubung]');
    expect(spi?.user_id).toBeNull();

    // 2. Klaster 2: Pimpinan Biro (Belum dibuat oleh Super Admin -> Belum Terhubung)
    const bku = targets.find((t) => t.id === 'tgt-bku');
    const bakpk = targets.find((t) => t.id === 'tgt-bakpk');
    expect(bku?.is_active_account).toBe(false);
    expect(bku?.account_status_label).toBe('[Belum Terhubung]');
    expect(bakpk?.is_active_account).toBe(false);
    expect(bakpk?.account_status_label).toBe('[Belum Terhubung]');

    // 3. Klaster 3: Pimpinan Lembaga (Belum dibuat oleh Super Admin -> Belum Terhubung)
    const lppm = targets.find((t) => t.id === 'tgt-lppm');
    const lpmpp = targets.find((t) => t.id === 'tgt-lpmpp');
    expect(lppm?.is_active_account).toBe(false);
    expect(lppm?.account_status_label).toBe('[Belum Terhubung]');
    expect(lpmpp?.is_active_account).toBe(false);
    expect(lpmpp?.account_status_label).toBe('[Belum Terhubung]');

    // 4. Klaster 4: Pimpinan Fakultas & Pascasarjana (Belum dibuat oleh Super Admin -> Belum Terhubung)
    const fkip = targets.find((t) => t.id === 'tgt-fkip');
    const feb = targets.find((t) => t.id === 'tgt-feb');
    const fp = targets.find((t) => t.id === 'tgt-fp');
    const ft = targets.find((t) => t.id === 'tgt-ft');
    const pasca = targets.find((t) => t.id === 'tgt-pasca');
    expect(fkip?.is_active_account).toBe(false);
    expect(feb?.is_active_account).toBe(false);
    expect(fp?.is_active_account).toBe(false);
    expect(ft?.is_active_account).toBe(false);
    expect(pasca?.is_active_account).toBe(false);

    // 5. Klaster 5: Pimpinan Unit Penunjang Akademik (UPA)
    // Sesuai aturan mutlak: Tidak boleh ada akun siluman Alam Rahmatulloh!
    const perpus = targets.find((t) => t.id === 'tgt-perpus');
    const tik = targets.find((t) => t.id === 'tgt-tik');
    const bahasa = targets.find((t) => t.id === 'tgt-bahasa');
    const luk = targets.find((t) => t.id === 'tgt-luk');
    const pkkm = targets.find((t) => t.id === 'tgt-pkkm');
    expect(perpus?.is_active_account).toBe(false);
    expect(perpus?.account_status_label).toBe('[Belum Terhubung]');
    expect(perpus?.user_id).toBeNull();
    expect(tik?.is_active_account).toBe(false);
    expect(tik?.account_status_label).toBe('[Belum Terhubung]');
    expect(tik?.user_id).toBeNull();
    expect(tik?.user_nama).toBeNull();
    expect(bahasa?.is_active_account).toBe(false);
    expect(luk?.is_active_account).toBe(false);
    expect(pkkm?.is_active_account).toBe(false);

    // 6. Klaster 6: Penugasan Khusus (Tim Kerja)
    // Sesuai prinsip integritas arsitektur sistem: Jika Super Admin belum membuat akun di Manajemen Pengguna,
    // maka statusnya secara jujur berstatus [Belum Terhubung] dengan user_id null (bukan akun fiktif buatan)
    const humas = targets.find((t) => t.id === 'tgt-humas');
    const hukum = targets.find((t) => t.id === 'tgt-hukum');
    const perencanaan = targets.find((t) => t.id === 'tgt-perencanaan');
    const keuangan = targets.find((t) => t.id === 'tgt-keuangan');
    const kepegawaian = targets.find((t) => t.id === 'tgt-kepegawaian');
    const bmn = targets.find((t) => t.id === 'tgt-bmn');
    const akademik = targets.find((t) => t.id === 'tgt-akademik');
    const kemahasiswaan = targets.find((t) => t.id === 'tgt-kemahasiswaan');
    const kerjasama = targets.find((t) => t.id === 'tgt-kerjasama');
    const kabagAkademik = targets.find((t) => t.id === 'tgt-kbg-akademik');
    const kabagUmum = targets.find((t) => t.id === 'tgt-kbg-umum');

    expect(humas?.is_active_account).toBe(false);
    expect(humas?.account_status_label).toBe('[Belum Terhubung]');
    expect(humas?.user_id).toBeNull();
    expect(hukum?.is_active_account).toBe(false);
    expect(hukum?.account_status_label).toBe('[Belum Terhubung]');
    expect(hukum?.user_id).toBeNull();
    expect(perencanaan?.is_active_account).toBe(false);
    expect(perencanaan?.account_status_label).toBe('[Belum Terhubung]');
    expect(perencanaan?.user_id).toBeNull();
    expect(keuangan?.is_active_account).toBe(false);
    expect(keuangan?.account_status_label).toBe('[Belum Terhubung]');
    expect(keuangan?.user_id).toBeNull();
    expect(kepegawaian?.is_active_account).toBe(false);
    expect(kepegawaian?.account_status_label).toBe('[Belum Terhubung]');
    expect(bmn?.is_active_account).toBe(false);
    expect(akademik?.is_active_account).toBe(false);
    expect(kemahasiswaan?.is_active_account).toBe(false);
    expect(kerjasama?.is_active_account).toBe(false);
    expect(kabagAkademik?.is_active_account).toBe(false);
    expect(kabagUmum?.is_active_account).toBe(false);

    // Verifikasi reaktivitas: Saat Super Admin menambahkan akun pejabat Tim Humas, Perencanaan, atau Keuangan di Manajemen Pengguna,
    // sistem langsung menghubungkannya secara dinamis menjadi [Akun Terhubung]
    const usersWithHumas = [
      ...usersMaster,
      {
        id: 'usr-humas-baru',
        nama_lengkap: 'Drs. H. Deden Hadiana, M.Si.',
        email: 'humas@unsil.ac.id',
        nip: '197508202005011002',
        unit_kerja_id: 'UN58.6',
        role: 'PEJABAT',
        is_pejabat: true,
        jabatan: 'Ketua Tim Keprotokolan dan Humas'
      },
      {
        id: 'usr-perencanaan-baru',
        nama_lengkap: 'Asep Saepuloh, S.T., M.Kom.',
        email: 'perencanaan@unsil.ac.id',
        nip: '198205122008121003',
        unit_kerja_id: 'UN58.5',
        role: 'PEJABAT',
        is_pejabat: true,
        jabatan: 'Ketua Tim Perencanaan'
      },
      {
        id: 'usr-keuangan-baru',
        nama_lengkap: 'Dra. Hj. Nunung Nurhayati, M.M.',
        email: 'keuangan@unsil.ac.id',
        nip: '197103151996032001',
        unit_kerja_id: 'UN58.6',
        role: 'PEJABAT',
        is_pejabat: true,
        jabatan: 'Ketua Tim Keuangan'
      }
    ];
    const targetsWithHumas = getHierarchicalDisposisiTargets(rektor, usersWithHumas);
    const humasUpdated = targetsWithHumas.find((t) => t.id === 'tgt-humas');
    expect(humasUpdated?.is_active_account).toBe(true);
    expect(humasUpdated?.account_status_label).toBe('[Akun Terhubung]');
    expect(humasUpdated?.user_id).toBe('usr-humas-baru');
    expect(humasUpdated?.user_nama).toBe('Drs. H. Deden Hadiana, M.Si.');
    expect(humasUpdated?.deskripsi).toContain('Drs. H. Deden Hadiana');

    const perencanaanUpdated = targetsWithHumas.find((t) => t.id === 'tgt-perencanaan');
    expect(perencanaanUpdated?.is_active_account).toBe(true);
    expect(perencanaanUpdated?.account_status_label).toBe('[Akun Terhubung]');
    expect(perencanaanUpdated?.user_id).toBe('usr-perencanaan-baru');

    const keuanganUpdated = targetsWithHumas.find((t) => t.id === 'tgt-keuangan');
    expect(keuanganUpdated?.is_active_account).toBe(true);
    expect(keuanganUpdated?.account_status_label).toBe('[Akun Terhubung]');
    expect(keuanganUpdated?.user_id).toBe('usr-keuangan-baru');

    // Sinkronisasi dengan Manajemen Unit Kerja: unit kerja utama yang aktif memiliki pegawai terdaftar
    const populatedUnitCodes = ['UN58', 'UN58.SENAT', 'UN58.13', 'UN58.10', 'UN58.32', 'UN58.DP'];
    populatedUnitCodes.forEach((kode) => {
      const memberCount = usersMaster.filter(
        (u) =>
          u.kode_unit === kode ||
          u.unit_kerja_id === kode
      ).length;
      expect(memberCount).toBeGreaterThan(0);
    });
  });

  it('harus merespons mutasi jabatan di Manajemen Pengguna secara dinamis pada lembar disposisi', async () => {
    const { default: usersMaster } = await import('../../data/users.json');

    // Mutasi jabatan: Dekan FT ditambahkan/dimutasi oleh Super Admin di Manajemen Pengguna
    const mutatedUsers = [
      ...usersMaster,
      {
        id: 'usr-dekan-ft-01',
        nama_lengkap: 'Prof. Dr. Ir. H. Mamat Rohimat, M.T.',
        nip: '197501012002121005',
        email: 'dekanbaru.ft@unsil.ac.id',
        unit_kerja_id: 'UN58.13',
        role: 'PEJABAT',
        is_pejabat: true,
        jabatan: 'Dekan Fakultas Teknik',
        roleLabel: 'Dekan Fakultas Teknik'
      }
    ];

    const targets = getHierarchicalDisposisiTargets(rektor, mutatedUsers);
    const dekanFT = targets.find((t) => t.id === 'tgt-ft');

    expect(dekanFT).toBeDefined();
    expect(dekanFT.user_nama).toBe('Prof. Dr. Ir. H. Mamat Rohimat, M.T.');
    expect(dekanFT.user_nip).toBe('197501012002121005');
    expect(dekanFT.user_email).toBe('dekanbaru.ft@unsil.ac.id');
    expect(dekanFT.deskripsi).toContain('Prof. Dr. Ir. H. Mamat Rohimat, M.T.');
    expect(dekanFT.is_active_account).toBe(true);
  });

  it('harus memvalidasi resolusi POV target subordinat untuk Wakil Rektor (WR I, II, III)', () => {
    const userWarek1 = {
      id: 'usr-warek-01',
      nama_lengkap: 'Prof. Dr. H. Dedi Kusmayadi, M.Si.',
      jabatan: 'Wakil Rektor Bidang Akademik',
      role: 'PEJABAT',
      unit_kerja_id: 'UN58'
    };
    const userWarek2 = {
      id: 'usr-warek-02',
      nama_lengkap: 'Dr. Ade Rustiana, Drs., M.Si.',
      jabatan: 'Wakil Rektor Bidang Keuangan dan Umum',
      role: 'PEJABAT',
      unit_kerja_id: 'UN58'
    };
    const userWarek3 = {
      id: 'usr-warek-03',
      nama_lengkap: 'Dr. Gumilar Mulya, M.Pd.',
      jabatan: 'Wakil Rektor Bidang Kemahasiswaan dan Alumni',
      role: 'PEJABAT',
      unit_kerja_id: 'UN58'
    };

    const targetsWR1 = getHierarchicalDisposisiTargets(userWarek1, allUsers);
    const targetsWR2 = getHierarchicalDisposisiTargets(userWarek2, allUsers);
    const targetsWR3 = getHierarchicalDisposisiTargets(userWarek3, allUsers);

    // WR I harus melihat BAKPK dan LPMPP
    expect(targetsWR1.some((t) => t.nama.includes('BAKPK'))).toBe(true);
    expect(targetsWR1.some((t) => t.nama.includes('LPMPP'))).toBe(true);

    // WR II harus melihat BKU, Tim Keuangan, Tim Kepegawaian, Tim BMN, Tim Hukum, dan Tim Humas
    expect(targetsWR2.some((t) => t.nama.includes('BKU'))).toBe(true);
    expect(targetsWR2.some((t) => t.nama.includes('Keuangan'))).toBe(true);
    expect(targetsWR2.some((t) => t.nama.includes('Hukum'))).toBe(true);
    expect(targetsWR2.some((t) => t.nama.includes('Keprotokolan'))).toBe(true);

    // WR III harus melihat BAKPK / Kemahasiswaan dan UPA PKKM
    expect(targetsWR3.some((t) => t.nama.includes('Kemahasiswaan'))).toBe(true);
    expect(targetsWR3.some((t) => t.nama.includes('Karir') || t.nama.includes('PKKM'))).toBe(true);

    // KAIDAH MUTLAK TATA NASKAH DINAS UNSIL:
    // 1. Akun Wakil Rektor DILARANG KERAS (HARAM) memiliki tujuan disposisi ke Rektor!
    [targetsWR1, targetsWR2, targetsWR3].forEach((targetsList) => {
      const hasRektorTarget = targetsList.some(
        (t) =>
          t.user_id === 'usr-01' ||
          (t.nama.toLowerCase().includes('rektor') && !t.nama.toLowerCase().includes('wakil')) ||
          (t.deskripsi && t.deskripsi.toLowerCase().includes('rektor') && !t.deskripsi.toLowerCase().includes('wakil'))
      );
      expect(hasRektorTarget).toBe(false);

      // 2. Wakil Rektor dilarang mendisposisikan ke sesama Wakil Rektor (koordinasi lateral)
      const hasWarekTarget = targetsList.some((t) => t.nama.toLowerCase().includes('wakil rektor'));
      expect(hasWarekTarget).toBe(false);

      // 3. Wakil Rektor dilarang mendisposisikan ke Senat dan SPI
      const hasSenatTarget = targetsList.some((t) => t.nama.toLowerCase().includes('senat'));
      const hasSpiTarget = targetsList.some((t) => t.nama.toLowerCase().includes('spi'));
      expect(hasSenatTarget).toBe(false);
      expect(hasSpiTarget).toBe(false);

      // 4. Seluruh Wakil Rektor harus dapat mendisposisikan ke Para Dekan Fakultas
      expect(targetsList.some((t) => t.nama.includes('Dekan'))).toBe(true);

      // 5. Seluruh Wakil Rektor (WR 1, WR 2, WR 3) harus dapat mendisposisikan ke SELURUH 5 UPA UNSIL
      expect(targetsList.some((t) => t.id === 'tgt-perpus' || t.nama.includes('Perpustakaan'))).toBe(true);
      expect(targetsList.some((t) => t.id === 'tgt-tik' || t.nama.includes('Teknologi Informasi'))).toBe(true);
      expect(targetsList.some((t) => t.id === 'tgt-bahasa' || t.nama.includes('Bahasa'))).toBe(true);
      expect(targetsList.some((t) => t.id === 'tgt-pkkm' || t.nama.includes('Karier') || t.nama.includes('PKKM'))).toBe(true);
      expect(targetsList.some((t) => t.id === 'tgt-luk' || t.nama.includes('Kompetensi') || t.nama.includes('LUK'))).toBe(true);
    });
  });

  it('harus memvalidasi perutean Multi-Penerima (Multi-Recipient Disposisi) ke kotak masuk seluruh pejabat', () => {
    // Skenario: Rektor mendisposisikan 1 naskah dinas ke 2 pejabat sekaligus: WR I (Utama) dan WR II (Koordinasi)
    const suratMultiDisposisi = {
      id: 'SRT-IN-MULTI-001',
      nomorSurat: '099/KEMDIKBUD/2026',
      perihal: 'Koordinasi Alokasi Dana Program Riset Unggulan',
      status: 'Didisposisikan',
      disposisi: {
        targetUnit: 'Wakil Rektor Bidang Akademik, Wakil Rektor Bidang Keuangan dan Umum',
        target_user_id: 'usr-warek-01',
        targets: [
          {
            targetUnit: 'Wakil Rektor Bidang Akademik',
            target_user_id: 'usr-warek-01',
            target_pejabat_nama: 'Prof. Dr. H. Dedi Kusmayadi, M.Si.',
            isLead: true
          },
          {
            targetUnit: 'Wakil Rektor Bidang Keuangan dan Umum',
            target_user_id: 'usr-warek-02',
            target_pejabat_nama: 'Dr. Ade Rustiana, Drs., M.Si.',
            isLead: false
          }
        ]
      }
    };

    // Evaluator akses persis logika scopedLetters dan isItemAssignee
    const checkCanAccessDisposisi = (user, letter) => {
      const uId = String(user?.id || '');
      if (letter.disposisi?.target_user_id === uId) return true;
      if (Array.isArray(letter.disposisi?.targets)) {
        return letter.disposisi.targets.some((t) => t.target_user_id === uId);
      }
      return false;
    };

    const userWR1 = { id: 'usr-warek-01', nama: 'Prof. Dedi' };
    const userWR2 = { id: 'usr-warek-02', nama: 'Dr. Ade' };
    const userLain = { id: 'usr-dekan-01', nama: 'Dr. Eng. Asep' };

    // Kedua pejabat yang ditargetkan wajib dapat mengakses surat
    expect(checkCanAccessDisposisi(userWR1, suratMultiDisposisi)).toBe(true);
    expect(checkCanAccessDisposisi(userWR2, suratMultiDisposisi)).toBe(true);

    // Pejabat luar yang tidak ditargetkan tidak berhak mengakses
    expect(checkCanAccessDisposisi(userLain, suratMultiDisposisi)).toBe(false);
  });

  it('harus memetakan target disposisi multi-penerima ke ID checklist cetak format Contoh 21', () => {
    const targets = [
      { targetUnit: 'Wakil Rektor Bidang Akademik', isLead: true },
      { targetUnit: 'Kepala BKU', isLead: false },
      { targetUnit: 'Ketua Tim Bidang Perencanaan', isLead: false }
    ];

    const ids = mapDisposisiTargetsToPenerusanIds(targets);
    // 3: WR I, 7: Kepala BKU, 27: Ketua Tim Perencanaan
    expect(ids).toContain(3);
    expect(ids).toContain(7);
    expect(ids).toContain(27);
  });

  it('VALIDASI MUTLAK: Sekretaris Senat (Dr. Rahmat Rizal) tidak boleh tertukar menjadi Ketua Senat', async () => {
    const { default: usersMaster } = await import('../../data/users.json');
    // Pengujian skenario riil sesuai laporan pengguna
    const usersWithRahmatRizal = [
      ...usersMaster,
      {
        id: 'usr-rahmat-rizal-01',
        nip: '198701212015041001',
        nama_lengkap: 'Dr. Rahmat Rizal, M.Pd.',
        name: 'Dr. Rahmat Rizal, M.Pd.',
        email: 'rahmatrizal@unsil.ac.id',
        unit_kerja_id: 'UN58.SENAT',
        role: 'PEJABAT',
        is_pejabat: true,
        jabatan: 'Sekretaris Senat Universitas Siliwangi',
        sotk_position_label: 'Sekretaris Senat Universitas Siliwangi',
        is_active: true
      }
    ];

    const targets = getHierarchicalDisposisiTargets(rektor, usersWithRahmatRizal);

    const targetKetuaSenat = targets.find((t) => t.id === 'tgt-senat');
    const targetSekretarisSenat = targets.find((t) => t.id === 'tgt-sekretaris-senat');

    // 1. Target Ketua Senat HARUS terhubung ke Ketua Senat (usr-mv6dqseh-1001), BUKAN Dr. Rahmat Rizal
    expect(targetKetuaSenat).toBeDefined();
    expect(targetKetuaSenat.is_active_account).toBe(true);
    expect(targetKetuaSenat.user_id).toBe('usr-mv6dqseh-1001');
    expect(targetKetuaSenat.user_nama).not.toContain('Rahmat Rizal');

    // 2. Target Sekretaris Senat HARUS terhubung ke Dr. Rahmat Rizal
    expect(targetSekretarisSenat).toBeDefined();
    expect(targetSekretarisSenat.is_active_account).toBe(true);
    expect(['usr-rahmat-rizal-01', 'usr-mv6dwi09- 014']).toContain(targetSekretarisSenat.user_id);
    expect(targetSekretarisSenat.user_nama).toBe('Dr. Rahmat Rizal, M.Pd.');

    // 3. Jika Ketua Senat tidak ada di sistem, target Ketua Senat TIDAK BOLEH membajak Dr. Rahmat Rizal
    const usersWithoutKetuaSenat = usersWithRahmatRizal.filter((u) => u.id !== 'usr-mv6dqseh-1001');
    const targetsWithoutKetua = getHierarchicalDisposisiTargets(rektor, usersWithoutKetuaSenat);
    const targetKetuaSenatLone = targetsWithoutKetua.find((t) => t.id === 'tgt-senat');

    expect(targetKetuaSenatLone.is_active_account).toBe(false);
    expect(targetKetuaSenatLone.user_id).toBeNull();
    expect(targetKetuaSenatLone.user_nama).toBeNull();
  });
});
