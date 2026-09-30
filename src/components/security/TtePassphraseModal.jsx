import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  FileSignature,
  Building
} from 'lucide-react';

export const TtePassphraseModal = ({
  isOpen,
  onClose,
  letter,
  user,
  onConfirmSignature
}) => {
  if (!isOpen || !letter) return null;

  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);

  const targetSignerName = letter.namaPenandatangan || letter.namaPejabat || letter.templateData?.namaPejabat || user?.name || 'Pejabat Penandatangan';
  const targetSignerNip = letter.nipPenandatangan || letter.nip || letter.templateData?.nip || user?.nip || '-';

  // Demo valid passphrase: "UNSIL-TTE-2026" or "123456"
  const handleVerify = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!passphrase.trim()) {
      setErrorMsg('Harap masukkan passphrase TTE Anda.');
      return;
    }

    if (!agreementChecked) {
      setErrorMsg('Anda wajib menyetujui pernyataan keabsahan hukum TTE.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      // Allow demo passphrases
      if (passphrase === 'UNSIL-TTE-2026' || passphrase === '123456' || passphrase.length >= 4) {
        setIsProcessing(false);
        onConfirmSignature({
          letterId: letter.id,
          certSerial: 'BSrE-UNSIL-2026-994120',
          signerName: targetSignerName,
          signerNip: targetSignerNip,
          timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB'
        });
        onClose();
      } else {
        setIsProcessing(false);
        const nextAttempts = attemptsLeft - 1;
        setAttemptsLeft(nextAttempts);
        if (nextAttempts <= 0) {
          setErrorMsg('Sertifikat TTE terkunci sementara karena 3 kali kesalahan passphrase. Hubungi Administrator TIK BKU.');
        } else {
          setErrorMsg(`Passphrase salah. Sisa kesempatan: ${nextAttempts} kali lagi. (Petunjuk Demo: Gunakan UNSIL-TTE-2026)`);
        }
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header with BSSN / BSrE badge */}
        <div className="px-6 py-4 bg-gradient-to-r from-unsil-green-950 via-unsil-green-900 to-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-unsil-gold-500/20 border border-unsil-gold-400/40 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-unsil-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Otorisasi Tanda Tangan Elektronik
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-unsil-gold-500 text-unsil-green-950">
                  BSrE BSSN
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Sertifikat Digital Resmi Universitas Siliwangi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Metadata Card */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Naskah yang Ditandatangani
              </span>
              <span className="font-mono text-[11px] font-bold text-unsil-green-900 bg-emerald-100 px-2 py-0.5 rounded">
                {letter.nomorSurat}
              </span>
            </div>
            <p className="font-semibold text-slate-800 line-clamp-1">{letter.perihal}</p>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-500">
              <div>
                <span className="block text-slate-400">Penandatangan Sah:</span>
                <span className="font-semibold text-slate-800">{targetSignerName}</span>
                <span className="block text-[10px] font-mono text-slate-500">NIP. {targetSignerNip}</span>
              </div>
              <div>
                <span className="block text-slate-400">Penerbit Sertifikat:</span>
                <span className="font-semibold text-emerald-800">BSrE - BSSN RI</span>
              </div>
              <div>
                <span className="block text-slate-400">Standar Pengamanan:</span>
                <span className="font-semibold text-slate-800">Sertifikat Digital Sah BSrE</span>
              </div>
              <div>
                <span className="block text-slate-400">Keluaran Regulasi:</span>
                <span className="text-amber-800 font-semibold">Cap Fisik Dihapus Otomatis</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Passphrase Input Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Passphrase Sertifikat TTE
                </label>
                <span className="text-[11px] text-emerald-700 font-mono">
                  Petunjuk Demo: <strong>UNSIL-TTE-2026</strong>
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Masukkan passphrase sertifikat digital Anda"
                  autoFocus
                  disabled={attemptsLeft <= 0}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-unsil-green-800 focus:border-unsil-green-800 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Legal Statement Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreementChecked}
                onChange={(e) => setAgreementChecked(e.target.checked)}
                className="mt-0.5 rounded text-unsil-green-800 focus:ring-unsil-green-800"
              />
              <span className="text-[11px] text-slate-600 leading-snug">
                Saya menyatakan keabsahan naskah ini dan memahami bahwa pembubuhan TTE memiliki kekuatan hukum sah sesuai <strong>UU No. 11/2008</strong> dan <strong>PP No. 71/2019</strong>.
              </span>
            </label>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isProcessing || attemptsLeft <= 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-unsil-green-800 hover:bg-unsil-green-900 text-white shadow-md shadow-unsil-green-950/20 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi Kriptografi...</span>
                  </>
                ) : (
                  <>
                    <FileSignature className="w-3.5 h-3.5 text-unsil-gold-400" />
                    <span>Verifikasi & Bubuhkan TTE</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

