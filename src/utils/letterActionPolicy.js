/**
 * Policy & Capabilities Engine untuk Naskah Dinas & Disposisi SILOKA UNSIL
 * 
 * STRICT BUSINESS RULE ENFORCEMENT:
 * - IF a letter is sent with explicit purpose "Permohonan Tanda Tangan" (tujuan_aksi = 'TTD'),
 *   THEN the official MUST ONLY be given action to SIGN (Tanda Tangan) or REJECT/REVISE (Tolak/Revisi).
 * - CRITICAL RESTRICTION: The "Forward/Disposition" (Kirim Disposisi) feature MUST BE COMPLETELY
 *   DISABLED AND HIDDEN FROM THE DOM.
 */

import {
  isDosenTanpaJabatan,
  isLetterOwnedByUser,
  isMandiriPersonalDocument,
  isSuperAdminUser
} from './authGuards.js';
import { isDisposisiAuthorizedOfficial } from './disposisiStandards.js';

/**
 * Menentukan apakah naskah dinas merupakan permohonan tanda tangan (Tujuan TTD)
 * @param {object} letter 
 * @returns {boolean}
 */
export const isLetterSignatureRequest = (letter) => {
  if (!letter) return false;
  return Boolean(
    letter.tujuan_aksi === 'TTD' ||
    letter.tujuanAksi === 'TTD' ||
    letter.isSignatureRequest === true ||
    letter.tujuan_tanda_tangan === true ||
    (typeof letter.perihal === 'string' && letter.perihal.toLowerCase().startsWith('[permohonan tte]'))
  );
};

/**
 * Memeriksa apakah naskah dinas boleh didisposisikan
 * Sesuai Pasal 55 Peraturan Rektor No. 3/2023:
 * Disposisi adalah instrumen arahan kedinasan yang dikeluarkan eksklusif oleh Pimpinan (Rektor, Dekan, Kepala Biro/Unit).
 * Administrator Sistem (Super Admin), Operator, Pengawas, dan Staf tidak berwenang menerbitkan lembar disposisi.
 * 
 * @param {object} letter 
 * @param {object} currentUser 
 * @returns {boolean}
 */
export const canLetterBeDisposed = (letter, currentUser, allUsersList = null) => {
  if (!letter || !currentUser) return false;

  // 0. STRICT RULE: Naskah yang dibatalkan / dianulir DILARANG KERAS didisposisikan!
  if (letter.status === 'Dibatalkan' || letter.status === 'Dianulir' || letter.isDibatalkan) {
    return false;
  }

  // 1. STRICT RULE: Surat berstatus Permohonan Tanda Tangan (TTD) DILARANG KERAS didisposisikan!
  if (isLetterSignatureRequest(letter)) {
    return false;
  }

  // 2. Naskah yang sudah diarsipkan ke JRA tidak dapat didisposisikan kembali
  if (letter.status === 'Diarsipkan') {
    return false;
  }

  // 3. Super Admin adalah Administrator Sistem IT, bukan pejabat pemberi disposisi
  if (isSuperAdminUser(currentUser)) {
    return false;
  }

  // 4. Hanya Pejabat Struktural / Pimpinan (33 Pejabat di Contoh 21 + Rektor) yang berwenang
  return isDisposisiAuthorizedOfficial(currentUser, allUsersList);
};

/**
 * Memeriksa apakah pengguna berwenang mengentri / meregistrasi surat masuk
 * Aturan Birokrasi UNSIL:
 * - Hanya Staf Tata Usaha, Staf Persuratan, dan Operator Unit yang bertugas di loket penerimaan naskah masuk.
 * - Pimpinan (Rektor, Dekan, Kajur, Ka Lembaga) dan Pejabat Struktural DILARANG mengentri dari nol,
 *   mereka fokus menerima, menelaah isi naskah, dan menerbitkan arahan disposisi berjenjang.
 * - Dosen biasa dan Pengawas SPI bukan pengentri naskah masuk loket TU.
 * - Super Admin diperbolehkan khusus untuk kebutuhan pengujian / simulasi sistem.
 * 
 * @param {object} currentUser 
 * @returns {boolean}
 */
