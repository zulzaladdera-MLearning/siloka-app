import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { LetterDetailModal } from '../LetterDetailModal';
import { markDisposisiAsRead } from '../../../utils/disposisiTrackingHelper';

describe('Integrasi Modal Detail Naskah & Pelacakan Keterbacaan Disposisi (LetterDetailModal)', () => {
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
    id: 'SRT-IN-099',
    nomorSurat: '099/UN58/KU/2026',
    nomorAgenda: 'AGD-2026/099',
    perihal: 'Koordinasi Pagu Indikatif TA 2027',
    kategori: 'Surat Masuk',
    pengirim: 'Kementerian Pendidikan Tinggi, Sains, dan Teknologi',
    sifat: 'Sangat Segera',
    status: 'Didisposisikan',
    disposisi: {
      status: 'Dalam Proses',
      nomorAgenda: 'AGD-2026/099',
      pemberiDisposisi: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
      pemberiUserId: 'usr-01',
      jabatanPemberi: 'Rektor Universitas Siliwangi',
      tujuanDisposisi: 'Wakil Rektor Bidang Keuangan dan Umum',
      targetUnit: 'Wakil Rektor Bidang Keuangan dan Umum',
      target_user_id: 'usr-warek-02',
      target_pejabat_nip: '196805121994031003',
      instruksi: 'Pelajari dan siapkan konsep tanggapan tertulis.',
      actions: ['Tindak lanjuti segera', 'Siapkan bahan rapat'],
      batasWaktu: '19 Okt 2026',
      sifatInstruksi: 'Sangat Segera',
      isRead: false,
      readAt: null,
      readBy: null,
      readers: []
    }
  };

  it('merender kartu instruksi disposisi dan matriks pelacakan tanda terima', () => {
    const html = renderToString(
      <LetterDetailModal
        letter={mockLetterWithDisposisi}
        isOpen={true}
        onClose={vi.fn()}
        currentUser={mockTargetWarek}
      />
    );

    // Verifikasi keberadaan komponen pelacakan keterbacaan
    expect(html).toContain('Arahan &amp; Instruksi Disposisi Pimpinan');
    expect(html).toContain('Status Keterbacaan &amp; Tanda Terima Disposisi');
    expect(html).toContain('Belum Dibaca');
    expect(html).toContain('Tenggat Waktu:');
    expect(html).toContain('19 Okt 2026');
  });

  it('menampilkan status "Sudah Dibaca" lengkap dengan nama pembaca dan stempel waktu setelah dibaca', () => {
    const updatedDisposisi = markDisposisiAsRead(
      mockLetterWithDisposisi.disposisi,
      mockTargetWarek,
      '15 Okt 2026, 10:00 WIB'
    );

    const letterRead = {
      ...mockLetterWithDisposisi,
      disposisi: updatedDisposisi
    };

    const html = renderToString(
      <LetterDetailModal
        letter={letterRead}
        isOpen={true}
        onClose={vi.fn()}
        currentUser={mockPemberiRektor}
      />
    );

    expect(html).toContain('Sudah Dibaca');
    expect(html).toContain('Dr. H. Ade Komaludin, M.Sc.');
    expect(html).toContain('15 Okt 2026, 10:00 WIB');
    expect(html).toContain('196805121994031003');
  });

  it('menampilkan informasi multi-target paralel dengan rincian per pejabat', () => {
    const multiTargetLetter = {
      ...mockLetterWithDisposisi,
      disposisi: {
        ...mockLetterWithDisposisi.disposisi,
        targets: [
          {
            id: 't-1',
            targetUnit: 'Wakil Rektor Bidang Keuangan dan Umum',
            target_user_id: 'usr-warek-02',
            target_pejabat_nip: '196805121994031003',
            isRead: true,
            readAt: '15 Okt 2026, 09:30 WIB',
            readBy: 'Dr. H. Ade Komaludin, M.Sc.'
          },
          {
            id: 't-2',
            targetUnit: 'Biro Keuangan dan Umum',
            target_user_id: 'usr-11',
            target_pejabat_nip: '196708151992031002',
            isRead: false,
            readAt: null
          }
        ]
      }
    };

    const html = renderToString(
      <LetterDetailModal
        letter={multiTargetLetter}
        isOpen={true}
        onClose={vi.fn()}
        currentUser={mockPemberiRektor}
      />
    );

    expect(html).toContain('Sebagian Dibaca (1/2)');
    expect(html).toContain('Biro Keuangan dan Umum');
    expect(html).toContain('Wakil Rektor Bidang Keuangan dan Umum');
  });
});
