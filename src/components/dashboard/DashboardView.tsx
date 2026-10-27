import React, { useState } from 'react';
import { formatCoverage, sortTransactions, formatNumber } from '../../utils/inventoryCalculations';
import { useApp } from '../../context/AppContext';
import { formatValidationErrors } from '../../utils/validation';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Clock, 
  Package, 
  ArrowRight, 
  ChevronRight, 
  ShieldAlert, 
  Percent, 
  DollarSign, 
  CheckCircle2, 
  Plus,
  RefreshCw,
  ShoppingBag,
  Info
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    currentUser, 
    inventorySummary, 
    products,
    brands,
    suppliers,
    insights, 
    transactions, 
    setActiveTab, 
    setSelectedProductId,
    setIsServiceUsageModalOpen,
    createPurchaseOrder
  } = useApp();
  const [error, setError] = useState('');

  // Find the top 3 brief items (Critical, Overstock, Promotion)
  const criticalInsight = insights.find(i => i.severity === 'Critical') || insights[0];
  const overstockInsight = insights.find(i => i.type === 'Overstock') || insights[1];
  const promoInsight = insights.find(i => i.type === 'Promotion') || insights[2];

  // Specific product for critical insight
  const criticalProduct = products.find(p => p.id === criticalInsight?.productId);
  const overstockProduct = products.find(p => p.id === overstockInsight?.productId);

  // Quick Action to generate PO from critical insight
  const handleQuickCreatePO = (e: React.MouseEvent, productId?: string) => {
    e.stopPropagation();
    if (!productId) {
      setError('請選擇存在的補貨商品。');
      return;
    }
    const targetProduct = products.find(p => p.id === productId);
    if (targetProduct) {
      const orderQty = Math.max(targetProduct.moq, Math.round(targetProduct.weeklyDemand * 3));
      const result = createPurchaseOrder({
        supplierId: targetProduct.supplierId,
        items: [{
          productId: targetProduct.id,
          quantity: orderQty,
          unitCost: targetProduct.unitCost
        }],
        expectedDeliveryDate: new Date(Date.now() + targetProduct.leadTime * 86400000).toISOString().split('T')[0],
        notes: `由示範摘要手動建立採購草稿；數量取 MOQ 與週需求乘 3 四捨五入的較大值。`,
        isAiAssisted: true,
        aiRationale: `庫存量僅剩 ${targetProduct.stock}，週需求 ${targetProduct.weeklyDemand}，供應商交期 ${targetProduct.leadTime} 天。`
      });
      if (result.ok === false) {
        setError(formatValidationErrors(result.errors));
        return;
      }
      setError('');
      setActiveTab('purchase');
    } else {
      setError('補貨商品不存在，請重新選擇商品。');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {error && <p role="alert" className="type-body text-rose-700">{error}</p>}
      {/* 1. Header Greeting & Tone */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-950/10">
        <div>
          <h1 className="type-page-title text-slate-900 tracking-tight">
            早安，{currentUser.name}
          </h1>
          <p className="type-detail text-slate-500 mt-1">
            庫存數值與帳本依目前示範資料更新；以下三則建議及促銷為固定情境，不代表門市連線或即時 AI 分析。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsServiceUsageModalOpen(true)}
            className="type-label px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>登記現場領料</span>
          </button>
          <button
            onClick={() => setActiveTab('purchase')}
            className="type-label px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>前往採購頁</span>
          </button>
        </div>
      </div>

      {/* 2. Dashboard Inventory Overview (整體庫存現況指標) */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="type-section-title text-slate-900">門市庫存健康度總覽</h2>
            <p className="type-detail text-slate-500">
              全店共管理 <span className="type-number text-slate-800 font-mono">{inventorySummary.totalSkus}</span> 項品項，分布於 <span className="type-number text-slate-800 font-mono">{brands.length}</span> 個品牌、<span className="type-number text-slate-800 font-mono">{suppliers.length}</span> 家常規供應商
            </p>
          </div>
          <div className="type-detail text-slate-600 font-mono">
            總庫存價值 (進價)：NT$ <strong className="text-slate-800 font-bold">{formatNumber(inventorySummary.totalInventoryCost)}</strong>
          </div>
        </div>

        {/* Status Breakdown Metric Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="type-detail font-medium text-slate-500 block mb-1">常備品項</span>
            <div className="type-stat text-slate-800 font-mono tabular-nums">
              {inventorySummary.totalSkus}
              <span className="type-detail font-normal text-slate-500 ml-1">SKUs</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <span className="type-detail font-semibold text-emerald-800 block mb-1">庫存健康</span>
            <div className="type-stat text-emerald-700 font-mono tabular-nums">
              {inventorySummary.healthyCount}
              <span className="type-detail font-normal text-emerald-700 ml-1">項</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
            <span className="type-detail font-semibold text-amber-800 block mb-1">低水位庫存</span>
            <div className="type-stat text-amber-700 font-mono tabular-nums">
              {inventorySummary.lowCount}
              <span className="type-detail font-normal text-amber-700 ml-1">項</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
            <span className="type-detail font-semibold text-rose-800 block mb-1">斷貨危機</span>
            <div className="type-stat text-rose-600 font-mono tabular-nums">
              {inventorySummary.criticalCount}
              <span className="type-detail font-normal text-rose-600 ml-1">項</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
            <span className="type-detail font-semibold text-purple-800 block mb-1">積壓過多</span>
            <div className="type-stat text-purple-700 font-mono tabular-nums">
              {inventorySummary.overstockCount}
              <span className="type-detail font-normal text-purple-700 ml-1">項</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
            <span className="type-detail font-semibold text-blue-800 block mb-1">在途訂單</span>
            <div className="type-stat text-blue-700 font-mono tabular-nums">
              {inventorySummary.incomingCount}
              <span className="type-detail font-normal text-blue-700 ml-1">瓶</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="type-detail font-medium text-slate-500 block mb-1">總庫存件數</span>
            <div className="type-stat text-slate-700 font-mono tabular-nums">
              {formatNumber(inventorySummary.totalStockUnits)}
              <span className="type-detail font-normal text-slate-500 ml-1">件</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Today's Business Brief (今日 3 大關鍵決策事件) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <h2 className="type-section-title text-slate-800 tracking-wider">營運建議情境示範</h2>
          </div>
          <span className="type-detail text-slate-600 font-mono">商品數值隨資料更新；診斷與效益文字固定</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 01 — Critical Stock Risk */}
          <div className="bg-white border-2 border-rose-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-rose-300 feedback-card">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="type-detail font-bold text-rose-700 tracking-wider">
                  01 — 斷貨危機 (CRITICAL STOCK RISK)
                </span>
                <span className="type-detail font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                  需立即決策
                </span>
              </div>

              <h3 className="type-item-title text-slate-900 mb-1">
                {criticalProduct?.name ?? '尚無對應商品'}
              </h3>
              <p className="type-detail text-slate-500 mb-4">
                <span>{criticalProduct?.brandName ?? '—'}</span>
                <span className="mx-1">·</span>
                <span className="font-mono">{criticalProduct?.sku ?? '—'}</span>
                <span className="mx-1">·</span>
                <span>{criticalProduct?.spec ?? '—'}</span>
              </p>

              {/* Data signals */}
              <div className="grid grid-cols-2 gap-2 type-detail bg-rose-50/50 p-3 rounded-xl border border-rose-100 mb-4 font-mono">
                <div>
                  <span className="text-slate-500 block type-detail">現有庫存</span>
                  <span className="font-bold text-rose-700 type-detail">
                    {criticalProduct?.stock ?? '—'} 瓶
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block type-detail">每週平均需求</span>
                  <span className="font-bold text-slate-800 type-detail">
                    {criticalProduct?.weeklyDemand ?? '—'} 瓶
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block type-detail">預估剩餘天數</span>
                  <span className="font-bold text-rose-600 type-detail">{criticalProduct ? formatCoverage(criticalProduct.stock, criticalProduct.weeklyDemand, '天', 7) : '無法估算'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block type-detail">供應商交期 / MOQ</span>
                  <span className="font-bold text-slate-800 type-detail">
                    {criticalProduct?.leadTime ?? '—'} 天 / {criticalProduct?.moq ?? '—'} 瓶
                  </span>
                </div>
              </div>

              <p className="type-detail text-slate-700 leading-relaxed mb-4">
                <strong>固定情境示意：</strong>
                依據近 4 週消耗速度，現有庫存無法支撐至供應商下次送達。下週店內做客人水療療程將面臨斷貨。
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                onClick={(e) => handleQuickCreatePO(e, criticalProduct?.id)}
                className="type-label w-full py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>建立採購草稿（{criticalProduct ? Math.max(criticalProduct.moq, Math.round(criticalProduct.weeklyDemand * 3)) : '—'} 瓶）</span>
                <ArrowRight size={14} />
              </button>
              <button
                disabled={!criticalProduct}
                onClick={() => {
                  if (!criticalProduct) return;
                  setSelectedProductId(criticalProduct.id);
                  setActiveTab('inventory');
                }}
                className="type-label w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                查看商品與異動帳本
              </button>
            </div>
          </div>

          {/* 02 — Overstock Risk */}
          <div className="bg-white border border-amber-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 feedback-card">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="type-detail font-bold text-amber-800 tracking-wider">
                  02 — 庫存積壓警示 (OVERSTOCK RISK)
                </span>
                <span className="type-detail font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                  資金呆滯
                </span>
              </div>

              <h3 className="type-item-title text-slate-900 mb-1">
                {overstockProduct?.name ?? '尚無對應商品'}
              </h3>
              <p className="type-detail text-slate-500 mb-4">
                <span>{overstockProduct?.brandName ?? '—'}</span>
                <span className="mx-1">·</span>
                <span className="font-mono">{overstockProduct?.sku ?? '—'}</span>
              </p>

              {/* Data signals */}
              <div className="grid grid-cols-2 gap-2 type-detail bg-amber-50/50 p-3 rounded-xl border border-amber-100 mb-4 font-mono">
                <div>
                  <span className="text-slate-500 block type-detail">現有庫存</span>
                  <span className="font-bold text-amber-900 type-detail">
                    {overstockProduct?.stock ?? '—'} 瓶
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block type-detail">平均月需求</span>
                  <span className="font-bold text-slate-800 type-detail">
                    {overstockProduct?.monthlyDemand ?? '—'} 瓶
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block type-detail">庫存覆蓋時間</span>
                  <span className="font-bold text-amber-800 type-detail">{overstockProduct ? formatCoverage(overstockProduct.stock, overstockProduct.monthlyDemand, '個月') : '無法估算'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block type-detail">卡死資金成本</span>
                  <span className="font-bold text-slate-800 type-detail">
                    NT$ {overstockProduct ? formatNumber(overstockProduct.stock * overstockProduct.unitCost) : '—'}
                  </span>
                </div>
              </div>

              <p className="type-detail text-slate-700 leading-relaxed mb-4">
                <strong>固定情境示意：</strong>
                週轉速度比沙龍基準線慢 3.5 倍。上季過度進貨造成約 3 萬元現金流沉澱，建議暫停續叫並設計促銷套裝。
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveTab('insights')}
                className="type-label w-full py-2 bg-slate-900 hover:bg-black text-white rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>查看 AI 建議示範</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className="type-label w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                檢視滯銷品分析報告
              </button>
            </div>
          </div>

          {/* 03 — Purchasing Opportunity */}
          <div className="bg-emerald-900/5 border border-emerald-900/20 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-700/40 feedback-card relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="type-detail font-bold text-emerald-800 tracking-wider">
                  03 — 採購商機 (PURCHASING OPPORTUNITY)
                </span>
                <span className="type-detail font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  固定促銷示例
                </span>
              </div>

              <h3 className="type-item-title text-slate-900 mb-1">
                沛森生化「艾瑪絲夏季促銷」現折 8%
              </h3>
              <p className="type-detail text-slate-500 mb-4">
                <span>供應商：沛森生化物流</span>
                <span className="mx-1">·</span>
                <span>滿 30 瓶即享批發折扣</span>
              </p>

              {/* Data signals */}
              <div className="grid grid-cols-2 gap-2 type-detail bg-white/80 p-3 rounded-xl border border-emerald-900/10 mb-4 font-mono">
                <div>
                  <span className="text-slate-500 block type-detail">示例截止日（非倒數）</span>
                  <span className="font-bold text-emerald-800 type-detail">10 月 15 日</span>
                </div>
                <div>
                  <span className="text-slate-500 block type-detail">進貨成本優惠</span>
                  <span className="font-bold text-emerald-800 type-detail">現折 8.0%</span>
                </div>
                <div>
                  <span className="text-slate-500 block type-detail">適用低水位品項</span>
                  <span className="font-bold text-slate-800 type-detail">ARM-001, 002</span>
                </div>
                <div>
                  <span className="text-slate-500 block type-detail">預估節省成本</span>
                  <span className="font-bold text-emerald-700 type-detail">約 NT$ 1,450</span>
                </div>
              </div>

              <p className="type-detail text-slate-700 leading-relaxed mb-4">
                <strong>固定效益示意（未驗證）：</strong>
                剛好主力淨化液 ARM-001 即將斷貨，合併 ARM-002 大容量洗髮精一次下單 40 瓶，既可補足庫存又能省下單次進貨價差。
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-emerald-900/10">
              <button
                onClick={() => setActiveTab('suppliers')}
                className="type-label w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>前往供應商促銷示例</span>
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className="type-label w-full py-1.5 bg-white hover:bg-emerald-50 text-slate-700 border border-emerald-900/15 rounded-lg transition-colors cursor-pointer"
              >
                查看 AI 採購建議示範
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Two Column Workspace: Critical Products Need Action & Recent Real Ledger Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Action Products */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="type-item-title text-slate-900">需立即排單補貨的商品 (CRITICAL LIST)</h3>
              <p className="type-detail text-slate-500">依目前庫存、補貨點與週需求的共用規則判定；覆蓋量為試算</p>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="type-label text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>查看全部庫存</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {products.filter(p => p.status === 'Critical').slice(0, 4).map(p => {
              const coverageWeeks = formatCoverage(p.stock, p.weeklyDemand, '週');
              return (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-lg transition-colors">
                  <div>
                    <div className="font-semibold type-detail text-slate-900">{p.name}</div>
                    <div className="type-detail text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>{p.brandName}</span>
                      <span>·</span>
                      <span className="font-mono">{p.sku}</span>
                      <span>·</span>
                      <span className="text-rose-600 font-bold">現有 {p.stock} 瓶</span>
                      <span>·</span>
                      <span>週需求 {p.weeklyDemand} 瓶</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="type-detail font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 font-medium">
                      {coverageWeeks}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setActiveTab('inventory');
                      }}
                      className="type-label px-2.5 py-1 bg-slate-900 hover:bg-black text-white rounded transition-colors cursor-pointer"
                    >
                      查看商品
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Ledger Movements (取代紙本日誌的實體帳本) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="type-item-title text-slate-900">最新出入庫異動帳本 (RECENT MOVEMENTS)</h3>
              <p className="type-detail text-slate-500">目前示範資料的異動紀錄，含初始歷史示例</p>
            </div>
            <button
              onClick={() => setIsServiceUsageModalOpen(true)}
              className="type-label text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>+ 登記領料</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 font-mono type-detail">
            {sortTransactions(transactions).slice(0, 5).map(tx => {
              const isPositive = tx.quantity > 0;
              return (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
                  <div className="min-w-0">
                    <div className="font-sans font-medium type-detail text-slate-900 break-words whitespace-normal">
                      {tx.productName}
                    </div>
                    <div className="type-detail text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{tx.timestamp.split(' ')[0]}</span>
                      <span>·</span>
                      <span className="text-slate-700 font-semibold">{tx.userName}</span>
                      <span>·</span>
                      <span className="text-slate-500">{tx.type}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-bold ${isPositive ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {isPositive ? `+${tx.quantity}` : tx.quantity}
                    </div>
                    <div className="type-detail text-slate-400">
                      餘 {tx.resultingStock}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