export const canUserRegisterIncomingLetter = (currentUser) => {
  if (!currentUser) return false;

  // Super Admin diperbolehkan untuk kebutuhan pengujian & simulasi
  if (
    currentUser?.is_super_admin === true ||
    currentUser?.role === 'Super Admin' ||
    currentUser?.role === 'SUPERADMIN'
  ) {
    return true;
  }

  // Pimpinan dan Pejabat Struktural DILARANG mengentri surat (fokus penelaahan & disposisi)
  if (
    currentUser?.is_pejabat === true ||
    currentUser?.role === 'PEJABAT' ||
    currentUser?.role === 'PIMPINAN' ||
    (currentUser?.roleLevel && currentUser.roleLevel.toLowerCase().includes('pimpinan'))
  ) {
    return false;
  }

  // Pengawas SPI dan Dosen biasa bukan petugas loket penerimaan TU
  if (
    currentUser?.role === 'PENGAWAS' ||
    currentUser?.role === 'DOSEN' ||
    isDosenTanpaJabatan(currentUser)
  ) {
    return false;
  }

  // Staf Tata Usaha / Operator Unit
  const isStaffOrOperator =
    currentUser?.role === 'STAF' ||
    currentUser?.role === 'STAF_PERSURATAN' ||
    currentUser?.role === 'OPERATOR_UNIT' ||
    currentUser?.role === 'OPERATOR' ||
    (currentUser?.roleLevel && currentUser.roleLevel.toLowerCase().includes('pelaksana')) ||
    (currentUser?.roleLevel && currentUser.roleLevel.toLowerCase().includes('staf'));

  return Boolean(isStaffOrOperator);
};

/**
 * Menghitung seluruh kapabilitas tindakan pengguna terhadap naskah dinas
 * @param {object} letter 
 * @param {object} currentUser 
 * @returns {object}
 */
export const getLetterActionCapabilities = (letter, currentUser) => {
  if (!letter) {
    return {
      isSignatureRequest: false,
      canDispose: false,
      canSign: false,
      canApprove: false,
      canReject: false,
      canArchive: false,
      canEditDraft: false
    };
  }

  const isSuratMasuk = letter.kategori === 'Surat Masuk' || letter.kategori === 'Inbound';
  const isSigReq = isLetterSignatureRequest(letter);
  const isCancelled = letter.status === 'Dibatalkan' || letter.status === 'Dianulir' || Boolean(letter.isDibatalkan);

  // Jika naskah berstatus Dibatalkan, seluruh tindakan (disposisi, tte, approval, revisi, arsip) terkunci mutlak
  if (isCancelled) {
    return {
      isSignatureRequest: false,
      canDispose: false,
      canSign: false,
      canApprove: false,
      canReject: false,
      canArchive: false,
      canEditDraft: false
    };
  }

  const canDispose = canLetterBeDisposed(letter, currentUser);

  // Super Admin adalah Administrator Sistem IT, BUKAN pejabat penandatangan tata usaha negara
  const isSuperAdmin = isSuperAdminUser(currentUser);

  const isPejabatOrPimpinan =
    !isSuperAdmin &&
    (currentUser?.role === 'PEJABAT' ||
      currentUser?.role === 'PIMPINAN' ||
      currentUser?.is_pejabat === true ||
      (currentUser?.roleLevel && currentUser.roleLevel.toLowerCase().includes('pimpinan')));

  const isAssignedSigner = Boolean(
    !isSuperAdmin &&
    letter.signerId &&
    currentUser?.pejabat_id &&
    String(letter.signerId) === String(currentUser.pejabat_id)
  );

  // Untuk Dosen Tanpa Jabatan (Strict Personal Isolation):
  // Hanya berwenang membubuhkan TTE pada naskah Mandiri (Nota Dinas, Laporan, Surat Pernyataan, Telaah Staf, Notula, Berita Acara)
  // yang dibuat oleh dirinya sendiri (creator_id = req.user.id).
  const isPersonalMandiriSigner = Boolean(
    isDosenTanpaJabatan(currentUser) &&
    isLetterOwnedByUser(letter, currentUser) &&
    isMandiriPersonalDocument(letter)
  );

  const hasSignerAuthority = (isPejabatOrPimpinan || isAssignedSigner || isPersonalMandiriSigner) && !isSuperAdmin;

  // Tanda Tangan BSrE:
  // - Pejabat berwenang (atau Dosen pada Naskah Mandiri miliknya)
  // - Surat Masuk TIDAK BOLEH ditandatangani TTE internal (Pasal 74: Surat masuk hanya alur penerimaan, pencatatan, pengarahan, penyampaian)
  // - Belum memiliki TTE sah, bukan arsip, dan bukan Draf mentah (harus sudah berstatus Diparaf atau DRAFT_MENUNGGU_PARAF atau Permohonan TTD)
  const canSign = Boolean(
    !isSuratMasuk &&
    hasSignerAuthority &&
    !letter.tteVerified &&
    letter.status !== 'Diarsipkan' &&
    (isPersonalMandiriSigner || (letter.status !== 'Draft' && letter.status !== 'Didisposisikan'))
  );

  // Approval Naskah: Pejabat menyetujui naskah yang diajukan (status DRAFT_MENUNGGU_PARAF atau Diparaf atau Dikirim)
  // Surat Masuk tidak melalui approval konsep
  const canApprove = Boolean(
    !isSuratMasuk &&
    hasSignerAuthority &&
    (letter.status === 'Dikirim' || letter.status === 'Diparaf' || letter.status === 'DRAFT_MENUNGGU_PARAF') &&
    letter.status !== 'Disetujui' &&
    letter.status !== 'Diarsipkan'
  );

  // Reject / Minta Revisi: Pejabat dapat mengembalikan surat dengan catatan revisi
  const canReject = Boolean(
    !isSuratMasuk &&
    hasSignerAuthority &&
    (letter.status === 'Dikirim' || letter.status === 'Diparaf' || letter.status === 'DRAFT_MENUNGGU_PARAF' || isSigReq) &&
    letter.status !== 'Diarsipkan' &&
    letter.status !== 'Ditolak'
  );

  // Arsip Digital JRA: Staf atau Pejabat dapat mengarsipkan jika sudah disetujui (atau Surat Masuk yang sudah selesai ditindaklanjuti)
  const canArchive = Boolean(
    (letter.status === 'Disetujui' || (isSuratMasuk && letter.status === 'Didisposisikan')) &&
    letter.status !== 'Diarsipkan'
  );

  // Edit Draf: Pengusul dapat menyunting naskah jika masih berstatus Draft atau Ditolak (Revisi)
  const canEditDraft = Boolean(
    letter.status === 'Draft' || letter.status === 'Ditolak'
  );

  return {
    isSignatureRequest: isSigReq,
    canDispose, // Wajib FALSE jika isSigReq === true
    canSign,
    canApprove,
    canReject,
    canArchive,
    canEditDraft
  };
};

