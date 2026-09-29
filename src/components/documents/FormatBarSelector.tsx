import React, { useMemo, useEffect } from 'react';
import {
  Layers,
  FileText,
  FileSignature,
  FileCheck,
  UserCheck,
  Users,
  Mail,
  Building,
  CreditCard,
  Handshake,
  Key,
  FileSpreadsheet,
  FileBadge,
  PenTool,
  Send,
  Megaphone,
  ClipboardList,
  FileBarChart,
  FileSearch,
  SendHorizontal,
  QrCode
} from 'lucide-react';
import {
  getAuthorizedTemplatesWithNumbering,
  getRektoratOfficialSopProfile,
  normalizeUserRole,
  FormattedTemplateItem
} from '../../config/documentFormats';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Layers,
  FileText,
  FileSignature,
  FileCheck,
  UserCheck,
  Users,
  Mail,
  Building,
  CreditCard,
  Handshake,
  Key,
  FileSpreadsheet,
  FileBadge,
  PenTool,
  Send,
  Megaphone,
  ClipboardList,
  FileBarChart,
  FileSearch,
  SendHorizontal,
  QrCode
};

export interface FormatBarSelectorProps {
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
  currentUser?: any;
  className?: string;
  showSyncText?: boolean;
}

/**
 * FormatBarSelector: Bilah Pemilih Format Naskah Dinas SILOKA UNSIL
 * 
 * Fitur Utama:
 * 1. Filter Ketat Berbasis Peran (RBAC):
 *    - REKTOR: 23 Format Naskah Dinas (Tabel 1 Kolom 3 Hal. 88–89 Per. Rektor No. 3/2023).
 *    - WAKIL REKTOR (WAREK): 16 Format Naskah Dinas (Tabel 1 Kolom 7 Hal. 88–89 Per. Rektor No. 3/2023).
 *    - DOSEN_NON_JABATAN (Dosen Tanpa Jabatan): Wajib memiliki 11 Template:
 *      Nota Dinas, Surat Pernyataan, Laporan, Telaah Staf, Berita Acara, Notula,
 *      ST (Lembar), ST (Kolom), Surat Dinas, Surat Keterangan, Surat Pengantar.
 * 2. Penomoran Dinamis Urut Mulai Nomor 1:
 *    - Nomor urut template dihitung ulang secara dinamis sesuai daftar yang berhak dilihat
 *      (1. ..., 2. ..., dst.) tanpa loncatan angka statis.
 * 3. Fallback & Tamper Protection:
 *    - Jika template yang dipilih tidak diizinkan untuk peran pengguna, otomatis diarahkan
 *      ke format pertama yang sah.
 */
