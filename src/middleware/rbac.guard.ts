/**
 * RBAC Guard Middleware (Express / Node.js)
 * Protects administrative resources (/api/admin/*) ensuring strict access control
 * Strictly adheres to Peraturan Rektor UNSIL No. 3/2023
 */

import { Request, Response, NextFunction } from 'express';
import { isSuperAdminUser } from '../utils/authGuards';

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const operator = (req as any).user;
  
  if (!operator || !isSuperAdminUser(operator)) {
    return res.status(403).json({
      success: false,
      error: 'ERR_FORBIDDEN_RESOURCE',
      message: 'Akses terlarang. Modul Pengaturan Sistem hanya boleh diakses oleh role Super Admin.'
    });
  }
  return next();
};

