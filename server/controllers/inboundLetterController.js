/**
 * Controller: Registrasi Naskah Masuk & Penomoran Agenda Otomatis (SILOKA UNSIL)
 * Endpoint REST API untuk pencatatan surat masuk dan buku agenda ekspedisi.
 */

let localInboundSequence = 1;
const inMemoryInboundLetters = [];

/**
 * POST /api/surat-masuk
 * Mendaftarkan surat masuk baru dan menerbitkan nomor agenda resmi
 */
export const createInbound = async (req, res) => {
  try {
    const payload = req.body || {};
    const currentUser = req.user || {
      id: payload.created_by_user_id || 'usr-02',
      unit_kerja_id: payload.unit_kerja_id || 'UN58',
      nama_lengkap: 'Staf Pelaksana Persuratan',
      role: 'OPERATOR_UNIT'
    };

    const currentYear = Number(payload.tahun) || new Date().getFullYear();
    const unitCode = payload.target_unit_id || payload.unit_kerja_id || currentUser.unit_kerja_id || 'UN58';
    const seq = localInboundSequence++;
    const agendaNumber = `AGD-${currentYear}/${unitCode}/${String(seq).padStart(4, '0')}`;

    const newInbound = {
      id_surat: Date.now(),
      id: `SRT-IN-${currentYear}-${String(seq).padStart(4, '0')}`,
      nomor_urut: seq,
      nomor_agenda: agendaNumber,
      nomorAgenda: agendaNumber,
      nomorSurat: agendaNumber,
      nomorSuratAsal: String(payload.nomor_surat_asal || payload.nomorSuratAsal || '-').trim(),
      nomor_surat_asal: String(payload.nomor_surat_asal || payload.nomorSuratAsal || '-').trim(),
      tingkat_keamanan: payload.tingkat_keamanan || 'B',
      kategoriKeamanan: payload.tingkat_keamanan === 'SR' ? 'Sangat Rahasia' : payload.tingkat_keamanan === 'R' ? 'Rahasia' : 'Biasa/Terbuka',
      kode_klasifikasi: payload.kode_klasifikasi || payload.kodeKlasifikasi || 'KP',
      kodeKlasifikasi: payload.kode_klasifikasi || payload.kodeKlasifikasi || 'KP',
      subKlasifikasi: payload.kode_klasifikasi || payload.kodeKlasifikasi || 'KP',
      perihal: String(payload.perihal || 'Naskah Dinas Masuk Resmi').trim(),
      pengirim: String(payload.pengirim || 'Instansi Pengirim').trim(),
      asal_surat: String(payload.pengirim || 'Instansi Pengirim').trim(),
      tujuan: String(payload.tujuan || 'Rektor Universitas Siliwangi').trim(),
      penerima: String(payload.tujuan || 'Rektor Universitas Siliwangi').trim(),
      target_user_id: payload.target_user_id || null,
      target_user_email: payload.target_user_email || null,
      target_pejabat_id: payload.target_pejabat_id || null,
      target_pejabat_nip: payload.target_pejabat_nip || null,
      target_pejabat_nama: payload.target_pejabat_nama || null,
      target_jabatan: payload.target_jabatan || payload.tujuan || 'Rektor Universitas Siliwangi',
      target_role: payload.target_role || 'PEJABAT',
      target_role_slug: payload.target_role_slug || 'pimpinan',
      target_unit_id: payload.target_unit_id || unitCode,
      target_unit_nama: payload.target_unit_nama || null,
      unit_kerja_id: payload.target_unit_id || unitCode,
      loket_unit_id: payload.unit_kerja_id || currentUser.unit_kerja_id || 'UN58.6',
      tanggal: payload.tanggal_surat || payload.tanggal || new Date().toISOString().slice(0, 10),
      tanggalTerima: payload.tanggal_terima || payload.tanggalTerima || new Date().toISOString().slice(0, 10),
      tanggalRegistrasi: payload.tanggal_terima || new Date().toISOString().slice(0, 10),
      sifat: payload.sifat || 'Penting',
      media_pengiriman: payload.media_pengiriman || 'Kurir / Pos Fisik',
      status: payload.disposisi ? 'Didisposisikan' : 'Diterima',
      kategori: 'Surat Masuk',
      isSuratMasuk: true,
      tujuan_aksi: 'DISPOSISI',
      created_by_user_id: currentUser.id || 'usr-02',
      created_at: new Date().toISOString()
    };

    inMemoryInboundLetters.unshift(newInbound);

    return res.status(201).json({
      status: 201,
      success: true,
      message: `Surat masuk berhasil dicatat dengan nomor agenda: ${agendaNumber}`,
      data: newInbound
    });
  } catch (err) {
    console.error('[CREATE-SURAT-MASUK-ERROR]', err);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'CreateInboundLetterFailed',
      message: err.message || 'Gagal meregistrasi surat masuk.'
    });
  }
};

/**
 * GET /api/surat-masuk
 * Mengambil daftar surat masuk terdaftar
 */
export const getInboundList = async (req, res) => {
  return res.status(200).json({
    status: 200,
    success: true,
    total: inMemoryInboundLetters.length,
    data: inMemoryInboundLetters
  });
};

/**
 * DELETE /api/surat-masuk
 * Menghapus dan membersihkan seluruh riwayat surat masuk uji coba
 */
export const clearInboundLetters = async (req, res) => {
  inMemoryInboundLetters.length = 0;
  localInboundSequence = 1;
  return res.status(200).json({
    status: 200,
    success: true,
    message: 'Seluruh riwayat surat masuk uji coba berhasil dibersihkan dari server.'
  });
};
