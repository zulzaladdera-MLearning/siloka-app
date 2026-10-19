import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ParafTteView } from '../ModuleViews';

describe('Verifikasi Render Antarmuka E-Paraf & TTE (ParafTteView)', () => {
  const sampleLetters = [
    {
      id: 'SRT-001',
      nomorSurat: 'UN58/TU/2026/012',
      perihal: 'Pengesahan Laporan Kinerja Akademik',
      status: 'Diparaf',
      kategori: 'Surat Keluar',
      creator_id: 'usr-dosen-01',
      unit_pembuat: 'Fakultas Teknik'
    },
    {
      id: 'SRT-002',
      nomorSurat: 'UN58/TU/2026/015',
      perihal: 'Surat Keputusan Rektor Tentang Beasiswa',
      status: 'SIAP_TTE',
      kategori: 'Surat Keputusan',
      creator_id: 'usr-admin-01',
      unit_pembuat: 'Rektorat'
    }
  ];

  it('1. Render sukses untuk Super Admin (Tanpa ReferenceError)', () => {
    const superAdminUser = {
      id: 'usr-sa-01',
      nama_lengkap: 'Dede Gunawan, S.Kom., M.Kom.',
      role: 'SUPER_ADMIN',
      is_super_admin: true
    };

    const html = renderToString(
      <ParafTteView
        letters={sampleLetters}
        currentUser={superAdminUser}
        onSelectLetter={() => {}}
        onSignSuccess={() => {}}
      />
    );

    expect(html).toContain('Antrean E-Paraf &amp; Tanda Tangan Elektronik (TTE)');
    expect(html).toContain('Passphrase TTE Aktif');
  });

  it('2. Render sukses untuk Pejabat Struktural (Rektor)', () => {
    const rektorUser = {
      id: 'usr-rektor-01',
      nama_lengkap: 'Prof. Dr. Eng. Ir. Aripin, IPU., ASEAN Eng.',
      role: 'PEJABAT',
      jabatan: 'Rektor Universitas Siliwangi',
      is_pejabat: true
    };

    const html = renderToString(
      <ParafTteView
        letters={sampleLetters}
        currentUser={rektorUser}
        onSelectLetter={() => {}}
        onSignSuccess={() => {}}
      />
    );

    expect(html).toContain('Antrean E-Paraf &amp; Tanda Tangan Elektronik (TTE)');
    expect(html).toContain('Passphrase TTE Aktif');
  });

  it('3. Render sukses untuk Dosen Biasa (Mode Strict Personal Isolation)', () => {
    const dosenUser = {
      id: 'usr-dosen-01',
      nama_lengkap: 'Dr. Ir. Ahmad Fauzi, M.T.',
      role: 'DOSEN',
      is_pejabat: false
    };

    const html = renderToString(
      <ParafTteView
        letters={sampleLetters}
        currentUser={dosenUser}
        onSelectLetter={() => {}}
        onSignSuccess={() => {}}
      />
    );

    expect(html).toContain('Antrean E-Paraf &amp; Tanda Tangan Elektronik (TTE)');
    expect(html).toContain('Strict Personal Isolation');
  });

  it('4. Render sukses untuk Staf Tata Usaha / Operator Unit', () => {
    const staffUser = {
      id: 'usr-staff-01',
      nama_lengkap: 'Rina Rahmawati, S.AP.',
      role: 'STAF',
      role_slug: 'admin_tu'
    };

    const html = renderToString(
      <ParafTteView
        letters={sampleLetters}
        currentUser={staffUser}
        onSelectLetter={() => {}}
        onSignSuccess={() => {}}
      />
    );

    expect(html).toContain('Antrean E-Paraf &amp; Tanda Tangan Elektronik (TTE)');
    expect(html).toContain('Passphrase TTE Aktif');
  });
});
