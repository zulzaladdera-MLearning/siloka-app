import React from 'react';

/**
 * Component: ProtectedRoute
 * Menjaga rute aplikasi agar hanya dapat diakses oleh pengguna yang telah terotentikasi.
 * Jika pengguna unauthenticated, otomatis mengarahkan ke fallback (LoginPage).
 */
export const ProtectedRoute = ({ isAuthenticated, children, fallback = null }) => {
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

