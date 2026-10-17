import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, InventoryStatus } from '../../types';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  AlertTriangle, 
  ChevronRight, 
  Plus, 
  Sparkles, 
  FileSpreadsheet,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';
import { coverage, formatCoverage } from '../../utils/inventoryCalculations';
import { ProductDetailModal } from '../products/ProductDetailModal';

export const InventoryView: React.FC = () => {
  const { 
    products, 
    brands, 
    suppliers, 
    selectedProductId, 
    setSelectedProductId, 
    setIsServiceUsageModalOpen,
    setActiveTab,
    createPurchaseOrder
  } = useApp();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<'stock' | 'coverage' | 'demand' | 'cost'>('stock');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brandName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesBrand = selectedBrand === 'ALL' || p.brandId === selectedBrand;
      const matchesSupplier = selectedSupplier === 'ALL' || p.supplierId === selectedSupplier;
      const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

      return matchesSearch && matchesBrand && matchesSupplier && matchesStatus && matchesCategory;
    }).sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortBy === 'stock') {
        valA = a.stock;
        valB = b.stock;
      } else if (sortBy === 'coverage') {
        const aCoverage = coverage(a.stock, a.weeklyDemand);
        const bCoverage = coverage(b.stock, b.weeklyDemand);
        if (aCoverage === null || bCoverage === null) return aCoverage === bCoverage ? 0 : aCoverage === null ? 1 : -1;
        valA = aCoverage;
        valB = bCoverage;
      } else if (sortBy === 'demand') {
        valA = a.weeklyDemand;
        valB = b.weeklyDemand;
      } else if (sortBy === 'cost') {
        valA = a.unitCost;
        valB = b.unitCost;
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [products, searchTerm, selectedBrand, selectedSupplier, selectedStatus, selectedCategory, sortBy, sortOrder]);

  const statusLabel = (status: InventoryStatus) => {
    switch (status) {
      case 'Critical':
        return <span className="text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded text-[11px] font-semibold">斷貨危機</span>;
      case 'Low':
        return <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold">偏低水位</span>;
      case 'Overstock':
        return <span className="text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-semibold">積壓過多</span>;
      case 'Healthy':
      default:
        return <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium">健康水位</span>;
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-950/10">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">門市即時庫存動態表</h1>
          <p className="text-xs text-slate-500 mt-1">
            依目前示範資料顯示全店 {products.length} 項產品；庫存異動後即更新，覆蓋天數依庫存與需求參數試算。
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            onClick={() => setIsServiceUsageModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>登記現場領料</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar (Search, Brand, Supplier, Status, Category) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(16rem,1fr)_auto]">
          {/* Search box */}
          <div className="min-w-0 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              aria-label="搜尋商品名稱、SKU或品牌"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋商品名稱、SKU 代碼、品牌..."
              className="w-full pl-10 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-1 inset-y-0 px-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                清除
              </button>
            )}
          </div>

          {/* Quick Status Filter Tabs: whole-store counts, independent of filters */}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-500">全店狀態數：</span>
          <div className="flex min-w-0 flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            {[
              { id: 'ALL', label: '全部' },
              { id: 'Critical', label: '斷貨危機', count: products.filter(p => p.status === 'Critical').length, color: 'text-rose-600' },
              { id: 'Low', label: '偏低水位', count: products.filter(p => p.status === 'Low').length, color: 'text-amber-600' },
              { id: 'Overstock', label: '積壓過多', count: products.filter(p => p.status === 'Overstock').length, color: 'text-purple-600' },
              { id: 'Healthy', label: '健康', count: products.filter(p => p.status === 'Healthy').length, color: 'text-emerald-700' }
            ].map(tab => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedStatus === tab.id
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`ml-1 text-[11px] font-mono ${tab.color || 'text-slate-500'}`}>
                    ({tab.count})
                  </span>
                )}
              </button>
            ))}
          </div>
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 gap-3 pt-2 border-t border-slate-100 text-xs sm:grid-cols-2 2xl:grid-cols-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-slate-400">品牌：</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="min-w-0 flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              <option value="ALL">全部 {brands.length} 個品牌</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <span className="text-slate-400">供應商：</span>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="min-w-0 flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              <option value="ALL">全部 {suppliers.length} 家供應商</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <span className="text-slate-400">品類：</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="min-w-0 flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              <option value="ALL">全部品類</option>
              <option value="洗髮淨化">洗髮淨化</option>
              <option value="頭皮理療">頭皮理療</option>
              <option value="深層護髮">深層護髮</option>
              <option value="造型養護">造型養護</option>
              <option value="沙龍專業安瓶">沙龍專業安瓶</option>
              <option value="居家養護組">居家養護組</option>
            </select>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <span className="text-slate-400">排序：</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as any);
                setSortOrder(so as any);
              }}
              className="min-w-0 flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono"
            >
              <option value="stock-asc">現有庫存：低到高 (優先關注)</option>
              <option value="stock-desc">現有庫存：高到低</option>
              <option value="coverage-asc">安全週數：由低到高</option>
              <option value="demand-desc">每週需求：高到低 (熱賣款)</option>
              <option value="cost-desc">進貨成本：由高到低</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main High-Density Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div tabIndex={0} role="region" aria-label="庫存清單，可左右捲動查看所有欄位" className="table-scroll">
          <table className="inventory-table w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">商品名稱 / SKU</th>
                <th className="py-3 px-4">品牌 / 品類</th>
                <th className="py-3 px-4 text-center">現有庫存</th>
                <th className="py-3 px-4 text-center">安全補貨點</th>
                <th className="py-3 px-4">狀態診斷</th>
                <th className="py-3 px-4 text-center">週需求</th>
                <th className="py-3 px-4 text-center">安全週數 (Coverage)</th>
                <th className="py-3 px-4">供應商 / 交期</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    查無符合條件的商品，請調整關鍵字或篩選設定。
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const coverageWeeks = formatCoverage(p.stock, p.weeklyDemand, '週');
                  const isStockoutRisk = p.status === 'Critical';

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Product Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{p.sku}</span>
                          <span>·</span>
                          <span>{p.spec}</span>
                          <span>·</span>
                          <span>成本 NT$ {p.unitCost}</span>
                        </div>
                      </td>

                      {/* Brand & Category */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{p.brandName}</div>
                        <div className="text-[11px] text-slate-600">{p.category}</div>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-mono font-bold text-sm ${
                          isStockoutRisk ? 'text-rose-600' : p.status === 'Low' ? 'text-amber-600' : 'text-slate-800'
                        }`}>
                          {p.stock}
                        </span>
                        {p.incomingQty && p.incomingQty > 0 ? (
                          <div className="text-[10px] text-blue-600 font-mono">
                            +{p.incomingQty}在途
                          </div>
                        ) : null}
                      </td>

                      {/* Reorder Point */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                        {p.reorderPoint}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {statusLabel(p.status)}
                      </td>

                      {/* Weekly Demand */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                        {p.weeklyDemand}
                      </td>

                      {/* Coverage (Weeks) */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className={`font-medium ${
                          p.status === 'Critical' ? 'text-rose-600 font-bold' :
                          p.status === 'Low' ? 'text-amber-700 font-bold' :
                          p.status === 'Overstock' ? 'text-purple-600 font-bold' : 'text-slate-700'
                        }`}>
                          {coverageWeeks}
                        </span>
                      </td>

                      {/* Supplier & Lead time */}
                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        <div className="text-slate-800 font-medium">{p.supplierName}</div>
                        <div className="text-slate-600">交期 {p.leadTime} 天 · MOQ {p.moq}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProductId(p.id);
                          }}
                          className="px-2.5 py-1 text-slate-600 hover:text-emerald-900 hover:bg-emerald-50 rounded text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>帳本詳情</span>
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer count */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            共顯示 <strong className="text-slate-800 font-mono">{filteredProducts.length}</strong> 項商品 (總品項 {products.length})
          </span>
          <span className="text-[11px] text-slate-600">
            點擊任一列即可開啟「出入庫帳本」與「庫存規則與需求試算」
          </span>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </div>
  );
};
