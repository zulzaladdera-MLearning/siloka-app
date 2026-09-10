/**
 * Hook Integrasi React: useDocumentWorkflow
 * Contoh implementasi Service Layer & Domain Model pada komponen React
 */

import { useState, useCallback } from 'react';
import {
  UnitKerja,
  User,
  Pejabat,
  SuratDinas,
  DispositionService,
  ArchiveManager,
  AuditLogger,
  RetentionStatus
} from './index';

export function useDocumentWorkflow(currentUser: User | Pejabat) {
  const [activeDocument, setActiveDocument] = useState<SuratDinas | null>(null);
  const [retentionStatus, setRetentionStatus] = useState<RetentionStatus | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  /**
   * 1. Membuat Konsep / Draf Surat Dinas Baru
   */
  const createDraftSuratDinas = useCallback(
    (params: {
      perihal: string;
      unitAsal: UnitKerja;
      kodeKlasifikasi: string;
      tujuan: string;
      isiSurat: string;
    }) => {
      const newDoc = new SuratDinas(
        `SRT-${Date.now()}`,
        params.perihal,
        currentUser,
        params.unitAsal,
        params.kodeKlasifikasi,
        params.tujuan,
        params.isiSurat,
        '1 (Satu) Berkas',
        'B'
      );

      // Audit log pembuatan draf
      AuditLogger.getInstance().logAction(
        currentUser,
        'DRAFT_CREATED',
        newDoc,
        `Pembuatan draf surat perihal: "${params.perihal}"`
      );

      setActiveDocument(newDoc);
      setRetentionStatus(ArchiveManager.getInstance().checkRetentionStatus(newDoc));
      setFeedbackMessage('Draf surat dinas berhasil dibuat.');
      return newDoc;
    },
    [currentUser]
  );

  /**
   * 2. Menandatangani Surat dengan TTE BSrE (Khusus Pejabat)
   */
  const signDocumentTTE = useCallback(
    (passphrase: string) => {
      if (!activeDocument) throw new Error('Tidak ada dokumen aktif.');
      if (!(currentUser instanceof Pejabat)) {
        throw new Error('Hanya Pejabat yang memiliki kewenangan penandatanganan TTE.');
      }

      const tteResult = activeDocument.signWithTTE(currentUser, passphrase);

      if (tteResult.isValid) {
        AuditLogger.getInstance().logAction(
          currentUser,
          'DOCUMENT_SIGNED_TTE',
          activeDocument,
          `Dokumen disahkan via TTE BSrE dengan nomor resmi ${activeDocument.nomorSurat}`
        );
        setFeedbackMessage(`Surat berhasil disahkan! Nomor: ${activeDocument.nomorSurat}`);
      }
      return tteResult;
    },
    [activeDocument, currentUser]
  );

  /**
   * 3. Meneruskan Surat melalui Lembar Disposisi
   */
  const forwardDisposisi = useCallback(
    (targetUser: User, instruksi: string) => {
      if (!activeDocument) throw new Error('Tidak ada dokumen aktif.');

      const record = DispositionService.getInstance().forwardDocument(
        activeDocument,
        currentUser,
        targetUser,
        instruksi,
        'Segera'
      );

      setFeedbackMessage(`Disposisi agenda ${record.nomorAgenda} berhasil diteruskan ke ${targetUser.namaLengkap}`);
      return record;
    },
    [activeDocument, currentUser]
  );

  return {
    activeDocument,
    retentionStatus,
    feedbackMessage,
    createDraftSuratDinas,
    signDocumentTTE,
    forwardDisposisi,
    auditLogs: AuditLogger.getInstance().getLogs()
  };
}

