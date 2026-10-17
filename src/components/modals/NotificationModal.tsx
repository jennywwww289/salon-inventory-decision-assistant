import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Bell, 
  Send, 
  CheckCircle2, 
  Smartphone, 
  Mail, 
  AlertTriangle, 
  Sparkles, 
  Radio, 
  Settings,
  Check
} from 'lucide-react';

export const NotificationModal: React.FC = () => {
  const { 
    isNotificationSettingsOpen, 
    setIsNotificationSettingsOpen, 
    notifications, 
    markAllNotificationsRead, 
    sendMockNotification,
    products,
    inventoryAlerts,
    inventorySummary
  } = useApp();

  const [lineActive, setLineActive] = useState(true);
  const [emailActive, setEmailActive] = useState(true);
  const [targetChannel, setTargetChannel] = useState<'LINE' | 'Email'>('LINE');
  const [testMessage, setTestMessage] = useState('');

  if (!isNotificationSettingsOpen) return null;

  const handleSendTestAlert = () => {
    const criticalProduct = products.find(p => p.status === 'Critical') || products[0];
    if (!criticalProduct) {
      setTestMessage('目前沒有商品，未新增示範紀錄。');
      return;
    }
    sendMockNotification(
      targetChannel,
      `【補貨情境示範】${criticalProduct.name} 現有 ${criticalProduct.stock} 瓶`,
      `目前示範資料：週需求 ${criticalProduct.weeklyDemand}、補貨點 ${criticalProduct.reorderPoint}、交期 ${criticalProduct.leadTime} 天；本次只新增站內紀錄。`
    );
    setTestMessage(`已新增 ${targetChannel} 站內示範紀錄，未實際發送。`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold">
              <Bell size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">庫存警示與站內通知示範</h2>
              <p className="text-xs text-slate-500">警示隨目前資料更新；LINE／Email 示範，未實際發送。通知及已讀狀態不保存，重新整理後回到初始示例。</p>
            </div>
          </div>
          <button
            onClick={() => setIsNotificationSettingsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
          {/* Status badge */}
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <div>
                <span className="font-bold text-emerald-950 block">目前庫存警示：依共用規則計算</span>
                <span className="text-[11px] text-emerald-800">全店 {inventorySummary.totalSkus} SKUs 依庫存、補貨點與週需求更新，非背景定時監控</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-white text-emerald-800 px-2 py-1 rounded shadow-2xs">
              前端示範
            </span>
          </div>

          {/* Channels Toggle */}
          <div className="space-y-2">
            <p className="font-semibold text-slate-700">管道偏好示意（開關僅切換顯示，不控制發送）：</p>
            <p className="text-[11px] text-slate-500">管道選擇暫存於本次系統展示，返回首頁或重新整理會重設；未串接外部服務或排程。</p>
            <div className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => setLineActive(!lineActive)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  lineActive ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Smartphone size={16} className="text-emerald-700" />
                  <div>
                    <div className="font-bold text-slate-900">LINE 管道示意</div>
                    <div className="text-[10px] text-slate-500">{lineActive ? '示意開啟' : '示意關閉'}，未實際發送</div>
                  </div>
                </div>
                {lineActive && <Check size={16} className="text-emerald-700" />}
              </div>

              <div 
                onClick={() => setEmailActive(!emailActive)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  emailActive ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-emerald-700" />
                  <div>
                    <div className="font-bold text-slate-900">Email 管道示意</div>
                    <div className="text-[10px] text-slate-500">{emailActive ? '示意開啟' : '示意關閉'}，未實際發送</div>
                  </div>
                </div>
                {emailActive && <Check size={16} className="text-emerald-700" />}
              </div>
            </div>
          </div>

          {/* Test Dispatch Tool */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">新增站內示範紀錄：</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTargetChannel('LINE')}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                    targetChannel === 'LINE' ? 'bg-emerald-800 text-white font-bold' : 'bg-white text-slate-600 border'
                  }`}
                >
                  LINE
                </button>
                <button
                  type="button"
                  onClick={() => setTargetChannel('Email')}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                    targetChannel === 'Email' ? 'bg-emerald-800 text-white font-bold' : 'bg-white text-slate-600 border'
                  }`}
                >
                  Email
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              選用第一項危急商品，沒有危急商品時使用第一項商品。按下後只新增站內紀錄，不修改庫存、建立採購或對外寄送。
            </p>

            <button
              type="button"
              onClick={handleSendTestAlert}
              disabled={products.length === 0}
              className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded-lg font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send size={14} />
              <span>新增 {targetChannel} 示範紀錄</span>
            </button>
            <p role="status" aria-live="polite" className="min-h-4 text-[11px] text-slate-600">{testMessage}</p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="font-semibold text-slate-800">目前庫存警示：{inventoryAlerts.length} 項（危急／低水位）</h3>
            {inventoryAlerts.length === 0 ? <p>目前沒有危急或低水位商品。</p> : (
              <ul className="space-y-1">
                {inventoryAlerts.slice(0, 5).map(p => <li key={p.id}>{p.name}：現有 {p.stock}，補貨點 {p.reorderPoint}（{p.status === 'Critical' ? '危急' : '低水位'}）</li>)}
              </ul>
            )}
            {inventoryAlerts.length > 5 && <p>顯示前 5 項，全部警示請至庫存頁查看。</p>}
          </div>

          {/* Historical events retain their event-time meaning after stock changes. */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">站內歷史紀錄（含初始示例）({notifications.length})</span>
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="text-[11px] text-emerald-800 hover:underline cursor-pointer"
              >
                全部標記為已讀
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[11px]">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    n.isRead ? 'bg-white border-slate-100 text-slate-500' : 'bg-emerald-50/40 border-emerald-200 text-slate-800 font-sans'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 font-sans">{n.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{n.timestamp}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-sans">{n.channel === 'System' ? '站內紀錄' : `${n.channel} 示範，未實際發送`}{n.isRead ? ' · 已讀' : ' · 未讀'}</p>
                  <p className="text-[11px] text-slate-600 font-sans leading-relaxed">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => setIsNotificationSettingsOpen(false)}
            className="px-5 py-2 bg-emerald-800 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
          >
            完成並關閉
          </button>
        </div>
      </div>
    </div>
  );
};
