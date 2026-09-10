import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

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
    <div className="min-h-screen bg-slate-100 flex text-slate-800">
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Desktop & Mobile */}
      <div className={`hidden md:block ${isSidebarCollapsed ? 'w-20' : 'w-64'} shrink-0 transition-all duration-300`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:hidden ${
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="py-4 px-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>
              &copy; 2026 <strong>SILOKA UNSIL</strong> • Biro Perencanaan, Keuangan, dan Umum
            </span>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>Universitas Siliwangi</span>
              <span>•</span>
              <span>Kampus 1 Tasikmalaya</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">BSSN Certified</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

