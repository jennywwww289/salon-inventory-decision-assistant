import React, { useRef, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { PersonalHome } from './components/home/PersonalHome';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { InventoryView } from './components/inventory/InventoryView';
import { ProductsView } from './components/products/ProductsView';
import { BrandsView } from './components/brands/BrandsView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { PurchaseOrdersView } from './components/purchase/PurchaseOrdersView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { AIInsightsView } from './components/insights/AIInsightsView';
import { UsersView } from './components/users/UsersView';
import { ServiceUsageModal } from './components/modals/ServiceUsageModal';
import { NotificationModal } from './components/modals/NotificationModal';
import { DataStorageStatus } from './components/layout/DataStorageStatus';

const AppContent: React.FC = () => {
  const { activeTab, dataRevision } = useApp();
  const [area, setArea] = useState<'home' | 'system'>('home');
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const navigationButtonRef = useRef<HTMLButtonElement>(null);

  const closeNavigation = () => {
    setIsNavigationOpen(false);
    if (isNavigationOpen) navigationButtonRef.current?.focus();
  };

  if (area === 'home') {
    return <><DataStorageStatus /><PersonalHome onEnterSystem={() => setArea('system')} /></>;
  }

  return (
    <div key={dataRevision} className="feedback-scope system-shell min-h-screen min-w-0 bg-slate-50/60 text-slate-800 flex flex-col font-sans">
      <nav aria-label="首頁與系統切換" className="type-detail border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => { setIsNavigationOpen(false); setArea('home'); }}
          className="type-label min-h-11 rounded-lg border border-emerald-800 px-4 py-2 text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 cursor-pointer"
        >
          返回個人首頁
        </button>
      </nav>
      <DataStorageStatus showReset />
      <Header
        isNavigationOpen={isNavigationOpen}
        onToggleNavigation={() => setIsNavigationOpen(open => !open)}
        onCloseNavigation={closeNavigation}
        navigationButtonRef={navigationButtonRef}
      />
      <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
        <Sidebar isOpen={isNavigationOpen} onClose={closeNavigation} />
        <main className="system-content min-w-0 w-full flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'products' && <ProductsView />}
          {activeTab === 'brands' && <BrandsView />}
          {activeTab === 'suppliers' && <SuppliersView />}
          {activeTab === 'purchase' && <PurchaseOrdersView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'insights' && <AIInsightsView />}
          {activeTab === 'users' && <UsersView />}
        </main>
      </div>

      {/* Global Modals */}
      <ServiceUsageModal />
      <NotificationModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
