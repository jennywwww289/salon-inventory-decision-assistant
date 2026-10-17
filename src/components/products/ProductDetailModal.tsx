import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, TransactionType, ReturnDirection } from '../../types';
import { formatCoverage, sortTransactions, formatNumber, formatGrossMargin } from '../../utils/inventoryCalculations';
import { formatValidationErrors, parseNumericInput, validatePositiveQuantity, validateSignedQuantity, OUTBOUND_TRANSACTION_TYPES } from '../../utils/validation';
import { 
  X, 
  Clock, 
  Plus, 
  Minus, 
  ShoppingCart, 
  BrainCircuit, 
  AlertTriangle, 
  History, 
  Tag, 
  Truck, 
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface Props {
  product: Product;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<Props> = ({ product: selectedProduct, onClose }) => {
  const { 
    products,
    transactions, 
    recordTransaction, 
    currentUser, 
    createPurchaseOrder, 
    setActiveTab, 
    insights 
  } = useApp();

  const [activeTab, setModalTab] = useState<'ledger' | 'insights' | 'quickAction'>('ledger');
  
  // Quick ledger entry state
  const [adjustType, setAdjustType] = useState<TransactionType>('Service Usage');
  const [returnDirection, setReturnDirection] = useState<ReturnDirection | ''>('');
  const [adjustQty, setAdjustQty] = useState('1');
  const [serviceName, setServiceName] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const product = products.find(p => p.id === selectedProduct.id);
  if (!product) return <div role="alert" className="p-4 bg-white">商品不存在。<button type="button" onClick={onClose}>關閉</button></div>;

  // Filter transactions for this specific product
  const productTransactions = sortTransactions(transactions.filter(t => t.productId === product.id));

  // Related insight
  const relatedInsight = insights.find(i => i.productId === product.id);

  const coverageWeeks = formatCoverage(product.stock, product.weeklyDemand, '週');
  const coverageMonths = formatCoverage(product.stock, product.monthlyDemand, '個月');

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawQuantity = parseNumericInput(adjustQty);
    const quantity = adjustType === 'Inventory Adjustment'
      ? validateSignedQuantity(rawQuantity, '盤點調整數量')
      : validatePositiveQuantity(rawQuantity, '輸入數量');
    if (quantity.ok === false) {
      setError(formatValidationErrors(quantity.errors));
      return;
    }
    setIsSubmitting(true);

    const isOutbound = OUTBOUND_TRANSACTION_TYPES.includes(adjustType)
      || (adjustType === 'Return' && returnDirection === 'To Supplier');
    const qtyValue = isOutbound ? -quantity.value : quantity.value;

    const result = recordTransaction({
      productId: product.id,
      type: adjustType,
      returnDirection: adjustType === 'Return' ? returnDirection || undefined : undefined,
      quantity: qtyValue,
      serviceType: serviceName || undefined,
      note: note || undefined
    });

    setIsSubmitting(false);
    if (result.ok === false) {
      setError(formatValidationErrors(result.errors));
      return;
    }
    setError('');
    setNote('');
    setServiceName('');
    setModalTab('ledger');
  };

  const handleCreatePOFromModal = () => {
    const qty = Math.max(product.moq, Math.round(product.weeklyDemand * 4));
    const result = createPurchaseOrder({
      supplierId: product.supplierId,
      items: [{
        productId: product.id,
        quantity: qty,
        unitCost: product.unitCost
      }],
      expectedDeliveryDate: new Date(Date.now() + product.leadTime * 86400000).toISOString().split('T')[0],
      notes: `由商品明細手動建立採購草稿；數量取 MOQ 與週需求乘 4 四捨五入的較大值。`,
      isAiAssisted: true,
      aiRationale: `現有庫存 ${product.stock}，補貨點 ${product.reorderPoint}，交期 ${product.leadTime} 天。`
    });
    if (result.ok === false) {
      setError(formatValidationErrors(result.errors));
      return;
    }
    setError('');
    onClose();
    setActiveTab('purchase');
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="modal-panel bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                {product.brandName}
              </span>
              <span className="text-xs text-slate-400 font-mono">SKU: {product.sku}</span>
              <span className="text-xs text-slate-400">· {product.category}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">規格：{product.spec} · 供應商：{product.supplierName}</p>
          </div>
          <button
            type="button"
            aria-label="關閉商品明細"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Summary Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-emerald-950/5 border-b border-emerald-950/10 text-xs font-mono">
          <div className="bg-white p-2.5 rounded-xl border border-emerald-950/10">
            <span className="text-slate-400 text-[11px] block">現有庫存 (件)</span>
            <span className={`text-xl font-bold ${
              product.status === 'Critical' ? 'text-rose-600' : product.status === 'Low' ? 'text-amber-600' : 'text-slate-900'
            }`}>
              {product.stock}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-emerald-950/10">
            <span className="text-slate-400 text-[11px] block">安全庫存覆蓋</span>
            <span className="text-xl font-bold text-slate-900">
              {coverageWeeks}
            </span>
            <span className="text-[10px] text-slate-400 block font-sans">{coverageMonths}</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-emerald-950/10">
            <span className="text-slate-400 text-[11px] block">週銷量 / 月銷量</span>
            <span className="text-sm font-bold text-slate-800">
              {product.weeklyDemand} / {product.monthlyDemand}
            </span>
            <span className="text-[10px] text-slate-400 block font-sans">安全補貨點：{product.reorderPoint}</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-emerald-950/10">
            <span className="text-slate-400 text-[11px] block">進價 / 建議售價</span>
            <span className="text-sm font-bold text-slate-800">
              NT$ {product.unitCost} / {product.sellingPrice}
            </span>
            <span className="text-[10px] text-emerald-700 block font-sans font-semibold">
              毛利率：{formatGrossMargin(product.unitCost, product.sellingPrice)}
            </span>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-100 bg-white">
          <button
            onClick={() => setModalTab('ledger')}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'border-emerald-800 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <History size={14} />
            <span>出入庫異動帳本 ({productTransactions.length})</span>
          </button>

          <button
            onClick={() => setModalTab('quickAction')}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quickAction'
                ? 'border-emerald-800 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Plus size={14} />
            <span>登記領料 / 庫存校正</span>
          </button>

          <button
            onClick={() => setModalTab('insights')}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'insights'
                ? 'border-emerald-800 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BrainCircuit size={14} />
            <span>庫存規則與需求試算</span>
          </button>
        </div>

        {error && <p role="alert" className="px-5 py-2 text-sm text-rose-700">{error}</p>}
        {/* Tab Content */}
        <div className="modal-body p-5 overflow-y-auto flex-1">
          {/* TAB 1: LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>每筆出入庫皆記錄經手人、時間與變更後庫存，完全取代沙龍紙本簽領表。</span>
                <button
                  onClick={() => setModalTab('quickAction')}
                  className="text-emerald-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>新增異動紀錄</span>
                </button>
              </div>

              {productTransactions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  此商品尚未有獨立異動記錄。您可於上方登記首次領料或入庫。
                </div>
              ) : (
                <div tabIndex={0} role="region" aria-label="商品交易帳本，可左右捲動" className="table-scroll border border-slate-200 rounded-xl font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">日期時間</th>
                        <th className="py-2.5 px-3">異動類型</th>
                        <th className="py-2.5 px-3 text-right">數量</th>
                        <th className="py-2.5 px-3">經手人</th>
                        <th className="py-2.5 px-3 text-right">異動後庫存</th>
                        <th className="py-2.5 px-3 text-right">異動時單位成本</th>
                        <th className="py-2.5 px-3">服務項目 / 備註</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {productTransactions.map(tx => {
                        const isPositive = tx.quantity > 0;
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                              {tx.timestamp}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-800">
                                {tx.type === 'Return'
                                  ? tx.returnDirection === 'To Supplier' ? '退回供應商'
                                    : tx.returnDirection === 'From Customer' ? '顧客退回商品' : '退貨（方向未記錄）'
                                  : tx.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              <span className={isPositive ? 'text-emerald-700' : 'text-rose-600'}>
                                {isPositive ? `+${tx.quantity}` : tx.quantity}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              {tx.userName}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                              {tx.resultingStock}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              {tx.unitCost === undefined ? '未記錄' : `NT$ ${formatNumber(tx.unitCost)}`}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                              {tx.serviceType && (
                                <span className="text-emerald-800 font-medium block">
                                  {tx.serviceType}
                                </span>
                              )}
                              <span>{tx.note || '-'}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: QUICK ENTRY FORM */}
          {activeTab === 'quickAction' && (
            <form onSubmit={handleRecordSubmit} className="max-w-xl mx-auto space-y-4 text-xs">
              <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl text-slate-700">
                現場美髮師做客人時使用、員工內訓示範或月底盤點，皆可在此 5 秒內快速扣除或校正庫存。
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">異動類型</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as TransactionType)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-700"
                >
                  <option value="Service Usage">服務耗用 (沙龍療程使用 - 扣除)</option>
                  <option value="Staff Usage">員工自用 / 內訓樣品 (扣除)</option>
                  <option value="Sale">門市零售帶走 (扣除)</option>
                  <option value="Purchase">採購入庫 (增加)</option>
                  <option value="Inventory Adjustment">盤點校正調整</option>
                  <option value="Damage / Loss">破損耗損報廢</option>
                  <option value="Return">退貨處理（選擇方向）</option>
                </select>
              </div>

              {adjustType === 'Return' && (
                <div>
                  <label htmlFor="return-direction" className="block text-slate-700 font-semibold mb-1">退貨方向</label>
                  <select
                    id="return-direction"
                    value={returnDirection}
                    onChange={(e) => setReturnDirection(e.target.value as ReturnDirection | '')}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-700"
                    required
                  >
                    <option value="">請選擇退貨方向</option>
                    <option value="To Supplier">退回供應商（扣除庫存）</option>
                    <option value="From Customer">顧客退回商品（增加庫存）</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">數量 ({product.spec})</label>
                  <p className="text-[11px] text-slate-500 mb-1">盤點調整：正數增加、負數減少；其他類型請輸入正數。</p>
                  <input
                    type="number"
                    min={adjustType === 'Inventory Adjustment' ? undefined : 1}
                    max="999"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-800 focus:ring-1 focus:ring-emerald-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">經手人</label>
                  <input
                    type="text"
                    disabled
                    value={`${currentUser.name} (${currentUser.role})`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-500 font-medium"
                  />
                </div>
              </div>

              {adjustType === 'Service Usage' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">療程服務名稱 (選填)</label>
                  <input
                    type="text"
                    placeholder="例：皇家森活深層毛囊淨化療程"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">備註說明 (選填)</label>
                <input
                  type="text"
                  placeholder="例：展櫃客人帶走或耗損備查"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalTab('ledger')}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  確認登記並更新庫存
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: INSIGHTS & 4 QUESTIONS */}
          {activeTab === 'insights' && (
            <div className="space-y-5 text-xs">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <BrainCircuit size={17} />
                  <span>依目前示範資料與既有公式試算，非 AI 預測</span>
                </div>

                <div className="space-y-3 divide-y divide-emerald-200/50">
                  {/* 1. What happened? */}
                  <div className="pt-2">
                    <span className="font-bold text-slate-900 text-xs block mb-0.5">
                      1. 發生了什麼事？ (What happened?)
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      目前現有庫存為 <strong className="font-mono">{product.stock}</strong> 瓶，安全補貨點為 <strong className="font-mono">{product.reorderPoint}</strong> 瓶。
                      示範每週需求參數為 <strong className="font-mono">{product.weeklyDemand}</strong> 瓶，
                      庫存狀態經判定為：<strong className="text-emerald-900 font-semibold">{product.status}</strong>。
                    </p>
                  </div>

                  {/* 2. Why did it happen? */}
                  <div className="pt-2">
                    <span className="font-bold text-slate-900 text-xs block mb-0.5">
                      2. 庫存狀態的規則依據
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {product.statusReason ?? '依目前庫存、補貨點與週需求的共用規則分類；未分析預約量或顧客行為。'}
                    </p>
                  </div>

                  {/* 3. What might happen next? */}
                  <div className="pt-2">
                    <span className="font-bold text-slate-900 text-xs block mb-0.5">
                      3. 需求維持不變時的覆蓋量試算
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      以庫存除以示範需求參數：週覆蓋 {coverageWeeks}、月覆蓋 {coverageMonths}；供應商交期參數 {product.leadTime} 天。此為公式試算，不保證實際需求或到貨時間。
                    </p>
                  </div>

                  {/* 4. What can I do? */}
                  <div className="pt-2">
                    <span className="font-bold text-slate-900 text-xs block mb-0.5">
                      4. 我能採取什麼行動？ (What can I do?)
                    </span>
                    <p className="text-slate-700 leading-relaxed mb-3">
                      {product.weeklyDemand === 0 ? '目前無需求資料，無法估算用盡時間。' : product.status === 'Critical' || product.status === 'Low'
                        ? `建立草稿時數量為 ${Math.max(product.moq, Math.round(product.weeklyDemand * 4))} 瓶，取 MOQ (${product.moq}) 與週需求乘 4 四捨五入的較大值。這是既有補貨公式，非 AI 推薦或實際下單。`
                        : product.status === 'Overstock'
                        ? `去化情境示意：暫停採購、搭配套裝或提供體驗；未驗證成效，也不會自動執行。`
                        : `目前無需緊急操作，保持每週定期檢視即可。`}
                    </p>

                    {product.status === 'Critical' || product.status === 'Low' ? (
                      <button
                        onClick={handleCreatePOFromModal}
                        className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <ShoppingCart size={15} />
                        <span>依公式建立採購草稿</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-actions p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            供應商交期：{product.leadTime} 天 · MOQ：{product.moq} 瓶
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
            >
              關閉
            </button>
            <button
              onClick={handleCreatePOFromModal}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-black text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShoppingCart size={15} />
              <span>以此商品建立採購草稿</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
