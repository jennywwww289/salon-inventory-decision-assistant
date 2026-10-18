# 第三輪：互動回饋與證據

日期：2026-10-18（Asia/Taipei）。**步驟23的實作、相關mock及型別／建置檢查完成；真實瀏覽器、動態效果及本輪狀態截圖尚未驗證。** 依本輪指示，不安排例行真人測試，不要求重拍，不以等待補圖作為停止點。**步驟24依使用者指示跳過**；停止於23，下一輪再進行25。

## 起點、版本及範圍

- 開始HEAD：`aef37a0e834c624dc1784183648e840ee3c448f5`；當時網站程式仍為第二輪`f56365833ac1c8cbcdc22b3e26c5e2803537bf3c`。
- 本輪程式／測試／Prompt：`f84cf5e2bb7fe67656a0d597c172530c5c16d4d6`，14個程式／CSS檔、1個既有測試檔、1份完整Prompt，共16檔；僅本機保存，未推送。
- 起點未提交：`docs/development-log.md`、`docs/ai-conversations/README.md`；未追蹤：`docs/design-principles-research.md`、`docs/ai-conversations/2026-10-18-step20-prompt.md`。保留既有內容，兩份共用紀錄只追加；未把上述既有工作混入本輪提交。
- `original-baseline`仍對應`2ad1f4dc9c22e56d242a030079a650a2a2a0c154`；`pre-beautification-v1`仍對應`0a4d62020a8a33ce0337d2a790c73b80103d9411`。未移動標籤、未改寫歷史。
- [本輪完整Prompt](../../ai-conversations/2026-10-18-step23-prompt.md)、[開發紀錄第46節](../../development-log.md)、[研究原則三](../../design-principles-research.md)、[第一輪證據](../round-1-layout/README.md)、[第二輪證據與擷取限制](../round-2-typography/README.md)。完整主線／分支對話仍未匯出，不以Prompt或摘要冒充。

## 互動盤點與實作

沿用步驟20原則三的原生控制項、真實結果、狀態訊息及減少動態效果；這次讀取既有研究，不將它寫成本輪重新查閱全部官方網站。160ms、2px焦點輪廓及3px間距是本專案選擇，不冒稱為官方統一硬性數字。

| 元件 | 已有狀態 | 缺少回饋／限制 | 本輪處理方式 |
|---|---|---|---|
| 首頁入口、mailto、複製Email | 原生button／a、部分hover／focus；複製有ref防重、disabled、aria-busy、Promise及單一live訊息 | 各元件按下與焦點規格不一致，等待按鈕原文不變，成功／失敗同色 | 共用160ms與focus-visible／按下；等待時按鈕顯示「正在複製…」，沿用原有等待訊息；成功／錯誤另有狀態樣式。handler及copyEmail工具完全不改 |
| 系統按鈕、輸入、搜尋篩選 | 原生控制項、事件與條件式選取樣式 | 缺少一致焦點／按下／停用外觀，篩選選取與結果未宣告 | 在系統scope套用狀態；庫存篩選補aria-pressed，既有結果數補單一role=status。不增加等待、spinner或延遲 |
| 手機導覽與角色開關 | 原生button、aria-expanded／controls、Esc／離焦；Sidebar已有aria-current | 焦點與展開中的視覺回饋未統一 | 沿用全部事件，增加共用focus及展開狀態標示；保留尺寸／收合／Provider。不新增遮罩或重寫導覽 |
| 領料表單成功／失敗 | 共用寫入成功才顯示正確剩餘量；失敗保留表單與具體原因 | 成功只有1200ms即自動關閉，缺少明確成功live語意與手動完成入口 | 移除自動關閉計時，成功結果保留到「完成並關閉」或X；成功文字有role=status，完成鈕為原生button並宣告autoFocus。實際焦點／輔助技術效果待瀏覽器驗證 |
| 保存狀態與既有表單錯誤 | 持續的保存狀態、明確保存失敗警告、role=alert／status | 保存錯誤role=alert卻固定polite；錯誤辨識樣式分散 | 保存失敗使用assertive、正常polite及aria-atomic；仍同一個訊息節點，沒有新增toast覆蓋。錯誤保留具體文字及紅色側線，不只靠顏色 |
| 卡片、健康率條與既有動畫 | 多處transition-all，原有pulse等示意效果 | 轉場屬性過廣，沒有統一reduce處理 | 卡片限定border-color／background-color／box-shadow，健康率條只width；160ms。reduce時在本專案scope內取消動畫、transition與平滑捲動，保留文字與焦點 |

### 共用狀態規格

