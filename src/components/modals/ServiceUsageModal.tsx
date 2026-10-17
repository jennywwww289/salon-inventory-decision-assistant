import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Sparkles, Plus, CheckCircle2, Scissors, UserCheck } from 'lucide-react';
import { InventoryTransaction, TransactionType } from '../../types';
import { formatValidationErrors, parseNumericInput, validatePositiveQuantity } from '../../utils/validation';

export const ServiceUsageModal: React.FC = () => {
  const { 
    isServiceUsageModalOpen, 
    setIsServiceUsageModalOpen, 
    products, 
    users, 
    currentUser, 
    recordTransaction 
  } = useApp();

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [qty, setQty] = useState('1');
  const [usageType, setUsageType] = useState<TransactionType>('Service Usage');
  const [serviceName, setServiceName] = useState('');
  const [note, setNote] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [completedMovement, setCompletedMovement] = useState<InventoryTransaction | null>(null);

  if (!isServiceUsageModalOpen) return null;

  const targetProduct = products.find(p => p.id === selectedProductId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = validatePositiveQuantity(parseNumericInput(qty));
    if (quantity.ok === false) {
      setError(formatValidationErrors(quantity.errors));
      return;
    }
    const result = recordTransaction({
      productId: selectedProductId,
      type: usageType,
      quantity: -quantity.value,
      serviceType: serviceName || (usageType === 'Service Usage' ? '沙龍日常美髮理療' : undefined),
      note: note || undefined,
      userId: selectedUserId
    });
    if (result.ok === false) {
      setError(formatValidationErrors(result.errors));
      return;
    }
    setError('');
    setCompletedMovement(result.value);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsServiceUsageModalOpen(false);
      setNote('');
      setServiceName('');
    }, 1200);
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="modal-panel bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold">
              <Scissors size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">現場領料 / 服務耗用登記</h2>
              <p className="text-xs text-slate-500">做客人、洗護吹整或店內測試，5 秒內完成扣庫存。</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="關閉領料表單"
            onClick={() => setIsServiceUsageModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-2 animate-in zoom-in-95">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">已成功扣除並寫入出入庫帳本！</h3>
            <p className="text-xs text-slate-500">
              {completedMovement?.productName} 目前剩餘：{completedMovement?.resultingStock} {targetProduct?.spec}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && <p role="alert" className="text-rose-700">{error}</p>}
            {/* Staff who took the product */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">領料/使用人員</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.title})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">耗用類別</label>
                <select
                  value={usageType}
                  onChange={(e) => setUsageType(e.target.value as TransactionType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium"
                >
                  <option value="Service Usage">沙龍服務耗用 (顧客療程)</option>
                  <option value="Staff Usage">員工自用 / 內訓樣品</option>
                  <option value="Sale">現場客人加購帶走</option>
                  <option value="Damage / Loss">破損 / 瑕疵報廢</option>
                </select>
              </div>
            </div>

            {/* Product Selector */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">選擇使用商品</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.brandName}] {p.name} ({p.spec}) · 現存: {p.stock} 瓶
                  </option>
                ))}
              </select>
            </div>

            {/* Target Product Real-time Preview */}
            {targetProduct && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[11px] font-sans">目前現有庫存</span>
                  <span className="text-slate-900 font-bold text-sm">{targetProduct.stock} 瓶</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px] font-sans">安全補貨點</span>
                  <span className="text-slate-700 font-semibold">{targetProduct.reorderPoint} 瓶</span>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">領取數量 (瓶/入/組)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={targetProduct ? targetProduct.stock : 99}
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono font-bold text-slate-900 text-center text-sm"
                    required
                  />
                  <div className="flex gap-1">
                    {[1, 2, 3].map(q => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQty(String(q))}
                        className={`px-2.5 py-1.5 rounded border text-xs cursor-pointer ${
                          qty === String(q) ? 'bg-emerald-800 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">療程服務項目 (選填)</label>
                <input
                  type="text"
                  placeholder="例：深層淨化抗敏頭皮療程"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">備註說明 (選填)</label>
              <input
                type="text"
                placeholder="例：開瓶供 3 號位貴賓使用"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsServiceUsageModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
              >
                確認扣除庫存
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
