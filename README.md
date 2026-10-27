# 綠境庫存｜沙龍門市決策與倉管小幫手

給沙龍與小型服務型店家用的庫存管理與補貨決策平台：看庫存狀態、記錄每次耗用、建立採購單，並由「AI 決策建議」告訴店長該補什麼、為什麼。

> **目前狀態：前端原型（prototype）。** 所有資料都是內建的範例資料（`src/data/mockData.ts`），重新整理頁面就會回到初始狀態；「AI 決策建議」和 LINE／Email 通知是預先寫好的模擬內容，尚未串接真正的 AI 或通知服務。

## 功能

左側選單共 9 個頁面：

| 頁面 | 內容 |
|---|---|
| 總覽儀表板 | 今日營運決策摘要、庫存健康度與總庫存價值（進價）、需立即補貨清單、最新出入庫異動 |
| 庫存管理動態 | 各商品即時庫存動態表；可登記服務耗用、員工自用、盤點校正、破損報廢 |
| 商品品項清單 | 商品新增／編輯、SKU、成本、售價、補貨點、供應商 |
| 採購訂單與入庫 | 建立採購單（草稿 → 核准 → 已下單 → 已入庫），點收後自動增加庫存並寫入帳本 |
| AI 決策建議 | 缺貨、積壓、需求預測、促銷四類建議；每則含原因、證據指標、預測、建議行動，可接受／修改／忽略並回饋 |
| 商業決策分析 | 依「發生了什麼事、為什麼、接下來可能怎樣、能採取什麼行動」四段呈現，另有未來 90 天業務展望與年度四季流速 |
| 品牌績效評估 | 各品牌營運績效與指標對照表，可新增合作品牌 |
| 供應商與促銷 | 供應商資料（MOQ、交期、付款條件）與促銷活動 |
| 人員角色權限 | 門市人員檔案與店主／店長／員工三種角色（**僅供顯示與記錄經手人，沒有實際權限限制**） |

庫存狀態分四級，由「現有庫存」「補貨點」「每週需求」計算（`src/context/AppContext.tsx` 的 `calculateStatus`）：

| 狀態 | 條件 |
|---|---|
| Critical（緊急） | 庫存 ≤ 0，或低於補貨點且可支撐不到 1.5 週 |
| Low（偏低） | 庫存 ≤ 補貨點，或可支撐不到 3 週 |
| Overstock（積壓） | 可支撐超過 16 週 |
| Healthy（健康） | 其他 |

## 快速開始

需要 Node.js 20.19 以上或 22.12 以上（Vite 8 的要求；開發時使用 Node 22）。

```bash
npm install
npm run dev
```

開啟 http://localhost:3000 。

其他指令：

| 指令 | 用途 |
|---|---|
| `npm run build` | 產生正式版到 `dist/` |
| `npm run preview` | 預覽正式版 |
| `npm run lint` | TypeScript 型別檢查（`tsc --noEmit`） |

## 技術架構

- React 19 + TypeScript + Vite 8
- Tailwind CSS 4（`@tailwindcss/vite`）、lucide-react 圖示
- 狀態管理：單一 React Context（`src/context/AppContext.tsx`），沒有後端、沒有資料庫

```
src/
├── App.tsx                 # 依 activeTab 切換頁面
├── context/AppContext.tsx  # 全部狀態與動作（記錄異動、建立採購單、回應 AI 建議…）
├── data/mockData.ts        # 範例資料（使用者、品牌、供應商、商品、帳本、採購單、AI 建議、通知）
├── types/index.ts          # 所有資料型別
└── components/             # 每個頁面一個資料夾，modals/ 放共用彈窗
```

## 環境變數

`.env.example` 列出 `GEMINI_API_KEY` 與 `APP_URL`，是從 Google AI Studio 匯出時帶來的範本。**目前程式碼沒有用到任何一個**，不設定也能正常執行。之後若要串接 Gemini，再複製成 `.env.local` 填入（`.env*` 已被 `.gitignore` 排除，不會被 commit）。

## 已知限制與待辦

- 資料不會保存：重新整理就重置。
- AI 建議為靜態範例，未依實際庫存即時產生。
- 通知（LINE／Email）只會在畫面上產生一則紀錄，不會真的發送。
- `package.json` 裡的 `@google/genai`、`express`、`dotenv`、`motion` 目前沒有被程式碼引用。
