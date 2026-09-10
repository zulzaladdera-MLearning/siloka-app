import React, { useState } from 'react';
import {
  X,
  SendHorizontal,
  FileText,
  UserCheck,
  Calendar,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import unitKerjaList from '../../data/unitKerja.json';
import usersData from '../../data/users.json';

export const QuickDisposisiModal = ({
  letter,
  isOpen,
  onClose,
  onSubmitDisposisi,
  allLetters = []
}) => {
  if (!isOpen) return null;

  const defaultPimpinanBKU = 'BKU - Kepala Biro Keuangan dan Umum';

  const [selectedLetterId, setSelectedLetterId] = useState(
    letter ? letter.id : allLetters[0]?.id || ''
  );
  const [targetUnit, setTargetUnit] = useState(defaultPimpinanBKU);
  const [sifatInstruksi, setSifatInstruksi] = useState('Segera');
  const [actions, setActions] = useState(['Tindak Lanjuti']);
  const [customNote, setCustomNote] = useState('');
  const [dueDate, setDueDate] = useState('2026-09-14');

  const selectedLetterObj = allLetters.find((l) => l.id === selectedLetterId) || letter;

  const actionChecklist = [
    'Tindak Lanjuti',
    'Pelajari / Telaah Staf',
    'Hadiri / Wakilkan',
    'Koordinasikan dengan Unit Terkait',
    'Simpan / Arsipkan di Brankas',
  ];

  const handleToggleAction = (item) => {
    if (actions.includes(item)) {
      setActions(actions.filter((a) => a !== item));
    } else {
      setActions([...actions, item]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitDisposisi({
      letterId: selectedLetterId,
      nomorAgenda: `AGD-${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      targetUnit,
      sifatInstruksi,
      actions,
      customNote,
      dueDate,
      timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-unsil-green-950 to-unsil-green-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-unsil-gold-500/20 border border-unsil-gold-400/40 flex items-center justify-center">
              <SendHorizontal className="w-5 h-5 text-unsil-gold-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Lembar E-Disposisi Elektronik BKU
              </h2>
              <p className="text-xs text-emerald-200">
                Penerusan instruksi pimpinan secara berjenjang
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Target Surat Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Surat yang Disposisikan
            </label>
            <select
              value={selectedLetterId}
              onChange={(e) => setSelectedLetterId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800"
            >
              {allLetters.map((l) => (
                <option key={l.id} value={l.id}>
                  [{l.nomorSurat}] - {l.perihal.slice(0, 65)}...
                </option>
              ))}
            </select>
          </div>

          {selectedLetterObj && (
            <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-unsil-green-800 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">{selectedLetterObj.perihal}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pengirim: <strong>{selectedLetterObj.pengirim}</strong> ({selectedLetterObj.tanggal})
                </p>
              </div>
            </div>
          )}

          {/* Recipient Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Diteruskan Kepada (Unit / Pejabat)
              </label>
              <select
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800"
              >
                {unitKerjaList.map((unit) => {
                  const pimpinan = usersData.find(
                    (u) => u.unit_kerja_id === unit.kode_unit && (u.role === 'PEJABAT' || u.role === 'PENGAWAS')
                  );
                  const staf = usersData.find(
                    (u) => u.unit_kerja_id === unit.kode_unit && (u.role === 'OPERATOR_UNIT' || u.role === 'STAF_PERSURATAN')
                  );

                  return (
                    <optgroup key={unit.kode_unit} label={`${unit.singkatan} - ${unit.nama_unit}`}>
                      {pimpinan && (
                        <option value={`${unit.singkatan} - ${pimpinan.roleLabel}`}>
                          Pimpinan: {pimpinan.roleLabel}
                        </option>
                      )}
                      {staf && (
                        <option value={`${unit.singkatan} - ${staf.roleLabel}`}>
                          Staf Operator: {staf.roleLabel}
                        </option>
                      )}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Sifat Instruksi
              </label>
              <select
                value={sifatInstruksi}
                onChange={(e) => setSifatInstruksi(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800"
              >
                <option value="Sangat Segera">Sangat Segera (24 Jam)</option>
                <option value="Segera">Segera (3 Hari)</option>
                <option value="Biasa">Biasa (7 Hari)</option>
                <option value="Rahasia">Rahasia Internal</option>
              </select>
            </div>
          </div>

          {/* Action Checklist */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Petunjuk / Tindakan Disposisi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actionChecklist.map((item) => (
                <label
                  key={item}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                    actions.includes(item)
                      ? 'bg-emerald-50 border-unsil-green-700/50 text-unsil-green-950 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={actions.includes(item)}
                    onChange={() => handleToggleAction(item)}
                    className="rounded text-unsil-green-800 focus:ring-unsil-green-800"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Catatan Instruksi Khusus Kepala Biro
            </label>
            <textarea
              rows={3}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Tambahkan arahan detail atau penugasan personel..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800"
            />
          </div>

          {/* Batas Waktu */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tenggat Waktu Penyelesaian (Due Date)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-unsil-green-800/20 focus:border-unsil-green-800"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-unsil-green-800 hover:bg-unsil-green-900 text-white shadow-sm transition-colors"
            >
              <SendHorizontal className="w-3.5 h-3.5 text-unsil-gold-400" />
              <span>Simpan & Kirim E-Disposisi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

