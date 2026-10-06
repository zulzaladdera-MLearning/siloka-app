/**
 * Router: Layanan Persuratan & Nomor Surat Otomatis (SILOKA UNSIL)
 * Rute endpoint publik & operasional persuratan.
 */

import { Router } from 'express';
import {
  getKlasifikasiList,
  createOutgoing,
  getOutgoingList
} from '../controllers/outgoingLetterController.js';
import {
  createInbound,
  getInboundList,
  clearInboundLetters
} from '../controllers/inboundLetterController.js';
import {
  getPejabatList,
  getPejabatByUnitCode
} from '../controllers/pejabatController.js';
import {
  getScopedLetters,
  getScopedLetterById,
  getEParafQueue,
  getDraftByIdIsolated
} from '../controllers/scopedLetterController.js';
import {
  getAvailableLetterTypes,
  createDraftLetter
} from '../controllers/signatoryScopingController.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';

const router = Router();

// 0. Signatory Authority Scoping Engine (Tabel 1 Peraturan Rektor No. 3 Tahun 2023)
router.get('/naskah/available-types', getAvailableLetterTypes);
router.get('/letters/available-types', getAvailableLetterTypes);
router.post('/surat/draft', createDraftLetter);
router.post('/surat/create', createDraftLetter);

// 0.b. Antrean E-Paraf & TTE dengan Strict Personal Isolation (SKKAAD SK Rektor No. 2803/2023)
router.get('/e-paraf/queue', getEParafQueue);
router.get('/drafts/queue', getEParafQueue);
router.get('/drafts/:id', getDraftByIdIsolated);

// 1. Endpoint Master Klasifikasi Arsip
router.get('/klasifikasi-arsip', getKlasifikasiList);

// 2. Endpoint Master Pejabat Penandatangan (Auto-fill & Unit-Scoped)
router.get('/pejabat', getPejabatList);
router.get('/pejabat/unit/:kode_unit', getPejabatByUnitCode);

// 3. Endpoint Transaksi Surat Keluar & Nomor Otomatis
router.post('/surat-keluar', createOutgoing);
router.get('/surat-keluar', getOutgoingList);

// 3.b. Endpoint Registrasi Surat Masuk & Buku Agenda Ekspedisi
router.post('/surat-masuk', createInbound);
router.get('/surat-masuk', getInboundList);
router.delete('/surat-masuk', clearInboundLetters);
router.post('/letters/inbound', createInbound);
router.get('/letters/inbound', getInboundList);
router.delete('/letters/inbound', clearInboundLetters);

// 4. Endpoint Pengendalian Surat Terkunci RBAC (Tupoksi Prefix & Max Keamanan)
router.get('/surat', checkPermission('surat:read'), getScopedLetters);
router.get('/surat/:id', checkPermission('surat:read'), getScopedLetterById);

// Alias rute tambahan untuk fleksibilitas integrasi
router.get('/letters/classification', getKlasifikasiList);
router.post('/letters/outgoing', createOutgoing);
router.get('/letters/outgoing', getOutgoingList);
router.get('/letters/signatories', getPejabatList);

export default router;

