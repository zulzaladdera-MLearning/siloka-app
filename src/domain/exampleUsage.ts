/**
 * Contoh Eksekusi & Integrasi Domain Model SILOKA pada Komponen / Hook React
 * Mendemonstrasikan pembuatan naskah, paraf, penandatanganan TTE, disposisi, dan evaluasi retensi arsip.
 */

import {
  UnitKerja,
  User,
  Pejabat,
  SuratDinas,
  SuratTugas,
  NotaDinas,
  DispositionService,
  ArchiveManager,
  AuditLogger
} from './index';

export function runSilokaDomainDemo() {
  console.log('=====================================================');
  console.log('🏛️ DEMO SILOKA DOMAIN MODEL & SERVICES (OOP)');
  console.log('=====================================================\n');

  // 1. Inisialisasi Master Entitas Unit Kerja
  const bkuUnit = new UnitKerja(6, 'UN58.6', 'Biro Keuangan dan Umum', 'BIRO', 'UN58');
  const tikUnit = new UnitKerja(18, 'UN58.32', 'Unit Penunjang Akademik TIK', 'UPA', 'UN58');

  console.log('1. UNIT KERJA & KOP RESMI:');
  console.log('Kop Surat BKU:', bkuUnit.getFormatKopSurat().namaUnit);
  console.log('Kode Unit:', bkuUnit.kodeUnit);

  // 2. Inisialisasi Pengguna (User & Pejabat)
  const operatorBku = new User('usr-02', '198809152014042001', 'Siti Rohmah, S.AP.', 'OPERATOR_UNIT', bkuUnit);
  const kepalaBku = new Pejabat(
    'usr-01',
    '196808301989031004',
    'Dr. Nana Sujana, Drs., M.Si.',
    bkuUnit,
    'Kepala Biro Keuangan dan Umum'
  );
  const kepalaTik = new Pejabat(
    'usr-35',
    '197505122000031001',
    'Ir. Hendra Wijaya, M.T.',
    tikUnit,
    'Kepala UPA TIK'
  );

  console.log('\n2. OTORISASI USER:');
  console.log(`- ${operatorBku.namaLengkap} canSignDocument:`, operatorBku.canSignDocument()); // false
  console.log(`- ${kepalaBku.namaLengkap} canSignDocument:`, kepalaBku.canSignDocument()); // true

  // 3. Pembuatan Naskah Dinas: SuratDinas (Polimorfisme)
  console.log('\n3. PEMBUATAN DRAF SURAT DINAS:');
  const suratDinas = new SuratDinas(
    'SRT-DEMO-001',
    'Permohonan Alokasi Anggaran Pengadaan Server Cloud BKU TA 2027',
    operatorBku,
    bkuUnit,
    'KU.01.00',
    'Rektor Universitas Siliwangi',
    'Dengan hormat, bersama surat ini kami sampaikan usulan pengadaan server cloud...',
    '1 (Satu) Berkas Proposal',
    'B'
  );

  console.log('Status awal:', suratDinas.status); // DRAF
  console.log('Nomor Surat sebelum TTE:', suratDinas.nomorSurat); // null

  // 4. Proses Paraf Koordinasi Berjenjang
  suratDinas.bubuhkanParaf(operatorBku, 'Draf konsep surat telah diverifikasi kelengkapan datanya.');
  console.log('Status setelah paraf:', suratDinas.status); // DIPARAF

  // Log aksi pembuatan naskah
  AuditLogger.getInstance().logAction(
    operatorBku,
    'LETTER_CREATE_DRAFT',
    suratDinas,
    'Staf operator menginput konsep naskah dinas baru'
  );

  // 5. Penandatanganan Elektronik (TTE BSrE) oleh Pejabat
  console.log('\n4. PENANDATANGANAN TTE OLEH PEJABAT:');
  const tteResult = suratDinas.signWithTTE(kepalaBku, 'UNSIL-TTE-2026');
  console.log('Hasil TTE:', tteResult.isValid ? 'SAH & TERVERIFIKASI BSrE' : 'GAGAL');
  console.log('Nomor Surat Resmi Diterbitkan:', suratDinas.nomorSurat); // 0142/UN58.6/B/KU.01.00/2026
  console.log('Status terkini:', suratDinas.status); // TTE

  // 6. Penerusan Disposisi via DispositionService (Singleton)
  console.log('\n5. PENERUSAN DISPOSISI:');
  const dispositionService = DispositionService.getInstance();
  const disposisi = dispositionService.forwardDocument(
    suratDinas,
    kepalaBku,
    kepalaTik,
    'Koordinasikan spesifikasi teknis cloud dan kapasitas bandwidth dengan UPA TIK.',
    'Segera'
  );
  console.log('Disposisi Diterbitkan:', disposisi.nomorAgenda);
  console.log(`Diteruskan kepada: ${disposisi.toUserName} (${disposisi.toUnitName})`);
  console.log(`Instruksi: "${disposisi.instruksi}"`);

  // 7. Evaluasi Jadwal Retensi Arsip (ArchiveManager)
  console.log('\n6. EVALUASI JRA & SIKLUS HIDUP ARSIP:');
  const archiveManager = ArchiveManager.getInstance();
  const retensiStatusSekarang = archiveManager.checkRetentionStatus(suratDinas);
  console.log('Status Retensi Saat Ini (Tahun Berjalan):', retensiStatusSekarang); // Aktif

  // Simulasi 4 tahun ke depan
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 4);
  const retensiMasaDepan = archiveManager.evaluateDocument(suratDinas, futureDate);
  console.log('Status Retensi 4 Tahun Lagi:', retensiMasaDepan.status); // Inaktif
  console.log('Rekomendasi Tindakan:', retensiMasaDepan.rekomendasiTindakan);

  // 8. Polimorfisme Jenis Naskah Lainnya (SuratTugas & NotaDinas)
  console.log('\n7. POLIMORFISME FORMAT PENOMORAN LAIN:');
  const suratTugas = new SuratTugas(
    'ST-DEMO-001',
    'Penugasan Tim Asesor Internal Akreditasi Program Studi',
    operatorBku,
    bkuUnit,
    'KP.03.00',
    'Surat Keputusan Rektor No. 120/2026',
    'Melaksanakan audit kepatuhan ISO 9001',
    'Kampus Mugarsari',
    '15 Sep 2026',
    '17 Sep 2026'
  );
  suratTugas.tambahPetugas({
    nama: 'Budi Santoso, S.E., M.Ak.',
    nip: '198203202008121002',
    jabatan: 'Koordinator Keuangan'
  });
  console.log('Nomor Surat Tugas Polimorfik:', suratTugas.generateNomorSurat('0044'));

  const notaDinas = new NotaDinas(
    'ND-DEMO-001',
    'Koordinasi Penyusunan RKAT Fakultas Keguruan dan Ilmu Pendidikan',
    operatorBku,
    bkuUnit,
    'KU.01.00',
    'Dekan FKIP',
    'Kepala Biro Keuangan dan Umum'
  );
  console.log('Nomor Nota Dinas Polimorfik (Tanpa Kode Keamanan):', notaDinas.generateNomorSurat('0018'));

  // 9. Rekapitulasi Audit Trail
  console.log('\n8. AUDIT TRAIL LOGS:');
  const auditLogs = AuditLogger.getInstance().getLogs();
  console.log(`Total Transaksi Tercatat: ${auditLogs.length} aksi`);
  auditLogs.forEach((log, idx) => {
    console.log(`[${idx + 1}] ${log.timestamp} | ${log.userName} (${log.userRole}) -> ${log.action} | Hash: ${log.integrityHash.slice(0, 20)}...`);
  });

  console.log('\n=====================================================');
  console.log('✅ EKSEKUSI BERHASIL DENGAN INTEGRITAS TINGGI');
  console.log('=====================================================');

  return {
    suratDinas,
    disposisi,
    retensiStatusSekarang,
    auditLogs
  };
}

