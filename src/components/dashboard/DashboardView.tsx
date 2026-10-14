import React from 'react';
import { useApp } from '../../context/AppContext';
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
    insights, 
    transactions, 
    setActiveTab, 
    setSelectedProductId,
    setIsServiceUsageModalOpen,
    createPurchaseOrder
  } = useApp();

  // Find the top 3 brief items (Critical, Overstock, Promotion)
  const criticalInsight = insights.find(i => i.severity === 'Critical') || insights[0];
  const overstockInsight = insights.find(i => i.type === 'Overstock') || insights[1];
  const promoInsight = insights.find(i => i.type === 'Promotion') || insights[2];

  // Specific product for critical insight
  const criticalProduct = products.find(p => p.id === (criticalInsight?.productId || 'prod-1'));
  const overstockProduct = products.find(p => p.id === (overstockInsight?.productId || 'prod-7'));

  // Quick Action to generate PO from critical insight
  const handleQuickCreatePO = (e: React.MouseEvent, productId?: string) => {
    e.stopPropagation();
    if (!productId) {
      setActiveTab('purchase');
      return;
    }
    const targetProduct = products.find(p => p.id === productId);
    if (targetProduct) {
      const orderQty = Math.max(targetProduct.moq, Math.round(targetProduct.weeklyDemand * 3));
      createPurchaseOrder({
        supplierId: targetProduct.supplierId,
        items: [{
          productId: targetProduct.id,
          quantity: orderQty,
          unitCost: targetProduct.unitCost
        }],
        expectedDeliveryDate: new Date(Date.now() + targetProduct.leadTime * 86400000).toISOString().split('T')[0],
        notes: `由今日營運摘要緊急補貨建議自動生成`,
        isAiAssisted: true,
        aiRationale: `庫存量僅剩 ${targetProduct.stock}，週需求 ${targetProduct.weeklyDemand}，供應商交期 ${targetProduct.leadTime} 天。`
      });
      setActiveTab('purchase');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* 1. Header Greeting & Tone */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-950/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            早安，{currentUser.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            這是今天沙龍門市最需要您關注與決策的 3 個營運事項，所有數據均與現場動態即時同步。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsServiceUsageModalOpen(true)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>登記現場領料</span>
          </button>
          <button
            onClick={() => setActiveTab('purchase')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>建立採購單</span>
          </button>
        </div>
      </div>

      {/* 2. Today's Business Brief (今日 3 大關鍵決策事件) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <h2 className="text-sm font-bold text-slate-800 tracking-wider">今日營運決策摘要 (TODAY'S BUSINESS BRIEF)</h2>
          </div>
          <span className="text-xs text-slate-600 font-mono">系統即時演算診斷</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 01 — Critical Stock Risk */}
          <div className="bg-white border-2 border-rose-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-rose-700 tracking-wider">
                  01 — 斷貨危機 (CRITICAL STOCK RISK)
                </span>
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                  需立即決策
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1">
                {criticalProduct ? criticalProduct.name : '5α捷利爾頭皮淨化液 (日常款)'}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                <span>{criticalProduct?.brandName || 'AROMASE 艾瑪絲'}</span>
                <span className="mx-1">·</span>
                <span className="font-mono">{criticalProduct?.sku || 'ARM-001'}</span>
                <span className="mx-1">·</span>
                <span>{criticalProduct?.spec || '260ml'}</span>
              </p>

              {/* Data signals */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-rose-50/50 p-3 rounded-xl border border-rose-100 mb-4 font-mono">
                <div>
                  <span className="text-slate-500 block text-[11px]">現有庫存</span>
                  <span className="font-bold text-rose-700 text-sm">
                    {criticalProduct?.stock || 12} 瓶
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">每週平均需求</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {criticalProduct?.weeklyDemand || 11.2} 瓶
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">預估剩餘天數</span>
                  <span className="font-bold text-rose-600 text-sm">約 7.5 天</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">供應商交期 / MOQ</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {criticalProduct?.leadTime || 14} 天 / {criticalProduct?.moq || 20} 瓶
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed mb-4">
                <strong>現況診斷：</strong>
                依據近 4 週消耗速度，現有庫存無法支撐至供應商下次送達。下週店內做客人水療療程將面臨斷貨。
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                onClick={(e) => handleQuickCreatePO(e, criticalProduct?.id)}
                className="w-full py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>建立採購單 (建議訂購 30 瓶)</span>
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => {
                  setSelectedProductId(criticalProduct?.id || 'prod-1');
                  setActiveTab('inventory');
                }}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                查看商品與異動帳本
              </button>
            </div>
          </div>

          {/* 02 — Overstock Risk */}
          <div className="bg-white border border-amber-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-800 tracking-wider">
                  02 — 庫存積壓警示 (OVERSTOCK RISK)
                </span>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                  資金呆滯
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1">
                {overstockProduct ? overstockProduct.name : '控油抗屑精華露 (頭皮噴霧)'}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                <span>{overstockProduct?.brandName || 'AROMASE 艾瑪絲'}</span>
                <span className="mx-1">·</span>
                <span className="font-mono">{overstockProduct?.sku || 'ARM-007'}</span>
              </p>

              {/* Data signals */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-amber-50/50 p-3 rounded-xl border border-amber-100 mb-4 font-mono">
                <div>
                  <span className="text-slate-500 block text-[11px]">現有庫存</span>
                  <span className="font-bold text-amber-900 text-sm">
                    {overstockProduct?.stock || 84} 瓶
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">平均月需求</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {overstockProduct?.monthlyDemand || 13.5} 瓶
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">庫存覆蓋時間</span>
                  <span className="font-bold text-amber-800 text-sm">6.2 個月</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">卡死資金成本</span>
                  <span className="font-bold text-slate-800 text-sm">
                    NT$ {((overstockProduct?.stock || 84) * (overstockProduct?.unitCost || 380)).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed mb-4">
                <strong>現況診斷：</strong>
                週轉速度比沙龍基準線慢 3.5 倍。上季過度進貨造成約 3 萬元現金流沉澱，建議暫停續叫並設計促銷套裝。
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveTab('insights')}
                className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>檢視 AI 去化建議與促銷方案</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                檢視滯銷品分析報告
              </button>
            </div>
          </div>

          {/* 03 — Purchasing Opportunity */}
          <div className="bg-emerald-900/5 border border-emerald-900/20 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-700/40 transition-all relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-800 tracking-wider">
                  03 — 採購商機 (PURCHASING OPPORTUNITY)
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  倒數 5 天
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1">
                沛森生化「艾瑪絲夏季促銷」現折 8%
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                <span>供應商：沛森生化物流</span>
                <span className="mx-1">·</span>
                <span>滿 30 瓶即享批發折扣</span>
              </p>

              {/* Data signals */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-white/80 p-3 rounded-xl border border-emerald-900/10 mb-4 font-mono">
                <div>
                  <span className="text-slate-500 block text-[11px]">促銷截止日</span>
                  <span className="font-bold text-emerald-800 text-sm">10 月 15 日</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">進貨成本優惠</span>
                  <span className="font-bold text-emerald-800 text-sm">現折 8.0%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">適用低水位品項</span>
                  <span className="font-bold text-slate-800 text-sm">ARM-001, 002</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">預估節省成本</span>
                  <span className="font-bold text-emerald-700 text-sm">約 NT$ 1,450</span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed mb-4">
                <strong>商業效益：</strong>
                剛好主力淨化液 ARM-001 即將斷貨，合併 ARM-002 大容量洗髮精一次下單 40 瓶，既可補足庫存又能省下單次進貨價差。
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-emerald-900/10">
              <button
                onClick={() => setActiveTab('suppliers')}
                className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>檢視促銷並試算訂單</span>
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className="w-full py-1.5 bg-white hover:bg-emerald-50 text-slate-700 border border-emerald-900/15 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                查看 AI 採購效益試算
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Dashboard Inventory Overview (整體庫存現況指標) */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">門市庫存健康度總覽</h2>
            <p className="text-xs text-slate-500">
              全店共管理 <span className="font-semibold text-slate-800 font-mono">100</span> 項品項，分布於 <span className="font-semibold text-slate-800 font-mono">8</span> 個品牌、<span className="font-semibold text-slate-800 font-mono">5</span> 家常規供應商
            </p>
          </div>
          <div className="text-xs text-slate-600 font-mono">
            總庫存價值 (進價)：NT$ <strong className="text-slate-800 font-bold">{inventorySummary.totalInventoryCost.toLocaleString()}</strong>
          </div>
        </div>

        {/* Status Breakdown Metric Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">常備品項</span>
            <div className="text-xl font-black text-slate-800 font-mono tabular-nums">
              {inventorySummary.totalSkus}
              <span className="text-xs font-normal text-slate-500 ml-1">SKUs</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-800 block mb-1">庫存健康</span>
            <div className="text-xl font-black text-emerald-700 font-mono tabular-nums">
              {inventorySummary.healthyCount}
              <span className="text-xs font-normal text-emerald-700 ml-1">項</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
            <span className="text-[11px] font-semibold text-amber-800 block mb-1">低水位庫存</span>
            <div className="text-xl font-black text-amber-700 font-mono tabular-nums">
              {inventorySummary.lowCount}
              <span className="text-xs font-normal text-amber-700 ml-1">項</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
            <span className="text-[11px] font-semibold text-rose-800 block mb-1">斷貨危機</span>
            <div className="text-xl font-black text-rose-600 font-mono tabular-nums">
              {inventorySummary.criticalCount}
              <span className="text-xs font-normal text-rose-600 ml-1">項</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
            <span className="text-[11px] font-semibold text-purple-800 block mb-1">積壓過多</span>
            <div className="text-xl font-black text-purple-700 font-mono tabular-nums">
              {inventorySummary.overstockCount}
              <span className="text-xs font-normal text-purple-700 ml-1">項</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
            <span className="text-[11px] font-semibold text-blue-800 block mb-1">在途訂單</span>
            <div className="text-xl font-black text-blue-700 font-mono tabular-nums">
              {inventorySummary.incomingCount}
              <span className="text-xs font-normal text-blue-700 ml-1">瓶</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">總庫存件數</span>
            <div className="text-xl font-black text-slate-700 font-mono tabular-nums">
              {inventorySummary.totalStockUnits}
              <span className="text-xs font-normal text-slate-500 ml-1">件</span>
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
              <h3 className="text-sm font-bold text-slate-900">需立即排單補貨的商品 (CRITICAL LIST)</h3>
              <p className="text-xs text-slate-500">預計於供應商前置期內耗盡的品項</p>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs text-emerald-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>查看全部庫存</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {products.filter(p => p.status === 'Critical').slice(0, 4).map(p => {
              const coverageWeeks = (p.stock / (p.weeklyDemand || 1)).toFixed(1);
              return (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-lg transition-colors">
                  <div>
                    <div className="font-semibold text-xs text-slate-900">{p.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
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
                    <span className="text-[11px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 font-medium">
                      僅剩 {coverageWeeks} 週
                    </span>
                    <button
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setActiveTab('inventory');
                      }}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white text-[11px] font-medium rounded transition-colors cursor-pointer"
                    >
                      補貨
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
              <h3 className="text-sm font-bold text-slate-900">最新出入庫異動帳本 (RECENT MOVEMENTS)</h3>
              <p className="text-xs text-slate-500">門市即時登記紀錄，解決紙本零散記帳</p>
            </div>
            <button
              onClick={() => setIsServiceUsageModalOpen(true)}
              className="text-xs text-emerald-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>+ 登記領料</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 font-mono text-xs">
            {transactions.slice(0, 5).map(tx => {
              const isPositive = tx.quantity > 0;
              return (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
                  <div className="min-w-0">
                    <div className="font-sans font-medium text-xs text-slate-900 truncate">
                      {tx.productName}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
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
                    <div className="text-[10px] text-slate-400">
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
