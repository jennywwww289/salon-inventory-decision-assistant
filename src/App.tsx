import React, { useState } from 'react';
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

  if (area === 'home') {
    return <><DataStorageStatus /><PersonalHome onEnterSystem={() => setArea('system')} /></>;
  }

  return (
    <div key={dataRevision} className="min-h-screen bg-slate-50/60 text-slate-800 flex flex-col font-sans">
      <nav aria-label="首頁與系統切換" className="border-b border-slate-200 bg-white px-6 py-3">
        <button
          type="button"
          onClick={() => setArea('home')}
          className="min-h-11 rounded-lg border border-emerald-800 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 cursor-pointer"
        >
          返回個人首頁
        </button>
      </nav>
      <DataStorageStatus showReset />
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
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
