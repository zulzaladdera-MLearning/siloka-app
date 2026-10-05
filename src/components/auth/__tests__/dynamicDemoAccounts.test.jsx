import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { LoginPage } from '../LoginPage';

describe('Dynamic Demo Accounts in LoginPage', () => {
  it('harus merender panel pilihan akun masuk uji coba dengan tombol sinkron data', () => {
    const html = renderToString(<LoginPage onLoginSuccess={() => {}} />);
    expect(html).toContain('Pilihan Akun Masuk (Uji Coba):');
    expect(html).toContain('Sinkron Data');
    expect(html).toContain('Super Admin:');
    expect(html).toContain('Dede Gunawan');
    expect(html).toContain('Kepala BKU:');
    expect(html).toContain('Staf BKU:');
    expect(html).toContain('Dekan FKIP:');
    expect(html).toContain('Rektorat:');
  });

  it('harus menyertakan opsi pencarian dan pemilihan akun seluruh pegawai', () => {
    const html = renderToString(<LoginPage onLoginSuccess={() => {}} />);
    expect(html).toContain('Cari &amp; Pilih Akun Demo Lainnya');
  });
});
