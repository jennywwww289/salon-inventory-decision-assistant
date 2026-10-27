import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier } from '../../types';
import { formatValidationErrors, parseNumericInput } from '../../utils/validation';
import { 
  Truck, 
  Phone, 
  Mail, 
  Calendar, 
  Tag, 
  Plus, 
  Clock, 
  ShoppingBag, 
  CheckCircle2, 
  Gift, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { suppliers, brands, products, addSupplier, updateSupplier, setActiveTab, createPurchaseOrder } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for new supplier
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [moq, setMoq] = useState('15');
  const [leadTime, setLeadTime] = useState('10');
  const [paymentTerms, setPaymentTerms] = useState('月結 30 天 (Net 30)');
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [quickError, setQuickError] = useState('');

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = addSupplier({
      name: name.trim(),
      contactPerson,
      phone,
      email,
      moq: parseNumericInput(moq),
      defaultLeadTime: parseNumericInput(leadTime),
      paymentTerms,
      suppliedBrandIds: selectedBrandIds,
      status: 'Active',
      notes
    });
    if (result.ok === false) {
      setFormError(formatValidationErrors(result.errors));
      return;
    }
    setFormError('');
    // Reset
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const handleQuickPOForSupplier = (supplier: Supplier) => {
    // Find critical or low products for this supplier
    const supProducts = products.filter(p => p.supplierId === supplier.id && (p.status === 'Critical' || p.status === 'Low'));
    const itemsToOrder = supProducts.length > 0 
      ? supProducts.map(p => ({
          productId: p.id,
          quantity: Math.max(p.moq, Math.round(p.weeklyDemand * 3)),
          unitCost: p.unitCost
        }))
      : products.filter(p => p.supplierId === supplier.id).slice(0, 2).map(p => ({
          productId: p.id,
          quantity: p.moq,
          unitCost: p.unitCost
        }));

    const result = createPurchaseOrder({
      supplierId: supplier.id,
      items: itemsToOrder,
      expectedDeliveryDate: new Date(Date.now() + supplier.defaultLeadTime * 86400000).toISOString().split('T')[0],
      notes: `由供應商頁面建立示範採購草稿；沿用商品成本，不自動套用促銷折扣。`,
      isAiAssisted: false
    });
    if (result.ok === false) {
      setQuickError(formatValidationErrors(result.errors));
      return;
    }
    setQuickError('');
    setActiveTab('purchase');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {quickError && <p role="alert" className="type-body text-rose-700">{quickError}</p>}
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-950/10">
        <div>
          <h1 className="type-page-title text-slate-900 tracking-tight">供應商名冊與合約條件 (5 家常規)</h1>
          <p className="type-detail text-slate-500 mt-1">
            不同供應商具備各自獨立的最小起訂量 (MOQ)、交貨前置期 (Lead Time)、付款票期與限時促銷檔期。
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="type-label px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>新增供應商檔案</span>
        </button>
      </div>

      {/* 2. Active Promotion Highlights */}
      <div className="bg-emerald-900/5 border border-emerald-900/15 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="text-emerald-800" size={18} />
          <h2 className="type-section-title text-slate-900">供應商促銷資料示例</h2>
        </div>
        <p className="mb-3 type-detail text-slate-500">促銷條件與日期是預設示例，未連接供應商報價。快捷草稿沿用商品成本，不自動套用折扣；數量依 MOQ 與週需求試算。</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.flatMap(s => (s.promotions || []).map(p => ({ ...p, supplier: s }))).map(promo => (
            <div key={promo.id} className="bg-white border border-emerald-900/10 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-1.5">
                  <span className="type-detail font-bold text-emerald-800">{promo.title}</span>
                  <span className="type-number font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    現折 {Math.round(promo.discountRate * 100)}%
                  </span>
                </div>
                <p className="type-detail text-slate-600 mb-2">{promo.description}</p>
                <div className="type-detail text-slate-600 font-mono flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>供應商：{promo.supplier.name}</span>
                  <span>·</span>
                  <span>起訂門檻：{promo.minOrderQty} 瓶</span>
                  <span>·</span>
                  <span>截止日：{promo.endDate}</span>
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleQuickPOForSupplier(promo.supplier)}
                  className="type-label px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>建立此供應商採購草稿</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Suppliers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {suppliers.map(s => {
          const supplierProducts = products.filter(p => p.supplierId === s.id);
          const criticalItems = supplierProducts.filter(p => p.status === 'Critical');
          const suppliedBrandNames = s.suppliedBrandIds
            .map(id => brands.find(b => b.id === id)?.name)
            .filter(Boolean)
            .join('、 ');

          return (
            <div
              key={s.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 feedback-card"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-2">
                  <span className="type-detail font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded">
                    {s.paymentTerms}
                  </span>
                  <span className="type-detail font-mono text-slate-600">
                    {supplierProducts.length} 項關聯商品
                  </span>
                </div>

                <h3 title={s.name} className="type-item-title truncate-reveal text-slate-900 mb-1">{s.name}</h3>
                <div className="type-detail text-slate-600 space-y-1 mb-4">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Phone size={13} className="shrink-0 text-slate-400" />
                    <span title={`${s.contactPerson} (${s.phone})`} className="truncate-reveal">{s.contactPerson} ({s.phone})</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Mail size={13} className="shrink-0 text-slate-400" />
                    <span title={s.email} className="truncate-reveal">{s.email}</span>
                  </div>
                </div>

                {/* Key Operating Terms */}
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl type-detail font-mono mb-4 border border-slate-100">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-slate-600 type-detail font-sans">交貨前置期 (Lead)</span>
                    <span className="font-bold text-slate-900 type-detail">{s.defaultLeadTime} 天</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-slate-600 type-detail font-sans">最小起訂量 (MOQ)</span>
                    <span className="font-bold text-slate-900 type-detail">{s.moq} 瓶/件</span>
                  </div>
                </div>

                <div title={`代理供應品牌：${suppliedBrandNames || '全品項代理'}`} className="type-detail truncate-reveal text-slate-600 mb-4">
                  <span className="font-semibold text-slate-700">代理供應品牌：</span>
                  <span className="text-emerald-900">{suppliedBrandNames || '全品項代理'}</span>
                </div>

                {criticalItems.length > 0 && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg type-detail text-rose-700 flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    <span>目前有 <strong>{criticalItems.length}</strong> 項商品面臨斷貨需叫貨</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="type-label text-slate-600 hover:text-slate-900"
                >
                  檢視供貨品項
                </button>
                <button
                  onClick={() => handleQuickPOForSupplier(s)}
                  className="type-label px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <ShoppingBag size={13} />
                  <span>建立採購草稿</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="modal-panel bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="type-section-title text-slate-900 mb-1">新增供應商合作檔案</h2>
            <p className="type-detail text-slate-500 mb-4">登記供應商聯繫方式、最小起訂門檻與交期合約。</p>

            <form onSubmit={handleAddSupplierSubmit} className="type-detail space-y-4">
              {formError && <p role="alert" className="type-body text-rose-700">{formError}</p>}
              <div>
                <label className="type-label block text-slate-700 mb-1">供應商公司名稱</label>
                <input
                  type="text"
                  required
                  placeholder="例：宏翔美業沙龍批發"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="type-detail w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="type-label block text-slate-700 mb-1">聯絡人</label>
                  <input
                    type="text"
                    required
                    placeholder="例：王經理"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="type-detail w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="type-label block text-slate-700 mb-1">聯絡電話</label>
                  <input
                    type="text"
                    required
                    placeholder="例：02-2345-6789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="type-detail w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="type-label block text-slate-700 mb-1">電子信箱</label>
                <input
                  type="email"
                  placeholder="orders@supplier.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="type-detail w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="type-label block text-slate-700 mb-1">起訂量 (MOQ)</label>
                  <input
                    type="number"
                    min="1"
                    value={moq}
                    onChange={(e) => setMoq(e.target.value)}
                    className="type-detail w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="type-label block text-slate-700 mb-1">交期 (天)</label>
                  <input
                    type="number"
                    min="1"
                    value={leadTime}
                    onChange={(e) => setLeadTime(e.target.value)}
                    className="type-detail w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="type-label block text-slate-700 mb-1">付款條件</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="type-detail w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="type-label block text-slate-700 mb-1">配送備註 / 運費門檻</label>
                <textarea
                  rows={2}
                  placeholder="例：滿 NT$ 12,000 免運，每週二統一下單出貨..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="type-detail w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="type-label px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="type-label px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg shadow-xs cursor-pointer"
                >
                  確認建立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
