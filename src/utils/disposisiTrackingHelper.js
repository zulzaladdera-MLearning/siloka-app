/**
 * Helper Pelacakan Keterbacaan & Tanda Terima Disposisi (Delivery & Read Receipt Tracking)
 * Berdasarkan Prinsip Akuntabilitas Jabatan & Non-Repudiasi Tata Naskah Dinas UNSIL
 * (Peraturan Rektor No. 3 Tahun 2023)
 */

/**
 * Mengecek apakah pengguna saat ini adalah salah satu target penerima disposisi
 */
export const checkIfUserIsDisposisiTarget = (disposisi, user) => {
  if (!disposisi || !user) return false;

  const uId = String(user.id || user.id_user || '').toLowerCase().trim();
  const uEmail = String(user.email || user.username || '').toLowerCase().trim();
  const uNip = String(user.nip || user.nip_nik || '').replace(/\D/g, '').trim();
  const uUnitId = String(user.unit_kerja_id || user.kode_unit || '').toLowerCase().trim();
  const uUnitName = String(user.unit || user.nama_unit || '').toLowerCase().trim();
  const uJabatan = String(user.jabatan || user.roleLabel || user.sotk_position_label || '').toLowerCase().trim();

  // 1. Cek langsung field primer pada lembar disposisi
  const targetUserId = String(disposisi.target_user_id || '').toLowerCase().trim();
  const targetEmail = String(disposisi.target_user_email || '').toLowerCase().trim();
  const targetNip = String(disposisi.target_pejabat_nip || '').replace(/\D/g, '').trim();
  const targetUnit = String(disposisi.targetUnit || disposisi.tujuanDisposisi || disposisi.penerimaDisposisi || '').toLowerCase().trim();
  const targetJabatan = String(disposisi.target_jabatan || '').toLowerCase().trim();

  if (uId && targetUserId && uId === targetUserId) return true;
  if (uEmail && targetEmail && uEmail === targetEmail) return true;
  if (uNip && targetNip && uNip === targetNip) return true;

  // Cek kecocokan jabatan atau unit pada target primer
  if (uJabatan && targetJabatan && (targetJabatan.includes(uJabatan) || uJabatan.includes(targetJabatan))) return true;
  if (uJabatan && targetUnit && (targetUnit.includes(uJabatan) || (uJabatan.length > 5 && targetUnit.includes(uJabatan)))) return true;
  if (uUnitName && uUnitName.length > 4 && targetUnit && targetUnit.includes(uUnitName)) return true;
  if (uUnitId && targetUnit && targetUnit.includes(uUnitId)) return true;

  // 2. Cek dalam array targets (jika disposisi diteruskan ke beberapa pihak secara paralel)
  if (Array.isArray(disposisi.targets) && disposisi.targets.length > 0) {
    const matched = disposisi.targets.some((tgt) => {
      const tId = String(tgt.target_user_id || tgt.id || '').toLowerCase().trim();
      const tEmail = String(tgt.target_user_email || '').toLowerCase().trim();
      const tNip = String(tgt.target_pejabat_nip || '').replace(/\D/g, '').trim();
      const tUnit = String(tgt.targetUnit || tgt.nama || '').toLowerCase().trim();
      const tJabatan = String(tgt.target_jabatan || '').toLowerCase().trim();

      if (uId && tId && (uId === tId || tId.includes(uId))) return true;
      if (uEmail && tEmail && uEmail === tEmail) return true;
      if (uNip && tNip && uNip === tNip) return true;
      if (uJabatan && tJabatan && (tJabatan.includes(uJabatan) || uJabatan.includes(tJabatan))) return true;
      if (uJabatan && tUnit && (tUnit.includes(uJabatan) || (uJabatan.length > 5 && tUnit.includes(uJabatan)))) return true;
      if (uUnitName && uUnitName.length > 4 && tUnit && tUnit.includes(uUnitName)) return true;
      if (uUnitId && tUnit && tUnit.includes(uUnitId)) return true;

      return false;
    });

    if (matched) return true;
  }

  return false;
};

/**
 * Mengecek apakah pengguna saat ini sudah tercatat membaca disposisi
 */
