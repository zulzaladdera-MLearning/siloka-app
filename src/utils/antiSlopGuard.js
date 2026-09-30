// ponytail: stdlib + regex filter in one small module; no external NLP/validation dependencies needed.

const SLOP_REPLACEMENTS = [
  {
    rule: 'ANTISLOP-DB-QUERY',
    pattern: /SELECT\s+\*\s+FROM\s+\w+(?:\s+WHERE\s+[\w\s='"]+)?/gi,
    replacement: 'Data draf surat yang masih menunggu verifikasi pada unit kerja asal'
  },
  {
    rule: 'ANTISLOP-API-ENDPOINT',
    pattern: /\b(GET|POST|PUT|DELETE|PATCH)\s+\/api\/v\d+\/[^\s)]+/gi,
    replacement: 'data unit kerja terkait'
  },
  {
    rule: 'ANTISLOP-ACID-COMMIT',
    pattern: /POSTGRES_ACID_COMMITTED|Transaksi\s+ACID\s+PostgreSQL(\s+aktif)?|Mengeksekusi\s+Transaksi\s+ACID\.{0,3}/gi,
    replacement: 'Tersimpan di Sistem'
  },
  {
    rule: 'ANTISLOP-FOREIGN-KEY',
    pattern: /Perubahan\s+Foreign\s+Key\s+Utama|Validasi\s+relasi\s+Foreign\s+Key\s+\w+|relasi\s+foreign\s+key/gi,
    replacement: 'Ringkasan Perubahan Penempatan'
  },
  {
    rule: 'ANTISLOP-FK-BADGE',
    pattern: /\bFK:\s*/g,
    replacement: 'Kode: '
  },
  {
    rule: 'ANTISLOP-TABLE-NAMES',
    pattern: /\b(tbl_unit_jabatan_map|tbl_riwayat_mutasi|tbl_document_drafts|tbl_users|tm_user|master_user)\b/gi,
    replacement: 'data kepegawaian'
  },
  {
    rule: 'ANTISLOP-UI-JARGON',
    pattern: /\s*\((Searchable\s+Combobox|Dependent\s+Dropdown|Zero\s+Free-Text\s+Input|Keep\s+in\s+Old\s+Unit|Auto-Revoke\s+Drafts)\)/gi,
    replacement: ''
  },
  {
    rule: 'ANTISLOP-UPSERT',
    pattern: /\boperasi\s+upsert\s*\(insert\/update\)|\bTindakan\s+Upsert\b|\bStatus\s+Operasi\s+Upsert\b/gi,
    replacement: 'Pembaruan Data'
  },
  {
    rule: 'ANTISLOP-BOOLEAN-FLAG',
    pattern: /is_pejabat\s*=\s*(TRUE|FALSE)(\s*\([^)]+\))?/gi,
    replacement: (_, val) =>
      String(val).toUpperCase() === 'TRUE'
        ? 'Peran: Pejabat / Tugas Tambahan'
        : 'Peran: Dosen / Staf Fungsional'
  }
];

const TECHNICAL_ERROR_PATTERNS = [
  /Error\s+\d{3}\s*:/i,
  /Database\s+transaction\s+(commit|rollback)\s+failed/i,
  /Request\s+query\s+invalid/i,
  /SQLITE_ERROR|PG::|ECONNREFUSED|ETIMEDOUT|TypeError:|ReferenceError:|SyntaxError:/i,
  /foreign\s+key\s+constraint\s+fails/i,
  /Gagal\s+mengeksekusi\s+transaksi/i
];

export function sanitizeUiText(input) {
  if (typeof input !== 'string' || !input.trim()) return input ?? '';
  return SLOP_REPLACEMENTS.reduce(
    (acc, { pattern, replacement }) => acc.replace(pattern, replacement),
    input
  )
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function sanitizeErrorMessage(
  errorOrMessage,
  fallback = 'Gagal menyimpan perubahan. Silakan periksa kembali kelengkapan data Anda.'
) {
  const raw =
    typeof errorOrMessage === 'string'
      ? errorOrMessage
      : errorOrMessage?.message || '';
  if (!raw.trim()) return fallback;
  if (TECHNICAL_ERROR_PATTERNS.some((rx) => rx.test(raw))) return fallback;
  return sanitizeUiText(raw);
}

export function auditTextForSlop(text) {
  if (typeof text !== 'string' || !text.trim()) return [];
  return SLOP_REPLACEMENTS.filter(({ pattern }) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  }).map(({ rule }) => ({
    rule,
    cleaned: sanitizeUiText(text)
  }));
}

// ponytail: native platform one-liners instead of date/clipboard libraries
export const todayIso = () => new Date().toISOString().slice(0, 10);

export const formatDateId = (date = new Date()) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(date)
  );

export const copyTextNative = (text) => navigator.clipboard?.writeText(String(text ?? ''));
