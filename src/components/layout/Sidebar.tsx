import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  Tag, 
  Truck, 
  ShoppingCart, 
  BarChart3, 
  BrainCircuit, 
  Users, 
  Sparkles,
  ClipboardList,
  AlertCircle
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, inventorySummary, insights, purchaseOrders } = useApp();

  const criticalIssuesCount = inventorySummary.criticalCount;
  const draftPOCount = purchaseOrders.filter(p => p.status === 'Draft' || p.status === 'Approved').length;
  const pendingInsightsCount = insights.filter(i => i.status === 'Pending').length;

  const navItems = [
    {
      id: 'dashboard',
      label: '總覽儀表板',
      icon: LayoutDashboard,
      badge: criticalIssuesCount > 0 ? `${criticalIssuesCount} 危急` : undefined,
      badgeColor: 'text-rose-600 bg-rose-50'
    },
    {
      id: 'inventory',
      label: '庫存管理動態',
      icon: Package,
      badge: `${inventorySummary.totalSkus} SKU`,
      badgeColor: 'text-slate-600'
    },
    {
      id: 'products',
      label: '商品品項清單',
      icon: Boxes
    },
    {
      id: 'purchase',
      label: '採購訂單與入庫',
      icon: ShoppingCart,
      badge: draftPOCount > 0 ? `${draftPOCount} 處理中` : undefined,
      badgeColor: 'text-emerald-700 bg-emerald-50'
    },
    {
      id: 'insights',
      label: 'AI 建議示範',
      icon: BrainCircuit,
      badge: pendingInsightsCount > 0 ? `${pendingInsightsCount} 待處理` : undefined,
      badgeColor: 'text-emerald-800 bg-emerald-100 font-semibold'
    },
    {
      id: 'analytics',
      label: '商業決策分析',
      icon: BarChart3
    },
    {
      type: 'divider'
    },
    {
      id: 'brands',
      label: '品牌績效評估',
      icon: Tag
    },
    {
      id: 'suppliers',
      label: '供應商與促銷',
      icon: Truck
    },
    {
      id: 'users',
      label: '人員與角色示範',
      icon: Users
    }
  ];

  return (
    <aside
      id="system-navigation"
      aria-label="庫存系統導覽"
      onKeyDown={event => {
        if (event.key === 'Escape' && isOpen) {
          event.preventDefault();
          onClose();
        }
      }}
      className={`${isOpen ? 'flex' : 'hidden'} w-full max-h-[65dvh] overflow-y-auto bg-slate-50/80 border-b border-emerald-950/10 flex-col justify-between shrink-0 lg:flex lg:w-64 lg:max-h-none lg:border-b-0 lg:border-r lg:min-h-[calc(100vh-4rem)]`}
    >
      <div className="flex justify-end px-4 pt-3 lg:hidden">
        <button type="button" onClick={onClose} className="type-label px-3 rounded-lg border border-slate-200">
          關閉導覽
        </button>
      </div>
      <div className="p-4 space-y-6">
        {/* Core Decision Framework Banner */}
        <div className="p-3 bg-white rounded-xl border border-emerald-900/10 shadow-xs">
          <div className="type-detail font-bold text-emerald-900 tracking-wider mb-1">
            決策導引工作流
          </div>
          <div className="flex items-center type-detail text-slate-500 font-medium">
            <span>數據</span>
            <span className="mx-1 text-emerald-600">→</span>
            <span>洞察</span>
            <span className="mx-1 text-emerald-600">→</span>
            <span>決策</span>
            <span className="mx-1 text-emerald-600">→</span>
            <span className="text-emerald-800 font-semibold">行動</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav aria-label="系統分頁" className="type-detail space-y-1">
          {navItems.map((item, idx) => {
            if (item.type === 'divider') {
              return (
                <div key={`div-${idx}`} className="pt-3 pb-2 px-3">
                  <div className="h-px bg-slate-200" />
                  <span className="type-detail font-bold text-slate-400 uppercase tracking-widest pt-2 block">
                    營運基礎管理
                  </span>
                </div>
              );
            }

            const Icon = item.icon!;
            const isActive = activeTab === item.id;

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => { setActiveTab(item.id!); onClose(); }}
                aria-current={isActive ? 'page' : undefined}
                className={`type-label w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer ${
 isActive
 ? 'bg-emerald-800 text-white shadow-xs'
 : 'text-slate-600 hover:text-slate-900 hover:bg-emerald-950/5'
 }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={17} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`type-detail px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-emerald-950/40 text-emerald-100' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-emerald-950/10 type-detail text-slate-500 space-y-1.5 bg-white/40">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">目前庫存健康率</span>
          <span className="font-semibold text-emerald-700 tabular-nums">
            {Math.round((inventorySummary.healthyCount / inventorySummary.totalSkus) * 100)}%
          </span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
            style={{
              width: `${(inventorySummary.healthyCount / inventorySummary.totalSkus) * 100}%`
            }}
          />
        </div>
        <div className="type-detail text-slate-400 pt-1">
          <span>沙龍庫存小幫手</span>
          <span className="mx-1">·</span>
          <span>v2.4 沙龍決策版</span>
        </div>
      </div>
    </aside>
  );
};
