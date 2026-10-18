# 第二輪：文字層級與前後比較

日期：2026-10-18（Asia/Taipei）。**最新：已收到2張原圖，本人回報操作通過；首頁圖可用，桌機圖與修改前的垂直拍攝位置不同，尚待1張同位置補圖。** 下方原交付時的待補狀態保留為歷史紀錄，最新檢查見文末。沒有產生替代圖片，也沒有把建置結果當作畫面通過。

## 版本與既有修改

- 開始HEAD：`26e58b6e55d32d9db05285b5a5cb1c6d0f2c3685`；當時網站程式仍是步驟21的`fc2b0ab2788ad878a3a0b6b8b40e3b32e73f6bea`。
- 本輪程式與完整Prompt提交：`f56365833ac1c8cbcdc22b3e26c5e2803537bf3c`（20個程式／CSS檔與1個Prompt，共21檔，本機保存，未推送）。
- 起點未提交：`docs/development-log.md`、`docs/ai-conversations/README.md`；未追蹤：`docs/design-principles-research.md`、`docs/ai-conversations/2026-10-18-step20-prompt.md`。保留既有內容，兩份共用紀錄只追加；未將這些既有工作混入程式提交。
- `original-baseline`仍為`2ad1f4dc9c22e56d242a030079a650a2a2a0c154`；`pre-beautification-v1`仍為`0a4d62020a8a33ce0337d2a790c73b80103d9411`。未移動或覆寫。
- [本輪完整Prompt](../../ai-conversations/2026-10-18-step22-prompt.md)、[開發紀錄：第42節](../../development-log.md)、[研究：文字層級](../../design-principles-research.md)、[初版自評](../../initial-self-evaluation.md)。本輪Prompt不等於完整主線／分支對話匯出，後者仍缺。

## 原則與實際規格

