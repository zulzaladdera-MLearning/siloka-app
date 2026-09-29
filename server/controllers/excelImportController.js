/**
 * Controller: Fasilitas Input Massal (Impor File Excel .xlsx)
 * Menerima file upload .xlsx, melakukan validasi format/ekstensi,
 * melakukan parsing baris-demi-baris, memvalidasi kolom wajib (NIP, Nama, Email, Unit Kerja),
 * dan menyimpan record ke basis data tm_user.
 */

import fs from 'fs';
import ExcelJS from 'exceljs';
import { upsertUserFromSync } from '../services/userManagementService.js';

export const importUsersFromExcel = async (req, res) => {
  const file = req.file;
  const fileName = file?.originalname || req.body?.fileName || 'impor_pegawai_siloka.xlsx';

  try {
    // 1. Validasi keberadaan file atau payload baris
    if (!file && !req.body?.rows) {
      return res.status(400).json({
        status: 400,
        success: false,
        error: 'NoFileUploaded',
        message: 'Harap unggah berkas Excel (.xlsx) untuk diproses.'
      });
    }

    // 2. Validasi ekstensi & tipe MIME (Hanya menerima berkas .xlsx)
    if (file) {
      const fileExtension = fileName.split('.').pop().toLowerCase();
      if (fileExtension !== 'xlsx') {
        return res.status(400).json({
          status: 400,
          success: false,
          error: 'InvalidFileFormat',
          message: 'Format berkas tidak valid! Backend hanya menerima berkas Excel dengan ekstensi .xlsx.'
        });
      }
    }

    // 3. KUNCI BACKEND: Parsing data baris langsung dari Buffer/Stream menggunakan ExcelJS
    // Menghindari pembacaan cache file lama yang tertinggal di disk
    let parsedRows = [];

    if (file?.buffer || file?.path) {
      const workbook = new ExcelJS.Workbook();
      if (file.buffer) {
        // MemoryStorage: Membaca langsung dari RAM Buffer (Zero Disk Cache)
        await workbook.xlsx.load(file.buffer);
      } else if (file.path) {
        // DiskStorage: Membaca dari temporary file dengan UUID unik
        await workbook.xlsx.readFile(file.path);
      }

      const worksheet = workbook.worksheets[0];
      if (worksheet) {
        let headers = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            headers = row.values.map((v) => String(v || '').trim().toLowerCase());
          } else {
            const rowData = {};
            row.eachCell((cell, colNumber) => {
              const headerKey = headers[colNumber] || `col_${colNumber}`;
              const cellVal = cell.text ? cell.text.trim() : String(cell.value || '').trim();
              rowData[headerKey] = cellVal;
            });
            if (Object.keys(rowData).length > 0) {
              parsedRows.push(rowData);
            }
          }
        });
      }
    } else if (req.body?.rows) {
      parsedRows = typeof req.body.rows === 'string' ? JSON.parse(req.body.rows) : req.body.rows;
    }

    // 4. Validasi Baris-demi-Baris untuk 4 Kolom Wajib:
    // Mandatory: NIP, Nama, Email, Unit Kerja
    const validationErrors = [];
    const validRecords = [];
    let insertedCount = 0;
    let updatedCount = 0;

    for (let index = 0; index < parsedRows.length; index++) {
      const row = parsedRows[index];
      const rowNum = index + 2; // Baris 1 adalah header di file Excel
      const errors = [];

      const nip = String(row.nip || row.NIP || '').trim();
      const nama = String(row.nama || row.Nama || row.nama_lengkap || '').trim();
      const email = String(row.email || row.Email || '').trim();
      const unitKerja = String(row.unit_kerja || row['Unit Kerja'] || row.unit_kerja_id || '').trim();
      const jabatan = String(row.jabatan || row.Jabatan || 'Pegawai').trim();
      const role = String(row.role || row.Role || 'OPERATOR_UNIT').trim();

      if (!nip) {
        errors.push('Kolom NIP wajib diisi');
      } else if (!/^\d{18}$|^\d{16}$/.test(nip)) {
        errors.push('NIP harus terdiri dari 18 digit angka (ASN) atau 16 digit (PPPK)');
      }

      if (!nama) {
        errors.push('Kolom Nama wajib diisi');
      }

      if (!email) {
        errors.push('Kolom Email wajib diisi');
      } else if (!email.includes('@')) {
        errors.push('Format email tidak valid (harus mengandung @)');
      }

      if (!unitKerja) {
        errors.push('Kolom Unit Kerja wajib diisi');
      }

      if (errors.length > 0) {
        validationErrors.push({
          rowNumber: rowNum,
          nip: nip || '-',
          nama: nama || '-',
          errors
        });
      } else {
        // Eksekusi UPSERT Terproteksi (Proteksi Password & Force Change Password untuk akun baru)
        const upsertRes = await upsertUserFromSync({
          nip_nik: nip,
          nama_lengkap: nama,
          email: email.toLowerCase(),
          id_unit: unitKerja,
          unit_kerja_id: unitKerja,
          id_role: role,
          role: role,
          role_label: jabatan,
          jabatan: jabatan,
          is_active: true
        });

        if (upsertRes.is_new_user) {
          insertedCount++;
        } else {
          updatedCount++;
        }

        validRecords.push({
          id: upsertRes.user.id,
          nip_nik: nip,
          nama_lengkap: nama,
          email: email.toLowerCase(),
          unit_kerja_id: unitKerja,
          id_unit: unitKerja,
          jabatan: jabatan,
          role: role,
          id_role: role,
          role_label: jabatan,
          is_active: true,
          sync_action: upsertRes.action,
          is_new_user: upsertRes.is_new_user,
          must_change_password: upsertRes.user.must_change_password,
          credentials_preserved: !upsertRes.is_new_user,
          welcome_email_sent: Boolean(upsertRes.email_notification?.success),
          created_at: new Date().toISOString()
        });
      }
    }

    // 5. Kembalikan respons hasil proses impor
    return res.status(200).json({
      status: 200,
      success: true,
      message: `Proses impor berkas Excel selesai. ${validRecords.length} data valid berhasil diproses (Akun Baru: ${insertedCount}, Akun Eksisting: ${updatedCount}). Password pengguna eksisting tetap aman.`,
      summary: {
        fileName: fileName,
        totalRows: parsedRows.length,
        validCount: validRecords.length,
        insertedCount,
        updatedCount,
        invalidCount: validationErrors.length
      },
      errors: validationErrors,
      data: validRecords
    });
  } catch (error) {
    console.error('[EXCEL-IMPORT-ERROR]', error);
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'ExcelImportFailed',
      message: 'Gagal memproses berkas Excel.',
      details: error.message
    });
  } finally {
    // PEMBERSIHAN BACKEND: Hapus temporary file disk jika ada untuk mencegah file cache usang
    if (file?.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupErr) {
        console.warn('Gagal membersihkan temporary upload file:', cleanupErr.message);
      }
    }
  }
};

