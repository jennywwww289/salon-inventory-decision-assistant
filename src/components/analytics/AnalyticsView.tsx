import React, { useState } from 'react';
import { formatNumber } from '../../utils/inventoryCalculations';
import { useApp } from '../../context/AppContext';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  HelpCircle, 
  ArrowRight, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles,
  PieChart,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { products, brands, inventorySummary, purchaseOrders, movementSummary, setActiveTab } = useApp();
  const [activeTabSection, setActiveTabSection] = useState<'fourQuestions' | 'quarterly' | 'annual'>('fourQuestions');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-950/10">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">商業決策分析與展望</h1>
          <p className="text-xs text-slate-500 mt-1">
            庫存、採購及帳本彙總依目前示範資料計算；品牌成長、原因、預測與效益是固定情境示意，不隨庫存重算。
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTabSection('fourQuestions')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTabSection === 'fourQuestions' ? 'bg-emerald-800 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            四大核心問題
          </button>
          <button
            onClick={() => setActiveTabSection('quarterly')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTabSection === 'quarterly' ? 'bg-emerald-800 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            90 天展望示意
          </button>
          <button
            onClick={() => setActiveTabSection('annual')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTabSection === 'annual' ? 'bg-emerald-800 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            年度情境示意
          </button>
        </div>
      </div>

      {/* SECTION 1: THE FOUR CORE QUESTIONS */}
      {activeTabSection === 'fourQuestions' && (
        <div className="space-y-6">
          {/* Question 1: What Happened? */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">1</span>
                <h2 className="text-base font-bold text-slate-900">發生了什麼事？ (WHAT HAPPENED?)</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">庫存／採購彙總：目前全部已載入資料</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="font-bold text-slate-800 block">品牌成長示意（固定百分比）</span>
                <p className="text-slate-600 leading-relaxed">
                  <strong className="text-emerald-700">AROMASE 艾瑪絲</strong> 成長 +18%，
                  <strong className="text-emerald-700">卡詩</strong> 成長 +12%；
                  但 <strong className="text-rose-600">萊法耶</strong> 下滑 -7%，
                  <strong className="text-rose-600">哥德式</strong> 下滑 -4%。
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="font-bold text-slate-800 block">庫存動態與週轉</span>
                <p className="text-slate-600 leading-relaxed">
                  全店 {inventorySummary.totalSkus} SKUs 庫存成本金額為 <strong className="font-mono text-slate-900">NT$ {formatNumber(inventorySummary.totalInventoryCost)}</strong>。
                  其中有 {inventorySummary.criticalCount} 項為危急、{inventorySummary.lowCount} 項為低水位、{inventorySummary.overstockCount} 項為積壓狀態。
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="font-bold text-slate-800 block">採購履約現況</span>
                <p className="text-slate-600 leading-relaxed">
                  全部單據：已驗收 {purchaseOrders.filter(po => po.status === 'Received').length} 筆、
                  下單中 {purchaseOrders.filter(po => po.status === 'Ordered').length} 筆、
                  草稿 {purchaseOrders.filter(po => po.status === 'Draft').length} 筆。
                  帳本已記錄採購入庫 {formatNumber(movementSummary.purchaseIn)} 瓶；
                  顧客退回 {formatNumber(movementSummary.customerReturnIn)} 瓶、退回供應商 {formatNumber(movementSummary.supplierReturnOut)} 瓶。
                </p>
              </div>
            </div>
          </div>

          {/* Question 2: Why Did It Happen? */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">2</span>
                <h2 className="text-base font-bold text-slate-900">為什麼會發生？ (WHY DID IT HAPPEN?)</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">固定原因示例，未分析實際歷史資料</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-start gap-3">
                <span className="text-emerald-700 font-bold mt-0.5">●</span>
                <div>
                  <strong className="text-slate-900 block mb-0.5">艾瑪絲銷售成長 18% 之可能原因：</strong>
                  <p className="text-slate-600 leading-relaxed">
                    示例情境假設：門市推出的「秋季換季頭皮舒壓淨化療程」廣泛採用 ARM-001 (5α捷利爾淨化液) 作為開端，帶動單品耗用量增加 65%，並拉抬居家款零售；此為預設敘述，非歷史分析結果。
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100 flex items-start gap-3">
                <span className="text-amber-700 font-bold mt-0.5">●</span>
                <div>
                  <strong className="text-slate-900 block mb-0.5">控油抗屑精華露 (ARM-007) 積壓 84 瓶之可能原因：</strong>
                  <p className="text-slate-600 leading-relaxed">
                    夏季進貨時預估過於樂觀，單次進貨 90 瓶；但 9 月入秋後，客人諮詢控油噴霧比例下降 40%，轉向滋養保濕類，導致該單品消耗速度陡降至每週僅 3.2 瓶。
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-100 flex items-start gap-3">
                <span className="text-rose-600 font-bold mt-0.5">●</span>
                <div>
                  <strong className="text-slate-900 block mb-0.5">卡詩小粉瓶 (KER-005) 瀕臨斷貨之可能原因：</strong>
                  <p className="text-slate-600 leading-relaxed">
                    供應商歐法貿易前置交期為 10 天，而店內先前並未在跌破補貨點 (18 瓶) 的第一時間發出採購單，錯過了定期進口併單時機。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Question 3: What Might Happen Next? */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">3</span>
                <h2 className="text-base font-bold text-slate-900">接下來可能發生什麼？ (WHAT MIGHT HAPPEN NEXT?)</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">固定風險與效益示意，無預測模型或準確率驗證</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-rose-700 block">短期風險預估 (未來 14 天)</span>
                <ul className="space-y-1.5 text-slate-600 list-disc list-inside leading-relaxed">
                  <li>ARM-001 (捷利爾淨化液) 預計將於 7.5 天內用盡，造成沙龍預約客人無主力材料可用。</li>
                  <li>MLB-001 (絲柔精華乳) 若未於週三前補單，下週五吹整造型品庫存將觸底歸零。</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-purple-700 block">中期資金卡死預估 (未來 30-60 天)</span>
                <ul className="space-y-1.5 text-slate-600 list-disc list-inside leading-relaxed">
                  <li>全店約 NT$ 11.8 萬資金仍沉澱於 7 項積壓商品，平均需 5.2 個月才能完全消化。</li>
                  <li>若未進行套餐搭贈或即期促銷，將持續壓迫第 4 季新系列產品之進貨現金流。</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Question 4: What Can I Do? */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">4</span>
                <h2 className="text-base font-bold text-slate-900">我能採取什麼行動？ (WHAT CAN I DO?)</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">固定方案示例；以下按鈕僅前往對應頁面</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-emerald-950 block mb-1">行動方案 A：合併促銷立即叫貨</span>
                  <p className="text-slate-600 leading-relaxed mb-3">
                    把握沛森促銷剩餘 5 天，合併 ARM-001 (30瓶) 與 ARM-002 (10瓶) 下單，立折 8% 並解決斷貨。
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('purchase')}
                  className="w-full py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>前往採購頁</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-purple-950 block mb-1">行動方案 B：推出套餐加速去化</span>
                  <p className="text-slate-600 leading-relaxed mb-3">
                    將積壓的「控油精華露」與「黑耀光精華」搭配為療程升級好禮，預估可在 45 天內釋放 NT$ 4.2 萬現金。
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('insights')}
                  className="w-full py-1.5 bg-purple-900 hover:bg-purple-950 text-white rounded-lg font-semibold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>查看 AI 建議示範</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-900 block mb-1">行動方案 C：校正安全補貨點</span>
                  <p className="text-slate-600 leading-relaxed mb-3">
                    針對銷量已放緩之 12 個品項，將補貨點調降 20%，降低下次自動提醒進貨門檻以保留現金。
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>查看庫存與補貨點</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: QUARTERLY BUSINESS OUTLOOK (90 DAYS) */}
      {activeTabSection === 'quarterly' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">未來 90 天展望示意（固定內容）</h2>
            <p className="text-xs text-slate-500">
              以下品項數、成長區間與情境均為固定示例，未依庫存或歷史資料計算，也不代表已驗證的預測。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <span className="font-sans font-bold text-emerald-950 block mb-1">需求增長預期</span>
              <div className="text-2xl font-black text-emerald-800">14 <span className="text-xs font-normal">品項</span></div>
              <p className="font-sans text-[11px] text-slate-600 mt-2">
                頭皮乾癢保濕安瓶、胜肽修護與精油養髮系列需求預期成長 15%~25%。
              </p>
            </div>

            <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200">
              <span className="font-sans font-bold text-rose-950 block mb-1">斷貨潛在風險</span>
              <div className="text-2xl font-black text-rose-600">4 <span className="text-xs font-normal">品項</span></div>
              <p className="font-sans text-[11px] text-slate-600 mt-2">
                若維持目前訂貨頻率，預期在第 30-45 天再次面臨供應商斷貨空窗。
              </p>
            </div>

            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200">
              <span className="font-sans font-bold text-purple-950 block mb-1">長效積壓存貨</span>
              <div className="text-2xl font-black text-purple-700">7 <span className="text-xs font-normal">品項</span></div>
              <p className="font-sans text-[11px] text-slate-600 mt-2">
                需在 90 天內至少去化 40%，以騰出空間迎接冬季新春大檔期。
              </p>
            </div>

            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
              <span className="font-sans font-bold text-blue-950 block mb-1">需重審採購計畫</span>
              <div className="text-2xl font-black text-blue-700">3 <span className="text-xs font-normal">品牌</span></div>
              <p className="font-sans text-[11px] text-slate-600 mt-2">
                萊法耶、哥德式與肯邦需配合秋冬客群調整 MOQ 與產品進貨結構。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ANNUAL OVERVIEW */}
      {activeTabSection === 'annual' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">年度四季情境示意（固定內容）</h2>
            <p className="text-xs text-slate-500">以下季節、預算比重及營運敘述是固定課程示例，未依當日日期或真實營運資料更新。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-sans text-slate-500 block mb-1">春季 (3-5月)</span>
              <span className="font-bold text-slate-800 text-sm font-sans block mb-1">頭皮醒膚換季</span>
              <p className="font-sans text-[11px] text-slate-500 leading-relaxed">
                抗敏去屑、敏弱修護品項主力，平均進貨預算比重約 22%。
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-sans text-slate-500 block mb-1">夏季 (6-8月)</span>
              <span className="font-bold text-slate-800 text-sm font-sans block mb-1">控油潔淨高峰</span>
              <p className="font-sans text-[11px] text-slate-500 leading-relaxed">
                淨化液、控油洗髮與沁涼噴霧需求最高，週轉次數達全年度頂點。
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="font-sans text-emerald-800 font-bold block mb-1">秋季 (9-11月) 示例情境</span>
              <span className="font-bold text-emerald-950 text-sm font-sans block mb-1">落髮防脫與水療修護</span>
              <p className="font-sans text-[11px] text-slate-700 leading-relaxed">
                頭皮檢測預約暴增，高單價育髮安瓶與滋潤髮膜為主力營收來源。
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-sans text-slate-500 block mb-1">冬季 (12-2月)</span>
              <span className="font-bold text-slate-800 text-sm font-sans block mb-1">年節禮盒與燙染深層護理</span>
              <p className="font-sans text-[11px] text-slate-500 leading-relaxed">
                全年度最大零售買氣，需於 11 月中前完成大宗批發進貨鎖定折扣。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
