# CLAUDE.md

沙龍門市庫存與補貨決策平台（前端原型）。功能與使用方式見 `README.md`，這裡只放改程式時要知道的事。

## 指令

- `npm run dev`：開發伺服器，port 3000
- `npm run lint`：`tsc --noEmit`（目前通過）
- `npm run build`：正式版（目前通過；會出現 Vite 的 `__dirname` 警告，無害）
- 沒有測試框架，改完至少跑 `lint` 和 `build`。

## 架構重點

- 純前端，**沒有後端、沒有資料庫、沒有持久化**。所有狀態在 `src/context/AppContext.tsx`，初始值來自 `src/data/mockData.ts`（約 2500 行，商品資料在 `INITIAL_PRODUCTS`）。
- 沒有 router；`App.tsx` 靠 `activeTab` 字串切換頁面。新增頁面要同時改 `Sidebar.tsx` 的選單與 `App.tsx` 的條件渲染。
- 型別全在 `src/types/index.ts`；新增欄位先改這裡。
- 庫存狀態（Critical／Low／Overstock／Healthy）由 `AppContext.tsx` 的 `calculateStatus` 計算，門檻寫在 `README.md`。改門檻要同步改 README。
- 採購單標記 `Received` 時，會自動增加庫存、寫入 `Purchase` 帳本、發通知（`updatePOStatus`）。標記 `Ordered` 時只增加 `incomingQty`。

## 容易誤判的地方

- **「AI 決策建議」是靜態範例**（`INITIAL_AI_INSIGHTS`），不是即時運算；`@google/genai`、`express`、`dotenv`、`motion` 已安裝但 `src/` 沒有任何地方引用。不要假設已有 AI 後端。
- 角色（Owner／Manager／Staff）沒有任何權限判斷，只用於顯示與記錄經手人；不要假設某功能被角色擋住。
- LINE／Email 通知只是在畫面新增一筆 `NotificationAlert`，不會真的發送。
- `vite.config.ts` 的 `DISABLE_HMR` 區塊是 Google AI Studio 留下的，本機開發用不到，除非有需要不要動。
- `package.json` 的 `name` 已改為 `salon-inventory-decision-assistant`；`package-lock.json` 的 name 也同步改了。

## 慣例

- 介面文字、註解、commit 訊息以繁體中文為主；程式識別字用英文。
- 金額單位為新台幣（NT$），日期格式 `YYYY-MM-DD`，時間 `YYYY-MM-DD HH:mm`。
- 不要 commit `.env*`（除 `.env.example`）、`node_modules/`、`dist/`。
- 每個任務完成後 commit 一次；**push 前一律先問使用者**。
