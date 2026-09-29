import React, { useState, useMemo, useEffect } from 'react';
import {
  Award,
  Building2,
  Calendar,
  FileCheck2,
  Info,
  Search,
  Shield,
  Users
} from 'lucide-react';
import {
  PositionOption,
  UnitCategoryOption,
  MASTER_FACULTIES,
  MASTER_POSITIONS,
  UNSIL_REKTORAT_ALLOWED_CODES,
  LPPM_ALLOWED_CODES,
  LPMPP_ALLOWED_CODES
} from '../../modules/admin/sotkMasterData';

export type { PositionOption, UnitCategoryOption };
export {
  MASTER_FACULTIES,
  MASTER_POSITIONS,
  UNSIL_REKTORAT_ALLOWED_CODES,
  LPPM_ALLOWED_CODES,
  LPMPP_ALLOWED_CODES
};


export interface LeadershipMutationPanelProps {
  // Controlled props
  selectedUnit?: string;
  onUnitChange?: (unit: string) => void;
  selectedPosition?: string;
  onPositionChange?: (positionCode: string, positionObj?: PositionOption) => void;
  assignmentStatus?: 'DEFINITIF' | 'PLT' | 'PLH';
  onStatusChange?: (status: 'DEFINITIF' | 'PLT' | 'PLH') => void;
  startDate?: string;
  onStartDateChange?: (date: string) => void;
  decreeNumber?: string;
  onDecreeNumberChange?: (decree: string) => void;
  notes?: string;
  onNotesChange?: (notes: string) => void;
  disabled?: boolean;
}

