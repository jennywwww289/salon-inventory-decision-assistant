import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AIInsight, InsightSeverity } from '../../types';
import { 
  BrainCircuit, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  Check, 
  X, 
  Edit3, 
  ShoppingCart, 
  ThumbsUp, 
  ThumbsDown, 
  ArrowRight,
  Info,
  Clock,
  CheckCircle2,
  Filter
} from 'lucide-react';

export const AIInsightsView: React.FC = () => {
  const { 
    insights, 
    respondToInsight, 
    submitInsightFeedback, 
    createPurchaseOrder, 
    products, 
    setActiveTab, 
    setSelectedProductId 
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [modifyingInsightId, setModifyingInsightId] = useState<string | null>(null);
  const [adjustedQty, setAdjustedQty] = useState<number>(30);
  const [feedbackPromptId, setFeedbackPromptId] = useState<string | null>(null);

  const filteredInsights = insights.filter(i => {
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'Critical') return i.severity === 'Critical';
    if (activeCategory === 'Watch') return i.severity === 'Watch';
    if (activeCategory === 'Opportunity') return i.severity === 'Opportunity';
    return true;
  });

  const handleCreatePOFromInsight = (insight: AIInsight, finalQty?: number) => {
    const targetProduct = products.find(p => p.id === insight.productId);
    if (!targetProduct) {
      setActiveTab('purchase');
      return;
    }

    const orderQty = finalQty || insight.suggestedQty || Math.max(targetProduct.moq, Math.round(targetProduct.weeklyDemand * 3));

    createPurchaseOrder({
      supplierId: targetProduct.supplierId,
      items: [{
        productId: targetProduct.id,
        quantity: orderQty,
        unitCost: insight.unitCost || targetProduct.unitCost
      }],
      expectedDeliveryDate: new Date(Date.now() + targetProduct.leadTime * 86400000).toISOString().split('T')[0],
      notes: `由 AI 決策建議「${insight.title}」自動生成之採購單`,
      isAiAssisted: true,
      aiRationale: `${insight.explanation}，預測：${insight.forecast}`
    });

    respondToInsight({
      insightId: insight.id,
      action: finalQty ? 'Modify' : 'Accept',
      adjustedQty: orderQty
    });

    setActiveTab('purchase');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-950/10">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI 智能決策建議中心</h1>
          <p className="text-xs text-slate-500 mt-1">
            以數據佐證為核心的決策輔助：分析過去（發生了什麼）→ 解釋原因（為什麼）→ 預估風險（可能發生什麼）→ 提出行動方案。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            店長擁有最終審核裁決權 (Human-in-the-Loop)
          </span>
        </div>
      </div>

      {/* 2. Philosophy Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0 font-bold">
            <BrainCircuit size={17} />
          </div>
          <div>
            <div className="font-bold text-emerald-950">
              決策輔助三大核心原則：佐證重於建議 · 解釋重於自動化 · 人類核准後才執行
            </div>
            <div className="text-slate-600 text-[11px] mt-0.5">
              系統不會擅自對外發送任何訂單；所有 AI 預測皆以區間或機率呈現，店長可隨時微調、採納或標記回饋。
            </div>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs w-fit">
        {[
          { id: 'ALL', label: '全部建議' },
          { id: 'Critical', label: '🚨 緊急斷貨危機 (Critical)', count: insights.filter(i => i.severity === 'Critical').length },
          { id: 'Watch', label: '⚠️ 庫存積壓警示 (Watch)', count: insights.filter(i => i.severity === 'Watch').length },
          { id: 'Opportunity', label: '💡 供應商採購商機 (Opportunity)', count: insights.filter(i => i.severity === 'Opportunity').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeCategory === tab.id
                ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="ml-1 font-mono opacity-80">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* 4. Insights Cards List */}
      <div className="space-y-5">
        {filteredInsights.map(insight => {
          const isCritical = insight.severity === 'Critical';
          const isWatch = insight.severity === 'Watch';
          const isOpportunity = insight.severity === 'Opportunity';

          const borderColor = isCritical 
            ? 'border-rose-200 hover:border-rose-300' 
            : isWatch 
            ? 'border-amber-200 hover:border-amber-300' 
            : 'border-emerald-200 hover:border-emerald-300';

          const badgeStyle = isCritical 
            ? 'bg-rose-50 text-rose-700 border-rose-200' 
            : isWatch 
            ? 'bg-amber-50 text-amber-800 border-amber-200' 
            : 'bg-emerald-50 text-emerald-800 border-emerald-200';

          return (
            <div
              key={insight.id}
              className={`bg-white border rounded-2xl p-6 shadow-xs transition-all ${borderColor}`}
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${badgeStyle}`}>
                    {insight.severity === 'Critical' ? '斷貨危機' : insight.severity === 'Watch' ? '積壓監控' : '採購商機'}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">{insight.title}</h2>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>偵測時間：{insight.createdAt}</span>
                  {insight.status !== 'Pending' && (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded font-sans">
                      已處理 ({insight.status})
                    </span>
                  )}
                </div>
              </div>

              {/* Subtitle tag */}
              <div className="text-xs text-slate-500 mb-4 flex items-center gap-2">
                <span>標的：<strong>{insight.productName || insight.brandName}</strong></span>
                <span>·</span>
                <span>品牌：{insight.brandName}</span>
              </div>

              {/* Four Dimension Explanation Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 mb-5 text-xs">
                {/* 為什麼會發生？佐證數據 */}
                <div>
                  <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Info size={14} className="text-emerald-800" />
                    <span>為什麼會有此判斷？(Why?) 關鍵佐證</span>
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-3">
                    {insight.explanation}
                  </p>

                  <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px]">
                    {insight.evidenceMetrics.map((m, idx) => (
                      <div key={idx}>
                        <span className="text-slate-600 block text-[10px] font-sans">{m.label}</span>
                        <span className="font-bold text-slate-900">{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 預估可能後果與行動方案 */}
                <div>
                  <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-emerald-800" />
                    <span>接下來可能發生什麼？(What might happen?)</span>
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-3">
                    {insight.forecast}
                  </p>

                  <div className="p-3 bg-emerald-950/5 border border-emerald-950/10 rounded-lg">
                    <span className="text-[11px] font-bold text-emerald-900 block mb-1">
                      💡 建議行動方案 (What can I do?)
                    </span>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {insight.recommendation}
                    </p>
                    <div className="mt-2 text-[11px] text-emerald-800 font-mono font-semibold">
                      潛在效益：{insight.potentialImpact}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Human Adjustments */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
                {/* Human decision controls */}
                <div className="flex items-center gap-2">
                  {modifyingInsightId === insight.id ? (
                    <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl text-xs">
                      <span className="text-slate-600 font-medium">調整採購量：</span>
                      <input
                        type="number"
                        value={adjustedQty}
                        onChange={(e) => setAdjustedQty(parseInt(e.target.value) || 0)}
                        className="w-16 bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-center"
                      />
                      <button
                        onClick={() => {
                          handleCreatePOFromInsight(insight, adjustedQty);
                          setModifyingInsightId(null);
                        }}
                        className="px-3 py-1 bg-emerald-800 text-white rounded font-semibold hover:bg-emerald-900 cursor-pointer"
                      >
                        以微調數量建單
                      </button>
                      <button
                        onClick={() => setModifyingInsightId(null)}
                        className="text-slate-500 hover:text-slate-700 px-2 cursor-pointer"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <>
                      {insight.suggestedQty && insight.suggestedQty > 0 ? (
                        <>
                          <button
                            onClick={() => handleCreatePOFromInsight(insight)}
                            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <ShoppingCart size={14} />
                            <span>採納並建立採購單 ({insight.suggestedQty} 瓶)</span>
                          </button>
                          <button
                            onClick={() => {
                              setModifyingInsightId(insight.id);
                              setAdjustedQty(insight.suggestedQty || 20);
                            }}
                            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Edit3 size={14} />
                            <span>微調數量</span>
                          </button>
                        </>
                      ) : null}

                      {insight.productId && (
                        <button
                          onClick={() => {
                            setSelectedProductId(insight.productId!);
                            setActiveTab('inventory');
                          }}
                          className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          查看商品帳本
                        </button>
                      )}

                      <button
                        onClick={() => respondToInsight({ insightId: insight.id, action: 'Dismiss' })}
                        className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        忽略
                      </button>
                    </>
                  )}
                </div>

                {/* Feedback Loop Mechanism */}
                <div className="flex items-center gap-3 text-xs border-t sm:border-t-0 pt-2 sm:pt-0">
                  {insight.feedback ? (
                    <div className="text-slate-400 text-[11px] flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>已回饋：{insight.feedback.isHelpful ? '有幫助' : `不實用 (${insight.feedback.reason})`}</span>
                    </div>
                  ) : feedbackPromptId === insight.id ? (
                    <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-[11px]">
                      <span className="text-slate-500">不實用原因：</span>
                      {[
                        { id: 'Too conservative', label: '太保守' },
                        { id: 'Too aggressive', label: '太激進' },
                        { id: 'Missing info', label: '少資訊' },
                        { id: 'Inaccurate data', label: '數據不準' }
                      ].map(r => (
                        <button
                          key={r.id}
                          onClick={() => {
                            submitInsightFeedback({
                              insightId: insight.id,
                              isHelpful: false,
                              reason: r.id as any
                            });
                            setFeedbackPromptId(null);
                          }}
                          className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-700 cursor-pointer"
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>這項建議有幫助嗎？</span>
                      <button
                        onClick={() => submitInsightFeedback({ insightId: insight.id, isHelpful: true })}
                        className="p-1 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer flex items-center gap-0.5"
                        title="有幫助"
                      >
                        <ThumbsUp size={13} />
                        <span>有用</span>
                      </button>
                      <button
                        onClick={() => setFeedbackPromptId(insight.id)}
                        className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer flex items-center gap-0.5"
                        title="不實用"
                      >
                        <ThumbsDown size={13} />
                        <span>不實用</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