export const checkIfUserHasReadDisposisi = (disposisi, user) => {
  if (!disposisi || !user) return false;

  const uId = String(user.id || user.id_user || '').toLowerCase().trim();
  const uNip = String(user.nip || user.nip_nik || '').replace(/\D/g, '').trim();
  const uEmail = String(user.email || user.username || '').toLowerCase().trim();

  // 1. Cek di daftar pembaca resmi (readers)
  if (Array.isArray(disposisi.readers) && disposisi.readers.length > 0) {
    const hasReadInList = disposisi.readers.some((r) => {
      const rId = String(r.userId || r.id || '').toLowerCase().trim();
      const rNip = String(r.nip || '').replace(/\D/g, '').trim();
      const rEmail = String(r.email || '').toLowerCase().trim();
      return (uId && rId === uId) || (uNip && rNip === uNip) || (uEmail && rEmail === uEmail);
    });
    if (hasReadInList) return true;
  }

  // 2. Cek di array targets spesifik
  if (Array.isArray(disposisi.targets) && disposisi.targets.length > 0) {
    const userTarget = disposisi.targets.find((tgt) => {
      const tId = String(tgt.target_user_id || tgt.id || '').toLowerCase().trim();
      const tNip = String(tgt.target_pejabat_nip || '').replace(/\D/g, '').trim();
      const tEmail = String(tgt.target_user_email || '').toLowerCase().trim();
      return (uId && tId === uId) || (uNip && tNip === uNip) || (uEmail && tEmail === uEmail);
    });
    if (userTarget && userTarget.isRead) {
      return true;
    }
  }

  // 3. Cek flag isRead utama jika pengguna adalah penerima tunggal
  if (disposisi.isRead) {
    const readNip = String(disposisi.readByNip || '').replace(/\D/g, '').trim();
    const readUserId = String(disposisi.readByUserId || '').toLowerCase().trim();
    if ((uNip && readNip === uNip) || (uId && readUserId === uId)) {
      return true;
    }
    // Jika tidak ada pembagian target dan sudah isRead: true, anggap sudah
    if (!disposisi.readers || disposisi.readers.length === 0) {
      return true;
    }
  }

  return false;
};

/**
 * Mengecek apakah pengguna saat ini sudah membuka/menelaah berkas fisik atau lampiran PDF naskah
 */
export const checkIfUserHasOpenedDocument = (disposisi, user) => {
  if (!disposisi || !user) return false;

  const uId = String(user.id || user.id_user || '').toLowerCase().trim();
  const uNip = String(user.nip || user.nip_nik || '').replace(/\D/g, '').trim();
  const uEmail = String(user.email || user.username || '').toLowerCase().trim();

  // 1. Cek di array readers
  if (Array.isArray(disposisi.readers) && disposisi.readers.length > 0) {
    const hasViewedInList = disposisi.readers.some((r) => {
      const rId = String(r.userId || r.id || '').toLowerCase().trim();
      const rNip = String(r.nip || '').replace(/\D/g, '').trim();
      const rEmail = String(r.email || '').toLowerCase().trim();
      const isUser = (uId && rId === uId) || (uNip && rNip === uNip) || (uEmail && rEmail === uEmail);
      return isUser && Boolean(r.documentViewedAt);
    });
    if (hasViewedInList) return true;
  }

  // 2. Cek di array targets spesifik
  if (Array.isArray(disposisi.targets) && disposisi.targets.length > 0) {
    const userTarget = disposisi.targets.find((tgt) => {
      const tId = String(tgt.target_user_id || tgt.id || '').toLowerCase().trim();
      const tNip = String(tgt.target_pejabat_nip || '').replace(/\D/g, '').trim();
      const tEmail = String(tgt.target_user_email || '').toLowerCase().trim();
      return (uId && tId === uId) || (uNip && tNip === uNip) || (uEmail && tEmail === uEmail);
    });
    if (userTarget && userTarget.documentViewedAt) {
      return true;
    }
  }

  // 3. Cek top-level documentViewedAt jika pembaca adalah user ini
  if (disposisi.documentViewedAt) {
    const readNip = String(disposisi.readByNip || '').replace(/\D/g, '').trim();
    const readUserId = String(disposisi.readByUserId || '').toLowerCase().trim();
    if ((uNip && readNip === uNip) || (uId && readUserId === uId)) {
      return true;
    }
    if (!disposisi.readers || disposisi.readers.length === 0) {
      return true;
    }
  }

  return false;
};

