import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('siloka_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('siloka_auth_token') || null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Simpan perubahan user ke localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('siloka_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('siloka_auth_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('siloka_auth_token', token);
    } else {
      localStorage.removeItem('siloka_auth_token');
    }
  }, [token]);

  /**
   * Login Handler: Memanggil API /api/auth/login dan menghidrasi sesi
   */
  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal melakukan otentikasi.');
      }

      const hydratedUser = result.user || result.data;
      const userToken = result.token;

      setUser(hydratedUser);
      setToken(userToken);
      return { success: true, user: hydratedUser };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout Handler
   */
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('siloka_auth_user');
    localStorage.removeItem('siloka_auth_token');
  }, []);

  /**
   * Helper: Memeriksa apakah user memiliki permission tertentu
   */
  const hasPermission = useCallback(
    (permissionKey) => {
      if (!user) return false;
      // Super Admin memiliki hak akses penuh
      if (user.role === 'Super Admin' || user.role === 'SUPER_ADMIN') return true;
      const permissions = Array.isArray(user.permissions) ? user.permissions : [];
      return permissions.includes(permissionKey);
    },
    [user]
  );

  /**
   * Helper: Memeriksa apakah user boleh mengakses naskah dengan prefix JRA tertentu
   */
  const canAccessPrefix = useCallback(
    (jraCode = '') => {
      if (!user) return false;
      if (user.role === 'Super Admin' || user.role === 'SUPER_ADMIN') return true;
      const allowed = Array.isArray(user.allowed_prefixes) ? user.allowed_prefixes : [];
      if (allowed.includes('*')) return true;
      return allowed.some((prefix) => String(jraCode).startsWith(prefix));
    },
    [user]
  );

  /**
   * Helper: Memeriksa apakah tingkat keamanan dokumen berada dalam batas clearance user
   */
  const canAccessSecurity = useCallback(
    (securityLevel = 'Biasa/Terbuka') => {
      if (!user) return false;
      if (user.role === 'Super Admin' || user.role === 'SUPER_ADMIN') return true;
      const ranking = {
        'Biasa/Terbuka': 1,
        'Terbatas': 2,
        'Rahasia': 3,
        'Sangat Rahasia': 4
      };
      const userMax = ranking[user.max_keamanan || 'Biasa/Terbuka'] || 1;
      const docLevel = ranking[securityLevel] || 1;
      return docLevel <= userMax;
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      hasPermission,
      canAccessPrefix,
      canAccessSecurity
    }),
    [user, token, isLoading, login, logout, hasPermission, canAccessPrefix, canAccessSecurity]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom Hook: useAuth
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Return safe fallback jika provider belum membungkus
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      hasPermission: () => false,
      canAccessPrefix: () => false,
      canAccessSecurity: () => false,
      login: async () => {},
      logout: () => {}
    };
  }
  return context;
};

/**
 * Reusable Guard Component: <Can />
 * Contoh penggunaan:
 * <Can permission="keuangan:view">
 *   <BrankasKeuanganMenu />
 * </Can>
 */
export const Can = ({ permission, permissions = [], any = false, fallback = null, children }) => {
  const { hasPermission } = useAuth();

  if (permission) {
    return hasPermission(permission) ? <>{children}</> : fallback;
  }

  if (permissions.length > 0) {
    const check = any
      ? permissions.some((p) => hasPermission(p))
      : permissions.every((p) => hasPermission(p));
    return check ? <>{children}</> : fallback;
  }

  return <>{children}</>;
};

export default AuthContext;

