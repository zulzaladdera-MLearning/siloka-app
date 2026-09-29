import React, { useState, useMemo, useRef } from 'react';
import ExcelJS from 'exceljs';
import {
  Settings,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  Users,
  KeyRound,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  Search,
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  UserCheck,
  FileCheck,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  X,
  Sparkles,
  UserPlus,
  Copy,
  Check,
  Key
} from 'lucide-react';
import unitKerjaList from '../../data/unitKerja.json';
import {
  triggerSimpegSync,
  validateExcelFileClient,
  importUsersExcel,
  mutateUserJobAssignment,
  createUser,
  configureTteCredentials,
  downloadExcelTemplate
} from '../../services/adminService';
import UserRegistrationModal from './UserRegistrationModal';
import { UnitMutationManager } from './UnitMutationManager';
import { isSuperAdminUser } from '../../utils/authGuards';

export const SystemSettingsView = ({
  user,
  allUsers = [],
  onUpdateUsers,
  showToast = () => {}
}) => {
  // Otorisasi ketat di tingkat komponen
  const isSuperAdmin = isSuperAdminUser(user);

  // Sub-tab navigasi: 'simpeg', 'excel', 'mutasi', 'tte', 'satker'
  const [activeTab, setActiveTab] = useState('simpeg');

  // State: Sinkronisasi SIMPEG
  const [isSyncingSimpeg, setIsSyncingSimpeg] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('16 Sep 2026, 08:30 WIB');
  const [simpegResults, setSimpegResults] = useState([]);
  const [simpegStats, setSimpegStats] = useState({ total: 32, updated: 28, inserted: 4 });

  // State: Impor Excel .xlsx
  const fileInputRef = useRef(null);
  const [excelFile, setExcelFile] = useState(null);
  const [excelError, setExcelError] = useState('');
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [excelImportResult, setExcelImportResult] = useState(null);
  const [excelPreviewRows, setExcelPreviewRows] = useState([
    {
      nip: '198802102014041001',
      nama: 'Budi Santoso, S.Kom., M.Cs.',
      email: 'budi.santoso@unsil.ac.id',
      unit_kerja: 'UN58.13',
      jabatan: 'Dosen Informatika FT',
      role: 'OPERATOR_UNIT',
      status: 'Valid'
    },
    {
      nip: '199105152019032002',
      nama: 'Lina Marlina, S.Pd., M.Hum.',
      email: 'lina.marlina@unsil.ac.id',
      unit_kerja: 'UN58.33',
      jabatan: 'Pengelola Layanan Bahasa',
      role: 'OPERATOR_UNIT',
      status: 'Valid'
    },
    {
      nip: '199403222020121004',
      nama: 'Reza Fauzi, S.T.',
      email: 'reza.fauzi@unsil.ac.id',
      unit_kerja: 'UN58.32',
      jabatan: 'Staf Server UPA TIK',
      role: 'OPERATOR_UNIT',
      status: 'Valid'
    }
  ]);

  // State: Pemetaan User & Mutasi
  const [userSearch, setUserSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');
  const [selectedUserForMutation, setSelectedUserForMutation] = useState(null);
  const [isMutating, setIsMutating] = useState(false);
  const [mutationSuccessData, setMutationSuccessData] = useState(null);
  const [mutationForm, setMutationForm] = useState({
    unit_kerja_id: 'UN58.6',
    role: 'OPERATOR_UNIT',
    role_label: '',
    email: '',
    password_baru: '',
    is_auto_generate: false
  });

  // State: Modul Tambah User (Super Admin)
  const [isAddUserModalOpen, setIsAddUserOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [addUserSuccessData, setAddUserSuccessData] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    nama: '',
    nip: '',
    email: '',
    kode_unit: 'UN58.13',
    jabatan: 'Dosen Biasa / Tanpa Jabatan'
  });

  // State: Konfigurasi Sertifikat TTE BSrE
  const [selectedPejabatId, setSelectedPejabatId] = useState('usr-01');
  const [nikBssn, setNikBssn] = useState('3278011608670001');
  const [ttePassphrase, setTtePassphrase] = useState('UNSIL-TTE-2026');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [certFileName, setCertFileName] = useState('sertifikat_tte_rektor.p12');
  const [isSavingTte, setIsSavingTte] = useState(false);
  const [tteSaveSuccess, setTteSaveSuccess] = useState(false);

  // Filter daftar pengguna
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const q = userSearch.toLowerCase();
      const matchSearch =
        (u.nama_lengkap && u.nama_lengkap.toLowerCase().includes(q)) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.nip && u.nip.includes(q)) ||
        (u.nip_nik && u.nip_nik.includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q));

      const matchUnit = filterUnit === 'ALL' || u.unit_kerja_id === filterUnit;
      const matchRole =
        filterRole === 'ALL' ||
        u.role === filterRole ||
        (filterRole === 'DOSEN' && (u.role === 'DOSEN' || u.role === 'Dosen'));

      return matchSearch && matchUnit && matchRole;
    });
  }, [allUsers, userSearch, filterUnit, filterRole]);

  // Daftar pejabat/penandatangan surat (PEJABAT / PIMPINAN)
  const pejabatList = useMemo(() => {
    return allUsers.filter((u) => u.role === 'PEJABAT' || u.roleLevel?.includes('Pimpinan'));
  }, [allUsers]);

  // Jika bukan Super Admin, tampilkan halaman 403 Forbidden
  if (!isSuperAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-6 bg-white rounded-2xl border border-rose-200 shadow-sm my-8">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-rose-50">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">403 Forbidden: Akses Dibatasi</h2>
          <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed">
            Modul <strong>Pengaturan Sistem</strong> menggunakan otorisasi Role-Based Access Control (RBAC)
            dan hanya boleh diakses oleh akun dengan role <strong>Super Admin</strong>.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono text-slate-700 mt-2">
            <span>Peran Anda saat ini:</span>
            <span className="font-bold text-rose-700">{user?.role || 'Pengguna Reguler'}</span>
          </div>
        </div>
      </div>
    );
  }

  // 1. Handler Sinkronisasi SIMPEG (Tugas 2)
  const handleSyncSimpeg = async () => {
    setIsSyncingSimpeg(true);
    try {
      const res = await triggerSimpegSync(user);
      if (res && res.success) {
        setSimpegResults(res.data || []);
        setSimpegStats({
          total: res.stats?.totalFetched || res.data?.length || 0,
          updated: res.stats?.updatedCount || 0,
          inserted: res.stats?.insertedCount || 0
        });
        setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB');
        showToast('Sinkronisasi SIMPEG Berhasil! Data kepegawaian telah disinkronkan ke tm_user.', 'success');
      } else {
        showToast('Sinkronisasi SIMPEG gagal: ' + (res?.message || 'Koneksi terputus'), 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat memproses data SIMPEG: ' + err.message, 'error');
    } finally {
      setIsSyncingSimpeg(false);
    }
  };

  // 2. Handler Validasi & Upload File Excel .xlsx (Tugas 3)
  const handleExcelFileSelect = async (e) => {
    const file = e.target.files?.[0];
    setExcelError('');
    setExcelImportResult(null);

    if (!file) return;

    // VALIDASI FORMAT KETAT DI SISI KLIEN: HANYA MENERIMA .xlsx
    const validation = validateExcelFileClient(file);
    if (!validation.valid) {
      setExcelError(validation.error);
      setExcelFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast(validation.error, 'error');
      return;
    }

    setExcelFile(file);

    // KUNCI: Parsing isi file Excel terkini langsung dari buffer memory browser
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];

      if (worksheet) {
        const dynamicRows = [];
        let headerMap = {};

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            row.eachCell((cell, colNumber) => {
              const key = String(cell.text || cell.value || '').trim().toLowerCase();
              headerMap[colNumber] = key;
            });
          } else {
            const rowData = {
              nip: '',
              nama: '',
              email: '',
              unit_kerja: '',
              jabatan: 'Pegawai',
              role: 'OPERATOR_UNIT',
              status: 'Valid'
            };

            row.eachCell((cell, colNumber) => {
              const colName = headerMap[colNumber] || '';
              const val = cell.text ? cell.text.trim() : String(cell.value || '').trim();

              if (colName.includes('nip')) rowData.nip = val;
              else if (colName.includes('nama')) rowData.nama = val;
              else if (colName.includes('email')) rowData.email = val;
              else if (colName.includes('unit')) rowData.unit_kerja = val;
              else if (colName.includes('jabatan')) rowData.jabatan = val;
              else if (colName.includes('role')) rowData.role = val;
            });

            if (rowData.nip || rowData.nama) {
              dynamicRows.push(rowData);
            }
          }
        });

        if (dynamicRows.length > 0) {
          setExcelPreviewRows(dynamicRows);
          showToast(`Berkas '${file.name}' dimuat (${dynamicRows.length} baris data berhasil dibaca).`, 'info');
          return;
        }
      }
      showToast(`Berkas '${file.name}' valid. Siap diproses untuk impor massal.`, 'info');
    } catch (parseErr) {
      console.warn('Gagal mem-parsing pratinjau lokal Excel:', parseErr);
      showToast(`Berkas '${file.name}' siap diunggah ke backend.`, 'info');
    }
  };

  const handleResetExcelUpload = () => {
    setExcelFile(null);
    setExcelError('');
    setExcelImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Pilihan berkas berhasil dibersihkan.', 'info');
  };

  const handleProcessExcelUpload = async () => {
    if (!excelFile) {
      setExcelError('Harap pilih berkas .xlsx terlebih dahulu.');
      return;
    }

    setIsUploadingExcel(true);
    setExcelError('');

    try {
      const result = await importUsersExcel(excelFile, excelPreviewRows, user);
      if (result && result.success) {
        setExcelImportResult(result);
        showToast(`Impor Massal Berhasil! ${result.summary.validCount} pegawai ditambahkan/diperbarui.`, 'success');

        // Jika ada handler update user ke parent
        if (onUpdateUsers && result.data?.length > 0) {
          onUpdateUsers(result.data);
        }

        // KUNCI FRONTEND: Bersihkan state file dan reset elemen input HTML
        setExcelFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setExcelError(result?.message || 'Gagal memproses berkas Excel.');
        showToast('Impor berkas Excel gagal.', 'error');
      }
    } catch (err) {
      setExcelError(err.message);
      showToast('Error impor berkas: ' + err.message, 'error');
    } finally {
      setIsUploadingExcel(false);
    }
  };

  // Handler Download Template Excel
  const handleDownloadTemplate = async () => {
    try {
      showToast('Menyiapkan template Excel (.xlsx)...', 'info');
      await downloadExcelTemplate();
      showToast('Template Excel (.xlsx) berhasil diunduh.', 'success');
    } catch (err) {
      showToast('Gagal mengunduh template: ' + err.message, 'error');
    }
  };

  // 3. Handler Buka Modal Mutasi Pegawai (Tugas 4)
  const handleOpenMutation = (targetUser) => {
    setSelectedUserForMutation(targetUser);
    setMutationForm({
      unit_kerja_id: targetUser.unit_kerja_id || targetUser.id_unit || targetUser.kode_unit || 'UN58.6',
      role: targetUser.role || targetUser.id_role || 'OPERATOR_UNIT',
      role_label: targetUser.roleLabel || targetUser.role_label || targetUser.jabatan || '',
      email: targetUser.email || `${targetUser.nip || targetUser.nip_nik || 'pegawai'}@unsil.ac.id`,
      password_baru: '',
      is_auto_generate: false
    });
  };

  const handleToggleAutoGenPassword = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      const random4 = Math.floor(1000 + Math.random() * 9000);
      const generated = `Unsil${random4}`;
      setMutationForm((prev) => ({
        ...prev,
        is_auto_generate: true,
        password_baru: generated
      }));
    } else {
      setMutationForm((prev) => ({
        ...prev,
        is_auto_generate: false,
        password_baru: ''
      }));
    }
  };

  const handleSaveMutation = async (e) => {
    e.preventDefault();
    if (!selectedUserForMutation) return;

    setIsMutating(true);
    try {
      const employeeName = selectedUserForMutation.nama_lengkap || selectedUserForMutation.nama || selectedUserForMutation.name;
      const targetUserId = selectedUserForMutation.id || selectedUserForMutation.nip || selectedUserForMutation.nip_nik;

      const payload = {
        ...mutationForm,
        nama: employeeName,
        nama_lengkap: employeeName
      };

      const res = await mutateUserJobAssignment(targetUserId, payload, user);
      if (res && res.success) {
        // Cari nama unit
        const targetUnitObj = unitKerjaList.find((u) => u.kode_unit === mutationForm.unit_kerja_id);
        const unitName = targetUnitObj ? `${targetUnitObj.nama_unit} (${targetUnitObj.singkatan})` : mutationForm.unit_kerja_id;
        const activeEmail = mutationForm.email;
        const pwdStatus = mutationForm.password_baru && mutationForm.password_baru.trim() !== ''
          ? mutationForm.password_baru.trim()
          : 'Tidak Berubah';

        // Update list lokal
        if (onUpdateUsers) {
          onUpdateUsers([
            {
              ...selectedUserForMutation,
              unit_kerja_id: mutationForm.unit_kerja_id,
              kode_unit: mutationForm.unit_kerja_id,
              unit: unitName,
              email: activeEmail,
              role: mutationForm.role,
              roleLabel: mutationForm.role_label || selectedUserForMutation.roleLabel
            }
          ]);
        }

        const flashMsg = `Mutasi Berhasil! Pegawai ${employeeName} telah dipindahkan ke ${unitName}. Email Aktif: ${activeEmail}. Password Baru: ${pwdStatus}`;

        setMutationSuccessData({
          flashMessage: flashMsg,
          nama: employeeName,
          unit: unitName,
          email: activeEmail,
          passwordStatus: pwdStatus,
          passwordChanged: pwdStatus !== 'Tidak Berubah'
        });

        showToast(flashMsg, 'success');
        setSelectedUserForMutation(null);
      } else {
        showToast('Gagal memproses mutasi: ' + (res?.message || 'Unknown error'), 'error');
      }
    } catch (err) {
      showToast('Kesalahan saat memproses mutasi: ' + err.message, 'error');
    } finally {
      setIsMutating(false);
    }
  };

  // 3B. Handler Modul Tambah User (Super Admin)
  const handleOpenAddUser = () => {
    setNewUserForm({
      nama: '',
      nip: '',
      email: '',
      kode_unit: 'UN58.13',
      jabatan: 'Dosen Biasa / Tanpa Jabatan'
    });
    setIsAddUserOpen(true);
  };

  const handleNipChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setNewUserForm((prev) => ({
      ...prev,
      nip: val,
      email: (!prev.email || prev.email.includes('@unsil.ac.id')) && val ? `${val}@unsil.ac.id` : prev.email
    }));
  };

  const handleSubmitNewUser = async (e) => {
    e.preventDefault();
    if (!newUserForm.nama.trim()) {
      showToast('Nama lengkap dan gelar wajib diisi.', 'warning');
      return;
    }
    if (!newUserForm.nip || newUserForm.nip.length < 5) {
      showToast('NIP / NIK minimal 5 digit angka.', 'warning');
      return;
    }
    if (!newUserForm.kode_unit) {
      showToast('Satuan kerja wajib dipilih.', 'warning');
      return;
    }

    setIsCreatingUser(true);
    try {
      const res = await createUser(newUserForm, user);
      if (res && res.success) {
        const createdUser = res.data;
        const flashMsg = res.flashMessage || res.message;

        // Simpan data untuk Flash Message dan dialog detail
        setAddUserSuccessData({
          user: createdUser,
          flashMessage: flashMsg,
          rawPassword: createdUser.raw_password,
          username: createdUser.username || createdUser.nip,
          nama: createdUser.nama_lengkap || createdUser.nama || createdUser.name,
          unit: createdUser.unit || createdUser.kode_unit,
          jabatan: createdUser.jabatan,
          is_pejabat: createdUser.is_pejabat
        });

        // Mutasikan state master users ke komponen induk
        if (onUpdateUsers) {
          onUpdateUsers([createdUser]);
        }

        showToast(flashMsg, 'success');
        setIsAddUserOpen(false);
      } else {
        showToast('Gagal membuat user baru: ' + (res?.message || 'Error tidak diketahui'), 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat memproses pembuatan user: ' + err.message, 'error');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleCopyCredentials = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    showToast('Detail kredensial akun berhasil disalin ke clipboard!', 'info');
    setTimeout(() => setIsCopied(false), 3000);
  };

  // 4. Handler Konfigurasi Sertifikat BSrE TTE (Tugas 5)
  const handleSaveTteConfig = async (e) => {
    e.preventDefault();

    if (!nikBssn || !/^\d{16}$/.test(nikBssn)) {
      showToast('NIK BSSN harus berupa 16 digit angka.', 'warning');
      return;
    }

    if (!ttePassphrase || ttePassphrase.length < 6) {
      showToast('Passphrase TTE minimal harus 6 karakter.', 'warning');
      return;
    }

    setIsSavingTte(true);
    try {
      const res = await configureTteCredentials(
        {
          user_id: selectedPejabatId,
          nik: nikBssn,
          passphrase: ttePassphrase,
          cert_file_name: certFileName
        },
        user
      );

      if (res && res.success) {
        setTteSaveSuccess(true);
        showToast('Kredensial BSrE TTE berhasil dienkripsi (AES-256) dan disimpan di penyimpanan privat.', 'success');
        setTimeout(() => setTteSaveSuccess(false), 5000);
      }
    } catch (err) {
      showToast('Gagal mengonfigurasi sertifikat TTE: ' + err.message, 'error');
    } finally {
      setIsSavingTte(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Header Banner Modul Pengaturan Sistem */}
      <div className="bg-gradient-to-r from-unsil-green-950 via-unsil-green-900 to-slate-900 p-6 rounded-2xl border border-unsil-green-800/40 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-unsil-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-unsil-gold-400 text-unsil-green-950 font-bold text-[11px] uppercase tracking-wider">
              RBAC: Super Admin Only
            </span>
            <span className="text-unsil-green-300 text-xs flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Tingkat Keamanan 1 (Biro BKU / UPA TIK)
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-unsil-gold-400" />
            Pengaturan Sistem & Administrasi SILOKA
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Pusat kendali Role-Based Access Control, sinkronisasi otomatis basis data kepegawaian SIMPEG,
            impor massal naskah dinas/pegawai via Excel .xlsx, pemetaan satker & mutasi, serta brankas kriptografi TTE BSrE.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-unsil-green-900/60 backdrop-blur border border-unsil-green-700/50 p-3 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-300 font-medium">Administrator Sesi</p>
              <p className="text-xs font-bold text-white truncate max-w-[170px]">{user?.nama_lengkap || user?.name}</p>
              <p className="text-[10px] text-unsil-gold-300 font-mono">ID: {user?.id || 'usr-admin-01'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigasi Sub-Tab 5 Fitur Utama */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('simpeg')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'simpeg'
              ? 'bg-unsil-green-800 text-white shadow-sm ring-1 ring-unsil-green-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncingSimpeg ? 'animate-spin text-unsil-gold-400' : ''}`} />
          <span>1. Sinkronisasi SIMPEG</span>
        </button>

        <button
          onClick={() => setActiveTab('excel')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'excel'
              ? 'bg-unsil-green-800 text-white shadow-sm ring-1 ring-unsil-green-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>2. Impor Massal (.xlsx)</span>
        </button>

        <button
          onClick={() => setActiveTab('mutasi')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'mutasi'
              ? 'bg-unsil-green-800 text-white shadow-sm ring-1 ring-unsil-green-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-sky-400" />
          <span>3. Tambah User & Mutasi</span>
        </button>

        <button
          onClick={() => setActiveTab('tte')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'tte'
              ? 'bg-unsil-green-800 text-white shadow-sm ring-1 ring-unsil-green-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-400" />
          <span>4. Konfigurasi TTE (BSrE)</span>
        </button>

        <button
          onClick={() => setActiveTab('satker')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'satker'
              ? 'bg-unsil-green-800 text-white shadow-sm ring-1 ring-unsil-green-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4 text-purple-400" />
          <span>5. Matriks 21 Satker</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: INTEGRASI API SIMPEG (Tugas 2) */}
      {/* ========================================================================= */}
      {activeTab === 'simpeg' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-unsil-green-800" />
                  Integrasi & Sinkronisasi Basis Data SIMPEG UNSIL
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Menghubungkan SILOKA ke API SIMPEG untuk melakukan operasi <em>upsert</em> (insert/update) data
                  Nama, Gelar, NIP, Jabatan, dan Satker ke tabel <code>tm_user</code>.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSyncSimpeg}
                  disabled={isSyncingSimpeg}
                  className="px-5 py-2.5 rounded-xl bg-unsil-green-800 hover:bg-unsil-green-900 text-white text-xs font-bold shadow-md shadow-unsil-green-900/20 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingSimpeg ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSimpeg ? 'Sedang Menarik Data...' : 'Sinkronisasi Data Pegawai'}</span>
                </button>
              </div>
            </div>

            {/* Status Koneksi API & Statistik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Endpoint SIMPEG</p>
                <p className="text-xs font-mono font-bold text-slate-800 truncate">https://simpeg.unsil.ac.id/api/v1</p>
                <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-semibold mt-1">
                  <CheckCircle2 className="w-3 h-3" /> Terhubung (Bearer Token Active)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Sinkronisasi Terakhir</p>
                <p className="text-sm font-bold text-slate-900">{lastSyncTime}</p>
                <p className="text-[10px] text-slate-500">Otomatisasi tiap 24 jam / manual</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                <p className="text-[11px] font-semibold text-emerald-800 uppercase">Total Data Terproses</p>
                <p className="text-xl font-black text-emerald-950">{simpegStats.total} Pegawai</p>
                <p className="text-[10px] text-emerald-700 font-medium">Tabel: tm_user (PostgreSQL)</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                <p className="text-[11px] font-semibold text-amber-800 uppercase">Status Operasi Upsert</p>
                <p className="text-xs font-semibold text-slate-800">
                  <span className="text-emerald-700 font-bold">{simpegStats.updated} Update</span> •{' '}
                  <span className="text-sky-700 font-bold">{simpegStats.inserted} Insert Baru</span>
                </p>
                <p className="text-[10px] text-slate-500">Konflik NIP diselesaikan otomatis</p>
              </div>
            </div>

            {/* Progress Bar ketika proses sedang berlangsung */}
            {isSyncingSimpeg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 animate-pulse">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                    Menghubungi Endpoint SIMPEG & Memperbarui Tabel tm_user...
                  </span>
                  <span>78%</span>
                </div>
                <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
                  <div className="h-full bg-unsil-green-700 w-3/4 rounded-full transition-all duration-300" />
                </div>
              </div>
            )}

            {/* Tabel Pratinjau Data Sinkronisasi SIMPEG */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pratinjau Data Kepegawaian Hasil Sinkronisasi Terbaru
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">NIP Pegawai</th>
                      <th className="py-2.5 px-3">Nama Lengkap & Gelar</th>
                      <th className="py-2.5 px-3">Jabatan Fungsional / Struktural</th>
                      <th className="py-2.5 px-3">Kode Unit</th>
                      <th className="py-2.5 px-3 text-center">Tindakan Upsert</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {(simpegResults.length > 0
                      ? simpegResults
                      : [
                          {
                            nip: '196708161996031001',
                            nama_lengkap: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
                            jabatan: 'Rektor Universitas Siliwangi',
                            unit_kerja_id: 'UN58',
                            sync_action: 'UPDATE'
                          },
                          {
                            nip: '197003181995021001',
                            nama_lengkap: 'Dr. Nana Sujana, Drs., M.Si.',
                            jabatan: 'Kepala Biro Keuangan dan Umum',
                            unit_kerja_id: 'UN58.6',
                            sync_action: 'UPDATE'
                          },
                          {
                            nip: '197509122001121001',
                            nama_lengkap: 'Dr. H. Cucu Suherman, M.Pd.',
                            jabatan: 'Dekan FKIP',
                            unit_kerja_id: 'UN58.10',
                            sync_action: 'UPDATE'
                          },
                          {
                            nip: '198904122018031002',
                            nama_lengkap: 'Bayu Nugroho, S.Kom., M.Kom.',
                            jabatan: 'Pranata Komputer Ahli Pertama UPA TIK',
                            unit_kerja_id: 'UN58.32',
                            sync_action: 'INSERT'
                          }
                        ]
                    ).map((pegawai, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{pegawai.nip}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{pegawai.nama_lengkap}</td>
                        <td className="py-2.5 px-3 text-slate-600">{pegawai.jabatan}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-unsil-green-900">{pegawai.unit_kerja_id}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              pegawai.sync_action === 'INSERT'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {pegawai.sync_action || 'SYNCED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: FASILITAS INPUT MASSAL IMPOR EXCEL .xlsx (Tugas 3) */}
      {/* ========================================================================= */}
      {activeTab === 'excel' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                  Fasilitas Input Massal (Impor Berkas Excel .xlsx)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Unggah berkas spreadsheet <code>.xlsx</code> untuk mendaftarkan atau memperbarui pegawai secara massal.
                  Sistem memvalidasi kolom wajib: <strong>NIP, Nama, Email, dan Unit Kerja</strong>.
                </p>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>Unduh Format Template (.xlsx)</span>
              </button>
            </div>

            {/* Error Banner jika Format Tidak Sesuai (.xlsx validation) */}
            {excelError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs animate-shake">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-900">Validasi Berkas Gagal!</p>
                  <p className="mt-0.5 text-rose-700">{excelError}</p>
                </div>
              </div>
            )}

            {/* Dropzone Upload */}
            <div className="border-2 border-dashed border-slate-300 hover:border-unsil-green-700 rounded-2xl p-8 text-center bg-slate-50/50 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                id="excelUploadInput"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onClick={(e) => {
                  // KUNCI UTAMA FRONTEND:
                  // Mengosongkan nilai input sebelum dialog pemilih berkas dibuka.
                  // Hal ini memastikan browser selalu mendeteksi perubahan nilai dan
                  // MEMICU event onChange meskipun user memilih berkas dengan NAMA YANG SAMA!
                  e.target.value = null;
                }}
                onChange={handleExcelFileSelect}
                className="hidden"
              />
              <label
                htmlFor="excelUploadInput"
                className="cursor-pointer flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center ring-4 ring-emerald-50">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {excelFile ? excelFile.name : 'Klik untuk memilih berkas Excel atau seret berkas ke sini'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Format berkas wajib berupa <strong>.xlsx</strong> (Maksimum 10 MB)
                  </p>
                </div>
                {excelFile && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full font-mono text-xs font-bold">
                      {(excelFile.size / 1024).toFixed(1)} KB • Siap Diunggah
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleResetExcelUpload();
                      }}
                      className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-semibold rounded-full transition-colors"
                    >
                      Batal / Ganti Berkas
                    </button>
                  </div>
                )}
              </label>
            </div>

            {/* Tombol Eksekusi Upload */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Kolom wajib terisi: NIP (18 digit), Nama Lengkap, Email @unsil.ac.id, Kode Unit (misal UN58.6)</span>
              </div>

              <button
                onClick={handleProcessExcelUpload}
                disabled={isUploadingExcel || !excelFile}
                className="px-6 py-2.5 rounded-xl bg-unsil-green-800 hover:bg-unsil-green-900 text-white text-xs font-bold shadow-md shadow-unsil-green-900/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <FileCheck className={`w-4 h-4 ${isUploadingExcel ? 'animate-spin' : ''}`} />
                <span>{isUploadingExcel ? 'Memvalidasi & Memproses...' : 'Kirim & Impor ke Database'}</span>
              </button>
            </div>

            {/* Hasil Ringkasan Impor */}
            {excelImportResult && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3 text-xs text-emerald-950">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Hasil Pemrosesan Berkas: {excelImportResult.summary.fileName}
                  </span>
                  <span>
                    {excelImportResult.summary.validCount} Valid / {excelImportResult.summary.totalRows} Total Baris
                  </span>
                </div>
                <p className="text-emerald-800">{excelImportResult.message}</p>
              </div>
            )}

            {/* Pratinjau Tabel Kolom Wajib */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pratinjau Struktur Baris Berkas Excel (Kolom Wajib)
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">NIP (Wajib)</th>
                      <th className="py-2.5 px-3">Nama Pegawai (Wajib)</th>
                      <th className="py-2.5 px-3">Email Kedinasan (Wajib)</th>
                      <th className="py-2.5 px-3">Unit Kerja (Wajib)</th>
                      <th className="py-2.5 px-3">Jabatan & Role</th>
                      <th className="py-2.5 px-3 text-center">Status Kolom</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {excelPreviewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{row.nip}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{row.nama}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{row.email}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-unsil-green-900">{row.unit_kerja}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {row.jabatan} ({row.role})
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" /> Lengkap
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: PEMETAAN USER & MUTASI JABATAN (Tugas 4) */}
      {/* ========================================================================= */}
      {activeTab === 'mutasi' && (
        <div className="space-y-6">
          <UnitMutationManager
            allUsers={allUsers}
            currentUser={user}
            onUpdateUsers={onUpdateUsers}
            showToast={showToast}
          />

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-700" />
                  Pemetaan User, Mutasi & Tambah Akun Baru
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Kelola pendaftaran akun pegawai baru (Dosen Biasa / Pejabat Struktural) serta pemindahan tugas unit kerja (<code>id_unit</code>) dan tingkat otorisasi (<code>role</code>).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenAddUser}
                  className="px-4 py-2.5 rounded-xl bg-unsil-green-800 hover:bg-unsil-green-900 text-white text-xs font-bold shadow-md shadow-unsil-green-900/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-unsil-gold-400" />
                  <span>+ Tambah User Baru</span>
                </button>

                <span className="px-3 py-2 rounded-xl bg-sky-50 text-sky-800 font-semibold text-xs border border-sky-200">
                  Total Pegawai: {allUsers.length}
                </span>
              </div>
            </div>

            {/* Flash Message / Notifikasi Sukses Pembuatan User */}
            {addUserSuccessData && (
              <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-200 text-emerald-900 font-bold text-[10px] tracking-wider uppercase mb-1">
                        <Sparkles className="w-3 h-3 text-unsil-green-900" />
                        Flash Message / Notifikasi Kredensial Baru
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 font-mono select-all bg-white/90 p-3 rounded-xl border border-emerald-300 shadow-inner">
                        {addUserSuccessData.flashMessage}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAddUserSuccessData(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-emerald-100/60 transition-colors"
                    title="Tutup Notifikasi"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-200/60 text-xs">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 font-mono font-semibold text-slate-700 text-[11px]">
                      Username: <strong>{addUserSuccessData.username}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 font-mono font-bold text-unsil-green-900 text-[11px]">
                      Password: <strong>{addUserSuccessData.rawPassword}</strong>
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                      addUserSuccessData.is_pejabat ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900 border border-blue-300'
                    }`}>
                      is_pejabat = {addUserSuccessData.is_pejabat ? 'TRUE (Struktural)' : 'FALSE (Dosen Biasa)'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCredentials(addUserSuccessData.flashMessage)}
                    className="px-3.5 py-1.5 rounded-lg bg-unsil-green-800 hover:bg-unsil-green-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-unsil-gold-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Tersalin!' : 'Salin Detail Akun'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Flash Message / Notifikasi Sukses Mutasi Pegawai */}
            {mutationSuccessData && (
              <div className="p-4 rounded-2xl bg-sky-50 border-2 border-sky-400 text-sky-950 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-200 text-sky-900 font-bold text-[10px] tracking-wider uppercase mb-1">
                        <Sparkles className="w-3 h-3 text-sky-900" />
                        Flash Message / Notifikasi Mutasi & Kredensial
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 font-mono select-all bg-white/90 p-3 rounded-xl border border-sky-300 shadow-inner">
                        {mutationSuccessData.flashMessage}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMutationSuccessData(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-sky-100/60 transition-colors"
                    title="Tutup Notifikasi"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-sky-200/60 text-xs">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-sky-200 font-medium text-slate-700 text-[11px]">
                      Pegawai: <strong>{mutationSuccessData.nama}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-sky-200 font-medium text-slate-700 text-[11px]">
                      Unit Baru: <strong>{mutationSuccessData.unit}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-sky-200 font-medium text-slate-700 text-[11px]">
                      Email: <strong>{mutationSuccessData.email}</strong>
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold ${
                      mutationSuccessData.passwordChanged ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}>
                      Password: <strong>{mutationSuccessData.passwordStatus}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCredentials(mutationSuccessData.flashMessage)}
                    className="px-3.5 py-1.5 rounded-lg bg-sky-800 hover:bg-sky-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-unsil-gold-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Tersalin!' : 'Salin Detail Mutasi'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Filter & Pencarian */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama pegawai, NIP, atau email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-unsil-green-700"
                />
              </div>

              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 w-full sm:w-auto"
              >
                <option value="ALL">Semua Satuan Kerja ({unitKerjaList.length})</option>
                {unitKerjaList.map((u) => (
                  <option key={u.id} value={u.kode_unit}>
                    {u.kode_unit} - {u.singkatan}
                  </option>
                ))}
              </select>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 w-full sm:w-auto"
              >
                <option value="ALL">Semua Role</option>
                <option value="DOSEN">DOSEN (Dosen / Tenaga Pendidik)</option>
                <option value="PEJABAT">PEJABAT (Pimpinan)</option>
                <option value="OPERATOR_UNIT">OPERATOR_UNIT (Staf TU)</option>
                <option value="PENGAWAS">PENGAWAS (SPI)</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>

            {/* Tabel Daftar Pengguna */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Pegawai / Identitas</th>
                    <th className="py-3 px-3">NIP ASN / NIK</th>
                    <th className="py-3 px-3">Unit Kerja (id_unit)</th>
                    <th className="py-3 px-3">Jabatan & Role</th>
                    <th className="py-3 px-3 text-center">Aksi Mutasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.slice(0, 15).map((u) => {
                    const unitObj = unitKerjaList.find((uk) => uk.kode_unit === u.unit_kerja_id);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={u.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{u.nama_lengkap || u.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">{u.nip || u.nip_nik}</td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-unsil-green-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            {u.unit_kerja_id}
                          </span>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[180px]">
                            {unitObj ? unitObj.nama_unit : u.unit}
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{u.roleLabel || u.role_label || '-'}</span>
                            <span className="text-[10px] text-unsil-green-800 font-bold uppercase">{u.role}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleOpenMutation(u)}
                            className="px-3 py-1.5 rounded-lg bg-unsil-green-50 hover:bg-unsil-green-800 hover:text-white text-unsil-green-900 border border-unsil-green-300 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Mutasi Pegawai</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-400 text-right">
              Menampilkan {Math.min(15, filteredUsers.length)} dari {filteredUsers.length} pegawai yang cocok
            </p>
          </div>

          {/* Modal Dialog Mutasi Pegawai */}
          {selectedUserForMutation && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Form Mutasi Penugasan Pegawai</h4>
                      <p className="text-[11px] text-slate-500">Pembaruan relasi id_unit & role di tabel tm_user</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUserForMutation(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <p className="font-bold text-slate-900">
                    {selectedUserForMutation.nama_lengkap || selectedUserForMutation.name}
                  </p>
                  <p className="text-slate-500 font-mono">NIP: {selectedUserForMutation.nip || selectedUserForMutation.nip_nik}</p>
                  <p className="text-slate-500">Unit Kerja Saat Ini: <strong className="text-slate-700">{selectedUserForMutation.unit_kerja_id}</strong></p>
                </div>

                <form onSubmit={handleSaveMutation} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Pilih Satuan Kerja Baru (id_unit / 21 Satker Resmi UNSIL) *
                    </label>
                    <select
                      value={mutationForm.unit_kerja_id}
                      onChange={(e) => setMutationForm({ ...mutationForm, unit_kerja_id: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-unsil-green-700"
                    >
                      {unitKerjaList.map((u) => (
                        <option key={u.id} value={u.kode_unit}>
                          [{u.kode_unit}] {u.nama_unit} ({u.singkatan})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Tingkat Otorisasi / Role Baru *
                    </label>
                    <select
                      value={mutationForm.role?.toUpperCase() === 'DOSEN' ? 'DOSEN' : mutationForm.role}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setMutationForm((prev) => ({
                          ...prev,
                          role: newRole,
                          role_label: newRole === 'DOSEN' && (!prev.role_label || prev.role_label === 'Staf Tata Usaha') ? 'Dosen' : prev.role_label
                        }));
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-unsil-green-700"
                    >
                      <option value="DOSEN">DOSEN (Dosen / Tenaga Pendidik)</option>
                      <option value="OPERATOR_UNIT">OPERATOR_UNIT (Pelaksana / Tata Usaha Satker)</option>
                      <option value="PEJABAT">PEJABAT (Pimpinan Satker / Penandatangan TTE)</option>
                      <option value="STAF_PERSURATAN">STAF_PERSURATAN (Pengelola Naskah Biro)</option>
                      <option value="PENGAWAS">PENGAWAS (Satuan Pengawas Internal - SPI)</option>
                      <option value="Super Admin">Super Admin (Administrator Utama)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Nama Jabatan Baru (Role Label)
                    </label>
                    <input
                      type="text"
                      value={mutationForm.role_label}
                      onChange={(e) => setMutationForm({ ...mutationForm, role_label: e.target.value })}
                      placeholder="Contoh: Staf Tata Usaha Fakultas Teknik"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-unsil-green-700"
                    />
                  </div>

                  {/* Section Terpisah: Kredensial & Kontak Akun */}
                  <div className="pt-3 pb-1 border-t border-slate-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        Kredensial & Kontak Akun
                      </h5>
                    </div>

                    <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
                      {/* Email Kedinasan */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Email Kedinasan *
                        </label>
                        <input
                          type="email"
                          required
                          value={mutationForm.email}
                          onChange={(e) => setMutationForm({ ...mutationForm, email: e.target.value })}
                          placeholder="nama.pegawai@unsil.ac.id"
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-unsil-green-700"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Menampilkan email aktif saat ini. Dapat diedit jika terjadi pembaruan instansi.
                        </p>
                      </div>

                      {/* Reset Password Baru & Checkbox Generate Password Otomatis */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <label className="block font-bold text-slate-700">
                            Reset Password Baru <span className="font-normal text-slate-500">(Opsional)</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-semibold text-unsil-green-800 hover:text-unsil-green-950">
                            <input
                              type="checkbox"
                              checked={mutationForm.is_auto_generate}
                              onChange={handleToggleAutoGenPassword}
                              className="rounded border-slate-300 text-unsil-green-700 focus:ring-unsil-green-700 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span>Generate Password Otomatis</span>
                          </label>
                        </div>

                        <div className="relative">
                          <input
                            type={mutationForm.is_auto_generate ? 'text' : 'password'}
                            value={mutationForm.password_baru}
                            onChange={(e) => setMutationForm({ ...mutationForm, password_baru: e.target.value })}
                            placeholder={mutationForm.is_auto_generate ? 'Password acak ter-generate otomatis' : 'Kosongkan jika tidak ingin mengubah password'}
                            className={`w-full p-2.5 bg-white border rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-unsil-green-700 ${
                              mutationForm.is_auto_generate
                                ? 'border-unsil-green-600 bg-emerald-50/50 font-bold text-unsil-green-950 shadow-inner'
                                : 'border-slate-300'
                            }`}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {mutationForm.is_auto_generate ? (
                            <span className="text-emerald-700 font-semibold">
                              ✓ Password acak berhasil di-generate secara real-time dalam format teks terbuka (clear-text).
                            </span>
                          ) : (
                            'Jika dikosongkan, sistem membypass dan tidak akan mengubah password lama di database.'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedUserForMutation(null)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isMutating}
                      className="px-5 py-2 rounded-xl bg-unsil-green-800 hover:bg-unsil-green-900 text-white font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isMutating ? 'Menyimpan...' : 'Simpan Mutasi'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Dialog Form Registrasi User Baru & RBAC Tupoksi (Super Admin) */}
          {isAddUserModalOpen && (
            <UserRegistrationModal
              isOpen={isAddUserModalOpen}
              onClose={() => setIsAddUserOpen(false)}
              currentUser={user}
              onUserCreated={(newUser) => {
                if (newUser) {
                  const unitCodeRaw = String(newUser.kode_unit_kerja || newUser.unit_kerja_id || 'UN58').trim().toUpperCase();
                  const matchedUnit = unitKerjaList.find(
                    (u) =>
                      String(u.id).toUpperCase() === unitCodeRaw ||
                      String(u.kode_otk || '').toUpperCase() === unitCodeRaw ||
                      String(u.singkatan || '').toUpperCase() === unitCodeRaw
                  );
                  const resolvedUnitId = matchedUnit ? matchedUnit.id : (
                    unitCodeRaw === 'FT' ? 'UN58.13' :
                    unitCodeRaw === 'FKIP' ? 'UN58.10' :
                    unitCodeRaw === 'FEB' ? 'UN58.11' :
                    unitCodeRaw === 'FP' ? 'UN58.12' :
                    unitCodeRaw === 'FISIP' ? 'UN58.14' :
                    unitCodeRaw === 'FIK' ? 'UN58.15' :
                    unitCodeRaw === 'FAI' ? 'UN58.16' :
                    unitCodeRaw === 'PASCA' ? 'UN58.17' :
                    unitCodeRaw === 'LPPM' ? 'UN58.08' :
                    unitCodeRaw === 'LPMPP' ? 'UN58.09' :
                    unitCodeRaw === 'BAKPK' ? 'UN58.06' :
                    unitCodeRaw === 'BKU' ? 'UN58.07' :
                    unitCodeRaw === 'UNSIL' ? 'UN58' : unitCodeRaw
                  );

                  const roleNameStr = String(newUser.role || 'DOSEN').trim();
                  const isPejabatNormalized = Boolean(
                    newUser.is_pejabat ||
                    roleNameStr.toUpperCase() === 'PEJABAT' ||
                    roleNameStr.toUpperCase().includes('DEKAN') ||
                    roleNameStr.toUpperCase().includes('REKTOR') ||
                    roleNameStr.toUpperCase().includes('KEPALA') ||
                    roleNameStr.toUpperCase().includes('KETUA')
                  );
                  const normalizedRoleCode = isPejabatNormalized
                    ? 'PEJABAT'
                    : roleNameStr.toUpperCase().includes('DOSEN')
                      ? 'DOSEN'
                      : roleNameStr.toUpperCase().includes('ADMIN') && !roleNameStr.toUpperCase().includes('SUPER')
                        ? 'ADMIN_UNIT'
                        : roleNameStr;

                  const formattedNewUser = {
                    id: newUser.id_user || newUser.id || `u-${Date.now()}`,
                    id_user: newUser.id_user || newUser.id || `u-${Date.now()}`,
                    nip: newUser.nip_nik || newUser.nip,
                    nip_nik: newUser.nip_nik || newUser.nip,
                    username: newUser.email || newUser.nip_nik,
                    nama: newUser.nama || newUser.nama_lengkap,
                    nama_lengkap: newUser.nama_lengkap || newUser.nama,
                    name: newUser.nama || newUser.nama_lengkap,
                    email: newUser.email,
                    raw_password: newUser.raw_password,
                    kode_unit: unitCodeRaw,
                    kode_unit_kerja: unitCodeRaw,
                    unit_kerja_id: resolvedUnitId,
                    unit: matchedUnit ? matchedUnit.name : unitCodeRaw,
                    jabatan: newUser.jabatan || roleNameStr,
                    role: normalizedRoleCode,
                    roleLabel: newUser.roleLabel || roleNameStr,
                    is_pejabat: isPejabatNormalized,
                    is_active: true,
                    signatureReady: isPejabatNormalized,
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  };

                  if (typeof onUpdateUsers === 'function') {
                    onUpdateUsers([formattedNewUser]);
                  }
                  if (typeof showToast === 'function') {
                    showToast(
                      `Pengguna "${formattedNewUser.nama}" berhasil didaftarkan sebagai ${formattedNewUser.roleLabel}!`,
                      'success'
                    );
                  }
                }
              }}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: KONFIGURASI SERTIFIKAT DIGITAL BSrE TTE (Tugas 5) */}
      {/* ========================================================================= */}
      {activeTab === 'tte' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-700" />
                  Konfigurasi Sertifikat Digital BSrE untuk Tanda Tangan Elektronik (TTE)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Kredensial TTE khusus profil <strong>Pimpinan / Pejabat Penandatangan</strong>. Passphrase dienkripsi
                  menggunakan <strong>AES-256</strong> sebelum disimpan ke basis data, dan berkas sertifikat (<code>.p12</code>/<code>.pfx</code>)
                  disimpan di direktori privat non-publik.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-100 text-amber-900 font-mono text-xs font-bold rounded-lg border border-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-800" /> Standar BSSN RI
                </span>
              </div>
            </div>

            {tteSaveSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-900 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Kredensial Sertifikat TTE BSrE Berhasil Dikonfigurasi!</p>
                  <p className="mt-0.5 text-emerald-700">
                    Passphrase berhasil dienkripsi dengan standar AES-256 dan berkas sertifikat telah diamankan di storage privat terproteksi.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveTteConfig} className="space-y-5 max-w-2xl text-xs">
              {/* Pemilihan Pejabat Penandatangan */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Profil Pejabat Penandatangan Surat (PEJABAT / Pimpinan) *
                </label>
                <select
                  value={selectedPejabatId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    setSelectedPejabatId(selId);
                    const selected = pejabatList.find((p) => p.id === selId);
                    if (selected?.nip || selected?.nip_nik) {
                      setNikBssn(selected.nip_nik?.slice(0, 16) || '3278011608670001');
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-unsil-green-700"
                >
                  {pejabatList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama_lengkap || p.name} — [{p.roleLabel}] ({p.unit_kerja_id})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hanya pejabat yang memiliki kewenangan menerbitkan lembar TTE BSrE yang dapat dikonfigurasikan.
                </p>
              </div>

              {/* Input NIK terdaftar BSSN */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  NIK Terdaftar di Balai Sertifikasi Elektronik (BSSN) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={16}
                    value={nikBssn}
                    onChange={(e) => setNikBssn(e.target.value.replace(/\D/g, ''))}
                    placeholder="Masukkan 16 digit NIK kependudukan"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-unsil-green-700"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-mono">
                    {nikBssn.length}/16 Digit
                  </span>
                </div>
              </div>

              {/* Input Passphrase TTE Mode Password */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Passphrase Sertifikat TTE BSrE (Terenkripsi AES-256) *
                </label>
                <div className="relative">
                  <input
                    type={showPassphrase ? 'text' : 'password'}
                    value={ttePassphrase}
                    onChange={(e) => setTtePassphrase(e.target.value)}
                    placeholder="Masukkan passphrase sertifikat..."
                    className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-unsil-green-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    title={showPassphrase ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-unsil-green-800" />
                  Passphrase tidak pernah disimpan dalam bentuk teks polos (plaintext).
                </p>
              </div>

              {/* Upload Berkas Sertifikat .p12 / .pfx */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Unggah Berkas Kunci Sertifikat (.p12 atau .pfx) *
                </label>
                <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-700" />
                    <span className="font-mono text-slate-700 font-semibold">{certFileName}</span>
                  </div>
                  <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer transition-colors">
                    <span>Ganti Berkas</span>
                    <input
                      type="file"
                      accept=".p12,.pfx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const ext = file.name.split('.').pop().toLowerCase();
                          if (ext === 'p12' || ext === 'pfx') {
                            setCertFileName(file.name);
                            showToast(`Berkas sertifikat '${file.name}' dipilih.`, 'info');
                          } else {
                            showToast('Format tidak valid. Hanya berkas .p12 atau .pfx yang diizinkan.', 'error');
                          }
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Disimpan pada direktori tertutup <code>/storage/private_certificates/</code> (non-public web directory).
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSavingTte}
                  className="px-6 py-2.5 rounded-xl bg-unsil-green-800 hover:bg-unsil-green-900 text-white font-bold shadow-md shadow-unsil-green-900/20 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-unsil-gold-400" />
                  <span>{isSavingTte ? 'Mengenkripsi & Menyimpan...' : 'Simpan Kredensial TTE BSrE'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: MATRIKS 21 SATKER (Referensi Master Unit Kerja) */}
      {/* ========================================================================= */}
      {activeTab === 'satker' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-unsil-green-900" />
                Matriks 21 Satuan Kerja Resmi Universitas Siliwangi
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Berdasarkan Statuta UNSIL dan SK Tata Naskah Dinas Kementerian untuk rumus kodefikasi surat kedinasan.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-unsil-green-950 bg-unsil-gold-400 px-3 py-1 rounded-lg">
              21 Satker Terdaftar
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Kode Unit (Nomor Surat)</th>
                  <th className="py-2.5 px-3">Nama Satuan Kerja</th>
                  <th className="py-2.5 px-3">Singkatan</th>
                  <th className="py-2.5 px-3">Tipe Satker</th>
                  <th className="py-2.5 px-3">Parent Kode</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {unitKerjaList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-unsil-green-900">{u.kode_unit}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{u.nama_unit}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{u.singkatan}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {u.tipe_unit}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{u.parent_kode || 'ROOT'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

