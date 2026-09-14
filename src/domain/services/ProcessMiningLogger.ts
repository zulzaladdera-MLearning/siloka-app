/**
 * Service Layer: ProcessMiningLogger (Singleton Pattern)
 * =============================================================================
 * Dirancang khusus untuk arsitektur Data Science & Process Mining Universitas Siliwangi.
 * Mengikuti standar IEEE XES (Extensible Event Stream) untuk analisis:
 * - Process Discovery (Inductive Miner, Heuristics Miner, Alpha Miner)
 * - Bottleneck & SLA Turnaround Duration Detection
 * - Handover of Work & Organizational Network Analysis
 * - Conformance Checking terhadap Tata Naskah Dinas UNSIL
 * 
 * Persistensi: Asinkron (Non-blocking) ke localStorage ('siloka_process_mining_logs')
 * Otoritas Akses Ekspor: Khusus Unit Penunjang Akademik Teknologi Informasi & Komunikasi (UPA TIK)
 * =============================================================================
 */

export type LifecycleTransition =
  | 'START'
  | 'COMPLETE'
  | 'SCHEDULE'
  | 'SUSPEND'
  | 'RESUME'
  | 'ABORT';

export interface IProcessMiningMetadata {
  kategori?: string;
  sifat?: string;
  kategoriKeamanan?: string;
  kodeKlasifikasi?: string;
  subKlasifikasi?: string;
  tujuan?: string;
  targetUnit?: string;
  nomorAgenda?: string;
  dueDate?: string;
  certSerial?: string;
  signerNip?: string;
  slaHours?: number;
  catatan?: string;
  [key: string]: any;
}

export interface IProcessMiningEvent {
  id: string;
  case_id: string;
  activity_name: string;
  timestamp: string; // ISO 8601 with second/millisecond precision
  resource_name: string;
  resource_group: string;
  lifecycle_transition: LifecycleTransition;
  metadata: IProcessMiningMetadata;
}

export interface IUserProfileLike {
  id?: string;
  name?: string;
  nama_lengkap?: string;
  role?: string;
  roleLabel?: string;
  roleLevel?: string;
  unit?: string;
  unit_kerja_id?: string;
  email?: string;
}

// Konstanta Aktivitas Baku (Standardized Activity Names)
export const PROCESS_ACTIVITIES = {
  INBOUND_REGISTRATION: 'Registrasi Surat Masuk',
  DRAFT_SUBMISSION: 'Pengajuan Draf Surat',
  STAFF_REVIEW: 'Pemeriksaan & Telaah Staf',
  PARAF_APPROVAL: 'Pembubuhan Paraf Berjenjang',
  DISPOSITION_ISSUED: 'Pemberian Instruksi Disposisi',
  DISPOSITION_FOLLOWUP: 'Penyelesaian Tindak Lanjut Disposisi',
  TTE_SIGNED: 'Penandatanganan TTE BSrE',
  ARCHIVED_JRA: 'Pengarsipan Dokumen JRA',
  DOCUMENT_DISPATCH: 'Pengiriman Naskah Dinas'
} as const;

