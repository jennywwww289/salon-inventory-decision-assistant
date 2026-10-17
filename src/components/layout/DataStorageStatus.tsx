import React from 'react';
import { useApp } from '../../context/AppContext';

export const DataStorageStatus: React.FC<{ showReset?: boolean }> = ({ showReset = false }) => {
  const { storageStatus, resetDemoData } = useApp();
  const failed = storageStatus.kind === 'blocked' || storageStatus.kind === 'error';
  if (!showReset && !failed) return null;

  const handleReset = () => {
    const confirmed = window.confirm('將以初始示範資料取代此網站本機保存的商品、交易、採購、品牌、供應商與人員，並清除本次通知、回饋與選取。是否重設？');
    if (confirmed) resetDemoData();
  };

  return (
    <section aria-label="本機資料保存" className="border-b border-slate-200 bg-white px-6 py-3 type-detail text-slate-700">
      <p role={failed ? 'alert' : 'status'} aria-live="polite" className={`type-body ${failed ? 'text-rose-700' : ''}`}>{storageStatus.message}</p>
      {showReset && <div className="mt-2 flex flex-wrap items-center gap-3">
        <p className="type-detail text-slate-500">核心資料保存在此瀏覽器；更換瀏覽器、網站來源或清除網站資料後不會共用。這是本機保存，不是雲端備份。</p>
        <button type="button" onClick={handleReset} className="type-label min-h-11 rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-emerald-800 cursor-pointer">重設示範資料</button>
      </div>}
    </section>
  );
};
