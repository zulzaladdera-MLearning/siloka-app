/**
 * Service Layer: ArchiveManager (Singleton Pattern)
 * Mengevaluasi siklus hidup naskah dinas berdasarkan Jadwal Retensi Arsip (JRA) ANRI & UNSIL.
 */

import { NaskahDinas, IRetentionConfig } from '../documents/NaskahDinas';
import { User } from '../entities/User';
import { AuditLogger } from './AuditLogger';

export type RetentionStatus = 'Aktif' | 'Inaktif' | 'Musnah' | 'Permanen';

export interface IRetentionEvaluation {
  status: RetentionStatus;
  tahunNaskah: number;
  usiaTahun: number;
  aktifHinggaTahun: number;
  inaktifHinggaTahun: number;
  rekomendasiTindakan: string;
  isLockedSafeguard: boolean;
  jraConfig: IRetentionConfig;
}

export class ArchiveManager {
  static #instance: ArchiveManager | null = null;

  private constructor() {
    // Private constructor demi menjaga Singleton Pattern
  }

  public static getInstance(): ArchiveManager {
    if (!ArchiveManager.#instance) {
      ArchiveManager.#instance = new ArchiveManager();
    }
    return ArchiveManager.#instance;
  }

  /**
   * Memeriksa status retensi arsip naskah dinas secara dinamis
   * berdasarkan tanggal dokumen dan konfigurasi polimorfik getRetentionPeriod()
   */
  public checkRetentionStatus(document: NaskahDinas, referenceDate: Date = new Date()): RetentionStatus {
    const evaluation = this.evaluateDocument(document, referenceDate);
    return evaluation.status;
  }

  /**
   * Melakukan evaluasi mendalam siklus hidup JRA dokumen
   */
  public evaluateDocument(document: NaskahDinas, referenceDate: Date = new Date()): IRetentionEvaluation {
    if (!document) throw new Error('[ArchiveManager] Dokumen naskah dinas tidak valid.');

    const jraConfig = document.getRetentionPeriod();
    const docDate = document.tanggal;
    const docYear = docDate.getFullYear();
    const currentYear = referenceDate.getFullYear();

    const usiaTahun = Math.max(0, currentYear - docYear);
    const aktifHingga = docYear + jraConfig.aktifTahun;
    const inaktifHingga = aktifHingga + jraConfig.inaktifTahun;

    let status: RetentionStatus;
    let rekomendasiTindakan: string;
    let isLockedSafeguard = false;

    if (usiaTahun < jraConfig.aktifTahun) {
      status = 'Aktif';
      rekomendasiTindakan = `Arsip aktif digunakan di unit pengolah (${document.unitAsal.namaUnit}). Simpan di sentral berkas aktif.`;
    } else if (usiaTahun < jraConfig.aktifTahun + jraConfig.inaktifTahun) {
      status = 'Inaktif';
      rekomendasiTindakan = `Pindahkan ke Record Center / Depo Arsip Inaktif BKU. Berkas siap dinilai ulang.`;
    } else {
      // Melebihi masa inaktif
      if (jraConfig.statusAkhir === 'Permanen') {
        status = 'Permanen';
        isLockedSafeguard = true;
        rekomendasiTindakan = `Arsip statis bernilai guna permanen/vital. Kunci otomatis dengan Brankas Digital Safeguard (tidak boleh dimusnahkan).`;
      } else {
        status = 'Musnah';
        rekomendasiTindakan = `Masa retensi habis. Usulkan ke panitia pemusnahan arsip untuk dibuatkan Berita Acara Pemusnahan.`;
      }
    }

    return {
      status,
      tahunNaskah: docYear,
      usiaTahun,
      aktifHinggaTahun: aktifHingga,
      inaktifHinggaTahun: inaktifHingga,
      rekomendasiTindakan,
      isLockedSafeguard,
      jraConfig
    };
  }

  /**
   * Menetapkan arsip secara definitif ke Brankas Digital
   */
  public archivePermanently(document: NaskahDinas, archivist: User): void {
    document.archive();
    AuditLogger.getInstance().logAction(
      archivist,
      'ARCHIVE_PERMANENT',
      document,
      `Menyimpan dokumen ${document.nomorSurat} ke Brankas Arsip Digital Terenkripsi AES-256.`
    );
  }
}

