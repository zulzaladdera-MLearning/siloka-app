import { describe, it, expect } from 'vitest';
import React, { useState } from 'react';
import { renderToString } from 'react-dom/server';
import { LetterDetailModal } from '../LetterDetailModal';
import { QuickDisposisiModal } from '../QuickDisposisiModal';
import usersData from '../../../data/users.json';

describe('Test Disposisi Click & Modal Transition Crash Reproduction', () => {
  const rektorUser = usersData.find((u) => u.id === 'usr-01' || u.roleLabel === 'Rektor') || {
    id: 'usr-01',
    nama_lengkap: 'Prof. Dr. Ir. H. Nundang Busaeri, M.T.',
    role: 'PEJABAT',
    role_slug: 'pimpinan',
    roleLabel: 'Rektor',
    is_pejabat: true,
    jabatan: 'Rektor'
  };

  const suratMasukImage1 = {
    id: 'SRT-IN-2026-0001',
    id_surat: 101,
    nomorSurat: 'AGD-2026/UN58/0001',
    nomor_urut: 1,
    nomorSuratAsal: '123232',
    nomorAgenda: 'AGD-2026/UN58/0001',
    tanggal: '2026-10-05',
    tanggalTerima: '2026-10-05',
    perihal: 'Permohonan data dukung dan kehadiran pimpinan dalam rangka rekonsiliasi laporan keuangan dan aset',
    kategori: 'Surat Masuk',
    templateType: 'surat-masuk',
    isSuratMasuk: true,
    sifat: 'Penting',
    kategoriKeamanan: 'Biasa/Terbuka',
    tingkat_keamanan: 'B',
    kodeKlasifikasi: 'KU.00.00',
    subKlasifikasi: 'KU.00.00',
    pengirim: 'Kementerian Pendidikan Dasar dan Menengah',
    tujuan: 'Rektor Universitas Siliwangi',
    target_jabatan: 'Rektor Universitas Siliwangi',
    target_role: 'REKTOR',
    target_role_slug: 'pimpinan',
    target_unit_id: 'UN58',
    target_unit_nama: 'Universitas Siliwangi',
    ringkasan: 'Permohonan data dukung dan kehadiran pimpinan dalam rangka rekonsiliasi laporan keuangan dan aset',
    lampiran: 'LAPORAN PROGRES BULANAN PENGEMBANGAN SISTEM SILOKA.pdf (371.4 KB)',
    status: 'Diterima',
    status_db: 'DITERIMA',
    statusTimestamp: 'Surat Masuk terdaftar pada Buku Agenda SILOKA — Diteruskan ke Rektor Universitas Siliwangi',
    tujuan_aksi: 'DISPOSISI',
    isSignatureRequest: false,
    tteVerified: false,
    unit_kerja_id: 'UN58',
    riwayatParaf: [
      {
        nama: 'Agung Cahya Nur, S.Pd., M.Pd.',
        jabatan: 'Pengadministrasi Persuratan / Tata Usaha Pimpinan',
        waktu: '5 Okt 2026, 15.09 WIB',
        catatan: 'Registrasi Surat Masuk Eksternal (No. Asal: 123232) - Agenda: AGD-2026/UN58/0001 - Sifat: Penting [Tujuan: Rektor Universitas Siliwangi]'
      }
    ]
  };

  function TestHarness() {
    const [selectedLetter, setSelectedLetter] = useState(suratMasukImage1);
    const [disposisiTargetLetter, setDisposisiTargetLetter] = useState(null);
    const [isDisposisiOpen, setIsDisposisiOpen] = useState(false);

    const handleOpenDisposisi = (letter) => {
      setSelectedLetter(null);
      setDisposisiTargetLetter(letter);
      setIsDisposisiOpen(true);
    };

    return (
      <div>
        <LetterDetailModal
          letter={selectedLetter}
          isOpen={!!selectedLetter}
          onClose={() => setSelectedLetter(null)}
          onOpenDisposisi={handleOpenDisposisi}
          currentUser={rektorUser}
        />
        <QuickDisposisiModal
          letter={disposisiTargetLetter}
          isOpen={isDisposisiOpen}
          onClose={() => setIsDisposisiOpen(false)}
          onSubmitDisposisi={() => {}}
          allLetters={[suratMasukImage1]}
          currentUser={rektorUser}
          allUsers={usersData}
        />
      </div>
    );
  }

  it('harus me-render simulasi TestHarness saat LetterDetailModal terbuka', () => {
    const html = renderToString(<TestHarness />);
    expect(html).toContain('Detail Persuratan &amp; Jejak Administrasi');
  });

  it('harus me-render simulasi QuickDisposisiModal saat isDisposisiOpen = true', () => {
    function DisposisiOpenHarness() {
      return (
        <QuickDisposisiModal
          letter={suratMasukImage1}
          isOpen={true}
          onClose={() => {}}
          onSubmitDisposisi={() => {}}
          allLetters={[suratMasukImage1]}
          currentUser={rektorUser}
          allUsers={usersData}
        />
      );
    }
    const html = renderToString(<DisposisiOpenHarness />);
    expect(html).toContain('Lembar Disposisi Surat Masuk');
  });
});