沿用步驟20的原則二：字級、字重與行高配合，讓標題、內容、輔助資訊與數字容易掃讀。來源是美國General Services Administration的[USWDS：Using type](https://designsystem.digital.gov/design-tokens/typesetting/overview/)，本輪實際查閱日期2026-10-18，相關章節為Normalization、Rem-based font sizing、Normalization and line height、Typesetting with tokens。來源說明字型視覺大小、相對字級及行高的關係；**下表數值是本專案選擇，不是官方強制規格**。

相比研究時的初步尺度，本輪採28／32px頁標、22px區塊標題、18px項目標題及14px輔助字，將原有10～12px小字提升；理由是拉開首頁作品、技能層級並改善密集系統資訊。這是依現有圖片與程式選定的實作規格，效果仍待修改後畫面確認，並未宣稱已由實測調校完成。

px為根字級16px時的對照；不鎖定根字級，不新增字型下載。行高皆無單位。字型沿用既有body、font-sans、font-mono設定。

| 文字角色／類別 | 字級 | 字重 | 行高 | 使用位置 |
|---|---|---|---|---|
| 頁面標題 `type-page-title` | 1.75rem／28px；640px以上2rem／32px | 700 | 1.25 | 九個系統頁面h1；首頁h1搭配下列例外 |
| 首頁姓名例外 `type-home-title` | 各尺寸2rem／32px | 沿用頁標700 | 1.25 | Henry Yan／顏愷均，允許自然換行 |
| 區塊標題 `type-section-title` | 1.375rem／22px | 600 | 1.35 | 首頁h2、系統區塊與彈窗h2 |
| 項目標題 `type-item-title` | 1.125rem／18px | 600 | 1.4 | 技能／作品／商品卡等h3 |
| 一般內文 `type-body` | 1rem／16px | 繼承；一般400，既有強調保留 | 1.65 | 自介、作品段落、重要錯誤與保存狀態；h4保留600 |
| 表格／輔助 `type-detail` | 0.875rem／14px | 繼承；一般400，既有500／600／700強調保留 | 1.5 | 表格、SKU、說明、表單輸入與頁尾 |
| 標籤／操作 `type-label` | 0.875rem／14px | 600 | 1.5 | 表單label、表頭、按鈕 |
| 狀態 `type-status` | 0.875rem／14px | 600 | 1.5 | 庫存四種狀態文字 |
| 關鍵表格數字 `type-number` | 0.875rem／14px | 700 | 1.5 | 庫存、金額等原有mono粗體資訊，tabular-nums、不拆數字 |
| 關鍵統計 `type-stat` | 1.5rem／24px | 700 | 1.25 | 儀表板統計、分析卡數字、商品明細庫存及採購總額；tabular-nums |

文字角色僅由元件明確套用；沒有全域h1／p／svg選擇器。`type-body`及`type-detail`刻意不強制字重，以保留既有重點。保留合理h1→h2→h3→h4語意，沒有為尺寸改標籤。數量與金額不改值、不改單位、不改公式。

## 問題、修改位置與原因

| 問題與依據 | 研究原則 | 修改位置 | 修改及原因 | 驗收結果 |
|---|---|---|---|---|
| 自評D03：首頁技能／作品次層與內文接近；初版首頁原圖可見 | 原則二：階層與行高 | `PersonalHome.tsx`、`src/index.css` | 姓名32、h2 22、h3 18、段落16／1.65；個人資料與全部文案保留 | 靜態接線通過；修改後視覺待補 |
| 步驟21有效庫存圖仍有密集小字；程式分散使用10／11／12／14px | 原則二：一致尺度 | 九個系統View、Header、Sidebar、DataStorageStatus | 頁標28／32、表格及輔助14、重要保存或錯誤訊息16；示範標示不改 | 型別與建置通過；三尺寸待實測 |
| 代表性表單標籤與錯誤文字角色不一致，程式依據 | 原則二：角色一致 | 四個共用Modal、ProductDetailModal，以及View內既有表單 | 標題22、標籤14／600、錯誤16；原生控制項與既有事件保留 | 靜態檢查通過；短高度彈窗待實測 |
| 庫存數字置中、粗體與小字分散，程式依據 | 原則二：數據掃讀 | InventoryView、DashboardView、AnalyticsView、ProductDetailModal、PurchaseOrdersView | 庫存表數字欄與表頭靠右；關鍵值tabular-nums；統計24／700；保持所有值與計算 | 靜態檢查通過；實際對齊效果待看圖 |
| 放大文字後，原有截斷及固定16px通知數字容器有裁字風險（程式推測） | 原則二：完整內容可讀 | Brands／Dashboard／Products／PurchaseOrders／Suppliers的長文字、Header徽章 | 原有truncate／line-clamp處改可換行；通知數字徽章改最小24px並容許寬度增長，僅處理字級增大所需局部空間 | 實作完成；未宣稱已實際發生或已操作確認裁切 |

修改清單共20個程式檔：`src/index.css`、`src/App.tsx`；`src/components/home/PersonalHome.tsx`；`layout/{Header,Sidebar,DataStorageStatus}.tsx`；`inventory/InventoryView.tsx`；`dashboard/DashboardView.tsx`；`analytics/AnalyticsView.tsx`；`brands/BrandsView.tsx`；`insights/AIInsightsView.tsx`；`products/{ProductsView,ProductDetailModal}.tsx`；`purchase/PurchaseOrdersView.tsx`；`suppliers/SuppliersView.tsx`；`users/UsersView.tsx`；`modals/{NewProductModal,NewPOModal,ServiceUsageModal,NotificationModal}.tsx`。後述相對路徑皆在`src/components/`下。

19個TSX的既有className值以外內容逐字比對相同；既有排版CSS完整保留為前綴，新增宣告只涉及字級、字重、行高、數字、換行。Context、業務工具、資料、型別、測試與套件未改。第一輪側欄、工具列、表格最小欄寬、容器捲動與彈窗可捲動規則保留；沒有縮小既有44px最小控制項規則，但實際尺寸仍未量測。

## 初次交付時的前後對照規格（歷史紀錄，最新結果見文末）

首頁檔案已用Git核對：初版標籤與步驟21完成時相同，因此可沿用初版首頁圖；庫存僅使用步驟21最後有效原圖。已實際開啟首頁手機、有效庫存桌機／手機及短高度彈窗頂端作本輪對照；沒有把舊圖片當作本輪修改後的驗證。

| 代表畫面 | 修改前證據 | 設定viewport（CSS px）／擷取 | 修改前實際PNG | 修改後檔名與狀態 |
|---|---|---|---|---|
| 首頁手機 | [初版首頁手機](../before/home-mobile.png)，首頁內容及樣式在21未修改 | 390×844／全頁 | 375×2872 | `home-mobile.png`；待補，實際尺寸未確認 |
| 庫存桌機 | [第一輪最終有效庫存桌機](../round-1-layout/inventory-desktop-retake-2.png) | 1440×900／可視範圍 | 1440×900 | `inventory-desktop.png`；待補，實際尺寸未確認 |

補充參照：[第一輪庫存平板](../round-1-layout/inventory-tablet.png)、[第一輪庫存手機](../round-1-layout/inventory-mobile.png)、[彈窗頂端](../round-1-layout/service-mobile-top.png)、[彈窗底端](../round-1-layout/service-mobile-bottom.png)。不使用第一輪尺度異常的`inventory-desktop.png`或其儀表板補圖作本輪桌機前圖。

初版首頁三圖比設定viewport少15px的差異保留；原因未確認，不能直接定為網站溢出，也不縮放、補邊或改寫原圖。第一輪Chrome版本、DPR及縮放未獨立確認的缺口保留；新圖請記錄實際條件，不能以PNG尺寸反推全部設定一致。

### 拍攝條件

- 網址：`http://localhost:3000/`。本輪只確認既有Vite程序、3000監聽及HTTP 200，未新啟動、未自動操作瀏覽器；HTTP不是畫面驗收。
- 獨立Chrome無痕環境，同來源、相同示範角色Sarah／user-1；勿重設一般視窗已保存資料。首次新無痕環境使用預設示範資料，預期111 SKU、8品牌、5供應商，庫存狀態3／26／6／76；完整種子資料總量2382、成本1456370，這兩值不在前圖指標中，不宣稱由圖片看見。
- 預定Chrome網頁縮放100%、DPR1；實際Chrome版本／DPR／縮放／拍攝日期時間均待本輪圖片補充。不是手機／平板實機驗收。
- 首頁回頂端；庫存空搜尋、全部品牌／供應商／品類／狀態、庫存低到高、無彈窗選單，頁面及表格水平／垂直捲動回起點。只導覽，不新增、領料、驗收或重設。
- 以Chrome原生Capture full size screenshot（首頁）及Capture screenshot（庫存）保存PNG；不要拍螢幕、裁圖、修圖、覆寫既有證據。記錄設定viewport及檔案實際像素；首頁全頁高度可超過844px。

## 一次補證操作

1. Chrome按`Ctrl+Shift+N`開無痕視窗，在網址列輸入`http://localhost:3000/`。按`Ctrl+0`回100%網頁縮放，按`F12`開DevTools，再按`Ctrl+Shift+M`開裝置工具列。裝置選`Responsive`，寬高輸入390、844；工具列右上`⋮`如未顯示DPR，勾選Device pixel ratio並設1。首頁應顯示Henry Yan／顏愷均，各段可自然換行，Email與頁尾完整可到達。
2. 在首頁回頂端，於DevTools按`Ctrl+Shift+P`，輸入`Capture full size screenshot`並選該項；存成`home-mobile.png`至本資料夾。全頁高度不必等於844；不修正既有15px差異。
3. 點首頁「進入庫存系統」，再點三橫線導覽→「庫存管理動態」（桌機會直接顯示側欄）。將Responsive寬高改1440、900，Device type選Desktop、DPR1。確認標題「門市即時庫存動態表」、Sarah、空搜尋、全部篩選、庫存低到高；頁面及表格回起點。應看到清楚的頁標、14px表格、對齊的庫存數字，右側欄仍可在表格容器內橫捲。DevTools命令選`Capture screenshot`，存成`inventory-desktop.png`。
4. 不另拍圖，將首頁及庫存清單各自快速查看1440×900、820×1180、390×844；只檢查新字級下標題／說明／按鈕未裁字，手機導覽可開關，庫存右側操作可局部橫捲到達。再於390×600點「現場領料／服務耗用」開一個表單，捲到最底，應能看清標籤、數量及取消／確認按鈕；點取消，不提交。這只確認文字改動影響，不重做步驟17業務流程。
5. 一次回報兩圖已存、上述畫面是否有裁字，附Chrome版本、DPR／100%設定及拍攝時間。Console及44px實際量測未取得專項證據前仍維持未獨立驗證；不需要重做九頁或完整庫存／採購流程。

存放資料夾：`C:\Users\yanmo\OneDrive\桌面\創業課-倉儲管理\salon-inventory-decision-assistant-main\salon-inventory-decision-assistant-main\docs\screenshots\round-2-typography`。

## 本輪驗收

| 測試目的 | 測試輸入 | 預期輸出 | 實際輸出 | 問題與通過判定 |
|---|---|---|---|---|
| 型別／程式檢查 | `npm.cmd run lint`，一次 | tsc無錯誤、exit 0 | `tsc --noEmit`，exit 0 | 通過；不是畫面驗收 |
| 正式建置 | `npm.cmd run build`，一次 | 成功產出正式檔、exit 0 | Vite 8.3.4、1686 modules，exit 0 | 通過；既有`__dirname`未來configLoader相容警告保留 |
| 本輪範圍 | 起點Git內容與19個TSX差異；CSS前綴及新屬性 | 僅文字樣式，保留事件與第一輪CSS | TSX去除className值後逐字相同；原CSS未變，新屬性僅六種文字屬性 | 靜態差異檢查通過，非行為測試 |
| 原始證據與既有工作保護 | 起點54檔SHA-256、共用紀錄前綴、兩標籤 | 只有20個指定程式檔變動，其餘保留 | 34個受保護檔案不變，含全部13張既有PNG；兩份紀錄原文前綴保留，兩標籤未移動 | 檔案與Git檢查通過 |
| 三尺寸文字與代表彈窗 | 修改後首頁／庫存三尺寸、390×600彈窗 | 文字完整可讀，第一輪導覽／捲動仍可用 | 瀏覽器工具已知不可用，本輪未重試；沒有修改後原圖 | 待本人補證，未填通過 |
| 本輪Console與44px實測 | 瀏覽器錯誤及實際點擊區量測 | 無新增錯誤、主要目標符合既定規格 | 未執行；只有既有最小尺寸規則未改的靜態證據 | 未獨立驗證，延續步驟21缺口 |
| 兩張原圖與條件 | 本目錄預定兩PNG及拍攝資訊 | 能開啟、畫面正確、viewport／實際像素有紀錄 | 目前0／2，Chrome／DPR／時間待補 | 未完成，不建立假圖 |

本輪沒有修改事件／共用行為，依範圍未重跑核心套件，也未新增CSS類別或固定字級測試；既有206項核心／mock結果仍是先前版本證據。沒有新增真人通過或自動瀏覽器通過紀錄。

**結論：步驟22的文字實作、版本、Prompt及程式檢查已完成；三尺寸／彈窗實際畫面及兩張前後比較原圖待補。** 完整對話、favicon、庫存門檻業務定義、既有建置警告與首頁D06文案待辦保留，不因本輪完成而消失。停止於22，未開始23。

## 收圖與本人操作回報（2026-10-18，最新）

本輪完整使用者Prompt：「圖片皆拍好，真人確認與測試皆成功。」記為**本人回報通過**，對應前述一次補證操作中的三尺寸首頁／庫存、手機導覽／表格及代表彈窗文字檢查。這不是助理自動瀏覽器、Console或44px量測通過，也不補造逐項操作影片或數據。

### 原圖保存與尺寸

實際來源為外層工作區`第三次拍照截圖`。兩張均已實際開啟及PNG解碼，逐位元複製到本目錄；來源保留，不覆寫舊檔，未裁切、縮放、修圖或改寫PNG。下表時間僅是檔案修改時間（Asia/Taipei），不單憑它宣稱為拍攝時間。PNG沒有Chrome／DPR／縮放元資料，這些精確設定仍未獨立確認。

| 來源完整路徑 | 本目錄副本 | 預定viewport／擷取 | 實際PNG像素 | SHA-256（來源＝副本） | 檔案修改時間 |
|---|---|---|---|---|---|
| `C:\Users\yanmo\OneDrive\桌面\創業課-倉儲管理\第三次拍照截圖\home-mobile.png` | [home-mobile.png](home-mobile.png) | 390×844／全頁 | 375×2898 | `0dd179fd720144bb1df54f6d671017daf329e50bf2fa3a4b2d764faabf67cfab` | 2026-10-18 10:02:28 +08:00 |
| `C:\Users\yanmo\OneDrive\桌面\創業課-倉儲管理\第三次拍照截圖\inventory-desktop.png` | [inventory-desktop.png](inventory-desktop.png) | 1440×900／可視範圍 | 1440×900 | `e24a186b0ae2feafc5b5079924e014407733fe46ff75f2c8c5046078f664365e` | 2026-10-18 10:05:41 +08:00 |

### 實際畫面與前後比較

- **首頁手機可用：** 與[初版首頁手機](../before/home-mobile.png)同為375px實際寬；姓名、關於我、技能名稱／程度、作品次標、正文及聯絡區可辨別，Email、複製按鈕及頁尾完整可見，沒有從這張圖看到文字被固定高度裁斷。全頁高度由2872變2898px，不要求等於viewport844px。原有相對預定viewport少15px寬的差異保留，原因未確認，不將它直接判成網站溢出，也不修圖湊尺寸。
- **桌機庫存文字可見：** [新桌機圖](inventory-desktop.png)為正確庫存清單，可見較大的頁標、表頭／說明、狀態標籤及靠右的庫存／補貨點／需求數字。Sarah、111 SKU、8品牌、5供應商、3／26／6／76狀態數、空搜尋、全部篩選與庫存低到高皆可讀，與修改前資料線索一致；總量2382與成本1456370未在圖內指標出現，不稱逐值看到。
- **桌機同條件比較仍有缺口：** [修改前有效圖](../round-1-layout/inventory-desktop-retake-2.png)最上方完整顯示「返回個人首頁」、保存狀態及說明；新圖最上方停在保存說明，返回列及主要狀態不在可視範圍內。垂直拍攝位置不同，疑似未回頁首，不能宣稱已符合相同捲動起點，也不據此判定網站按鈕消失。保留新圖作文字代表證據，但正式全畫面前後對照仍需1張桌機補圖。
- 右側部分欄位在表格容器的可視範圍外，與整頁拍攝位置差異分開；局部橫捲可到操作欄維持本人回報來源，圖片不冒充實際捲動測試。三尺寸及390×600彈窗沒有額外新圖，僅登記本輪本人回報，不要求重拍所有尺寸。

### 補證驗收

| 測試目的 | 測試輸入 | 預期輸出 | 實際輸出 | 問題與通過判定 |
|---|---|---|---|---|
| 原圖可讀與副本一致 | 兩來源PNG與副本 | 可開啟、來源副本SHA-256相同 | 2張均實際開啟與解碼，兩組雜湊一致 | 檔案檢查通過 |
| 首頁手機比較 | 初版375×2872與本輪375×2898 | 完整首頁，文字層級及長段落可比較 | 姓名／各區標題可辨，Email及頁尾完整，同寬原圖保留 | 靜態圖片檢查通過；既有15px差異保留 |
| 桌機指定畫面及尺寸 | 新桌機庫存圖 | 正確庫存清單、1440×900 | 頁標、搜尋／篩選／表格正確，像素符合 | 畫面／尺寸通過；不是全部拍攝條件通過 |
| 桌機前後拍攝位置 | 前後1440×900原圖 | 都在頁首、表格起點 | 新圖未顯示修改前最上方返回列，垂直位置不同 | 正式同條件對照待補，不填通過 |
| 本人操作來源 | 本輪使用者原話與既定補證流程 | 如實區分本人與自動結果 | 本人回報真人確認與測試皆成功 | 本人回報通過；非自動瀏覽器／Console／量測 |
| 保護範圍與既有檢查 | src／tests／設定、既有13PNG、兩標籤、原有lint／build | 只新增原圖與紀錄，保留程式及舊證據 | 程式仍f563658，未重跑測試；來源與舊圖保留 | 沿用既有型別／建置結果，不新增測試通過次數 |

**最新判定：步驟22的文字實作、型別／建置及本人操作回報已齊；收到2張原圖，首頁可作正式比較，桌機圖仍待同位置補拍1張。** 不改寫成步驟22全部證據完成。Console、44px實測、Chrome／DPR／縮放及拍攝時間的精確紀錄仍保留未獨立確認，不要求因此重做整套真人流程。未開始23。

### 唯一必要補圖

保持目前網站與示範資料，在「庫存管理動態」頁：

1. 確認DevTools裝置工具列為Responsive、1440×900、Desktop、DPR1；Chrome按`Ctrl+0`維持100%網頁縮放。
2. **先點庫存頁的主標題空白處，再按`Ctrl+Home`回到頁首**（不要把鍵盤焦點留在DevTools或輸入框）。應完整看到最上方「返回個人首頁」、保存狀態／說明，以及下方工具列與庫存頁標；若沒有，將網頁最右側捲軸拖到最上端。表格水平位置也回最左。
3. 保持Sarah、空搜尋、全部篩選、庫存低到高及無彈窗。DevTools按`Ctrl+Shift+P`，選`Capture screenshot`，另存`inventory-desktop-retake.png`至外層`第三次拍照截圖`。不要覆寫本次`inventory-desktop.png`，不用重拍首頁或重做功能測試。
