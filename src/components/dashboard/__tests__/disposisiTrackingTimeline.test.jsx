import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { DisposisiTrackingTimeline } from '../DisposisiTrackingTimeline';
import {
  formatTimelineTimestamp,
  buildDisposisiDeliveryTimeline
} from '../../../utils/disposisiTrackingHelper';

describe('Komponen Timeline Ekspedisi & Keterbacaan Disposisi (Model Resi Tanda Terima)', () => {
  const mockPemberiRektor = {
    id: 'usr-01',
    nama_lengkap: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nip: '196401011990031002',
    jabatan: 'Rektor Universitas Siliwangi',
    role: 'PIMPINAN'
  };

  const mockTargetWarek = {
    id: 'usr-warek-02',
    nama_lengkap: 'Dr. H. Ade Komaludin, M.Sc.',
    nip: '196805121994031003',
    jabatan: 'Wakil Rektor Bidang Keuangan dan Umum',
    role: 'PEJABAT'
  };

  const mockLetterWithDisposisi = {
    id: 'SRT-IN-077',
    nomorSurat: '077/UN58/KU/2026',
    nomorAgenda: 'AGD-2026/UN58/0077',
    perihal: 'Koordinasi Tindak Lanjut Pagu Anggaran 2027',
    kategori: 'Surat Masuk',
    pengirim: 'Kementerian Pendidikan Tinggi, Sains, dan Teknologi',
    sifat: 'Sangat Segera',
    tanggal: '14 Okt 2026',
    disposisi: {
      status: 'Dalam Proses',
      nomorAgenda: 'AGD-2026/UN58/0077',
      pemberiDisposisi: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
      pemberiUserId: 'usr-01',
      jabatanPemberi: 'Rektor Universitas Siliwangi',
      tujuanDisposisi: 'Wakil Rektor Bidang Keuangan dan Umum',
      targetUnit: 'Wakil Rektor Bidang Keuangan dan Umum',
      target_user_id: 'usr-warek-02',
      target_pejabat_nip: '196805121994031003',
      target_pejabat_nama: 'Dr. H. Ade Komaludin, M.Sc.',
      instruksi: 'Pelajari dan siapkan konsep tanggapan tertulis.',
      actions: ['Tindak lanjuti segera', 'Siapkan bahan koordinasi'],
      batasWaktu: '20 Okt 2026',
      sifatInstruksi: 'Sangat Segera',
      tanggalDisposisi: '15 Okt 2026, 08:30 WIB',
      isRead: true,
      readAt: '15 Okt 2026, 09:15 WIB',
      readBy: 'Dr. H. Ade Komaludin, M.Sc.',
      readByNip: '196805121994031003',
      readers: [
        {
          userId: 'usr-warek-02',
          name: 'Dr. H. Ade Komaludin, M.Sc.',
          nip: '196805121994031003',
          readAt: '15 Okt 2026, 09:15 WIB'
        }
      ],
      targets: [
        {
          id: 'tgt-1',
          targetUnit: 'Wakil Rektor Bidang Keuangan dan Umum',
          target_user_id: 'usr-warek-02',
          target_pejabat_nip: '196805121994031003',
          target_pejabat_nama: 'Dr. H. Ade Komaludin, M.Sc.',
          isRead: true,
          readAt: '15 Okt 2026, 09:15 WIB',
          readBy: 'Dr. H. Ade Komaludin, M.Sc.',
          readByNip: '196805121994031003'
        }
      ]
    }
  };

  describe('1. Helper Format Timestamp & Builder Timeline', () => {
    it('memecah string waktu menjadi format 2 baris (dateStr dan timeStr)', () => {
      const res1 = formatTimelineTimestamp('15 Okt 2026, 09:15 WIB');
      expect(res1.dateStr).toBe('15 Okt');
      expect(res1.timeStr).toBe('09:15 WIB');

      const res2 = formatTimelineTimestamp('2026-10-14');
      expect(res2.dateStr).toBe('14 Okt');

      // Dukungan format waktu Indonesia dengan titik (11.38.29 WIB)
      const res3 = formatTimelineTimestamp('19 Okt 2026, 11.38.29 WIB');
      expect(res3.dateStr).toBe('19 Okt');
      expect(res3.timeStr).toBe('11.38 WIB');

      const res4 = formatTimelineTimestamp('21 Okt 07.00 WIB');
      expect(res4.dateStr).toBe('21 Okt');
      expect(res4.timeStr).toBe('07.00 WIB');
    });

    it('membangun array kronologi timeline dengan urutan dari paling mutakhir di atas', () => {
      const items = buildDisposisiDeliveryTimeline(mockLetterWithDisposisi, mockTargetWarek);
      expect(items.length).toBeGreaterThanOrEqual(3);

      // Item pertama adalah status keterbacaan (terbaca)
      expect(items[0].category).toBe('READ');
      expect(items[0].title).toContain('Lembar Disposisi Telah Dibuka & Dibaca');
      expect(items[0].actor).toBe('Dr. H. Ade Komaludin, M.Sc.');

      // Item berikutnya adalah penerbitan instruksi disposisi
      const issuedStep = items.find((i) => i.category === 'ISSUED');
      expect(issuedStep).toBeDefined();
      expect(issuedStep.title).toContain('Arahan & Instruksi Disposisi Pimpinan Diterbitkan');

      // Item terbawah adalah registrasi naskah masuk
      const regStep = items.find((i) => i.category === 'REGISTRATION');
      expect(regStep).toBeDefined();
      expect(regStep.title).toContain('Registrasi Naskah Masuk ke Buku Agenda');
    });
  });

  describe('2. Render Komponen DisposisiTrackingTimeline', () => {
    it('merender header No. Resi Agenda beserta tombol SALIN', () => {
      const html = renderToString(
        <DisposisiTrackingTimeline
          letter={mockLetterWithDisposisi}
          currentUser={mockTargetWarek}
        />
      );

      expect(html).toContain('No. Resi Agenda:');
      expect(html).toContain('AGD-2026/UN58/0077');
      expect(html).toContain('SALIN');
    });

    it('menampilkan timeline vertikal lengkap dengan tanggal, jam, status sudah dibaca, dan nama pejabat', () => {
      const html = renderToString(
        <DisposisiTrackingTimeline
          letter={mockLetterWithDisposisi}
          currentUser={mockTargetWarek}
        />
      );

      expect(html).toContain('15 Okt');
      expect(html).toContain('09:15 WIB');
      expect(html).toContain('Sudah Dibaca');
      expect(html).toContain('Dr. H. Ade Komaludin, M.Sc.');
      expect(html).toContain('196805121994031003');
      expect(html).toContain('Lihat Lembar Disposisi');
    });

    it('menampilkan status "Belum Dibaca" dan peringatan batas waktu jika pejabat belum membuka surat', () => {
      const unreadLetter = {
        ...mockLetterWithDisposisi,
        disposisi: {
          ...mockLetterWithDisposisi.disposisi,
          isRead: false,
          readAt: null,
          readBy: null,
          readers: [],
          targets: [
            {
              id: 'tgt-1',
              targetUnit: 'Wakil Rektor Bidang Keuangan dan Umum',
              target_pejabat_nama: 'Dr. H. Ade Komaludin, M.Sc.',
              isRead: false
            }
          ]
        }
      };

      const html = renderToString(
        <DisposisiTrackingTimeline
          letter={unreadLetter}
          currentUser={mockPemberiRektor}
        />
      );

      expect(html).toContain('Belum Dibaca');
      expect(html).toContain('Menunggu Pembacaan Lembar Disposisi');
      expect(html).toContain('Tenggat Waktu: 20 Okt 2026');
    });

    it('menampilkan indikator Tingkat 2: status penelaahan berkas fisik/PDF', () => {
      // 1. Kasus berkas fisik belum dibuka
      const htmlBefore = renderToString(
        <DisposisiTrackingTimeline
          letter={mockLetterWithDisposisi}
          currentUser={mockTargetWarek}
        />
      );
      expect(htmlBefore).toContain('Menunggu penelaahan berkas fisik / lampiran PDF');

      // 2. Kasus berkas fisik telah dibuka
      const openedLetter = {
        ...mockLetterWithDisposisi,
        disposisi: {
          ...mockLetterWithDisposisi.disposisi,
          documentViewedAt: '15 Okt 2026, 09:20 WIB',
          targets: [
            {
              ...mockLetterWithDisposisi.disposisi.targets[0],
              documentViewedAt: '15 Okt 2026, 09:20 WIB'
            }
          ]
        }
      };

      const htmlAfter = renderToString(
        <DisposisiTrackingTimeline
          letter={openedLetter}
          currentUser={mockTargetWarek}
        />
      );
      expect(htmlAfter).toContain('Berkas fisik/PDF dibuka:');
      expect(htmlAfter).toContain('15 Okt 2026, 09:20 WIB');
    });

    it('menampilkan tombol "Teruskan Disposisi" (Opsi A) bagi pejabat penerima struktural yang berwenang', () => {
      const html = renderToString(
        <DisposisiTrackingTimeline
          letter={mockLetterWithDisposisi}
          currentUser={mockTargetWarek}
          canDispose={true}
          isIssuerOfLetterDisposisi={false}
          onForwardDisposisi={() => {}}
          onFollowUpDisposisi={() => {}}
          onCompleteDisposisi={() => {}}
        />
      );

      // Pejabat penerima melihat 3 opsi: Teruskan Disposisi, Buat Naskah Balasan, Tandai Selesai
      expect(html).toContain('Teruskan Disposisi');
      expect(html).toContain('Buat Naskah Balasan');
      expect(html).toContain('Tandai Selesai');
    });

    it('tidak menampilkan tombol "Teruskan Disposisi" atau "Buat Naskah Balasan" bagi pemberi disposisi (Rektor)', () => {
      const html = renderToString(
        <DisposisiTrackingTimeline
          letter={mockLetterWithDisposisi}
          currentUser={mockPemberiRektor}
          canDispose={true}
          isIssuerOfLetterDisposisi={true}
          onForwardDisposisi={() => {}}
          onFollowUpDisposisi={() => {}}
          onCompleteDisposisi={() => {}}
        />
      );

      expect(html).not.toContain('Teruskan Disposisi');
      expect(html).not.toContain('Buat Naskah Balasan');
      expect(html).toContain('Tutup Disposisi');
    });

    it('membangun timeline jejak disposisi lanjutan (cascading) lengkap dengan Disposisi Lanjutan dan Disposisi Awal', () => {
      const cascadingLetter = {
        ...mockLetterWithDisposisi,
        disposisiHistory: [
          {
            ...mockLetterWithDisposisi.disposisi,
            pemberiDisposisi: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
            jabatanPemberi: 'Rektor Universitas Siliwangi',
            instruksi: 'Pelajari dan siapkan konsep tanggapan tertulis.'
          }
        ],
        disposisi: {
          ...mockLetterWithDisposisi.disposisi,
          forwardedFrom: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
          pemberiDisposisi: 'Dr. H. Ade Komaludin, M.Sc.',
          jabatanPemberi: 'Wakil Rektor Bidang Keuangan dan Umum',
          instruksi: 'Meneruskan arahan Rektor: Koordinasikan dengan Kepala BKU.'
        }
      };

      const items = buildDisposisiDeliveryTimeline(cascadingLetter, mockTargetWarek);
      const subDispStep = items.find((i) => i.badgeText === 'Disposisi Lanjutan');
      expect(subDispStep).toBeDefined();
      expect(subDispStep.title).toContain('Disposisi Lanjutan Berjenjang Diterbitkan');

      const parentDispStep = items.find((i) => i.badgeText === 'Disposisi Awal');
      expect(parentDispStep).toBeDefined();
      expect(parentDispStep.title).toContain('Rektor Universitas Siliwangi');
    });
  });
});
