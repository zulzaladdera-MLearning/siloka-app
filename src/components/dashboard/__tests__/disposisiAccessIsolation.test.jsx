import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { DisposisiView } from '../ModuleViews';

describe('Penegakan Isolasi Hak Akses E-Disposisi (SKKAAD SK No. 2803/2023 & Peraturan Rektor No. 3/2023)', () => {
  // 1. Akun Dosen Tanpa Jabatan Struktural
  const mockDosenBiasa = {
    id: 'usr-dosen-01',
    nama_lengkap: 'Hendra Hermawan, S.T., M.T.',
    jabatan: 'Dosen Informatika FT',
    role: 'DOSEN',
    roleLabel: 'Dosen Biasa (Non-Jabatan)',
    unit: 'Jurusan Informatika Fakultas Teknik',
    unit_kerja_id: 'UN58.FT.01'
  };

  // 2. Akun Rektor
  const mockRektor = {
    id: 'usr-01',
    nama_lengkap: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    jabatan: 'Rektor Universitas Siliwangi',
    role: 'PEJABAT',
    roleLabel: 'Rektor',
    unit_kerja_id: 'UN58'
  };

  // 3. Akun Pengawas SPI (Satuan Pengawas Internal)
  const mockPengawasSpi = {
    id: 'usr-spi-01',
    nama_lengkap: 'Dr. Hj. Iis Rahmawati, S.E., M.Si., Ak., CA.',
    jabatan: 'Ketua Satuan Pengawas Internal',
    role: 'PENGAWAS',
    roleLabel: 'Satuan Pengawas Internal (SPI)',
    unit: 'Satuan Pengawas Internal',
    unit_kerja_id: 'UN58.SPI'
  };

  // 4. Akun Kepala Biro BKU
  const mockKabiroBku = {
    id: 'usr-11',
    nama_lengkap: 'Dr. Nana Sujana, Drs., M.Si.',
    jabatan: 'Kepala Biro Keuangan dan Umum',
    role: 'PEJABAT',
    roleLabel: 'Kepala Biro BKU',
    unit_kerja_id: 'UN58.6'
  };

  // 5. Akun Wakil Rektor II
  const mockWarek2 = {
    id: 'usr-warek-02',
    nama_lengkap: 'Dr. H. Gumilar Mulya, M.Pd.',
    jabatan: 'Wakil Rektor Bidang Keuangan dan Umum',
    role: 'PEJABAT',
    roleLabel: 'Wakil Rektor II',
    unit_kerja_id: 'UN58.2'
  };

  it('1. Dosen Tanpa Jabatan TIDAK BOLEH melihat tab "Semua Disposisi" dan hanya disajikan antrean tugas masuk miliknya', () => {
    const html = renderToString(
      <DisposisiView
        letters={[]}
        currentUser={mockDosenBiasa}
        onSelectLetter={() => {}}
        onOpenNewDisposisi={() => {}}
      />
    );

    // Verifikasi Tab Semua Disposisi disembunyikan
    expect(html).not.toContain('<span>Semua Disposisi</span>');
    // Tab Arahan Saya juga disembunyikan karena dosen bukan pejabat penerbit
    expect(html).not.toContain('Arahan Saya (Monitoring Keluar)');
    // Tab Tugas Masuk tampil dengan hitungan 0
    expect(html).toContain('Tugas Masuk (Diterima)');
    // Empty state informatif tampil tanpa membocorkan data pimpinan
    expect(html).toContain('Tidak ada tugas disposisi masuk yang perlu ditindaklanjuti');
    expect(html).toContain('Anda tidak memiliki penugasan lembar disposisi aktif saat ini.');
    expect(html).not.toContain('Tampilkan Semua Disposisi');
  });

  it('2. Dosen Tanpa Jabatan tidak membocorkan lembar disposisi pimpinan universitas (Need-to-Know)', () => {
    const html = renderToString(
      <DisposisiView
        letters={[]}
        currentUser={mockDosenBiasa}
        onSelectLetter={() => {}}
        onOpenNewDisposisi={() => {}}
      />
    );

    // Disposisi rahasia Rektor ke WR / Dekan tidak boleh muncul
    expect(html).not.toContain('AGD-2026/UN58/0018');
    expect(html).not.toContain('AGD-2026/UN58/0022');
    expect(html).not.toContain('Prioritaskan koordinasi pagu indikatif bersama Kemendikbudristek');
    // Tidak ada tombol eksekusi kartu bagi dosen tanpa tugas
    expect(html).not.toContain('title="Susun Nota Dinas atau Surat Balasan untuk menindaklanjuti arahan ini"');
  });

  it('3. Pengawas SPI memiliki akses tab "Semua Disposisi" dalam mode Audit Pengawasan (Read-Only)', () => {
    const html = renderToString(
      <DisposisiView
        letters={[]}
        currentUser={mockPengawasSpi}
        initialPerspective="SEMUA"
        onSelectLetter={() => {}}
        onOpenNewDisposisi={() => {}}
      />
    );

    // Tab Semua Disposisi hadir untuk Pengawas SPI
    expect(html).toContain('<span>Semua Disposisi</span>');
    expect(html).toContain('Mode Pengawasan Kearsipan Global:');
    // Kartu disposisi pihak lain berstatus Audit Pengawasan
    expect(html).toContain('Audit Pengawasan');
    expect(html).toContain('Mode Pengawasan Audit (Read-Only)');
    // Pengawas tidak disajikan tombol eksekusi bawahan
    expect(html).not.toContain('<span>Buat Surat Balasan</span>');
  });

  it('4. Rektor memiliki akses tab "Semua Disposisi" dan "Monitoring Arahan Rektor"', () => {
    const html = renderToString(
      <DisposisiView
        letters={[]}
        currentUser={mockRektor}
        onSelectLetter={() => {}}
        onOpenNewDisposisi={() => {}}
      />
    );

    expect(html).toContain('Monitoring Arahan Rektor');
    expect(html).toContain('<span>Semua Disposisi</span>');
  });

  it('5. Kepala Biro BKU menerima tugas dari Rektor dan memantau arahan internal yang diterbitkannya', () => {
    const html = renderToString(
      <DisposisiView
        letters={[]}
        currentUser={mockKabiroBku}
        initialPerspective="TUGAS_MASUK"
        onSelectLetter={() => {}}
        onOpenNewDisposisi={() => {}}
      />
    );

    // Di Tugas Masuk, Kabiro BKU melihat tugas dari Rektor (DSP-REK-001)
    expect(html).toContain('Tugas Masuk (Diterima)');
    expect(html).toContain('AGD-2026/UN58/0018');
    expect(html).toContain('Buat Surat Balasan');
  });
});
