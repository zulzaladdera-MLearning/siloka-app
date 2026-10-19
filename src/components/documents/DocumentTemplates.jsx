import React from 'react';
import { QrCode } from 'lucide-react';
import { determineKopSurat } from '../../utils/kopSuratHelper';

/**
 * Kop Surat Resmi Universitas Siliwangi (Dinamis Sesuai Peraturan Rektor No. 3/2023)
 * - Format Tingkat Universitas [Pasal 30 (2)]: Rektor / Wakil Rektor / Biro (tanpa nama fakultas/biro di baris ketiga)
 * - Format Tingkat Unit Kerja [Pasal 31 (1, 2, 6)]: Dekan / Dosen / Operator Fakultas / Lembaga / UPA
 *   (nama Fakultas/Lembaga/UPA dimunculkan di baris ketiga dengan tulisan paling tebal)
 * 
 * Format persis 1:1 spesimen resmi:
 * - Logo bulat resmi UNSIL di sisi kiri
 * - Teks kop terpusat (text-center simetris)
 * - Baris Kementerian: Times New Roman 16pt Kapital
 * - Baris Universitas/Unit: Times New Roman 14pt Bold Kapital
 * - Baris Alamat: Times New Roman 12pt
 * - Garis tebal penutup tunggal 2,5pt melintang penuh
 */
export const KopSuratUnsil = ({
  compact = false,
  unit = null,
  kodeUnit = null,
  currentUser = null,
  hideUnit = false,
  forceUniversityHeader = false
}) => {
  const effectiveUnit = forceUniversityHeader ? 'UN58' : (unit || kodeUnit || currentUser);
  const kopConfig = determineKopSurat(effectiveUnit);

  // Pecah teks kementerian secara baku tepat 2 baris sesuai Gambar Spesimen Resmi UNSIL
  let baris1 = 'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN,';
  let baris2 = 'RISET, DAN TEKNOLOGI';
  if (kopConfig.kementerianText && !kopConfig.kementerianText.toUpperCase().includes('RISET')) {
    baris1 = kopConfig.kementerianText;
    baris2 = '';
  }

  const shouldShowUnit = !hideUnit && !forceUniversityHeader && kopConfig.isTingkatUnitKerja && kopConfig.namaUnitBarisTiga;

  return (
    <div
      data-kop-naskah-dinas="true"
      data-kop-border-distance="4.5cm"
      className={`kop-surat-unsil mb-[1.25em] pb-0 text-black ${compact ? 'scale-95 origin-top' : ''}`}
    >
      <div className="relative flex items-center justify-between min-h-[85px] sm:min-h-[96px]">
        {/* Logo UNSIL Resmi - di sisi kiri */}
        <div className="w-20 shrink-0 flex items-center justify-start select-none protected-asset">
          <img
            src="/unsil-logo.png"
            alt="Logo Resmi Universitas Siliwangi"
            className="w-16 h-16 sm:w-20 sm:h-20 max-w-[80px] max-h-[80px] object-contain select-none pointer-events-none protected-asset"
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        {/* Header Teks TERPUSAT (Simetris) Sesuai Gambar Spesimen & Peraturan Rektor UNSIL No. 3/2023 */}
        <div className="flex-1 text-center font-serif px-2">
          {/* Baris 1: Kementerian - 2 baris seimbang */}
          <p className="kop-baris-kementerian uppercase whitespace-nowrap">
            {baris1}
            {baris2 && (
              <>
                <br />
                <span className="whitespace-nowrap">{baris2}</span>
              </>
            )}
          </p>
          
          {/* Baris 2: Universitas / Unit Kerja - Times New Roman 14pt Bold */}
          <h2 className="kop-baris-universitas uppercase whitespace-nowrap">
            {kopConfig.universitasText}
          </h2>

          {/* Baris 3: Nama Unit Kerja (untuk tingkat unit kerja) - Times New Roman 14pt Bold */}
          {shouldShowUnit && (
            <h1 className="kop-baris-unit uppercase whitespace-nowrap">
              {kopConfig.namaUnitBarisTiga}
            </h1>
          )}

          {/* Baris Alamat & Kontak: Times New Roman 12pt */}
          <p className="kop-baris-alamat whitespace-nowrap">
            {kopConfig.alamatText}
          </p>
          <p className="kop-baris-alamat whitespace-nowrap">
            {kopConfig.kontakText}
          </p>
          <p className="kop-baris-laman whitespace-nowrap">
            {kopConfig.webText}
          </p>
        </div>

        {/* Spacer kanan selebar logo agar teks berada 100% tepat di tengah kertas (simetris sempurna) */}
        <div className="w-20 shrink-0 pointer-events-none" aria-hidden="true" />
      </div>

      {/* Garis Pembatas Tebal Tunggal Kop Resmi (Pasal 30 ayat 7 & Pasal 31 ayat 8, Berjarak 4,5 cm dari tepi atas kertas) */}
      <div className="mt-2">
        <div className="border-b-[2.5px] border-black w-full" />
      </div>
    </div>
  );
};

/**
 * Komponen Blok Tanda Tangan Kedinasan Resmi Sesuai Format Spesimen UNSIL
 * Menggantikan badge modern SaaS dengan format cetak kedinasan yang otentik.
 */
export const OfficialSignatureBlock = ({
  tempatTanggal = null,
  namaJabatan = 'REKTOR,',
  namaPejabat = '',
  nip = '',
  tteVerified = false,
  keterangan = 'tanda tangan dan cap dinas',
  showUnderline = false,
  align = 'right',
  widthClass = 'w-72 sm:w-80'
}) => {
  return (
    <div
      className={`font-serif text-black text-xs leading-normal ${widthClass} ${
        align === 'center' ? 'text-center mx-auto' : align === 'left' ? 'text-left' : 'text-left ml-auto'
      }`}
    >
      {tempatTanggal && <p className="text-[11px] mb-0.5">{tempatTanggal}</p>}
      <p className="font-bold uppercase tracking-wider text-black">{namaJabatan}</p>

      {/* Ruang tanda tangan / cap dinas / TTE */}
      <div className="my-2 min-h-[48px] flex flex-col justify-center">
        {tteVerified ? (
          <div className="py-1 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
            <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
            <p className="font-bold uppercase tracking-wide mt-0.5">{namaPejabat}</p>
            <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
          </div>
        ) : (
          <div className="h-12 flex items-center justify-center text-black/60 italic text-[11px] font-serif">
            {keterangan}
          </div>
        )}
      </div>

      <p className={`font-bold uppercase tracking-wide text-black ${showUnderline ? 'underline' : ''}`}>
        {namaPejabat}
      </p>
      {nip && <p className="text-[10.5px] font-mono text-black mt-0.5">NIP {nip}</p>}
    </div>
  );
};

/**
 * Komponen Nomor Halaman Naskah Dinas Resmi (Pasal 46 / Bab II):
 * - Ditulis dengan angka Arab simetris di tengah atas kertas menggunakan tanda hubung, contoh: "- 2 -"
 * - Halaman pertama yang menggunakan Kop Surat tidak diberi nomor halaman.
 */
export const NomorHalamanNaskahDinas = ({ pageNumber = 2 }) => (
  <div data-nomor-halaman="true" className="nomor-halaman-resmi text-center text-black select-none">
    - {pageNumber} -
  </div>
);

/**
 * Komponen Kata Penyambung Halaman Naskah Dinas Resmi (Bab II):
 * - Jika naskah lebih dari satu halaman, kata pertama di halaman berikutnya dituliskan
 *   di sudut kanan bawah halaman sebelumnya diikuti 3 titik (contoh: "Peserta...")
 */
export const KataPenyambungNaskahDinas = ({ word = 'Peserta' }) => {
  const cleanWord = String(word || 'Peserta').replace(/\.+$/, '');
  return (
    <div data-kata-penyambung="true" className="kata-penyambung-resmi text-right text-black select-none">
      {cleanWord}...
    </div>
  );
};

/**
 * 1. FORMAT PROSEDUR OPERASIONAL STANDAR (POS / SOP)
 * Berdasarkan Gambar 1 (Bagian Identitas) & Gambar 2 (Bagian Diagram Alir / Flowchart)
 * Kategori: Naskah Dinas Arahan (F4 210x330mm • Bookman Old Style 12pt)
 */
