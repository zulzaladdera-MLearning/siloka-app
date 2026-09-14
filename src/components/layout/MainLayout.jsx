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
  children
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-800 antialiased selection:bg-unsil-green-900 selection:text-unsil-gold-400">
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          aria-label="Tutup Menu"
        />
      )}

      {/* Sidebar Desktop */}
      <div className={`hidden md:block ${isSidebarCollapsed ? 'w-20' : 'w-64'} shrink-0 transition-all duration-300`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          onLogout={onLogout}
          user={user}
        />
      </div>

      {/* Mobile Drawer (Accessible from Top Burger & Bottom Nav 'Menu') */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:hidden shadow-2xl ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileSidebarOpen(false);
          }}
          isCollapsed={false}
          setIsCollapsed={() => setIsMobileSidebarOpen(false)}
          onLogout={onLogout}
          user={user}
        />
      </div>

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
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
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
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        />
      </div>
    </div>
  );
};

