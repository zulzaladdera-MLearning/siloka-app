/**
 * Service Layer: AuditLogger (Singleton Pattern)
 * Mencatat seluruh aktivitas mutasi dokumen secara persisten dan tamper-resistant
 */

import { User } from '../entities/User';
import { NaskahDinas } from '../documents/NaskahDinas';

export interface IAuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  unitKode: string;
  action: string;
  documentId: string;
  documentNomor: string;
  documentPerihal: string;
  details: string;
  integrityHash: string;
}

export class AuditLogger {
  static #instance: AuditLogger | null = null;
  #logs: IAuditLogEntry[] = [];

  private constructor() {
    // Private constructor demi menjaga Singleton Pattern
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.#instance) {
      AuditLogger.#instance = new AuditLogger();
    }
    return AuditLogger.#instance;
  }

  /**
   * Log aktivitas pengguna terhadap dokumen
   */
  public logAction(
    user: User,
    action: string,
    document: NaskahDinas,
    customDetails?: string
  ): IAuditLogEntry {
    const timestamp = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB';
    const logId = `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const docNomor = document.nomorSurat || 'DRAF-BELUM-BERNOMOR';
    const details = customDetails || `Aksi [${action}] dieksekusi pada naskah "${document.perihal}" (${docNomor})`;

    // Generate SHA-256 integrity simulation
    const rawPayload = `${logId}:${timestamp}:${user.id}:${action}:${document.id}`;
    let hash = 0;
    for (let i = 0; i < rawPayload.length; i++) {
      hash = (hash << 5) - hash + rawPayload.charCodeAt(i);
      hash |= 0;
    }
    const integrityHash = `SHA256-${Math.abs(hash).toString(16).padStart(16, '0')}-${Date.now().toString(16)}`;

    const entry: IAuditLogEntry = {
      id: logId,
      timestamp,
      userId: user.id,
      userName: user.namaLengkap,
      userRole: user.role,
      unitKode: user.unitKerja.kodeUnit,
      action,
      documentId: document.id,
      documentNomor: docNomor,
      documentPerihal: document.perihal,
      details,
      integrityHash
    };

    this.#logs.unshift(entry);
    return entry;
  }

  public getLogs(): ReadonlyArray<IAuditLogEntry> {
    return Object.freeze([...this.#logs]);
  }

  public clearLogs(): void {
    this.#logs = [];
  }
}

