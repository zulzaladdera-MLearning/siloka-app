/**
 * Domain Entity: User
 * Mengenkapsulasi identitas pengguna, hak akses, dan keterkaitan dengan UnitKerja.
 */

import { UnitKerja } from './UnitKerja';

export type UserRole = 'REKTOR' | 'PEJABAT' | 'OPERATOR_UNIT' | 'STAF_PERSURATAN' | 'PENGAWAS';

export class User {
  #id: string;
  #nip: string;
  #namaLengkap: string;
  #role: UserRole;
  #unitKerja: UnitKerja;

  constructor(
    id: string,
    nip: string,
    namaLengkap: string,
    role: UserRole,
    unitKerja: UnitKerja
  ) {
    if (!id) throw new Error('[User] ID pengguna wajib diisi.');
    if (!namaLengkap.trim()) throw new Error('[User] Nama lengkap pengguna tidak boleh kosong.');
    if (!unitKerja) throw new Error('[User] Objek UnitKerja harus disertakan.');

    this.#id = id;
    this.#nip = nip.trim();
    this.#namaLengkap = namaLengkap.trim();
    this.#role = role;
    this.#unitKerja = unitKerja;
  }

  // --- Getters & Setters ---

  public get id(): string {
    return this.#id;
  }

  public get nip(): string {
    return this.#nip;
  }

  public set nip(value: string) {
    this.#nip = value.trim();
  }

  public get namaLengkap(): string {
    return this.#namaLengkap;
  }

  public set namaLengkap(value: string) {
    if (!value.trim()) throw new Error('[User] Nama lengkap tidak boleh kosong.');
    this.#namaLengkap = value.trim();
  }

  public get role(): UserRole {
    return this.#role;
  }

  public set role(value: UserRole) {
    this.#role = value;
  }

  public get unitKerja(): UnitKerja {
    return this.#unitKerja;
  }

  public set unitKerja(value: UnitKerja) {
    if (!value) throw new Error('[User] UnitKerja tidak boleh kosong.');
    this.#unitKerja = value;
  }

  /**
   * Cek apakah pengguna berwenang menandatangani surat dinas secara sah (TTE)
   * Base implementation: staf dan operator tidak berwenang langsung (kecuali Pejabat).
   */
  public canSignDocument(): boolean {
    return this.#role === 'REKTOR' || this.#role === 'PEJABAT';
  }

  /**
   * Otorisasi Scoping Dokumen (Multi-Tenancy & Confidentiality)
   * Mengatur apakah pengguna dapat membaca surat tertentu.
   */
  public canViewDocument(documentUnitKode: string, isConfidential: boolean = false): boolean {
    // 1. Pimpinan Universitas (Rektorat) dan BKU memiliki akses pengawasan multi-unit
    if (this.#unitKerja.kodeUnit === 'UN58' || this.#unitKerja.kodeUnit === 'UN58.6') {
      return true;
    }

    // 2. SPI (Satuan Pengawas Internal) dapat melihat dokumen non-rahasia atau dokumen audit
    if (this.#role === 'PENGAWAS') {
      return true;
    }

    // 3. Jika dokumen sangat rahasia, operator biasa tidak boleh membaca
    if (isConfidential && (this.#role === 'OPERATOR_UNIT' || this.#role === 'STAF_PERSURATAN')) {
      return false;
    }

    // 4. Default: User hanya dapat melihat dokumen milik unit kerjanya sendiri
    return this.#unitKerja.kodeUnit === documentUnitKode;
  }

  public toJSON() {
    return {
      id: this.#id,
      nip: this.#nip,
      nama_lengkap: this.#namaLengkap,
      role: this.#role,
      unit_kerja: this.#unitKerja.toJSON()
    };
  }
}