| 狀態 | 實作與限制 |
|---|---|
| Hover | 僅具hover能力時，按鈕加同色系淡覆層、連結加底線、表單邊框加深；保留原有色系與事件，不把hover當作顯示功能的前提 |
| Focus-visible | 主要原生控制項、連結與tabindex=0捲動容器，2px綠色outline／3px offset；不改寬高或字級 |
| 按下／選取 | 啟用按鈕有較深覆層及內框，連結有淡綠底；aria-expanded／aria-pressed配合既有選取樣式。沒有縮放、位移或整頁動畫 |
| 停用 | 原生disabled維持實際限制，opacity 0.55及not-allowed；複製真實等待另為progress。CSS不取代disabled或共用防護，沒有新增只有透明度的假停用 |
| 成功／錯誤 | 結果依正式操作回傳；複製成功與失敗沿用單一polite live節點；錯誤保留手動處理說明與輸入。領料成功保留到使用者關閉 |
| 真實等待 | 只有Clipboard Promise未完成時顯示忙碌與防重；沒有新增同步搜尋／採購的假spinner或人工延遲 |
| 動態與reduce | 正常160ms、明列transition-property；reduce取消本專案範圍內非必要動畫／轉場／平滑捲動。實際作業系統偏好與動畫流暢度未實測 |

`feedback-scope`只套用於首頁、系統與保存區域；沒有跨網站全域button／a／svg規則。狀態內框及覆層只在互動時生效，不做步驟24的整站配色、圓角、邊框或陰影改版。第一、二輪原CSS完整保留為前綴，原有44px系統控制項規則未縮小；實際44px量測缺口不因此填通過。

## 修改檔案與保護範圍

- `src/index.css`：scope內hover／focus／active／disabled、成功／錯誤、160ms明列屬性及reduce規則。
- `src/App.tsx`：只在系統根節點加入scope，Provider、路由分頁與事件不變。
- `src/components/home/PersonalHome.tsx`：首頁scope、忙碌按鈕文案與既有訊息的data-feedback；Email常數、mailto、複製handler與工具不改。
- `src/components/inventory/InventoryView.tsx`：篩選aria-pressed與結果數role=status；搜尋、篩選、排序、庫存與統計不改。
- `src/components/layout/DataStorageStatus.tsx`：保存區scope與live語意；重設及保存處理不改。
- `src/components/modals/ServiceUsageModal.tsx`：成功訊息保留、手動關閉／重開清除本次成功畫面、單一成功status及快捷數量aria-pressed。送出驗證、帶號量、recordTransaction呼叫及成功判斷不改。
- `src/components/layout/Sidebar.tsx`：原transition-all duration-500只改為width／160ms的feedback-meter。
- `src/components/{brands/BrandsView,dashboard/DashboardView,insights/AIInsightsView,products/ProductsView,purchase/PurchaseOrdersView,suppliers/SuppliersView,users/UsersView}.tsx`：僅把卡片transition-all換成feedback-card，既有內容、事件、角色與示範標示逐字保留。
- `tests/dataValidation.test.ts`：調整2處舊自動關閉預期，改以正式「完成並關閉」按鈕繼續流程；新增4項正式handler／受控Promise測試。沿用原runtime／Context／mock storage，沒有框架或CSS字串測試。

核心Context、驗證／庫存／採購／統計／保存工具、型別、模擬資料、copyEmail工具、套件及設定未修改。所有16張既有PNG保留，不讀取真實剪貼簿、不操作使用者日常LocalStorage、不寄信或呼叫外部服務。

## 測試結果與證據層級