export const FormatBarSelector: React.FC<FormatBarSelectorProps> = ({
  selectedTemplate,
  onSelectTemplate,
  currentUser,
  className = '',
  showSyncText = true
}) => {
  const [lecturerCategoryFilter, setLecturerCategoryFilter] = React.useState<
    'ALL' | 'MANDIRI' | 'KONDISIONAL' | 'KONSEP_PIMPINAN'
  >('ALL');

  const normalizedRole = useMemo(() => {
    return normalizeUserRole(currentUser);
  }, [currentUser]);

  const isLecturerWithoutPosition = normalizedRole === 'DOSEN_NON_JABATAN';

  // Hitung daftar template yang diizinkan dengan penomoran urut dinamis (1 .. N)
  const visibleTemplates: FormattedTemplateItem[] = useMemo(() => {
    return getAuthorizedTemplatesWithNumbering(
      currentUser,
      isLecturerWithoutPosition
        ? { includeConditional: true, categoryFilter: lecturerCategoryFilter }
        : undefined
    );
  }, [currentUser, isLecturerWithoutPosition, lecturerCategoryFilter]);

  const rektoratSopProfile = useMemo(() => {
    return getRektoratOfficialSopProfile(currentUser);
  }, [currentUser]);

  // Proteksi integritas & fallback: Jika template aktif tidak termasuk yang berwenang,
  // otomatis beralih ke template pertama yang sah bagi pengguna tersebut
  useEffect(() => {
    if (visibleTemplates.length > 0 && !visibleTemplates.some((t) => t.id === selectedTemplate)) {
      onSelectTemplate(visibleTemplates[0].id);
    }
  }, [visibleTemplates, selectedTemplate, onSelectTemplate]);

  return (
    <div
      className={`px-4 py-2.5 bg-white border-b border-slate-200 flex flex-col gap-2 shrink-0 ${className}`}
    >
      {/* Baris Kategori Khusus Dosen Biasa (Tanpa Jabatan Struktural / Tugas Tambahan) */}
      {isLecturerWithoutPosition && (
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-unsil-green-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              SOP Dosen Tanpa Jabatan (11 Template Resmi):
            </span>
            <button
              type="button"
              onClick={() => setLecturerCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition border ${
                lecturerCategoryFilter === 'ALL'
                  ? 'bg-unsil-green-800 text-white border-unsil-green-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua Template (11 Format)
            </button>
            <button
              type="button"
              onClick={() => setLecturerCategoryFilter('MANDIRI')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition border ${
                lecturerCategoryFilter === 'MANDIRI'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                  : 'bg-emerald-50/60 text-emerald-900 border-emerald-200 hover:bg-emerald-100/70'
              }`}
              title="Nota Dinas (Pasal 11), Surat Pernyataan (Pasal 20), Laporan (Pasal 26), Telaah Staf (Pasal 27)"
            >
              1. Kategori Mandiri (TTD Dosen: 4)
            </button>
            <button
              type="button"
              onClick={() => setLecturerCategoryFilter('KONDISIONAL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition border ${
                lecturerCategoryFilter === 'KONDISIONAL'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100/70'
              }`}
              title="Berita Acara (Pasal 18) & Notula (Pasal 25)"
            >
              + Template Kondisional (Berita Acara & Notula: 2)
            </button>
            <button
              type="button"
              onClick={() => setLecturerCategoryFilter('KONSEP_PIMPINAN')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition border ${
                lecturerCategoryFilter === 'KONSEP_PIMPINAN'
                  ? 'bg-indigo-700 text-white border-indigo-800 shadow-2xs'
                  : 'bg-indigo-50/70 text-indigo-900 border-indigo-200 hover:bg-indigo-100/70'
              }`}
              title="ST (Lembar), ST (Kolom), Surat Dinas, Surat Keterangan, Surat Pengantar"
            >
              2. Kategori Konsep / Drafting (Diajukan TTD Pimpinan: 5 Format)
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium pb-1 max-w-full">
          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider shrink-0 mr-1 select-none">
            Format:
          </span>

          {visibleTemplates.map((template) => {
            const IconComponent = ICON_MAP[template.iconName] || FileText;
            const isSelected = selectedTemplate === template.id;
            const sopMeta = template.lecturerSopMeta;

            return (
              <button
                key={template.id}
                type="button"
                data-testid={`format-btn-${template.id}`}
                onClick={() => onSelectTemplate(template.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border shrink-0 transition ${
                  isSelected
                    ? 'bg-unsil-green-50 border-unsil-green-700 text-unsil-green-950 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title={
                  sopMeta
                    ? `${sopMeta.shortLabel} — ${sopMeta.signerBadgeText}: ${sopMeta.sopDescription}`
                    : template.description || template.baseLabel
                }
              >
                <IconComponent className="w-3.5 h-3.5 text-unsil-green-700" />
                <span>{template.displayLabel}</span>
                {sopMeta && (
                  <span
                    className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                      sopMeta.accessCategory === 'MANDIRI'
                        ? 'bg-emerald-100 text-emerald-900'
                        : sopMeta.accessCategory === 'KONDISIONAL'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-indigo-100 text-indigo-900'
                    }`}
                  >
                    {sopMeta.pasalRef} •{' '}
                    {sopMeta.accessCategory === 'MANDIRI'
                      ? 'Mandiri'
                      : sopMeta.accessCategory === 'KONDISIONAL'
                      ? 'Kondisional'
                      : 'Konsep Pimpinan'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {showSyncText && (
          <div className="flex items-center gap-2 shrink-0">
            {rektoratSopProfile ? (
              <span
                className="text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-unsil-green-900 border border-emerald-200 select-none"
                title={rektoratSopProfile.sopLegalReference}
              >
                SOP {rektoratSopProfile.officialTitle}: {visibleTemplates.length} Template Resmi (Tabel 1 Per. Rektor 3/2023)
              </span>
            ) : isLecturerWithoutPosition ? (
              <span className="text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-unsil-green-900 border border-emerald-200 select-none">
                Dosen Biasa (Tanpa Jabatan): 8 Utama + 2 Kondisional (Per. Rektor No. 3/2023)
              </span>
            ) : (
              <span className="text-[10.5px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 select-none">
                Kewenangan {normalizedRole}: {visibleTemplates.length} Format
              </span>
            )}
            <span className="text-[11px] text-slate-500 hidden xl:inline select-none">
              Otomatis tersinkronisasi ke penomoran BKU
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormatBarSelector;

