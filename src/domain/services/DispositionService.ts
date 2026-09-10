/**
 * Service Layer: DispositionService (Singleton Pattern)
 * Mengelola alur penerusan lembar disposisi instruksi pimpinan berjenjang.
 */

import { NaskahDinas } from '../documents/NaskahDinas';
import { User } from '../entities/User';
import { AuditLogger } from './AuditLogger';

export interface IDispositionRecord {
  id: string;
  nomorAgenda: string;
  documentId: string;
  documentPerihal: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  toUnitName: string;
  instruksi: string;
  sifat: 'Biasa' | 'Segera' | 'Sangat Segera';
  status: 'Diteruskan' | 'Diproses' | 'Selesai';
  createdAt: string;
}

export class DispositionService {
  static #instance: DispositionService | null = null;
  #dispositions: IDispositionRecord[] = [];

  private constructor() {
    // Private constructor demi menjaga Singleton Pattern
  }

  public static getInstance(): DispositionService {
    if (!DispositionService.#instance) {
      DispositionService.#instance = new DispositionService();
    }
    return DispositionService.#instance;
  }

  /**
   * Meneruskan naskah dinas dengan lembar instruksi disposisi
   */
  public forwardDocument(
    document: NaskahDinas,
    fromUser: User,
    toUser: User,
    instruksi: string,
    sifat: 'Biasa' | 'Segera' | 'Sangat Segera' = 'Segera'
  ): IDispositionRecord {
    if (!document) throw new Error('[DispositionService] Objek NaskahDinas tidak valid.');
    if (!fromUser || !toUser) throw new Error('[DispositionService] Pihak pemberi dan penerima wajib ada.');
    if (!instruksi.trim()) throw new Error('[DispositionService] Isi instruksi disposisi wajib ditentukan.');

    // Verifikasi kewenangan penerus: Staf biasa tidak boleh menerbitkan disposisi pimpinan
    if (fromUser.role === 'PENGAWAS') {
      throw new Error('[DispositionService] Pengawas SPI tidak berwenang menerbitkan lembar disposisi.');
    }

    const currentYear = new Date().getFullYear();
    const agendaIndex = String(this.#dispositions.length + 1).padStart(4, '0');
    const nomorAgenda = `AGD-${currentYear}/${document.unitAsal.kodeUnit}/${agendaIndex}`;

    const record: IDispositionRecord = {
      id: `DSP-${Date.now()}-${agendaIndex}`,
      nomorAgenda,
      documentId: document.id,
      documentPerihal: document.perihal,
      fromUserId: fromUser.id,
      fromUserName: fromUser.namaLengkap,
      toUserId: toUser.id,
      toUserName: toUser.namaLengkap,
      toUnitName: toUser.unitKerja.namaUnit,
      instruksi: instruksi.trim(),
      sifat,
      status: 'Diteruskan',
      createdAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB'
    };

    this.#dispositions.push(record);

    // Otomatis catat ke Audit Log sistem
    AuditLogger.getInstance().logAction(
      fromUser,
      'DISPOSITION_FORWARD',
      document,
      `Meneruskan lembar disposisi agenda [${nomorAgenda}] kepada ${toUser.namaLengkap} (${toUser.unitKerja.namaUnit}): "${instruksi}"`
    );

    return record;
  }

  public getDispositionsForUser(userId: string): ReadonlyArray<IDispositionRecord> {
    return Object.freeze(this.#dispositions.filter((d) => d.toUserId === userId || d.fromUserId === userId));
  }

  public getAllDispositions(): ReadonlyArray<IDispositionRecord> {
    return Object.freeze([...this.#dispositions]);
  }
}

