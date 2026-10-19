import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Lock,
  Search,
  Sparkles,
  Database,
  CheckCircle2,
  RotateCcw,
  FileWarning,
  Printer,
  ChevronRight,
  Building2,
  Hash,
  Calendar,
  BookOpen
} from 'lucide-react';
import {
  JRA_PRIMARY_CATEGORIES,
  JRA_SUB_CATEGORIES,
  JRA_MASTER_ITEMS,
  TEMPLATE_DEFAULT_KLASIFIKASI_MAP,
  UNIT_CODE_MAP,
  resolveOfficialUnitInfo,
  getJraItemByCode,
  assembleOfficialLetterNumber
} from '../../config/jraMasterCatalog';
import { getRektoratOfficialSopProfile } from '../../config/documentFormats';
import { getNextSequenceForUnit } from '../../services/letterService';

/**
 * SmartKlasifikasiNumberingPanel
 * Implementasi Mekanisme Kerja di Sistem SILOKA (SK Rektor No. 2803 Tahun 2023 & Peraturan Rektor No. 3 Tahun 2023):
 * 1. Pustaka Kode Baku di Database (Static Master Data: 18 Kategori Utama, 140 Sub-Kategori, 448 Kode Klasifikasi JRA/SKKAAD)
 * 2. Pemilihan Dinamis Berbasis Perihal (Dynamic Mapping: Pengguna memilih perihal seperti "Usul Kenaikan Pangkat" -> KP.04.03, "Naskah Soal PMB" -> PP.00.04, "Perjalanan Dinas" -> KR.01 tanpa mengetik kode manual)
 * 3. Perakitan Nomor Otomatis oleh Sistem (Auto-Generated Number):
 *    Nomor Urut / Kode Unit Kerja / [Kode Keamanan] / Kode Klasifikasi / Tahun
 *    Contoh: 83/UN58.10/KP.04.03/2026 atau 83/UN58.10/B/KP.04.03/2026
 * 4. Pencegahan Error (Read-Only Field) & Trigger Pengamanan (R / SR: Amplop Rangkap Dua, Hak Akses SKKAAD, Kunci Cetak Umum)
 */