/**
 * Menandai disposisi sebagai telah dibaca oleh user tertentu (Non-Repudiasi - Tingkat 1)
 */
export const markDisposisiAsRead = (disposisi, user, customTimestamp = null) => {
  if (!disposisi || !user) return disposisi;

  const now = new Date();
  const timestamp = customTimestamp || (
    now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' +
    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    ' WIB'
  );

  const userName = user.nama_lengkap || user.name || 'Pejabat Penerima';
  const userNip = user.nip || user.nip_nik || '-';
  const userJabatan = user.jabatan || user.roleLabel || user.sotk_position_label || 'Penerima Disposisi';
  const userId = user.id || user.id_user || null;

  const currentReaders = Array.isArray(disposisi.readers) ? [...disposisi.readers] : [];
  const readerExists = currentReaders.some(
    (r) => (r.userId && r.userId === userId) || (r.nip && userNip !== '-' && r.nip === userNip)
  );

  if (!readerExists) {
    currentReaders.push({
      userId,
      name: userName,
      nip: userNip,
      jabatan: userJabatan,
      readAt: timestamp
    });
  }

  // Perbarui array targets jika ada
  let updatedTargets = disposisi.targets;
  if (Array.isArray(disposisi.targets) && disposisi.targets.length > 0) {
    const uId = String(userId || '').toLowerCase().trim();
    const uNip = String(userNip || '').replace(/\D/g, '').trim();
    const uJab = String(userJabatan || '').toLowerCase().trim();

    updatedTargets = disposisi.targets.map((tgt) => {
      const tId = String(tgt.target_user_id || tgt.id || '').toLowerCase().trim();
      const tNip = String(tgt.target_pejabat_nip || '').replace(/\D/g, '').trim();
      const tJab = String(tgt.target_jabatan || tgt.targetUnit || '').toLowerCase().trim();

      const isMatch = (uId && tId === uId) || (uNip && tNip === uNip) || (uJab && tJab && (tJab.includes(uJab) || uJab.includes(tJab)));
      if (isMatch) {
        return {
          ...tgt,
          isRead: true,
          readAt: tgt.readAt || timestamp,
          readBy: tgt.readBy || userName,
          readByNip: tgt.readByNip || userNip
        };
      }
      return tgt;
    });
  }

  return {
    ...disposisi,
    isRead: true,
    readAt: disposisi.readAt || timestamp,
    readBy: disposisi.readBy || userName,
    readByNip: disposisi.readByNip || userNip,
    readByJabatan: disposisi.readByJabatan || userJabatan,
    readByUserId: disposisi.readByUserId || userId,
    readers: currentReaders,
    targets: updatedTargets
  };
};

/**
 * Menandai berkas fisik / PDF naskah disposisi telah dibuka oleh user tertentu (Non-Repudiasi - Tingkat 2)
 */
export const markDisposisiDocumentViewed = (disposisi, user, customTimestamp = null) => {
  if (!disposisi || !user) return disposisi;

  const now = new Date();
  const timestamp = customTimestamp || (
    now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' +
    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    ' WIB'
  );

  const userName = user.nama_lengkap || user.name || 'Pejabat Penerima';
  const userNip = user.nip || user.nip_nik || '-';
  const userJabatan = user.jabatan || user.roleLabel || user.sotk_position_label || 'Penerima Disposisi';
  const userId = user.id || user.id_user || null;

  // Pastikan sudah ditandai baca tingkat 1 terlebih dahulu
  const baseDisp = markDisposisiAsRead(disposisi, user, timestamp);

  const uId = String(userId || '').toLowerCase().trim();
  const uNip = String(userNip || '').replace(/\D/g, '').trim();
  const uJab = String(userJabatan || '').toLowerCase().trim();

  const currentReaders = (baseDisp.readers || []).map((r) => {
    const rId = String(r.userId || r.id || '').toLowerCase().trim();
    const rNip = String(r.nip || '').replace(/\D/g, '').trim();
    if ((uId && rId === uId) || (uNip && rNip !== '-' && rNip === uNip)) {
      return {
        ...r,
        documentViewedAt: r.documentViewedAt || timestamp
      };
    }
    return r;
  });

  let updatedTargets = baseDisp.targets;
  if (Array.isArray(baseDisp.targets)) {
    updatedTargets = baseDisp.targets.map((tgt) => {
      const tId = String(tgt.target_user_id || tgt.id || '').toLowerCase().trim();
      const tNip = String(tgt.target_pejabat_nip || '').replace(/\D/g, '').trim();
      const tJab = String(tgt.target_jabatan || tgt.targetUnit || '').toLowerCase().trim();
      const isMatch = (uId && tId === uId) || (uNip && tNip === uNip) || (uJab && tJab && (tJab.includes(uJab) || uJab.includes(tJab)));

      if (isMatch) {
        return {
          ...tgt,
          documentViewedAt: tgt.documentViewedAt || timestamp
        };
      }
      return tgt;
    });
  }

  return {
    ...baseDisp,
    documentViewedAt: baseDisp.documentViewedAt || timestamp,
    readers: currentReaders,
    targets: updatedTargets
  };
};

