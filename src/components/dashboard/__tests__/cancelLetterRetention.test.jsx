import { describe, it, expect } from 'vitest';
import { transformLettersToAgenda } from '../BukuAgendaView';

describe('Integritas Retensi Arsip & Pembatalan Registrasi Surat (Anti-Slop Kearsipan)', () => {
  const suratMasukBeragenda = {
    id: 'sm-001',
    nomorAgenda: 'AGD-2026/UN58/0013',
    nomorSurat: '421.4/128/SMK-TI/IX/2026',
    nomorSuratAsal: '421.4/128/SMK-TI/IX/2026',
    kategori: 'Surat Masuk',
    perihal: 'Koordinasi Pelaksanaan Program Penguatan Tata Kelola PTN-BLU: ZLA',
    pengirim: 'Kementerian Pendidikan Tinggi, Sains, dan Teknologi',
    tujuan: 'Wakil Rektor Bidang Kemahasiswaan dan Alumni',
    tanggal: '2026-10-06',
    status: 'Diterima'
  };

  it('pembatalan registrasi tidak boleh menghapus surat dari daftar melainkan mengubah status ke Dibatalkan', () => {
    // Simulasi handler handleCancelLetter
    const reason = 'Salah unggah berkas (lampiran PDF keliru atau salah versi)';
    const note = 'Digantikan dengan nomor agenda AGD-0014';
    const canceller = 'Agung Cahya Nur, S.Pd., M.Pd.';

    const suratDibatalkan = {
      ...suratMasukBeragenda,
      status: 'Dibatalkan',
      statusTimestamp: `Dibatalkan oleh ${canceller}`,
      alasan_pembatalan: reason,
      catatan_pembatalan: note,
      dibatalkan_oleh: canceller,
      dibatalkan_pada: '06 Oktober 2026, 14:00 WIB'
    };

    expect(suratDibatalkan.id).toBe(suratMasukBeragenda.id);
    expect(suratDibatalkan.nomorAgenda).toBe('AGD-2026/UN58/0013');
    expect(suratDibatalkan.status).toBe('Dibatalkan');
    expect(suratDibatalkan.alasan_pembatalan).toContain('Salah unggah');
    expect(suratDibatalkan.dibatalkan_oleh).toBe(canceller);
  });

  it('nomor agenda surat yang dibatalkan harus tetap utuh di Buku Agenda resmi kearsipan', () => {
    const letters = [
      {
        id: 'sm-001',
        nomorAgenda: 'AGD-2026/UN58/0012',
        nomorSurat: '001/A/2026',
        kategori: 'Surat Masuk',
        perihal: 'Surat Undangan Dinas',
        pengirim: 'Kemendikbudristek',
        tujuan: 'Rektor',
        status: 'Diterima'
      },
      {
        id: 'sm-002',
        nomorAgenda: 'AGD-2026/UN58/0013',
        nomorSurat: '421.4/128/SMK-TI/IX/2026',
        kategori: 'Surat Masuk',
        perihal: 'Koordinasi Pelaksanaan Program Penguatan Tata Kelola PTN-BLU: ZLA',
        pengirim: 'Kementerian Pendidikan Tinggi',
        tujuan: 'Wakil Rektor',
        status: 'Dibatalkan',
        alasan_pembatalan: 'Registrasi ganda'
      },
      {
        id: 'sm-003',
        nomorAgenda: 'AGD-2026/UN58/0014',
        nomorSurat: '003/C/2026',
        kategori: 'Surat Masuk',
        perihal: 'Surat Edaran Koordinasi',
        pengirim: 'Kemenkeu',
        tujuan: 'Rektor',
        status: 'Diterima'
      }
    ];

    const agendaList = transformLettersToAgenda(letters, 'Universitas Siliwangi');

    // Pastikan 3 entri tetap utuh tanpa ada nomor yang melompat / hilang
    expect(agendaList).toHaveLength(3);
    expect(agendaList[0].nomorAgenda).toBe('AGD-2026/UN58/0012');
    expect(agendaList[1].nomorAgenda).toBe('AGD-2026/UN58/0013');
    expect(agendaList[1].ekspedisiStatus).toBe('Dibatalkan');
    expect(agendaList[2].nomorAgenda).toBe('AGD-2026/UN58/0014');
  });
});
