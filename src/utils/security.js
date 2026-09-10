// SILOKA Enterprise Security & Cryptographic Utilities
// Compliant with BSSN (Badan Siber dan Sandi Negara) & Perka ANRI No. 9/2018

// Initial persistent audit events for the intranet session
export const initialAuditLogs = [
  {
    id: 'LOG-20260907-001',
    timestamp: '07 Sep 2026, 08:30:12 WIB',
    userId: 'usr-01',
    userName: 'Dr. Nana Sujana, Drs., M.Si.',
    userNip: '196808301989031004',
    unit_kerja_id: 'UN58.6',
    unitKerjaName: 'Biro Perencanaan, Keuangan, dan Umum',
    roleLevel: 'Level 1: Pimpinan',
    action: 'AUTH_LOGIN_SUCCESS',
    details: 'Login berhasil melalui Intranet UNSIL (SSO Gateway)',
    ipAddress: '10.58.12.44',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    severity: 'NORMAL',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  {
    id: 'LOG-20260907-002',
    timestamp: '07 Sep 2026, 09:15:40 WIB',
    userId: 'usr-03',
    userName: 'Budi Santoso, S.E., M.Ak.',
    userNip: '198203202008121002',
    unit_kerja_id: 'UN58.6',
    unitKerjaName: 'Biro Perencanaan, Keuangan, dan Umum',
    roleLevel: 'Level 2: Pelaksana',
    action: 'PARAF_DRAFT_SUBMIT',
    details: 'Membubuhkan paraf pada draft surat No: 0289/UN58.32/KR.07.00/2026',
    ipAddress: '10.58.14.19',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/130.0',
    severity: 'NORMAL',
    hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4'
  },
  {
    id: 'LOG-20260907-003',
    timestamp: '07 Sep 2026, 10:25:05 WIB',
    userId: 'usr-02',
    userName: 'Siti Rohmah, S.AP.',
    userNip: '198809152014042001',
    unit_kerja_id: 'UN58.6',
    unitKerjaName: 'Biro Perencanaan, Keuangan, dan Umum',
    roleLevel: 'Level 2: Pelaksana',
    action: 'RESTRICTED_ACCESS_BLOCKED',
    details: 'Upaya akses ditolak: Dokumen Sangat Rahasia No: 0088/UN58.SPI/KU.02.01/2026 (Role-Based Masking Aktif)',
    ipAddress: '10.58.14.88',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    severity: 'WARNING',
    hash: 'c4ca4238a0b923820dcc509a6f75849b2512f45c9a8964e52ec87702845c4779'
  },
  {
    id: 'LOG-20260907-004',
    timestamp: '07 Sep 2026, 11:02:18 WIB',
    userId: 'usr-01',
    userName: 'Dr. Nana Sujana, Drs., M.Si.',
    userNip: '196808301989031004',
    unit_kerja_id: 'UN58.6',
    unitKerjaName: 'Biro Perencanaan, Keuangan, dan Umum',
    roleLevel: 'Level 1: Pimpinan',
    action: 'TTE_SIGN_BSRE',
    details: 'Otorisasi TTE BSrE berhasil (Serial: BSrE-UNSIL-2026-994120) pada surat 0142/UN58.6/KU.01.00/2026. Cap fisik dinonaktifkan otomatis.',
    ipAddress: '10.58.12.44',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    severity: 'NORMAL',
    hash: '7d793037a0760186574b0282f2f435e7b1e7a6c97d69095e5e3e863f00c5718a'
  },
  {
    id: 'LOG-20260907-005',
    timestamp: '07 Sep 2026, 12:15:33 WIB',
    userId: 'usr-04',
    userName: 'Hendra Pratama, S.E., Ak., C.A.',
    userNip: '198007112005011002',
    unit_kerja_id: 'UN58.21',
    unitKerjaName: 'Satuan Pengawas Internal',
    roleLevel: 'Level 3: Pengawas',
    action: 'READ_CONFIDENTIAL_DECRYPT',
    details: 'Membuka dokumen Sangat Rahasia (Audit Pra-Pemeriksaan BPK) untuk pengawasan SPI',
    ipAddress: '10.58.16.10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/128.0',
    severity: 'NORMAL',
    hash: 'a58797964eb78d9b1574d6f461e712739366df044c602dc8dc634ebceecbcbe1'
  }
];

// Helper to append a new immutable log entry
export const createAuditEntry = ({
  user,
  action,
  details,
  severity = 'NORMAL',
  ipAddress = '10.58.12.44'
}) => {
  const now = new Date();
  const timeStr = now.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) + ' WIB';

  // Deterministic mock hash simulating SHA-256 block chain
  const hashSeed = `${user?.id || 'anon'}-${action}-${now.getTime()}`;
  let hashVal = 0;
  for (let i = 0; i < hashSeed.length; i++) {
    hashVal = (hashVal << 5) - hashVal + hashSeed.charCodeAt(i);
    hashVal |= 0;
  }
  const hashHex = Math.abs(hashVal).toString(16).padStart(8, '0') +
    'c4ca4238a0b923820dcc509a6f75849b2512f45c9a8964e52ec87702845c4779'.slice(8);

  return {
    id: `LOG-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: timeStr,
    userId: user?.id || 'sys',
    userName: user?.nama_lengkap || user?.name || 'Sistem Terdistribusi',
    userNip: user?.nip_nik || user?.nip || '-',
    unit_kerja_id: user?.unit_kerja_id || 'UN58',
    unitKerjaName: user?.unit || 'Universitas Siliwangi',
    roleLevel: user?.roleLevel || user?.role || 'Guest',
    action,
    details,
    ipAddress,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 50) + '...' : 'Intranet Client',
    severity,
    hash: hashHex
  };
};

// Generate Forensic Watermark string
export const generateForensicWatermark = (user, documentName) => {
  const now = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  const ip = '10.58.12.44 (Intranet BKU UNSIL)';
  return `[DOKUMEN RESMI BKU UNSIL - RAHASIA & TERBATAS] Diunduh oleh: ${user?.name || 'Pengguna'} (NIP: ${user?.nip || '-'}) | IP: ${ip} | Waktu: ${now} | Berkas: ${documentName}`;
};

// Check if user has permission to decrypt/view confidential documents
export const canViewSecretDocument = (user, sifat) => {
  if (!user) return false;
  // If not secret, anyone with an account can view
  if (sifat !== 'Sangat Rahasia' && sifat !== 'Rahasia') return true;

  // Level 1 (Pimpinan) and Level 3 (Pengawas SPI) can view secret documents
  if (user.role === 'PIMPINAN' || user.role === 'PENGAWAS') return true;

  // Level 2 (Staf) is blocked by Role-Based Data Masking
  return false;
};

// Redacted text simulation
export const getMaskedPerihal = (perihal, isMasked) => {
  if (!isMasked) return perihal;
  return '[DOKUMEN TERENKRIPSI AES-256 - HANYA LEVEL 1 PIMPINAN & LEVEL 3 PENGAWAS SPI]';
};