/**
 * Menghitung ringkasan status keterbacaan disposisi (Delivery & Read Receipt Summary)
 */
export const getDisposisiReadSummary = (disposisi) => {
  if (!disposisi) {
    return {
      status: 'UNREAD',
      badgeLabel: 'Belum Ada Disposisi',
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
      totalTargets: 0,
      readTargets: 0,
      unreadTargets: 0,
      readPercentage: 0,
      isAllRead: false,
      isPartialRead: false,
      isUnread: true,
      hasSlaWarning: false,
      slaWarningText: ''
    };
  }

  const targets = Array.isArray(disposisi.targets) && disposisi.targets.length > 0
    ? disposisi.targets
    : [
        {
          id: 'primary',
          targetUnit: disposisi.targetUnit || disposisi.tujuanDisposisi || 'Penerima Disposisi',
          target_jabatan: disposisi.target_jabatan || disposisi.targetUnit,
          target_pejabat_nama: disposisi.target_pejabat_nama,
          target_pejabat_nip: disposisi.target_pejabat_nip,
          isRead: Boolean(disposisi.isRead),
          readAt: disposisi.readAt,
          readBy: disposisi.readBy,
          readByNip: disposisi.readByNip,
          documentViewedAt: disposisi.documentViewedAt
        }
      ];

  const totalTargets = targets.length;
  const readTargets = targets.filter((t) => Boolean(t.isRead)).length;
  const unreadTargets = totalTargets - readTargets;
  const readPercentage = totalTargets > 0 ? Math.round((readTargets / totalTargets) * 100) : 0;

  const isAllRead = totalTargets > 0 && readTargets === totalTargets;
  const isPartialRead = readTargets > 0 && readTargets < totalTargets;
  const isUnread = readTargets === 0;

  let hasSlaWarning = false;
  let slaWarningText = '';

  if (isUnread || isPartialRead) {
    if (disposisi.batasWaktu) {
      slaWarningText = `Tenggat instruksi: ${disposisi.batasWaktu}. Menunggu konfirmasi pembacaan pejabat terkait.`;
      hasSlaWarning = true;
    } else {
      slaWarningText = 'Menunggu pejabat yang diamanahkan membuka dan membaca arahan disposisi.';
    }
  }

  let status = 'UNREAD';
  let badgeLabel = 'Belum Dibaca Penerima';
  let badgeColor = 'bg-rose-50 text-rose-800 border-rose-300';

  if (isAllRead) {
    status = 'ALL_READ';
    badgeLabel = totalTargets > 1 ? `Semua Dibaca (${readTargets}/${totalTargets})` : 'Sudah Dibaca Penerima';
    badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  } else if (isPartialRead) {
    status = 'PARTIAL_READ';
    badgeLabel = `Sebagian Dibaca (${readTargets}/${totalTargets})`;
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-300';
  }

  return {
    status,
    badgeLabel,
    badgeColor,
    totalTargets,
    readTargets,
    unreadTargets,
    readPercentage,
    isAllRead,
    isPartialRead,
    isUnread,
    hasSlaWarning,
    slaWarningText,
    targets
  };
};

/**
 * Memformat string tanggal/waktu ke dalam 2 baris (dateStr dan timeStr)
 * seperti tampilan pelacakan ekspedisi (misal: "15 Okt" dan "09:15 WIB")
 */
