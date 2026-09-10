/**
 * SILOKA Domain Model & Service Layer
 * Export barrel untuk arsitektur OOP Domain-Driven Design
 */

// Entitas
export * from './entities/UnitKerja';
export * from './entities/User';
export * from './entities/Pejabat';

// Naskah Dinas (Hierarki & Polimorfisme)
export * from './documents/NaskahDinas';
export * from './documents/SuratDinas';
export * from './documents/SuratTugas';
export * from './documents/NotaDinas';

// Services (Singleton Pattern & Business Flow)
export * from './services/DispositionService';
export * from './services/ArchiveManager';
export * from './services/AuditLogger';

