import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { DisposisiView } from '../ModuleViews';
import { CreateLetterModal } from '../CreateLetterModal';
import { LetterDetailModal } from '../LetterDetailModal';
import { QuickDisposisiModal } from '../QuickDisposisiModal';

describe('E-Disposisi Closed-Loop & Real-Time Workflow (Peraturan Rektor No. 3/2023)', () => {
  const mockPimpinan = {
    id: 'usr-11',
    nama_lengkap: 'Dr. Nana Sujana, Drs., M.Si.',
    jabatan: 'Kepala Biro Keuangan dan Umum',
    role: 'PEJABAT',
    roleLabel: 'Kepala Biro BKU',
    unit_kerja_id: 'UN58.6'
  };

  const mockSubordinat = {
    id: 'usr-sub-01',
    nama_lengkap: 'Ahmad Fauzi, S.E.',
    jabatan: 'Pengadministrasi Perencanaan Anggaran',
    role: 'STAFF',
    roleLabel: 'Sub Bagian Perencanaan Anggaran',
    unit: 'Sub Bagian Perencanaan Anggaran',
    unit_kerja_id: 'UN58.6.1'
  };

  const mockRektor = {
    id: 'usr-01',
    nama_lengkap: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    jabatan: 'Rektor Universitas Siliwangi',
    role: 'PEJABAT',
    roleLabel: 'Rektor',
    unit_kerja_id: 'UN58'
  };

  const mockWarek2 = {
    id: 'usr-warek-02',
    nama_lengkap: 'Dr. H. Gumilar Mulya, M.Pd.',
    jabatan: 'Wakil Rektor Bidang Keuangan dan Umum',
    role: 'PEJABAT',
    roleLabel: 'Wakil Rektor II',
    unit_kerja_id: 'UN58.2'
  };

  const sampleLetters = [
    {
      id: 'SRT-IN-2026-0001',
      nomorSurat: 'AGD-2026/09/0142',
      nomorAgenda: 'AGD-2026/09/0142',
      perihal: 'Koordinasi Penyesuaian Anggaran DIPA TA 2027',
      kategori: 'Surat Masuk',
      pengirim: 'Kementerian Keuangan RI',
      tujuan: 'Kepala Biro BKU',
      status: 'Didisposisikan',
      disposisi: {
        nomorAgenda: 'AGD-2026/09/0142',
        status: 'Dalam Proses',
        pemberiDisposisi: 'Dr. Nana Sujana, Drs., M.Si. (Kepala Biro BKU)',
        targetUnit: 'Sub Bagian Perencanaan Anggaran',
        target_jabatan: 'Sub Bagian Perencanaan Anggaran',
        instruksi: 'Integrasikan ke dalam matriks DIPA UNSIL TA 2027 dan koordinasikan dengan WR II.',
        sifatInstruksi: 'Segera Ditindaklanjuti',
        batasWaktu: '08 Sep 2026'
      }
    }
  ];

  it('1. DisposisiView menampilkan Panduan Alur 4 Tahap yang mudah dipahami orang awam', () => {
    const html = renderToString(
      <DisposisiView
        letters={sampleLetters}
        currentUser={mockSubordinat}
        onSelectLetter={() => {}}
        onOpenNewDisposisi={() => {}}
      />
    );

    // Verifikasi Header & Panduan Alur
    expect(html).toContain('Pengendalian E-Disposisi Elektronik');
    expect(html).toContain('Panduan Alur Persuratan &amp; E-Disposisi UNSIL');
    expect(html).toContain('1. Registrasi Surat Masuk');
    expect(html).toContain('2. Lembar Disposisi (Contoh 21)');
    expect(html).toContain('3. Aksi Subordinat / Bawahan');
    expect(html).toContain('4. Pengesahan TTE &amp; Arsip JRA');
  });

  it('2. DisposisiView menyediakan tab filter status (Semua, Dalam Proses, Menunggu Telaah, Selesai)', () => {
    const html = renderToString(
      <DisposisiView
        letters={sampleLetters}
        currentUser={mockSubordinat}
        onSelectLetter={() => {}}
        onOpenNewDisposisi={() => {}}
      />
    );

    expect(html).toContain('Semua (');
    expect(html).toContain('Dalam Proses (');
    expect(html).toContain('Menunggu Telaah (');
    expect(html).toContain('Selesai (');
  });

  it('3. Kartu Disposisi menyajikan tombol aksi nyata bagi bawahan (Buat Surat Balasan, Update Progres, Selesai)', () => {
    const html = renderToString(
      <DisposisiView
        letters={sampleLetters}
        currentUser={mockSubordinat}
        onSelectLetter={() => {}}
        onOpenNewDisposisi={() => {}}
        onFollowUpDisposisi={() => {}}
        onUpdateDisposisiStatus={() => {}}
        onCompleteDisposisi={() => {}}
      />
    );

    expect(html).toContain('Buat Surat Balasan');
    expect(html).toContain('Update Progres');
    expect(html).toContain('Selesai');
    expect(html).toContain('AGD-2026/09/0142');
    expect(html).toContain('Integrasikan ke dalam matriks DIPA UNSIL TA 2027');
  });

  it('4. CreateLetterModal mengenali mode tindak lanjut disposisi dan menampilkan banner panduan', () => {
    const followUpContext = {
      dispositionId: 'disp-SRT-IN-2026-0001',
      letterId: 'SRT-IN-2026-0001',
      nomorAgenda: 'AGD-2026/09/0142',
      nomorSurat: '1204/KEMKEU/2026',
      perihal: 'Koordinasi Penyesuaian Anggaran DIPA TA 2027',
      pemberiDisposisi: 'Dr. Nana Sujana, Drs., M.Si.',
      instruksi: 'Integrasikan ke dalam matriks DIPA UNSIL TA 2027'
    };

    const html = renderToString(
      <CreateLetterModal
        isOpen={true}
        onClose={() => {}}
        onSaveLetter={() => {}}
        currentUser={mockSubordinat}
        initialMode="surat-keluar"
        allLetters={sampleLetters}
        followUpDisposisi={followUpContext}
      />
    );

    expect(html).toContain('Mode Tindak Lanjut E-Disposisi Resmi UNSIL');
    expect(html).toContain('AGD-2026/09/0142');
    expect(html).toContain('Integrasikan ke dalam matriks DIPA UNSIL TA 2027');
  });

  it('5. LetterDetailModal menampilkan status dan tombol tindak lanjut langsung dari rincian naskah bagi penerima', () => {
    const letter = sampleLetters[0];
    const html = renderToString(
      <LetterDetailModal
        letter={letter}
        isOpen={true}
        onClose={() => {}}
        currentUser={mockSubordinat}
        onFollowUpDisposisi={() => {}}
        onCompleteDisposisi={() => {}}
      />
    );

    expect(html).toContain('Status:');
    expect(html).toContain('Dalam Proses');
    expect(html).toContain('Buat Naskah Balasan');
    expect(html).toContain('Tandai Selesai');
  });

  it('6. Status Disposisi berubah menjadi Selesai saat lembar diselesaikan', () => {
    const completedLetters = [
      {
        ...sampleLetters[0],
        disposisi: {
          ...sampleLetters[0].disposisi,
          status: 'Selesai',
          resolvedNote: 'Tindak lanjut koordinasi telah selesai dilaksanakan.'
        }
      }
    ];

    const html = renderToString(
      <DisposisiView
        letters={completedLetters}
        currentUser={mockSubordinat}
        onSelectLetter={() => {}}
        onOpenNewDisposisi={() => {}}
      />
    );

    expect(html).toContain('Disposisi Tuntas &amp; Terarsip');
    expect(html).toContain('Tindak lanjut koordinasi telah selesai dilaksanakan.');
  });

  it('7. Mendukung overrides status secara real-time via dispositionOverrides prop', () => {
    const overrides = {
      'DSP-001': {
        status: 'Menunggu Telaah',
        catatanProgres: 'Draf Nota Dinas sedang dikaji bagian umum.',
        naskahBalasanNomor: 'ND-2026/UN58.6/0014'
      }
    };

    const html = renderToString(
      <DisposisiView
        letters={sampleLetters}
        currentUser={mockSubordinat}
        dispositionOverrides={overrides}
        onSelectLetter={() => {}}
        onOpenNewDisposisi={() => {}}
      />
    );

    expect(html).toContain('Menunggu Telaah');
    expect(html).toContain('Naskah Balasan Disusun:');
    expect(html).toContain('ND-2026/UN58.6/0014');
  });

  it('8. Mode Monitoring Pimpinan (Rektor) mengawasi arahan keluar tanpa tombol Buat Surat Balasan', () => {
    const html = renderToString(
      <DisposisiView
        letters={sampleLetters}
        currentUser={mockRektor}
        onSelectLetter={() => {}}
        onOpenNewDisposisi={() => {}}
        onFollowUpDisposisi={() => {}}
        onUpdateDisposisiStatus={() => {}}
        onCompleteDisposisi={() => {}}
      />
    );

    // Rektor default ke Monitoring Arahan Rektor
    expect(html).toContain('Monitoring Arahan Rektor');
    expect(html).toContain('Mode Monitoring Arahan Pimpinan:');
    expect(html).toContain('AGD-2026/UN58/0018');
    expect(html).toContain('Pantau Progres');
    expect(html).toContain('Tutup Disposisi');
    // Pimpinan pengarah tidak memiliki tombol aksi membuat surat balasan ke arahannya sendiri
    expect(html).not.toContain('<span>Buat Surat Balasan</span>');
    expect(html).not.toContain('title="Susun Nota Dinas atau Surat Balasan untuk menindaklanjuti arahan ini"');
  });

  it('9. Mode Peran Ganda (Wakil Rektor) dapat menerima arahan Rektor dan melakukan Disposisi Lanjutan (Cascading)', () => {
    const html = renderToString(
      <DisposisiView
        letters={sampleLetters}
        currentUser={mockWarek2}
        onSelectLetter={() => {}}
        onOpenNewDisposisi={() => {}}
        onFollowUpDisposisi={() => {}}
        onUpdateDisposisiStatus={() => {}}
        onCompleteDisposisi={() => {}}
      />
    );

    // Wakil Rektor menerima tugas dari Rektor di Tugas Masuk
    expect(html).toContain('Tugas Masuk (Diterima)');
    expect(html).toContain('AGD-2026/UN58/0018');
    expect(html).toContain('Buat Surat Balasan');
    // Karena Pejabat Struktural, memiliki wewenang meneruskan arahan (Disposisi Lanjutan)
    expect(html).toContain('Disposisi Lanjutan');
  });

  it('10. LetterDetailModal untuk pemberi disposisi menampilkan Tutup Disposisi dan menyembunyikan Buat Naskah Balasan', () => {
    const letter = sampleLetters[0];
    const html = renderToString(
      <LetterDetailModal
        letter={letter}
        isOpen={true}
        onClose={() => {}}
        currentUser={mockPimpinan}
        onFollowUpDisposisi={() => {}}
        onCompleteDisposisi={() => {}}
      />
    );

    expect(html).toContain('Status:');
    expect(html).toContain('Dalam Proses');
    expect(html).toContain('Tutup Disposisi');
    expect(html).not.toContain('Buat Naskah Balasan');
  });

  it('11. QuickDisposisiModal saat dibuka untuk surat baru secara default berstatus kosong dengan placeholder pilihan', () => {
    const rawIncomingLetter = {
      id: 'SRT-IN-NEW-001',
      nomorSurat: 'UN58/TU/2026/089',
      nomorAgenda: 'AGD-2026/10/0089',
      perihal: 'Koordinasi Pelaksanaan Riset Kolaboratif',
      kategori: 'Surat Masuk',
      pengirim: 'Kemendikbudristek',
      tujuan: 'Rektor Universitas Siliwangi',
      sifat: 'Segera',
      tanggalSurat: '2026-10-14'
    };

    const html = renderToString(
      <QuickDisposisiModal
        isOpen={true}
        onClose={() => {}}
        letter={rawIncomingLetter}
        letters={[rawIncomingLetter]}
        currentUser={mockRektor}
        onSaveDisposisi={() => {}}
      />
    );

    // Memastikan tidak langsung auto-select Warek / pejabat tertentu
    expect(html).toContain('Pilih satu atau lebih pejabat bawahan...');
    expect(html).toContain('Lembar Disposisi Surat Masuk');
    expect(html).toContain('Diteruskan Kepada (Bawahan / Unit Pengolah Tujuan)');
  });

  it('12. QuickDisposisiModal saat dibuka untuk surat yang sudah punya disposisi sebelumnya (cascading) harus tetap default kosong tanpa pre-populate nama pejabat lain', () => {
    const letterWithPreviousDisposisi = {
      id: 'SRT-IN-PREV-002',
      nomorSurat: 'B/1204/KPK/X/2026',
      nomorAgenda: 'AGD-2026/10/0042',
      perihal: 'Tindak Lanjut Rekomendasi Pencegahan Korupsi',
      kategori: 'Surat Masuk',
      pengirim: 'Komisi Pemberantasan Korupsi (KPK)',
      tujuan: 'Rektor Universitas Siliwangi',
      sifat: 'Segera',
      tanggalSurat: '2026-10-18',
      disposisi: {
        id: 'disp-prev-001',
        pemberiDisposisi: 'Prof. Dr. Ir. H. Nundang Busaeri, M.T.',
        pemberiJabatan: 'Rektor',
        targetUnit: 'Wakil Rektor Bidang Keuangan dan Umum',
        targets: [
          {
            id: 'tgt-wr2',
            targetUnit: 'Wakil Rektor Bidang Keuangan dan Umum',
            target_user_id: 'usr-warek2',
            target_pejabat_nama: 'Dr. Ade Rustiana, Drs., M.Si.',
            isLead: true
          }
        ],
        sifatInstruksi: 'Segera',
        actions: ['Tindaklanjuti segera']
      }
    };

    const mockWarek2 = {
      id: 'usr-warek2',
      id_user: 'usr-warek2',
      nama_lengkap: 'Dr. Ade Rustiana, Drs., M.Si.',
      jabatan: 'Wakil Rektor Bidang Keuangan dan Umum',
      role: 'PEJABAT',
      role_slug: 'pimpinan',
      is_pejabat: true,
      subRoleKey: 'WAREK_2',
      unit_kerja_id: 'UN58'
    };

    const html = renderToString(
      <QuickDisposisiModal
        isOpen={true}
        onClose={() => {}}
        letter={letterWithPreviousDisposisi}
        letters={[letterWithPreviousDisposisi]}
        currentUser={mockWarek2}
        onSaveDisposisi={() => {}}
        forwardFromDisposisi={letterWithPreviousDisposisi.disposisi}
      />
    );

    // Memastikan penerima disposisi tetap KOSONG default-nya (tidak otomatis mengembalikan WR 2 atau pejabat lain)
    expect(html).toContain('Pilih satu atau lebih pejabat bawahan...');
    expect(html).not.toContain('1 Pejabat Dituju');
    expect(html).not.toContain('Utama:');
  });
});