// Seed Data Awal (Realistic Baseline Event Traces untuk Analisis Process Mining)
const INITIAL_PROCESS_MINING_EVENTS: IProcessMiningEvent[] = [
  // Case 1: SRT-2026-0871 (Siklus Lengkap Surat Keluar BKU -> TTE -> Arsip)
  {
    id: 'EVT-2026-0001',
    case_id: 'SRT-2026-0871',
    activity_name: PROCESS_ACTIVITIES.DRAFT_SUBMISSION,
    timestamp: '2026-09-08T08:15:00.000Z',
    resource_name: 'Siti Rohmah, S.AP. (Staf Persuratan BKU)',
    resource_group: 'UN58.6 - Biro Keuangan dan Umum',
    lifecycle_transition: 'COMPLETE',
    metadata: {
      kategori: 'Surat Keluar',
      sifat: 'Penting',
      kategoriKeamanan: 'Biasa/Terbuka',
      kodeKlasifikasi: 'KU',
      subKlasifikasi: 'KU.01.00',
      tujuan: 'Kepala Biro Perencanaan, Keuangan, dan BMN Kemendikbudristek',
      slaHours: 48
    }
  },
  {
    id: 'EVT-2026-0002',
    case_id: 'SRT-2026-0871',
    activity_name: PROCESS_ACTIVITIES.PARAF_APPROVAL,
    timestamp: '2026-09-08T10:45:22.000Z',
    resource_name: 'Dr. Nana Sujana, Drs., M.Si. (Kepala Biro BKU)',
    resource_group: 'UN58.6 - Biro Keuangan dan Umum',
    lifecycle_transition: 'COMPLETE',
    metadata: {
      catatan: 'Draf disetujui substansinya, lanjutkan proses otorisasi TTE',
      slaHours: 24
    }
  },
  {
    id: 'EVT-2026-0003',
    case_id: 'SRT-2026-0871',
    activity_name: PROCESS_ACTIVITIES.TTE_SIGNED,
    timestamp: '2026-09-08T13:20:15.000Z',
    resource_name: 'Dr. Nana Sujana, Drs., M.Si. (Kepala Biro BKU)',
    resource_group: 'UN58.6 - Biro Keuangan dan Umum',
    lifecycle_transition: 'COMPLETE',
    metadata: {
      certSerial: 'BSrE-UNSIL-2026-8819',
      signerNip: '196805121993031002',
      status: 'APPROVED_AND_SIGNED'
    }
  },
  {
    id: 'EVT-2026-0004',
    case_id: 'SRT-2026-0871',
    activity_name: PROCESS_ACTIVITIES.ARCHIVED_JRA,
    timestamp: '2026-09-09T09:00:00.000Z',
    resource_name: 'Siti Rohmah, S.AP. (Staf Persuratan BKU)',
    resource_group: 'UN58.6 - Biro Keuangan dan Umum',
    lifecycle_transition: 'COMPLETE',
    metadata: {
      destination: 'Jadwal Retensi Arsip (JRA)',
      retensiAktifTahun: 2,
      retensiInaktifTahun: 5
    }
  },

  // Case 2: SRT-2026-0412 (Siklus Surat Masuk BKU -> Disposisi Kasubbag -> Selesai)
  {
    id: 'EVT-2026-0005',
    case_id: 'SRT-2026-0412',
    activity_name: PROCESS_ACTIVITIES.INBOUND_REGISTRATION,
    timestamp: '2026-09-07T07:45:00.000Z',
    resource_name: 'Siti Rohmah, S.AP. (Staf Persuratan BKU)',
    resource_group: 'UN58.6 - Biro Keuangan dan Umum',
    lifecycle_transition: 'COMPLETE',
    metadata: {
      kategori: 'Surat Masuk',
      sifat: 'Segera',
      kategoriKeamanan: 'Biasa/Terbuka',
      kodeKlasifikasi: 'PL',
      subKlasifikasi: 'PL.02.00',
      asalPengirim: 'KPPN Tasikmalaya',
      slaHours: 24
    }
  },
  {
    id: 'EVT-2026-0006',
    case_id: 'SRT-2026-0412',
    activity_name: PROCESS_ACTIVITIES.DISPOSITION_ISSUED,
    timestamp: '2026-09-07T09:30:10.000Z',
    resource_name: 'Dr. Nana Sujana, Drs., M.Si. (Kepala Biro BKU)',
    resource_group: 'UN58.6 - Biro Keuangan dan Umum',
    lifecycle_transition: 'COMPLETE',
    metadata: {
      targetUnit: 'Bagian Keuangan & Kasubbag Akuntansi',
      nomorAgenda: 'AGD/2026/0142',
      dueDate: '2026-09-11',
      instruksi: 'Tindak lanjuti rekonsiliasi laporan keuangan bulanan'
    }
  },

  // Case 3: FKIP-2026-001 (Siklus FKIP: Draf -> Paraf Dekan -> TTE)
  {
    id: 'EVT-2026-0007',
    case_id: 'FKIP-2026-001',
    activity_name: PROCESS_ACTIVITIES.DRAFT_SUBMISSION,
    timestamp: '2026-09-06T08:00:00.000Z',
    resource_name: 'Dian Fitriani, S.Pd. (Operator TU FKIP)',
    resource_group: 'UN58.10 - Fakultas Keguruan dan Ilmu Pendidikan',
    lifecycle_transition: 'COMPLETE',
    metadata: {
      kategori: 'Surat Keluar',
      sifat: 'Biasa',
      kategoriKeamanan: 'Biasa/Terbuka',
      kodeKlasifikasi: 'PP',
      subKlasifikasi: 'PP.03.05',
      tujuan: 'Kepala Dinas Pendidikan Kota Tasikmalaya',
      slaHours: 48
    }
  },
  {
    id: 'EVT-2026-0008',
    case_id: 'FKIP-2026-001',
    activity_name: PROCESS_ACTIVITIES.TTE_SIGNED,
    timestamp: '2026-09-06T11:20:45.000Z',
    resource_name: 'Dr. H. Cucu Suherman, M.Pd. (Dekan FKIP)',
    resource_group: 'UN58.10 - Fakultas Keguruan dan Ilmu Pendidikan',
    lifecycle_transition: 'COMPLETE',
    metadata: {
      certSerial: 'BSrE-UNSIL-2026-7731',
      signerNip: '196709211992031003',
      status: 'APPROVED_AND_SIGNED'
    }
  }
];

