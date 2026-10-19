import { describe, it, expect, vi } from 'vitest';
import {
  checkIfUserIsDisposisiTarget,
  checkIfUserHasReadDisposisi,
  checkIfUserHasOpenedDocument,
  markDisposisiAsRead,
  markDisposisiDocumentViewed,
  getDisposisiReadSummary
} from '../disposisiTrackingHelper';

describe('Sistem Pelacakan Keterbacaan & Tanda Terima Disposisi (Delivery & Read Audit Trail)', () => {
  const mockPemberiRektor = {
    id: 'usr-01',
    nama_lengkap: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nip: '196401011990031002',
    jabatan: 'Rektor Universitas Siliwangi',
    unit: 'Pimpinan Universitas',
    role: 'PIMPINAN'
  };

  const mockTargetWarek2 = {
    id: 'usr-warek-02',
    nama_lengkap: 'Dr. H. Ade Komaludin, M.Sc.',
    nip: '196805121994031003',
    jabatan: 'Wakil Rektor Bidang Keuangan dan Umum',
    unit: 'Wakil Rektor Bidang Keuangan dan Umum',
    unit_kerja_id: 'UN58.2',
    role: 'PEJABAT'
  };

  const mockTargetKepalaBku = {
    id: 'usr-11',
    nama_lengkap: 'Dr. Nana Sujana, Drs., M.Si.',
    nip: '196708151992031002',
    jabatan: 'Kepala Biro Keuangan dan Umum',
    unit: 'Biro Keuangan dan Umum',
    unit_kerja_id: 'UN58.6',
    role: 'PEJABAT'
  };

  const mockNonTargetStaf = {
    id: 'usr-staf-random',
    nama_lengkap: 'Budi Santoso, S.Kom.',
    nip: '199501012022031001',
    jabatan: 'Pengadministrasi Umum',
    unit: 'Fakultas Keguruan dan Ilmu Pendidikan',
    unit_kerja_id: 'UN58.11',
    role: 'STAFF'
  };

  const mockDisposisiTunggal = {
    id: 'DSP-2026-001',
    letterId: 'SRT-IN-001',
    nomorAgenda: 'AGD-2026/UN58/001',
    pemberiDisposisi: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng. (Rektor)',
    pemberiUserId: 'usr-01',
    targetUnit: 'Wakil Rektor Bidang Keuangan dan Umum',
    target_jabatan: 'Wakil Rektor Bidang Keuangan dan Umum',
    target_user_id: 'usr-warek-02',
    target_pejabat_nip: '196805121994031003',
    instruksi: 'Tindak lanjuti penyesuaian pagu anggaran',
    batasWaktu: '20 Okt 2026',
    isRead: false,
    readAt: null,
    readBy: null,
    readers: []
  };

  const mockDisposisiParalel = {
    id: 'DSP-2026-002',
    letterId: 'SRT-IN-002',
    nomorAgenda: 'AGD-2026/UN58/002',
    pemberiDisposisi: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    pemberiUserId: 'usr-01',
    targetUnit: 'Wakil Rektor Bidang Keuangan dan Umum, Kepala Biro Keuangan dan Umum',
    instruksi: 'Kaji dan siapkan tanggapan resmi',
    batasWaktu: '18 Okt 2026',
    isRead: false,
    readers: [],
    targets: [
      {
        id: 'tgt-warek2',
        targetUnit: 'Wakil Rektor Bidang Keuangan dan Umum',
        target_user_id: 'usr-warek-02',
        target_jabatan: 'Wakil Rektor Bidang Keuangan dan Umum',
        target_pejabat_nip: '196805121994031003',
        isLead: true,
        isRead: false,
        readAt: null
      },
      {
        id: 'tgt-bku',
        targetUnit: 'Biro Keuangan dan Umum',
        target_user_id: 'usr-11',
        target_jabatan: 'Kepala Biro Keuangan dan Umum',
        target_pejabat_nip: '196708151992031002',
        isLead: false,
        isRead: false,
        readAt: null
      }
    ]
  };

  describe('1. Deteksi Target Penerima Disposisi (checkIfUserIsDisposisiTarget)', () => {
    it('mengidentifikasi target penerima tunggal berdasarkan user_id dan NIP', () => {
      expect(checkIfUserIsDisposisiTarget(mockDisposisiTunggal, mockTargetWarek2)).toBe(true);
      expect(checkIfUserIsDisposisiTarget(mockDisposisiTunggal, mockNonTargetStaf)).toBe(false);
    });

    it('mengidentifikasi target penerima dalam array targets multi-pejabat (paralel)', () => {
      expect(checkIfUserIsDisposisiTarget(mockDisposisiParalel, mockTargetWarek2)).toBe(true);
      expect(checkIfUserIsDisposisiTarget(mockDisposisiParalel, mockTargetKepalaBku)).toBe(true);
      expect(checkIfUserIsDisposisiTarget(mockDisposisiParalel, mockNonTargetStaf)).toBe(false);
    });

    it('mengidentifikasi target penerima melalui kecocokan nama jabatan atau unit', () => {
      const dispUnitOnly = {
        targetUnit: 'Biro Keuangan dan Umum',
        target_jabatan: 'Kepala Biro Keuangan dan Umum'
      };
      expect(checkIfUserIsDisposisiTarget(dispUnitOnly, mockTargetKepalaBku)).toBe(true);
    });

    it('mengembalikan false jika data disposisi atau pengguna tidak valid', () => {
      expect(checkIfUserIsDisposisiTarget(null, mockTargetWarek2)).toBe(false);
      expect(checkIfUserIsDisposisiTarget(mockDisposisiTunggal, null)).toBe(false);
    });
  });

  describe('2. Deteksi Status Keterbacaan (checkIfUserHasReadDisposisi)', () => {
    it('mengembalikan false jika disposisi baru diterbitkan dan belum dibuka', () => {
      expect(checkIfUserHasReadDisposisi(mockDisposisiTunggal, mockTargetWarek2)).toBe(false);
      expect(checkIfUserHasReadDisposisi(mockDisposisiParalel, mockTargetWarek2)).toBe(false);
    });

    it('mengembalikan true jika user terdaftar di dalam array readers', () => {
      const readDisp = {
        ...mockDisposisiTunggal,
        readers: [
          {
            userId: 'usr-warek-02',
            nip: '196805121994031003',
            name: 'Dr. H. Ade Komaludin, M.Sc.',
            readAt: '15 Okt 2026, 09:00 WIB'
          }
        ]
      };
      expect(checkIfUserHasReadDisposisi(readDisp, mockTargetWarek2)).toBe(true);
      expect(checkIfUserHasReadDisposisi(readDisp, mockTargetKepalaBku)).toBe(false);
    });

    it('mengembalikan true jika target spesifik dalam multi-targets sudah memiliki isRead: true', () => {
      const partialDisp = {
        ...mockDisposisiParalel,
        targets: [
          {
            ...mockDisposisiParalel.targets[0],
            isRead: true,
            readAt: '15 Okt 2026, 09:15 WIB'
          },
          mockDisposisiParalel.targets[1]
        ]
      };
      expect(checkIfUserHasReadDisposisi(partialDisp, mockTargetWarek2)).toBe(true);
      expect(checkIfUserHasReadDisposisi(partialDisp, mockTargetKepalaBku)).toBe(false);
    });
  });

  describe('3. Perekaman Tanda Terima Keterbacaan (markDisposisiAsRead)', () => {
    it('mencatat metadata pembaca, stempel waktu, dan menambahkan ke daftar readers', () => {
      const fixedTime = '15 Okt 2026, 14:30:00 WIB';
      const updated = markDisposisiAsRead(mockDisposisiTunggal, mockTargetWarek2, fixedTime);

      expect(updated.isRead).toBe(true);
      expect(updated.readAt).toBe(fixedTime);
      expect(updated.readBy).toBe(mockTargetWarek2.nama_lengkap);
      expect(updated.readByNip).toBe(mockTargetWarek2.nip);
      expect(updated.readByUserId).toBe(mockTargetWarek2.id);
      expect(updated.readers).toHaveLength(1);
      expect(updated.readers[0].name).toBe(mockTargetWarek2.nama_lengkap);
      expect(updated.readers[0].readAt).toBe(fixedTime);
    });

    it('memperbarui target terkait secara presisi pada disposisi multi-pejabat', () => {
      const fixedTime = '15 Okt 2026, 14:45:00 WIB';
      const updated = markDisposisiAsRead(mockDisposisiParalel, mockTargetKepalaBku, fixedTime);

      expect(updated.isRead).toBe(true);
      expect(updated.readers).toHaveLength(1);

      // Target Kepala BKU terupdate, target Warek 2 masih belum baca
      const bkuTgt = updated.targets.find((t) => t.id === 'tgt-bku');
      const warek2Tgt = updated.targets.find((t) => t.id === 'tgt-warek2');

      expect(bkuTgt.isRead).toBe(true);
      expect(bkuTgt.readAt).toBe(fixedTime);
      expect(bkuTgt.readBy).toBe(mockTargetKepalaBku.nama_lengkap);
      expect(warek2Tgt.isRead).toBe(false);
    });

    it('idempoten: tidak menduplikasi entri reader jika dipanggil berulang kali untuk user yang sama', () => {
      const updated1 = markDisposisiAsRead(mockDisposisiTunggal, mockTargetWarek2);
      const updated2 = markDisposisiAsRead(updated1, mockTargetWarek2);

      expect(updated2.readers).toHaveLength(1);
    });
  });

  describe('4. Ringkasan Status Keterbacaan (getDisposisiReadSummary)', () => {
    it('menghitung status UNREAD ketika belum ada pejabat yang membaca', () => {
      const summary = getDisposisiReadSummary(mockDisposisiParalel);
      expect(summary.status).toBe('UNREAD');
      expect(summary.totalTargets).toBe(2);
      expect(summary.readTargets).toBe(0);
      expect(summary.unreadTargets).toBe(2);
      expect(summary.readPercentage).toBe(0);
      expect(summary.isUnread).toBe(true);
      expect(summary.isAllRead).toBe(false);
      expect(summary.hasSlaWarning).toBe(true);
      expect(summary.badgeLabel).toContain('Belum Dibaca');
    });

    it('menghitung status PARTIAL_READ ketika sebagian pejabat telah membaca', () => {
      const partialDisp = markDisposisiAsRead(mockDisposisiParalel, mockTargetWarek2);
      const summary = getDisposisiReadSummary(partialDisp);

      expect(summary.status).toBe('PARTIAL_READ');
      expect(summary.totalTargets).toBe(2);
      expect(summary.readTargets).toBe(1);
      expect(summary.unreadTargets).toBe(1);
      expect(summary.readPercentage).toBe(50);
      expect(summary.isPartialRead).toBe(true);
      expect(summary.isAllRead).toBe(false);
      expect(summary.badgeLabel).toBe('Sebagian Dibaca (1/2)');
    });

    it('menghitung status ALL_READ ketika seluruh pejabat telah membaca', () => {
      const disp1 = markDisposisiAsRead(mockDisposisiParalel, mockTargetWarek2);
      const disp2 = markDisposisiAsRead(disp1, mockTargetKepalaBku);
      const summary = getDisposisiReadSummary(disp2);

      expect(summary.status).toBe('ALL_READ');
      expect(summary.totalTargets).toBe(2);
      expect(summary.readTargets).toBe(2);
      expect(summary.unreadTargets).toBe(0);
      expect(summary.readPercentage).toBe(100);
      expect(summary.isAllRead).toBe(true);
      expect(summary.hasSlaWarning).toBe(false);
      expect(summary.badgeLabel).toBe('Semua Dibaca (2/2)');
    });
  });

  describe('5. Tingkat 2: Penelaahan Berkas Fisik / Naskah PDF (markDisposisiDocumentViewed)', () => {
    it('mencatat stempel waktu pembukaan berkas fisik dan menyimpannya di metadata disposisi', () => {
      const fixedTime = '19 Okt 2026, 11:40:12 WIB';
      const updated = markDisposisiDocumentViewed(mockDisposisiTunggal, mockTargetWarek2, fixedTime);

      expect(updated.isRead).toBe(true);
      expect(updated.documentViewedAt).toBe(fixedTime);
      expect(checkIfUserHasOpenedDocument(updated, mockTargetWarek2)).toBe(true);
      expect(checkIfUserHasOpenedDocument(updated, mockTargetKepalaBku)).toBe(false);
    });

    it('memperbarui target spesifik pada disposisi multi-pejabat saat berkas fisik dibuka', () => {
      const fixedTime = '19 Okt 2026, 11:42:00 WIB';
      const updated = markDisposisiDocumentViewed(mockDisposisiParalel, mockTargetWarek2, fixedTime);

      const tgtWarek = updated.targets.find((t) => t.id === 'tgt-warek2');
      const tgtBku = updated.targets.find((t) => t.id === 'tgt-bku');

      expect(tgtWarek.documentViewedAt).toBe(fixedTime);
      expect(tgtBku.documentViewedAt).toBeUndefined();
      expect(checkIfUserHasOpenedDocument(updated, mockTargetWarek2)).toBe(true);
      expect(checkIfUserHasOpenedDocument(updated, mockTargetKepalaBku)).toBe(false);
    });
  });
});