export const LeadershipMutationPanel: React.FC<LeadershipMutationPanelProps> = ({
  selectedUnit: controlledUnit,
  onUnitChange,
  selectedPosition: controlledPosition,
  onPositionChange,
  assignmentStatus: controlledStatus,
  onStatusChange,
  startDate: controlledStartDate,
  onStartDateChange,
  decreeNumber: controlledDecree,
  onDecreeNumberChange,
  notes: controlledNotes,
  onNotesChange,
  disabled = false
}) => {
  // Uncontrolled state fallbacks
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [internalUnit, setInternalUnit] = useState<string>('FT');
  const [internalPosition, setInternalPosition] = useState<string>('DEKAN_FT');
  const [internalStatus, setInternalStatus] = useState<'DEFINITIF' | 'PLT' | 'PLH'>('DEFINITIF');
  const [internalStartDate, setInternalStartDate] = useState<string>(todayStr);
  const [internalDecree, setInternalDecree] = useState<string>('SK Rektor No. 2803/UN58/OT/2023');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [positionsData, setPositionsData] = useState<PositionOption[]>(MASTER_POSITIONS);

  const selectedUnitRaw = controlledUnit !== undefined ? controlledUnit : internalUnit;
  const selectedPosition = controlledPosition !== undefined ? controlledPosition : internalPosition;
  const assignmentStatus = controlledStatus !== undefined ? controlledStatus : internalStatus;
  const startDate = controlledStartDate !== undefined ? controlledStartDate : internalStartDate;
  const decreeNumber = controlledDecree !== undefined ? controlledDecree : internalDecree;
  const notes = controlledNotes !== undefined ? controlledNotes : internalNotes;

  // Fetch dynamic positions from backend if available
  useEffect(() => {
    let isMounted = true;
    fetch('/api/positions')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0 && isMounted) {
          const mapped: PositionOption[] = json.data.map((p: any) => ({
            id: p.id,
            code: p.position_code || p.code,
            name: p.name,
            unitGroup: p.unit_id || 'UNSIL',
            unitName: p.unit_name,
            parentUnitId: p.parent_unit_id,
            facultyId: p.faculty_id || p.parent_unit_id || p.unit_id,
            level: p.level || 'FAKULTAS',
            canSignPolicy: Boolean(p.can_sign_policy),
            isVacant: !p.current_occupant,
            currentOccupant: p.current_occupant || null
          }));
          setPositionsData(mapped);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Pastikan unit yang dipilih di Tier 1 selalu sinkron dengan fakultas/lembaga induknya
  const effectiveUnit = useMemo(() => {
    // Normalisasi UN58 -> UNSIL, LP3M -> LPMPP
    let normalizedUnit = selectedUnitRaw === 'UN58' ? 'UNSIL' : selectedUnitRaw;
    if (normalizedUnit === 'LP3M') normalizedUnit = 'LPMPP';
    if (normalizedUnit && MASTER_FACULTIES.some((f) => f.id === normalizedUnit)) {
      return normalizedUnit;
    }
    // Jika selectedUnit adalah kode jurusan / pusat, cari unit induknya
    const matched = positionsData.find(
      (p) => p.unitGroup === selectedUnitRaw || p.code === selectedPosition || p.id === selectedPosition
    );
    if (matched?.facultyId) {
      let normFaculty = matched.facultyId === 'UN58' ? 'UNSIL' : matched.facultyId;
      if (normFaculty === 'LP3M') normFaculty = 'LPMPP';
      if (MASTER_FACULTIES.some((f) => f.id === normFaculty)) {
        return normFaculty;
      }
    }
    return 'FT';
  }, [selectedUnitRaw, selectedPosition, positionsData]);

  // Filter formasi berdasarkan unit kerja dan kata kunci pencarian
  const filteredPositions = useMemo(() => {
    const list = positionsData.filter((pos) => {
      const code = pos.code || (pos as any).position_code;
      let matchUnit = false;

      if (effectiveUnit === 'ALL') {
        matchUnit = true;
      } else if (effectiveUnit === 'UNSIL') {
        // Tepat 8 formasi eksklusif untuk UNSIL / Rektorat sesuai permintaan
        matchUnit = UNSIL_REKTORAT_ALLOWED_CODES.includes(code);
      } else if (effectiveUnit === 'LPPM') {
        matchUnit = LPPM_ALLOWED_CODES.includes(code);
      } else if (effectiveUnit === 'LPMPP' || effectiveUnit === 'LP3M') {
        matchUnit = LPMPP_ALLOWED_CODES.includes(code) || code === 'KEPALA_LP3M';
      } else {
        const normFaculty = pos.facultyId === 'UN58' ? 'UNSIL' : pos.facultyId;
        const normUnitGroup = pos.unitGroup === 'UN58' ? 'UNSIL' : pos.unitGroup;
        matchUnit = normUnitGroup === effectiveUnit || normFaculty === effectiveUnit;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        pos.name.toLowerCase().includes(q) ||
        pos.code.toLowerCase().includes(q) ||
        (pos.unitGroup && pos.unitGroup.toLowerCase().includes(q)) ||
        (pos.facultyId && pos.facultyId.toLowerCase().includes(q));

      return matchUnit && matchQuery;
    });

    if (effectiveUnit === 'UNSIL') {
      return list.sort((a, b) => {
        const codeA = a.code || (a as any).position_code;
        const codeB = b.code || (b as any).position_code;
        const idxA = UNSIL_REKTORAT_ALLOWED_CODES.indexOf(codeA);
        const idxB = UNSIL_REKTORAT_ALLOWED_CODES.indexOf(codeB);
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
      });
    }

    if (effectiveUnit === 'LPPM') {
      return list.sort((a, b) => {
        const codeA = a.code || (a as any).position_code;
        const codeB = b.code || (b as any).position_code;
        const idxA = LPPM_ALLOWED_CODES.indexOf(codeA);
        const idxB = LPPM_ALLOWED_CODES.indexOf(codeB);
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
      });
    }

    if (effectiveUnit === 'LPMPP' || effectiveUnit === 'LP3M') {
      return list.sort((a, b) => {
        const codeA = a.code || (a as any).position_code;
        const codeB = b.code || (b as any).position_code;
        const idxA = LPMPP_ALLOWED_CODES.indexOf(codeA);
        const idxB = LPMPP_ALLOWED_CODES.indexOf(codeB);
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
      });
    }

    // Untuk Fakultas & Pascasarjana: urutkan Dekan -> Wadek 1 -> Wadek 2 -> Kasubbag TU -> Jurusan (Kajur lalu Sekjur)
    return list.sort((a, b) => {
      const codeA = a.code || (a as any).position_code || '';
      const codeB = b.code || (b as any).position_code || '';

      const getGroupOrder = (code: string) => {
        if (code.startsWith('DEKAN_') || code.startsWith('DIREKTUR_')) return 1;
        if ((code.includes('WADEK_') && code.endsWith('_1')) || code === 'WADIR_PASCA' || code === 'WADIR_PASCA_1') return 2;
        if ((code.includes('WADEK_') && code.endsWith('_2')) || code === 'WADIR_PASCA_2') return 3;
        if (code.startsWith('KASUBBAG_TU_')) return 4;
        return 5; // Jurusan
      };

      const groupA = getGroupOrder(codeA);
      const groupB = getGroupOrder(codeB);

      if (groupA !== groupB) {
        return groupA - groupB;
      }

      if (groupA === 5 && groupB === 5) {
        const unitA = a.unitGroup || '';
        const unitB = b.unitGroup || '';
        if (unitA === unitB) {
          const isKajurA = codeA.startsWith('KAJUR_');
          const isKajurB = codeB.startsWith('KAJUR_');
          if (isKajurA && !isKajurB) return -1;
          if (!isKajurA && isKajurB) return 1;
        }
        return 0;
      }

      return 0;
    });
  }, [positionsData, effectiveUnit, searchQuery]);

  // Formasi yang saat ini dipilih (selalu terkungkung di dalam filteredPositions)
  const activePositionObj = useMemo(() => {
    return (
      filteredPositions.find(
        (p) => p.code === selectedPosition || p.id === selectedPosition
      ) || filteredPositions[0] || null
    );
  }, [selectedPosition, filteredPositions]);

  const handleUnitSelect = (unitVal: string) => {
    let normVal = unitVal === 'UN58' ? 'UNSIL' : unitVal;
    if (normVal === 'LP3M') normVal = 'LPMPP';
    if (onUnitChange) onUnitChange(normVal);
    else setInternalUnit(normVal);

    // Auto-select first matching position for the selected unit
    let matching: PositionOption[] = [];
    if (normVal === 'UNSIL') {
      matching = positionsData
        .filter((p) => UNSIL_REKTORAT_ALLOWED_CODES.includes(p.code || (p as any).position_code))
        .sort((a, b) => {
          const idxA = UNSIL_REKTORAT_ALLOWED_CODES.indexOf(a.code || (a as any).position_code);
          const idxB = UNSIL_REKTORAT_ALLOWED_CODES.indexOf(b.code || (b as any).position_code);
          return idxA - idxB;
        });
    } else if (normVal === 'LPPM') {
      matching = positionsData
        .filter((p) => LPPM_ALLOWED_CODES.includes(p.code || (p as any).position_code))
        .sort((a, b) => {
          const idxA = LPPM_ALLOWED_CODES.indexOf(a.code || (a as any).position_code);
          const idxB = LPPM_ALLOWED_CODES.indexOf(b.code || (b as any).position_code);
          return idxA - idxB;
        });
    } else if (normVal === 'LPMPP') {
      matching = positionsData
        .filter((p) => LPMPP_ALLOWED_CODES.includes(p.code || (p as any).position_code) || (p.code || (p as any).position_code) === 'KEPALA_LP3M')
        .sort((a, b) => {
          const idxA = LPMPP_ALLOWED_CODES.indexOf(a.code || (a as any).position_code);
          const idxB = LPMPP_ALLOWED_CODES.indexOf(b.code || (b as any).position_code);
          return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
        });
    } else {
      matching = positionsData
        .filter((p) => {
          const normFaculty = p.facultyId === 'UN58' ? 'UNSIL' : p.facultyId;
          const normUnitGroup = p.unitGroup === 'UN58' ? 'UNSIL' : p.unitGroup;
          return (
            normVal === 'ALL' ||
            normUnitGroup === normVal ||
            normFaculty === normVal
          );
        })
        .sort((a, b) => {
          const codeA = a.code || (a as any).position_code || '';
          const codeB = b.code || (b as any).position_code || '';

          const getGroupOrder = (code: string) => {
            if (code.startsWith('DEKAN_') || code.startsWith('DIREKTUR_')) return 1;
            if ((code.includes('WADEK_') && code.endsWith('_1')) || code === 'WADIR_PASCA' || code === 'WADIR_PASCA_1') return 2;
            if ((code.includes('WADEK_') && code.endsWith('_2')) || code === 'WADIR_PASCA_2') return 3;
            if (code.startsWith('KASUBBAG_TU_')) return 4;
            return 5;
          };

          return getGroupOrder(codeA) - getGroupOrder(codeB);
        });
    }

    if (matching.length > 0) {
      const firstPos = matching[0];
      const codeOrId = firstPos.id || firstPos.code;
      if (onPositionChange) onPositionChange(codeOrId, firstPos);
      else setInternalPosition(codeOrId);
    }
  };

  const handlePositionSelect = (posVal: string) => {
    const found = positionsData.find((p) => p.id === posVal || p.code === posVal);
    let targetFaculty = found?.facultyId === 'UN58' ? 'UNSIL' : found?.facultyId;
    if (targetFaculty === 'LP3M') targetFaculty = 'LPMPP';
    // Sinkronkan unit induk jika formasi yang dipilih berada di fakultas/lembaga tertentu
    if (targetFaculty && targetFaculty !== effectiveUnit) {
      if (onUnitChange) onUnitChange(targetFaculty);
      else setInternalUnit(targetFaculty);
    }
    if (onPositionChange) onPositionChange(posVal, found);
    else setInternalPosition(posVal);
  };

  const handleStatusSelect = (st: 'DEFINITIF' | 'PLT' | 'PLH') => {
    if (onStatusChange) onStatusChange(st);
    else setInternalStatus(st);
  };

  const handleDateChange = (dateVal: string) => {
    if (onStartDateChange) onStartDateChange(dateVal);
    else setInternalStartDate(dateVal);
  };

  const handleDecreeChange = (val: string) => {
    if (onDecreeNumberChange) onDecreeNumberChange(val);
    else setInternalDecree(val);
  };

  const handleNotesChange = (val: string) => {
    if (onNotesChange) onNotesChange(val);
    else setInternalNotes(val);
  };

  return (
    <div className="rounded-2xl border-2 border-amber-300/80 bg-amber-50/70 p-5 shadow-sm space-y-4">
      {/* Formasi Jabatan Struktural (SOTK UNSIL) & Pencarian Cepat */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-700" />
              <span>Formasi Jabatan Struktural (SOTK UNSIL) *</span>
            </span>
            <span className="text-[11px] font-mono text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded font-bold border border-amber-300/60">
              {filteredPositions.length} Formasi Tersedia
            </span>
          </label>
          <select
            value={selectedPosition}
            disabled={disabled}
            onChange={(e) => handlePositionSelect(e.target.value)}
            className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer disabled:opacity-60"
          >
            {effectiveUnit === 'UNSIL' ? (
              <>
                <optgroup label="Pimpinan Universitas / Rektorat">
                  {filteredPositions
                    .filter((p) =>
                      ['REKTOR', 'WAREK_1', 'WAREK_2', 'WAREK_3'].includes(p.code || (p as any).position_code)
                    )
                    .map((pos) => (
                      <option key={pos.id || pos.code} value={pos.id || pos.code}>
                        {pos.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Pejabat Struktural Biro">
                  {filteredPositions
                    .filter((p) =>
                      ['KEPALA_BIRO_BKU', 'KEPALA_BIRO_BAKPK', 'KABAG_UMUM_BKU', 'KABAG_AKADEMIK_BAKPK'].includes(
                        p.code || (p as any).position_code
                      )
                    )
                    .map((pos) => (
                      <option key={pos.id || pos.code} value={pos.id || pos.code}>
                        {pos.name}
                      </option>
                    ))}
                </optgroup>
              </>
            ) : effectiveUnit === 'LPPM' ? (
              <>
                <optgroup label="Pimpinan Lembaga & Tata Usaha">
                  {filteredPositions
                    .filter((p) =>
                      ['KEPALA_LPPM', 'SEKRETARIS_LPPM', 'KASUBBAG_TU_LPPM'].includes(p.code || (p as any).position_code)
                    )
                    .map((pos) => (
                      <option key={pos.id || pos.code} value={pos.id || pos.code}>
                        {pos.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Kepala-Kepala Pusat di Lingkungan LPPM">
                  {filteredPositions
                    .filter((p) =>
                      (p.code || (p as any).position_code || '').startsWith('KAPUS_')
                    )
                    .map((pos) => (
                      <option key={pos.id || pos.code} value={pos.id || pos.code}>
                        {pos.name}
                      </option>
                    ))}
                </optgroup>
              </>
            ) : (effectiveUnit === 'LPMPP' || effectiveUnit === 'LP3M') ? (
              <>
                <optgroup label="Pimpinan Lembaga & Tata Usaha">
                  {filteredPositions
                    .filter((p) =>
                      ['KEPALA_LPMPP', 'SEKRETARIS_LPMPP', 'KASUBBAG_TU_LPMPP', 'KEPALA_LP3M'].includes(p.code || (p as any).position_code)
                    )
                    .map((pos) => (
                      <option key={pos.id || pos.code} value={pos.id || pos.code}>
                        {pos.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Kepala-Kepala Pusat di Lingkungan LPMPP">
                  {filteredPositions
                    .filter((p) =>
                      (p.code || (p as any).position_code || '').startsWith('KAPUS_')
                    )
                    .map((pos) => (
                      <option key={pos.id || pos.code} value={pos.id || pos.code}>
                        {pos.name}
                      </option>
                    ))}
                </optgroup>
              </>
            ) : (
              <>
                {filteredPositions.some((p) => p.level === 'FAKULTAS') && (
                  <optgroup label="Pimpinan Fakultas & Tata Usaha">
                    {filteredPositions
                      .filter((p) => p.level === 'FAKULTAS')
                      .map((pos) => (
                        <option key={pos.id || pos.code} value={pos.id || pos.code}>
                          {pos.name}
                        </option>
                      ))}
                  </optgroup>
                )}
                {filteredPositions.some((p) => p.level === 'JURUSAN') && (
                  <optgroup label="Pimpinan Jurusan (Ketua & Sekretaris Jurusan)">
                    {filteredPositions
                      .filter((p) => p.level === 'JURUSAN')
                      .map((pos) => (
                        <option key={pos.id || pos.code} value={pos.id || pos.code}>
                          {pos.name}
                        </option>
                      ))}
                  </optgroup>
                )}
                {filteredPositions.some((p) => p.level !== 'FAKULTAS' && p.level !== 'JURUSAN') && (
                  <optgroup label="Pimpinan Lembaga / Unit">
                    {filteredPositions
                      .filter((p) => p.level !== 'FAKULTAS' && p.level !== 'JURUSAN')
                      .map((pos) => (
                        <option key={pos.id || pos.code} value={pos.id || pos.code}>
                          {pos.name}
                        </option>
                      ))}
                  </optgroup>
                )}
              </>
            )}
          </select>
        </div>

        {/* Pencarian Cepat Formasi */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-amber-700" />
            <span>Pencarian Cepat Jabatan</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              disabled={disabled}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari 'Dekan', 'Informatika'..."
              className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Scope & Legal Authority Badge */}
      {activePositionObj && (
        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-900 text-xs flex items-start gap-2.5 transition-all">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
          <div className="space-y-1">
            <div className="font-extrabold flex items-center gap-2">
              <span>Wewenang Yuridis: {activePositionObj.name}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-100/80 border border-blue-200 text-blue-800 font-bold">
                Tingkat: {activePositionObj.level}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-950/90">
              {activePositionObj.level === 'JURUSAN' ? (
                <>
                  <strong>Kewenangan Struktural Jurusan:</strong> Memvalidasi pengesahan administrasi internal jurusan, rekomendasi akademik, dan berkas Tridharma sesuai <em>Tabel 1 Matriks Tata Naskah Dinas UNSIL (Peraturan Rektor No. 3/2023)</em>. Batas Keamanan: <strong>Biasa/Terbuka</strong> s.d. <strong>Terbatas</strong>.
                </>
              ) : activePositionObj.level === 'UNIVERSITAS' ? (
                <>
                  <strong>Kewenangan Pimpinan Universitas:</strong> Berwenang penuh menetapkan Peraturan Rektor, Keputusan Rektor, Instruksi, serta penandatanganan naskah dinas universitas berskala nasional & internasional. Batas Keamanan: <strong>Sangat Rahasia</strong>.
                </>
              ) : (
                <>
                  <strong>Kewenangan Pimpinan Fakultas:</strong> Berwenang menerbitkan Surat Tugas, Nota Dinas, Surat Dinas Fakultas, dan pengesahan kurikulum/yudisium sesuai otorisasi Dekanat. Batas Keamanan: <strong>Rahasia</strong>.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Baris Status Penugasan & Tanggal Menjabat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status SK: ['DEFINITIF', 'PLT', 'PLH'] */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Status Penugasan / SK Pelantikan *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['DEFINITIF', 'PLT', 'PLH'] as const).map((status) => (
              <button
                key={status}
                type="button"
                disabled={disabled}
                onClick={() => handleStatusSelect(status)}
                className={`py-2 px-2 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                  assignmentStatus === status
                    ? 'bg-amber-600 border-amber-600 text-white shadow-xs ring-2 ring-amber-500/20'
                    : 'bg-white border-amber-200 text-slate-700 hover:bg-amber-100/50'
                }`}
              >
                <div>{status}</div>
                <div className={`text-[10px] ${assignmentStatus === status ? 'text-amber-100 font-normal' : 'text-slate-500 font-normal'}`}>
                  {status === 'DEFINITIF'
                    ? 'Pejabat Tetap'
                    : status === 'PLT'
                    ? 'Plt. Pelaksana'
                    : 'Plh. Harian'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tanggal Mulai Menjabat */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-700" />
            <span>Tanggal Mulai Menjabat *</span>
          </label>
          <input
            type="date"
            value={startDate}
            disabled={disabled}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
          />
        </div>
      </div>

      {/* Baris Nomor SK & Catatan Mutasi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nomor SK Pelantikan */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-amber-700" />
            <span>Nomor SK Pelantikan / Pengangkatan Resmi *</span>
          </label>
          <input
            type="text"
            value={decreeNumber}
            disabled={disabled}
            onChange={(e) => handleDecreeChange(e.target.value)}
            placeholder="SK Rektor No. 2803/UN58/OT/2023"
            className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
          />
        </div>

        {/* Catatan / Keterangan Mutasi */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-700" />
            <span>Catatan / Keterangan Mutasi (Opsional)</span>
          </label>
          <input
            type="text"
            value={notes}
            disabled={disabled}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="e.g. Penggantian antarwaktu / mutasi definitif pimpinan satker"
            className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
          />
        </div>
      </div>
    </div>
  );
};

export default LeadershipMutationPanel;
