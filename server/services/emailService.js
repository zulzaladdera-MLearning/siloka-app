/**
 * Layanan Pengiriman Email Notifikasi (SILOKA UNSIL)
 * Menggunakan Nodemailer untuk mengirimkan 'Email Selamat Datang' kepada pegawai baru,
 * menginstruksikan aktivasi akun dan kewajiban ganti kata sandi (must_change_password).
 */

import nodemailer from 'nodemailer';

// Konfigurasi SMTP Transporter (sesuai environment server kampus UNSIL)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.unsil.ac.id',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true untuk port 465, false untuk 587
  auth: {
    user: process.env.SMTP_USER || 'no-reply.siloka@unsil.ac.id',
    pass: process.env.SMTP_PASS || 'siloka_smtp_secret_2026'
  },
  tls: {
    rejectUnauthorized: false // Menghindari isu self-signed certificate pada server intranet lokal
  }
});

/**
 * Mengirimkan Email Selamat Datang & Instruksi Pengubahan Kata Sandi
 * @param {Object} payload
 * @param {string} payload.to - Email kedinasan pegawai (@unsil.ac.id)
 * @param {string} payload.nama - Nama lengkap pegawai
 * @param {string} payload.nip - NIP pegawai
 * @param {string} payload.defaultPassword - Password sementara yang di-generate
 * @param {string} payload.unitKerja - Nama Satuan Kerja penempatan
 * @param {string} payload.role - Peran kedinasan yang diberikan
 */
export const sendWelcomeEmail = async ({
  to,
  nama,
  nip,
  defaultPassword,
  unitKerja = 'Universitas Siliwangi',
  role = 'OPERATOR_UNIT'
}) => {
  const portalUrl = process.env.APP_URL || 'https://siloka.unsil.ac.id';

  const mailOptions = {
    from: `"SILOKA UNSIL (Biro BKU)" <${process.env.SMTP_FROM || 'no-reply.siloka@unsil.ac.id'}>`,
    to: to,
    subject: `[Aktivasi Akun SILOKA] Selamat Datang di Sistem Tata Persuratan Digital UNSIL - ${nip}`,
    html: `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #022c22 0%, #064e3b 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; }
          .header p { margin: 6px 0 0 0; font-size: 13px; color: #a7f3d0; }
          .badge { display: inline-block; background: #f59e0b; color: #022c22; font-weight: bold; font-size: 11px; padding: 3px 8px; border-radius: 6px; margin-top: 8px; }
          .content { padding: 32px 28px; line-height: 1.6; font-size: 14px; }
          .alert-box { background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 20px 0; }
          .alert-title { font-weight: bold; color: #92400e; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; font-size: 13px; }
          .alert-text { color: #b45309; font-size: 12px; margin: 0; }
          .cred-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
          .cred-table td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
          .cred-table td:first-child { font-weight: 600; color: #64748b; width: 38%; }
          .cred-table td:last-child { font-family: monospace; font-weight: 700; color: #0f172a; }
          .btn-container { text-align: center; margin: 30px 0 20px 0; }
          .btn-portal { display: inline-block; background-color: #064e3b; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 10px rgba(6, 78, 59, 0.25); }
          .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SILOKA UNSIL</h1>
            <p>Sistem Informasi Layanan Organisasi, Kearsipan, dan Administrasi Persuratan</p>
            <div class="badge">Aktivasi Akun Pegawai Baru</div>
          </div>
          <div class="content">
            <p>Yth. Bapak/Ibu <strong>${nama}</strong>,</p>
            <p>
              Akun Anda telah berhasil didaftarkan pada sistem persuratan resmi <strong>Universitas Siliwangi (SILOKA)</strong>
              melalui sinkronisasi pangkalan data kepegawaian.
            </p>

            <table class="cred-table">
              <tr>
                <td>NIP / NIK</td>
                <td>${nip}</td>
              </tr>
              <tr>
                <td>Email Akun</td>
                <td>${to}</td>
              </tr>
              <tr>
                <td>Satuan Kerja</td>
                <td>${unitKerja}</td>
              </tr>
              <tr>
                <td>Role Otoritas</td>
                <td>${role}</td>
              </tr>
              <tr>
                <td>Kata Sandi Sementara</td>
                <td style="color: #064e3b; font-size: 15px;">${defaultPassword}</td>
              </tr>
            </table>

            <div class="alert-box">
              <div class="alert-title">
                ⚠️ PERHATIAN: Kewajiban Pengubahan Kata Sandi
              </div>
              <p class="alert-text">
                Akun Anda telah ditandai dengan status <code>must_change_password = true</code>. Demi menjaga keamanan kedinasan dan kepatuhan standar BSSN, Anda <strong>wajib segera mengganti kata sandi sementara</strong> pada saat pertama kali login ke dalam sistem.
              </p>
            </div>

            <div class="btn-container">
              <a href="${portalUrl}" class="btn-portal" target="_blank">
                Masuk ke Portal SILOKA
              </a>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
              Jika Anda tidak merasa mengajukan pendaftaran atau membutuhkan bantuan akses, silakan hubungi Unit Penunjang Akademik Teknologi Informasi dan Komunikasi (UPA TIK) atau Subbagian Persuratan Biro BKU.
            </p>
          </div>
          <div class="footer">
            &copy; 2026 Biro Keuangan dan Umum (BKU) & UPA TIK — Universitas Siliwangi<br>
            Jl. Siliwangi No. 24, Tasikmalaya, Jawa Barat 46115
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL-SERVICE] Email selamat datang berhasil dikirim ke ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    // Pada lingkungan testing/dev tanpa server SMTP live, catat log tanpa menghentikan proses aplikasi
    console.warn(`[EMAIL-SERVICE] Server SMTP offline atau tidak dapat dijangkau. Email simulasi untuk ${to}:`, err.message);
    return {
      success: true,
      simulated: true,
      message: 'Email dicatat dalam mode simulasi (offline SMTP)'
    };
  }
};