/**
 * Menghitung tahap tracking progres (1 s.d. 5) untuk visual timeline
 * @param {object} letter 
 * @returns {object} { currentStep, stages }
 */
export const calculateLetterTracking = (letter) => {
  if (!letter) {
    return {
      currentStep: 1,
      stages: []
    };
  }

  const isSigReq = isLetterSignatureRequest(letter);

  const stages = [
    {
      id: 1,
      name: 'Diterima / Draf',
      desc: letter.tanggal ? `Registrasi pada ${letter.tanggal}` : 'Pencatatan naskah',
      isCompleted: true,
      isCurrent: letter.status === 'Draft'
    },
    {
      id: 2,
      name: 'Dibaca / Telaah',
      desc: 'Verifikasi staf administrasi',
      isCompleted: letter.status !== 'Draft',
      isCurrent: letter.status === 'Dikirim' || letter.status === 'Dibaca'
    },
    {
      id: 3,
      name: isSigReq ? 'Jalur Khusus TTD' : 'Didisposisikan',
      desc: isSigReq
        ? 'Dilewati: Jalur langsung TTE Pejabat'
        : letter.disposisi
        ? `Disposisi: ${letter.disposisi.targetUnit || letter.disposisi.tujuanDisposisi || 'Terkirim'}`
        : 'Menunggu instruksi pimpinan',
      isCompleted: isSigReq ? true : Boolean(letter.disposisi),
      isCurrent: !isSigReq && Boolean(letter.disposisi) && letter.status !== 'Disetujui' && letter.status !== 'Diarsipkan',
      isSkipped: isSigReq
    },
    {
      id: 4,
      name: 'Diparaf / Disetujui TTE',
      desc: letter.tteVerified
        ? 'TTE BSrE BSSN Sah'
        : letter.status === 'Disetujui'
        ? 'Disetujui Pimpinan'
        : letter.status === 'Diparaf'
        ? 'Diparaf berjenjang'
        : 'Menunggu tanda tangan pejabat',
      isCompleted: letter.status === 'Disetujui' || letter.tteVerified || letter.status === 'Diarsipkan',
      isCurrent: letter.status === 'Diparaf' || (letter.status === 'Dikirim' && isSigReq)
    },
    {
      id: 5,
      name: 'Selesai / Diarsipkan',
      desc: letter.status === 'Diarsipkan'
        ? 'Tersimpan di Arsip Dinamis (JRA)'
        : 'Siap diarsipkan ke JRA',
      isCompleted: letter.status === 'Diarsipkan',
      isCurrent: letter.status === 'Diarsipkan'
    }
  ];

  let currentStep = 1;
  if (letter.status === 'Diarsipkan') currentStep = 5;
  else if (letter.status === 'Disetujui' || letter.tteVerified) currentStep = 4;
  else if (letter.status === 'Diparaf') currentStep = 4;
  else if (letter.disposisi && !isSigReq) currentStep = 3;
  else if (letter.status === 'Dikirim' || letter.status === 'Dibaca') currentStep = 2;

  return {
    currentStep,
    stages
  };
};

