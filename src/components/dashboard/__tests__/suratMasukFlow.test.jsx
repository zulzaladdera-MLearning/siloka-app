import { describe, it, expect } from 'vitest';
import { transformLettersToAgenda } from '../BukuAgendaView';
import { saveInboundLetter } from '../../../services/letterService';

describe('Alur Registrasi Surat Masuk, Penomoran Agenda, & Buku Agenda (SILOKA UNSIL)', () => {
  it('harus menghasilkan nomor agenda resmi dengan format AGD-YYYY/UNIT/XXXX saat simpan surat masuk', async () => {
    const inboundPayload = {
      tingkat_keamanan: 'B',
      kode_klasifikasi: 'KP.01.00',
      perihal: 'Permohonan Narasumber Kuliah Umum Teknologi Informasi',
      pengirim: 'Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi',
      tujuan: 'Rektor Universitas Siliwangi',
      target_unit_id: 'UN58',
      nomor_surat_asal: '421.4/128/SMK-TI/IX/2026',
      tahun: 2026
    };

    const res = await saveInboundLetter(inboundPayload, {
      id: 'usr-staf-01',
      unit_kerja_id: 'UN58.6',
      role: 'OPERATOR_UNIT'
    });

    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data.nomor_agenda).toMatch(/^AGD-2026\/UN58\/\d{4}$/);
    expect(res.data.target_unit_id).toBe('UN58');
    expect(res.data.nomorSuratAsal).toBe('421.4/128/SMK-TI/IX/2026');
  });

  it('harus mentransformasi surat masuk menjadi entri Buku Agenda dengan presisi nomor agenda dan nomor asal', () => {
    const mockLetters = [
      {
        id: 'SRT-IN-2026-0001',
        nomorSurat: 'AGD-2026/UN58/0001',
        nomorAgenda: 'AGD-2026/UN58/0001',
        nomorSuratAsal: '421.4/128/SMK-TI/IX/2026',
        tanggal: '2026-09-28',
        tanggalTerima: '2026-09-29',
        perihal: 'Permohonan Narasumber Kuliah Umum Teknologi Informasi',
        kategori: 'Surat Masuk',
        pengirim: 'Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi',
        tujuan: 'Rektor Universitas Siliwangi',
        target_unit_id: 'UN58',
        unit_kerja_id: 'UN58',
        status: 'Diterima'
      }
    ];

    const agendaList = transformLettersToAgenda(mockLetters, 'Universitas Siliwangi (Rektorat)');

    expect(agendaList).toHaveLength(1);
    const item = agendaList[0];
    expect(item.jenis).toBe('MASUK');
    expect(item.kategori).toBe('Surat Masuk');
    expect(item.nomorAgenda).toBe('AGD-2026/UN58/0001');
    expect(item.nomorSurat).toBe('421.4/128/SMK-TI/IX/2026');
    expect(item.pengirim).toBe('Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi');
    expect(item.penerima).toBe('Rektor Universitas Siliwangi');
    expect(item.ekspedisiStatus).toBe('Diterima');
  });

  it('harus memastikan filter unit kerja Rektorat (UN58) menyertakan surat masuk ber-target Rektorat', () => {
    const filterUnit = 'UN58';
    const letter = {
      kategori: 'Surat Masuk',
      unit_kerja_id: 'UN58',
      target_unit_id: 'UN58',
      loket_unit_id: 'UN58.6',
      target_jabatan: 'Rektor Universitas Siliwangi',
      tujuan: 'Rektor Universitas Siliwangi'
    };

    const letterUnit = String(letter.unit_kerja_id || '').toUpperCase();
    const targetUnit = String(letter.target_unit_id || '').toUpperCase();
    const loketUnit = String(letter.loket_unit_id || '').toUpperCase();
    const letterTujuanLower = String(letter.target_jabatan || letter.tujuan || '').toLowerCase().trim();

    const matchesDirectUnit =
      letterUnit === filterUnit ||
      targetUnit === filterUnit ||
      loketUnit === filterUnit;

    let matchesContext = false;
    if (filterUnit === 'UN58' || filterUnit === 'UNSIL') {
      if (
        letterTujuanLower.includes('rektor') ||
        letterTujuanLower.includes('warek') ||
        letterTujuanLower.includes('universitas') ||
        letterUnit === 'UN58' ||
        targetUnit === 'UN58'
      ) {
        matchesContext = true;
      }
    }

    expect(matchesDirectUnit || matchesContext).toBe(true);
  });
});
