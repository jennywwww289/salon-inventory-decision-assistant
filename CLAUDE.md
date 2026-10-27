# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

沙龍門市庫存與補貨決策平台，目前是**純前端原型**。功能清單、庫存狀態門檻與啟動方式見 `README.md`，這裡只放改程式時需要的資訊。

## 指令

```bash
npm run dev      # 開發伺服器，port 3000（--host=0.0.0.0）
npm run lint     # tsc --noEmit，型別檢查
npm run build    # vite build → dist/
```

- Node 需 `^20.19.0 || >=22.12.0`（Vite 8 的要求）。
- **沒有測試框架**，沒有單一測試可跑；改完以 `lint` + `build` 驗證（目前兩者皆通過）。`build` 會印出 `__dirname` 的 Vite 警告，無害。

## 架構

單一 React Context 驅動整個 App，沒有 router、後端或持久化：

- `src/context/AppContext.tsx`：所有狀態（users、brands、suppliers、products、transactions、purchaseOrders、insights、notifications）、UI 狀態（`activeTab`、`selectedProductId`、兩個全域彈窗開關）與所有動作都在這裡。元件一律透過 `useApp()` 取用。
- `src/App.tsx`：依 `activeTab` 字串條件渲染頁面。新增頁面要同時改 `components/layout/Sidebar.tsx` 的選單與這裡。
- `src/data/mockData.ts`：唯一資料來源（約 2500 行）。商品由 `RAW_PRODUCTS_LIST` 加 `bonusSeeds` 組成 100 筆 SKU。
- `src/types/index.ts`：所有型別；新增欄位先改這裡。

### 跨檔案的資料流

- **庫存異動只有兩個入口**：`ServiceUsageModal`（全域彈窗，Header／Dashboard／Inventory 都能開）與 `ProductDetailModal`（由 context 的 `selectedProductId` 開啟），兩者都呼叫 `recordTransaction`。它會同時更新商品庫存與狀態、寫入帳本，並在變成 Critical／Low 時產生一筆通知。
- **採購單有四個建立入口**：`NewPOModal`、`DashboardView`、`ProductDetailModal`、`AIInsightsView`，都呼叫 `createPurchaseOrder`（一律建立為 `Draft`）。AI 建議頁的 `handleCreatePOFromInsight` 還會呼叫 `respondToInsight` 把建議標為 Accepted／Modified，再 `setActiveTab('purchase')`。
- **採購單狀態轉換有副作用**（`updatePOStatus`）：轉 `Ordered` 只增加商品的 `incomingQty`；轉 `Received` 才會增加庫存、扣掉 `incomingQty`、寫入 `Purchase` 帳本並發通知。

## 容易誤判的地方

- **商品 `status` 不是即時算出來的。** 範例資料的 `status` 是寫死的；`calculateStatus` 只在 `recordTransaction` 與採購單入庫時重算。`addProduct`、`updateProduct`（例如改補貨點）**不會**重算狀態，因此畫面上的狀態可能和 README 的門檻不一致。
- **「AI 決策建議」是靜態範例**（`INITIAL_AI_INSIGHTS`），不是即時運算。`@google/genai`、`express`、`dotenv`、`motion` 已列在 dependencies，但 `src/` 完全沒有引用，也沒有 server 程式；不要假設已有 AI 後端。
- 角色（Owner／Manager／Staff）沒有任何權限判斷，只用於顯示與記錄經手人。
- LINE／Email 通知只是在畫面新增一筆 `NotificationAlert`，不會真的發送。
- `vite.config.ts` 的 `DISABLE_HMR` 區塊是 Google AI Studio 留下的，本機開發用不到。`.env.example` 同樣來自 AI Studio，內容目前無任何程式使用。
- ID 以 `Date.now()` 產生（如 `tx-${Date.now()}`、`prod-${Date.now()}`），同一毫秒內連續呼叫可能重複。

## 慣例

- 介面文字、註解、commit 訊息以繁體中文為主，識別字用英文；金額為新台幣（NT$）。
- 每個任務完成後 commit 一次；**push 前一律先問使用者**。
