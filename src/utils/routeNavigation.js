/**
 * routeNavigation.js - Sinkronisasi URL & Navigasi Rute Browser SILOKA UNSIL
 * 
 * Menghubungkan activeTab dengan URL browser (HTML5 History API) sehingga:
 * 1. Setiap menu memiliki URL representatif (contoh: /dashboard, /surat-masuk, /manajemen-pengguna)
 * 2. Tautan dapat dibagikan langsung (direct link) dan tetap dipertahankan saat di-refresh
 * 3. Tombol Back/Forward browser berfungsi sinkron dengan pergantian menu
 */

export const TAB_PATH_MAP = {
  dashboard: '/dashboard',
  disposisi: '/disposisi',
  'paraf-tte': '/paraf-tte',
  'surat-masuk': '/surat-masuk',
  'surat-keluar': '/surat-keluar',
  'buku-agenda': '/buku-agenda',
  'brankas-keuangan': '/brankas-keuangan',
  'administrasi-kepegawaian': '/administrasi-kepegawaian',
  'retensi-arsip': '/retensi-arsip',
  'brankas-digital': '/brankas-digital',
  settings: '/manajemen-pengguna',
  'manajemen-user': '/manajemen-pengguna',
  'manajemen-unit': '/manajemen-unit-kerja',
  'manajemen-role': '/manajemen-peran',
  'manajemen-permission': '/hak-akses'
};

export const PATH_TAB_MAP = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/disposisi': 'disposisi',
  '/paraf-tte': 'paraf-tte',
  '/surat-masuk': 'surat-masuk',
  '/surat-keluar': 'surat-keluar',
  '/buku-agenda': 'buku-agenda',
  '/brankas-keuangan': 'brankas-keuangan',
  '/administrasi-kepegawaian': 'administrasi-kepegawaian',
  '/retensi-arsip': 'retensi-arsip',
  '/brankas-digital': 'brankas-digital',
  '/manajemen-pengguna': 'manajemen-user',
  '/manajemen-user': 'manajemen-user',
  '/settings': 'manajemen-user',
  '/manajemen-unit-kerja': 'manajemen-unit',
  '/manajemen-unit': 'manajemen-unit',
  '/manajemen-peran': 'manajemen-role',
  '/manajemen-role': 'manajemen-role',
  '/hak-akses': 'manajemen-permission',
  '/manajemen-permission': 'manajemen-permission'
};

/**
 * Normalisasi format path URL (hapus trailing slash kecuali root '/')
 */
export const normalizePath = (path = '') => {
  if (!path || path === '/') return '/';
  const clean = path.split('?')[0].split('#')[0];
  return clean.replace(/\/+$/, '') || '/';
};

/**
 * Mendapatkan ID tab aktif berdasarkan path URL browser
 */
export const getTabFromPathname = (pathname = '') => {
  const cleanPath = normalizePath(pathname);
  if (cleanPath === '/' || cleanPath === '/dashboard') {
    return 'dashboard';
  }
  return PATH_TAB_MAP[cleanPath] || null;
};

/**
 * Mendapatkan URL path canonical berdasarkan ID tab
 */
export const getPathFromTab = (tab = '') => {
  if (!tab || tab === 'dashboard') return '/dashboard';
  return TAB_PATH_MAP[tab] || `/${tab}`;
};

/**
 * Sinkronisasi URL di address bar peramban (browser) dengan tab aktif
 * @param {string} tab - ID tab aktif (contoh: 'surat-masuk')
 * @param {boolean} replace - Gunakan replaceState jika true, pushState jika false
 */
export const syncUrlWithTab = (tab, replace = false) => {
  if (typeof window === 'undefined' || !window.history) return;

  const targetPath = getPathFromTab(tab);
  const currentPath = normalizePath(window.location.pathname);

  if (currentPath !== targetPath) {
    try {
      if (replace) {
        window.history.replaceState({ tab }, '', targetPath);
      } else {
        window.history.pushState({ tab }, '', targetPath);
      }
    } catch (e) {
      console.warn('[ROUTING] Gagal memperbarui URL browser:', e);
    }
  }
};
