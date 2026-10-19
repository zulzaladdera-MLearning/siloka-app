import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DeleteLetterModal } from '../DeleteLetterModal';

describe('Fitur Hapus Naskah Dinas (DeleteLetterModal & ActivityTable)', () => {
  const sampleLetter = {
    id: 'ND-PERSONAL-usr-dosen-01-01',
    nomorSurat: 'DRAFT/ND/FT/2026/001',
    perihal: 'Nota Dinas Permohonan Sarana Prasarana Laboratorium Komputer',
    kategori: 'Nota Dinas',
    pengirim: 'Dosen Teknik Informatika',
    tujuan: 'Dekan Fakultas Teknik'
  };

  it('tidak merender apapun saat isOpen bernilai false', () => {
    const html = renderToString(
      <DeleteLetterModal
        letter={sampleLetter}
        isOpen={false}
        onClose={vi.fn()}
        onConfirmDelete={vi.fn()}
      />
    );
    expect(html).toBe('');
  });

  it('merender dialog konfirmasi hapus dan detail naskah saat isOpen bernilai true', () => {
    const html = renderToString(
      <DeleteLetterModal
        letter={sampleLetter}
        isOpen={true}
        onClose={vi.fn()}
        onConfirmDelete={vi.fn()}
      />
    );

    expect(html).toContain('Hapus Naskah Dinas');
    expect(html).toContain('Konfirmasi Tindakan');
    expect(html).toContain('DRAFT/ND/FT/2026/001');
    expect(html).toContain('Nota Dinas Permohonan Sarana Prasarana Laboratorium Komputer');
    expect(html).toContain('Ya, Hapus Naskah');
  });

  it('simulasi flow penghapusan dari state dan persistensi deletedLetterIds', () => {
    const initialLetters = [
      sampleLetter,
      {
        id: 'SRT-002',
        nomorSurat: '002/UN58/TU/2026',
        perihal: 'Surat Undangan Rapat Koordinasi'
      }
    ];

    let letters = [...initialLetters];
    let deletedLetterIds = [];

    const handleDeleteLetter = (letterToDelete) => {
      letters = letters.filter((l) => l.id !== letterToDelete.id);
      deletedLetterIds = Array.from(new Set([...deletedLetterIds, String(letterToDelete.id)]));
    };

    handleDeleteLetter(sampleLetter);

    expect(letters.length).toBe(1);
    expect(letters[0].id).toBe('SRT-002');
    expect(deletedLetterIds).toContain(sampleLetter.id);
  });
});
