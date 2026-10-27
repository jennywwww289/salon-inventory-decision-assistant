import React, { useState } from 'react';
import { Database, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DataStorageStatus: React.FC<{ showReset?: boolean }> = ({ showReset = false }) => {
  const { storageStatus, resetDemoData } = useApp();
  const failed = storageStatus.kind === 'blocked' || storageStatus.kind === 'error';
  // 使用者手動開關只對當下這則訊息有效；訊息換了就回到預設（保存失敗時自動展開）。
  const [override, setOverride] = useState<{ message: string; open: boolean } | null>(null);
  const isOpen = override && override.message === storageStatus.message ? override.open : failed;
  const setIsOpen = (open: boolean) => setOverride({ message: storageStatus.message, open });

  if (!showReset && !failed) return null;

  const handleReset = () => {
    const confirmed = window.confirm('將以初始示範資料取代此網站本機保存的商品、交易、採購、品牌、供應商與人員，並清除本次通知、回饋與選取。是否重設？');
    if (confirmed) resetDemoData();
  };

  return (
    <section aria-label="本機資料保存" className="feedback-scope fixed right-3 top-1.5 z-50 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="本機資料保存狀態"
        className={`type-label flex h-11 w-11 items-center justify-center rounded-full border bg-white shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 cursor-pointer ${failed ? 'border-rose-300 text-rose-700' : 'border-slate-300 text-slate-600'}`}
      >
        <Database size={18} aria-hidden="true" />
      </button>
      {isOpen && (
        <div className={`w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border bg-white p-3 shadow-lg type-detail text-slate-700 ${failed ? 'border-rose-300' : 'border-slate-200'}`}>
          <div className="flex items-start justify-between gap-2">
            <p role={failed ? 'alert' : 'status'} aria-live={failed ? 'assertive' : 'polite'} aria-atomic="true" className={`type-body ${failed ? 'text-rose-700' : ''}`}>{storageStatus.message}</p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="關閉保存狀態"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-800 cursor-pointer"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          {showReset && (
            <div className="mt-2 space-y-2">
              <p className="type-detail text-slate-500">核心資料保存在此瀏覽器；更換瀏覽器、網站來源或清除網站資料後不會共用。這是本機保存，不是雲端備份。</p>
              <button type="button" onClick={handleReset} className="type-label min-h-11 rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-emerald-800 cursor-pointer">重設示範資料</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
