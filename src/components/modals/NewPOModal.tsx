import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Plus, Trash2, ShoppingCart, Sparkles, AlertCircle } from 'lucide-react';
import { formatValidationErrors, parseNumericInput, validatePurchaseInput } from '../../utils/validation';

interface Props {
  onClose: () => void;
  defaultProductId?: string;
  defaultQty?: number;
}

export const NewPOModal: React.FC<Props> = ({ onClose, defaultProductId, defaultQty }) => {
  const { suppliers, products, createPurchaseOrder } = useApp();

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(() => products.find(p => p.id === defaultProductId)?.supplierId ?? suppliers[0]?.id ?? '');
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const submittedRef = useRef(false);

  // Selected supplier object
  const currentSupplier = suppliers.find(s => s.id === selectedSupplierId);

  // Available products for this supplier
  const availableProducts = products.filter(p => p.supplierId === selectedSupplierId);

  // Items to order state
  const [items, setItems] = useState<{ productId: string; quantity: number | string }[]>(() => {
    if (defaultProductId) {
      const p = products.find(prod => prod.id === defaultProductId);
      if (p) {
        return [{ productId: p.id, quantity: defaultQty ?? p.moq }];
      }
    }
    // Default to first product if available
    if (availableProducts.length > 0) {
      return [{ productId: availableProducts[0].id, quantity: availableProducts[0].moq }];
    }
    return [];
  });

  const handleAddItem = () => {
    if (availableProducts.length === 0) return;
    // pick one that isn't already added if possible
    const unselected = availableProducts.find(p => !items.some(i => i.productId === p.id));
    if (!unselected) {
      setError('目前供應商的商品皆已加入，請調整原有品項。');
      return;
    }
    setItems([...items, { productId: unselected.id, quantity: unselected.moq }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: any) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    setItems(next);
  };

  // Calculate total units and total cost
  let totalUnits = 0;
  let totalCost = 0;
  items.forEach(it => {
    const p = products.find(prod => prod.id === it.productId);
    const quantity = parseNumericInput(it.quantity);
    if (p && Number.isFinite(quantity)) {
      totalUnits += quantity;
      totalCost += quantity * p.unitCost;
    }
  });

  const isMoqMet = currentSupplier ? totalUnits >= currentSupplier.moq : true;

  const buildInput = (supplierId = selectedSupplierId) => ({
    supplierId,
    items: items.map(it => {
      const p = products.find(prod => prod.id === it.productId);
      return {
        productId: it.productId, quantity: parseNumericInput(it.quantity),
        unitCost: p ? p.unitCost : 0,
      };
    }),
    expectedDeliveryDate: expectedDate, notes: notes || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submittedRef.current) return;
    const result = createPurchaseOrder(buildInput());
    if (result.ok === false) {
      setError(formatValidationErrors(result.errors));
      return;
    }
    setError('');
    submittedRef.current = true;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">建立採購訂單草稿 (New Purchase Order)</h2>
            <p className="text-xs text-slate-500">建立目前示範資料中的採購草稿，不會對外送單；核准須依狀態流程，但目前不依角色限制。</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
          {error && <p role="alert" className="text-rose-700">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">選擇供應商</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => {
                  setSelectedSupplierId(e.target.value);
                  const validation = validatePurchaseInput(buildInput(e.target.value), products, suppliers);
                  setError(validation.ok === false ? formatValidationErrors(validation.errors) : '');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (MOQ: {s.moq} / 交期: {s.defaultLeadTime}天)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">預期到貨日</label>
              <input
                type="date"
                required
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-semibold">採購品項明細</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-emerald-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>+ 增加品項</span>
              </button>
            </div>

            {items.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-400 border border-dashed border-slate-200">
                尚未加入品項，請點選上方「增加品項」。
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const p = products.find(prod => prod.id === item.productId);
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex-1">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                        >
                          {!availableProducts.some(prod => prod.id === item.productId) && (
                            <option value={item.productId} disabled>{p?.name ?? item.productId}（不符目前供應商，請更換或移除）</option>
                          )}
                          {availableProducts.map(prod => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} ({prod.spec}) · 現存: {prod.stock} · 成本: ${prod.unitCost}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-center font-mono font-bold"
                          placeholder="數量"
                        />
                      </div>

                      <div className="w-24 text-right font-mono font-bold text-slate-800 text-xs">
                        NT$ {p && Number.isFinite(parseNumericInput(item.quantity)) ? (p.unitCost * parseNumericInput(item.quantity)).toLocaleString() : '—'}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MOQ Alert if not met */}
          {!isMoqMet && currentSupplier && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-xs">
              <AlertCircle size={16} className="shrink-0" />
              <span>
                注意：目前訂購總件數 ({totalUnits}) 未達該供應商最小起訂量 ({currentSupplier.moq} 件)。建議調整數量以符合訂貨標準。
              </span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">訂單備註 (選填)</label>
            <input
              type="text"
              placeholder="例：秋季例行補貨，請於週五前送達"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
            />
          </div>

          {/* Summary */}
          <div className="p-3 bg-slate-100 rounded-xl flex justify-between items-center text-xs">
            <span className="text-slate-600">
              合計品項：<strong>{items.length}</strong> 項 · 總件數：<strong>{totalUnits}</strong> 瓶
            </span>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">預估總金額</span>
              <span className="text-base font-black text-slate-900 font-mono">
                NT$ {totalCost.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
            >
              建立採購單草稿
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
