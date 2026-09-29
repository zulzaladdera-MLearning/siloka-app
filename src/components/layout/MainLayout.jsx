import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileBottomNav } from './MobileBottomNav';

export const MainLayout = ({
  user,
  onLogout,
  onSwitchUser,
  allUsers,
  activeTab,
  setActiveTab,
  onOpenCreateLetter,
  onOpenQuickDisposisi,
  searchQuery,
  setSearchQuery,
  letters = [],
  onSelectLetter,
  children
}) => {
  // State collapse di desktop
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // State toggle mobile drawer
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-800 antialiased selection:bg-unsil-green-900 selection:text-unsil-gold-400">
      {/* 4. Backdrop / Overlay Gelap (Hanya muncul saat sidebar terbuka di mode mobile) */}
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs block md:hidden animate-in fade-in duration-200"
          aria-label="Tutup Menu Sidebar"
        />
      )}

      {/* 1 & 2. Sidebar Mobile Drawer & Desktop Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onLogout={onLogout}
        user={user}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Navbar
          user={user}
          onLogout={onLogout}
          onSwitchUser={onSwitchUser}
          allUsers={allUsers}
          onOpenCreateLetter={onOpenCreateLetter}
          onOpenQuickDisposisi={onOpenQuickDisposisi}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          letters={letters}
          onSelectLetter={onSelectLetter}
        />

        {/* Responsive Content Container: extra bottom padding on mobile for MobileBottomNav */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="py-4 px-4 sm:px-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white mb-14 md:mb-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>
              &copy; 2026 <strong>SILOKA UNSIL</strong> • Biro Keuangan dan Umum (BKU)
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>Universitas Siliwangi</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">BSSN Certified</span>
            </div>
          </div>
        </footer>

        {/* Bottom Navigation Bar Khusus Mobile */}
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenMobileMenu={toggleSidebar}
        />
      </div>
    </div>
  );
};

