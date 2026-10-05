import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QuickDisposisiModal } from '../QuickDisposisiModal';
import { LetterDetailModal } from '../LetterDetailModal';

describe('Diagnosa Render QuickDisposisiModal & LetterDetailModal', () => {
  const rektorUser = {
    id: 'usr-01',
    id_user: 'usr-01',
    nama_lengkap: 'Prof. Dr. Ir. H. Nundang Busaeri, M.T., IPU., ASEAN Eng.',
    email: 'rektor@unsil.ac.id',
    nip: '196502201990031002',
    nip_nik: '196502201990031002',
    unit_kerja_id: 'UN58',
    unit: 'Universitas Siliwangi',
    role: 'PEJABAT',
    role_slug: 'pimpinan',
    roleLabel: 'Rektor',
    is_pejabat: true,
    jabatan: 'Rektor'
  };

  const suratMasukImage1 = {
    id: 'SRT-IN-2026-0001',
    nomorAgenda: 'AGD-2026/UN58/0001',
    nomorSurat: '123232',
    kategori: 'Surat Masuk',
    perihal: 'Permohonan data dukung dan kehadiran pimpinan dalam rangka rekonsiliasi laporan keuangan dan aset',
    pengirim: 'Kementerian Pendidikan Dasar dan Menengah',
    tujuan: 'Rektor Universitas Siliwangi',
    sifat: 'Penting',
    status: 'Surat Masuk',
    status_db: 'DITERIMA',
    statusTimestamp: 'Menunggu Disposisi Pimpinan',
    lampiran: 'LAPORAN PROGRES BULANAN PENGEMBANGAN SISTEM SILOKA.pdf',
    riwayatParaf: [
      {
        nama: 'Agung Cahya Nur, S.Pd., M.Pd.',
        jabatan: 'Pengadministrasi Persuratan / Tata Usaha Pimpinan',
        catatan: 'Registrasi Surat Masuk Eksternal (No. Asal: 123232) - Agenda: AGD-2026/UN58/0001 - Sifat: Penting [Tujuan: Rektor Universitas Siliwangi]',
        waktu: '5 Okt 2026, 15.09'
      }
    ]
  };

  it('harus berhasil me-render LetterDetailModal tanpa exception', () => {
    const html = renderToString(
      <LetterDetailModal
        letter={suratMasukImage1}
        isOpen={true}
        onClose={() => {}}
        onOpenDisposisi={() => {}}
        currentUser={rektorUser}
      />
    );
    expect(html).toContain('Detail Persuratan &amp; Jejak Administrasi');
    expect(html).toContain('AGD-2026/UN58/0001');
  });

  it('harus berhasil me-render QuickDisposisiModal saat dibuka untuk surat masuk Image 1', () => {
    const html = renderToString(
      <QuickDisposisiModal
        letter={suratMasukImage1}
        isOpen={true}
        onClose={() => {}}
        onSubmitDisposisi={() => {}}
        allLetters={[suratMasukImage1]}
        currentUser={rektorUser}
        allUsers={[rektorUser]}
      />
    );
    expect(html).toContain('Lembar Disposisi Surat Masuk');
    expect(html).toContain('123232');
  });
});