export const formatTimelineTimestamp = (rawDateStr) => {
  if (!rawDateStr || rawDateStr === '-') {
    return { dateStr: '-', timeStr: '-' };
  }

  const str = String(rawDateStr).trim();

  // 1. Pola dengan pemisah koma: "19 Okt 2026, 11.38.29 WIB" atau "15 Okt 2026, 09:15 WIB"
  if (str.includes(',')) {
    const commaParts = str.split(',');
    const rawDatePart = commaParts[0].trim();
    const rawTimePart = commaParts.slice(1).join(',').trim();

    // Olah bagian tanggal: ambil "19 Okt" dari "19 Okt 2026"
    const dateWords = rawDatePart.split(/\s+/).filter(Boolean);
    const dateStr = dateWords.length >= 2 ? `${dateWords[0]} ${dateWords[1]}` : rawDatePart;

    // Olah bagian waktu: deteksi jam dan menit baik format titik (11.38 / 11.38.29) maupun titik dua (09:15)
    const timeMatch = rawTimePart.match(/([0-9]{1,2})[:.]([0-9]{2})(?:[:.][0-9]{2})?/);
    if (timeMatch) {
      const hours = timeMatch[1].padStart(2, '0');
      const minutes = timeMatch[2];
      const sep = rawTimePart.includes(':') ? ':' : '.';
      const hasWib = /WIB/i.test(rawTimePart) || /WIB/i.test(str);
      const timeStr = `${hours}${sep}${minutes}${hasWib ? ' WIB' : ''}`;
      return { dateStr, timeStr };
    }

    return {
      dateStr,
      timeStr: rawTimePart || '-'
    };
  }

  // 2. Pola ISO Date YYYY-MM-DD
  if (str.includes('-') && /^\d{4}-\d{2}-\d{2}/.test(str)) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        return { dateStr, timeStr };
      }
    } catch (_) {}
  }

  // 3. Pola spasi dengan jam: "19 Okt 07.00 WIB" atau "21 Okt 07.00 WIB"
  const spaceTimeMatch = str.match(/([0-9]{1,2})[:.]([0-9]{2})(?:[:.][0-9]{2})?(\s*WIB)?/i);
  if (spaceTimeMatch) {
    const sep = str.includes(':') ? ':' : '.';
    const hasWib = /WIB/i.test(str);
    const hours = spaceTimeMatch[1].padStart(2, '0');
    const minutes = spaceTimeMatch[2];
    const timeStr = `${hours}${sep}${minutes}${hasWib ? ' WIB' : ''}`;

    const beforeTime = str.substring(0, spaceTimeMatch.index).trim();
    const words = beforeTime.split(/\s+/).filter(Boolean);
    const dateStr = words.length >= 2 ? `${words[0]} ${words[1]}` : (words[0] || '-');
    return { dateStr, timeStr };
  }

  // 4. Pola tanggal standar Indonesia: "19 Okt 2026"
  const dateOnlyMatch = str.match(/^([0-9]{1,2}\s+[a-zA-Z]+)(?:\s+[0-9]{4})?/i);
  if (dateOnlyMatch) {
    return {
      dateStr: dateOnlyMatch[1],
      timeStr: '-'
    };
  }

  const parts = str.split(' ');
  if (parts.length >= 2) {
    return {
      dateStr: parts.slice(0, 2).join(' '),
      timeStr: parts.slice(2).join(' ') || '-'
    };
  }

  return { dateStr: str, timeStr: '-' };
};

/**
 * Membangun rangkaian jejak ekspedisi disposisi vertikal (Delivery & Read Timeline)
 * Sesuai urutan kronologis terbalik (paling mutakhir di atas, seperti resi tanda terima ekspedisi)
 */