export const PosTemplateView = ({ data }) => {
  const {
    unitKerja = 'Biro Keuangan dan Umum (BKU)',
    nomorPos = 'POS/UN58/BKU/KU/01/2026',
    tglPembuatan = '08 September 2026',
    tglRevisi = '08 September 2026',
    tglEfektif = '15 September 2026',
    disahkanOlehJabatan = 'Kepala Biro Keuangan dan Umum',
    disahkanOlehNama = 'Dr. Nana Sujana, Drs., M.Si.',
    disahkanOlehNip = '196808301989031004',
    namaPos = 'PROSEDUR OPERASIONAL STANDAR PENERBITAN SPJ DAN SURAT PERTANGGUNGJAWABAN KEUANGAN BKU',
    dasarHukum = [
      'Undang-Undang Nomor 17 Tahun 2003 tentang Keuangan Negara',
      'Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 24 Tahun 2024 tentang Statuta Universitas Siliwangi',
      'Peraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023 tentang Tata Naskah Dinas di Lingkungan Universitas Siliwangi'
    ],
    kualifikasiPelaksana = [
      'Pendidikan minimal D3 / S1 Akuntansi atau Manajemen Keuangan',
      'Memahami regulasi perpajakan dan aplikasi SILOKA BKU UNSIL'
    ],
    keterkaitan = [
      'POS Pengajuan Anggaran Belanja Operasional BMN',
      'POS Penerbitan Surat Perintah Membayar (SPM)'
    ],
    peralatan = [
      'Aplikasi SILOKA Intranet Kampus UNSIL',
      'Komputer & Jaringan Terenkripsi',
      'Sertifikat Elektronik TTE BSrE'
    ],
    peringatan = [
      'Apabila SPJ tidak dilengkapi bukti sah dalam waktu 3 hari kerja, pengajuan ditunda',
      'Penyalahgunaan naskah keuangan diproses sesuai peraturan perundang-undangan'
    ],
    pencatatan = 'Dicatat dan didata dalam berkas kearsipan Subbag Keuangan secara elektronik dan/atau manual sesuai kaidah retensi ANRI.',
    flowchartSteps = [
      {
        no: 1,
        kegiatan: 'Staf Unit Pengusul menginput berkas pertanggungjawaban melalui modul SILOKA',
        pelaksana: ['✓', '', ''],
        kelengkapan: 'Bukti kuitansi fisik & e-Kuitansi',
        waktu: '30 Menit',
        output: 'Draf Registrasi SPJ',
        ket: 'Sistem Siloka'
      },
      {
        no: 2,
        kegiatan: 'Koordinator Keuangan memverifikasi kelengkapan bukti dan kepatuhan anggaran',
        pelaksana: ['', '✓', ''],
        kelengkapan: 'Draf SPJ & Lembar Verifikasi',
        waktu: '1 Jam',
        output: 'Paraf E-Paraf Berjenjang',
        ket: 'Validasi Akuntansi'
      },
      {
        no: 3,
        kegiatan: 'Kepala Biro BKU menelaah, menyetujui, dan menandatangani dokumen via TTE BSrE',
        pelaksana: ['', '', '✓'],
        kelengkapan: 'Naskah SPJ yang telah diparaf',
        waktu: '30 Menit',
        output: 'Naskah Sah TTE BSrE',
        ket: 'Finalisasi Berkas'
      }
    ]
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="false"
      data-naskah-category="ARAHAN"
      className="a4-sheet f4-sheet naskah-arahan pasal47-without-kop bg-white text-black font-serif p-6 sm:p-8 max-w-4xl mx-auto border border-black rounded-none shadow-none text-xs leading-relaxed print:shadow-none print:border-none"
    >
      <div className="naskah-judul-block mb-6">
        <h2 className="text-center font-bold text-sm sm:text-base uppercase tracking-wider text-black mb-1">
          FORMAT PROSEDUR OPERASIONAL STANDAR (POS)
        </h2>
      </div>

      {/* Bagian a. Bagian Identitas (Sesuai Gambar 1) */}
      <div className="mb-6">
        <p className="font-bold text-xs uppercase mb-1.5 text-black">a. Bagian Identitas</p>
        
        <table className="w-full border-collapse border-2 border-black text-[11px] leading-tight">
          <tbody>
            {/* Header Box */}
            <tr className="border-b-2 border-black">
              {/* Kolom Kiri: Logo + Unit Kerja */}
              <td className="w-1/2 p-4 text-center border-r-2 border-black align-middle">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 select-none protected-asset mb-2">
                    <img
                      src="/unsil-logo.png"
                      alt="Logo Resmi Universitas Siliwangi"
                      className="w-16 h-16 object-contain select-none pointer-events-none"
                      draggable="false"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  </div>
                  <span className="font-serif font-bold text-xs tracking-wider uppercase block text-black">
                    UNIVERSITAS SILIWANGI
                  </span>
                  <span className="font-serif font-semibold text-[11px] tracking-wide uppercase block text-black mt-0.5">
                    {unitKerja}
                  </span>
                </div>
              </td>

              {/* Kolom Kanan: Nomor POS & Pengesahan */}
              <td className="w-1/2 p-0 align-top">
                <table className="w-full border-collapse text-[11px]">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="p-1.5 w-32 font-semibold border-r border-black">Nomor POS</td>
                      <td className="p-1.5 font-mono font-bold text-black">: {nomorPos}</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-1.5 font-semibold border-r border-black">Tgl Pembuatan</td>
                      <td className="p-1.5">: {tglPembuatan}</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-1.5 font-semibold border-r border-black">Tgl Revisi</td>
                      <td className="p-1.5">: {tglRevisi}</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-1.5 font-semibold border-r border-black">Tgl Efektif</td>
                      <td className="p-1.5">: {tglEfektif}</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-1.5 font-semibold border-r border-black align-top">Disahkan oleh</td>
                      <td className="p-1.5">
                        <p className="font-semibold">{disahkanOlehJabatan}</p>
                        <div className="my-1.5 h-10 flex items-center justify-center text-black/60 italic text-[10px] font-serif">
                          (tanda tangan)
                        </div>
                        <p className="font-bold underline text-black mt-0.5">{disahkanOlehNama}</p>
                        <p className="text-[10px] text-black font-serif">NIP. {disahkanOlehNip}</p>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-semibold border-r border-black">Nama POS</td>
                      <td className="p-1.5 font-bold uppercase text-black">: {namaPos}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* Baris Dasar Hukum vs Kualifikasi */}
            <tr className="border-b border-black">
              <td className="p-3 border-r-2 border-black align-top">
                <p className="font-bold underline mb-1">Dasar Hukum:</p>
                <ol className="list-decimal list-inside space-y-1 text-black">
                  {Array.isArray(dasarHukum) ? dasarHukum.map((d, i) => (
                    <li key={i} className="pl-1">{d}</li>
                  )) : <li>{dasarHukum}</li>}
                </ol>
              </td>
              <td className="p-3 align-top">
                <p className="font-bold underline mb-1">Kualifikasi Pelaksana:</p>
                <ol className="list-decimal list-inside space-y-1 text-black">
                  {Array.isArray(kualifikasiPelaksana) ? kualifikasiPelaksana.map((k, i) => (
                    <li key={i} className="pl-1">{k}</li>
                  )) : <li>{kualifikasiPelaksana}</li>}
                </ol>
              </td>
            </tr>

            {/* Baris Keterkaitan vs Peralatan */}
            <tr className="border-b border-black">
              <td className="p-3 border-r-2 border-black align-top">
                <p className="font-bold underline mb-1">Keterkaitan:</p>
                <ul className="list-disc list-inside space-y-1 text-black">
                  {Array.isArray(keterkaitan) ? keterkaitan.map((k, i) => (
                    <li key={i} className="pl-1">{k}</li>
                  )) : <li>{keterkaitan}</li>}
                </ul>
              </td>
              <td className="p-3 align-top">
                <p className="font-bold underline mb-1">Peralatan/Perlengkapan:</p>
                <ol className="list-decimal list-inside space-y-1 text-black">
                  {Array.isArray(peralatan) ? peralatan.map((p, i) => (
                    <li key={i} className="pl-1">{p}</li>
                  )) : <li>{peralatan}</li>}
                </ol>
              </td>
            </tr>

            {/* Baris Peringatan vs Pencatatan */}
            <tr>
              <td className="p-3 border-r-2 border-black align-top">
                <p className="font-bold underline mb-1">Peringatan:</p>
                <ol className="list-decimal list-inside space-y-1 text-black">
                  {Array.isArray(peringatan) ? peringatan.map((pr, i) => (
                    <li key={i} className="pl-1">{pr}</li>
                  )) : <li>{peringatan}</li>}
                </ol>
              </td>
              <td className="p-3 align-top">
                <p className="font-bold underline mb-1">Pencatatan dan Pendaftaran:</p>
                <p className="text-black leading-normal">{pencatatan}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bagian b. Bagian Diagram Alir (Flowchart) (Sesuai Gambar 2) */}
      <div className="mt-8">
        <p className="font-bold text-xs uppercase mb-1.5 text-black">b. Bagian Diagram Alir (flowchart)</p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black text-[11px] text-center">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black font-bold text-black">
                <th rowSpan="2" className="border-r border-black p-2 w-10">No</th>
                <th rowSpan="2" className="border-r border-black p-2 w-64 text-left">Langkah Kegiatan</th>
                <th colSpan="3" className="border-r border-black p-1.5">Pelaksana</th>
                <th colSpan="3" className="border-r border-black p-1.5">Mutu Baku</th>
                <th rowSpan="2" className="p-2 w-20">Ket.</th>
              </tr>
              <tr className="bg-gray-50 border-b border-black font-semibold text-[10px] text-black">
                <th className="border-r border-black p-1 w-14">Staf TU</th>
                <th className="border-r border-black p-1 w-14">Kasubbag</th>
                <th className="border-r border-black p-1 w-14">Kabiro</th>
                <th className="border-r border-black p-1 w-24">Kelengkapan</th>
                <th className="border-r border-black p-1 w-16">Waktu</th>
                <th className="border-r border-black p-1 w-24">Output</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black text-black">
              {flowchartSteps.map((step, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="border-r border-black p-2 font-bold">{step.no || idx + 1}</td>
                  <td className="border-r border-black p-2 text-left font-medium leading-tight">{step.kegiatan}</td>
                  <td className="border-r border-black p-1 font-bold text-sm">{step.pelaksana?.[0] || '-'}</td>
                  <td className="border-r border-black p-1 font-bold text-sm">{step.pelaksana?.[1] || '-'}</td>
                  <td className="border-r border-black p-1 font-bold text-sm">{step.pelaksana?.[2] || '-'}</td>
                  <td className="border-r border-black p-2 text-left text-[10px]">{step.kelengkapan}</td>
                  <td className="border-r border-black p-1 font-mono text-[10px]">{step.waktu}</td>
                  <td className="border-r border-black p-2 text-left text-[10px] font-semibold text-black">{step.output}</td>
                  <td className="p-1 text-[10px] text-black/70">{step.ket || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * 2. FORMAT SURAT EDARAN
 * Berdasarkan Gambar 3
 */
export const SuratEdaranTemplateView = ({ data }) => {
  const {
    nomorSurat = '04/UN58/SE/2026',
    tahun = new Date().getFullYear(),
    tentang = 'PENGELOLAAN ADMINISTRASI SURAT DINAS ELEKTRONIK DAN PENERAPAN TTE BSrE DI LINGKUNGAN UNIVERSITAS SILIWANGI',
    tujuanList = [
      'Para Dekan Fakultas di lingkungan Universitas Siliwangi',
      'Direktur Pascasarjana Universitas Siliwangi',
      'Kepala Biro, Ketua Lembaga, dan Kepala UPT',
      'Koordinator dan Subkoordinator di Lingkungan BKU'
    ],
    dasarHukum = 'Berdasarkan Peraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023 tentang Tata Naskah Dinas di Lingkungan Universitas Siliwangi serta percepatan transformasi birokrasi digital kampus, dengan ini kami sampaikan ketentuan teknis persuratan dinas sebagai berikut:',
    isiSurat = [
      '1. Seluruh persuratan kedinasan, lembar disposisi, dan pertanggungjawaban anggaran wajib dicatat secara terpusat melalui Sistem Informasi SILOKA BKU UNSIL.',
      '2. Mulai tanggal 1 Oktober 2026, dokumen dinas resmi diterbitkan menggunakan Tanda Tangan Elektronik (TTE) tersertifikasi BSrE BSSN dan tidak lagi menggunakan cap basah stempel fisik.',
      '3. Pengarsipan surat dinas wajib mengikuti Jadwal Retensi Arsip (JRA) yang berlaku demi mencegah penumpukan arsip inaktif kedaluwarsa.',
      '4. Surat Edaran ini berlaku sejak tanggal ditetapkan untuk dipedomani dan dilaksanakan dengan penuh tanggung jawab.'
    ],
    tempatTanggal = 'Tasikmalaya, 8 September 2026',
    namaJabatan = 'Kepala Biro Umum dan Keuangan,',
    namaPejabat = 'Dr. Nana Sujana, Drs., M.Si.',
    nip = '196808301989031004',
    tteVerified = true
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      data-naskah-category="ARAHAN"
      className="a4-sheet f4-sheet naskah-arahan pasal47-with-kop bg-white text-black font-serif p-8 sm:p-12 max-w-3xl mx-auto border border-black rounded-none shadow-none text-xs leading-relaxed print:shadow-none print:border-none"
    >
      {/* Kop Surat Resmi */}
      <KopSuratUnsil unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id} />

      {/* Judul Surat Edaran (Jarak antarbaris judul 1 spasi, jarak antara judul dan isi 2 spasi) */}
      <div className="naskah-judul-block text-center my-6">
        <h2 className="text-sm sm:text-base font-bold tracking-widest uppercase text-black">
          SURAT EDARAN
        </h2>
        <p className="text-xs font-bold tracking-wider text-black mt-1">
          NOMOR {nomorSurat} TAHUN {tahun}
        </p>
        <p className="font-bold text-xs uppercase tracking-wider text-black mt-1">
          TENTANG
        </p>
        <p className="font-bold text-xs uppercase tracking-normal text-black max-w-xl mx-auto mt-1 leading-tight">
          {tentang}
        </p>
      </div>

      {/* Yth. (Tujuan) */}
      <div className="mb-6 font-serif text-xs">
        <p className="font-semibold text-black mb-1">Yth.</p>
        <ol className="list-decimal list-inside space-y-0.5 text-black pl-1">
          {tujuanList.map((t, idx) => (
            <li key={idx}>{t};</li>
          ))}
        </ol>
      </div>

      {/* Dasar Hukum Pembuatan Surat Edaran */}
      <div className="mb-4 text-justify font-serif text-xs leading-normal">
        <p>{dasarHukum}</p>
      </div>

      {/* Isi Surat Edaran */}
      <div className="space-y-2 text-justify font-serif text-xs leading-normal mb-8">
        {Array.isArray(isiSurat) ? isiSurat.map((paragraf, idx) => (
          <p key={idx}>{paragraf}</p>
        )) : <p>{isiSurat}</p>}
      </div>

      {/* Penutup & Tanda Tangan */}
      <div className="flex justify-end mt-5 font-serif">
        <OfficialSignatureBlock
          tempatTanggal={tempatTanggal}
          namaJabatan={namaJabatan}
          namaPejabat={namaPejabat}
          nip={nip}
          tteVerified={tteVerified}
          keterangan="tanda tangan dan cap dinas"
        />
      </div>
    </div>
  );
};

/**
 * 3. FORMAT KEPUTUSAN DAN LAMPIRAN
 * Berdasarkan Gambar 4 (Format Keputusan) & Gambar 5 (Lampiran Keputusan Rektor)
 */
export const KeputusanTemplateView = ({ data }) => {
  const {
    nomorSk = '012/UN58/KU/2026',
    tahun = new Date().getFullYear(),
    tentang = 'PENETAPAN TIM KERJA REFORMASI BIROKRASI DAN TATA KELOLA KEARSIPAN DIGITAL BIRO PERENCANAAN, KEUANGAN, DAN UMUM UNIVERSITAS SILIWANGI',
    pejabatPenetap = 'REKTOR UNIVERSITAS SILIWANGI,',
    menimbang = [
      'bahwa dalam rangka mewujudkan akuntabilitas pengelolaan kearsipan dan percepatan naskah dinas elektronik di lingkungan Universitas Siliwangi, dipandang perlu membentuk Tim Kerja Khusus;',
      'bahwa mereka yang namanya tercantum dalam Lampiran Keputusan ini dipandang cakap dan memenuhi syarat untuk diangkat dalam tim kerja dimaksud;',
      'bahwa berdasarkan pertimbangan sebagaimana dimaksud dalam huruf a dan b, perlu menetapkan Keputusan Rektor Universitas Siliwangi.'
    ],
    mengingat = [
      'Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;',
      'Undang-Undang Nomor 43 Tahun 2009 tentang Kearsipan;',
      'Peraturan Pemerintah Nomor 4 Tahun 2014 tentang Penyelenggaraan Pendidikan Tinggi dan Pengelolaan Perguruan Tinggi;',
      'Peraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023 tentang Tata Naskah Dinas di Lingkungan Universitas Siliwangi.'
    ],
    menetapkan = 'KEPUTUSAN REKTOR UNIVERSITAS SILIWANGI TENTANG PENETAPAN TIM KERJA REFORMASI BIROKRASI DAN TATA KELOLA KEARSIPAN DIGITAL BKU.',
    diktum = [
      { poin: 'KESATU', teks: 'Membentuk Tim Kerja Reformasi Birokrasi dan Tata Kelola Kearsipan Digital Biro Keuangan dan Umum Universitas Siliwangi dengan susunan personalia sebagaimana tercantum dalam Lampiran Keputusan ini.' },
      { poin: 'KEDUA', teks: 'Tim Kerja sebagaimana dimaksud pada Diktum KESATU bertugas menyusun SOP, memantau siklus hidup retensi arsip, dan mengawal penerapan TTE BSrE.' },
      { poin: 'KETIGA', teks: 'Segala biaya yang timbul sebagai akibat ditetapkannya Keputusan ini dibebankan pada Daftar Isian Pelaksanaan Anggaran (DIPA) Universitas Siliwangi.' },
      { poin: 'KEEMPAT', teks: 'Keputusan Rektor ini mulai berlaku pada tanggal ditetapkan.' }
    ],
    tempatTanggal = 'Ditetapkan di Tasikmalaya pada tanggal 8 September 2026',
    namaJabatan = 'REKTOR,',
    namaRektor = 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nipRektor = '196708161996031001',
    tteVerified = true,
    hasLampiran = false,
    lampiranRows = [
      { no: 1, nama: 'Dr. Nana Sujana, Drs., M.Si.', nip: '196808301989031004', jabatan: 'Kepala Biro Umum dan Keuangan', peranTim: 'Penanggung Jawab Tim' },
      { no: 2, nama: 'Budi Santoso, S.E., M.Ak.', nip: '198203202008121002', jabatan: 'Koordinator Keuangan & BMN', peranTim: 'Ketua Pelaksana' },
      { no: 3, nama: 'Siti Rohmah, S.AP.', nip: '198809152014042001', jabatan: 'Staf Administrasi & Kearsipan', peranTim: 'Sekretaris & Administrator SILOKA' },
      { no: 4, nama: 'Hendra Pratama, S.E., Ak., C.A.', nip: '198007112005011002', jabatan: 'Auditor SPI', peranTim: 'Pengawas Internal' }
    ]
  } = data || {};

  return (
    <div className="space-y-12 max-w-3xl mx-auto">
      {/* LEMBAR UTAMA KEPUTUSAN (Sesuai Gambar 4 - Naskah Dinas Arahan: F4 & Bookman Old Style 12pt) */}
      <div
        data-pasal47="true"
        data-has-kop="true"
        data-naskah-category="ARAHAN"
        className="a4-sheet f4-sheet naskah-arahan pasal47-with-kop bg-white text-black font-serif p-8 sm:p-12 border border-black rounded-none shadow-none text-xs leading-relaxed print:shadow-none print:border-none"
      >
        {/* Visual Divider for Screen Preview */}
        <div className="print:hidden mb-4 pb-1 border-b border-black/20 flex items-center justify-between text-[11px] text-black font-sans">
          <span className="font-semibold text-black">Lembar 1: Naskah Utama Keputusan Rektor</span>
          <span className="font-mono text-[10px] text-black">Halaman 1 {hasLampiran ? '/ 2 (Tanpa Nomor Halaman karena Berkop)' : ''}</span>
        </div>

        {/* Kop Surat */}
        <KopSuratUnsil unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id} />

        {/* Judul Keputusan (Jarak antarbaris judul 1 spasi, jarak antara judul dan isi 2 spasi) */}
        <div className="naskah-judul-block text-center my-3">
          <p className="font-bold text-xs tracking-wider uppercase text-black">
            KEPUTUSAN REKTOR UNIVERSITAS SILIWANGI
          </p>
          <p className="text-xs font-bold tracking-wide text-black mt-0.5">
            NOMOR {nomorSk}
          </p>
          <p className="font-bold text-[11px] uppercase tracking-wider text-black mt-1">
            TENTANG
          </p>
          <p className="font-bold text-xs uppercase tracking-normal text-black max-w-lg mx-auto mt-0.5 leading-tight">
            {tentang}
          </p>
          <p className="font-bold text-xs uppercase tracking-wider text-black mt-2">
            {pejabatPenetap}
          </p>
        </div>

        {/* Konsideran Menimbang & Mengingat */}
        <div className="space-y-2 font-serif text-[11px] leading-snug text-justify mb-3 text-black">
          <div className="flex items-start gap-3">
            <span className="w-20 shrink-0 font-bold">Menimbang :</span>
            <div className="flex-1 space-y-1">
              {menimbang.map((m, idx) => {
                const huruf = String.fromCharCode(97 + idx); // a, b, c...
                return (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="w-3.5 shrink-0">{huruf}.</span>
                    <span className="flex-1">{m}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-start gap-3 pt-1">
            <span className="w-20 shrink-0 font-bold">Mengingat :</span>
            <div className="flex-1 space-y-1">
              {mengingat.map((mg, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="w-3.5 shrink-0">{idx + 1}.</span>
                  <span className="flex-1">{mg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Diktum Memutuskan */}
        <div className="text-center my-2">
          <p className="font-bold text-xs uppercase tracking-widest text-black">
            MEMUTUSKAN:
          </p>
        </div>

        <div className="space-y-1.5 font-serif text-[11px] leading-snug text-justify mb-4 text-black">
          <div className="flex items-start gap-3">
            <span className="w-20 shrink-0 font-bold">Menetapkan :</span>
            <p className="flex-1 font-bold uppercase text-black">{menetapkan}</p>
          </div>

          {diktum.map((d, idx) => (
            <div key={idx} className="flex items-start gap-3 pt-0.5">
              <span className="w-20 shrink-0 font-bold">{d.poin} :</span>
              <p className="flex-1">{d.teks}</p>
            </div>
          ))}
        </div>

        {/* Pengesahan Rektor */}
        <div className="flex justify-end mt-4 font-serif">
          <OfficialSignatureBlock
            tempatTanggal={tempatTanggal}
            namaJabatan={namaJabatan}
            namaPejabat={namaRektor}
            nip={nipRektor}
            tteVerified={tteVerified}
            keterangan="tanda tangan"
          />
        </div>

        {/* Kata Penyambung ke Halaman Berikutnya (Sudut Kanan Bawah diikuti 3 titik) */}
        {hasLampiran && <KataPenyambungNaskahDinas word="LAMPIRAN" />}
      </div>

      {/* LEMBAR LAMPIRAN KEPUTUSAN REKTOR (Sesuai Gambar 5 - Tanpa Kepala Naskah Dinas / Pasal 47: Tepi Atas >= 2 cm & Nomor Halaman - 2 -) */}
      {hasLampiran && (
        <div
          data-pasal47="true"
          data-has-kop="false"
          data-naskah-category="ARAHAN"
          className="a4-sheet f4-sheet naskah-arahan pasal47-without-kop page-break break-before-page bg-white text-black font-serif p-8 sm:p-12 border border-black rounded-none shadow-none text-xs leading-relaxed print:shadow-none print:border-none print:mt-0"
        >
          {/* Nomor Halaman Simetris di Tengah Atas Kertas (- 2 -) */}
          <NomorHalamanNaskahDinas pageNumber={2} />

          {/* Visual Divider for Screen Preview */}
          <div className="print:hidden mb-4 pb-1 border-b border-black/20 flex items-center justify-between text-[11px] text-black font-sans">
            <span className="font-semibold text-black">Lembar 2: Lampiran Keputusan Rektor</span>
            <span className="font-mono text-[10px] text-black">Halaman 2 / 2</span>
          </div>

          {/* Header Lampiran Kanan Atas */}
          <div className="flex justify-end mb-4 font-serif text-black">
            <div className="w-72 text-left leading-tight text-[10.5px]">
              <p className="font-bold uppercase tracking-wider text-black">LAMPIRAN</p>
              <p className="font-bold uppercase tracking-wider text-black">KEPUTUSAN REKTOR UNIVERSITAS SILIWANGI</p>
              <p className="font-mono text-black mt-0.5">NOMOR : {nomorSk}</p>
              <p className="text-black">TANGGAL : 8 September 2026</p>
              <p className="font-bold text-black uppercase mt-0.5">TENTANG :</p>
              <p className="text-black uppercase font-medium">{tentang}</p>
            </div>
          </div>

          <div className="text-center mb-3">
            <h3 className="font-bold uppercase text-xs tracking-wider text-black">
              SUSUNAN TIM KERJA DAN DISTRIBUSI PERAN
            </h3>
          </div>

          {/* Tabel Lampiran Resmi Bergaris Tegas */}
          <div className="overflow-x-auto mb-5 font-serif text-black">
            <table className="w-full border-collapse border-2 border-black text-[10.5px]">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-black font-bold text-black text-center">
                  <th className="border-r border-black p-2 w-10">No</th>
                  <th className="border-r border-black p-2 text-left">Nama & NIP Pegawai</th>
                  <th className="border-r border-black p-2 text-left">Jabatan Kedinasan</th>
                  <th className="p-2 text-left">Peran dalam Tim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black text-black">
                {lampiranRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="border-r border-black p-1.5 text-center font-bold">{row.no || idx + 1}</td>
                    <td className="border-r border-black p-1.5">
                      <p className="font-bold text-black">{row.nama}</p>
                      <p className="text-[9.5px] text-black font-serif">NIP. {row.nip}</p>
                    </td>
                    <td className="border-r border-black p-1.5">{row.jabatan}</td>
                    <td className="p-1.5 font-semibold text-black">{row.peranTim}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pengesahan Lampiran oleh Rektor */}
          <div className="flex justify-end mt-8 font-serif">
            <OfficialSignatureBlock
              tempatTanggal="Ditetapkan di Tasikmalaya"
              namaJabatan="REKTOR,"
              namaPejabat={namaRektor}
              nip={nipRektor}
              tteVerified={tteVerified}
              keterangan="tanda tangan"
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 4. FORMAT SURAT PERINTAH (SP)
 * Sesuai Gambar 1: Surat Perintah Rektor Universitas Siliwangi
 */
export const SuratPerintahTemplateView = ({ data }) => {
  const {
    nomorSurat = '028/UN58/KP.08.00/2026',
    pejabatPemberi = 'REKTOR UNIVERSITAS SILIWANGI,',
    menimbang = [
      'bahwa dalam rangka menjamin kelancaran pelaksanaan penatausahaan anggaran dan akuntabilitas keuangan BLU Universitas Siliwangi, dipandang perlu menerbitkan surat perintah ini;',
      'bahwa pegawai yang namanya tercantum di bawah ini dipandang cakap dan memenuhi syarat untuk melaksanakan perintah tersebut.'
    ],
    dasar = [
      'Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;',
      'Peraturan Pemerintah Nomor 4 Tahun 2014 tentang Penyelenggaraan Pendidikan Tinggi;',
      'Peraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023 tentang Tata Naskah Dinas di Lingkungan Universitas Siliwangi.'
    ],
    kepada = [
      'Dr. Nana Sujana, Drs., M.Si. / NIP. 196808301989031004 / Kepala Biro Umum dan Keuangan;'
    ],
    untuk = [
      'Melaksanakan verifikasi lapangan, penataan rekonsiliasi kas, dan percepatan dokumen pertanggungjawaban keuangan;',
      'Melakukan koordinasi dengan Satuan Pengawas Internal (SPI) dan instansi pembina keuangan negara;',
      'Melaporkan hasil pelaksanaan perintah kedinasan kepada Rektor secara tertulis dan berkala.'
    ],
    tempatTanggal = 'Tasikmalaya, 8 September 2026',
    namaJabatan = 'Rektor,',
    namaPejabat = 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nip = '196708161996031001',
    tteVerified = true
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      data-naskah-category="ARAHAN"
      className="a4-sheet f4-sheet naskah-arahan pasal47-with-kop bg-white text-black font-serif p-8 sm:p-12 max-w-3xl mx-auto border border-black rounded-none shadow-none text-xs leading-relaxed print:shadow-none print:border-none"
    >
      {/* Kop Surat Resmi */}
      <KopSuratUnsil unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id} />

      {/* Judul Surat Perintah (Pasal 46: 1 spasi antarbaris judul, 2 spasi ke isi) */}
      <div className="naskah-judul-block text-center my-3">
        <h2 className="text-sm sm:text-base font-bold tracking-widest uppercase text-black">
          SURAT PERINTAH
        </h2>
        <p className="font-mono text-xs font-bold tracking-wider text-black mt-0.5">
          NOMOR {nomorSurat}
        </p>
        <p className="font-bold text-xs uppercase tracking-wider text-black mt-3">
          {pejabatPemberi}
        </p>
      </div>

      {/* Menimbang & Dasar */}
      <div className="space-y-2.5 font-serif text-[11px] leading-snug text-justify mb-4 text-black">
        <div className="flex items-start gap-3">
          <span className="w-24 shrink-0 font-bold">Menimbang :</span>
          <div className="flex-1 space-y-1">
            {menimbang.map((m, idx) => {
              const huruf = String.fromCharCode(97 + idx);
              return (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="w-3.5 shrink-0">{huruf}.</span>
                  <span className="flex-1">{m}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-start gap-3 pt-1">
          <span className="w-24 shrink-0 font-bold">Dasar :</span>
          <div className="flex-1 space-y-1">
            {dasar.map((d, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <span className="w-3.5 shrink-0">{idx + 1}.</span>
                <span className="flex-1">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center Header: MEMBERI PERINTAH */}
      <div className="text-center my-3">
        <p className="font-bold text-xs uppercase tracking-widest text-black">
          MEMBERI PERINTAH
        </p>
      </div>

      {/* Kepada & Untuk */}
      <div className="space-y-2.5 font-serif text-[11px] leading-snug text-justify mb-6 text-black">
        <div className="flex items-start gap-3">
          <span className="w-24 shrink-0 font-bold">Kepada :</span>
          <div className="flex-1 space-y-1">
            {kepada.map((k, idx) => (
              <p key={idx} className="font-medium text-black">{k}</p>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 pt-1">
          <span className="w-24 shrink-0 font-bold">Untuk :</span>
          <div className="flex-1 space-y-1">
            {untuk.map((u, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <span className="w-3.5 shrink-0">{idx + 1}.</span>
                <span className="flex-1">{u}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Blok Pengesahan Kanan Bawah */}
      <div className="flex justify-end mt-5 sm:mt-6 font-serif">
        <OfficialSignatureBlock
          tempatTanggal={tempatTanggal}
          namaJabatan={namaJabatan}
          namaPejabat={namaPejabat}
          nip={nip}
          tteVerified={tteVerified}
          keterangan="tanda tangan dan cap dinas"
        />
      </div>
    </div>
  );
};

/**
 * 5. FORMAT SURAT TUGAS - BENTUK LEMBARAN (ST-LEMBAR)
 * Sesuai Gambar 2: Surat Tugas Individu / Isian Lembaran
 */
export const SuratTugasLembaranTemplateView = ({ data }) => {
  const {
    nomorSurat = '044/UN58/ST/KP.03.00/2026',
    kalimatPembuka = 'Rektor Universitas Siliwangi dengan ini menugaskan kepada pejabat/pegawai:',
    nama = 'Dr. Nana Sujana, Drs., M.Si.',
    nip = '196808301989031004',
    pangkatGolongan = 'Pembina Utama Muda, IV/c',
    jabatan = 'Kepala Biro Umum dan Keuangan',
    untukTugas = 'menghadiri Rapat Koordinasi Nasional Tata Kelola Keuangan dan Kearsipan Perguruan Tinggi Negeri',
    tanggalKegiatan = '15 s.d. 17 September 2026',
    tempatKegiatan = 'Hotel Grand Mercure, Jakarta Pusat',
    kalimatPenutup = 'Surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan membuat laporan.',
    tempatTanggal = 'Tasikmalaya, 8 September 2026',
    namaJabatan = 'Rektor,',
    namaPejabat = 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nipPejabat = '196708161996031001',
    tteVerified = true
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      className="a4-sheet pasal47-with-kop bg-white text-black font-serif p-8 sm:p-12 max-w-3xl mx-auto border border-black rounded-none shadow-none text-xs leading-relaxed print:shadow-none print:border-none"
    >
      <KopSuratUnsil
        unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id}
        hideUnit={true}
        forceUniversityHeader={true}
      />

      {/* Judul Surat Tugas (Sesuai Spesimen Resmi Gambar 2 / Image 1) */}
      <div className="naskah-judul-block text-center my-4 font-serif text-black">
        <h2 className="text-sm sm:text-base font-normal tracking-wider uppercase text-black">
          SURAT TUGAS
        </h2>
        <p className="font-serif text-[11px] text-black mt-0.5">
          Nomor {nomorSurat || '......./......../......../.......'}
        </p>
      </div>

      {/* Kalimat Pembuka */}
      <div className="my-4 text-justify font-serif text-[11.5px] leading-relaxed text-black">
        <p>
          {kalimatPembuka ? (
            kalimatPembuka.endsWith(',') ? kalimatPembuka : `${kalimatPembuka},`
          ) : (
            <span className="text-slate-400 select-none">
              (Kalimat pembuka) <span className="tracking-widest">.........................................................................................................................</span>
              <br />
              <span className="tracking-widest">....................................................................................................................,</span>
            </span>
          )}
        </p>
      </div>

      {/* Identitas Personal Bentuk Lembaran (Sesuai Image 1) */}
      <div className="my-5 font-serif text-[11.5px] space-y-1.5 text-black">
        <div className="flex items-baseline">
          <span className="w-44 sm:w-48 shrink-0">Nama</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="text-black flex-1 font-serif">
            {nama || <span className="text-slate-400 tracking-widest select-none">...................................................</span>}
          </span>
        </div>
        <div className="flex items-baseline">
          <span className="w-44 sm:w-48 shrink-0">NIP</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="text-black flex-1 font-serif">
            {nip || <span className="text-slate-400 tracking-widest select-none">...................................................</span>}
          </span>
        </div>
        <div className="flex items-baseline">
          <span className="w-44 sm:w-48 shrink-0">Pangkat dan golongan</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="text-black flex-1 font-serif">
            {pangkatGolongan || <span className="text-slate-400 tracking-widest select-none">...................................................</span>}
          </span>
        </div>
        <div className="flex items-baseline">
          <span className="w-44 sm:w-48 shrink-0">Jabatan</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="text-black flex-1 font-serif">
            {jabatan || <span className="text-slate-400 tracking-widest select-none">...................................................</span>}
          </span>
        </div>
      </div>

      {/* Uraian Tugas, Tanggal, dan Tempat */}
      <div className="my-5 text-justify font-serif text-[11.5px] leading-relaxed text-black">
        {untukTugas ? (
          <p>
            Untuk {untukTugas} {tanggalKegiatan ? `pada tanggal ${tanggalKegiatan}` : ''} {tempatKegiatan ? `bertempat di ${tempatKegiatan}` : ''}.
          </p>
        ) : (
          <div className="space-y-1 text-slate-400 select-none">
            <p className="leading-relaxed">
              Untuk <span className="tracking-widest">.........................................................................</span> tanggal <span className="tracking-widest">..........................</span> di
            </p>
            <p className="leading-relaxed tracking-widest">
              ...............................................................................................................................
            </p>
            <p className="leading-relaxed tracking-widest">
              ...............................................................................................................................
            </p>
          </div>
        )}
      </div>

      {/* Kalimat Penutup Baku Sesuai Template */}
      <div className="my-5 text-justify font-serif text-[11.5px] leading-relaxed text-black">
        <p>{kalimatPenutup || 'Surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan membuat laporan.'}</p>
      </div>

      {/* Pengesahan Kanan Bawah Sesuai Spesimen Resmi Image 1 */}
      <div className="flex justify-end mt-8 font-serif text-black">
        <div className="w-64 sm:w-72 text-left">
          <p className="text-xs font-normal text-black leading-tight">
            {tempatTanggal || 'Tanggal'}
          </p>
          <p className="text-xs font-normal text-black leading-tight mt-0.5">
            {namaJabatan?.endsWith(',') ? namaJabatan : `${namaJabatan || 'Rektor'},`}
          </p>

          <div className="my-2 min-h-[52px] flex items-center justify-center">
            {tteVerified ? (
              <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                <p className="font-bold uppercase tracking-wide mt-0.5">{namaPejabat}</p>
                <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
              </div>
            ) : (
              <div className="h-12 flex items-center justify-center text-black/80 italic text-[11px] font-serif">
                tanda tangan dan cap dinas
              </div>
            )}
          </div>

          <p className="text-xs font-normal text-black">
            {namaPejabat || 'Nama Pejabat'}
          </p>
          <p className="font-serif text-[11px] text-black mt-0.5">
            {nipPejabat || nip ? `NIP ${nipPejabat || nip}` : 'NIP'}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 6. FORMAT SURAT TUGAS - BENTUK KOLOM (ST-KOLOM)
 * Sesuai Gambar 3: Surat Tugas Kolektif / Matriks Kolom
 */
export const SuratTugasKolomTemplateView = ({ data }) => {
  const {
    nomorSurat = '045/UN58/ST/KP.03.00/2026',
    kalimatPembuka = 'Dalam rangka optimalisasi tata kelola administrasi dan integrasi kearsipan digital, Rektor Universitas Siliwangi menugaskan kepada pegawai yang namanya tercantum di bawah ini:',
    pesertaList = [
      {
        no: 1,
        nama: 'Dr. Nana Sujana, Drs., M.Si.',
        nip: '196808301989031004',
        pangkatGolongan: 'Pembina Utama Muda, IV/c',
        jabatan: 'Kepala Biro Umum dan Keuangan'
      },
      {
        no: 2,
        nama: 'Budi Santoso, S.E., M.Ak.',
        nip: '198203202008121002',
        pangkatGolongan: 'Penata Tk. I, III/d',
        jabatan: 'Koordinator Keuangan & BMN'
      },
      {
        no: 3,
        nama: 'Siti Rohmah, S.AP.',
        nip: '198809152014042001',
        pangkatGolongan: 'Penata Muda Tk. I, III/b',
        jabatan: 'Staf Administrasi & Kearsipan'
      }
    ],
    untukTugas = 'mengikuti Bimbingan Teknis Standarisasi Naskah Dinas Elektronik dan Penerapan TTE Tersertifikasi BSSN',
    tanggalKegiatan = '20 s.d. 22 September 2026',
    tempatKegiatan = 'Pusat Diklat Kemendikbudristek, Depok, Jawa Barat',
    kalimatPenutup = 'Surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan membuat laporan.',
    tempatTanggal = 'Tasikmalaya, 8 September 2026',
    namaJabatan = 'Rektor,',
    namaPejabat = 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nipPejabat = '196708161996031001',
    tteVerified = true
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      className="a4-sheet pasal47-with-kop bg-white text-black font-serif p-8 sm:p-12 max-w-3xl mx-auto border border-black rounded-none shadow-none text-xs leading-relaxed print:shadow-none print:border-none"
    >
      <KopSuratUnsil
        unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id}
        hideUnit={true}
        forceUniversityHeader={true}
      />

      {/* Judul Surat Tugas Kolom (Sesuai Spesimen Resmi Gambar 3 / Image 2) */}
      <div className="naskah-judul-block text-center my-4 font-serif text-black">
        <h2 className="text-sm sm:text-base font-normal tracking-wider uppercase text-black">
          SURAT TUGAS
        </h2>
        <p className="font-serif text-[11px] text-black mt-0.5">
          Nomor: {nomorSurat || '......./......../......../.......'}
        </p>
      </div>

      {/* Kalimat Pembuka */}
      <div className="my-4 text-justify font-serif text-[11.5px] leading-relaxed text-black">
        <p>
          {kalimatPembuka ? (
            kalimatPembuka.endsWith(',') ? kalimatPembuka : `${kalimatPembuka},`
          ) : (
            <span className="text-slate-400 select-none">
              (Kalimat pembuka) <span className="tracking-widest">.........................................................................................................................</span>
              <br />
              <span className="tracking-widest">....................................................................................................................,</span>
            </span>
          )}
        </p>
      </div>

      {/* Tabel Kolom Bergaris Tegas (Sesuai Image 2) */}
      <div className="my-4 overflow-x-auto font-serif text-black">
        <table className="w-full border-collapse border border-black text-[11px]">
          <thead>
            <tr className="border-b border-black font-normal text-black text-center">
              <th className="border-r border-black p-2 w-12 text-center font-normal">No.</th>
              <th className="border-r border-black p-2 text-center font-normal">Nama, NIP, Pangkat dan Golongan</th>
              <th className="p-2 text-center font-normal">Jabatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black text-black">
            {pesertaList && pesertaList.length > 0 ? (
              pesertaList.map((p, idx) => (
                <tr key={idx}>
                  <td className="border-r border-black p-2 text-center align-top">{p.no || idx + 1}.</td>
                  <td className="border-r border-black p-2 align-top space-y-0.5">
                    <p className="font-normal text-black">{p.nama}</p>
                    {p.nip && <p className="text-[10.5px] text-black">NIP {p.nip}</p>}
                    {p.pangkatGolongan && <p className="text-[10.5px] text-black">{p.pangkatGolongan}</p>}
                  </td>
                  <td className="p-2 align-top text-black">{p.jabatan}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border-r border-black p-4 h-28 text-center align-top">&nbsp;</td>
                <td className="border-r border-black p-4 h-28 align-top">&nbsp;</td>
                <td className="p-4 h-28 align-top">&nbsp;</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Uraian Tugas, Tanggal, dan Tempat */}
      <div className="my-4 text-justify font-serif text-[11.5px] leading-relaxed text-black">
        {untukTugas ? (
          <p>
            Untuk {untukTugas} {tanggalKegiatan ? `pada tanggal ${tanggalKegiatan}` : ''} {tempatKegiatan ? `bertempat di ${tempatKegiatan}` : ''}.
          </p>
        ) : (
          <div className="space-y-1 text-slate-400 select-none">
            <p className="leading-relaxed">
              Untuk <span className="tracking-widest">.........................................................................</span> tanggal <span className="tracking-widest">..........................</span> di
            </p>
            <p className="leading-relaxed tracking-widest">
              ...............................................................................................................................
            </p>
          </div>
        )}
      </div>

      {/* Kalimat Penutup Baku */}
      <div className="my-4 text-justify font-serif text-[11.5px] leading-relaxed text-black">
        <p>{kalimatPenutup || 'Surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan membuat laporan.'}</p>
      </div>

      {/* Pengesahan Kanan Bawah Sesuai Spesimen Resmi Image 2 */}
      <div className="flex justify-end mt-8 font-serif text-black">
        <div className="w-64 sm:w-72 text-left">
          <p className="text-xs font-normal text-black leading-tight">
            {tempatTanggal || 'Tanggal'}
          </p>
          <p className="text-xs font-normal text-black leading-tight mt-0.5">
            {namaJabatan?.endsWith(',') ? namaJabatan : `${namaJabatan || 'Rektor'},`}
          </p>

          <div className="my-2 min-h-[52px] flex items-center justify-center">
            {tteVerified ? (
              <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                <p className="font-bold uppercase tracking-wide mt-0.5">{namaPejabat}</p>
                <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
              </div>
            ) : (
              <div className="h-12 flex items-center justify-center text-black/80 italic text-[11px] font-serif">
                tanda tangan dan cap dinas
              </div>
            )}
          </div>

          <p className="text-xs font-normal text-black">
            {namaPejabat || 'Nama Pejabat'}
          </p>
          <p className="font-serif text-[11px] text-black mt-0.5">
            {nipPejabat || nip ? `NIP ${nipPejabat || nip}` : 'NIP'}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 7. FORMAT NOTA DINAS (ND)
 * Sesuai Gambar 1 Spesimen Resmi Peraturan Rektor No. 3/2023 (Contoh 6)
 */
export const NotaDinasTemplateView = ({ data }) => {
  const {
    nomorSurat = '018/UN58/KU.01.00/ND/2026',
    yth = 'Kepala Biro Perencanaan, Keuangan, dan Umum',
    dari = 'Koordinator Subbagian Keuangan dan BMN',
    hal = 'Laporan Realisasi Penyerapan Anggaran BLU Triwulan III TA 2026',
    kalimatPembuka = 'Bersama ini kami sampaikan dengan hormat laporan perkembangan realisasi belanja operasional dan belanja modal di lingkungan Universitas Siliwangi sampai dengan akhir Agustus 2026 sebagai bahan evaluasi pimpinan.',
    isiPokok = [
      '1. Realisasi penyerapan anggaran belanja pegawai dan operasional telah mencapai 78,4% dari pagu DIPA yang ditetapkan.',
      '2. Pengadaan sarana prasarana penunjang laboratorium melalui e-Katalog telah selesai diverifikasi oleh Pejabat Pembuat Komitmen (PPK).',
      '3. Seluruh berkas pertanggungjawaban (SPJ) telah terdigitalisasi penuh melalui modul kearsipan SILOKA sesuai standar Perka ANRI.'
    ],
    kalimatPenutup = 'Demikian nota dinas ini kami sampaikan, atas perhatian dan arahan Bapak diucapkan terima kasih.',
    tempatTanggal = '8 September 2026',
    namaJabatan = 'Koordinator Keuangan & BMN,',
    namaPejabat = 'Budi Santoso, S.E., M.Ak.',
    nip = '198203202008121002',
    tembusan = [
      'Wakil Rektor Bidang Keuangan dan Umum',
      'Ketua Satuan Pengawas Internal (SPI)'
    ],
    tteVerified = true
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      className="a4-sheet pasal47-with-kop bg-white text-black font-serif p-8 sm:p-12 max-w-3xl mx-auto border border-black rounded-none shadow-none text-xs leading-relaxed print:shadow-none print:border-none"
    >
      <KopSuratUnsil unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id} />

      {/* Judul Nota Dinas (Sesuai Gambar 1 / Contoh 06: Huruf Kapital Bold Tanpa Garis Bawah) */}
      <div className="naskah-judul-block text-center my-4 font-serif text-black">
        <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase text-black">
          NOTA DINAS
        </h2>
        <p className="font-serif text-xs text-black mt-0.5">
          Nomor {nomorSurat || '............/............/............/............'}
        </p>
      </div>

      {/* Header Memo Yth / Dari / Hal (Sesuai Gambar 1: Tanpa Kotak Border Garis) */}
      <div className="my-4 font-serif text-[11.5px] space-y-1 text-black">
        <div className="flex items-start">
          <span className="w-16 shrink-0 font-normal">Yth.</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="flex-1 font-serif text-black">
            {yth || <span className="text-slate-400 select-none">........................................................</span>}
          </span>
        </div>
        <div className="flex items-start">
          <span className="w-16 shrink-0 font-normal">Dari</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="flex-1 font-serif text-black">
            {dari || <span className="text-slate-400 select-none">........................................................</span>}
          </span>
        </div>
        <div className="flex items-start">
          <span className="w-16 shrink-0 font-normal">Hal</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="flex-1 font-serif text-black">
            {hal || <span className="text-slate-400 select-none">........................................................</span>}
          </span>
        </div>
      </div>

      {/* Batang Tubuh Isi Nota Dinas */}
      <div className="my-5 text-justify font-serif text-[11.5px] leading-relaxed text-black space-y-3.5">
        {!kalimatPembuka && (!isiPokok || (Array.isArray(isiPokok) && isiPokok.length === 0)) && !kalimatPenutup ? (
          /* Tampilan Spesimen Blangko Resmi Saat Form Masih Kosong Sesuai Gambar 1 */
          <div className="space-y-3 text-slate-400 font-serif select-none">
            <div className="space-y-1">
              <p className="leading-relaxed">
                Kalimat pembuka <span className="tracking-widest">...........................................................................................................</span>
              </p>
              <p className="leading-relaxed tracking-widest">
                ................................................................................................................................
              </p>
            </div>
            <div className="space-y-1 my-2">
              <p className="leading-relaxed">
                Isi Pokok <span className="tracking-widest">...................................................................................................................</span>
              </p>
              <p className="leading-relaxed tracking-widest">
                ................................................................................................................................
              </p>
              <p className="leading-relaxed tracking-widest">
                ................................................................................................................................
              </p>
              <p className="leading-relaxed tracking-widest">
                ................................................................................................................................
              </p>
            </div>
            <div className="space-y-1">
              <p className="leading-relaxed">
                Kalimat penutup <span className="tracking-widest">...........................................................................................................</span>
              </p>
              <p className="leading-relaxed tracking-widest">
                ................................................................................................................................
              </p>
            </div>
          </div>
        ) : (
          <>
            {kalimatPembuka && (
              <p className="indent-8 sm:indent-10 leading-relaxed">{kalimatPembuka}</p>
            )}
            {isiPokok && (
              <div className="space-y-1 leading-relaxed">
                {Array.isArray(isiPokok) ? (
                  isiPokok.map((item, idx) => (
                    <p key={idx} className="indent-8 sm:indent-10 leading-relaxed">{item}</p>
                  ))
                ) : (
                  <p className="indent-8 sm:indent-10 leading-relaxed">{isiPokok}</p>
                )}
              </div>
            )}
            {kalimatPenutup && (
              <p className="indent-8 sm:indent-10 leading-relaxed">{kalimatPenutup}</p>
            )}
          </>
        )}
      </div>

      {/* Blok Tanda Tangan & Tembusan Sesuai Gambar 1 */}
      <div className="mt-8 font-serif text-black">
        {/* Sisi Kanan: tanggal, Nama Jabatan, Tanda tangan dan cap dinas, Nama Pejabat, NIP */}
        <div className="flex justify-end">
          <div className="w-64 sm:w-72 text-left">
            <p className="text-xs mb-0.5">{tempatTanggal || 'tanggal'}</p>
            <p className="text-xs font-normal">{namaJabatan || 'Nama Jabatan'}</p>

            <div className="my-2 min-h-[48px] flex flex-col justify-center">
              {tteVerified ? (
                <div className="py-1 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                  <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                  <p className="font-bold uppercase tracking-wide mt-0.5">{namaPejabat}</p>
                  <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
                </div>
              ) : (
                <div className="h-10 flex items-center justify-center text-black/60 italic text-[10px] font-serif">
                  Tanda tangan dan cap dinas
                </div>
              )}
            </div>

            <p className="font-normal text-xs text-black">{namaPejabat || 'Nama Pejabat'}</p>
            <p className="text-[10.5px] text-black mt-0.5 font-serif">{nip ? `NIP ${nip}` : 'NIP'}</p>
          </div>
        </div>

        {/* Tembusan di Sisi Kiri Bawah Sesuai Gambar 1 */}
        <div className="text-left text-[11px] mt-2">
          <p className="font-normal text-black">Tembusan:</p>
          {tembusan && tembusan.length > 0 ? (
            <div className="text-left text-[10.5px] text-black max-w-md mt-0.5 font-serif space-y-0.5">
              {tembusan.map((t, idx) => (
                <p key={idx}>{tembusan.length > 1 ? `${idx + 1}. ${t}` : t}</p>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 select-none tracking-widest mt-0.5">...............................</p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 8. FORMAT SURAT DINAS (SD)
 * Sesuai Gambar 5: Surat Dinas Eksternal/Resmi Universitas Siliwangi
 */
export const SuratDinasTemplateView = ({ data }) => {
  const {
    nomorSurat = '092/UN58/TU.00.01/2026',
    lampiran = '1 (satu) Berkas',
    hal = 'Undangan Rapat Koordinasi Tindak Lanjut Hasil Pengawasan Kearsipan',
    tempatTanggal = 'Tasikmalaya, 8 September 2026',
    yth = 'Para Dekan dan Kepala Biro di Lingkungan Universitas Siliwangi',
    alamatTujuan = 'Kota Tasikmalaya',
    kalimatPembuka = 'Sehubungan dengan agenda tindak lanjut evaluasi kearsipan dinas tahun 2026, bersama ini kami mengundang Saudara untuk menghadiri rapat koordinasi yang akan dilaksanakan pada:',
    isiSurat = [
      'Hari/Tanggal : Senin, 14 September 2026',
      'Waktu        : Pukul 09.00 WIB s.d. selesai',
      'Tempat       : Ruang Rapat Rektorat Lt. 2 Kampus Siliwangi',
      'Agenda       : Sosialisasi Penerapan Tata Naskah Dinas Elektronik dan TTE BSrE BSSN pada SILOKA'
    ],
    kalimatPenutup = 'Mengingat pentingnya agenda tersebut di atas, kami mengharapkan kehadiran Saudara tepat pada waktunya. Atas perhatian dan kerja sama yang baik, diucapkan terima kasih.',
    namaJabatan = 'Kepala Biro Umum dan Keuangan,',
    namaPejabat = 'Dr. Nana Sujana, Drs., M.Si.',
    nip = '196808301989031004',
    tembusan = [
      'Rektor Universitas Siliwangi (sebagai laporan)',
      'Para Wakil Rektor di lingkungan UNSIL'
    ],
    tteVerified = true
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      className="a4-sheet pasal47-with-kop bg-white text-black font-serif p-8 sm:p-12 max-w-3xl mx-auto border border-black rounded-none shadow-none text-xs leading-relaxed print:shadow-none print:border-none"
    >
      <KopSuratUnsil
        unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id}
        hideUnit={true}
        forceUniversityHeader={true}
      />

      {/* Baris Nomor, Lampiran, Hal di kiri dan Tempat & Tanggal di kanan (Sesuai Gambar 5) */}
      <div className="flex items-start justify-between my-3 font-serif text-[11px] leading-tight text-black">
        <div className="space-y-0.5">
          <div className="flex items-baseline">
            <span className="w-20 font-normal shrink-0">Nomor</span>
            <span className="w-4 shrink-0 text-center">:</span>
            <span className="font-serif text-black">{nomorSurat}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-20 font-normal shrink-0">Lampiran</span>
            <span className="w-4 shrink-0 text-center">:</span>
            <span className="font-serif text-black">{lampiran}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-20 font-normal shrink-0">Hal</span>
            <span className="w-4 shrink-0 text-center">:</span>
            <span className="font-serif text-black">{hal}</span>
          </div>
        </div>

        <div className="text-right font-serif text-[11px] text-black pt-0.5">
          <p>{tempatTanggal}</p>
        </div>
      </div>

      {/* Tujuan Surat (Yth.) */}
      <div className="my-4 font-serif text-[11.5px] leading-snug text-black">
        <p className="font-normal text-black">Yth. {yth}</p>
        <p className="text-black">{alamatTujuan}</p>
      </div>

      {/* Kalimat Pembuka */}
      <div className="my-3 text-justify font-serif text-[11.5px] leading-normal text-black">
        <p className="indent-8 sm:indent-10">{kalimatPembuka}</p>
      </div>

      {/* Isi Surat */}
      <div className="my-3 ml-4 sm:ml-8 font-serif text-[11px] space-y-1 text-black">
        {(() => {
          const lines = Array.isArray(isiSurat)
            ? isiSurat
            : typeof isiSurat === 'string'
            ? isiSurat.split('\n')
            : [];

          if (lines.length === 0 && typeof isiSurat === 'string') {
            return <p className="indent-8 sm:indent-10 text-justify">{isiSurat}</p>;
          }

          return lines.map((line, idx) => {
            const trimmed = String(line).trim();
            if (!trimmed) return <div key={idx} className="h-1.5" />;

            const colonMatch = String(line).match(/^(\s*(?:\d+[\.\)]|[a-zA-Z][\.\)]|[-•*])?\s*[^:\n]{2,35})\s*:\s*(.+)$/);
            if (colonMatch) {
              const [, label, val] = colonMatch;
              return (
                <div key={idx} className="flex items-baseline">
                  <span className="w-28 sm:w-32 shrink-0">{label.trim()}</span>
                  <span className="w-4 shrink-0 text-center">:</span>
                  <span className="flex-1">{val.trim()}</span>
                </div>
              );
            }

            const isListItem = /^\s*(\d+[\.\)]|[a-zA-Z][\.\)]|[-•*])\s+/.test(String(line));
            if (isListItem) {
              return <p key={idx} className="leading-relaxed">{trimmed}</p>;
            }

            return (
              <p key={idx} className="indent-8 sm:indent-10 text-justify">
                {line}
              </p>
            );
          });
        })()}
      </div>

      {/* Kalimat Penutup */}
      <div className="my-4 text-justify font-serif text-[11.5px] leading-relaxed text-black">
        <p className="indent-8 sm:indent-10">{kalimatPenutup}</p>
      </div>

      {/* Blok Tanda Tangan & Tembusan (Sesuai Gambar 5 Spesimen Resmi) */}
      <div className="mt-8 font-serif text-black">
        <div className="flex justify-between items-end gap-6">
          {/* Tembusan di Sisi Kiri Bawah (Sejajar Bagian Bawah Tanda Tangan) */}
          <div className="text-left text-[11px] space-y-0.5 text-black max-w-xs">
            {tembusan && tembusan.length > 0 ? (
              <>
                <p className="font-normal text-black">Tembusan:</p>
                <div className="space-y-0.5">
                  {tembusan.map((t, idx) => (
                    <p key={idx}>
                      {tembusan.length > 1 ? `${idx + 1}. ${t}` : t}
                    </p>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-black font-normal">Tembusan:</p>
            )}
          </div>

          {/* Pejabat Penandatangan Resmi di Sisi Kanan Bawah */}
          <div className="w-64 sm:w-72 text-left">
            <p className="text-xs font-normal text-black leading-tight">
              {namaJabatan?.endsWith(',') ? namaJabatan : `${namaJabatan},`}
            </p>

            <div className="my-2 min-h-[52px] flex items-center justify-center">
              {tteVerified ? (
                <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                  <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                  <p className="font-bold uppercase tracking-wide mt-0.5">{namaPejabat}</p>
                  <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
                </div>
              ) : (
                <div className="h-12 flex items-center justify-center text-black/80 italic text-[11px] font-serif">
                  tanda tangan dan cap jabatan
                </div>
              )}
            </div>

            <p className="text-xs font-normal text-black">{namaPejabat}</p>
            <p className="font-serif text-[11px] text-black mt-0.5">NIP {nip}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 9. FORMAT SURAT UNDANGAN YANG BERBENTUK LEMBAR SURAT (SU-LEMBAR)
 * Sesuai Gambar 1: Surat Undangan Berbentuk Lembar Surat Resmi A4
 */
export const SuratUndanganLembaranTemplateView = ({ data }) => {
  const {
    nomorSurat = '098/UN58/TU.02.00/2026',
    lampiran = '1 (satu) Lembar',
    hal = 'Undangan Rapat Koordinasi Evaluasi Capaian Kinerja dan Kearsipan',
    tempatTanggal = 'Tasikmalaya, 8 September 2026',
    yth = 'Para Dekan Fakultas dan Direktur Pascasarjana',
    alamatTujuan = 'di Lingkungan Universitas Siliwangi',
    kalimatPembuka = 'Dalam rangka optimalisasi tata kelola administrasi akademik dan evaluasi naskah dinas triwulan III tahun 2026, bersama ini kami mengundang Saudara untuk hadir pada,',
    hariTanggal = 'Senin, 14 September 2026',
    pukul = '09.00 WIB s.d. selesai',
    tempat = 'Ruang Rapat Rektorat Lt. 2 Kampus Siliwangi',
    acara = 'Rapat Koordinasi Evaluasi Capaian Kinerja Triwulan III TA 2026',
    kalimatPenutup = 'Mengingat pentingnya agenda tersebut di atas, kami mengharapkan kehadiran Saudara tepat pada waktunya. Atas perhatian dan kerja sama yang baik, diucapkan terima kasih.',
    namaJabatan = 'Rektor,',
    namaPejabat = 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nip = '196708161996031001',
    tembusan = [
      'Para Wakil Rektor di lingkungan UNSIL',
      'Ketua Satuan Pengawas Internal (SPI)'
    ],
    tteVerified = true,
    hasLampiran = false,
    lampiranDaftarYth = [
      'Dekan Fakultas Keguruan dan Ilmu Pendidikan',
      'Dekan Fakultas Ekonomi dan Bisnis',
      'Dekan Fakultas Pertanian',
      'Dekan Fakultas Teknik',
      'Dekan Fakultas Ilmu Kesehatan',
      'Dekan Fakultas Agama Islam',
      'Direktur Pascasarjana',
      'Ketua Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)',
      'Ketua Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP)'
    ]
  } = data || {};

  return (
    <div className="space-y-0">
      <div
        data-pasal47="true"
        data-has-kop="true"
        className="a4-sheet pasal47-with-kop bg-white text-black font-serif p-8 sm:p-12 max-w-3xl mx-auto border border-black rounded-none shadow-none text-xs leading-relaxed print:shadow-none print:border-none"
      >
        <KopSuratUnsil unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id} />

        {/* Baris Nomor, Lampiran, Hal di kiri dan Tempat & Tanggal di kanan (Sesuai Gambar 1) */}
        <div className="flex items-start justify-between my-3 font-serif text-[11px] leading-tight text-black">
          <div className="space-y-1">
            <div className="flex items-baseline">
              <span className="w-20 font-bold shrink-0">Nomor</span>
              <span className="w-4 shrink-0">:</span>
              <span className="font-mono text-black font-bold">{nomorSurat}</span>
            </div>
            <div className="flex items-baseline">
              <span className="w-20 font-bold shrink-0">Lampiran</span>
              <span className="w-4 shrink-0">:</span>
              <span className="text-black">{lampiran}</span>
            </div>
            <div className="flex items-baseline">
              <span className="w-20 font-bold shrink-0">Hal</span>
              <span className="w-4 shrink-0">:</span>
              <span className="font-bold text-black">{hal}</span>
            </div>
          </div>

          <div className="text-right font-serif text-[11px] text-black pt-0.5">
            <p>{tempatTanggal}</p>
          </div>
        </div>

        {/* Tujuan Surat (Yth.) */}
        <div className="my-4 font-serif text-[11.5px] leading-snug text-black">
          <p className="font-bold text-black">Yth. {yth}</p>
          <p className="text-black">{alamatTujuan}</p>
        </div>

        {/* Kalimat Pembuka diakhiri dengan kata "pada," */}
        <div className="my-3 text-justify font-serif text-[11.5px] leading-normal text-black">
          <p>{kalimatPembuka}</p>
        </div>

        {/* Rincian Hari/Tanggal, Pukul, Tempat, Acara (Sesuai Gambar 1) */}
        <div className="my-4 ml-6 sm:ml-10 font-serif text-[11px] space-y-1.5 text-black">
          <div className="flex items-baseline">
            <span className="w-28 shrink-0">hari, tanggal</span>
            <span className="w-4 shrink-0">:</span>
            <span className="flex-1 font-medium">{hariTanggal}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-28 shrink-0">pukul</span>
            <span className="w-4 shrink-0">:</span>
            <span className="flex-1 font-medium">{pukul}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-28 shrink-0">tempat</span>
            <span className="w-4 shrink-0">:</span>
            <span className="flex-1 font-medium">{tempat}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-28 shrink-0">acara</span>
            <span className="w-4 shrink-0">:</span>
            <span className="flex-1 font-bold">{acara}</span>
          </div>
        </div>

        {/* Kalimat Penutup */}
        <div className="my-4 text-justify font-serif text-[11.5px] leading-relaxed text-black">
          <p>{kalimatPenutup}</p>
        </div>

        {/* Blok Tanda Tangan & Tembusan */}
        <div className="mt-5 sm:mt-6 font-serif text-black">
          {/* Baris Kanan: Nama Jabatan, TTE / Ruang TTD, Nama Pejabat */}
          <div className="flex justify-end">
            <div className="w-72 sm:w-80 text-left">
              <p className="font-bold text-xs uppercase tracking-wide text-black">{namaJabatan}</p>

              <div className="my-2 min-h-[48px] flex flex-col justify-center">
                {tteVerified ? (
                  <div className="py-1 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                    <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                    <p className="font-bold uppercase tracking-wide mt-0.5">{namaPejabat}</p>
                    <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
                  </div>
                ) : (
                  <div className="h-10 flex items-center justify-center text-black/60 italic text-[10px]">
                    (tanda tangan dan cap dinas)
                  </div>
                )}
              </div>

              <p className="font-bold text-xs text-black">{namaPejabat}</p>
            </div>
          </div>

          {/* Baris Sejajar: Tembusan di Kiri sejajar dengan NIP di Kanan */}
          <div className="flex items-baseline justify-between mt-1">
            {/* Tulisan Tembusan di Kiri */}
            <div className="text-left text-[11px]">
              {tembusan && tembusan.length > 0 ? (
                <p className="font-serif font-bold text-black">Tembusan:</p>
              ) : (
                <span />
              )}
            </div>

            {/* NIP di Kanan (Sejajar dengan Tembusan) */}
            <div className="w-72 sm:w-80 shrink-0 text-left text-[10.5px] text-black font-mono">
              <p>NIP {nip}</p>
            </div>
          </div>

          {/* Butir-butir Tembusan di Bawah Tulisan Tembusan */}
          {tembusan && tembusan.length > 0 && (
            <div className="text-left text-[10.5px] text-black max-w-md mt-0.5 font-serif">
              <ol className="list-decimal list-inside space-y-0.5 pl-0.5">
                {tembusan.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Kata Penyambung ke Halaman Berikutnya (Sudut Kanan Bawah diikuti 3 titik) */}
        {hasLampiran && <KataPenyambungNaskahDinas word="Lampiran" />}
      </div>

      {/* Lembar Lampiran (Halaman 2) jika hasLampiran aktif */}
      {hasLampiran && (
        <LampiranSuratUndanganTemplateView
          data={{
            nomorSurat,
            tanggal: tempatTanggal,
            daftarYth: lampiranDaftarYth
          }}
          isMultiPageSubsheet={true}
        />
      )}
    </div>
  );
};

/**
 * 10. FORMAT LAMPIRAN SURAT UNDANGAN
 * Sesuai Gambar 2: Format Lampiran Surat Undangan (Daftar Penerima Bernomor)
 */
export const LampiranSuratUndanganTemplateView = ({ data, isMultiPageSubsheet = false }) => {
  const {
    nomorSurat = '098/UN58/TU.02.00/2026',
    tanggal = '8 September 2026',
    daftarYth = [
      'Dekan Fakultas Keguruan dan Ilmu Pendidikan',
      'Dekan Fakultas Ekonomi dan Bisnis',
      'Dekan Fakultas Pertanian',
      'Dekan Fakultas Teknik',
      'Dekan Fakultas Ilmu Kesehatan',
      'Dekan Fakultas Agama Islam',
      'Direktur Pascasarjana',
      'Ketua Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)',
      'Ketua Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran (LPMPP)'
    ]
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="false"
      className={`a4-sheet pasal47-without-kop bg-white text-black font-serif p-8 sm:p-12 max-w-3xl mx-auto border border-black rounded-none shadow-none text-xs leading-relaxed print:shadow-none print:border-none ${
        isMultiPageSubsheet ? 'page-break break-before-page mt-8 print:mt-0' : ''
      }`}
    >
      {/* Nomor Halaman Simetris di Tengah Atas Kertas (- 2 -) */}
      <NomorHalamanNaskahDinas pageNumber={2} />
      {/* Visual Divider saat mode pratinjau layar */}
      {isMultiPageSubsheet && (
        <div className="print:hidden mb-6 pb-2 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-sans">
          <span className="font-bold text-unsil-green-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Halaman 2: Lampiran Surat Undangan
          </span>
          <span>A4 Sheet Standar Kemendikbudristek</span>
        </div>
      )}

      {/* Header Lampiran Kiri Atas (Sesuai Gambar 2) */}
      <div className="font-serif text-[11.5px] leading-tight space-y-1 mb-8">
        <p className="font-semibold text-slate-900">Lampiran Surat</p>
        <div className="flex items-baseline">
          <span className="w-16 shrink-0">Nomor</span>
          <span className="w-4 shrink-0">:</span>
          <span className="font-serif text-slate-900 font-medium">{nomorSurat}</span>
        </div>
        <div className="flex items-baseline">
          <span className="w-16 shrink-0">Tanggal</span>
          <span className="w-4 shrink-0">:</span>
          <span className="text-slate-800">{tanggal}</span>
        </div>
      </div>

      {/* Daftar Penerima Bernomor (Yth. 1. ... 2. ... dst.) Sesuai Gambar 2 */}
      <div className="font-serif text-[11.5px] leading-relaxed text-slate-900 max-w-xl">
        <p className="font-bold mb-2">Yth.</p>
        <ol className="list-decimal list-outside ml-6 space-y-1.5">
          {daftarYth.map((item, idx) => (
            <li key={idx} className="pl-1 text-justify">
              {item}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

/**
 * 11. FORMAT SURAT UNDANGAN YANG BERBENTUK KARTU (SU-KARTU)
 * Sesuai Gambar 3: Undangan Resmi Kartu Eksklusif Rektor Universitas Siliwangi
 */
export const SuratUndanganKartuTemplateView = ({ data }) => {
  const {
    pengundang = 'REKTOR UNIVERSITAS SILIWANGI',
    pendamping = '(beserta istri/suami)',
    kalimatMengharap = 'mengharap dengan hormat kehadiran Bapak/Ibu/Saudara',
    kalimatPadaAcara = 'pada acara',
    namaAcara = 'UPACARA WISUDA PERIODE I TAHUN AKADEMIK 2026/2027\nDAN PENGUKUHAN GURU BESAR UNIVERSITAS SILIWANGI',
    hari = 'Sabtu',
    tanggal = '19 September 2026',
    pukul = '08.00 WIB s.d. selesai',
    tempat = 'Gedung Rektorat Mandala Universitas Siliwangi, Kota Tasikmalaya',
    menitHadir = '30',
    nomorKonfirmasi = '(0265) 330634 ext. 102 / 0812-3456-7890 (Subbag Protokoler BKU)',
    pakaianPria = 'Pakaian Sipil Lengkap (PSL) / Batik Lengan Panjang',
    pakaianWanita = 'Pakaian Nasional / Menyesuaikan'
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="false"
      className="a4-sheet pasal47-without-kop bg-white text-black font-serif p-6 sm:p-10 max-w-2xl mx-auto border border-black rounded-none shadow-none text-xs leading-relaxed print:p-8 print:shadow-none print:border print:border-black"
    >
      {/* Bingkai Ganda Elegan Khas Kartu Undangan Resmi (Sesuai Gambar 3) */}
      <div className="border border-black p-6 sm:p-10 text-center flex flex-col justify-between min-h-[580px] text-black">
        {/* Bagian Atas: Logo UNSIL Terpusat */}
        <div>
          <div className="flex justify-center mb-4">
            <img
              src="/unsil-logo.png"
              alt="Logo Universitas Siliwangi"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain select-none"
            />
          </div>

          {/* Pejabat Pengundang & Pendamping Terpusat */}
          <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase text-black">
            {pengundang}
          </h2>
          {pendamping && (
            <p className="text-xs italic mt-0.5 font-serif text-black">
              {pendamping}
            </p>
          )}

          {/* Kalimat Penghormatan Terpusat */}
          <div className="my-6 text-xs sm:text-[13px] text-black leading-relaxed font-serif">
            <p>{kalimatMengharap}</p>
            <p className="mt-1">{kalimatPadaAcara}</p>
          </div>

          {/* Judul Acara (Terpusat & Menonjol) */}
          <div className="my-5 max-w-lg mx-auto">
            {namaAcara.split('\n').map((baris, idx) => (
              <p
                key={idx}
                className="text-xs sm:text-sm font-bold tracking-wide uppercase text-black leading-snug"
              >
                {baris}
              </p>
            ))}
          </div>

          {/* Rincian Hari, Tanggal, Pukul & Tempat */}
          <div className="my-6 text-xs sm:text-[12px] text-black space-y-1 font-serif">
            <p>
              hari <span className="font-semibold">{hari}</span> tanggal{' '}
              <span className="font-semibold">{tanggal}</span>, pukul{' '}
              <span className="font-semibold">{pukul}</span>
            </p>
            <p>
              bertempat di <span className="font-semibold">{tempat}</span>
            </p>
          </div>
        </div>

        {/* Bagian Bawah: Catatan Kehadiran & Pakaian (2 Kolom Terpisah Sesuai Gambar 3) */}
        <div className="mt-8 pt-4 border-t border-black text-[10.5px] font-serif text-black text-left">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
            {/* Kolom Kiri (Butir 1 & 2) */}
            <div className="sm:col-span-7 space-y-1.5 leading-snug">
              <div className="flex items-start gap-1.5">
                <span className="font-bold shrink-0">1.</span>
                <p>
                  Harap hadir <span className="font-bold">{menitHadir}</span> Menit sebelum acara dimulai dan undangan dibawa.
                </p>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold shrink-0">2.</span>
                <p>
                  Konfirmasi melalui telepon <span className="font-medium">{nomorKonfirmasi}</span>
                </p>
              </div>
            </div>

            {/* Kolom Kanan (Pakaian Pria & Wanita) */}
            <div className="sm:col-span-5 space-y-1 leading-snug sm:border-l sm:border-black sm:pl-4">
              <p className="font-bold text-black">Pakaian:</p>
              <div className="flex items-baseline gap-1">
                <span className="w-12 shrink-0">Pria</span>
                <span className="w-2 shrink-0">:</span>
                <span className="flex-1">{pakaianPria}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="w-12 shrink-0">Wanita</span>
                <span className="w-2 shrink-0">:</span>
                <span className="flex-1">{pakaianWanita}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 12. FORMAT NOTA KESEPAHAMAN (MoU)
 * Sesuai Gambar Acuan: Format Nota Kesepahaman resmi antara dua pihak dengan lambang pihak I & II, komparisi, pasal-pasal, dan tanda tangan berdampingan.
 */
export const NotaKesepahamanTemplateView = ({ data }) => {
  const {
    logoPihak1 = '/unsil-logo.png',
    logoPihak2 = null,
    tampilkanBingkaiLogo = false,
    instansiPihak1 = 'UNIVERSITAS SILIWANGI',
    instansiPihak2 = 'PT TELEKOMUNIKASI INDONESIA (PERSERO) TBK',
    tentang = 'KERJA SAMA PENYELENGGARAAN TRIDHARMA PERGURUAN TINGGI,\nPENGEMBANGAN TEKNOLOGI INFORMASI KAMPUS, DAN PROGRAM MBKM',
    nomorPihak1 = '045/UN58/KS.01.00/2026',
    nomorPihak2 = 'TEL.128/HK.200/COP-A0000000/2026',
    hari = 'Selasa',
    tanggal = '8',
    bulan = 'September',
    tahun = '2026',
    tempat = 'Kota Tasikmalaya',
    pihak1Nama = 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    pihak1Jabatan = 'Rektor Universitas Siliwangi',
    pihak1JabatanSingkat = 'Rektor Universitas Siliwangi',
    pihak1Instansi = 'Universitas Siliwangi',
    pihak1Alamat = 'Jalan Siliwangi Nomor 24 Kota Tasikmalaya, Jawa Barat',
    pihak1Nip = '196708161996031001',
    pihak1TteVerified = true,
    pihak2Nama = 'Ir. Dian Rachmawan, M.Sc.',
    pihak2Jabatan = 'Direktur Enterprise & Business Service',
    pihak2JabatanSingkat = 'Direktur Enterprise & Business Service',
    pihak2Instansi = 'PT Telekomunikasi Indonesia (Persero) Tbk',
    pihak2Alamat = 'Telkom Landmark Tower Lt. 32, Jl. Jend. Gatot Subroto Kav. 52, Jakarta Selatan',
    pihak2Nip = 'NIK 680124',
    pasalList = [
      {
        no: '1',
        judul: 'TUJUAN',
        isi: 'Nota Kesepahaman ini bertujuan untuk membangun kemitraan strategis dan sinergi antara PARA PIHAK dalam pemanfaatan potensi keahlian, teknologi, dan sumber daya yang dimiliki secara optimal guna kemajuan pendidikan tinggi dan industri digital nasional.'
      },
      {
        no: '2',
        judul: 'RUANG LINGKUP',
        isi: 'Ruang lingkup Nota Kesepahaman ini meliputi:\n1. Penyelenggaraan program pendidikan, penelitian terapan, dan pengabdian kepada masyarakat bersama.\n2. Fasilitasi Program Merdeka Belajar Kampus Merdeka (MBKM), magang bersertifikat, dan rekrutmen talenta muda UNSIL.\n3. Pengembangan infrastruktur digital, transformasi tata naskah dinas elektronik, dan integrasi smart campus.\n4. Bidang kerja sama lain yang disepakati bersama oleh PARA PIHAK.'
      },
      {
        no: '3',
        judul: 'PELAKSANAAN',
        isi: 'Hal-hal teknis dan operasional yang timbul sebagai akibat dari Nota Kesepahaman ini akan diatur lebih lanjut dalam bentuk Perjanjian Kerja Sama (PKS) atau Perjanjian Pelaksanaan yang ditandatangani oleh pejabat yang ditunjuk oleh PARA PIHAK.'
      },
      {
        no: '4',
        judul: 'JANGKA WAKTU',
        isi: 'Nota Kesepahaman ini berlaku untuk jangka waktu 3 (tiga) tahun terhitung sejak tanggal ditandatangani dan dapat diperpanjang atau diakhiri atas kesepakatan tertulis PARA PIHAK.'
      },
      {
        no: '5',
        judul: 'PENUTUP',
        isi: 'Nota Kesepahaman ini dibuat dan ditandatangani pada hari, tanggal, bulan, tahun, dan tempat sebagaimana tersebut pada awal Nota Kesepahaman, dibuat dalam rangkap 2 (dua) asli bermaterai cukup dan masing-masing mempunyai kekuatan hukum yang sama.'
      }
    ]
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      className="a4-sheet pasal47-with-kop bg-white text-black font-serif p-8 sm:p-12 max-w-3xl mx-auto border border-black rounded-none shadow-none text-xs leading-relaxed print:shadow-none print:border-none"
    >
      {/* Header: Dua Lambang di Kiri dan Kanan (Ukuran Terkunci Sesuai Template) */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Lambang Pihak I (Kiri) */}
        <div className="w-28 h-20 flex items-center justify-center text-center shrink-0">
          {logoPihak1 ? (
            <div className="w-28 h-20 flex items-center justify-center p-1 overflow-hidden select-none">
              <img
                src={logoPihak1}
                alt="Lambang Pihak I"
                className="max-w-full max-h-full w-auto h-auto object-contain select-none pointer-events-none"
              />
            </div>
          ) : (
            <div className="border border-black p-2 w-28 h-20 flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-wider text-black select-none">
              <span>LAMBANG</span>
              <span>PIHAK I</span>
            </div>
          )}
        </div>

        {/* Lambang Pihak II (Kanan) - Dipaksa Menyesuaikan Ukuran Template */}
        <div className="w-28 h-20 flex items-center justify-center text-center shrink-0">
          {logoPihak2 ? (
            <div
              className={`w-28 h-20 flex items-center justify-center p-1 overflow-hidden select-none ${
                tampilkanBingkaiLogo ? 'border border-black' : ''
              }`}
            >
              <img
                src={logoPihak2}
                alt="Lambang Pihak II"
                className="max-w-full max-h-full w-auto h-auto object-contain select-none pointer-events-none"
              />
            </div>
          ) : (
            <div className="border border-black p-2 w-28 h-20 flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-wider text-black select-none">
              <span>LAMBANG</span>
              <span>PIHAK II</span>
            </div>
          )}
        </div>
      </div>

      {/* Judul Naskah Nota Kesepahaman Terpusat (Pasal 46: 1 spasi antarbaris judul, 2 spasi ke isi) */}
      <div className="naskah-judul-block text-center font-serif text-black space-y-1 my-5">
        <h1 className="text-sm sm:text-base font-bold tracking-wider uppercase">
          NOTA KESEPAHAMAN
        </h1>
        <p className="text-xs font-bold tracking-wider uppercase">ANTARA</p>
        <p className="text-xs sm:text-sm font-bold tracking-wider uppercase">
          {instansiPihak1}
        </p>
        <p className="text-xs font-bold tracking-wider uppercase">DAN</p>
        <p className="text-xs sm:text-sm font-bold tracking-wider uppercase">
          {instansiPihak2}
        </p>
        <p className="text-xs font-bold tracking-wider uppercase pt-1">TENTANG</p>

        {/* Tentang / Perihal Kerjasama */}
        <div className="max-w-xl mx-auto py-1">
          {tentang.split('\n').map((baris, idx) => (
            <p
              key={idx}
              className="text-xs sm:text-sm font-bold uppercase leading-snug tracking-wide text-black"
            >
              {baris}
            </p>
          ))}
        </div>

        {/* Baris Nomor Pihak I & Pihak II */}
        <div className="pt-2 font-serif text-[11px] leading-snug text-black">
          <p>
            <span className="font-bold">NOMOR</span> {nomorPihak1}
          </p>
          <p>
            <span className="font-bold">NOMOR</span> {nomorPihak2}
          </p>
        </div>
      </div>

      {/* Komparisi Para Pihak (Sesuai Gambar Acuan) */}
      <div className="my-5 font-serif text-[11.5px] leading-relaxed text-justify space-y-3 text-black">
        <p>
          Pada hari ini, <span className="font-medium">{hari}</span>, tanggal{' '}
          <span className="font-medium">{tanggal}</span>, bulan{' '}
          <span className="font-medium">{bulan}</span>, tahun{' '}
          <span className="font-medium">{tahun}</span>, bertempat di{' '}
          <span className="font-medium">{tempat}</span>, yang bertanda tangan di bawah ini:
        </p>

        <div className="space-y-2.5 pl-1 sm:pl-2">
          <div className="flex items-start gap-2">
            <span className="font-bold shrink-0 w-4">1.</span>
            <p className="text-justify leading-relaxed">
              <span className="font-bold">{pihak1Nama}</span>, {pihak1Jabatan} {pihak1Instansi}, berkedudukan di {pihak1Alamat}, dalam hal ini bertindak untuk dan atas nama {instansiPihak1}, selanjutnya disebut sebagai <strong className="font-bold">PIHAK KESATU</strong>.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold shrink-0 w-4">2.</span>
            <p className="text-justify leading-relaxed">
              <span className="font-bold">{pihak2Nama}</span>, {pihak2Jabatan} {pihak2Instansi}, berkedudukan di {pihak2Alamat}, dalam hal ini bertindak untuk dan atas nama {instansiPihak2}, selanjutnya disebut sebagai <strong className="font-bold">PIHAK KEDUA</strong>.
            </p>
          </div>
        </div>

        <p className="text-justify pt-1">
          Selanjutnya <strong className="font-bold">PIHAK KESATU</strong>, dan{' '}
          <strong className="font-bold">PIHAK KEDUA</strong> secara bersama-sama disebut{' '}
          <strong className="font-bold">PARA PIHAK</strong>, sepakat untuk mengadakan Nota Kesepahaman dengan ketentuan sebagai berikut:
        </p>
      </div>

      {/* Pasal-Pasal Nota Kesepahaman (Judul Terpusat, Teks Justified) */}
      <div className="my-6 space-y-5 font-serif text-[11.5px] leading-relaxed text-black">
        {pasalList.map((pasal, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="text-center font-bold">
              <p>Pasal {pasal.no}</p>
              <p className="uppercase tracking-wider">{pasal.judul}</p>
            </div>
            <div className="text-justify pt-0.5 space-y-1.5">
              {pasal.isi.split('\n').map((paragraf, pIdx) => (
                <p key={pIdx} className="leading-relaxed">
                  {paragraf}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Blok Tanda Tangan Dua Kolom (Sesuai Gambar Acuan) */}
      <div className="mt-12 pt-4 font-serif text-[11.5px] text-black">
        <div className="grid grid-cols-2 gap-8 text-center">
          {/* Kolom Kiri: PIHAK KESATU */}
          <div className="flex flex-col justify-between min-h-[170px]">
            <div>
              <p className="font-bold uppercase tracking-wider text-black">PIHAK KESATU</p>
              <p className="mt-0.5 font-medium text-black">
                {pihak1JabatanSingkat || pihak1Jabatan},
              </p>
            </div>

            {/* Ruang Materai / Tanda Tangan / TTE */}
            <div className="my-3 min-h-[56px] flex flex-col items-center justify-center">
              {pihak1TteVerified ? (
                <div className="py-1 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight max-w-[220px]">
                  <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                  <p className="font-bold uppercase tracking-wide mt-0.5">{pihak1Nama}</p>
                  <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
                </div>
              ) : (
                <div className="h-14 flex items-center justify-center text-black/60 italic text-[10px] font-serif">
                  (materai, tanda tangan, dan cap dinas)
                </div>
              )}
            </div>

            <div>
              <p className="font-bold uppercase tracking-wide text-xs text-black">
                {pihak1Nama}
              </p>
              {pihak1Nip && (
                <p className="text-[10.5px] text-black mt-0.5 font-mono">
                  NIP {pihak1Nip}
                </p>
              )}
            </div>
          </div>

          {/* Kolom Kanan: PIHAK KEDUA */}
          <div className="flex flex-col justify-between min-h-[170px]">
            <div>
              <p className="font-bold uppercase tracking-wider text-black">PIHAK KEDUA</p>
              <p className="mt-0.5 font-medium text-black">
                {pihak2JabatanSingkat || pihak2Jabatan},
              </p>
            </div>

            {/* Ruang Materai / Tanda Tangan */}
            <div className="my-3 min-h-[56px] flex flex-col items-center justify-center">
              <div className="h-14 flex items-center justify-center text-black/60 italic text-[10px] font-serif">
                (materai, tanda tangan, dan cap dinas)
              </div>
            </div>

            <div>
              <p className="font-bold uppercase tracking-wide text-xs text-black">
                {pihak2Nama}
              </p>
              {pihak2Nip && (
                <p className="text-[10.5px] text-black mt-0.5 font-mono">
                  {pihak2Nip}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 12. FORMAT PERJANJIAN KERJA SAMA DALAM NEGERI (PKS)
 * Berdasarkan Surat Edaran / Tata Naskah Dinas Resmi (Gambar 1)
 */
export const PerjanjianKerjaSamaTemplateView = ({ data }) => {
  const {
    instansiPihak1 = 'UNIVERSITAS SILIWANGI',
    instansiPihak2 = 'DINAS PENDIDIKAN PROVINSI JAWA BARAT',
    nomorPihak1 = '120/UN58/KS.01/2026',
    nomorPihak2 = '421.2/1089/Disdik/2026',
    tentang = 'PENINGKATAN MUTU PENDIDIKAN, PENELITIAN, DAN PENGABDIAN KEPADA MASYARAKAT DI JAWA BARAT',
    hari = 'Selasa',
    tanggal = '08',
    bulan = 'September',
    tahun = '2026',
    tempat = 'Kota Tasikmalaya',
    pihak1Nama = 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    pihak1Jabatan = 'Rektor Universitas Siliwangi',
    pihak1Instansi = 'Universitas Siliwangi',
    pihak1Alamat = 'Jalan Siliwangi Nomor 24 Kota Tasikmalaya',
    pihak1Nip = '196708161996031001',
    pihak2Nama = 'Drs. H. Wahyu Mijaya, S.H., M.Si.',
    pihak2Jabatan = 'Kepala Dinas Pendidikan Provinsi Jawa Barat',
    pihak2Instansi = 'Dinas Pendidikan Provinsi Jawa Barat',
    pihak2Alamat = 'Jl. Dr. Radjiman No. 6, Pasir Kaliki, Cicendo, Kota Bandung',
    pihak2Nip = '196906171994031004',
    bidangKerjasama = 'Pendidikan, Penelitian, dan Pengabdian Kepada Masyarakat serta Program Merdeka Belajar Kampus Merdeka',
    daftarPasal = [
      {
        nomor: '1',
        judul: 'TUJUAN KERJA SAMA DALAM NEGERI',
        isi: 'Perjanjian Kerja Sama ini bertujuan untuk membangun sinergi dan kolaborasi strategis dalam rangka meningkatkan kualitas sumber daya manusia, penguatan riset aplikatif, serta perluasan akses pengabdian masyarakat di lingkungan Provinsi Jawa Barat.'
      },
      {
        nomor: '2',
        judul: 'RUANG LINGKUP KERJA SAMA DALAM NEGERI',
        isi: 'Ruang lingkup Perjanjian Kerja Sama ini meliputi:\n1. Peningkatan kapasitas dan kompetensi tenaga pendidik dan kependidikan.\n2. Penyelenggaraan program magang, praktik kerja lapangan, dan asistensi mengajar.\n3. Kolaborasi riset terapan dan publikasi ilmiah bersama.\n4. Pemberdayaan masyarakat berbasis potensi lokal di wilayah Jawa Barat.'
      },
      {
        nomor: '3',
        judul: 'PELAKSANAAN KEGIATAN',
        isi: 'Pelaksanaan kegiatan tindak lanjut dari Perjanjian Kerja Sama ini akan diatur secara teknis dalam Petunjuk Teknis (Juknis) atau Surat Keputusan Bersama yang ditandatangani oleh unit kerja pelaksana teknis yang ditunjuk oleh PARA PIHAK.'
      },
      {
        nomor: '4',
        judul: 'PEMBIAYAAN',
        isi: 'Segala biaya yang timbul sebagai akibat dari pelaksanaan Perjanjian Kerja Sama ini dibebankan kepada anggaran PARA PIHAK sesuai dengan kewenangan dan ketentuan peraturan perundang-undangan yang berlaku secara akuntabel.'
      },
      {
        nomor: '5',
        judul: 'PENYELESAIAN PERSELISIHAN',
        isi: 'Apabila terjadi perselisihan pendapat dalam penafsiran atau pelaksanaan Perjanjian Kerja Sama ini, PARA PIHAK sepakat untuk menyelesaikannya secara musyawarah untuk mufakat.'
      },
      {
        nomor: '6',
        judul: 'LAIN-LAIN',
        isi: '(1) Apabila terjadi hal-hal yang di luar kekuasaan kedua belah pihak atau keadaan memaksa (force majeure), dapat dipertimbangkan kemungkinan perubahan tempat dan waktu pelaksanaan tugas pekerjaan dengan persetujuan kedua belah pihak.\n(2) Yang termasuk keadaan memaksa (force majeure) adalah:\n    a. Bencana alam;\n    b. Tindakan pemerintah di bidang fiskal dan moneter; dan\n    c. Keadaan keamanan yang tidak mengizinkan.\n(3) Segala perubahan dan/atau pembatalan terhadap piagam kerja sama ini akan diatur bersama kemudian oleh PIHAK KESATU dan PIHAK KEDUA.'
      },
      {
        nomor: '7',
        judul: 'PENUTUP',
        isi: 'Perjanjian Kerja Sama ini dibuat dalam rangkap 2 (dua) asli bermaterai cukup, masing-masing mempunyai kekuatan hukum yang sama setelah ditandatangani oleh PARA PIHAK pada hari dan tanggal tersebut di atas.'
      }
    ],
    logoPihak1 = '/unsil-logo.png',
    logoPihak2 = null,
    tampilkanBingkaiLogo = false,
    tteVerified = true
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      className="a4-sheet pasal47-with-kop p-6 sm:p-10 max-w-3xl mx-auto bg-white border border-black rounded-none shadow-none print:shadow-none print:border-none print:m-0 print:max-w-full text-black font-serif leading-normal"
    >
      {/* Header Dua Lambang */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="w-28 h-20 flex items-center justify-center text-center shrink-0">
          {logoPihak1 ? (
            <div className="w-28 h-20 flex items-center justify-center p-1 overflow-hidden select-none">
              <img
                src={logoPihak1}
                alt="Lambang Pihak I"
                className="max-w-full max-h-full w-auto h-auto object-contain select-none pointer-events-none"
              />
            </div>
          ) : (
            <div className="border border-black p-2 w-28 h-20 flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-wider text-black select-none">
              <span>LAMBANG</span>
              <span>PIHAK I</span>
            </div>
          )}
        </div>

        <div className="w-28 h-20 flex items-center justify-center text-center shrink-0">
          {logoPihak2 ? (
            <div
              className={`w-28 h-20 flex items-center justify-center p-1 overflow-hidden select-none ${
                tampilkanBingkaiLogo ? 'border border-black' : ''
              }`}
            >
              <img
                src={logoPihak2}
                alt="Lambang Pihak II"
                className="max-w-full max-h-full w-auto h-auto object-contain select-none pointer-events-none"
              />
            </div>
          ) : (
            <div className="border border-black p-2 w-28 h-20 flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-wider text-black select-none">
              <span>LAMBANG</span>
              <span>PIHAK II</span>
            </div>
          )}
        </div>
      </div>

      {/* Judul Perjanjian Kerja Sama Dalam Negeri Terpusat (Pasal 46: 1 spasi antarbaris judul, 2 spasi ke isi) */}
      <div className="naskah-judul-block text-center font-serif text-black space-y-1 my-5">
        <h1 className="text-sm sm:text-base font-bold tracking-wider uppercase">
          PERJANJIAN KERJA SAMA DALAM NEGERI
        </h1>
        <p className="text-xs font-bold tracking-wider uppercase">ANTARA</p>
        <p className="text-xs sm:text-sm font-bold tracking-wider uppercase">
          {instansiPihak1}
        </p>
        <p className="text-xs font-bold tracking-wider uppercase">DAN</p>
        <p className="text-xs sm:text-sm font-bold tracking-wider uppercase">
          {instansiPihak2}
        </p>
        <p className="text-xs font-bold tracking-wider uppercase pt-1">TENTANG</p>

        <div className="max-w-xl mx-auto py-1">
          {tentang.split('\n').map((baris, idx) => (
            <p
              key={idx}
              className="text-xs sm:text-sm font-bold uppercase leading-snug tracking-wide text-black"
            >
              {baris}
            </p>
          ))}
        </div>

        <div className="pt-2 space-y-0.5 text-xs font-serif font-bold text-black">
          <p>NOMOR {nomorPihak1}</p>
          <p>NOMOR {nomorPihak2}</p>
        </div>
      </div>

      {/* Komparisi Para Pihak */}
      <div className="text-xs text-justify font-serif leading-relaxed text-black space-y-2 mt-6">
        <p>
          Pada hari ini, <span className="font-semibold">{hari}</span>, tanggal{' '}
          <span className="font-semibold">{tanggal}</span>, bulan{' '}
          <span className="font-semibold">{bulan}</span>, tahun{' '}
          <span className="font-semibold">{tahun}</span>, bertempat di{' '}
          <span className="font-semibold">{tempat}</span>, yang bertanda tangan di bawah ini:
        </p>

        <div className="space-y-1.5 pl-2">
          <p>
            <span className="font-semibold">1. {pihak1Nama}</span>; {pihak1Jabatan}, bertindak untuk dan atas nama {pihak1Instansi}, berkedudukan di {pihak1Alamat}, selanjutnya disebut sebagai{' '}
            <span className="font-bold">PIHAK KESATU</span>
          </p>
          <p>
            <span className="font-semibold">2. {pihak2Nama}</span>; {pihak2Jabatan}, bertindak untuk dan atas nama {pihak2Instansi}, berkedudukan di {pihak2Alamat}, selanjutnya disebut sebagai{' '}
            <span className="font-bold">PIHAK KEDUA</span>
          </p>
        </div>

        <p className="pt-1">
          Bersepakat untuk melakukan kerja sama dalam negeri dalam bidang{' '}
          <span className="font-medium">{bidangKerjasama}</span> yang diatur dalam ketentuan sebagai berikut:
        </p>
      </div>

      {/* Klausul Pasal-Pasal */}
      <div className="mt-6 space-y-5 text-xs text-black font-serif">
        {daftarPasal.map((pasal, idx) => (
          <div key={idx} className="space-y-1">
            <div className="text-center font-bold text-black">
              <p>Pasal {pasal.nomor || idx + 1}</p>
              <p className="uppercase tracking-wide">{pasal.judul}</p>
            </div>
            <div className="text-justify leading-relaxed whitespace-pre-line pl-1">
              {pasal.isi}
            </div>
          </div>
        ))}
      </div>

      {/* Blok Tanda Tangan Berdampingan Dua Kolom */}
      <div className="mt-10 pt-4 text-xs font-serif text-black">
        <div className="grid grid-cols-2 gap-6 text-center">
          {/* Kolom Kiri: PIHAK KESATU */}
          <div className="flex flex-col justify-between min-h-[170px]">
            <div>
              <p className="font-bold uppercase tracking-wider text-black">PIHAK KESATU</p>
              <p className="mt-0.5 font-medium text-black">{pihak1Jabatan},</p>
            </div>

            <div className="my-3 min-h-[56px] flex flex-col items-center justify-center">
              {tteVerified ? (
                <div className="py-1 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight max-w-[220px]">
                  <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                  <p className="font-bold uppercase tracking-wide mt-0.5">{pihak1Nama}</p>
                  <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
                </div>
              ) : (
                <div className="h-14 flex items-center justify-center text-black/60 italic text-[10px] font-serif">
                  (materai, tanda tangan, dan cap dinas)
                </div>
              )}
            </div>

            <div>
              <p className="font-bold uppercase tracking-wide text-xs text-black">
                {pihak1Nama}
              </p>
              {pihak1Nip && (
                <p className="text-[10.5px] text-black mt-0.5 font-mono">
                  NIP {pihak1Nip}
                </p>
              )}
            </div>
          </div>

          {/* Kolom Kanan: PIHAK KEDUA */}
          <div className="flex flex-col justify-between min-h-[170px]">
            <div>
              <p className="font-bold uppercase tracking-wider text-black">PIHAK KEDUA</p>
              <p className="mt-0.5 font-medium text-black">{pihak2Jabatan},</p>
            </div>

            <div className="my-3 min-h-[56px] flex flex-col items-center justify-center">
              <div className="h-14 flex items-center justify-center text-black/60 italic text-[10px] font-serif">
                (materai, tanda tangan, dan cap dinas)
              </div>
            </div>

            <div>
              <p className="font-bold uppercase tracking-wide text-xs text-black">
                {pihak2Nama}
              </p>
              {pihak2Nip && (
                <p className="text-[10.5px] text-black mt-0.5 font-mono">
                  NIP/NIK {pihak2Nip}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 13. FORMAT SURAT KUASA
 * Berdasarkan Naskah Dinas Resmi (Gambar 2)
 */
export const SuratKuasaTemplateView = ({ data }) => {
  const {
    nomorSurat = '045/UN58/KU.02/2026',
    pemberiNama = 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    pemberiJabatan = 'Rektor Universitas Siliwangi',
    pemberiAlamat = 'Jalan Siliwangi Nomor 24 Kota Tasikmalaya',
    pemberiNip = '196708161996031001',
    penerimaNama = 'Dr. Ade Rustiana, Drs., M.Si.',
    penerimaJabatan = 'Wakil Rektor Bidang Umum dan Keuangan Universitas Siliwangi',
    penerimaAlamat = 'Jalan Siliwangi Nomor 24 Kota Tasikmalaya',
    penerimaNip = '196801021992031002',
    untukKeperluan = 'Mewakili Rektor Universitas Siliwangi dalam menandatangani Dokumen Perjanjian Kerja Sama, Berita Acara Rekonsiliasi Keuangan, dan Pengesahan Hibah Barang Milik Negara (BMN) Tahun Anggaran 2026 pada Kantor Pelayanan Perbendaharaan Negara (KPPN) Tasikmalaya.',
    tanggal = '08 September 2026',
    kota = 'Tasikmalaya',
    tteVerified = true
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      className="a4-sheet pasal47-with-kop p-6 sm:p-10 max-w-3xl mx-auto bg-white border border-black rounded-none shadow-none print:shadow-none print:border-none print:m-0 print:max-w-full text-black font-serif leading-normal"
    >
      {/* Kop Surat Resmi Universitas Siliwangi */}
      <KopSuratUnsil unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id} />

      {/* Judul & Nomor Surat Kuasa (Pasal 46: 1 spasi antarbaris judul, 2 spasi ke isi) */}
      <div className="naskah-judul-block text-center font-serif text-black my-6 space-y-1">
        <h1 className="text-sm sm:text-base font-bold tracking-wider uppercase">
          SURAT KUASA
        </h1>
        <p className="text-xs font-serif text-black">
          Nomor: {nomorSurat}
        </p>
      </div>

      {/* Identitas Pemberi & Penerima Kuasa */}
      <div className="text-xs text-black font-serif space-y-4 leading-relaxed">
        <p>Yang bertanda tangan di bawah ini,</p>

        {/* Tabel Data Pemberi Kuasa */}
        <div className="pl-4 space-y-1">
          <div className="grid grid-cols-12 gap-1">
            <span className="col-span-3">nama</span>
            <span className="col-span-9 flex">
              <span className="mr-2">:</span>
              <span className="font-semibold">{pemberiNama}</span>
            </span>
          </div>
          <div className="grid grid-cols-12 gap-1">
            <span className="col-span-3">jabatan</span>
            <span className="col-span-9 flex">
              <span className="mr-2">:</span>
              <span>{pemberiJabatan}</span>
            </span>
          </div>
          <div className="grid grid-cols-12 gap-1">
            <span className="col-span-3">alamat</span>
            <span className="col-span-9 flex">
              <span className="mr-2">:</span>
              <span>{pemberiAlamat}</span>
            </span>
          </div>
        </div>

        <p className="pt-2">dengan ini memberikan kuasa kepada,</p>

        {/* Tabel Data Penerima Kuasa */}
        <div className="pl-4 space-y-1">
          <div className="grid grid-cols-12 gap-1">
            <span className="col-span-3">nama</span>
            <span className="col-span-9 flex">
              <span className="mr-2">:</span>
              <span className="font-semibold">{penerimaNama}</span>
            </span>
          </div>
          <div className="grid grid-cols-12 gap-1">
            <span className="col-span-3">jabatan</span>
            <span className="col-span-9 flex">
              <span className="mr-2">:</span>
              <span>{penerimaJabatan}</span>
            </span>
          </div>
          <div className="grid grid-cols-12 gap-1">
            <span className="col-span-3">alamat</span>
            <span className="col-span-9 flex">
              <span className="mr-2">:</span>
              <span>{penerimaAlamat}</span>
            </span>
          </div>
        </div>

        {/* Untuk Keperluan */}
        <div className="pt-2 space-y-1.5">
          <p className="font-semibold">Untuk</p>
          <div className="text-justify pl-4 leading-relaxed whitespace-pre-line">
            {untukKeperluan}
          </div>
        </div>

        <p className="pt-3">
          Surat kuasa ini dibuat untuk dipergunakan sebagaimana mestinya.
        </p>
      </div>

      {/* Blok Tanda Tangan Dua Kolom */}
      <div className="mt-12 text-xs font-serif text-black">
        <div className="grid grid-cols-2 gap-8 text-center">
          {/* Kolom Kiri: Penerima Kuasa */}
          <div className="flex flex-col justify-between min-h-[160px]">
            <div>
              {/* Spasi kosong penyeimbang tanggal kanan */}
              <div className="h-4 mb-0.5" />
              <p className="font-semibold">Penerima Kuasa,</p>
            </div>

            <div className="my-3 min-h-[50px] flex items-center justify-center">
              <span className="text-[10px] text-black/60 italic font-serif">(tanda tangan)</span>
            </div>

            <div>
              <p className="font-bold uppercase tracking-wide text-xs text-black">
                {penerimaNama}
              </p>
              {penerimaNip && (
                <p className="text-[10.5px] text-black mt-0.5 font-mono">
                  NIP {penerimaNip}
                </p>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Pemberi Kuasa */}
          <div className="flex flex-col justify-between min-h-[160px]">
            <div>
              <p className="text-[11px] text-black mb-0.5">{kota ? `${kota}, ` : ''}{tanggal}</p>
              <p className="font-semibold">Pemberi Kuasa,</p>
            </div>

            <div className="my-3 min-h-[50px] flex flex-col items-center justify-center">
              {tteVerified ? (
                <div className="py-1 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight max-w-[200px]">
                  <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                  <p className="font-bold uppercase tracking-wide mt-0.5">{pemberiNama}</p>
                  <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
                </div>
              ) : (
                <div className="h-12 flex items-center justify-center text-black/60 italic text-[10px] font-serif">
                  (materai, tanda tangan, dan cap dinas)
                </div>
              )}
            </div>

            <div>
              <p className="font-bold uppercase tracking-wide text-xs text-black">
                {pemberiNama}
              </p>
              {pemberiNip && (
                <p className="text-[10.5px] text-black mt-0.5 font-mono">
                  NIP {pemberiNip}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 14. FORMAT BERITA ACARA
 * Sesuai Gambar Spesimen Resmi Peraturan Rektor No. 3/2023 (Contoh 12)
 */
export const BeritaAcaraTemplateView = ({ data }) => {
  const {
    nomorSurat = '078/UN58/BA.01/2026',
    hari = 'Selasa',
    tanggal = '08',
    bulan = 'September',
    tahun = '2026',
    pihak1Nama = 'Dr. Kurnia, S.P., M.P.',
    pihak1Nip = '197503122002121001',
    pihak1Jabatan = 'Kepala Biro Perencanaan, Keuangan, dan Umum',
    pihak2Nama = 'Ir. Hendra Gunawan, M.T.',
    pihak2Nip = '',
    pihak2Jabatan = 'Pejabat Pembuat Komitmen (PPK) Sarana dan Prasarana',
    daftarKegiatan = [
      'Pemeriksaan fisik dan uji fungsi terhadap Pengadaan Perangkat Komputer Server dan Jaringan Terpusat SILOKA Tahun Anggaran 2026.',
      'Serah terima barang operasional teknologi informasi dalam kondisi baik, lengkap, dan memenuhi spesifikasi teknis Kerangka Acuan Kerja (KAK).'
    ],
    uraianKegiatan = '',
    dasarPelaksanaan = 'Surat Keputusan Rektor Universitas Siliwangi Nomor 142/UN58/KP.02/2026 tanggal 15 Januari 2026 tentang Penetapan Tim Pemeriksa dan Penerima Hasil Pekerjaan Pengadaan Barang/Jasa di Lingkungan Universitas Siliwangi.',
    jumlahRangkap = 'dua',
    angkaRangkap = '2',
    tempatDibuat = 'Tasikmalaya',
    mengetahuiNama = 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    mengetahuiJabatan = 'Rektor Universitas Siliwangi',
    mengetahuiNip = '196708161996031001',
    tteVerified = true
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      className="a4-sheet pasal47-with-kop p-6 sm:p-10 max-w-3xl mx-auto bg-white border border-black rounded-none shadow-none print:shadow-none print:border-none print:m-0 print:max-w-full text-black font-serif leading-normal"
    >
      {/* Kop Surat Resmi Universitas Siliwangi */}
      <KopSuratUnsil unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id} />

      {/* Judul & Nomor Berita Acara (Sesuai Contoh 12: Nomor Tanpa Titik Dua) */}
      <div className="naskah-judul-block text-center font-serif text-black my-5">
        <h1 className="text-sm sm:text-base font-bold tracking-wider uppercase text-black">
          BERITA ACARA
        </h1>
        <p className="text-xs font-serif text-black mt-0.5">
          Nomor {nomorSurat || '........../...../...../.........'}
        </p>
      </div>

      {/* Komparisi Para Pihak Sesuai Contoh 12 */}
      <div className="text-xs text-justify font-serif text-black space-y-3 leading-relaxed">
        <p>
          Pada hari ini, <span className="font-semibold">{hari || '....................'}</span>, tanggal{' '}
          <span className="font-semibold">{tanggal || '....................'}</span>, bulan{' '}
          <span className="font-semibold">{bulan || '....................'}</span>, tahun{' '}
          <span className="font-semibold">{tahun || '....................'}</span>, kami masing-masing:
        </p>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="shrink-0 font-normal">1.</span>
            <p className="flex-1 leading-relaxed">
              {pihak1Nama ? (
                <>
                  <span className="font-semibold">{pihak1Nama}</span>
                  {pihak1Nip ? `, NIP ${pihak1Nip}` : ''}
                  {pihak1Jabatan ? `, ${pihak1Jabatan}` : ''}
                  , selanjutnya disebut <span className="font-bold">Pihak Pertama</span>, dan
                </>
              ) : (
                <span className="text-slate-400 select-none">
                  ..................................................................................................................................................................................
                  <br />
                  selanjutnya disebut Pihak Pertama, dan
                </span>
              )}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="shrink-0 font-normal">2.</span>
            <p className="flex-1 leading-relaxed">
              {pihak2Nama ? (
                <>
                  <span className="font-semibold">{pihak2Nama}</span>
                  {pihak2Nip ? `, NIP ${pihak2Nip}` : ''}
                  {pihak2Jabatan ? ` (${pihak2Jabatan})` : ''}
                  , selanjutnya disebut <span className="font-bold">Pihak Kedua</span>,
                </>
              ) : (
                <span className="text-slate-400 select-none">
                  ..................................................................................................................................................................................
                  <br />
                  selanjutnya disebut Pihak Kedua,
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Uraian Kegiatan / Telah Melaksanakan */}
        <div>
          <p>
            telah melaksanakan{' '}
            {uraianKegiatan ||
              (daftarKegiatan && daftarKegiatan.length > 0
                ? ''
                : '..................................................................................................................................................................................................................................................................................................................................................................................................')}
          </p>
          {daftarKegiatan && daftarKegiatan.length > 0 && (
            <div className="pl-6 space-y-1 pt-1">
              {daftarKegiatan.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="shrink-0 font-normal">{idx + 1}.</span>
                  <p className="leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dasar & Jumlah Rangkap Sesuai Contoh 12 */}
        <div className="pt-2 space-y-2">
          <p>
            Berita acara ini dibuat dengan sesungguhnya berdasarkan{' '}
            {dasarPelaksanaan ||
              '....................................................................................................................................................................................................................................................................................................................................................'}
            .
          </p>
          <p>
            Berita acara ini dibuat rangkap {jumlahRangkap || '....................'} ({angkaRangkap || '..........'}) untuk dipergunakan sebagaimana mestinya.
          </p>
        </div>
      </div>

      {/* Tempat Pembuatan & Dua Kolom Tanda Tangan: Pihak Kedua di Kiri, Pihak Pertama di Kanan Sesuai Contoh 12 */}
      <div className="mt-8 text-xs font-serif text-black">
        <div className="flex justify-end mb-2">
          <p className="text-xs">Dibuat di {tempatDibuat || '....................'}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-center">
          {/* Pihak Kedua (Sisi Kiri Sesuai Contoh 12) */}
          <div className="flex flex-col justify-between min-h-[130px]">
            <p className="font-normal">Pihak Kedua,</p>
            <div className="my-2 min-h-[44px] flex items-center justify-center">
              <span className="text-[10px] text-black/60 italic font-serif">Tanda tangan</span>
            </div>
            <div>
              <p className="font-normal text-xs text-black">
                {pihak2Nama || 'Nama Pejabat'}
              </p>
              <p className="text-[10.5px] text-black mt-0.5 font-serif">
                {pihak2Nip ? `NIP ${pihak2Nip}` : 'NIP'}
              </p>
            </div>
          </div>

          {/* Pihak Pertama (Sisi Kanan Sesuai Contoh 12) */}
          <div className="flex flex-col justify-between min-h-[130px]">
            <p className="font-normal">Pihak Pertama,</p>
            <div className="my-2 min-h-[44px] flex items-center justify-center">
              <span className="text-[10px] text-black/60 italic font-serif">Tanda tangan</span>
            </div>
            <div>
              <p className="font-normal text-xs text-black">
                {pihak1Nama || 'Nama Pejabat'}
              </p>
              <p className="text-[10.5px] text-black mt-0.5 font-serif">
                {pihak1Nip ? `NIP ${pihak1Nip}` : 'NIP'}
              </p>
            </div>
          </div>
        </div>

        {/* Mengetahui / Mengesahkan (Tengah Bawah Sesuai Contoh 12) */}
        <div className="mt-7 text-center flex flex-col items-center justify-center">
          <p className="font-normal text-xs">Mengetahui/Mengesahkan</p>
          <p className="text-xs text-black">{mengetahuiJabatan || 'Nama Jabatan'}</p>

          <div className="my-2 min-h-[48px] flex items-center justify-center">
            {tteVerified ? (
              <div className="py-1 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight max-w-[200px]">
                <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                <p className="font-bold uppercase tracking-wide mt-0.5">{mengetahuiNama}</p>
                <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
              </div>
            ) : (
              <div className="h-10 flex items-center justify-center text-black/60 italic text-[10px] font-serif">
                Tanda tangan dan cap dinas
              </div>
            )}
          </div>

          <div>
            <p className="font-normal text-xs text-black">
              {mengetahuiNama || 'Nama Pejabat'}
            </p>
            <p className="text-[10.5px] text-black mt-0.5 font-serif">
              {mengetahuiNip ? `NIP ${mengetahuiNip}` : 'NIP'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 15. FORMAT SURAT KETERANGAN
 * Sesuai Gambar Spesimen Resmi Peraturan Rektor No. 3/2023 (Contoh 15 / Gambar 4)
 */
export const SuratKeteranganTemplateView = ({ data }) => {
  const {
    nomorSurat = '092/UN58/KM.04/2026',
    pejabatNama = 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    pejabatNip = '196708161996031001',
    pejabatPangkatGol = 'Pembina Utama Madya / IV/d',
    pejabatJabatan = 'Rektor Universitas Siliwangi',
    pegawaiNama = 'Fajar Nugraha, S.T., M.Kom.',
    pegawaiNip = '198805212015041002',
    pegawaiPangkatGol = 'Penata Muda Tingkat I / III/b',
    pegawaiJabatan = 'Dosen Asisten Ahli pada Fakultas Teknik Universitas Siliwangi',
    isiKeterangan = 'Bahwa yang bersangkutan adalah benar Pegawai Negeri Sipil / Tenaga Pendidik aktif pada Universitas Siliwangi dan saat ini sedang ditugaskan sebagai Koordinator Sistem Informasi dan Transformasi Digital (SILOKA) serta berkelakuan baik dan tidak sedang menjalani hukuman disiplin tingkat sedang maupun berat.',
    tanggal = '08 September 2026',
    kota = 'Tasikmalaya',
    tteVerified = true
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      className="a4-sheet pasal47-with-kop p-6 sm:p-10 max-w-3xl mx-auto bg-white border border-black rounded-none shadow-none print:shadow-none print:border-none print:m-0 print:max-w-full text-black font-serif leading-normal"
    >
      {/* Kop Surat Resmi Universitas Siliwangi */}
      <KopSuratUnsil unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id} />

      {/* Judul & Nomor Surat Keterangan (Sesuai Gambar 4: Nomor Tanpa Titik Dua) */}
      <div className="naskah-judul-block text-center font-serif text-black my-5">
        <h1 className="text-sm sm:text-base font-bold tracking-wider uppercase text-black">
          SURAT KETERANGAN
        </h1>
        <p className="text-xs font-serif text-black mt-0.5">
          Nomor {nomorSurat || '........../...../...../.........'}
        </p>
      </div>

      {/* Isi Surat Keterangan */}
      <div className="text-xs text-black font-serif space-y-3 leading-relaxed">
        <p>Yang bertanda tangan di bawah ini,</p>

        {/* Pejabat Yang Menerangkan (Sesuai Gambar 4: Huruf Kecil & Titik Dua Sejajar) */}
        <div className="space-y-1 text-xs">
          <div className="flex items-baseline">
            <span className="w-40 sm:w-44 shrink-0 font-normal">nama</span>
            <span className="w-4 shrink-0 text-center">:</span>
            <span className="flex-1 font-serif text-black">
              {pejabatNama || <span className="text-slate-400 select-none">...........................................................................</span>}
            </span>
          </div>
          <div className="flex items-baseline">
            <span className="w-40 sm:w-44 shrink-0 font-normal">NIP</span>
            <span className="w-4 shrink-0 text-center">:</span>
            <span className="flex-1 font-serif text-black">
              {pejabatNip || <span className="text-slate-400 select-none">...........................................................................</span>}
            </span>
          </div>
          <div className="flex items-baseline">
            <span className="w-40 sm:w-44 shrink-0 font-normal">pangkat dan golongan</span>
            <span className="w-4 shrink-0 text-center">:</span>
            <span className="flex-1 font-serif text-black">
              {pejabatPangkatGol || <span className="text-slate-400 select-none">...........................................................................</span>}
            </span>
          </div>
          <div className="flex items-baseline">
            <span className="w-40 sm:w-44 shrink-0 font-normal">jabatan</span>
            <span className="w-4 shrink-0 text-center">:</span>
            <span className="flex-1 font-serif text-black">
              {pejabatJabatan || <span className="text-slate-400 select-none">...........................................................................</span>}
            </span>
          </div>
        </div>

        <p className="pt-2">dengan ini menerangkan bahwa,</p>

        {/* Pegawai / Pihak Yang Diterangkan */}
        <div className="space-y-1 text-xs">
          <div className="flex items-baseline">
            <span className="w-40 sm:w-44 shrink-0 font-normal">nama</span>
            <span className="w-4 shrink-0 text-center">:</span>
            <span className="flex-1 font-serif text-black">
              {pegawaiNama || <span className="text-slate-400 select-none">...........................................................................</span>}
            </span>
          </div>
          <div className="flex items-baseline">
            <span className="w-40 sm:w-44 shrink-0 font-normal">NIP</span>
            <span className="w-4 shrink-0 text-center">:</span>
            <span className="flex-1 font-serif text-black">
              {pegawaiNip || <span className="text-slate-400 select-none">...........................................................................</span>}
            </span>
          </div>
          <div className="flex items-baseline">
            <span className="w-40 sm:w-44 shrink-0 font-normal">pangkat dan golongan</span>
            <span className="w-4 shrink-0 text-center">:</span>
            <span className="flex-1 font-serif text-black">
              {pegawaiPangkatGol || <span className="text-slate-400 select-none">...........................................................................</span>}
            </span>
          </div>
          <div className="flex items-baseline">
            <span className="w-40 sm:w-44 shrink-0 font-normal">jabatan</span>
            <span className="w-4 shrink-0 text-center">:</span>
            <span className="flex-1 font-serif text-black">
              {pegawaiJabatan || <span className="text-slate-400 select-none">...........................................................................</span>}
            </span>
          </div>
        </div>

        {/* Narasi Isi Keterangan Sesuai Gambar 4 */}
        <div className="pt-2 text-justify font-serif leading-relaxed">
          {isiKeterangan ? (
            <div className="space-y-2 whitespace-pre-line">
              {isiKeterangan.toLowerCase().startsWith('isi keterangan') ? (
                <p>{isiKeterangan}</p>
              ) : (
                <p>
                  <span className="font-normal">Isi Keterangan </span>
                  {isiKeterangan}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5 text-slate-400 select-none">
              <p className="leading-relaxed">
                Isi Keterangan <span className="tracking-widest">........................................................................................................................</span>
              </p>
              <p className="leading-relaxed tracking-widest">
                ...................................................................................................................................................
              </p>
              <p className="leading-relaxed tracking-widest">
                ...................................................................................................................................................
              </p>
              <p className="leading-relaxed tracking-widest">
                ...................................................................................................................................................
              </p>
            </div>
          )}
        </div>

        {/* Penutup Baku Sesuai Gambar 4 */}
        <p className="pt-2">
          Surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.
        </p>
      </div>

      {/* Blok Tanda Tangan Kanan Sesuai Gambar 4 */}
      <div className="mt-8 text-xs font-serif flex justify-end">
        <div className="w-64 sm:w-72 text-left">
          <p className="text-xs mb-0.5">{tanggal || 'Tanggal'}</p>
          <p className="text-xs mb-1 font-normal">{pejabatJabatan ? `${pejabatJabatan},` : 'Nama Pejabat,'}</p>

          <div className="my-2 min-h-[52px] flex items-center justify-center">
            {tteVerified ? (
              <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                <p className="font-bold uppercase tracking-wide mt-0.5">{pejabatNama}</p>
                <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
              </div>
            ) : (
              <div className="h-12 flex flex-col items-center justify-center text-black/60 italic text-[10px] font-serif leading-tight text-center">
                <span>tanda tangan dan</span>
                <span>cap dinas</span>
              </div>
            )}
          </div>

          <p className="font-normal text-xs text-black">{pejabatNama || 'Nama Pejabat'}</p>
          <p className="text-[10.5px] text-black mt-0.5 font-serif">
            {pejabatNip ? `NIP ${pejabatNip}` : 'NIP'}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 16. FORMAT SURAT PERNYATAAN
 * Sesuai Gambar Spesimen Resmi Peraturan Rektor No. 3/2023 (Contoh 14 / Image 2)
 */
export const SuratPernyataanTemplateView = ({ data }) => {
  const {
    nomorSurat = '053/UN58/KP.04/2026',
    namaYangMenyatakan = 'Dr. Ade Rustiana, Drs., M.Si.',
    nipYangMenyatakan = '196801021992031002',
    pangkatGolongan = 'Pembina Utama Muda / IV/c',
    jabatan = 'Wakil Rektor Bidang Umum dan Keuangan',
    alamat = 'Jalan Siliwangi Nomor 24 Kota Tasikmalaya',
    isiPernyataan = 'Dengan ini menyatakan dengan sesungguhnya bahwa seluruh data, laporan rekonsiliasi belanja modal, dan dokumen pertanggungjawaban keuangan Universitas Siliwangi Tahun Anggaran 2026 telah disusun secara benar, objektif, dan sesuai dengan Standar Akuntansi Pemerintahan (SAP). Apabila di kemudian hari ditemukan ketidaksesuaian atau kekeliruan data, saya bersedia bertanggung jawab sepenuhnya sesuai ketentuan hukum yang berlaku.',
    tanggal = '08 September 2026',
    kota = 'Tasikmalaya',
    namaJabatan = 'Yang Menyatakan,',
    tteVerified = true
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      className="a4-sheet pasal47-with-kop p-6 sm:p-10 max-w-3xl mx-auto bg-white border border-black rounded-none shadow-none print:shadow-none print:border-none print:m-0 print:max-w-full text-black font-serif leading-normal"
    >
      {/* Kop Surat Resmi Universitas Siliwangi */}
      <KopSuratUnsil unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id} />

      {/* Judul & Nomor Surat Pernyataan (Sesuai Image 2 / Contoh 14: Nomor Tanpa Titik Dua) */}
      <div className="naskah-judul-block text-center font-serif text-black my-5">
        <h1 className="text-sm sm:text-base font-bold tracking-wider uppercase text-black">
          SURAT PERNYATAAN
        </h1>
        <p className="text-xs font-serif text-black mt-0.5">
          Nomor {nomorSurat || '........../...../...../.........'}
        </p>
      </div>

      {/* Pembuka Yang Bertanda Tangan di Bawah Ini */}
      <div className="text-xs text-black font-serif space-y-3 leading-relaxed">
        <p>Yang bertanda tangan di bawah ini,</p>

        {/* Identitas Diri (Sesuai Image 2: Label Huruf Kecil & Kolon Sejajar) */}
        <div className="space-y-1 text-xs">
          <div className="flex items-baseline">
            <span className="w-40 sm:w-44 shrink-0 font-normal">nama</span>
            <span className="w-4 shrink-0 text-center">:</span>
            <span className="flex-1 font-serif text-black">
              {namaYangMenyatakan || <span className="text-slate-400 select-none">...........................................................................</span>}
            </span>
          </div>
          <div className="flex items-baseline">
            <span className="w-40 sm:w-44 shrink-0 font-normal">NIP</span>
            <span className="w-4 shrink-0 text-center">:</span>
            <span className="flex-1 font-serif text-black">
              {nipYangMenyatakan || <span className="text-slate-400 select-none">...........................................................................</span>}
            </span>
          </div>
          <div className="flex items-baseline">
            <span className="w-40 sm:w-44 shrink-0 font-normal">pangkat dan golongan</span>
            <span className="w-4 shrink-0 text-center">:</span>
            <span className="flex-1 font-serif text-black">
              {pangkatGolongan || <span className="text-slate-400 select-none">...........................................................................</span>}
            </span>
          </div>
          <div className="flex items-baseline">
            <span className="w-40 sm:w-44 shrink-0 font-normal">jabatan</span>
            <span className="w-4 shrink-0 text-center">:</span>
            <span className="flex-1 font-serif text-black">
              {jabatan || <span className="text-slate-400 select-none">...........................................................................</span>}
            </span>
          </div>
          <div className="flex items-baseline">
            <span className="w-40 sm:w-44 shrink-0 font-normal">alamat</span>
            <span className="w-4 shrink-0 text-center">:</span>
            <span className="flex-1 font-serif text-black">
              {alamat || <span className="text-slate-400 select-none">...........................................................................</span>}
            </span>
          </div>
        </div>

        {/* Isi Pernyataan Sesuai Image 2 */}
        <div className="pt-2 text-justify font-serif leading-relaxed">
          {isiPernyataan ? (
            <div className="space-y-2 whitespace-pre-line">
              {isiPernyataan.toLowerCase().startsWith('isi pernyataan') ? (
                <p>{isiPernyataan}</p>
              ) : (
                <p>
                  <span className="font-normal">Isi Pernyataan </span>
                  {isiPernyataan}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5 text-slate-400 select-none">
              <p className="leading-relaxed">
                Isi Pernyataan <span className="tracking-widest">........................................................................................................................</span>
              </p>
              <p className="leading-relaxed tracking-widest">
                ...................................................................................................................................................
              </p>
              <p className="leading-relaxed tracking-widest">
                ...................................................................................................................................................
              </p>
              <p className="leading-relaxed tracking-widest">
                ...................................................................................................................................................
              </p>
              <p className="leading-relaxed tracking-widest">
                ...................................................................................................................................................
              </p>
            </div>
          )}
        </div>

        {/* Penutup Baku Sesuai Image 2 */}
        <p className="pt-2">
          Surat pernyataan ini dibuat untuk dipergunakan sebagaimana mestinya.
        </p>
      </div>

      {/* Blok Tanda Tangan Kanan Sesuai Image 2 */}
      <div className="mt-8 text-xs font-serif flex justify-end">
        <div className="w-64 sm:w-72 text-left">
          <p className="text-xs mb-0.5">{tanggal || 'Tanggal'}</p>
          <p className="text-xs mb-1 font-normal">{namaJabatan || 'Nama Jabatan'}</p>

          <div className="my-2 min-h-[52px] flex items-center justify-center">
            {tteVerified ? (
              <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                <p className="font-bold uppercase tracking-wide mt-0.5">{namaYangMenyatakan}</p>
                <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
              </div>
            ) : (
              <div className="h-12 flex flex-col items-center justify-center text-black/60 italic text-[10px] font-serif leading-tight text-center">
                <span>Materai, tanda tangan dan</span>
                <span>Cap dinas/jabatan</span>
              </div>
            )}
          </div>

          <p className="font-normal text-xs text-black">{namaYangMenyatakan || 'Nama Pejabat'}</p>
          <p className="text-[10.5px] text-black mt-0.5 font-serif">
            {nipYangMenyatakan ? `NIP ${nipYangMenyatakan}` : 'NIP'}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 17. FORMAT SURAT PENGANTAR
 * Sesuai Gambar Spesimen Resmi Peraturan Rektor No. 3/2023 (Contoh 17 / Gambar 5)
 */
export const SuratPengantarTemplateView = ({ data }) => {
  const {
    nomorSurat = '067/UN58/TU.02/2026',
    tujuan = 'Kepala Kantor Pelayanan Perbendaharaan Negara (KPPN) Tasikmalaya',
    tujuanInstansi = 'Jalan Otto Iskandardinata Nomor 12 Kota Tasikmalaya',
    items = [
      {
        jenis: 'Berkas Rekonsiliasi Laporan Keuangan Universitas Siliwangi Semester I Tahun Anggaran 2026',
        jumlah: '2 (dua) bundel',
        keterangan: 'Disampaikan dengan hormat untuk diverifikasi dan diterbitkan Berita Acara Rekonsiliasi (BAR).'
      },
      {
        jenis: 'Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) Belanja Modal TA 2026',
        jumlah: '1 (satu) berkas',
        keterangan: 'Sebagai kelengkapan berkas rekonsiliasi pengesahan belanja modal.'
      }
    ],
    kalimatPenutup = 'Demikian surat pengantar ini kami sampaikan untuk dipergunakan sebagaimana mestinya. Atas perhatian dan kerja sama Saudara, kami ucapkan terima kasih.',
    tanggal = '08 September 2026',
    kota = 'Tasikmalaya',
    pengirimJabatan = 'Kepala Biro Umum dan Keuangan,',
    pengirimNama = 'Dr. Nana Sujana, Drs., M.Si.',
    pengirimNip = '196808301989031004',
    penerimaTanggal = '',
    penerimaJabatan = '',
    penerimaNama = '',
    penerimaNip = '',
    tteVerified = true
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      className="a4-sheet pasal47-with-kop p-6 sm:p-10 max-w-3xl mx-auto bg-white border border-black rounded-none shadow-none print:shadow-none print:border-none print:m-0 print:max-w-full text-black font-serif leading-normal"
    >
      {/* Kop Surat Resmi Universitas Siliwangi */}
      <KopSuratUnsil unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id} />

      {/* Judul & Nomor Surat Pengantar (Sesuai Gambar 5: Nomor Tanpa Titik Dua) */}
      <div className="naskah-judul-block text-center font-serif text-black my-5">
        <h1 className="text-sm sm:text-base font-bold tracking-wider uppercase text-black">
          SURAT PENGANTAR
        </h1>
        <p className="text-xs font-serif text-black mt-0.5">
          Nomor {nomorSurat || '........./...../...../.........'}
        </p>
      </div>

      {/* Tujuan Surat (Sesuai Gambar 5) */}
      <div className="text-xs font-serif text-black mb-4 space-y-0.5">
        <p>
          Yth. {tujuan || <span className="text-slate-400 select-none">...................................................</span>}
        </p>
        <p className="text-black">
          {tujuanInstansi || (tujuan ? '' : <span className="text-slate-400 select-none">...................................................</span>)}
        </p>
      </div>

      {/* Pembuka Sesuai Gambar 5 */}
      <p className="text-xs font-serif text-black mb-2">
        Bersama ini kami sampaikan:
      </p>

      {/* Tabel 4 Kolom: No. | Jenis Dokumen/Barang | Jumlah | Keterangan (Sesuai Gambar 5) */}
      <div className="mb-4 overflow-x-auto">
        <table className="w-full border-collapse border border-black text-xs font-serif">
          <thead>
            <tr className="border-b border-black text-center font-normal text-black">
              <th className="border-r border-black p-2 w-10 text-center font-normal">No.</th>
              <th className="border-r border-black p-2 text-center font-normal">Jenis Dokumen/Barang</th>
              <th className="border-r border-black p-2 w-28 text-center font-normal">Jumlah</th>
              <th className="p-2 w-44 text-center font-normal">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black text-black">
            {items && items.length > 0 ? (
              items.map((item, idx) => (
                <tr key={idx} className="align-top">
                  <td className="border-r border-black p-2 text-center">{idx + 1}.</td>
                  <td className="border-r border-black p-2 leading-relaxed">{item.jenis}</td>
                  <td className="border-r border-black p-2 text-center leading-relaxed">{item.jumlah}</td>
                  <td className="p-2 leading-relaxed">{item.keterangan}</td>
                </tr>
              ))
            ) : (
              <>
                <tr className="h-16">
                  <td className="border-r border-black p-2 text-center text-slate-400"></td>
                  <td className="border-r border-black p-2"></td>
                  <td className="border-r border-black p-2"></td>
                  <td className="p-2"></td>
                </tr>
                <tr className="h-16">
                  <td className="border-r border-black p-2 text-center text-slate-400"></td>
                  <td className="border-r border-black p-2"></td>
                  <td className="border-r border-black p-2"></td>
                  <td className="p-2"></td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Kalimat Penutup Sesuai Gambar 5 */}
      <div className="text-xs font-serif text-black mb-6 text-justify leading-relaxed">
        {kalimatPenutup ? (
          <p>
            {kalimatPenutup.toLowerCase().startsWith('kalimat penutup') ? (
              kalimatPenutup
            ) : (
              kalimatPenutup
            )}
          </p>
        ) : (
          <p className="text-slate-400 select-none">
            Kalimat penutup <span className="tracking-widest">........................................................................................................................</span>
          </p>
        )}
      </div>

      {/* Area Tanda Tangan Dua Sisi (Pengirim Kanan, Tanda Terima Kiri Bawah Sesuai Gambar 5) */}
      <div className="mt-6 flex justify-between items-start gap-8 pt-1 text-black font-serif text-xs">
        {/* Kolom Kiri Bawah: Penerima Naskah Sesuai Gambar 5 */}
        <div className="w-64 text-left space-y-1">
          <p className="text-xs">
            Diterima tanggal {penerimaTanggal || <span className="text-slate-400 select-none">.........................</span>}
          </p>
          <p className="text-xs">
            Jabatan {penerimaJabatan || <span className="text-slate-400 select-none">.........................</span>}
          </p>

          <div className="my-2 min-h-[48px] flex items-center text-[10px] text-black/60 italic font-serif">
            tanda tangan dan cap dinas
          </div>

          <div>
            <p className="text-xs text-black">
              Nama {penerimaNama || <span className="text-slate-400 select-none">.........................</span>}
            </p>
            <p className="text-[10.5px] text-black mt-0.5">
              NIP {penerimaNip || <span className="text-slate-400 select-none">.........................</span>}
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Pengirim Naskah Dinas Sesuai Gambar 5 */}
        <div className="w-64 sm:w-72 text-left">
          <p className="text-xs mb-0.5">{tanggal || 'Tanggal'}</p>
          <p className="text-xs mb-1 font-normal">{pengirimJabatan || 'Nama Jabatan,'}</p>

          <div className="my-2 min-h-[48px] flex items-center justify-center">
            {tteVerified ? (
              <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                <p className="font-bold uppercase tracking-wide mt-0.5">{pengirimNama}</p>
                <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
              </div>
            ) : (
              <div className="h-10 flex items-center justify-center text-black/60 italic text-[10px] font-serif">
                tanda tangan dan cap dinas
              </div>
            )}
          </div>

          <p className="font-normal text-xs text-black">{pengirimNama || 'Nama Pejabat'}</p>
          <p className="text-[10.5px] text-black mt-0.5 font-serif">
            {pengirimNip ? `NIP ${pengirimNip}` : 'NIP'}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 18. FORMAT PENGUMUMAN
 * Berdasarkan Naskah Dinas Resmi (Gambar 2)
 */
export const PengumumanTemplateView = ({ data }) => {
  const {
    nomorSurat = '082/UN58/PK.01/2026',
    tentang = 'LIBUR HARI RAYA KEAGAMAAN DAN PENYESUAIAN LAYANAN ADMINISTRASI AKADEMIK UNIVERSITAS SILIWANGI TAHUN 2026',
    isiParagraf = [
      'Sehubungan dengan penetapan Libur Nasional dan Cuti Bersama Hari Raya Keagamaan Tahun 2026 oleh Pemerintah Republik Indonesia, dengan ini kami sampaikan ketentuan penyelenggaraan kegiatan akademik dan administrasi di lingkungan Universitas Siliwangi sebagai berikut:',
      '1. Seluruh kegiatan perkuliahan, praktikum laboratorium, dan bimbingan akademik diliburkan terhitung mulai hari Jumat, 11 September 2026 sampai dengan hari Rabu, 16 September 2026.',
      '2. Pelayanan administrasi persuratan digital, pengajuan naskah dinas, dan pengesahan TTE melalui aplikasi SILOKA tetap dapat diakses secara daring oleh civitas akademika selama periode libur.',
      '3. Seluruh unit kerja wajib memastikan keamanan sarana prasarana, mematikan sambungan listrik dan instalasi komputer yang tidak digunakan sebelum meninggalkan ruangan kantor.',
      '4. Kegiatan perkuliahan tatap muka dan pelayanan administrasi perkantoran dibuka kembali secara normal pada hari Kamis, 17 September 2026 pukul 07.30 WIB.',
      'Demikian pengumuman ini disampaikan untuk diketahui dan dipedomani oleh seluruh dosen, tenaga kependidikan, serta mahasiswa Universitas Siliwangi.'
    ],
    tanggal = '08 September 2026',
    kota = 'Tasikmalaya',
    jabatan = 'Rektor Universitas Siliwangi',
    namaPejabat = 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nip = '196708161996031001',
    tteVerified = true
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      className="a4-sheet pasal47-with-kop p-6 sm:p-10 max-w-3xl mx-auto bg-white border border-black rounded-none shadow-none print:shadow-none print:border-none print:m-0 print:max-w-full text-black font-serif leading-normal"
    >
      {/* Kop Surat Resmi Universitas Siliwangi */}
      <KopSuratUnsil unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id} />

      {/* Judul & Nomor Pengumuman (Pasal 46: 1 spasi antarbaris judul, 2 spasi ke isi) */}
      <div className="naskah-judul-block text-center font-serif text-black my-6 space-y-1">
        <h1 className="text-sm sm:text-base font-bold tracking-wider uppercase">
          PENGUMUMAN
        </h1>
        <p className="text-xs text-black">
          Nomor {nomorSurat}
        </p>

        {tentang && (
          <div className="mt-3 font-bold uppercase tracking-wide max-w-xl mx-auto text-xs leading-relaxed">
            <p className="text-[11px] text-black mb-0.5">TENTANG</p>
            <p className="underline decoration-1 underline-offset-4">{tentang}</p>
          </div>
        )}
      </div>

      {/* Isi Paragraf Pengumuman */}
      <div className="text-xs font-serif text-black space-y-3 leading-relaxed text-justify mb-8">
        {Array.isArray(isiParagraf) ? (
          isiParagraf.map((paragraf, idx) => (
            <p key={idx} className={idx === 0 ? 'indent-8' : ''}>
              {paragraf}
            </p>
          ))
        ) : (
          <p className="whitespace-pre-line leading-relaxed indent-8">
            {isiParagraf}
          </p>
        )}
      </div>

      {/* Blok Tanda Tangan Kanan */}
      <div className="mt-10 text-xs font-serif flex justify-end">
        <OfficialSignatureBlock
          tempatTanggal={`${kota ? `${kota}, ` : ''}${tanggal}`}
          namaJabatan={jabatan}
          namaPejabat={namaPejabat}
          nip={nip}
          tteVerified={tteVerified}
          keterangan="tanda tangan dan cap dinas"
        />
      </div>
    </div>
  );
};

/**
 * 19. FORMAT NOTULA
 * Sesuai Gambar Spesimen Resmi Peraturan Rektor No. 3/2023 (Contoh 19 / Gambar 1)
 */
export const NotulaTemplateView = ({ data }) => {
  const {
    namaRapat = 'Rapat Koordinasi Evaluasi Implementasi Tata Naskah Dinas Elektronik SILOKA',
    hariTanggal = 'Selasa, 08 September 2026',
    pukul = '09.00 - 12.00 WIB',
    tempat = 'Ruang Sidang Rektorat Lt. 2 Universitas Siliwangi',
    susunanAcara = [
      'Pembukaan oleh Pembawa Acara',
      'Pengarahan Rektor Universitas Siliwangi',
      'Pemaparan Laporan Kemajuan Penerapan TTE BSrE oleh Tim SILOKA',
      'Diskusi dan Tanggapan Dekan serta Kepala Biro',
      'Perumusan Simpulan dan Penutup'
    ],
    pemimpinRapat = 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng. (Rektor)',
    notulis = 'Rina Permatasari, S.Sos. (Pranata Humas)',
    pesertaRapat = [
      'Wakil Rektor Bidang Akademik',
      'Wakil Rektor Bidang Umum dan Keuangan',
      'Wakil Rektor Bidang Kemahasiswaan dan Alumni',
      'Para Dekan Fakultas di lingkungan UNSIL',
      'Kepala Lembaga (LPPM dan LP3M)',
      'Koordinator Pusat Teknologi Informasi dan Pangkalan Data'
    ],
    persoalanDibahas = 'Integrasi menyeluruh modul tanda tangan digital bersertifikat BSrE BSSN ke seluruh 20 format tata naskah dinas resmi SILOKA serta penguatan validasi QR-Code verifikasi dokumen kedinasan.',
    tanggapanPeserta = 'Para Dekan menyetujui percepatan implementasi template resmi naskah dinas per September 2026 dan meminta pelatihan teknis (Bimtek) bagi seluruh staf tata usaha fakultas.',
    simpulan = 'Seluruh fakultas dan biro diwajibkan menggunakan aplikasi SILOKA untuk pembuatan dan pengesahan seluruh naskah dinas resmi mulai pekan depan. Bimtek tata persuratan elektronik diagendakan pada hari Jumat, 11 September 2026.',
    jabatanPenandatangan = 'Pemimpin Rapat,',
    namaPenandatangan = 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nipPenandatangan = '196708161996031001',
    tteVerified = true
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      className="a4-sheet pasal47-with-kop p-6 sm:p-10 max-w-3xl mx-auto bg-white border border-black rounded-none shadow-none print:shadow-none print:border-none print:m-0 print:max-w-full text-black font-serif leading-normal"
    >
      {/* Kop Surat Resmi Universitas Siliwangi */}
      <KopSuratUnsil unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id} />

      {/* Judul Notula (Sesuai Gambar 1: Kapital Bold Tanpa Garis Bawah) */}
      <div className="naskah-judul-block text-center font-serif text-black my-5">
        <h1 className="text-sm sm:text-base font-bold tracking-wider uppercase text-black">
          NOTULA
        </h1>
      </div>

      {/* Metadata Rapat (Sesuai Gambar 1: Struktur Titik Dua Sejajar Tanpa Garis Pembatas) */}
      <div className="text-xs font-serif text-black space-y-1.5 mb-4">
        <div className="flex items-start">
          <span className="w-36 sm:w-40 shrink-0 font-normal">Nama rapat</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="flex-1 font-serif text-black">
            {namaRapat || <span className="text-slate-400 select-none">...........................................................................</span>}
          </span>
        </div>
        <div className="flex items-start">
          <span className="w-36 sm:w-40 shrink-0 font-normal">Hari, tanggal</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="flex-1 font-serif text-black">
            {hariTanggal || <span className="text-slate-400 select-none">...........................................................................</span>}
          </span>
        </div>
        <div className="flex items-start">
          <span className="w-36 sm:w-40 shrink-0 font-normal">Pukul</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="flex-1 font-serif text-black">
            {pukul || <span className="text-slate-400 select-none">...........................................................................</span>}
          </span>
        </div>
        <div className="flex items-start">
          <span className="w-36 sm:w-40 shrink-0 font-normal">Tempat</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="flex-1 font-serif text-black">
            {tempat || <span className="text-slate-400 select-none">...........................................................................</span>}
          </span>
        </div>

        {/* Susunan Acara */}
        <div className="flex items-start">
          <span className="w-36 sm:w-40 shrink-0 font-normal">Susunan acara</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <div className="flex-1 font-serif text-black space-y-0.5">
            {susunanAcara && susunanAcara.length > 0 ? (
              susunanAcara.map((acara, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="w-4">{idx + 1}.</span>
                  <span>{acara}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-400 select-none space-y-0.5">
                <p>1. .....................................................................................</p>
                <p className="pl-4">2. dan seterusnya.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bagian Pemimpin, Notulis, dan Peserta Rapat (Sesuai Gambar 1) */}
      <div className="text-xs font-serif text-black space-y-1.5 my-4">
        <div className="flex items-start">
          <span className="w-36 sm:w-40 shrink-0 font-normal">Pemimpin rapat</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="flex-1 font-serif text-black">
            {pemimpinRapat || <span className="text-slate-400 select-none">...........................................................................</span>}
          </span>
        </div>
        <div className="flex items-start">
          <span className="w-36 sm:w-40 shrink-0 font-normal">Pencatat/notulis</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="flex-1 font-serif text-black">
            {notulis || <span className="text-slate-400 select-none">...........................................................................</span>}
          </span>
        </div>

        {/* Peserta Rapat */}
        <div className="flex items-start">
          <span className="w-36 sm:w-40 shrink-0 font-normal">Peserta rapat</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <div className="flex-1 font-serif text-black space-y-0.5">
            {pesertaRapat && pesertaRapat.length > 0 ? (
              pesertaRapat.map((peserta, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="w-4">{idx + 1}.</span>
                  <span>{peserta}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-400 select-none space-y-0.5">
                <p>1. .....................................................................................</p>
                <p className="pl-4">2. dan seterusnya.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bagian Substansi Rapat: Persoalan, Tanggapan, Simpulan (Sesuai Gambar 1) */}
      <div className="text-xs font-serif text-black space-y-2.5 my-5 text-justify leading-relaxed">
        <div className="flex items-start">
          <span className="w-48 sm:w-52 shrink-0 font-normal">1. Persoalan yang dibahas</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <div className="flex-1 font-serif text-black">
            {persoalanDibahas || (
              <span className="text-slate-400 select-none">...................................................................................................................</span>
            )}
          </div>
        </div>

        <div className="flex items-start">
          <span className="w-48 sm:w-52 shrink-0 font-normal">2. Tanggapan peserta rapat</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <div className="flex-1 font-serif text-black">
            {tanggapanPeserta || (
              <span className="text-slate-400 select-none">...................................................................................................................</span>
            )}
          </div>
        </div>

        <div className="flex items-start">
          <span className="w-48 sm:w-52 shrink-0 font-normal">3. Simpulan</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <div className="flex-1 font-serif text-black">
            {simpulan || (
              <span className="text-slate-400 select-none">...................................................................................................................</span>
            )}
          </div>
        </div>
      </div>

      {/* Blok Tanda Tangan Kanan Sesuai Gambar 1 (Nama jabatan, tanda tangan, Nama pejabat, NIP) */}
      <div className="mt-8 text-xs font-serif flex justify-end">
        <div className="w-64 sm:w-72 text-left">
          <p className="text-xs mb-1 font-normal">{jabatanPenandatangan || 'Nama jabatan,'}</p>

          <div className="my-2 min-h-[48px] flex items-center justify-center">
            {tteVerified ? (
              <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                <p className="font-bold uppercase tracking-wide mt-0.5">{namaPenandatangan}</p>
                <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
              </div>
            ) : (
              <div className="h-10 flex items-center justify-center text-black/60 italic text-[10px] font-serif">
                tanda tangan
              </div>
            )}
          </div>

          <p className="font-normal text-xs text-black">{namaPenandatangan || 'Nama pejabat'}</p>
          <p className="text-[10.5px] text-black mt-0.5 font-serif">
            {nipPenandatangan ? `NIP ${nipPenandatangan}` : 'NIP'}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 20. FORMAT LAPORAN
 * Sesuai Gambar Spesimen Resmi Peraturan Rektor No. 3/2023 (Contoh 20 / Gambar 2)
 */
export const LaporanTemplateView = ({ data }) => {
  const {
    tentang = 'PELAKSANAAN AUDIT KESIAPAN TEKNOLOGI DAN IMPLEMENTASI TATA NASKAH DINAS ELEKTRONIK APLIKASI SILOKA UNIVERSITAS SILIWANGI TAHUN 2026',
    latarBelakang = 'Dalam rangka reformasi birokrasi dan percepatan transformasi digital persuratan kedinasan di lingkungan Universitas Siliwangi sesuai Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi tentang Tata Naskah Dinas serta Peraturan Rektor Nomor 3 Tahun 2023, dipandang perlu menyusun laporan pelaksanaan audit kesiapan sistem SILOKA.',
    dasar = '1. Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;\n2. Undang-Undang Nomor 43 Tahun 2009 tentang Kearsipan;\n3. Peraturan Rektor Universitas Siliwangi Nomor 3 Tahun 2023 tentang Tata Naskah Dinas di Lingkungan Universitas Siliwangi;\n4. Surat Tugas Rektor Universitas Siliwangi Nomor 042/UN58/KP.03/2026 tanggal 01 September 2026.',
    ruangLingkup = 'Ruang lingkup pelaksanaan kegiatan meliputi pengujian 20 format naskah dinas resmi, integrasi Tanda Tangan Elektronik (TTE) tersertifikasi BSrE BSSN, keandalan server basis data surat dinas, serta pelatihan operasional bagi staf pengadministrasi persuratan.',
    kegiatanDilaksanakan = '1. Melakukan validasi kesesuaian layout visual 20 format naskah dinas dengan pedoman tata naskah dinas resmi UNSIL.\n2. Melaksanakan uji coba penerbitan TTE BSrE dengan enkripsi hash dokumen dan stempel QR-Code verifikasi dinas.\n3. Menyelenggarakan bimbingan teknis (Bimtek) administrasi naskah dinas elektronik kepada seluruh perwakilan fakultas dan unit kerja.',
    hasilDicapai = '1. Sebanyak 20 format naskah dinas resmi berhasil diintegrasikan dengan sempurna ke dalam aplikasi SILOKA.\n2. Tingkat kepatuhan format persuratan kedinasan mencapai 100% dan siap dioperasikan penuh pada semester ganjil TA 2026/2027.\n3. Telah tersertifikasi secara elektronik dan aman dari risiko pemalsuan dokumen kedinasan.',
    penutup = 'Demikian laporan ini dibuat dengan sebenarnya sebagai bahan evaluasi dan pertanggungjawaban pelaksanaan kegiatan. Atas perhatian dan dukungan pimpinan Universitas Siliwangi, diucapkan terima kasih.',
    kota = 'Tasikmalaya',
    tanggal = '08 September 2026',
    jabatanPembuat = 'Nama Jabatan Pembuat Laporan,',
    namaPembuat = 'Dr. Ade Rustiana, Drs., M.Si.',
    nipPembuat = '196801021992031002',
    tteVerified = true
  } = data || {};

  const isBlangko = !latarBelakang && !dasar && !ruangLingkup && !kegiatanDilaksanakan && !hasilDicapai && !penutup;

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      className="a4-sheet pasal47-with-kop p-6 sm:p-10 max-w-3xl mx-auto bg-white border border-black rounded-none shadow-none print:shadow-none print:border-none print:m-0 print:max-w-full text-black font-serif leading-normal"
    >
      {/* Kop Surat Resmi Universitas Siliwangi */}
      <KopSuratUnsil unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id} />

      {/* Judul Laporan (Sesuai Gambar 2: LAPORAN / TENTANG / Titik-titik judul, Tanpa Nomor) */}
      <div className="naskah-judul-block text-center font-serif text-black my-5 space-y-0.5">
        <h1 className="text-sm sm:text-base font-bold tracking-wider uppercase text-black">
          LAPORAN
        </h1>
        <h2 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-black">
          TENTANG
        </h2>
        <div className="pt-1 max-w-xl mx-auto">
          {tentang ? (
            <p className="text-xs sm:text-sm font-normal uppercase tracking-wide leading-relaxed">
              {tentang}
            </p>
          ) : (
            <p className="text-xs text-slate-400 select-none tracking-widest">
              ........................................................................................................
            </p>
          )}
        </div>
      </div>

      {/* Sistematika Laporan A-D Sesuai Gambar 2 */}
      <div className="text-xs font-serif text-black space-y-3.5 text-justify leading-relaxed my-6">
        {/* A. Pendahuluan */}
        <div className="space-y-1.5">
          <p className="font-normal text-black">A. Pendahuluan</p>
          
          <div className="pl-6 space-y-1.5">
            <div>
              <p className="font-normal text-black">1. Latar Belakang</p>
              {latarBelakang ? (
                <p className="pl-4 mt-0.5 whitespace-pre-line">{latarBelakang}</p>
              ) : (
                <p className="pl-4 text-slate-400 select-none tracking-widest">........................................................................................................................</p>
              )}
            </div>
            <div>
              <p className="font-normal text-black">2. Dasar</p>
              {dasar ? (
                <p className="pl-4 mt-0.5 whitespace-pre-line">{dasar}</p>
              ) : (
                <p className="pl-4 text-slate-400 select-none tracking-widest">........................................................................................................................</p>
              )}
            </div>
            <div>
              <p className="font-normal text-black">3. Ruang Lingkup</p>
              {ruangLingkup ? (
                <p className="pl-4 mt-0.5 whitespace-pre-line">{ruangLingkup}</p>
              ) : (
                <p className="pl-4 text-slate-400 select-none tracking-widest">........................................................................................................................</p>
              )}
            </div>
          </div>
        </div>

        {/* B. Kegiatan yang Dilaksanakan */}
        <div className="space-y-1">
          <p className="font-normal text-black">B. Kegiatan yang Dilaksanakan</p>
          <div className="pl-6">
            {kegiatanDilaksanakan ? (
              <p className="whitespace-pre-line">{kegiatanDilaksanakan}</p>
            ) : (
              <div className="space-y-1 text-slate-400 select-none tracking-widest">
                <p>....................................................................................................................................</p>
                <p>....................................................................................................................................</p>
              </div>
            )}
          </div>
        </div>

        {/* C. Hasil yang Dicapai */}
        <div className="space-y-1">
          <p className="font-normal text-black">C. Hasil yang Dicapai</p>
          <div className="pl-6">
            {hasilDicapai ? (
              <p className="whitespace-pre-line">{hasilDicapai}</p>
            ) : (
              <div className="space-y-1 text-slate-400 select-none tracking-widest">
                <p>....................................................................................................................................</p>
                <p>....................................................................................................................................</p>
              </div>
            )}
          </div>
        </div>

        {/* D. Penutup Sesuai Gambar 2 (Bukan E. Penutup) */}
        <div className="space-y-1">
          <p className="font-normal text-black">D. Penutup</p>
          <div className="pl-6">
            {penutup ? (
              <p className="whitespace-pre-line">{penutup}</p>
            ) : (
              <p className="text-slate-400 select-none tracking-widest">....................................................................................................................................</p>
            )}
          </div>
        </div>
      </div>

      {/* Blok Tanda Tangan Kanan Sesuai Gambar 2 */}
      <div className="mt-8 text-xs font-serif flex justify-end">
        <div className="w-64 sm:w-72 text-left">
          <p className="text-xs">
            Dibuat di {kota || <span className="text-slate-400 select-none">....................</span>}
          </p>
          <p className="text-xs mb-1">
            pada tanggal {tanggal || <span className="text-slate-400 select-none">.................</span>}
          </p>
          <p className="text-xs mb-1 font-normal">
            {jabatanPembuat || 'Nama Jabatan Pembuat Laporan,'}
          </p>

          <div className="my-2 min-h-[52px] flex items-center justify-center">
            {tteVerified ? (
              <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                <p className="font-bold uppercase tracking-wide mt-0.5">{namaPembuat}</p>
                <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
              </div>
            ) : (
              <div className="h-12 flex flex-col items-center justify-center text-black/60 italic text-[10px] font-serif leading-tight text-center">
                <span>Tanda tangan, cap jabatan atau</span>
                <span>cap dinas</span>
              </div>
            )}
          </div>

          <p className="font-normal text-xs text-black">{namaPembuat || 'Nama Pembuat Laporan'}</p>
          <p className="text-[10.5px] text-black mt-0.5 font-serif">
            {nipPembuat ? `NIP ${nipPembuat}` : 'NIP'}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 21. FORMAT TELAAH STAF
 * Sesuai Gambar Spesimen Resmi Peraturan Rektor No. 3/2023 (Contoh 21 / Gambar 3)
 */
export const TelaahStafTemplateView = ({ data }) => {
  const {
    tentang = 'OPTIMALISASI KEAMANAN DATA KEARSIPAN DAN IMPLEMENTASI TATA NASKAH DINAS ELEKTRONIK PADA APLIKASI SILOKA UNIVERSITAS SILIWANGI',
    kepada = 'Rektor Universitas Siliwangi',
    dari = 'Kepala Biro Umum dan Keuangan',
    tanggal = '08 September 2026',
    nomor = '',
    lampiran = '1 (satu) Berkas',
    hal = 'Telaah Staf Peningkatan Keandalan Server dan Sertifikasi TTE BSrE SILOKA',
    persoalan = 'Bagian persoalan memuat pernyataan singkat dan jelas tentang persoalan yang akan dipecahkan.',
    pranggapan = 'Pranggapan memuat dugaan yang beralasan berdasarkan data dan saling berhubungan sesuai dengan situasi yang dihadapi dan merupakan kemungkinan kejadian di masa mendatang.',
    faktaMempengaruhi = 'Bagian fakta yang mempengaruhi memuat fakta yang merupakan landasan analisis dan pemecahan persoalan.',
    analisis = 'Bagian ini memuat analisis pengaruh pranggapan dan fakta terhadap persoalan serta akibatnya, hambatan serta keuntungan dan kerugiannya, serta pemecahan atau cara bertindak yang mungkin atau dapat dilakukan.',
    simpulan = 'Bagian simpulan memuat intisari hasil analisis dan pilihan satu cara bertindak atau jalan keluar sebagai pemecahan persoalan yang dihadapi.',
    saran = 'Bagian saran memuat secara ringkas dan jelas tentang saran tindakan untuk mengatasi persoalan yang dihadapi.',
    jabatanPembuat = 'Nama jabatan,',
    namaPembuat = 'Nama lengkap',
    nipPembuat = '',
    tteVerified = true,
    showKopSurat = false
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop={showKopSurat ? 'true' : 'false'}
      className={`a4-sheet ${showKopSurat ? 'pasal47-with-kop' : 'pasal47-without-kop'} p-6 sm:p-10 max-w-3xl mx-auto bg-white border border-black rounded-none shadow-none print:shadow-none print:border-none print:m-0 print:max-w-full text-black font-serif leading-normal`}
    >
      {/* Kop Surat Opsional (Secara Spesimen Tanpa Kop Surat) */}
      {showKopSurat && <KopSuratUnsil unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id} />}

      {/* Header Judul Sesuai Gambar 3: TELAAH STAF / TENTANG / Titik-titik */}
      <div className="naskah-judul-block text-center font-serif text-black my-5 space-y-0.5">
        <h1 className="text-sm sm:text-base font-bold tracking-wider uppercase text-black">
          TELAAH STAF
        </h1>
        <h2 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-black">
          TENTANG
        </h2>
        <div className="pt-1 max-w-xl mx-auto">
          {tentang ? (
            <p className="text-xs sm:text-sm font-normal uppercase tracking-wide leading-relaxed">
              {tentang}
            </p>
          ) : (
            <p className="text-xs text-slate-400 select-none tracking-widest">
              ........................................................................................................
            </p>
          )}
        </div>
      </div>

      {/* Bagian Metadata: Kepada, Dari, Tanggal, Nomor, Lampiran, Hal (Titik Dua Sejajar Sesuai Gambar 3) */}
      <div className="text-xs font-serif text-black my-6 space-y-1.5 max-w-xl">
        <div className="flex items-baseline">
          <span className="w-24 sm:w-28 shrink-0 font-normal">Kepada</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="flex-1 font-serif text-black">
            {kepada || <span className="text-slate-400 select-none">................................................................</span>}
          </span>
        </div>
        <div className="flex items-baseline">
          <span className="w-24 sm:w-28 shrink-0 font-normal">Dari</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="flex-1 font-serif text-black">
            {dari || <span className="text-slate-400 select-none">................................................................</span>}
          </span>
        </div>
        <div className="flex items-baseline">
          <span className="w-24 sm:w-28 shrink-0 font-normal">Tanggal</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="flex-1 font-serif text-black">
            {tanggal || <span className="text-slate-400 select-none">................................................................</span>}
          </span>
        </div>
        <div className="flex items-baseline">
          <span className="w-24 sm:w-28 shrink-0 font-normal">Nomor</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="flex-1 font-serif text-black">
            {nomor || <span className="text-slate-400 select-none">................................................................</span>}
          </span>
        </div>
        <div className="flex items-baseline">
          <span className="w-24 sm:w-28 shrink-0 font-normal">Lampiran</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="flex-1 font-serif text-black">
            {lampiran || <span className="text-slate-400 select-none">................................................................</span>}
          </span>
        </div>
        <div className="flex items-baseline">
          <span className="w-24 sm:w-28 shrink-0 font-normal">Hal</span>
          <span className="w-4 shrink-0 text-center">:</span>
          <span className="flex-1 font-serif text-black">
            {hal || <span className="text-slate-400 select-none">................................................................</span>}
          </span>
        </div>
      </div>

      {/* Bagian Sistematika I s.d. VI Sesuai Gambar 3 */}
      <div className="text-xs font-serif text-black space-y-4 text-justify leading-relaxed mb-8">
        {/* I. Persoalan */}
        <div className="space-y-1">
          <div className="flex gap-2.5 font-normal text-black">
            <span className="w-6 shrink-0">I.</span>
            <span>Persoalan</span>
          </div>
          <div className="pl-8 text-black whitespace-pre-line leading-relaxed">
            {persoalan || (
              <p className="text-slate-400 select-none">
                Bagian persoalan memuat pernyataan singkat dan jelas tentang persoalan yang akan dipecahkan.
              </p>
            )}
          </div>
        </div>

        {/* II. Pranggapan */}
        <div className="space-y-1">
          <div className="flex gap-2.5 font-normal text-black">
            <span className="w-6 shrink-0">II.</span>
            <span>Pranggapan</span>
          </div>
          <div className="pl-8 text-black whitespace-pre-line leading-relaxed">
            {pranggapan || (
              <p className="text-slate-400 select-none">
                Pranggapan memuat dugaan yang beralasan berdasarkan data dan saling berhubungan sesuai dengan situasi yang dihadapi dan merupakan kemungkinan kejadian di masa mendatang.
              </p>
            )}
          </div>
        </div>

        {/* III. Fakta-fakta yang mempengaruhi */}
        <div className="space-y-1">
          <div className="flex gap-2.5 font-normal text-black">
            <span className="w-6 shrink-0">III.</span>
            <span>Fakta-fakta yang mempengaruhi</span>
          </div>
          <div className="pl-8 text-black whitespace-pre-line leading-relaxed">
            {faktaMempengaruhi || (
              <p className="text-slate-400 select-none">
                Bagian fakta yang mempengaruhi memuat fakta yang merupakan landasan analisis dan pemecahan persoalan.
              </p>
            )}
          </div>
        </div>

        {/* IV. Analisis */}
        <div className="space-y-1">
          <div className="flex gap-2.5 font-normal text-black">
            <span className="w-6 shrink-0">IV.</span>
            <span>Analisis</span>
          </div>
          <div className="pl-8 text-black whitespace-pre-line leading-relaxed">
            {analisis || (
              <p className="text-slate-400 select-none">
                Bagian ini memuat analisis pengaruh pranggapan dan fakta terhadap persoalan serta akibatnya, hambatan serta keuntungan dan kerugiannya, serta pemecahan atau cara bertindak yang mungkin atau dapat dilakukan.
              </p>
            )}
          </div>
        </div>

        {/* V. Simpulan */}
        <div className="space-y-1">
          <div className="flex gap-2.5 font-normal text-black">
            <span className="w-6 shrink-0">V.</span>
            <span>Simpulan</span>
          </div>
          <div className="pl-8 text-black whitespace-pre-line leading-relaxed">
            {simpulan || (
              <p className="text-slate-400 select-none">
                Bagian simpulan memuat intisari hasil analisis dan pilihan satu cara bertindak atau jalan keluar sebagai pemecahan persoalan yang dihadapi.
              </p>
            )}
          </div>
        </div>

        {/* VI. Saran */}
        <div className="space-y-1">
          <div className="flex gap-2.5 font-normal text-black">
            <span className="w-6 shrink-0">VI.</span>
            <span>Saran</span>
          </div>
          <div className="pl-8 text-black whitespace-pre-line leading-relaxed">
            {saran || (
              <p className="text-slate-400 select-none">
                Bagian saran memuat secara ringkas dan jelas tentang saran tindakan untuk mengatasi persoalan yang dihadapi.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Blok Tanda Tangan Kanan Bawah Sesuai Gambar 3 */}
      <div className="mt-8 text-xs font-serif flex justify-end">
        <div className="w-64 sm:w-72 text-left">
          <p className="text-xs mb-1 font-normal">
            {jabatanPembuat || 'Nama jabatan,'}
          </p>

          <div className="my-2 min-h-[48px] flex items-center justify-center">
            {tteVerified ? (
              <div className="w-full py-1.5 px-2 border border-black bg-stone-50/50 text-[10px] text-black text-center font-serif leading-tight">
                <p className="font-semibold">Ditandatangani secara elektronik oleh:</p>
                <p className="font-bold uppercase tracking-wide mt-0.5">{namaPembuat}</p>
                <p className="text-[9px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
              </div>
            ) : (
              <div className="h-10 flex items-center justify-center text-black/60 italic text-[10px] font-serif">
                tanda tangan
              </div>
            )}
          </div>

          <p className="font-normal text-xs text-black">{namaPembuat || 'Nama lengkap'}</p>
          {nipPembuat ? (
            <p className="text-[10.5px] text-black mt-0.5 font-serif">
              NIP {nipPembuat}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

/**
 * 22. FORMAT DISPOSISI REKTOR
 * Sesuai Gambar Acuan Resmi Lembar Disposisi Rektor Universitas Siliwangi
 * Lengkap dengan 5 Klasifikasi Keamanan, Metadata Agenda, 34 Tujuan Penerusan,
 * 24 Opsi Instruksi / Tindakan, Catatan, serta Pengesahan TTE BSrE Rektor.
 */
export const DAFTAR_PENERUSAN_REKTOR = [
  // Kolom Kiri (1-17)
  { id: 1, label: 'Ketua Senat Universitas' },
  { id: 2, label: 'Ketua SPI' },
  { id: 3, label: 'Wakil Rektor Bidang Akademik' },
  { id: 4, label: 'Wakil Rektor Bidang Keuangan dan Umum' },
  { id: 5, label: 'Wakil Rektor Bidang Kemahasiswaan dan Alumni' },
  { id: 6, label: 'Kepala BAKPK' },
  { id: 7, label: 'Kepala BKU' },
  { id: 8, label: 'Kepala LPPM' },
  { id: 9, label: 'Kepala LPMPP' },
  { id: 10, label: 'Dekan FKIP' },
  { id: 11, label: 'Dekan FEB' },
  { id: 12, label: 'Dekan FP' },
  { id: 13, label: 'Dekan FT' },
  { id: 14, label: 'Dekan FAI' },
  { id: 15, label: 'Dekan FIK' },
  { id: 16, label: 'Dekan FISIP' },
  { id: 17, label: 'Direktur Pascasarjana' },
  // Kolom Kanan (18-34)
  { id: 18, label: 'Kepala UPA Perpustakaan' },
  { id: 19, label: 'Kepala UPA Layanan Uji Kompetensi' },
  { id: 20, label: 'Kepala UPA Bahasa' },
  { id: 21, label: 'Kepala UPA Pengembangan Karir dan Kewirausahaan Mahasiswa' },
  { id: 22, label: 'Kepala UPA Teknologi, Informasi dan Komunikasi' },
  { id: 23, label: 'Kepala Bagian Akademik' },
  { id: 24, label: 'Ketua Tim Bidang Akademik' },
  { id: 25, label: 'Ketua Tim Bidang Kemahasiswaan dan Alumni' },
  { id: 26, label: 'Ketua Tim Bidang Kerja Sama' },
  { id: 27, label: 'Ketua Tim Bidang Perencanaan' },
  { id: 28, label: 'Kepala Bagian Umum' },
  { id: 29, label: 'Ketua Tim Bidang Keuangan' },
  { id: 30, label: 'Ketua Tim Bidang Kepegawaian' },
  { id: 31, label: 'Ketua Tim Bidang Hukum, Ketatausahaan, Organisasi dan Ketatalaksanaan' },
  { id: 32, label: 'Ketua Tim Kerumahtanggan dan BMN' },
  { id: 33, label: 'Ketua Tim Keprotokolan dan Humas' },
  { id: 34, label: 'Lainnya (Ketik Manual)', isCustom: true }
];

export const DAFTAR_INSTRUKSI_REKTOR = [
  // Kolom Kiri (1-12)
  { id: 'disp_1', label: 'Ikuti Disposisi Rektor' },
  { id: 'disp_2', label: 'Proses sesuai prosedur' },
  { id: 'disp_3', label: 'Selesaikan' },
  { id: 'disp_4', label: 'Tanggapan/saran tertulis)*' },
  { id: 'disp_5', label: 'Pelajari' },
  { id: 'disp_6', label: 'Untuk pertimbangan' },
  { id: 'disp_7', label: 'Perbaiki' },
  { id: 'disp_8', label: 'Siapkan dan buatkan konsep/bahan)*' },
  { id: 'disp_9', label: 'Buatkan undangan' },
  { id: 'disp_10', label: 'Untuk digunakan/ditindaklanjuti)*' },
  { id: 'disp_11', label: 'Tangani bersama' },
  { id: 'disp_12', label: 'Hadiri/wakili)*' },
  // Kolom Kanan (13-24)
  { id: 'disp_13', label: 'Untuk diketahui/perhatikan)*' },
  { id: 'disp_14', label: 'Check status/perkembangan)*' },
  { id: 'disp_15', label: 'Laporkan' },
  { id: 'disp_16', label: 'Dibantu' },
  { id: 'disp_17', label: 'Dapat disetujui' },
  { id: 'disp_18', label: 'Temui saya' },
  { id: 'disp_19', label: 'Adakan rapat' },
  { id: 'disp_20', label: 'Koordinasikan dengan...', hasInput: true },
  { id: 'disp_21', label: 'Jadwalkan/ingatkan)*' },
  { id: 'disp_22', label: 'Kirimkan segera' },
  { id: 'disp_23', label: 'Fotokopi/arsipkan)*' },
  { id: 'disp_24', label: 'Lainnya...', isCustom: true }
];

/**
 * Memetakan target disposisi (string atau array objek) ke daftar ID numerik (1-34)
 * untuk ditandai centang [✓] pada format cetak Contoh 21 (Disposisi Rektor).
 */
export const mapDisposisiTargetsToPenerusanIds = (targetsInput) => {
  if (!targetsInput) return [];
  const targetNames = [];

  if (Array.isArray(targetsInput)) {
    targetsInput.forEach((t) => {
      if (typeof t === 'string') targetNames.push(t);
      else if (t?.targetUnit) targetNames.push(t.targetUnit);
      else if (t?.nama) targetNames.push(t.nama);
    });
  } else if (typeof targetsInput === 'string') {
    targetsInput.split(',').forEach((s) => targetNames.push(s.trim()));
  }

  const clean = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const matchedIds = new Set();
  targetNames.forEach((targetName) => {
    const tClean = clean(targetName);
    if (!tClean) return;

    DAFTAR_PENERUSAN_REKTOR.forEach((item) => {
      const iClean = clean(item.label);
      if (tClean.includes(iClean) || iClean.includes(tClean)) {
        matchedIds.add(item.id);
      } else if (tClean.includes('wr1') || tClean.includes('warek1') || (tClean.includes('akademik') && !tClean.includes('bakpk'))) {
        if (item.id === 3) matchedIds.add(item.id);
      } else if (tClean.includes('wr2') || tClean.includes('warek2') || (tClean.includes('keuangan') && !tClean.includes('bku'))) {
        if (item.id === 4) matchedIds.add(item.id);
      } else if (tClean.includes('wr3') || tClean.includes('warek3') || (tClean.includes('kemahasiswaan') && !tClean.includes('bakpk'))) {
        if (item.id === 5) matchedIds.add(item.id);
      } else if (tClean.includes('bakpk')) {
        if (item.id === 6) matchedIds.add(item.id);
      } else if (tClean.includes('bku')) {
        if (item.id === 7) matchedIds.add(item.id);
      } else if (tClean.includes('hukum') || tClean.includes('hkok')) {
        if (item.id === 31) matchedIds.add(item.id);
      } else if (tClean.includes('humas') || tClean.includes('keprotokolan')) {
        if (item.id === 33) matchedIds.add(item.id);
      } else if (tClean.includes('perencanaan') && !tClean.includes('kepalabiro')) {
        if (item.id === 27) matchedIds.add(item.id);
      } else if (tClean.includes('kepegawaian')) {
        if (item.id === 30) matchedIds.add(item.id);
      } else if (tClean.includes('bmn') || tClean.includes('kerumahtanggaan')) {
        if (item.id === 32) matchedIds.add(item.id);
      } else if (tClean.includes('keuangan') && !tClean.includes('bku') && !tClean.includes('wr2')) {
        if (item.id === 29) matchedIds.add(item.id);
      } else if (tClean.includes('akademik') && (tClean.includes('tim') || tClean.includes('ketua'))) {
        if (item.id === 24) matchedIds.add(item.id);
      } else if ((tClean.includes('kemahasiswaan') || tClean.includes('alumni')) && (tClean.includes('tim') || tClean.includes('ketua'))) {
        if (item.id === 25) matchedIds.add(item.id);
      } else if ((tClean.includes('kerjasama') || tClean.includes('mitra')) && (tClean.includes('tim') || tClean.includes('ketua'))) {
        if (item.id === 26) matchedIds.add(item.id);
      } else if (tClean.includes('sekretarissenat') || tClean.includes('sekretarisspi')) {
        matchedIds.add(34);
      }
    });
  });

  return Array.from(matchedIds);
};

export const DisposisiRektorTemplateView = ({ data }) => {
  const {
    klasifikasi = 'Biasa', // 'Sangat Rahasia' | 'Rahasia' | 'Sangat Segera' | 'Segera' | 'Biasa'
    noAgenda = 'AGD/UN58/KU/0142/2026',
    tanggalTerima = '8 September 2026',
    tanggalSurat = '5 September 2026',
    nomorSurat = '087/KEMDIKBUD/DIKTI/TU/2026',
    asalSurat = 'Direktorat Jenderal Pendidikan Tinggi, Riset, dan Teknologi',
    hal = 'Permohonan Koordinasi dan Fasilitasi Kerja Sama Program Penguatan Riset Strategis Nasional',
    diteruskanKepada,
    diteruskanCustom = '',
    instruksiUntuk = ['disp_2', 'disp_10', 'disp_15', 'disp_20'], // array of IDs
    koordinasikanDengan = 'Wakil Rektor Bidang Keuangan & Kepala BKU',
    instruksiCustom = '',
    catatan = 'Segera telaah dan siapkan tim pendamping teknis untuk koordinasi dengan Ditjen Diktiristek. Laporkan progresnya minggu ini.',
    tempatTanggal = 'Tasikmalaya, 8 September 2026',
    namaRektor = 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
    nipRektor = '196708161996031001',
    tteVerified = true
  } = data || {};

  // Jika data memuat targets riil disposisi, petakan otomatis ke ID checklist
  const resolvedDiteruskanKepada = Array.isArray(diteruskanKepada) && diteruskanKepada.length > 0
    ? diteruskanKepada
    : ((data?.targets || data?.targetUnit)
      ? mapDisposisiTargetsToPenerusanIds(data.targets || data.targetUnit)
      : [4, 7, 26, 27]);

  let effectiveDiteruskanCustom = diteruskanCustom;
  if (!effectiveDiteruskanCustom && (data?.targets || data?.targetUnit)) {
    const rawTargets = Array.isArray(data?.targets) ? data.targets : [];
    const customTgt = rawTargets.find((t) => {
      const nm = String(t?.targetUnit || t?.nama || '').toLowerCase();
      return nm.includes('sekretaris senat') || nm.includes('sekretaris spi');
    });
    if (customTgt) {
      effectiveDiteruskanCustom = customTgt.targetUnit || customTgt.nama;
    } else if (
      typeof data?.targetUnit === 'string' &&
      (data.targetUnit.toLowerCase().includes('sekretaris senat') || data.targetUnit.toLowerCase().includes('sekretaris spi'))
    ) {
      effectiveDiteruskanCustom = data.targetUnit;
    }
  }

  const colKiriPenerusan = DAFTAR_PENERUSAN_REKTOR.slice(0, 17);
  const colKananPenerusan = DAFTAR_PENERUSAN_REKTOR.slice(17, 34);

  const colKiriInstruksi = DAFTAR_INSTRUKSI_REKTOR.slice(0, 12);
  const colKananInstruksi = DAFTAR_INSTRUKSI_REKTOR.slice(12, 24);

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      className="a4-sheet pasal47-with-kop p-4 sm:p-8 max-w-3xl mx-auto bg-white border border-black rounded-none shadow-none print:shadow-none print:border-none print:m-0 print:max-w-full text-black font-serif leading-tight"
    >
      {/* Outer Border Box Persis Gambar Acuan */}
      <div className="border-[1.5px] border-black">
        {/* Kop Surat Resmi UNSIL di Bagian Atas */}
        <div data-kop-naskah-dinas="true" className="kop-surat-unsil p-3 pb-2 border-b-[2px] border-black">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] shrink-0 flex items-center justify-center select-none">
              <img
                src="/unsil-logo.png"
                alt="Logo Resmi Universitas Siliwangi"
                className="w-full h-full object-contain select-none"
              />
            </div>
            <div className="flex-1 text-center font-serif leading-tight">
              <p className="text-[11px] sm:text-[12.5px] font-bold uppercase tracking-normal text-black leading-snug">
                KEMENTERIAN PENDIDIKAN, KEBUDAYAAN,
              </p>
              <p className="text-[11px] sm:text-[12.5px] font-bold uppercase tracking-normal text-black leading-snug">
                RISET, DAN TEKNOLOGI
              </p>
              <h1 className="text-[12.5px] sm:text-[14.5px] font-bold uppercase tracking-normal text-black mt-0.5 leading-snug">
                UNIVERSITAS SILIWANGI
              </h1>
              <p className="text-[9px] sm:text-[10px] text-black mt-0.5 leading-tight">
                Jalan Siliwangi Nomor 24 Kota Tasikmalaya Kode Pos 46115
              </p>
              <p className="text-[9px] sm:text-[10px] text-black leading-tight">
                Telepon (0265) 330634, 333092 Faksimili (0265) 325812
              </p>
              <p className="text-[9px] sm:text-[10px] text-black leading-tight">
                Laman: www.unsil.ac.id Posel: info@unsil.ac.id
              </p>
            </div>
          </div>
        </div>

        {/* Baris 5 Checkbox Klasifikasi Keamanan & Kecepatan */}
        <div className="grid grid-cols-5 border-b border-black text-[10px] sm:text-[10.5px]">
          {[
            { key: 'Sangat Rahasia', label: 'Sangat Rahasia' },
            { key: 'Rahasia', label: 'Rahasia' },
            { key: 'Sangat Segera', label: 'Sangat Segera' },
            { key: 'Segera', label: 'Segera' },
            { key: 'Biasa', label: 'Biasa' }
          ].map((item, idx) => {
            const isChecked = klasifikasi?.toLowerCase() === item.key.toLowerCase();
            return (
              <div
                key={item.key}
                className={`py-1.5 px-2 flex items-center justify-center gap-1.5 ${
                  idx !== 4 ? 'border-r border-black' : ''
                }`}
              >
                <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center text-[10px] font-bold leading-none shrink-0 bg-white">
                  {isChecked ? '✓' : ''}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Tabel Metadata Surat Masuk & Agenda */}
        <div className="border-b border-black text-[10px] sm:text-[11px] divide-y divide-black">
          <div className="grid grid-cols-[100px_12px_1fr] px-2 py-1 items-baseline min-w-0">
            <span className="shrink-0">No Agenda</span>
            <span className="shrink-0 text-center">:</span>
            <span className="min-w-0 break-words">{noAgenda}</span>
          </div>
          <div className="grid grid-cols-[100px_12px_1fr] px-2 py-1 items-baseline min-w-0">
            <span className="shrink-0">Tanggal Terima</span>
            <span className="shrink-0 text-center">:</span>
            <span className="min-w-0 break-words">{tanggalTerima}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[43%_57%] divide-y sm:divide-y-0 sm:divide-x divide-black">
            <div className="grid grid-cols-[100px_12px_1fr] px-2 py-1 items-baseline min-w-0">
              <span className="shrink-0">Tanggal Surat</span>
              <span className="shrink-0 text-center">:</span>
              <span className="min-w-0 break-words">{tanggalSurat}</span>
            </div>
            <div className="flex items-baseline gap-1.5 px-2 py-1 min-w-0 overflow-hidden">
              <span className="shrink-0 font-normal">Nomor Surat:</span>
              <span className="min-w-0 break-all font-medium leading-tight pr-1">{nomorSurat}</span>
            </div>
          </div>
          <div className="grid grid-cols-[100px_12px_1fr] px-2 py-1 items-baseline min-w-0">
            <span className="shrink-0">Asal Surat</span>
            <span className="shrink-0 text-center">:</span>
            <span className="min-w-0 break-words">{asalSurat}</span>
          </div>
          <div className="grid grid-cols-[100px_12px_1fr] px-2 py-1 items-baseline min-w-0">
            <span className="shrink-0">Hal</span>
            <span className="shrink-0 text-center">:</span>
            <span className="min-w-0 break-words font-semibold leading-relaxed">{hal}</span>
          </div>
        </div>

        {/* Header Seksi: Diteruskan kepada : */}
        <div className="px-2 py-1 font-bold text-[10.5px] sm:text-[11px] border-b border-black bg-gray-100">
          Diteruskan kepada :
        </div>

        {/* Grid 2 Kolom Daftar Penerima (1-34) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-black divide-y sm:divide-y-0 sm:divide-x divide-black text-[9.5px] sm:text-[10px]">
          {/* Kolom Kiri: Nomor 1 - 17 */}
          <div className="divide-y divide-black">
            {colKiriPenerusan.map((item) => {
              const isChecked = resolvedDiteruskanKepada.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[22px_18px_1fr] items-center px-1.5 py-0.5"
                >
                  <span className="text-right pr-1 font-semibold">{item.id}</span>
                  <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center text-[10px] font-bold leading-none bg-white">
                    {isChecked ? '✓' : ''}
                  </span>
                  <span className="pl-1.5 leading-tight">{item.label}</span>
                </div>
              );
            })}
          </div>

          {/* Kolom Kanan: Nomor 18 - 34 */}
          <div className="divide-y divide-black">
            {colKananPenerusan.map((item) => {
              const isChecked = resolvedDiteruskanKepada.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[22px_18px_1fr] items-center px-1.5 py-0.5"
                >
                  <span className="text-right pr-1 font-semibold">{item.id}</span>
                  <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center text-[10px] font-bold leading-none bg-white">
                    {isChecked ? '✓' : ''}
                  </span>
                  <span className="pl-1.5 leading-tight">
                    {item.isCustom ? (
                      effectiveDiteruskanCustom || '................................................................'
                    ) : (
                      item.label
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Header Seksi: Untuk : */}
        <div className="px-2 py-1 font-bold text-[10.5px] sm:text-[11px] border-b border-black bg-gray-100">
          Untuk :
        </div>

        {/* Grid 2 Kolom Daftar Instruksi / Tindakan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-black divide-y sm:divide-y-0 sm:divide-x divide-black text-[9.5px] sm:text-[10px]">
          {/* Kolom Kiri: 12 Poin */}
          <div className="divide-y divide-black">
            {colKiriInstruksi.map((item) => {
              const isChecked = instruksiUntuk.includes(item.id);
              return (
                <div key={item.id} className="flex items-center gap-1.5 px-2 py-0.5">
                  <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center text-[10px] font-bold leading-none bg-white shrink-0">
                    {isChecked ? '✓' : ''}
                  </span>
                  <span className="leading-tight">{item.label}</span>
                </div>
              );
            })}
          </div>

          {/* Kolom Kanan: 12 Poin */}
          <div className="divide-y divide-black">
            {colKananInstruksi.map((item) => {
              const isChecked = instruksiUntuk.includes(item.id);
              return (
                <div key={item.id} className="flex items-center gap-1.5 px-2 py-0.5">
                  <span className="w-3.5 h-3.5 border border-black inline-flex items-center justify-center text-[10px] font-bold leading-none bg-white shrink-0">
                    {isChecked ? '✓' : ''}
                  </span>
                  <span className="leading-tight">
                    {item.hasInput ? (
                      <span>
                        Koordinasikan dengan{' '}
                        <span className="font-semibold underline decoration-dotted">
                          {koordinasikanDengan || '...................................'}
                        </span>
                      </span>
                    ) : item.isCustom ? (
                      instruksiCustom || '.............................................'
                    ) : (
                      item.label
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seksi Bawah: Catatan & Tanda Tangan Rektor */}
        <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr] divide-y sm:divide-y-0 sm:divide-x divide-black text-[10.5px]">
          {/* Sisi Kiri: Catatan Pimpinan */}
          <div className="p-2.5 flex flex-col justify-between min-h-[140px]">
            <div>
              <p className="font-bold mb-1">Catatan :</p>
              <div className="text-[10px] sm:text-[10.5px] leading-relaxed whitespace-pre-line pl-1 text-black">
                {catatan || (
                  <span className="text-black/40 italic">
                    (Tidak ada catatan tambahan)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Tempat, Tanggal, & TTE Rektor */}
          <div className="p-2.5 flex flex-col justify-between min-h-[140px] text-left sm:text-left pl-3 sm:pl-4">
            <div>
              <p>{tempatTanggal}</p>
              <p className="font-bold">Rektor,</p>
            </div>

            {/* Ruang TTE BSrE / Tanda Tangan */}
            <div className="my-2 min-h-[40px] flex items-center">
              {tteVerified ? (
                <div className="py-1 px-2 border border-black bg-stone-50/50 text-[9px] text-black text-center font-serif leading-tight">
                  <p className="font-semibold">Ditandatangani secara elektronik</p>
                  <p className="text-[8px] italic text-stone-700 mt-0.5">Sertifikat Elektronik BSrE BSSN</p>
                </div>
              ) : (
                <div className="h-8 flex items-center text-black/60 italic text-[9px] font-serif">
                  (tanda tangan)
                </div>
              )}
            </div>

            <div>
              <p className="font-bold text-[10px] sm:text-[10.5px] uppercase tracking-tight text-black">
                {namaRektor}
              </p>
              <p className="text-[9.5px] sm:text-[10px] text-black font-mono">
                NIP {nipRektor}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 23. FORMAT PENGGUNAAN TANDA TANGAN ELEKTRONIK (TTE)
 * Sesuai Gambar Acuan Resmi Tata Naskah Dinas Kemendikbudristek & Universitas Siliwangi
 * Menampilkan tata letak surat dinas dengan kotak resmi "Kode Informasi Elektronik",
 * QR-Code spesimen TTE BSrE, tembusan, serta klausul legalitas penandatanganan elektronik.
 */
export const PenggunaanTteTemplateView = ({ data }) => {
  const {
    nomorSurat = '089/UN58/TU.00/2026',
    lampiran = '1 (satu) Berkas',
    hal = 'Pemberitahuan Penerapan Tanda Tangan Elektronik (TTE) Tersertifikasi BSrE',
    tempatTanggal = 'Tasikmalaya, 9 September 2026',
    tujuanUtama = 'Para Dekan Fakultas di lingkungan Universitas Siliwangi',
    tujuanDetail = 'Universitas Siliwangi',
    tujuanKota = 'Kota Tasikmalaya',
    kalimatPembuka = 'Sehubungan dengan implementasi sistem persuratan dinas terintegrasi SILOKA serta percepatan transformasi tata kelola birokrasi digital kampus, dengan ini kami sampaikan ketentuan teknis sebagai berikut:',
    isiSurat = [
      '1. Seluruh naskah dinas resmi di lingkungan Universitas Siliwangi mulai 1 Oktober 2026 diterbitkan menggunakan Tanda Tangan Elektronik (TTE) yang tersertifikasi oleh Balai Sertifikasi Elektronik (BSrE) BSSN.',
      '2. Keabsahan naskah dinas elektronik diakui secara sah secara hukum dan tidak memerlukan pembubuhan cap basah stempel fisik.',
      '3. Pihak penerima dapat melakukan verifikasi otentisitas dokumen dengan memindai Kode Informasi Elektronik (QR Code) yang tertera pada lembar naskah dinas.'
    ],
    kalimatPenutup = 'Demikian pemberitahuan ini kami sampaikan untuk dipedomani dan dilaksanakan dengan sebaik-baiknya. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.',
    namaJabatan = 'Kepala Biro Umum dan Keuangan,',
    namaPejabat = 'Dr. Nana Sujana, Drs., M.Si.',
    nip = '196808301989031004',
    tteVerified = true,
    tembusan = [
      'Rektor Universitas Siliwangi (sebagai laporan)',
      'Para Wakil Rektor di lingkungan Universitas Siliwangi',
      'Ketua Satuan Pengawas Internal (SPI) Universitas Siliwangi'
    ]
  } = data || {};

  return (
    <div
      data-pasal47="true"
      data-has-kop="true"
      className="a4-sheet pasal47-with-kop p-6 sm:p-12 max-w-3xl mx-auto bg-white border border-black rounded-none shadow-none print:shadow-none print:border-none print:m-0 print:max-w-full text-black font-serif leading-relaxed text-xs"
    >
      {/* Kop Surat Resmi UNSIL */}
      <KopSuratUnsil unit={data?.unitKerja || data?.unit || data?.kodeUnit || data?.unit_kerja_id} />

      {/* Baris Metadata & Titimangsa Tanggal */}
      <div className="flex flex-col sm:flex-row justify-between items-start text-xs font-serif mt-5 mb-6 gap-2 text-black">
        {/* Sisi Kiri: Nomor, Lampiran, Hal (Titik Dua Sejajar Presisi) */}
        <div className="space-y-1 w-full sm:w-auto">
          <div className="grid grid-cols-[70px_14px_1fr] items-baseline">
            <span>Nomor</span>
            <span className="text-center">:</span>
            <span className="font-mono font-bold">{nomorSurat}</span>
          </div>
          <div className="grid grid-cols-[70px_14px_1fr] items-baseline">
            <span>Lampiran</span>
            <span className="text-center">:</span>
            <span>{lampiran}</span>
          </div>
          <div className="grid grid-cols-[70px_14px_1fr] items-baseline">
            <span>Hal</span>
            <span className="text-center">:</span>
            <span className="font-bold leading-relaxed">{hal}</span>
          </div>
        </div>

        {/* Sisi Kanan: Tempat & Tanggal */}
        <div className="text-left sm:text-right text-xs font-serif pt-0.5 shrink-0 text-black">
          <p>{tempatTanggal}</p>
        </div>
      </div>

      {/* Bagian Penerima / Yth. */}
      <div className="text-xs font-serif my-6 space-y-0.5 text-black">
        <p className="font-bold">Yth. {tujuanUtama}</p>
        {tujuanDetail && <p className="pl-6">{tujuanDetail}</p>}
        {tujuanKota && <p className="pl-6">{tujuanKota}</p>}
      </div>

      {/* Isi Surat: Kalimat Pembuka, Narasi/Poin, Kalimat Penutup */}
      <div className="text-xs font-serif space-y-4 text-justify leading-relaxed mb-8 text-black">
        {kalimatPembuka && <p>{kalimatPembuka}</p>}

        <div className="space-y-2">
          {Array.isArray(isiSurat) ? (
            isiSurat.map((paragraf, idx) => (
              <p key={idx} className="whitespace-pre-line">
                {paragraf}
              </p>
            ))
          ) : (
            <p className="whitespace-pre-line">{isiSurat}</p>
          )}
        </div>

        {kalimatPenutup && <p>{kalimatPenutup}</p>}
      </div>

      {/* Blok Tanda Tangan Kanan Bawah */}
      <div className="mt-8 text-xs font-serif flex justify-end text-black">
        <div className="w-64 text-center flex flex-col items-center">
          <p className="font-semibold">{namaJabatan}</p>

          {/* Kotak Spesimen "Kode Informasi Elektronik" */}
          <div className="my-3 border border-black p-2 w-36 flex flex-col items-center justify-center bg-white text-center">
            {tteVerified ? (
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 mb-1 p-0.5 border border-black flex items-center justify-center bg-white">
                  <QrCode className="w-9 h-9 text-black" />
                </div>
                <p className="text-[9px] font-serif font-bold text-black leading-tight">
                  Kode
                </p>
                <p className="text-[9px] font-serif font-bold text-black leading-tight">
                  Informasi
                </p>
                <p className="text-[9px] font-serif font-bold text-black leading-tight">
                  Elektronik
                </p>
              </div>
            ) : (
              <div className="py-2.5">
                <p className="text-[9.5px] font-serif leading-tight text-black">Kode</p>
                <p className="text-[9.5px] font-serif leading-tight text-black">Informasi</p>
                <p className="text-[9.5px] font-serif leading-tight text-black">Elektronik</p>
              </div>
            )}
          </div>

          <p className="font-bold uppercase tracking-tight text-black mt-1">
            {namaPejabat}
          </p>
          {nip && <p className="text-[11px] text-black font-mono mt-0.5">NIP {nip}</p>}
        </div>
      </div>

      {/* Bagian Bawah: Tembusan di Kiri & Catatan Legalitas di Kanan */}
      <div className="mt-10 flex flex-col sm:flex-row justify-between items-end gap-4 text-[10.5px] text-black">
        {/* Sisi Kiri: Tembusan */}
        <div className="w-full sm:w-auto">
          {tembusan && tembusan.length > 0 && (
            <div>
              <p className="font-bold mb-1">Tembusan:</p>
              <ol className="list-decimal list-outside ml-4 space-y-0.5 text-black">
                {tembusan.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Sisi Kanan: Klausul Baku TTE Resmi */}
        <div className="text-right shrink-0">
          <p className="text-[10px] font-serif italic text-black/80">
            Dokumen ini telah ditandatangani secara elektronik
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 23 Standar Format Tata Naskah Dinas Resmi Universitas Siliwangi
 * Berdasarkan Peraturan Rektor UNSIL Nomor 3 Tahun 2023 (Pasal 43–48 & Lampiran Bab II)
 */
const RAW_DOCUMENT_TEMPLATES = [
  // Naskah Dinas Arahan: F4 (210 x 330 mm) • Bookman Old Style 12pt
  { id: 'pos', name: '1. POS/SOP', label: 'Prosedur Operasional Standar', kode_jenis_naskah: 'POS', kategoriNaskah: 'ARAHAN', hasKopSurat: false },
  { id: 'se', name: '2. Surat Edaran', label: 'Surat Edaran', kode_jenis_naskah: 'SURAT_EDARAN', kategoriNaskah: 'ARAHAN', hasKopSurat: true },
  { id: 'sk', name: '3. Keputusan Rektor', label: 'Keputusan Rektor', kode_jenis_naskah: 'KEPUTUSAN', kategoriNaskah: 'ARAHAN', isUniversityLevel: true, hasKopSurat: true },
  { id: 'sp', name: '4. Surat Perintah', label: 'Surat Perintah', kode_jenis_naskah: 'SURAT_PERINTAH', kategoriNaskah: 'ARAHAN', isUniversityLevel: true, hasKopSurat: true },
  { id: 'st_lembar', name: '5. ST (Lembar)', label: 'Surat Tugas (Format Lembar)', kode_jenis_naskah: 'SURAT_TUGAS', kategoriNaskah: 'ARAHAN', hasKopSurat: true },
  { id: 'st_kolom', name: '6. ST (Kolom)', label: 'Surat Tugas (Format Kolom)', kode_jenis_naskah: 'SURAT_TUGAS', kategoriNaskah: 'ARAHAN', hasKopSurat: true },

  // Naskah Dinas Korespondensi: A4 (210 x 297 mm) • Times New Roman / Arial 12pt
  { id: 'nd', name: '7. Nota Dinas', label: 'Nota Dinas', kode_jenis_naskah: 'NOTA_DINAS', kategoriNaskah: 'KORESPONDENSI', hasKopSurat: true },
  { id: 'sd', name: '8. Surat Dinas', label: 'Surat Dinas', kode_jenis_naskah: 'SURAT_DINAS', kategoriNaskah: 'KORESPONDENSI', hasKopSurat: true },
  { id: 'undangan_lembar', name: '9. Undangan (Lembar)', label: 'Surat Undangan (Format Lembar)', kode_jenis_naskah: 'SURAT_UNDANGAN', kategoriNaskah: 'KORESPONDENSI', hasKopSurat: true },
  { id: 'undangan_kartu', name: '10. Undangan (Kartu)', label: 'Surat Undangan (Format Kartu)', kode_jenis_naskah: 'SURAT_UNDANGAN', kategoriNaskah: 'KORESPONDENSI', hasKopSurat: false },

  // Naskah Dinas Khusus: A4 (210 x 297 mm) • Times New Roman / Arial 12pt
  { id: 'mou', name: '11. Nota Kesepahaman', label: 'Nota Kesepahaman (MoU)', kode_jenis_naskah: 'MOU', kategoriNaskah: 'KHUSUS', isUniversityLevel: true, hasKopSurat: true },
  { id: 'pks', name: '12. PKS Dalam Negeri', label: 'Perjanjian Kerja Sama (PKS)', kode_jenis_naskah: 'PKS_DN', kategoriNaskah: 'KHUSUS', hasKopSurat: true },
  { id: 'skua', name: '13. Surat Kuasa', label: 'Surat Kuasa', kode_jenis_naskah: 'SURAT_KUASA', kategoriNaskah: 'KHUSUS', hasKopSurat: true },
  { id: 'ba', name: '14. Berita Acara', label: 'Berita Acara', kode_jenis_naskah: 'BERITA_ACARA', kategoriNaskah: 'KHUSUS', hasKopSurat: true },
  { id: 'sket', name: '15. Surat Keterangan', label: 'Surat Keterangan', kode_jenis_naskah: 'SURAT_KETERANGAN', kategoriNaskah: 'KHUSUS', hasKopSurat: true },
  { id: 'sper', name: '16. Surat Pernyataan', label: 'Surat Pernyataan', kode_jenis_naskah: 'SURAT_PERNYATAAN', kategoriNaskah: 'KHUSUS', hasKopSurat: true },
  { id: 'speng', name: '17. Surat Pengantar', label: 'Surat Pengantar', kode_jenis_naskah: 'SURAT_PENGANTAR', kategoriNaskah: 'KHUSUS', hasKopSurat: true },
  { id: 'peng', name: '18. Pengumuman', label: 'Pengumuman', kode_jenis_naskah: 'PENGUMUMAN', kategoriNaskah: 'KHUSUS', hasKopSurat: true },

  // Naskah Dinas Lainnya: A4 (210 x 297 mm) • Times New Roman / Arial 12pt
  { id: 'notula', name: '19. Notula', label: 'Notula Rapat', kode_jenis_naskah: 'NOTULA', kategoriNaskah: 'LAINNYA', hasKopSurat: true },
  { id: 'lap', name: '20. Laporan', label: 'Laporan Dinas', kode_jenis_naskah: 'LAPORAN', kategoriNaskah: 'LAINNYA', hasKopSurat: true },
  { id: 'ts', name: '21. Telaah Staf', label: 'Telaah Staf', kode_jenis_naskah: 'TELAAH_STAF', kategoriNaskah: 'LAINNYA', hasKopSurat: false },
  { id: 'disp_rektor', name: '22. Disposisi Rektor', label: 'Lembar Disposisi Rektor', kode_jenis_naskah: 'DISPOSISI_REKTOR', kategoriNaskah: 'LAINNYA', isUniversityLevel: true, hasKopSurat: true },
  { id: 'tte_doc', name: '23. Penggunaan TTE', label: 'Naskah Tanda Tangan Elektronik', kode_jenis_naskah: 'PENGGUNAAN_TTE', kategoriNaskah: 'LAINNYA', hasKopSurat: true }
];

export const DOCUMENT_TEMPLATES = RAW_DOCUMENT_TEMPLATES.map((tpl) => {
  const isArahan = tpl.kategoriNaskah === 'ARAHAN';
  return {
    ...tpl,
    paperSize: isArahan ? 'F4' : 'A4',
    paperDimensions: isArahan ? '210 × 330 mm' : '210 × 297 mm',
    gramaturKertas: 'HVS minimal 70 gram (≥ 70 gram/m²)',
    fontFamily: isArahan ? 'Bookman Old Style' : 'Times New Roman / Arial',
    fontSizePt: 12,
    kopFontSpec: {
      kementerian: 'Times New Roman 16pt (Kapital)',
      universitasUnit: 'Times New Roman 14pt (Kapital, Bold)',
      alamatKontak: 'Times New Roman 12pt',
      jarakGarisPenutupDariAtas: '4,5 cm'
    },
    spasiSpec: {
      antaraJudulDanIsi: '2 spasi',
      judulLebihDariSatuBaris: '1 spasi'
    },
    penomoranDanTinta: {
      formatNomorHalaman: '- 2 -',
      halamanPertamaBerkopTanpaNomor: true,
      kataPenyambung: 'Sudut kanan bawah diikuti 3 titik (contoh: Peserta...)',
      warnaTintaTeks: 'Hitam',
      warnaTintaParafTtd: 'Biru atau Hitam'
    },
    pasal47: {
      pasal: 'Pasal 47',
      ruangTepiAtas: tpl.hasKopSurat
        ? 'Paling sedikit 1 (satu) spasi di bawah Kepala Naskah Dinas (Garis penutup kop 4,5 cm dari tepi atas)'
        : 'Paling sedikit 2 cm (dua sentimeter) tanpa Kepala Naskah Dinas',
      ruangTepiAtasCss: tpl.hasKopSurat ? '1.5cm (+ 1 spasi di bawah Kop)' : '2cm',
      ruangTepiBawah: '1,5 cm',
      ruangTepiBawahCss: '1.5cm',
      ruangTepiKiri: '1,5 cm',
      ruangTepiKiriCss: '1.5cm',
      ruangTepiKanan: '1,5 cm',
      ruangTepiKananCss: '1.5cm'
    },
    tataNaskahSpecs: {
      gramatur: 'HVS minimal 70 gram',
      warnaTinta: 'Hitam',
      jarakJudulKeIsi: '2 spasi',
      jarakBarisJudul: '1 spasi',
      fontFamily: isArahan ? 'Bookman Old Style' : 'Times New Roman / Arial',
      fontSizePt: 12,
      paperSize: isArahan ? 'F4' : 'A4'
    }
  };
});
