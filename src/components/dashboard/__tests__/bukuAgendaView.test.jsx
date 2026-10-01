import { describe, it, expect } from 'vitest';
import { transformLettersToAgenda } from '../BukuAgendaView';

describe('BukuAgendaView - Transformasi & Validasi Data Buku Agenda Masuk & Ekspedisi', () => {
  const mockLetters = [
    {
      id: 'ltr-001',
      nomorSurat: '001/UN58.13/TU/2026',
      kategori: 'Surat Masuk',
      tanggal: '2026-09-28',
      pengirim: 'Kementerian Pendidikan Tinggi',
      tujuan: 'Rektor Universitas Siliwangi',
      perihal: 'Undangan Rapat Koordinasi Nasional',
      status: 'Tercatat'
    },
    {
      id: 'ltr-002',
      nomorSurat: '002/UN58/KP/2026',
      kategori: 'Surat Keluar',
      tanggal: '2026-09-29',
      pengirim: 'Rektor Universitas Siliwangi',
      tujuan: 'Kepala LLDIKTI Wilayah IV',
      perihal: 'Usulan Akreditasi Program Studi Baru',
      status: 'Dikirim'
    }
  ];

  it('harus memetakan naskah surat menjadi entri buku agenda yang valid', () => {
    const agenda = transformLettersToAgenda(mockLetters, 'Fakultas Teknik');

    expect(agenda).toHaveLength(2);

    // Agenda 1: Surat Masuk
    expect(agenda[0].jenis).toBe('MASUK');
    expect(agenda[0].nomorAgenda).toContain('AGD-M/');
    expect(agenda[0].nomorSurat).toBe('001/UN58.13/TU/2026');
    expect(agenda[0].pengirim).toBe('Kementerian Pendidikan Tinggi');
    expect(agenda[0].penerima).toBe('Rektor Universitas Siliwangi');
    expect(agenda[0].perihal).toBe('Undangan Rapat Koordinasi Nasional');

    // Agenda 2: Surat Keluar
    expect(agenda[1].jenis).toBe('KELUAR');
    expect(agenda[1].nomorAgenda).toContain('AGD-K/');
    expect(agenda[1].nomorSurat).toBe('002/UN58/KP/2026');
    expect(agenda[1].penerima).toBe('Kepala LLDIKTI Wilayah IV');
  });

  it('harus menangani array surat kosong secara aman', () => {
    const emptyAgenda = transformLettersToAgenda([], 'Fakultas Teknik');
    expect(emptyAgenda).toEqual([]);
  });
});
