import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Sparkles, Plus, Store, Check, UserCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    currentUser, 
    users, 
    setCurrentUser, 
    notifications,
    inventorySummary,
    setIsServiceUsageModalOpen,
    setIsNotificationSettingsOpen,
    activeTab
  } = useApp();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const tabLabels: Record<string, string> = {
    dashboard: '總覽儀表板',
    inventory: '庫存管理與動態',
    products: '商品品項清單',
    brands: '品牌表現與比較',
    suppliers: '供應商管理與促銷',
    purchase: '採購訂單與入庫',
    analytics: '商業決策分析',
    insights: 'AI 建議示範',
    users: '人員與角色情境示範'
  };

  return (
    <header className="h-16 border-b border-emerald-950/10 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Zone 1: Brand title & Context */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold shadow-sm">
          <Store size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 tracking-tight text-base">綠境草本頭皮護理沙龍</span>
            <span className="text-slate-300 font-light">/</span>
            <span className="text-sm font-medium text-emerald-800">{tabLabels[activeTab] || '決策支援中心'}</span>
          </div>
          <div className="text-xs text-slate-600 hidden sm:block">
            <span>台北概念旗艦館</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="tabular-nums">{inventorySummary.totalSkus} SKUs 常備</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span>資料變動時計算庫存</span>
          </div>
        </div>
      </div>

      {/* Zone 2: Navigation Links (Secondary / Quick Filters if needed or Breadcrumbs) */}
      <div className="hidden lg:flex items-center gap-5 text-sm text-slate-600">
        <span className="text-xs text-emerald-800/80 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          課程原型：目前示範資料，未連接門市或 AI 服務
        </span>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Service Usage Entry Button */}
        <button
          onClick={() => setIsServiceUsageModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          title="沙龍做客人快速登記洗髮精/精華液耗用，即刻扣庫存"
        >
          <Plus size={15} />
          <span>現場領料 / 服務耗用</span>
        </button>

        {/* Notifications & Auto Alert Settings */}
        <button
          onClick={() => setIsNotificationSettingsOpen(true)}
          className="relative p-2 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50/50 rounded-lg transition-colors cursor-pointer"
          title={`未讀站內紀錄 ${unreadCount} 則；LINE／Email 示範，未實際發送`}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Switcher Dropdown for Testing Role Perspectives */}
        <div className="relative group" title="角色切換供操作情境展示，目前未提供登入驗證與權限隔離。">
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center border border-emerald-200 shadow-inner">
              {currentUser.avatar}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-slate-600">角色示範 · {currentUser.title.split(' ')[0]}</p>
            </div>
          </div>

          {/* Quick User Role Switcher Menu */}
          <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-1 hidden group-hover:block hover:block z-30 animate-in fade-in">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-600 border-b border-slate-100 uppercase tracking-wider">
              切換示範角色（{users.length} 位）
            </div>
            <p className="px-3 py-2 text-[11px] text-slate-500">角色切換供操作情境展示，目前未提供登入驗證與權限隔離。</p>
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => setCurrentUser(u)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                  currentUser.id === u.id ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-slate-800">{u.name}</div>
                  <div className="text-[10px] text-slate-600">{u.title}</div>
                </div>
                {currentUser.id === u.id && <Check size={14} className="text-emerald-700" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
