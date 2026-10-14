import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
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

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 flex flex-col font-sans">
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
