/**
 * Domain Entity: Pejabat (Inherit dari User)
 * Merepresentasikan pejabat struktural yang memegang otoritas penandatanganan elektronik (TTE).
 */

import { User } from './User';
import { UnitKerja } from './UnitKerja';

export interface ITTEResult {
  isValid: boolean;
  signatureHash?: string;
  signedAt?: string;
  signerName?: string;
  signerNip?: string;
  signerJabatan?: string;
  error?: string;
}

export class Pejabat extends User {
  #jabatanStruktural: string;
  #sertifikatTTEId: string;
  #passphraseHash: string; // Hash simulasi sertifikat elektronik BSrE BSSN

  constructor(
    id: string,
    nip: string,
    namaLengkap: string,
    unitKerja: UnitKerja,
    jabatanStruktural: string,
    passphraseDummy: string = 'UNSIL-TTE-2026'
  ) {
    super(id, nip, namaLengkap, 'PEJABAT', unitKerja);

    if (!jabatanStruktural.trim()) {
      throw new Error('[Pejabat] Jabatan struktural wajib diisi.');
    }

    this.#jabatanStruktural = jabatanStruktural.trim();
    this.#sertifikatTTEId = `BSrE-UNSIL-${id}-${new Date().getFullYear()}`;
    this.#passphraseHash = passphraseDummy;
  }

  // --- Getters & Setters ---

  public get jabatanStruktural(): string {
    return this.#jabatanStruktural;
  }

  public set jabatanStruktural(value: string) {
    if (!value.trim()) throw new Error('[Pejabat] Jabatan struktural tidak boleh kosong.');
    this.#jabatanStruktural = value.trim();
  }

  public get sertifikatTTEId(): string {
    return this.#sertifikatTTEId;
  }

  /**
   * Override: Pejabat selalu memiliki kewenangan menandatangani naskah dinas
   */
  public override canSignDocument(): boolean {
    return true;
  }

  /**
   * Metode eksekusi Tanda Tangan Elektronik (TTE) Tersertifikasi BSrE
   * Memvalidasi passphrase keamanan pejabat untuk menerbitkan segel digital.
   */
  public signWithTTE(passphrase: string): ITTEResult {
    if (!passphrase || passphrase !== this.#passphraseHash) {
      return {
        isValid: false,
        error: 'Passphrase TTE salah atau tidak terdaftar pada otoritas sertifikat BSrE.'
      };
    }

    const timestamp = new Date().toISOString();
    // Simulasi hash tanda tangan kriptografis SHA-256
    const signatureHash = `TTE-${this.id}-${Date.now().toString(16).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    return {
      isValid: true,
      signatureHash,
      signedAt: timestamp,
      signerName: this.namaLengkap,
      signerNip: this.nip,
      signerJabatan: this.#jabatanStruktural
    };
  }

  public override toJSON() {
    return {
      ...super.toJSON(),
      jabatan_struktural: this.#jabatanStruktural,
      sertifikat_tte_id: this.#sertifikatTTEId
    };
  }
}

