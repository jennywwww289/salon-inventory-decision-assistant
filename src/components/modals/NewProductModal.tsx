import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Plus, Package } from 'lucide-react';
import { Product } from '../../types';

interface Props {
  onClose: () => void;
}

export const NewProductModal: React.FC<Props> = ({ onClose }) => {
  const { brands, suppliers, addProduct } = useApp();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [spec, setSpec] = useState('250ml');
  const [brandId, setBrandId] = useState(brands[0]?.id || '');
  const [category, setCategory] = useState<Product['category']>('洗髮淨化');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [unitCost, setUnitCost] = useState<number>(300);
  const [sellingPrice, setSellingPrice] = useState<number>(650);
  const [stock, setStock] = useState<number>(20);
  const [reorderPoint, setReorderPoint] = useState<number>(15);
  const [moq, setMoq] = useState<number>(10);
  const [leadTime, setLeadTime] = useState<number>(10);
  const [weeklyDemand, setWeeklyDemand] = useState<number>(4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) return;

    const brand = brands.find(b => b.id === brandId);
    const supplier = suppliers.find(s => s.id === supplierId);

    addProduct({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      spec,
      brandId,
      brandName: brand ? brand.name : '自選品牌',
      category,
      unitCost,
      sellingPrice,
      stock,
      reorderPoint,
      moq,
      leadTime,
      supplierId,
      supplierName: supplier ? supplier.name : '常規供應商',
      weeklyDemand,
      monthlyDemand: Math.round(weeklyDemand * 4.3),
      status: stock <= reorderPoint ? (stock < reorderPoint / 2 ? 'Critical' : 'Low') : 'Healthy'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold">
              <Package size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">建立新商品品項 (New SKU)</h2>
              <p className="text-xs text-slate-500">登記沙龍專業使用或零售之全新商品基本資料。</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">商品名稱</label>
              <input
                type="text"
                required
                placeholder="例：植萃草本控油調理精華"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">SKU 編號</label>
              <input
                type="text"
                required
                placeholder="例：HERB-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">容量規格</label>
              <input
                type="text"
                placeholder="例：250ml / 1000ml"
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">品牌</label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
              >
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">品類</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
              >
                <option value="洗髮淨化">洗髮淨化</option>
                <option value="頭皮理療">頭皮理療</option>
                <option value="深層護髮">深層護髮</option>
                <option value="造型養護">造型養護</option>
                <option value="沙龍專業安瓶">沙龍專業安瓶</option>
                <option value="居家養護組">居家養護組</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">對應供應商</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">初始在手庫存 (瓶)</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">進貨成本 (NT$)</label>
              <input
                type="number"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">門市售價 (NT$)</label>
              <input
                type="number"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">安全補貨點</label>
              <input
                type="number"
                min="1"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">起訂量 (MOQ)</label>
              <input
                type="number"
                min="1"
                value={moq}
                onChange={(e) => setMoq(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">預估每週需求</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={weeklyDemand}
                onChange={(e) => setWeeklyDemand(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
              建立商品
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