export const buildDisposisiDeliveryTimeline = (letter, currentUser = null) => {
  if (!letter || !letter.disposisi) return [];

  const disp = letter.disposisi;
  const summary = getDisposisiReadSummary(disp);
  const items = [];

  // 1. Jika Disposisi sudah SELESAI ditindaklanjuti
  if (disp.status === 'Selesai') {
    const rawTime = disp.resolvedAt || disp.updatedAt || disp.statusTimestamp || disp.tanggalDisposisi;
    const { dateStr, timeStr } = formatTimelineTimestamp(rawTime);
    items.push({
      id: 'step-resolved',
      category: 'SELESAI',
      statusType: 'success',
      nodeColor: 'emerald',
      dateStr,
      timeStr,
      badgeText: 'Disposisi Selesai',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      title: '[Tindak Lanjut Tuntas] Arahan Disposisi Selesai Dilaksanakan',
      actor: disp.resolvedBy || 'Pejabat Penerima Disposisi',
      description: disp.resolvedNote || 'Tindak lanjut arahan telah tuntas dan disahkan sesuai tata naskah dinas.',
      isLatest: true
    });
  }

  // 2. Jejak Keterbacaan Tiap Target Penerima (Read Receipts)
  summary.targets.forEach((tgt, idx) => {
    const isRead = Boolean(tgt.isRead);
    const rawTime = isRead
      ? (tgt.readAt || disp.readAt || disp.tanggalDisposisi)
      : (disp.batasWaktu || disp.tanggalDisposisi);
    const { dateStr, timeStr } = formatTimelineTimestamp(rawTime);

    const targetLabel = tgt.targetUnit || tgt.nama || tgt.target_jabatan || 'Penerima Disposisi';
    const pejabatNama = tgt.readBy || tgt.target_pejabat_nama || tgt.target_jabatan || 'Pejabat Penerima';
    const nip = tgt.readByNip || tgt.target_pejabat_nip;
    const documentViewedAt = tgt.documentViewedAt || (disp.readBy === pejabatNama ? disp.documentViewedAt : null);

    if (isRead) {
      items.push({
        id: `step-read-${tgt.id || idx}`,
        category: 'READ',
        statusType: 'success',
        nodeColor: 'emerald',
        dateStr,
        timeStr,
        badgeText: 'Sudah Dibaca',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        title: `[${targetLabel}] Lembar Disposisi Telah Dibuka & Dibaca`,
        actor: pejabatNama,
        nip: nip && nip !== '-' ? nip : null,
        description: 'Tanda terima keterbacaan naskah tercatat secara sah dalam jejak audit SILOKA.',
        readAt: tgt.readAt || disp.readAt,
        documentViewedAt,
        isLatest: items.length === 0,
        actionType: 'view_disposisi',
        actionLabel: 'Lihat Lembar Disposisi'
      });
    } else {
      const isUserThisTarget = currentUser ? checkIfUserIsDisposisiTarget({ targets: [tgt] }, currentUser) : false;
      items.push({
        id: `step-unread-${tgt.id || idx}`,
        category: 'UNREAD',
        statusType: 'waiting',
        nodeColor: 'amber',
        dateStr,
        timeStr: timeStr !== '-' ? timeStr : 'Menunggu',
        badgeText: 'Belum Dibaca',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        title: `[${targetLabel}] Menunggu Pembacaan Lembar Disposisi`,
        actor: tgt.target_pejabat_nama ? `${tgt.target_pejabat_nama} (${tgt.target_jabatan || targetLabel})` : (tgt.target_jabatan || targetLabel),
        nip: nip && nip !== '-' ? nip : null,
        description: `Status: Belum dibuka oleh pejabat bersangkutan. ${disp.batasWaktu ? `Tenggat Waktu: ${disp.batasWaktu}` : ''}`,
        isLatest: items.length === 0,
        isPendingTarget: true,
        canConfirmRead: isUserThisTarget,
        targetObj: tgt
      });
    }
  });

  // 3. Penerbitan Disposisi oleh Pimpinan (Arahan Disposisi Diterbitkan)
  {
    const rawTime = disp.tanggalDisposisi || letter.tanggal;
    const { dateStr, timeStr } = formatTimelineTimestamp(rawTime);
    const pemberiStr = disp.pemberiDisposisi || 'Pimpinan Unit';
    const jabatanPemberi = disp.jabatanPemberi || (disp.pemberiDisposisi?.includes('Rektor') ? 'Rektor Universitas Siliwangi' : 'Pimpinan Unit');

    items.push({
      id: 'step-disposisi-issued',
      category: 'ISSUED',
      statusType: 'neutral',
      nodeColor: 'slate',
      dateStr,
      timeStr,
      badgeText: disp.forwardedFrom ? 'Disposisi Lanjutan' : 'Disposisi Terbit',
      badgeColor: disp.forwardedFrom ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-700 border-slate-300',
      title: disp.forwardedFrom
        ? `[${jabatanPemberi}] Disposisi Lanjutan Berjenjang Diterbitkan`
        : `[${jabatanPemberi}] Arahan & Instruksi Disposisi Pimpinan Diterbitkan`,
      actor: pemberiStr,
      description: disp.instruksi || (disp.actions && disp.actions.join(', ')) || 'Ikuti arahan instruksi pimpinan.',
      customNote: disp.customNote,
      sifat: disp.sifatInstruksi,
      batasWaktu: disp.batasWaktu,
      actions: disp.actions,
      isLatest: items.length === 0
    });
  }

  // 3b. Riwayat Disposisi Tingkat Awal (jika ada jejak cascading sebelumnya)
  if (Array.isArray(letter.disposisiHistory) && letter.disposisiHistory.length > 0) {
    letter.disposisiHistory.forEach((histDisp, hIdx) => {
      const { dateStr, timeStr } = formatTimelineTimestamp(histDisp.tanggalDisposisi || letter.tanggal);
      const hPemberi = histDisp.pemberiDisposisi || 'Pimpinan';
      const hJabatan = histDisp.jabatanPemberi || (hPemberi.includes('Rektor') ? 'Rektor Universitas Siliwangi' : 'Pimpinan Unit');

      items.push({
        id: `step-disposisi-parent-${hIdx}`,
        category: 'ISSUED',
        statusType: 'neutral',
        nodeColor: 'slate',
        dateStr,
        timeStr,
        badgeText: 'Disposisi Awal',
        badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
        title: `[${hJabatan}] Arahan & Instruksi Disposisi Pimpinan Diterbitkan`,
        actor: hPemberi,
        description: histDisp.instruksi || (histDisp.actions && histDisp.actions.join(', ')) || 'Arahan awal pimpinan.',
        customNote: histDisp.customNote,
        sifat: histDisp.sifatInstruksi,
        batasWaktu: histDisp.batasWaktu,
        actions: histDisp.actions,
        isLatest: false
      });
    });
  }

  // 4. Jejak Paraf Berjenjang (jika ada)
  if (Array.isArray(letter.riwayatParaf) && letter.riwayatParaf.length > 0) {
    letter.riwayatParaf.forEach((paraf, pIdx) => {
      const { dateStr, timeStr } = formatTimelineTimestamp(paraf.waktu);
      items.push({
        id: `step-paraf-${pIdx}`,
        category: 'PARAF',
        statusType: 'neutral',
        nodeColor: 'slate',
        dateStr,
        timeStr,
        badgeText: 'Paraf Koordinasi',
        badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
        title: `[Verifikasi Naskah] ${paraf.jabatan || 'Pemeriksa Tata Usaha'}`,
        actor: paraf.nama,
        description: paraf.catatan || 'Naskah dinas telah ditelaah dan diverifikasi.',
        isLatest: false
      });
    });
  }

  // 5. Registrasi Naskah di Buku Agenda Elektronik (Langkah Awal)
  {
    const rawTime = letter.tanggal || letter.statusTimestamp || disp.tanggalDisposisi;
    const { dateStr, timeStr } = formatTimelineTimestamp(rawTime);
    const isMasuk = letter.kategori === 'Surat Masuk' || letter.isSuratMasuk || String(letter.nomorSurat || '').startsWith('AGD-');

    items.push({
      id: 'step-initial-registration',
      category: 'REGISTRATION',
      statusType: 'neutral',
      nodeColor: 'slate',
      dateStr,
      timeStr,
      badgeText: isMasuk ? 'Surat Masuk' : 'Draf Naskah',
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
      title: isMasuk
        ? `[Sub Bagian Tata Usaha] Registrasi Naskah Masuk ke Buku Agenda`
        : `[Pengusul Naskah] Registrasi Naskah Dinas Keluar`,
      actor: letter.pengirim || letter.asalSurat || letter.unit || 'Pengirim / Asal Naskah',
      description: `Perihal: "${letter.perihal || 'Naskah Dinas'}" — Dicatat dengan nomor registrasi ${letter.nomorAgenda || disp.nomorAgenda || letter.nomorSurat || '-'}`,
      isLatest: false
    });
  }

  return items;
};