export class ProcessMiningLogger {
  static #instance: ProcessMiningLogger | null = null;
  #events: IProcessMiningEvent[] = [];
  #storageKey = 'siloka_process_mining_logs';

  private constructor() {
    this.#loadFromStorage();
  }

  public static getInstance(): ProcessMiningLogger {
    if (!ProcessMiningLogger.#instance) {
      ProcessMiningLogger.#instance = new ProcessMiningLogger();
    }
    return ProcessMiningLogger.#instance;
  }

  /**
   * Muat data event log dari localStorage atau inisialisasi dengan seed events
   */
  #loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(this.#storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.#events = parsed;
            return;
          }
        }
      }
    } catch (e) {
      console.warn('[ProcessMiningLogger] Gagal memuat event log dari storage:', e);
    }
    // Inisialisasi seed baseline
    this.#events = [...INITIAL_PROCESS_MINING_EVENTS];
    this.#persistAsync();
  }

  /**
   * Persistensi asinkron ke localStorage agar tidak memblokir UI thread
   */
  #persistAsync(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    // Gunakan queueMicrotask / setTimeout agar sepenuhnya non-blocking
    const runner = window.queueMicrotask || ((fn: () => void) => setTimeout(fn, 0));
    runner(() => {
      try {
        window.localStorage.setItem(this.#storageKey, JSON.stringify(this.#events));
      } catch (e) {
        console.error('[ProcessMiningLogger] Gagal menyimpan log ke localStorage:', e);
      }
    });
  }

  /**
   * Catat aktivitas proses secara asinkron (Non-Blocking Logging)
   * Mengembalikan Promise agar pemanggil dapat menggunakan fire-and-forget tanpa 'await'
   */
  public recordEvent(
    caseId: string,
    activityName: string,
    userProfile?: IUserProfileLike | null,
    metadata: IProcessMiningMetadata = {},
    lifecycleTransition: LifecycleTransition = 'COMPLETE'
  ): Promise<IProcessMiningEvent> {
    return new Promise((resolve) => {
      const runner = typeof window !== 'undefined' && window.queueMicrotask ? window.queueMicrotask : (fn: () => void) => setTimeout(fn, 0);

      runner(() => {
        const now = new Date();
        const eventId = `EVT-${now.getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

        // Format nama resource: [Nama] ([Jabatan])
        const rawName = userProfile?.nama_lengkap || userProfile?.name || 'Sistem Otomatis SILOKA';
        const rawRole = userProfile?.roleLabel || userProfile?.role || 'Aparatur Sipil Negara';
        const resourceName = `${rawName} (${rawRole})`;

        // Format resource group: [Kode Unit] - [Nama Unit]
        const unitKode = userProfile?.unit_kerja_id || 'UN58';
        const unitNama = userProfile?.unit || 'Universitas Siliwangi';
        const resourceGroup = `${unitKode} - ${unitNama}`;

        const newEvent: IProcessMiningEvent = {
          id: eventId,
          case_id: caseId,
          activity_name: activityName,
          timestamp: now.toISOString(),
          resource_name: resourceName,
          resource_group: resourceGroup,
          lifecycle_transition: lifecycleTransition,
          metadata: {
            ...metadata,
            recordedAtLocal: now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' })
          }
        };

        this.#events.unshift(newEvent);
        this.#persistAsync();

        // Dispatch Custom DOM Event agar komponen UI/monitoring dapat merespon secara real-time
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          try {
            window.dispatchEvent(
              new CustomEvent('siloka:process_mining_event', {
                detail: newEvent
              })
            );
          } catch {
            // Ignore dispatch errors in non-browser envs
          }
        }

        resolve(newEvent);
      });
    });
  }

  /**
   * Ambil seluruh entri event log (Immutable Readonly Array)
   */
  public getEvents(): ReadonlyArray<IProcessMiningEvent> {
    return Object.freeze([...this.#events]);
  }

  /**
   * Ambil seluruh event untuk satu trace (case_id) tertentu
   */
  public getEventsByCaseId(caseId: string): IProcessMiningEvent[] {
    return this.#events.filter((e) => e.case_id === caseId);
  }

  /**
   * Daftar seluruh case_id unik yang tercatat
   */
  public getUniqueCases(): string[] {
    const cases = new Set(this.#events.map((e) => e.case_id));
    return Array.from(cases);
  }

  /**
   * Ringkasan Metrik Kinerja Proses (Untuk Dashboard Analitik & Bottleneck Discovery)
   */
  public getMetricsSummary() {
    const uniqueCases = this.getUniqueCases();
    const totalEvents = this.#events.length;

    // Hitung frekuensi tiap aktivitas
    const activityCounts: Record<string, number> = {};
    this.#events.forEach((e) => {
      activityCounts[e.activity_name] = (activityCounts[e.activity_name] || 0) + 1;
    });

    return {
      totalCases: uniqueCases.length,
      totalEvents,
      averageEventsPerCase: uniqueCases.length > 0 ? (totalEvents / uniqueCases.length).toFixed(1) : '0',
      activityCounts
    };
  }

  /**
   * Ekspor data ke format CSV standar RFC 4180
   * Kolom: case_id, activity_name, timestamp, resource_name, resource_group, lifecycle_transition, sifat, kategori_keamanan, kode_klasifikasi, tujuan, sla_hours
   * Siap dibaca langsung oleh Pandas (pd.read_csv) dan PM4Py (pm4py.format_dataframe)
   */
  public exportToCSV(): string {
    const headers = [
      'case_id',
      'activity_name',
      'timestamp',
      'resource_name',
      'resource_group',
      'lifecycle_transition',
      'sifat',
      'kategori_keamanan',
      'kode_klasifikasi',
      'tujuan',
      'sla_hours'
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = this.#events.map((evt) => {
      return [
        escapeCsv(evt.case_id),
        escapeCsv(evt.activity_name),
        escapeCsv(evt.timestamp),
        escapeCsv(evt.resource_name),
        escapeCsv(evt.resource_group),
        escapeCsv(evt.lifecycle_transition),
        escapeCsv(evt.metadata.sifat || '-'),
        escapeCsv(evt.metadata.kategoriKeamanan || '-'),
        escapeCsv(evt.metadata.kodeKlasifikasi || '-'),
        escapeCsv(evt.metadata.tujuan || evt.metadata.targetUnit || '-'),
        escapeCsv(evt.metadata.slaHours || '-')
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }

  /**
   * Ekspor data ke format JSON terstruktur (IEEE XES compatible)
   */
  public exportToJSON(): string {
    return JSON.stringify(this.#events, null, 2);
  }

  /**
   * Utilitas Download file CSV langsung di browser
   */
  public downloadCSV(filename?: string): void {
    if (typeof window === 'undefined') return;

    const csvContent = this.exportToCSV();
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `siloka_process_mining_dataset_${timestampStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Utilitas Download file JSON di browser
   */
  public downloadJSON(filename?: string): void {
    if (typeof window === 'undefined') return;

    const jsonContent = this.exportToJSON();
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `siloka_process_mining_dataset_${timestampStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Bersihkan seluruh log dan kembalikan ke kondisi default
   */
  public clearLogs(): void {
    this.#events = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(this.#storageKey);
    }
  }
}

// Ekspos ke global window untuk inspeksi langsung di DevTools Console (sesuai instruksi)
if (typeof window !== 'undefined') {
  (window as any).ProcessMiningLogger = ProcessMiningLogger;
}

