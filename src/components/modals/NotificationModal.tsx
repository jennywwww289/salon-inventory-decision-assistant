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
    products
  } = useApp();

  const [lineActive, setLineActive] = useState(true);
  const [emailActive, setEmailActive] = useState(true);
  const [targetChannel, setTargetChannel] = useState<'LINE' | 'Email'>('LINE');
  const [testSent, setTestSent] = useState(false);

  if (!isNotificationSettingsOpen) return null;

  const handleSendTestAlert = () => {
    const criticalProduct = products.find(p => p.status === 'Critical') || products[0];
    sendMockNotification(
      targetChannel,
      `【倉管小幫手緊急補貨警報】${criticalProduct.name} 僅剩 ${criticalProduct.stock} 瓶！`,
      `交期預估需 ${criticalProduct.leadTime} 天，依據每週耗用速度預計於 7 天內斷貨。請店長前往後台審核採購單。`
    );
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2000);
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
              <h2 className="text-base font-bold text-slate-900">倉管小幫手｜即時監控與自動補貨通知</h2>
              <p className="text-xs text-slate-500">監控貨物動態，當庫存低於臨界點自動發送 LINE 與郵件預警。</p>
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
                <span className="font-bold text-emerald-950 block">即時貨物自動監控：運作中</span>
                <span className="text-[11px] text-emerald-800">全店 100 SKUs 每秒比對庫存覆蓋天數 vs 供應商到貨前置期</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-white text-emerald-800 px-2 py-1 rounded shadow-2xs">
              24HR 守護
            </span>
          </div>

          {/* Channels Toggle */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 block">自動發送警報管道配置：</label>
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
                    <div className="font-bold text-slate-900">LINE Notify 官方群組</div>
                    <div className="text-[10px] text-slate-500">推播至「店長與採購緊急通知群」</div>
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
                    <div className="font-bold text-slate-900">門市營運電子信箱</div>
                    <div className="text-[10px] text-slate-500">每日早上 08:00 發送晨間決策簡報</div>
                  </div>
                </div>
                {emailActive && <Check size={16} className="text-emerald-700" />}
              </div>
            </div>
          </div>

          {/* Test Dispatch Tool */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">模擬發送補貨通知測試：</span>
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
              點選按鈕後，系統將依據目前現有庫存最緊迫之品項（如 5α捷利爾淨化液），模擬觸發自動補貨通知。
            </p>

            <button
              type="button"
              onClick={handleSendTestAlert}
              className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded-lg font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {testSent ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>已成功發送通知至 {targetChannel}！</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>立即模擬觸發 {targetChannel} 補貨警報</span>
                </>
              )}
            </button>
          </div>

          {/* Recent Notification Feed */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">最新通知紀錄 ({notifications.length})</span>
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
