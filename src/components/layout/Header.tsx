import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Sparkles, Plus, Store, Check, UserCheck, Menu, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  onBackToHome: () => void;
  isNavigationOpen: boolean;
  onToggleNavigation: () => void;
  onCloseNavigation: () => void;
  navigationButtonRef: React.RefObject<HTMLButtonElement | null>;
}

export const Header: React.FC<HeaderProps> = ({ onBackToHome, isNavigationOpen, onToggleNavigation, onCloseNavigation, navigationButtonRef }) => {
  const [isRoleSelectorOpen, setIsRoleSelectorOpen] = useState(false);
  const roleButtonRef = useRef<HTMLButtonElement>(null);
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
    <header className="min-w-0 border-b border-emerald-950/10 bg-white/95 backdrop-blur-md pl-4 pr-16 py-1.5 sm:pl-6 sm:pr-[4.5rem] flex flex-wrap items-center justify-between gap-x-3 gap-y-2 lg:flex-nowrap lg:sticky lg:top-0 z-20">
      {/* Zone 1: Back to home, brand title & Context */}
      <div className="flex min-w-0 basis-full items-center gap-3 lg:basis-auto">
        <button
          type="button"
          ref={navigationButtonRef}
          aria-label={isNavigationOpen ? '關閉系統導覽' : '開啟系統導覽'}
          aria-expanded={isNavigationOpen}
          aria-controls="system-navigation"
          onClick={onToggleNavigation}
          onKeyDown={event => {
            if (event.key === 'Escape' && isNavigationOpen) {
              event.preventDefault();
              onCloseNavigation();
            }
          }}
          className="type-label flex shrink-0 items-center justify-center rounded-lg border border-slate-200 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <nav aria-label="首頁與系統切換" className="shrink-0">
          <button
            type="button"
            onClick={onBackToHome}
            className="type-label flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-800 px-3 py-1.5 text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 cursor-pointer"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            <span>返回個人首頁</span>
          </button>
        </nav>
        <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold shadow-sm">
          <Store size={18} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-bold text-slate-900 tracking-tight text-base">綠境草本頭皮護理沙龍</span>
            <span className="text-slate-300 font-light">/</span>
            <span className="type-detail font-medium text-emerald-800">{tabLabels[activeTab] || '決策支援中心'}</span>
          </div>
          <div className="type-detail text-slate-600 hidden 2xl:block">
            <span>台北概念旗艦館</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="tabular-nums">{inventorySummary.totalSkus} SKUs 常備</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span>資料變動時計算庫存</span>
          </div>
        </div>
      </div>

      {/* Zone 2: Navigation Links (Secondary / Quick Filters if needed or Breadcrumbs) */}
      <div className="hidden min-[1200px]:flex items-center gap-5 type-detail text-slate-600">
        <span
          title="課程原型：目前示範資料，未連接門市或 AI 服務"
          className="type-detail whitespace-nowrap text-emerald-800/80 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          課程原型：示範資料
        </span>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {/* Quick Service Usage Entry Button */}
        <button
          type="button"
          onClick={() => setIsServiceUsageModalOpen(true)}
          className="type-label flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 whitespace-nowrap bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
          title="沙龍做客人快速登記洗髮精/精華液耗用，即刻扣庫存"
        >
          <Plus size={15} />
          <span>現場領料 / 服務耗用</span>
        </button>

        {/* Notifications & Auto Alert Settings */}
        <button
          type="button"
          aria-label={`站內通知與設定，未讀 ${unreadCount} 則`}
          onClick={() => setIsNotificationSettingsOpen(true)}
          className="type-label relative flex shrink-0 items-center justify-center p-2 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50/50 rounded-lg transition-colors cursor-pointer"
          title={`未讀站內紀錄 ${unreadCount} 則；LINE／Email 示範，未實際發送`}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-6 min-h-6 px-1 bg-rose-600 text-white type-detail font-bold rounded-full flex items-center justify-center tabular-nums">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Switcher Dropdown for Testing Role Perspectives */}
        <div
          className="relative"
          title="角色切換供操作情境展示，目前未提供登入驗證與權限隔離。"
          onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget)) setIsRoleSelectorOpen(false);
          }}
          onKeyDown={event => {
            if (event.key === 'Escape' && isRoleSelectorOpen) {
              event.preventDefault();
              setIsRoleSelectorOpen(false);
              roleButtonRef.current?.focus();
            }
          }}
        >
          <button
            type="button"
            ref={roleButtonRef}
            aria-label={`切換示範角色，目前為 ${currentUser.name}`}
            aria-expanded={isRoleSelectorOpen}
            aria-controls="role-selector"
            onClick={() => setIsRoleSelectorOpen(open => !open)}
            className="type-label flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer"
          >
            <span className="w-8 h-8 shrink-0 rounded-full bg-emerald-100 text-emerald-900 font-bold type-detail flex items-center justify-center border border-emerald-200 shadow-inner">
              {currentUser.avatar}
            </span>
            <span className="text-left hidden md:block">
              <span className="block type-detail font-bold text-slate-800 leading-tight">{currentUser.name}</span>
              <span className="block type-detail text-slate-600">角色示範 · {currentUser.title.split(' ')[0]}</span>
            </span>
          </button>

          {/* Quick User Role Switcher Menu */}
          <div id="role-selector" hidden={!isRoleSelectorOpen} className="absolute right-0 mt-2 w-52 max-w-[calc(100vw-2rem)] max-h-[60dvh] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-30 animate-in fade-in">
            <div className="px-3 py-2 type-detail font-bold text-slate-600 border-b border-slate-100 uppercase tracking-wider">
              切換示範角色（{users.length} 位）
            </div>
            <p className="px-3 py-2 type-detail text-slate-500">角色切換供操作情境展示，目前未提供登入驗證與權限隔離。</p>
            {users.map(u => (
              <button
                type="button"
                key={u.id}
                onClick={() => {
                  setCurrentUser(u);
                  setIsRoleSelectorOpen(false);
                  roleButtonRef.current?.focus();
                }}
                className={`type-label w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
 currentUser.id === u.id ? 'bg-emerald-50 text-emerald-900 ' : 'text-slate-600 hover:bg-slate-50'
 }`}
              >
                <div>
                  <div className="text-slate-800">{u.name}</div>
                  <div className="type-detail text-slate-600">{u.title}</div>
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
