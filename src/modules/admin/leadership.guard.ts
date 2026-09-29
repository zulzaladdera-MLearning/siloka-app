/**
 * SuperAdminGuard Middleware
 * Mengamankan mutasi struktural & formasi kepemimpinan eksklusif untuk SUPER_ADMIN
 */

import type { Request, Response, NextFunction } from 'express';

export const SuperAdminGuard = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user || (req as any).session?.user;

    if (!user) {
      return res.status(401).json({
        status: 401,
        success: false,
        error: 'Unauthorized',
        message: 'Sesi login tidak ditemukan. Silakan masuk terlebih dahulu sebagai Super Admin.'
      });
    }

    const rawRole = (user.role || '').toUpperCase().replace(/\s+/g, '_');
    const isSuperAdmin = rawRole === 'SUPER_ADMIN' || user.id_role === 1 || rawRole === 'SUPERADMIN';

    if (!isSuperAdmin) {
      return res.status(403).json({
        status: 403,
        success: false,
        error: 'Forbidden',
        message: 'Akses ditolak. Operasi mutasi kepemimpinan dan manajemen formasi SOTK bersifat eksklusif untuk SUPER_ADMIN.',
        requiredRole: 'SUPER_ADMIN',
        currentUserRole: user.role
      });
    }

    next();
  } catch (err: any) {
    return res.status(500).json({
      status: 500,
      success: false,
      error: 'InternalServerError',
      message: 'Gagal memvalidasi otorisasi Super Admin.',
      details: err?.message
    });
  }
};

export default SuperAdminGuard;
