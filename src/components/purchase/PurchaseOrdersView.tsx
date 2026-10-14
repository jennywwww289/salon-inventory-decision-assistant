import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PurchaseOrder, POStatus } from '../../types';
import { 
  ShoppingCart, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Truck, 
  PackageCheck, 
  FileText, 
  Sparkles, 
  Calendar, 
  ChevronRight,
  ArrowRight,
  Check,
  Send,
  Archive,
  Info
} from 'lucide-react';
import { NewPOModal } from '../modals/NewPOModal';

export const PurchaseOrdersView: React.FC = () => {
  const { purchaseOrders, updatePOStatus } = useApp();
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredPOs = purchaseOrders.filter(po => {
    if (statusFilter === 'ALL') return true;
    return po.status === statusFilter;
  });

  const getStatusBadge = (status: POStatus) => {
    switch (status) {
      case 'Draft':
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-xs font-semibold">草稿 (Draft)</span>;
      case 'Approved':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded text-xs font-semibold">已核准 (Approved)</span>;
      case 'Ordered':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded text-xs font-semibold">已向供應商下單 (Ordered)</span>;
      case 'Received':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded text-xs font-bold flex items-center gap-1">
          <CheckCircle2 size={12} />
          <span>已入庫點收 (Received)</span>
        </span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-emerald-950/10">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">採購訂單與入庫點收</h1>
          <p className="text-xs text-slate-500 mt-1">
            人機協同採購流程：AI 建議 → 店長審查與增減數量 → 核准下單 → 到貨點收自動入庫回寫帳本。
          </p>
        </div>
        <button
          onClick={() => setIsNewPOModalOpen(true)}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>建立新採購單</span>
        </button>
      </div>

      {/* 2. Process Stepper Explanation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          店長審核確認流程 (PURCHASE DECISION PIPELINE)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="font-bold text-slate-800 block mb-0.5">1. AI 數據建議或手動建單</span>
            <span className="text-slate-500 text-[11px]">比對庫存、每週需求、交期與 MOQ</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="font-bold text-slate-800 block mb-0.5">2. 店長微調數量與審核</span>
            <span className="text-slate-500 text-[11px]">身為最終決策者，隨時修改採購數</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="font-bold text-slate-800 block mb-0.5">3. 標記已向供應商下單</span>
            <span className="text-slate-500 text-[11px]">進入物流配送，自動列入在途庫存</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <span className="font-bold text-emerald-900 block mb-0.5">4. 到貨驗收一鍵入庫</span>
            <span className="text-emerald-700 text-[11px]">庫存自動增加，並於帳本寫入進貨紀錄</span>
          </div>
        </div>
      </div>

      {/* 3. Filter tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs w-fit">
        {['ALL', 'Draft', 'Approved', 'Ordered', 'Received'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === st
                ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {st === 'ALL' ? '全部訂單' : st === 'Draft' ? '草稿' : st === 'Approved' ? '已核准' : st === 'Ordered' ? '已下單' : '已入庫'}
          </button>
        ))}
      </div>

      {/* 4. PO Cards & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PO List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredPOs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
              目前無此狀態的採購單。
            </div>
          ) : (
            filteredPOs.map(po => {
              const isSelected = selectedPO?.id === po.id;
              return (
                <div
                  key={po.id}
                  onClick={() => setSelectedPO(po)}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all cursor-pointer ${
                    isSelected ? 'border-emerald-700 ring-2 ring-emerald-700/10' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">{po.poNumber}</span>
                      {po.isAiAssisted && (
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <Sparkles size={11} />
                          <span>AI 輔助建議</span>
                        </span>
                      )}
                    </div>
                    <div>{getStatusBadge(po.status)}</div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mb-4 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[11px] font-sans">供應商</span>
                      <span className="font-bold text-slate-800 truncate block font-sans">{po.supplierName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-sans">品項數</span>
                      <span className="font-bold text-slate-800">{po.items.length} 項商品</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-sans">預計交期</span>
                      <span className="font-bold text-slate-800">{po.expectedDeliveryDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] font-sans">總金額 (NT$)</span>
                      <span className="font-black text-emerald-800 text-sm">
                        ${po.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs mb-3 space-y-1">
                    {po.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700">
                        <span className="truncate max-w-[260px] font-medium">{item.productName}</span>
                        <span className="font-mono text-slate-500">
                          {item.quantity} 瓶 × ${item.unitCost} = <strong className="text-slate-800 font-bold">${item.subtotal.toLocaleString()}</strong>
                        </span>
                      </div>
                    ))}
                  </div>

                  {po.notes && (
                    <p className="text-[11px] text-slate-500 italic mb-3">備註：{po.notes}</p>
                  )}

                  {/* Lifecycle Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      由 {po.createdByName} 於 {po.createdAt} 建立
                    </span>
                    <div className="flex items-center gap-2">
                      {po.status === 'Draft' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updatePOStatus(po.id, 'Approved');
                          }}
                          className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={13} />
                          <span>店長核准 (Approve)</span>
                        </button>
                      )}

                      {po.status === 'Approved' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updatePOStatus(po.id, 'Ordered');
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Send size={13} />
                          <span>標記已向下單 (Ordered)</span>
                        </button>
                      )}

                      {po.status === 'Ordered' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updatePOStatus(po.id, 'Received');
                          }}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <PackageCheck size={14} />
                          <span>到貨點收！自動增補庫存與寫入帳本</span>
                        </button>
                      )}

                      {po.status === 'Received' && (
                        <span className="text-xs text-emerald-800 font-medium flex items-center gap-1">
                          <CheckCircle2 size={14} />
                          <span>已於 {po.receivedAt} 驗收完成</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PO Detailed Inspect Panel (Sidebar on desktop) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-fit space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <FileText size={16} className="text-emerald-800" />
            <span>採購單稽核與決策佐證</span>
          </h2>

          {selectedPO ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">單號</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{selectedPO.poNumber}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">供應商 / 條件</span>
                <span className="font-bold text-slate-800">{selectedPO.supplierName}</span>
                <span className="text-slate-500 block text-[11px] mt-0.5">預計交期：{selectedPO.expectedDeliveryDate}</span>
              </div>

              {selectedPO.aiRationale && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                    <Sparkles size={14} />
                    <span>AI 推薦採購理由 (Why this PO?)</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    {selectedPO.aiRationale}
                  </p>
                </div>
              )}

              <div>
                <span className="text-slate-700 font-semibold block mb-1">明細清單：</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 font-mono text-[11px]">
                  {selectedPO.items.map((it, i) => (
                    <div key={i} className="p-2.5 flex justify-between bg-slate-50/50">
                      <div>
                        <div className="font-sans font-medium text-slate-900">{it.productName}</div>
                        <div className="text-slate-400">目前庫存：{it.currentStock} 瓶</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{it.quantity} 瓶</div>
                        <div className="text-emerald-800 font-bold">${it.subtotal.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm">
                <span className="font-medium text-slate-600">總採購金額：</span>
                <span className="font-black text-xl text-slate-900 font-mono">
                  ${selectedPO.totalAmount.toLocaleString()}
                </span>
              </div>

              {/* Status change actions */}
              <div className="pt-2">
                {selectedPO.status === 'Draft' && (
                  <button
                    onClick={() => updatePOStatus(selectedPO.id, 'Approved')}
                    className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    店長核准採購單
                  </button>
                )}
                {selectedPO.status === 'Approved' && (
                  <button
                    onClick={() => updatePOStatus(selectedPO.id, 'Ordered')}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    確認已發單給供應商
                  </button>
                )}
                {selectedPO.status === 'Ordered' && (
                  <button
                    onClick={() => updatePOStatus(selectedPO.id, 'Received')}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    貨到點收！立即入庫更新
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              請從左側點選任一採購單檢視詳細明細與佐證。
            </div>
          )}
        </div>
      </div>

      {isNewPOModalOpen && (
        <NewPOModal onClose={() => setIsNewPOModalOpen(false)} />
      )}
    </div>
  );
};
