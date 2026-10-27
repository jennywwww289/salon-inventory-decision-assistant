# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

沙龍門市庫存與補貨決策平台，**展示原型**，外加一個個人作品首頁。功能清單、庫存狀態門檻與啟動方式見 `README.md`，這裡只放改程式時需要的資訊。

## 指令

```bash
npm run dev      # 開發伺服器，port 3000（--host=0.0.0.0）
npm run lint     # tsc --noEmit，型別檢查
npm run build    # vite build → dist/
node --import tsx --test tests/*.test.ts                      # 全部測試（221 個，目前全過）
node --import tsx --test --test-name-pattern 'Context permits zero stock' \
  tests/dataValidation.test.ts                                # 單一測試（名稱符合者）
```

- `--test-name-pattern` 必須放在檔名**前面**，放後面會被忽略而跑完整個檔案。

- Node 需 `^20.19.0 || >=22.12.0`（Vite 8 的要求）。
- 測試用 Node 內建 `node:test`，經 `tsx` 載入 TypeScript；`package.json` 沒有 `test` script，所以 `tsx` 看似沒被 import 但**不可移除**。
- 改完以 `lint`、`build`、測試三者驗證。`build` 會印出 `__dirname` 的 Vite 警告，無害。

## 架構

**業務規則在 `src/utils/`（純函式、不依賴 React），`AppContext` 只負責狀態、呼叫這些函式與持久化。** 改規則請改 utils 並補測試，不要在元件裡重寫。

- `validation.ts`：所有輸入檢查，回傳 `ValidationResult`（`{ ok: true, value }` 或 `{ ok: false, errors }`）。元件顯示 errors，不自行判斷。
- `inventoryMovement.ts` 的 `applyInventoryMovement`：**唯一會改庫存的地方**。庫存會變負的出庫直接拒絕，並同步寫入帳本、重算商品狀態。
- `purchaseOrder.ts` 的 `transitionPurchaseOrder`：採購單狀態機 `Draft → Approved → Ordered → Received`，任一非終點狀態可 `Cancelled`；`Ordered` 只增加在途量 `incomingQty`，`Received` 才呼叫 `applyInventoryMovement` 入庫。重複驗收會被拒絕。
- `inventoryCalculations.ts`：庫存狀態規則（`calculateInventoryStatus`）、統計與警示。範例資料裡寫死的 `status` 不是規則，載入時由 `withInventoryStatus` 重算。
- `localData.ts`：localStorage 快照的載入、保存、驗證與重設示範資料。`validateCoreData` 用欄位白名單，未知欄位不會被保存。快照格式有版本（`STORAGE_VERSION`），改資料結構時要一併處理舊快照。
- `AppContext.tsx`：每個指令（`recordTransaction`、`createPurchaseOrder`、`updatePOStatus`、`addProduct`…）先驗證，成功才更新狀態並保存。**直接更新商品的 `stock` 會被拒絕**，必須走盤點調整，帳本才一致。重設示範資料會遞增 `dataRevision`，`App.tsx` 用它當 `key` 讓整個系統區重新掛載。
- `App.tsx`：`area` 在個人首頁（`home`）與系統（`system`）之間切換；系統內沒有 router，靠 context 的 `activeTab` 切頁。新增頁面要同時改 `components/layout/Sidebar.tsx` 的選單與 `App.tsx`。
- 型別全在 `src/types/index.ts`；`src/data/mockData.ts` 是範例資料（約 2500 行）。

庫存異動入口：`ServiceUsageModal`（全域彈窗）與 `ProductDetailModal`（由 `selectedProductId` 開啟），都經 `recordTransaction`。採購單建立入口有 `NewPOModal`、`DashboardView`、`ProductDetailModal`、`AIInsightsView`，都經 `createPurchaseOrder`（一律先是 `Draft`）。

## 容易誤判的地方

- **「AI 決策建議」是靜態範例**（`INITIAL_AI_INSIGHTS`），沒有 AI 後端也沒有 server 程式。
- 角色（Owner／Manager／Staff）沒有任何權限判斷；LINE／Email 通知只是在畫面新增一筆 `NotificationAlert`，不會真的發送。
- 資料只在瀏覽器 localStorage（key `henry-yan.salon-inventory.core`）；測試或手動驗證時，舊快照可能讓畫面和範例資料不同，先用畫面上的「重設示範資料」。

## 專案紀錄與公開版本注意事項

- `docs/` 是這個版本的**開發過程證據**（開發日誌、測試報告、設計研究、AI 對話紀錄、前後對照截圖，約 4.5MB），不是多餘檔案。未經使用者同意，不要刪除或精簡。
- 公開版本已把原作者的聯絡信箱換成佔位字 `your-email@example.com`（`PersonalHome.tsx`、`tests/`、`docs/` 都是），並且改寫過 commit 作者信箱。**不要把真實信箱寫回去**；改信箱要同步改 `tests/copyEmail.test.ts` 與 `tests/dataValidation.test.ts` 裡的預期值。
- 新版的 commit 作者是 Henry Yan（信箱為佔位字 `noreply@example.invalid`），這是刻意保留署名；不要重寫掉。

## 慣例

- 介面文字、註解、commit 訊息以繁體中文為主，識別字用英文；金額為新台幣（NT$）。
- 每個任務完成後 commit 一次；**push 前一律先問使用者**。