export default function SmartKlasifikasiNumberingPanel({
  templateKey = 'sd',
  templateLabel = 'Surat Dinas / Naskah Dinas',
  currentUser = null,
  initialSequenceNumber = null,
  existingLetters = [],
  catalogItems = JRA_MASTER_ITEMS,
  onNumberChange,
  onSecurityTriggerChange
}) {
  // Profil SOP khusus jika pengguna yang login adalah Rektor atau Wakil Rektor (Warek I, II, III)
  const rektoratSopProfile = useMemo(() => getRektoratOfficialSopProfile(currentUser), [currentUser]);

  // Resolve template default recommendation (mengutamakan SOP bidang Rektor / Wakil Rektor jika login sebagai pimpinan universitas)
  const templateRecommendation = useMemo(() => {
    const roleSpecificCode = rektoratSopProfile?.defaultClassificationByTemplate?.[templateKey];
    if (roleSpecificCode) {
      const roleJraItem = getJraItemByCode(roleSpecificCode);
      if (roleJraItem) {
        return {
          defaultKode: roleJraItem.kode_klasifikasi,
          label: roleJraItem.nama_klasifikasi,
          alasan: `SOP ${rektoratSopProfile.officialTitle} (${rektoratSopProfile.bidangFocusLabel}) — ${rektoratSopProfile.sopLegalReference}`
        };
      }
    }

    return (
      TEMPLATE_DEFAULT_KLASIFIKASI_MAP[templateKey] || {
        defaultKode: 'KP.04.03',
        label: 'Usul Kenaikan Pangkat Golongan/Jabatan',
        alasan: 'Rekomendasi baku sesuai Tata Naskah Dinas & Klasifikasi Arsip UNSIL (SK Rektor No. 2803 Tahun 2023)'
      }
    );
  }, [templateKey, rektoratSopProfile]);

  // Resolve initial unit from logged-in user (UN58 untuk Rektor & Wakil Rektor sesuai Pasal 30 ayat (2) & Hal. 74)
  const resolvedUserUnit = useMemo(() => resolveOfficialUnitInfo(currentUser), [currentUser]);

  const [selectedUnitKode, setSelectedUnitKode] = useState(resolvedUserUnit.kode || 'UN58.10');
  const [tahun] = useState(new Date().getFullYear());

  // Hitung nomor urut secara dinamis (Pasal 39: penomoran berkesinambungan per unit per tahun)
  const dynamicSequence = useMemo(() => {
    if (typeof initialSequenceNumber === 'number' && initialSequenceNumber > 0) {
      return initialSequenceNumber;
    }
    return getNextSequenceForUnit(selectedUnitKode, tahun, existingLetters);
  }, [initialSequenceNumber, selectedUnitKode, tahun, existingLetters]);

  const [nomorUrut, setNomorUrut] = useState(dynamicSequence);

  useEffect(() => {
    setNomorUrut(dynamicSequence);
  }, [dynamicSequence]);

  // Format mode: apakah menyertakan segmen Kode Keamanan (B/R/SR) atau format ringkas (83/UN58.10/KP.04.03/2026)
  const [includeSecurityInNumber, setIncludeSecurityInNumber] = useState(false);

  // 3-Tier Cascading State
  const defaultItem = useMemo(
    () => getJraItemByCode(templateRecommendation.defaultKode) || getJraItemByCode('KP.04.03'),
    [templateRecommendation]
  );

  const [selectedPrimaryCode, setSelectedPrimaryCode] = useState(defaultItem.kode_utama || 'KP');
  const [selectedSubCode, setSelectedSubCode] = useState(defaultItem.kode_sub || 'KP.04');
  const [selectedKodeKlasifikasi, setSelectedKodeKlasifikasi] = useState(
    defaultItem.kode_klasifikasi || 'KP.04.03'
  );
  const [tingkatKeamanan, setTingkatKeamanan] = useState('B'); // 'B' | 'R' | 'SR'
  const [searchQuery, setSearchQuery] = useState('');
  const [authorizedPrintOverride, setAuthorizedPrintOverride] = useState(false);

  // Sync unit when currentUser changes
  useEffect(() => {
    const info = resolveOfficialUnitInfo(currentUser);
    if (info?.kode) setSelectedUnitKode(info.kode);
  }, [currentUser]);

  // Sync default classification automatically when templateKey changes
  useEffect(() => {
    const recItem = getJraItemByCode(templateRecommendation.defaultKode);
    if (recItem) {
      setSelectedPrimaryCode(recItem.kode_utama);
      setSelectedSubCode(recItem.kode_sub);
      setSelectedKodeKlasifikasi(recItem.kode_klasifikasi);
      setSearchQuery('');

      if (recItem.kode_keamanan === 'SR') {
        setTingkatKeamanan('SR');
        setIncludeSecurityInNumber(true);
      } else if (recItem.kode_keamanan === 'R') {
        setTingkatKeamanan('R');
        setIncludeSecurityInNumber(true);
      } else {
        setTingkatKeamanan('B');
      }
    }
  }, [templateKey, templateRecommendation]);

  // Active JRA item from Master Table
  const activeJraItem = useMemo(() => {
    const source = catalogItems && catalogItems.length > 0 ? catalogItems : JRA_MASTER_ITEMS;
    const found =
      source.find((item) => item.kode_klasifikasi === selectedKodeKlasifikasi) ||
      getJraItemByCode(selectedKodeKlasifikasi);
    return found || defaultItem;
  }, [catalogItems, selectedKodeKlasifikasi, defaultItem]);

  // Auto-escalate security if the chosen JRA item has SKKAAD Rahasia / Sangat Rahasia (e.g., PP.00.04 Naskah Soal PMB)
  useEffect(() => {
    if (!activeJraItem) return;
    if (activeJraItem.kode_keamanan === 'SR') {
      setTingkatKeamanan('SR');
      setIncludeSecurityInNumber(true);
      setAuthorizedPrintOverride(false);
    } else if (activeJraItem.kode_keamanan === 'R') {
      setTingkatKeamanan('R');
      setIncludeSecurityInNumber(true);
      setAuthorizedPrintOverride(false);
    }
  }, [activeJraItem]);

  // Filtered Sub-Categories for Tier 2 based on Tier 1
  const availableSubCategories = useMemo(() => {
    return JRA_SUB_CATEGORIES.filter((sub) => sub.kode_utama === selectedPrimaryCode);
  }, [selectedPrimaryCode]);

  // Filtered Specific Subjects (Tier 3) based on Tier 2
  const availableSpecificItems = useMemo(() => {
    const source = catalogItems && catalogItems.length > 0 ? catalogItems : JRA_MASTER_ITEMS;
    const list = source.filter((item) => item.kode_sub === selectedSubCode);
    return list.length > 0
      ? list
      : source.filter((item) => item.kode_utama === selectedPrimaryCode);
  }, [catalogItems, selectedSubCode, selectedPrimaryCode]);

  // Searchable Perihal Results across all 448 JRA items
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const source = catalogItems && catalogItems.length > 0 ? catalogItems : JRA_MASTER_ITEMS;
    return source
      .filter(
        (item) =>
          (item.nama_klasifikasi && item.nama_klasifikasi.toLowerCase().includes(q)) ||
          (item.keterangan_klasifikasi && item.keterangan_klasifikasi.toLowerCase().includes(q)) ||
          (item.deskripsi_jra && item.deskripsi_jra.toLowerCase().includes(q)) ||
          (item.nama_sub && item.nama_sub.toLowerCase().includes(q)) ||
          (item.nama_utama && item.nama_utama.toLowerCase().includes(q)) ||
          (item.kode_klasifikasi && item.kode_klasifikasi.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [searchQuery, catalogItems]);

  // Assembled Final Read-Only Official Letter Number
  const finalLetterNumber = useMemo(() => {
    // Jika R atau SR, wajib mencantumkan kode keamanan sesuai Pasal 42 Peraturan Rektor No. 3/2023
    const mustIncludeSec = includeSecurityInNumber || tingkatKeamanan === 'R' || tingkatKeamanan === 'SR';
    return assembleOfficialLetterNumber({
      nomorUrut,
      kodeUnit: selectedUnitKode,
      kodeKeamanan: tingkatKeamanan,
      kodeKlasifikasi: selectedKodeKlasifikasi,
      tahun,
      includeSecuritySegment: mustIncludeSec
    });
  }, [
    nomorUrut,
    selectedUnitKode,
    tingkatKeamanan,
    selectedKodeKlasifikasi,
    tahun,
    includeSecurityInNumber
  ]);

  // Alternate preview (showing both 4-segment 83/UN58.10/KP.04.03/2026 and 5-segment 83/UN58.10/B/KP.04.03/2026)
  const fiveSegmentNumberPreview = useMemo(() => {
    return assembleOfficialLetterNumber({
      nomorUrut,
      kodeUnit: selectedUnitKode,
      kodeKeamanan: tingkatKeamanan,
      kodeKlasifikasi: selectedKodeKlasifikasi,
      tahun,
      includeSecuritySegment: true
    });
  }, [nomorUrut, selectedUnitKode, tingkatKeamanan, selectedKodeKlasifikasi, tahun]);

  const fourSegmentNumberPreview = useMemo(() => {
    return assembleOfficialLetterNumber({
      nomorUrut,
      kodeUnit: selectedUnitKode,
      kodeKeamanan: tingkatKeamanan,
      kodeKlasifikasi: selectedKodeKlasifikasi,
      tahun,
      includeSecuritySegment: false
    });
  }, [nomorUrut, selectedUnitKode, tingkatKeamanan, selectedKodeKlasifikasi, tahun]);

  // Whether Security Trigger (R or SR) is active
  const isRestrictedSecret = tingkatKeamanan === 'R' || tingkatKeamanan === 'SR';
  const isPrintBlocked = isRestrictedSecret && !authorizedPrintOverride;

  // Notify parent whenever number or security status changes
  useEffect(() => {
    if (typeof onNumberChange === 'function') {
      onNumberChange({
        nomorSuratAkhir: finalLetterNumber,
        nomorLimaSegmen: fiveSegmentNumberPreview,
        nomorEmpatSegmen: fourSegmentNumberPreview,
        kodeKlasifikasi: selectedKodeKlasifikasi,
        namaKlasifikasi: activeJraItem?.nama_klasifikasi || '',
        tingkatKeamanan,
        kodeUnit: selectedUnitKode,
        nomorUrut,
        tahun,
        jraMetadata: activeJraItem
      });
    }
  }, [
    finalLetterNumber,
    fiveSegmentNumberPreview,
    fourSegmentNumberPreview,
    selectedKodeKlasifikasi,
    activeJraItem,
    tingkatKeamanan,
    selectedUnitKode,
    nomorUrut,
    tahun
  ]);

  useEffect(() => {
    if (typeof onSecurityTriggerChange === 'function') {
      onSecurityTriggerChange({
        isRestrictedSecret,
        tingkatKeamanan,
        isPrintBlocked,
        authorizedPrintOverride,
        jraMetadata: activeJraItem
      });
    }
  }, [isRestrictedSecret, tingkatKeamanan, isPrintBlocked, authorizedPrintOverride, activeJraItem]);

  // Handler when Tier 1 (Kategori Utama) changes
  const handlePrimaryChange = (newPrimary) => {
    setSelectedPrimaryCode(newPrimary);
    const firstSub = JRA_SUB_CATEGORIES.find((s) => s.kode_utama === newPrimary);
    const subCode = firstSub ? firstSub.kode_sub : `${newPrimary}.00`;
    setSelectedSubCode(subCode);

    const firstItem =
      JRA_MASTER_ITEMS.find((i) => i.kode_sub === subCode) ||
      JRA_MASTER_ITEMS.find((i) => i.kode_utama === newPrimary);
    if (firstItem) {
      setSelectedKodeKlasifikasi(firstItem.kode_klasifikasi);
      if (firstItem.kode_keamanan === 'SR') setTingkatKeamanan('SR');
      else if (firstItem.kode_keamanan === 'R') setTingkatKeamanan('R');
      else setTingkatKeamanan('B');
    }
  };

  // Handler when Tier 2 (Sub-Kategori) changes
  const handleSubChange = (newSub) => {
    setSelectedSubCode(newSub);
    const firstItem = JRA_MASTER_ITEMS.find((i) => i.kode_sub === newSub);
    if (firstItem) {
      setSelectedKodeKlasifikasi(firstItem.kode_klasifikasi);
      if (firstItem.kode_keamanan === 'SR') setTingkatKeamanan('SR');
      else if (firstItem.kode_keamanan === 'R') setTingkatKeamanan('R');
      else setTingkatKeamanan('B');
    }
  };

  // Handler when selecting an item from Search or Quick Shortcut
  const handleSelectJraItem = (item) => {
    if (!item) return;
    setSelectedPrimaryCode(item.kode_utama);
    setSelectedSubCode(item.kode_sub);
    setSelectedKodeKlasifikasi(item.kode_klasifikasi);
    if (item.kode_keamanan === 'SR') {
      setTingkatKeamanan('SR');
      setIncludeSecurityInNumber(true);
    } else if (item.kode_keamanan === 'R') {
      setTingkatKeamanan('R');
      setIncludeSecurityInNumber(true);
    } else {
      setTingkatKeamanan('B');
    }
    setSearchQuery('');
  };

  const handleRestoreDefault = () => {
    const recItem = getJraItemByCode(templateRecommendation.defaultKode);
    if (recItem) {
      handleSelectJraItem(recItem);
    }
  };

  const isUsingDefaultCode = selectedKodeKlasifikasi === templateRecommendation.defaultKode;

  return (
    <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 p-3.5 shadow-sm space-y-3 text-slate-800">
      {/* HEADER: Klasifikasi & Format Nomor Surat */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                Klasifikasi & Penomoran Surat
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                Format Resmi UNSIL
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Pilih topik surat Anda. Sistem akan otomatis memasang kode arsip dan nomor surat yang sesuai.
            </p>
          </div>
        </div>

        {!isUsingDefaultCode && (
          <button
            type="button"
            onClick={handleRestoreDefault}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition"
            title="Kembalikan ke topik bawaan template"
          >
            <RotateCcw className="w-3 h-3" />
            Kembalikan ke Pilihan Awal ({templateRecommendation.defaultKode})
          </button>
        )}
      </div>

      {/* 1. PEMILIHAN TOPIK / ISI SURAT */}
      <div className="rounded-lg border border-indigo-200 bg-white p-3 space-y-2.5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            1. Pilih Topik / Isi Surat
          </span>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Kode Arsip Terpilih: <strong className="font-mono">{selectedKodeKlasifikasi}</strong>
          </span>
        </div>

        {/* Searchable Selector Berbasis Perihal */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik topik surat... (contoh: Kenaikan Pangkat, Surat Tugas, Izin Penelitian, Seminar)"
            className="w-full rounded-lg border border-indigo-300 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-indigo-500 absolute left-2.5 top-2" />

          {searchResults.length > 0 && (
            <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-indigo-200 bg-white shadow-xl divide-y divide-slate-100">
              {searchResults.map((item) => (
                <button
                  key={item.kode_klasifikasi}
                  type="button"
                  onClick={() => handleSelectJraItem(item)}
                  className="w-full text-left px-3 py-2 hover:bg-indigo-50 flex items-start justify-between gap-2 transition"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800">{item.nama_klasifikasi}</div>
                    <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-1 mt-0.5">
                      <span>{item.nama_utama}</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                      <span>{item.nama_sub}</span>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-200">
                    {item.kode_klasifikasi}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3-Tier Hierarchical Cascading Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-0.5">
          {/* Tier 1: Kategori Utama */}
          <div>
            <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
              Bidang Urusan
            </label>
            <select
              value={selectedPrimaryCode}
              onChange={(e) => handlePrimaryChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
            >
              {JRA_PRIMARY_CATEGORIES.map((cat) => (
                <option key={cat.kode_utama} value={cat.kode_utama}>
                  {cat.nama_utama} ({cat.kode_utama})
                </option>
              ))}
            </select>
          </div>

          {/* Tier 2: Sub-Kategori */}
          <div>
            <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
              Jenis Kegiatan
            </label>
            <select
              value={selectedSubCode}
              onChange={(e) => handleSubChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
            >
              {availableSubCategories.map((sub) => (
                <option key={sub.kode_sub} value={sub.kode_sub}>
                  {sub.nama_sub} ({sub.kode_sub})
                </option>
              ))}
            </select>
          </div>

          {/* Tier 3: Perihal Spesifik */}
          <div>
            <label className="block text-[10.5px] font-bold text-indigo-900 mb-1">
              Topik Surat *
            </label>
            <select
              value={selectedKodeKlasifikasi}
              onChange={(e) => {
                const chosen = getJraItemByCode(e.target.value);
                if (chosen) handleSelectJraItem(chosen);
                else setSelectedKodeKlasifikasi(e.target.value);
              }}
              className="w-full rounded-lg border-2 border-indigo-500 bg-indigo-50/70 px-2.5 py-1.5 text-xs font-bold text-indigo-950 focus:border-indigo-700 focus:outline-none"
            >
              {availableSpecificItems.map((item) => (
                <option key={item.kode_klasifikasi} value={item.kode_klasifikasi}>
                  {item.nama_klasifikasi} ({item.kode_klasifikasi})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. PRATINJAU NOMOR RESMI & KOMPONEN PENYUSUN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
        {/* Komponen Pembentuk Nomor (7 cols) */}
        <div className="lg:col-span-7 rounded-lg border border-slate-200 bg-white p-3 space-y-2.5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-100 pb-1.5">
            <span className="text-xs font-bold text-slate-800">
              2. Komponen Penyusun Nomor Surat
            </span>
            <label className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSecurityInNumber || isRestrictedSecret}
                disabled={isRestrictedSecret}
                onChange={(e) => setIncludeSecurityInNumber(e.target.checked)}
                className="rounded text-indigo-600 w-3.5 h-3.5"
              />
              <span>Tampilkan tanda sifat ({tingkatKeamanan}) di nomor</span>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Nomor Urut */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 mb-1">
                <Hash className="w-3 h-3 text-indigo-500" />
                Nomor Urut
              </label>
              <input
                type="number"
                min={1}
                value={nomorUrut}
                onChange={(e) => setNomorUrut(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-mono font-bold text-slate-800"
                title="Nomor urutan surat keluar yang diterbitkan"
              />
            </div>

            {/* Unit Kerja */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 mb-1">
                <Building2 className="w-3 h-3 text-indigo-500" />
                Unit Penerbit
              </label>
              <select
                value={selectedUnitKode}
                onChange={(e) => setSelectedUnitKode(e.target.value)}
                className="w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-1.5 text-xs font-mono font-bold text-slate-800"
                title="Unit kerja asal pembuat surat"
              >
                {UNIT_CODE_MAP.map((u) => (
                  <option key={u.id} value={u.kode}>
                    {u.kode} ({u.short})
                  </option>
                ))}
              </select>
            </div>

            {/* Sifat Surat */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 mb-1">
                <Lock className="w-3 h-3 text-indigo-500" />
                Sifat Surat
              </label>
              <select
                value={tingkatKeamanan}
                onChange={(e) => {
                  setTingkatKeamanan(e.target.value);
                  if (e.target.value === 'R' || e.target.value === 'SR') {
                    setIncludeSecurityInNumber(true);
                  }
                  setAuthorizedPrintOverride(false);
                }}
                className={`w-full rounded border px-1.5 py-1.5 text-xs font-bold ${
                  tingkatKeamanan === 'SR'
                    ? 'border-red-300 bg-red-50 text-red-800'
                    : tingkatKeamanan === 'R'
                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                }`}
              >
                <option value="B">B — Biasa</option>
                <option value="R">R — Rahasia</option>
                <option value="SR">SR — Sangat Rahasia</option>
              </select>
            </div>

            {/* Kode & Tahun */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 mb-1">
                <Calendar className="w-3 h-3 text-indigo-500" />
                Kode / Tahun
              </label>
              <input
                type="text"
                readOnly
                value={`${selectedKodeKlasifikasi} / ${tahun}`}
                className="w-full rounded border border-indigo-200 bg-indigo-50/80 px-2 py-1.5 text-xs font-mono font-bold text-indigo-950 cursor-default"
                title="Kode topik surat dan tahun berjalan"
              />
            </div>
          </div>
        </div>

        {/* Pratinjau Nomor Terpasang (5 cols) */}
        <div className="lg:col-span-5 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Pratinjau Nomor Surat Resmi
            </span>
            <span className="text-[10px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
              Otomatis
            </span>
          </div>

          <div className="my-1.5">
            <input
              type="text"
              readOnly
              value={finalLetterNumber}
              className="w-full rounded-lg bg-white border border-emerald-300 px-3 py-1.5 font-mono text-sm font-extrabold tracking-wide text-emerald-900 cursor-default select-all shadow-xs"
              title="Nomor resmi yang akan dicantumkan pada kop surat"
            />
            <p className="text-[10.5px] text-emerald-800/90 mt-1 leading-relaxed">
              💡 Format nomor: [Urut: {nomorUrut}] / [{selectedUnitKode}] / {includeSecurityInNumber ? `[${tingkatKeamanan}] / ` : ''}[{selectedKodeKlasifikasi}] / [{tahun}]
            </p>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-emerald-200/60">
            <span>Standar: {fourSegmentNumberPreview}</span>
            <span>Dengan Sifat: {fiveSegmentNumberPreview}</span>
          </div>
        </div>
      </div>

      {/* INFORMASI PENYIMPANAN ARSIP */}
      {activeJraItem && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-700">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="font-semibold text-slate-800">Topik Terdaftar:</span>
            <span className="font-mono font-bold text-indigo-800 bg-white px-1.5 py-0.5 rounded border border-indigo-200">
              {activeJraItem.kode_klasifikasi}
            </span>
            <span className="text-slate-600">— {activeJraItem.nama_klasifikasi}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
              Simpan di Unit: <strong>{activeJraItem.retensi_aktif} Tahun</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
              Simpan di Pusat: <strong>{activeJraItem.retensi_inaktif} Tahun</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
              Akhir Berkas: <strong>{activeJraItem.nasib_akhir}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
              Kategori: <strong>{activeJraItem.klasifikasi_keamanan}</strong>
            </span>
          </div>
        </div>
      )}

      {/* INFORMASI KEAMANAN (JIKA SURAT RAHASIA / SANGAT RAHASIA) */}
      {isRestrictedSecret && (
        <div
          className={`rounded-xl border p-3 space-y-2 shadow-xs transition-all ${
            tingkatKeamanan === 'SR'
              ? 'border-red-300 bg-red-50/90 text-red-950'
              : 'border-amber-300 bg-amber-50/90 text-amber-950'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert
                className={`w-5 h-5 shrink-0 ${
                  tingkatKeamanan === 'SR' ? 'text-red-600' : 'text-amber-600'
                }`}
              />
              <div>
                <h4 className="text-xs font-bold">
                  Surat Ini Ditandai Sifat {tingkatKeamanan === 'SR' ? 'Sangat Rahasia' : 'Rahasia'}
                </h4>
                <p className="text-[11px] opacity-90">
                  Sesuai pedoman persuratan UNSIL, dokumen ini memiliki perlakuan khusus:
                </p>
              </div>
            </div>

            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-current text-[11px] font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={authorizedPrintOverride}
                onChange={(e) => setAuthorizedPrintOverride(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <Printer className="w-3.5 h-3.5" />
              <span>Izin Cetak Khusus Pejabat</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
            <div className="rounded-lg bg-white/90 border border-current/20 p-2 flex items-start gap-2">
              <FileWarning className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div>
                <div className="font-bold">1. Amplop Rangkap Dua</div>
                <p className="text-[10.5px] leading-relaxed text-slate-700">
                  Pengiriman surat fisik wajib memakai amplop rangkap dua yang tersegel cap dinas resmi.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-white/90 border border-current/20 p-2 flex items-start gap-2">
              <Lock className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div>
                <div className="font-bold">2. Akses Terbatas</div>
                <p className="text-[10.5px] leading-relaxed text-slate-700">
                  Hanya dapat dibaca oleh:{' '}
                  <strong>
                    {activeJraItem?.hak_akses || 'Rektor, pejabat penerima, dan pemeriksa yang berwenang'}
                  </strong>.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-white/90 border border-current/20 p-2 flex items-start gap-2">
              <Printer className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div>
                <div className="font-bold">
                  3. {isPrintBlocked ? 'Pencetakan Dibatasi' : 'Izin Cetak Diberikan'}
                </div>
                <p className="text-[10.5px] leading-relaxed text-slate-700">
                  {isPrintBlocked
                    ? 'Tombol cetak dinonaktifkan sementara untuk menjaga keamanan dokumen. Gunakan izin cetak jika diperlukan.'
                    : 'Pencetakan disetujui untuk pejabat berwenang dan wajib diawasi.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
