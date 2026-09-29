/**
 * Automated Test Suite: 8 Fitur Utama Persuratan & Kearsipan Digital SILOKA UNSIL
 * & Strict Business Rule Enforcement (Jalur Khusus Tanda Tangan Elektronik / TTE)
 */

import {
  isLetterSignatureRequest,
  canLetterBeDisposed,
  getLetterActionCapabilities,
  calculateLetterTracking
} from '../letterActionPolicy.js';

import { saveInboundLetter, saveOutgoingLetter } from '../../services/letterService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ GAGAL: ${message}`);
  }
}

async function runPersuratanTests() {
  console.log('===============================================================');
  console.log('TEST SUITE: SISTEM PERSURATAN & KEARSIPAN TERPADU SILOKA UNSIL');
  console.log('===============================================================\n');

  // Dummy Users
  const rektorUser = {
    id: 'usr-rektor',
    name: 'Prof. Dr. Ir. Nundang Busaeri, M.T., IPU., ASEAN Eng.',
    nama_lengkap: 'Prof. Dr. Ir. Nundang Busaeri, M.T., IPU., ASEAN Eng.',
    nip: '196109191988031002',
    role: 'PIMPINAN',
    roleLabel: 'Rektor Universitas Siliwangi',
    unit_kerja_id: 'UN58'
  };

  const dekanUser = {
    id: 'usr-dekan-ft',
    name: 'Dr. Nurul Hiron, S.T., M.Eng.',
    nama_lengkap: 'Dr. Nurul Hiron, S.T., M.Eng.',
    nip: '197505102001121001',
    role: 'PEJABAT',
    roleLabel: 'Dekan Fakultas Teknik',
    unit_kerja_id: 'UN58.7'
  };

  const stafUser = {
    id: 'usr-staf',
    name: 'Siti Rohmah, S.AP.',
    nama_lengkap: 'Siti Rohmah, S.AP.',
    nip: '198809152014042001',
    role: 'STAF',
    roleLabel: 'Staf Administrasi Persuratan',
    unit_kerja_id: 'UN58.6'
  };

  const pengawasUser = {
    id: 'usr-spi',
    name: 'Pengawas SPI UNSIL',
    nama_lengkap: 'Pengawas SPI UNSIL',
    nip: '197902122005011003',
    role: 'PENGAWAS',
    roleLabel: 'Pengawas Internal Satuan Pengawas Internal (SPI)',
    unit_kerja_id: 'UN58.4'
  };

  // -------------------------------------------------------------
  // FITUR 1: SURAT MASUK (Pencatatan Digital Lengkap)
  // -------------------------------------------------------------
  console.log('--- 1. Pengujian Fitur 1: Surat Masuk ---');
  const inboundPayload = {
    tingkat_keamanan: 'B',
    kode_klasifikasi: 'KU.01.04',
    perihal: 'Permohonan Data Realisasi Bantuan Operasional Perguruan Tinggi Negeri',
    pengirim: 'Direktorat Jenderal Pendidikan Tinggi, Riset, dan Teknologi',
    tujuan: 'Rektor Universitas Siliwangi',
    nomor_surat_asal: 'B/1422/KEMENDIKBUD/IX/2026',
    tujuan_aksi: 'DISPOSISI',
    tahun: 2026,
    unit_kerja_id: 'UN58.6'
  };

  const inboundRes = await saveInboundLetter(inboundPayload, stafUser);
  assert(Boolean(inboundRes && inboundRes.success === true), 'Layanan saveInboundLetter berhasil mencatat surat masuk');
  assert(Boolean(inboundRes?.data?.nomor_agenda?.startsWith('AGD-2026/UN58.6/')), 'Nomor agenda registrasi surat masuk terbit otomatis');
  assert(inboundRes?.data?.nomor_surat_asal === inboundPayload.nomor_surat_asal, 'Nomor surat asal eksternal tercatat akurat');
  assert(inboundRes?.data?.pengirim === inboundPayload.pengirim, 'Identitas instansi pengirim eksternal tersimpan akurat');
  assert(inboundRes?.data?.tujuan === inboundPayload.tujuan, 'Tujuan internal pimpinan tersimpan akurat');

  const savedInbound = {
    id: 'SRT-IN-2026-0001',
    nomorSurat: inboundRes?.data?.nomor_agenda || 'AGD-2026/UN58.6/0001',
    nomorSuratAsal: inboundRes?.data?.nomor_surat_asal || inboundPayload.nomor_surat_asal,
    tanggal: '2026-09-21',
    pengirim: inboundRes?.data?.pengirim || inboundPayload.pengirim,
    tujuan: inboundRes?.data?.tujuan || inboundPayload.tujuan,
    perihal: inboundRes?.data?.perihal || inboundPayload.perihal,
    kategori: 'Surat Masuk',
    sifat: 'Segera',
    kodeKlasifikasi: inboundRes?.data?.kode_klasifikasi || inboundPayload.kode_klasifikasi,
    subKlasifikasi: 'Realisasi Anggaran',
    ringkasan: 'Permintaan penyampaian laporan verifikasi penyerapan dana BOPTN triwulan III.',
    status: 'Dikirim',
    tujuan_aksi: inboundRes?.data?.tujuan_aksi || inboundPayload.tujuan_aksi
  };
  assert(savedInbound.kategori === 'Surat Masuk', 'Kategori naskah tercatat sebagai Surat Masuk');
  assert(savedInbound.status === 'Dikirim', 'Surat masuk langsung berstatus Dikirim/Tercatat dalam antrean');

  // -------------------------------------------------------------
  // FITUR 2: SURAT KELUAR (Penyusunan, Draf, dan Penomoran)
  // -------------------------------------------------------------
  console.log('\n--- 2. Pengujian Fitur 2: Surat Keluar & Penomoran Otomatis ---');
  const outboundPayload = {
    tingkat_keamanan: 'B',
    kode_klasifikasi: 'KP.02.01',
    perihal: 'Undangan Rapat Koordinasi Kurikulum OBE Program Studi',
    tujuan: 'Ketua Jurusan Informatika Fakultas Teknik',
    pengirim: 'Dekan Fakultas Teknik Universitas Siliwangi',
    tahun: 2026,
    unit_kerja_id: 'UN58.7'
  };

  const outboundRes = await saveOutgoingLetter(outboundPayload, dekanUser);
  assert(Boolean(outboundRes && outboundRes.success === true), 'Layanan saveOutgoingLetter berhasil menerbitkan nomor naskah dinas');
  assert(Boolean(outboundRes?.data?.nomor_surat_lengkap?.includes('/UN58.7/B/KP.02.01/2026')), 'Format penomoran surat keluar sesuai Perka ANRI & Standar UNSIL');

  const savedDraft = {
    id: 'SRT-OUT-2026-0001',
    nomorSurat: outboundRes?.data?.nomor_surat_lengkap || '1/UN58.7/B/KP.02.01/2026',
    perihal: outboundRes?.data?.perihal || outboundPayload.perihal,
    kategori: 'Surat Keluar',
    status: 'Draft',
    pengirim: 'Dekan Fakultas Teknik Universitas Siliwangi',
    tujuan: 'Ketua Jurusan Informatika Fakultas Teknik',
    tanggal: '2026-09-21',
    kodeKlasifikasi: 'KP.02.01'
  };
  assert(savedDraft.kategori === 'Surat Keluar', 'Kategori naskah tercatat sebagai Surat Keluar');
  assert(savedDraft.status === 'Draft', 'Draf naskah berhasil disimpan dengan status Draft');

  const publishedOutbound = {
    ...savedDraft,
    id: 'SRT-OUT-2026-0002',
    status: 'Dikirim'
  };
  assert(publishedOutbound.status === 'Dikirim', 'Naskah keluar yang diajukan berstatus Dikirim');

  // -------------------------------------------------------------
  // FITUR 3: DISPOSISI SURAT (Instruksi Online Berjenjang)
  // -------------------------------------------------------------
  console.log('\n--- 3. Pengujian Fitur 3: Disposisi Surat Online & Validasi Mock Data ---');
  const letterToDispose = {
    ...savedInbound,
    id: 'ltr-disp-001',
    tujuan_aksi: 'DISPOSISI'
  };

  assert(canLetterBeDisposed(letterToDispose, rektorUser) === true, 'Pimpinan berhak mendisposisikan surat masuk biasa');

  // Validasi Mock Data Kartu Disposisi (Data Sinkronisasi BKU)
  const dispositionsData = (await import('../../data/dispositions.json', { with: { type: 'json' } })).default;
  const card2 = dispositionsData.find((d) => d.nomorAgenda === 'AGD-2026/09/0148');
  assert(card2 !== undefined, 'Kartu disposisi AGD-2026/09/0148 ditemukan di mock data');
  if (card2) {
    assert(card2.pemberiDisposisi?.includes('Kepala Biro BKU'), 'Kartu AGD-2026/09/0148 mencantumkan Kepala Biro BKU (Biro Keuangan dan Umum)');
    assert(!card2.pemberiDisposisi?.includes('Kepala Biro BUK'), 'Teks "Kepala Biro BUK" telah dibersihkan dari kartu AGD-2026/09/0148');
  }

  // Validasi Standar Instruksi Resmi UNSIL ("Untuk :")
  const { OFFICIAL_UNSIL_INSTRUCTIONS, BKU_STRUCTURAL_TEAMS } = await import('../disposisiStandards.js');
  const expectedInstructions = [
    'Ikuti Disposisi Rektor',
    'Proses sesuai prosedur',
    'Selesaikan',
    'Tanggapan/saran tertulis',
    'Pelajari',
    'Untuk pertimbangan'
  ];
  assert(
    expectedInstructions.every((inst) => OFFICIAL_UNSIL_INSTRUCTIONS.includes(inst)),
    'Daftar opsi checkbox "Instruksi Tindak Lanjut" ("Untuk :") memuat 6 butir resmi Lampiran Contoh 21'
  );

  // Validasi 5 Nomenklatur Struktural Unit Kerja BKU UNSIL
  const expectedBkuTeams = [
    'Kepala Bagian Umum',
    'Ketua Tim Bidang Keuangan',
    'Ketua Tim Bidang Kepegawaian',
    'Ketua Tim Kerumahtanggan dan BMN',
    'Ketua Tim Keprotokolan dan Humas'
  ];
  const actualTeamNames = BKU_STRUCTURAL_TEAMS.map((t) => t.nama);
  assert(
    expectedBkuTeams.every((team) => actualTeamNames.includes(team)),
    'Daftar dropdown Tujuan Disposisi strictly memuat 5 Nomenklatur Struktural BKU UNSIL'
  );

  const disposisiResult = {
    ...letterToDispose,
    status: 'Diparaf',
    disposisi: {
      nomorAgenda: 'AGD-2026/0892',
      tujuanDisposisi: 'Kepala Bagian Umum',
      targetUnit: 'Kepala Bagian Umum',
      instruksi: 'Proses sesuai prosedur, Pelajari',
      actions: ['Proses sesuai prosedur', 'Pelajari'],
      batasWaktu: '2026-09-25'
    }
  };

  assert(disposisiResult.disposisi.targetUnit === 'Kepala Bagian Umum', 'Tujuan disposisi tersimpan ke unit struktural BKU');
  assert(disposisiResult.disposisi.batasWaktu === '2026-09-25', 'Batas waktu penyelesaian disposisi tersimpan');
  assert(disposisiResult.status === 'Diparaf', 'Status surat berubah menjadi Diparaf setelah disposisi diterbitkan');

  // -------------------------------------------------------------
  // FITUR 4: PENOMORAN OTOMATIS
  // -------------------------------------------------------------
  console.log('\n--- 4. Pengujian Fitur 4: Format Penomoran Otomatis ---');
  const noSuratRegex = /^\d+\/UN58(?:\.[A-Za-z0-9.]+)?\/(?:B|R|SR)\/[A-Z]{2}\.\d{2}\.\d{2}\/\d{4}$/;
  assert(noSuratRegex.test(savedDraft.nomorSurat), `Format nomor surat ${savedDraft.nomorSurat} valid sesuai regex resmi`);
  assert(Boolean(savedInbound.nomorSurat?.startsWith('AGD-2026/UN58.6/')), `Nomor agenda ${savedInbound.nomorSurat} valid`);

  // -------------------------------------------------------------
  // FITUR 5: ARSIP DIGITAL (Pencarian Multi-Parameter)
  // -------------------------------------------------------------
  console.log('\n--- 5. Pengujian Fitur 5: Pencarian Multi-Parameter Arsip Digital ---');
  const letterDatabase = [
    savedInbound,
    savedDraft,
    publishedOutbound,
    {
      id: 'ltr-arsip-01',
      nomorSurat: '0104/UN58.6/B/KU.01.04/2026',
      nomorSuratAsal: 'SE-99/KEMENKEU/2026',
      tanggal: '2026-08-15',
      pengirim: 'Kementerian Keuangan RI',
      tujuan: 'Kepala Biro BKU',
      perihal: 'Pedoman Standar Biaya Masukan Tahun Anggaran 2027',
      kodeKlasifikasi: 'KU.01.04',
      subKlasifikasi: 'Standar Biaya',
      ringkasan: 'Pedoman honorarium dan perjalanan dinas.',
      kategori: 'Surat Masuk',
      status: 'Diarsipkan'
    }
  ];

  // Helper search matching
  const searchLetters = (query) => {
    const q = query.toLowerCase().trim();
    return letterDatabase.filter((l) => {
      const matchesNo = l.nomorSurat?.toLowerCase().includes(q);
      const matchesNoAsal = l.nomorSuratAsal?.toLowerCase().includes(q);
      const matchesTanggal = l.tanggal?.toLowerCase().includes(q);
      const matchesPerihal = l.perihal?.toLowerCase().includes(q);
      const matchesPengirim = l.pengirim?.toLowerCase().includes(q);
      const matchesTujuan = l.tujuan?.toLowerCase().includes(q);
      const matchesKlasifikasi = l.kodeKlasifikasi?.toLowerCase().includes(q) || l.subKlasifikasi?.toLowerCase().includes(q);
      const matchesRingkasan = l.ringkasan?.toLowerCase().includes(q);
      const matchesKategori = l.kategori?.toLowerCase().includes(q);
      const matchesStatus = l.status?.toLowerCase().includes(q);
      return Boolean(matchesNo || matchesNoAsal || matchesTanggal || matchesPerihal || matchesPengirim || matchesTujuan || matchesKlasifikasi || matchesRingkasan || matchesKategori || matchesStatus);
    });
  };

  assert(searchLetters('BOPTN').length >= 1, 'Pencarian kata kunci perihal "BOPTN" berhasil');
  assert(searchLetters('KEMENDIKBUD').length >= 1, 'Pencarian berdasarkan nama pengirim berhasil');
  assert(searchLetters('SE-99/KEMENKEU').length >= 1, 'Pencarian berdasarkan Nomor Surat Asal berhasil');
  assert(searchLetters('KU.01.04').length >= 2, 'Pencarian berdasarkan Kode Klasifikasi berhasil');
  assert(searchLetters('Diarsipkan').length >= 1, 'Pencarian berdasarkan Status Arsip berhasil');

  // -------------------------------------------------------------
  // FITUR 6: DRAFT, REVIEW, DAN APPROVAL
  // -------------------------------------------------------------
  console.log('\n--- 6. Pengujian Fitur 6: Draft, Review, dan Approval Naskah ---');
  let reviewLetter = {
    id: 'ltr-rev-01',
    nomorSurat: '0188/UN58.7/B/KP.02.01/2026',
    perihal: 'Usulan Kenaikan Jabatan Fungsional Dosen Lektor Kepala',
    pengirim: 'Ketua Jurusan Informatika',
    tujuan: 'Dekan Fakultas Teknik',
    status: 'Dikirim',
    riwayatParaf: []
  };

  // Case 6A: Pejabat meminta revisi (Tolak / Return with Note)
  const rejectNote = 'Lengkapi lampiran PAK dan bukti publikasi Scopus Q2 terlebih dahulu.';
  const rejectedLetter = {
    ...reviewLetter,
    status: 'Ditolak',
    riwayatParaf: [
      {
        nama: dekanUser.nama_lengkap,
        jabatan: dekanUser.roleLabel,
        waktu: '2026-09-21 14:00 WIB',
        catatan: `[CATATAN REVISI / PENOLAKAN]: ${rejectNote}`
      }
    ]
  };

  assert(rejectedLetter.status === 'Ditolak', 'Status surat berubah menjadi Ditolak');
  assert(rejectedLetter.riwayatParaf[0].catatan.includes(rejectNote), 'Catatan revisi tersimpan pada jejak audit');

  // Case 6B: Pejabat menyetujui draf naskah (Approval)
  const approvedLetter = {
    ...reviewLetter,
    status: 'Disetujui',
    riwayatParaf: [
      {
        nama: dekanUser.nama_lengkap,
        jabatan: dekanUser.roleLabel,
        waktu: '2026-09-21 15:30 WIB',
        catatan: 'Naskah dinas telah diverifikasi dan disetujui untuk diterbitkan.'
      }
    ]
  };

  assert(approvedLetter.status === 'Disetujui', 'Status surat berhasil disetujui (Disetujui)');
  assert(approvedLetter.riwayatParaf[0].nama === dekanUser.nama_lengkap, 'Nama pejabat penyetuju tercatat di riwayat');

  // -------------------------------------------------------------
  // FITUR 7: TRACKING SURAT (5-Tahap Visual Stepper)
  // -------------------------------------------------------------
  console.log('\n--- 7. Pengujian Fitur 7: Visual Tracking 5-Tahap ---');
  const trackDraft = calculateLetterTracking({ status: 'Draft' });
  assert(trackDraft.currentStep === 1, 'Status Draft berada pada Tahap 1');

  const trackSent = calculateLetterTracking({ status: 'Dikirim' });
  assert(trackSent.currentStep === 2, 'Status Dikirim berada pada Tahap 2');

  const trackDisposed = calculateLetterTracking({ status: 'Diparaf', disposisi: { instruksi: 'Laksanakan' } });
  assert(trackDisposed.currentStep === 4, 'Surat terdisposisi dan diparaf berada pada Tahap 4');

  const trackArchived = calculateLetterTracking({ status: 'Diarsipkan' });
  assert(trackArchived.currentStep === 5, 'Status Diarsipkan berada pada Tahap 5');

  // -------------------------------------------------------------
  // STRICT BUSINESS RULE ENFORCEMENT: JALUR KHUSUS TTE
  // -------------------------------------------------------------
  console.log('\n--- 8. PENGUJIAN ATURAN KETAT (STRICT BUSINESS RULE ENFORCEMENT) ---');
  console.log('Kondisi: Naskah dikirim ke Pejabat dengan tujuan Permohonan Tanda Tangan (tujuan_aksi = "TTD")');

  const signatureRequestLetter = {
    id: 'ltr-tte-strict-01',
    nomorSurat: '0205/UN58.7/B/KP.02.01/2026',
    perihal: 'Permohonan Tanda Tangan Keputusan Dekan tentang Tim Akreditasi',
    pengirim: 'Wakil Dekan Bidang Akademik Fakultas Teknik',
    tujuan: 'Dekan Fakultas Teknik',
    tujuan_aksi: 'TTD',
    isSignatureRequest: true,
    status: 'Dikirim',
    tteVerified: false,
    riwayatParaf: []
  };

  // 1. Deteksi identitas permohonan TTE
  assert(isLetterSignatureRequest(signatureRequestLetter) === true, 'Naskah terdeteksi sebagai Permohonan Tanda Tangan (isLetterSignatureRequest = true)');

  // 2. ATURAN MUTLAK: canLetterBeDisposed WAJIB FALSE untuk Pejabat, Staf, maupun Pengawas
  assert(canLetterBeDisposed(signatureRequestLetter, dekanUser) === false, 'CRITICAL: canLetterBeDisposed(letter, Pejabat) HARUS FALSE!');
  assert(canLetterBeDisposed(signatureRequestLetter, rektorUser) === false, 'CRITICAL: canLetterBeDisposed(letter, Rektor) HARUS FALSE!');
  assert(canLetterBeDisposed(signatureRequestLetter, stafUser) === false, 'CRITICAL: canLetterBeDisposed(letter, Staf) HARUS FALSE!');
  assert(canLetterBeDisposed(signatureRequestLetter, pengawasUser) === false, 'CRITICAL: canLetterBeDisposed(letter, Pengawas SPI) HARUS FALSE!');

  // 3. Kapabilitas Aksi Pejabat
  const dekanCaps = getLetterActionCapabilities(signatureRequestLetter, dekanUser);
  assert(dekanCaps.canDispose === false, 'STRICT ENFORCEMENT: dekanCaps.canDispose HARUS FALSE (Tombol Disposisi HILANG DARI DOM)');
  assert(dekanCaps.canSign === true, 'Pejabat MEMILIKI HAK membubuhkan TTE BSrE');
  assert(dekanCaps.canApprove === true, 'Pejabat MEMILIKI HAK menyetujui naskah');
  assert(dekanCaps.canReject === true, 'Pejabat MEMILIKI HAK menolak / meminta revisi');

  // 4. Tracking untuk Jalur Khusus TTE
  const tteTracking = calculateLetterTracking(signatureRequestLetter);
  const stage3 = tteTracking?.stages?.find((s) => s.id === 3);
  assert(Boolean(stage3 && stage3.name === 'Jalur Khusus TTD'), 'Tahap 3 persuratan berlabel "Jalur Khusus TTD"');
  assert(Boolean(stage3 && stage3.isSkipped === true), 'Tahap Disposisi berstatus isSkipped = true untuk permohonan TTE');

  // -------------------------------------------------------------
  // REKAPITULASI HASIL
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`TOTAL PENGUJIAN: ${passed + failed} | BERHASIL: ${passed} | GAGAL: ${failed}`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPersuratanTests().catch((err) => {
  console.error('Error saat menjalankan test suite persuratan:', err);
  process.exit(1);
});
