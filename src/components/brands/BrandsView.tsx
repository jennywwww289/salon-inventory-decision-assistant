import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Brand } from '../../types';
import { 
  Tag, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Boxes,
  Layers,
  ArrowRight
} from 'lucide-react';

export const BrandsView: React.FC = () => {
  const { brands, products, addBrand, updateBrand, setActiveTab } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandOrigin, setNewBrandOrigin] = useState('台灣');
  const [newBrandCategory, setNewBrandCategory] = useState('專業沙龍髮品');
  const [newBrandDesc, setNewBrandDesc] = useState('');

  // Calculate brand performance metrics from products
  const brandStats = brands.map(b => {
    const brandProducts = products.filter(p => p.brandId === b.id);
    const skuCount = brandProducts.length;
    const totalInventoryValue = brandProducts.reduce((sum, p) => sum + (p.stock * p.unitCost), 0);
    const totalWeeklySalesValue = brandProducts.reduce((sum, p) => sum + (p.weeklyDemand * p.sellingPrice), 0);
    const estimatedMonthlyRevenue = totalWeeklySalesValue * 4.3;
    const criticalCount = brandProducts.filter(p => p.status === 'Critical').length;
    const lowCount = brandProducts.filter(p => p.status === 'Low').length;
    const overstockCount = brandProducts.filter(p => p.status === 'Overstock').length;

    // Simulated sales trend based on brand characteristics
    const trendMap: Record<string, number> = {
      'b-1': 0.18,  // 艾瑪絲 +18%
      'b-2': 0.08,  // 覺亞 +8%
      'b-3': 0.05,  // 歐萊德 +5%
      'b-4': 0.12,  // 巴黎卡詩 +12%
      'b-5': -0.04, // 哥德式 -4%
      'b-6': -0.07, // 萊法耶 -7%
      'b-7': 0.02,  // 肯邦 +2%
      'b-8': -0.03  // 娜普菈 -3%
    };
    const trend = trendMap[b.id] ?? 0.04;

    // Annual turnover approximation = (Annual Cost of Goods Sold) / Average Inventory Value
    const annualCogs = (brandProducts.reduce((sum, p) => sum + (p.weeklyDemand * p.unitCost), 0)) * 52;
    const turnoverRate = totalInventoryValue > 0 ? (annualCogs / totalInventoryValue).toFixed(1) : '0.0';

    return {
      brand: b,
      skuCount,
      totalInventoryValue,
      estimatedMonthlyRevenue,
      trend,
      turnoverRate,
      criticalCount,
      lowCount,
      overstockCount
    };
  });

  const handleAddBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    addBrand({
      name: newBrandName.trim(),
      origin: newBrandOrigin,
      category: newBrandCategory,
      status: 'Active',
      description: newBrandDesc
    });

    setNewBrandName('');
    setNewBrandDesc('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-950/10">
        <div>
          <h1 className="type-page-title text-slate-900 tracking-tight">品牌營運績效與比較</h1>
          <p className="type-detail text-slate-500 mt-1">
            SKU、庫存成本與狀態依目前示範資料更新；成長率為固定示意，月需求金額與週轉為公式試算，非實際營收。
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="type-label px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>新增合作品牌</span>
        </button>
      </div>

      {/* 2. Brand Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {brandStats.map(stat => {
          const isTrendPositive = stat.trend >= 0;
          return (
            <div
              key={stat.brand.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="type-detail font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {stat.brand.origin} · {stat.skuCount} SKUs
                  </span>
                  <div className={`type-number flex items-center font-mono ${
 isTrendPositive ? 'text-emerald-700' : 'text-rose-600'
 }`}>
                    {isTrendPositive ? <TrendingUp size={14} className="mr-0.5" /> : <TrendingDown size={14} className="mr-0.5" />}
                    <span>成長示意 {isTrendPositive ? '+' : ''}{Math.round(stat.trend * 100)}%</span>
                  </div>
                </div>

                <h3 className="type-item-title text-slate-900 mb-1">{stat.brand.name}</h3>
                <p className="type-detail text-slate-600 break-words whitespace-normal mb-4">{stat.brand.description}</p>

                {/* Metrics Breakdown */}
                <div className="space-y-2 bg-slate-50/80 p-3 rounded-xl type-detail font-mono mb-4 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-sans">月需求金額試算：</span>
                    <span className="font-bold text-slate-900">
                      NT$ {Math.round(stat.estimatedMonthlyRevenue).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-sans">庫存成本金額：</span>
                    <span className="font-bold text-slate-800">
                      NT$ {stat.totalInventoryValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-sans">年週轉試算：</span>
                    <span className="font-bold text-emerald-800">
                      {stat.turnoverRate} 次/年
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Risk Indicators */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between type-detail">
                <div className="flex items-center gap-1.5 font-mono type-detail">
                  {stat.criticalCount > 0 ? (
                    <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold">
                      {stat.criticalCount} 斷貨
                    </span>
                  ) : null}
                  {stat.overstockCount > 0 ? (
                    <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-bold">
                      {stat.overstockCount} 積壓
                    </span>
                  ) : null}
                  {stat.criticalCount === 0 && stat.overstockCount === 0 ? (
                    <span className="text-emerald-700 font-sans type-detail">
                      庫存健康
                    </span>
                  ) : null}
                </div>

                <button
                  onClick={() => setActiveTab('inventory')}
                  className="type-label text-emerald-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>看品項</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Comparative Evaluation Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="type-section-title text-slate-900">品牌資料與試算對照</h2>
          <p className="type-detail text-slate-500">月需求金額＝Σ（週需求×售價）×4.3；年週轉＝Σ（週需求×成本）×52÷目前庫存成本（分母為 0 時顯示 0.0）。成長率是固定示例。</p>
        </div>

        <div tabIndex={0} role="region" aria-label="品牌資料表，可左右捲動" className="table-scroll">
          <table className="type-detail w-full text-left font-mono">
            <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 type-detail">
              <tr>
                <th className="type-label py-3 px-4 font-sans">品牌名稱</th>
                <th className="type-label py-3 px-4 text-center">SKU 數</th>
                <th className="type-label py-3 px-4 text-right">庫存成本金額</th>
                <th className="type-label py-3 px-4 text-right">月需求金額試算</th>
                <th className="type-label py-3 px-4 text-center">成長率示意（固定）</th>
                <th className="type-label py-3 px-4 text-center">年週轉試算</th>
                <th className="type-label py-3 px-4 text-center">斷貨品項</th>
                <th className="type-label py-3 px-4 text-center">積壓品項</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {brandStats.map(stat => (
                <tr key={stat.brand.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {stat.brand.name}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">{stat.skuCount}</td>
                  <td className="type-number py-3 px-4 text-right font-mono text-slate-800">
                    NT$ {stat.totalInventoryValue.toLocaleString()}
                  </td>
                  <td className="type-number py-3 px-4 text-right font-mono text-emerald-800">
                    NT$ {Math.round(stat.estimatedMonthlyRevenue).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    <span className={stat.trend >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                      {stat.trend >= 0 ? '+' : ''}{Math.round(stat.trend * 100)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-800">
                    {stat.turnoverRate} 次
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    <span className={stat.criticalCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                      {stat.criticalCount}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    <span className={stat.overstockCount > 0 ? 'text-purple-600 font-bold' : 'text-slate-400'}>
                      {stat.overstockCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Brand Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="modal-panel bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="type-section-title text-slate-900 mb-1">新增合作品牌</h2>
            <p className="type-detail text-slate-500 mb-4">建立新的進貨品牌檔案，建立後即可關聯商品與供應商。</p>

            <form onSubmit={handleAddBrandSubmit} className="type-detail space-y-4">
              <div>
                <label className="type-label block text-slate-700 mb-1">品牌名稱</label>
                <input
                  type="text"
                  required
                  placeholder="例：AVEDA 肯夢"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="type-detail w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-700 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="type-label block text-slate-700 mb-1">產地 / 來源國</label>
                  <input
                    type="text"
                    value={newBrandOrigin}
                    onChange={(e) => setNewBrandOrigin(e.target.value)}
                    className="type-detail w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="type-label block text-slate-700 mb-1">主要品類</label>
                  <input
                    type="text"
                    value={newBrandCategory}
                    onChange={(e) => setNewBrandCategory(e.target.value)}
                    className="type-detail w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="type-label block text-slate-700 mb-1">品牌簡介 / 定位</label>
                <textarea
                  rows={2}
                  placeholder="例：純淨植萃草本精油養護..."
                  value={newBrandDesc}
                  onChange={(e) => setNewBrandDesc(e.target.value)}
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
                  建立品牌
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
