import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { 
  Search, 
  Plus, 
  Tag, 
  Package, 
  SlidersHorizontal, 
  ChevronRight, 
  Filter,
  CheckCircle2,
  AlertTriangle,
  Boxes
} from 'lucide-react';
import { ProductDetailModal } from './ProductDetailModal';
import { NewProductModal } from '../modals/NewProductModal';

export const ProductsView: React.FC = () => {
  const { products, brands, setSelectedProductId, selectedProductId } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  const categories = [
    'ALL',
    '洗髮淨化',
    '頭皮理療',
    '深層護髮',
    '造型養護',
    '沙龍專業安瓶',
    '居家養護組'
  ];

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brandName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesBrand = selectedBrand === 'ALL' || p.brandId === selectedBrand;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-950/10">
        <div>
          <h1 className="type-page-title text-slate-900 tracking-tight">商品品項檔案庫 ({products.length} SKUs)</h1>
          <p className="type-detail text-slate-500 mt-1">
            維護全店商品基本檔、進貨價、門市售價、包裝規格、安全補貨點與對應供應商。
          </p>
        </div>
        <button
          onClick={() => setIsAddProductModalOpen(true)}
          className="type-label px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>新增商品品項</span>
        </button>
      </div>

      {/* 2. Search & Category Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-2.5 text-slate-400" size={17} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋品名、SKU 代碼、品牌..."
              className="type-detail w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="type-detail text-slate-400 whitespace-nowrap">品牌：</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="type-detail bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              <option value="ALL">全部 8 個品牌</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 pt-2 border-t border-slate-100 overflow-x-auto type-detail">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`type-label px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
 selectedCategory === cat
 ? 'bg-emerald-800 text-white shadow-xs'
 : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
 }`}
            >
              {cat === 'ALL' ? '全部品類' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Product Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(p => {

          return (
            <div
              key={p.id}
              onClick={() => setSelectedProductId(p.id)}
              className="bg-white border border-slate-200 rounded-2xl p-4.5 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="type-detail text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    {p.brandName}
                  </div>
                  <span className="type-detail font-mono text-slate-400">{p.sku}</span>
                </div>

                <h3 className="type-item-title text-slate-900 group-hover:text-emerald-900 transition-colors break-words whitespace-normal mb-1">
                  {p.name}
                </h3>

                <div className="type-detail text-slate-500 flex items-center gap-2 mb-3">
                  <span>規格：{p.spec}</span>
                  <span>·</span>
                  <span>{p.category}</span>
                </div>

                {/* Price and Stock Stats */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl type-detail font-mono mb-3">
                  <div>
                    <span className="type-detail text-slate-400 block font-sans">進價</span>
                    <span className="font-bold text-slate-800">${p.unitCost}</span>
                  </div>
                  <div>
                    <span className="type-detail text-slate-400 block font-sans">售價</span>
                    <span className="font-bold text-slate-800">${p.sellingPrice}</span>
                  </div>
                  <div>
                    <span className="type-detail text-slate-400 block font-sans">現有庫存</span>
                    <span className={`font-bold ${
                      p.status === 'Critical' ? 'text-rose-600' : p.status === 'Low' ? 'text-amber-600' : 'text-slate-800'
                    }`}>
                      {p.stock}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between type-detail">
                <span className="text-slate-500 type-detail break-words whitespace-normal max-w-[170px]">
                  供應商：{p.supplierName}
                </span>
                <span className="text-emerald-800 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>詳情帳本</span>
                  <ChevronRight size={14} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProductId(null)}
        />
      )}

      {isAddProductModalOpen && (
        <NewProductModal
          onClose={() => setIsAddProductModalOpen(false)}
        />
      )}
    </div>
  );
};