/**
 * Controller: Unduh Format Template Excel (.xlsx)
 * Menghasilkan file OpenXML (.xlsx) yang valid menggunakan ExcelJS dengan header HTTP yang tepat.
 */
export const downloadTemplateExcel = async (req, res) => {
  try {
    const ExcelJSModule = await import('exceljs');
    const ExcelJS = ExcelJSModule.default || ExcelJSModule;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SILOKA Universitas Siliwangi';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Template Pegawai', {
      views: [{ showGridLines: true }]
    });

    worksheet.columns = [
      { header: 'NIP', key: 'nip', width: 24 },
      { header: 'Nama', key: 'nama', width: 34 },
      { header: 'Gelar', key: 'gelar', width: 22 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Unit Kerja', key: 'unit_kerja', width: 20 },
      { header: 'Jabatan', key: 'jabatan', width: 34 },
      { header: 'Role', key: 'role', width: 20 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF064E3B' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Format kolom NIP sebagai Text ('@')
    worksheet.getColumn('nip').numFmt = '@';

    worksheet.addRow({
      nip: '198802102014041001',
      nama: 'Budi Santoso, S.Kom., M.Cs.',
      gelar: 'S.Kom., M.Cs.',
      email: 'budi.santoso@unsil.ac.id',
      unit_kerja: 'UN58.13',
      jabatan: 'Dosen Informatika FT',
      role: 'OPERATOR_UNIT'
    });
    worksheet.addRow({
      nip: '199105152019032002',
      nama: 'Lina Marlina, S.Pd., M.Hum.',
      gelar: 'S.Pd., M.Hum.',
      email: 'lina.marlina@unsil.ac.id',
      unit_kerja: 'UN58.33',
      jabatan: 'Pengelola Layanan Bahasa',
      role: 'OPERATOR_UNIT'
    });
    worksheet.addRow({
      nip: '199403222020121004',
      nama: 'Reza Fauzi, S.T.',
      gelar: 'S.T.',
      email: 'reza.fauzi@unsil.ac.id',
      unit_kerja: 'UN58.32',
      jabatan: 'Staf Server UPA TIK',
      role: 'OPERATOR_UNIT'
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Template_Impor_Pegawai_SILOKA.xlsx"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('[TEMPLATE-DOWNLOAD-ERROR]', error);
    res.status(500).json({
      status: 500,
      success: false,
      error: 'DownloadTemplateFailed',
      message: 'Gagal membuat file template Excel.',
      details: error.message
    });
  }
};