| 測試目的 | 測試輸入 | 預期輸出 | 實際輸出 | 問題與通過判定 |
|---|---|---|---|---|
| Clipboard工具既有回歸 | `node --import tsx --test tests/copyEmail.test.ts`，mock writer成功／延後／拒絕／缺API／缺方法 | 成功只在Promise完成後，失敗不拋未處理錯誤 | 5／5、0失敗，exit 0 | 工具mock通過，不是真實剪貼簿 |
| 等待及成功UI handler | 受控未解決Promise、重複直接呼叫，再resolve | busy／disabled、一次完整Email寫入、完成前無成功，完成後恢復 | 收到指定Email一次；等待狀態正確，成功後disabled=false及一個live節點 | 新增1項handler mock通過；非DOM原生停用驗收 |
| 拒絕及不支援UI handler | reject Promise；navigator缺Clipboard | 失敗與手動複製說明、恢復按鈕、保留Email／mailto | 兩情況均為error，沒有成功結果或未處理錯誤 | 新增2項handler mock通過 |
| 領料成功停留與關閉 | 正式表單庫存10領3，重render，點完成／重開 | 7及一筆-3；無計時關閉；手動關閉不再寫入 | 單一status顯示7、timer 0；關閉／重開後核心資料不變 | 新增1項正式handler／Context mock通過；非真人連點或焦點測試 |
| 受影響既有回歸 | 領料無效／超量／歸零、Step17隔離A～E、導覽／角色Esc、保存失敗與重設 | 仍按原規則、輸入保留、資料一致 | 連同上述4項新案例，選取檔案共17／17、0失敗，exit 0 | 核心／handler／storage mock通過；17含Step17父與5子，不是17種獨立真人流程 |
| 型別檢查 | `npm.cmd run lint`一次 | tsc成功、exit 0 | `tsc --noEmit`，exit 0 | 通過 |
| 正式建置 | `npm.cmd run build`一次 | Vite產物成功、exit 0 | Vite8.3.4、1686模組，JS484.05kB／CSS48.64kB，exit 0 | 通過；既有`__dirname`警告保留 |
| 範圍／舊證據 | 起點58檔雜湊、差異與CSS前綴 | 僅14程式／CSS及1測試變動，其餘保留 | 43受保護檔不變，含全部16舊PNG；原排版／文字CSS前綴不變；複製／重設handler及庫存驗證／寫入呼叫不變 | 靜態檢查通過，不是畫面驗收 |
| 真實瀏覽器與動態 | Tab、Enter／Space、原生disabled、autoFocus、reduce、Console與動畫 | 有實際操作證據才判定 | 瀏覽器工具沿用不可用狀態，本輪未重試、未安裝框架、未執行 | 尚未驗證，集中留後續驗收；不安排本輪真人操作 |

本輪兩個測試指令各一次、lint與build各一次，沒有失敗重跑。未重跑整套原206項；以上17＋5是本輪兩個分開命令的實際計數，不能加到歷史204／206或當成22個去重真人情境。既有Step17 mock使用獨立fixture，輸出TEST17-001、庫存10→7→12只屬mock，不是在日常瀏覽器新增測試商品。

## 截圖計畫與目前缺漏

**本目錄目前只有README，狀態前後圖0／2，沒有假圖。** 既有第二輪首頁可作預設文字背景參照，不能冒充第三輪focus／active狀態的修改前圖。本輪開始版已保存，可在後續允許的隔離環境取得對照；本輪不切換／重設目前工作區來補圖。

| 預定證據 | 修改前版本 | 修改後版本 | 相同條件 | 檔名／目前狀態 |
|---|---|---|---|---|
| 領料表單確認按鈕鍵盤焦點 | aef37a0（程式f563658） | f84cf5e | viewport390×600、DPR1、100%，同預設示範角色／商品、數量1、不提交；彈窗捲到相同底部，按鈕皆有鍵盤焦點 | `service-submit-focus-before.png`、`service-submit-focus-after.png`：均待後續工具或集中驗收；實際PNG尺寸未確認 |
| 最少量結果補充，視工具能力 | 使用已保存版本，不能補造 | f84cf5e | 真實等待／受控mock須分開；成功與失敗各保留明確輸入／結果，沿用相同資料來源 | 複製結果或領料成功代表證據尚缺，不在本輪要求人工拍攝 |

既定參照仍為桌機1440×900、平板820×1180、手機390×844；本輪代表彈窗沿用既有短高度390×600。後續若拍攝，須記錄viewport、實際PNG像素、DPR、Chrome／縮放、狀態及時間；未確認數字不能沿用舊值冒稱本輪實測。靜態圖片不證明動畫流暢、原生鍵盤或真實Clipboard成功。

### 三輪證據是否齊全

| 輪次 | 已保存 | 尚缺／限制 |
|---|---|---|
| 第一輪排版21 | 程式fc2b0ab、完整Prompt、7張原圖副本中的5張正式比較、本人操作回報 | Console／44px獨立量測及部分精確拍攝設定仍未確認 |
| 第二輪文字22 | 程式f563658、完整Prompt、首頁及兩張桌機原圖共3張；本人回報操作通過及返回按鈕實際可見 | 桌機PNG未包含返回列，嚴格同位置擷取對照缺漏仍保留；首頁少15px寬的既有輸出差異未推定為網站溢出 |
| 第三輪互動23 | 本輪程式／測試／Prompt、互動盤點與本README、相關mock及型別／建置紀錄 | 修改前後狀態圖片、真實瀏覽器／reduce／動畫／輔助技術／Console尚缺；本輪不要求補拍 |

**三輪程式修改已分別保存，三輪美化證據尚未齊全。** 缺漏集中留待後續必要驗收與作業收尾，不新增本輪真人操作清單；本輪工作不因等待補圖而停留未交付。步驟24依使用者指示跳過，未開始25。完整對話、favicon、Vite警告、庫存門檻業務定義及首頁D06文案待辦仍保留。
