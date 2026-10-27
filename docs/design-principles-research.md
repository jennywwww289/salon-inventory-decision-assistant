# 步驟二十｜設計原則研究與應用計畫

- 整理日期：2026-10-18（Asia/Taipei）；官方來源於 2026-10-17～18 查閱，六頁相關段落於 2026-10-18 再核對。
- 狀態：**研究完成；步驟21～23僅規劃，尚未實作或驗收。** 步驟24為視需要追加，未認定必做。
- 研究時 HEAD：`5ef7a1af88c0abcccdf86499be5475fbb4ddbfee`；本輪開始工作區乾淨。
- 美化前程式：`pre-beautification-v1^{commit}` → `0a4d62020a8a33ce0337d2a790c73b80103d9411`。
- 原始版本：`original-baseline` → `2ad1f4dc9c22e56d242a030079a650a2a2a0c154`。兩標籤保持原指向。
- 依據：[初版自評](initial-self-evaluation.md)、[六圖規格與來源](screenshots/before/README.md)、[開發紀錄](development-log.md)、本輪實際讀取的元件及六張原圖。網站、模擬資料、原圖均僅供閱讀。
- [本輪完整使用者 Prompt](ai-conversations/2026-10-18-step20-prompt.md) 已保存；這不等於完整對話匯出。

## 一、官方來源與閱讀範圍

下列六頁均成功讀取相關段落，沒有以搜尋摘要代替正文；未另外廣泛搜尋。查閱日期使用本機時區，不把頁面更新日期當作查閱日期。W3C Understanding 文件是成功準則的說明資料，本研究不因此宣稱網站通過 WCAG 認證。

| 編號 | 來源標題／發布單位 | 完整連結 | 最後核對日期 | 實際閱讀章節與用途 |
|---|---|---|---|---|
| S1 | Relationship of grid layout to other layout methods／MDN Web Docs（Mozilla） | https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Relationship_with_other_layout_methods | 2026-10-18 | Grid and flexbox；One-dimensional versus two-dimensional layout；Content out or layout in?；判斷單向工具列與雙向卡片配置 |
| S2 | Using type／U.S. Web Design System（USWDS） | https://designsystem.digital.gov/design-tokens/typesetting/overview/ | 2026-10-18 | Normalization；Rem-based font sizing；Normalization and line height；Typesetting with tokens；字型、字級、行高的共同規則 |
| S3 | Button／USWDS | https://designsystem.digital.gov/components/button/ | 2026-10-18 | Usability guidance；Accessibility guidance；Using the button component；主要操作、狀態、焦點與原生按鈕 |
| S4 | Understanding SC 1.4.10: Reflow／W3C WAI | https://www.w3.org/WAI/WCAG22/Understanding/reflow.html | 2026-10-18 | Success Criterion；Intent；Basic text reflow；一般內容重排與資料表格例外 |
| S5 | Understanding SC 4.1.3: Status Messages／W3C WAI | https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html | 2026-10-18 | Success Criterion；Intent；Status message examples；Techniques 的 Situation A；不移動焦點的結果宣告 |
| S6 | prefers-reduced-motion CSS media feature／MDN Web Docs（Mozilla） | https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion | 2026-10-18 | 功能說明；Syntax 的 no-preference／reduce；User preferences；減少非必要動態效果 |

以下「來源原則」為自行歸納；字級、斷點、44px目標及動畫時長等「專案規格」是本專案規劃，不冒稱來源強制值。不安裝 USWDS，也不改用其他 CSS 框架。

## 二、三項原則

### 原則一：依內容維度選擇 Grid／Flexbox，窄版先保住可用寬度

**來源原則（S1、S4）：** 單列或單欄的項目配置適合 Flexbox，需要跨列、跨欄對齊時適合 Grid；不必把所有 Flex 改為 Grid。一般閱讀內容應隨可用寬度重排。Reflow 說明以等效320 CSS px寬度檢視直向閱讀內容，必要的二維資料表可例外，但不能把整頁導覽或一般文字都視為表格例外。[MDN Grid](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Relationship_with_other_layout_methods)、[W3C Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

**適用與專案用途：** 工具列／導覽沿用 Flex 並允許合理換行；搜尋與狀態篩選在空間不足時分列。卡片若需要列欄對齊才沿用／採用響應式 Grid。資料表保留語意與足夠欄寬，橫向捲動限定在表格容器，不靠縮小字體或整頁裁切解決。

**本專案規格，預定步驟21：**

- 以現有 Tailwind／React 完成；窄版導覽不持續占用256px主欄寬度，先考慮可收合且可鍵盤操作的原生按鈕入口。暫以既有 `lg`（預設1024px）評估常駐側欄的切換點，實作時依內容核對，不當成裝置型號保證。
- 主內容可縮放（例如 `min-w-0`）；工具列容許高度隨換行成長。主要操作、導覽與關閉按鈕規劃至少 **44×44 CSS px**，這是專案驗收目標，**不是概括所有 WCAG AA 情境的要求**。
- 庫存表格已有 `overflow-x-auto`，保留並補足表格／欄位最小寬度；SKU與數字避免逐字斷裂，商品長名可合理換行。不要用 `body overflow-x:hidden` 隱藏未解決的溢出。
- 彈窗按內容需要設定可用高度與內部捲動；欄位在窄版重排，標題、錯誤、確認／取消／關閉皆可到達。不能因部分彈窗已有捲動便假定全部合格。
- 比較仍用1440、820、390三種既定寬度；另將320 CSS px一般內容重排列為未來邊界檢查，非本輪實測或新增基準截圖。

### 原則二：用少量字級、字重與行高建立可掃讀的文字層級

**來源原則（S2）：** 字型、字級與行高應一起決定；相同像素的不同字型可能看起來大小不同。相對字級及無單位行高有助於維持一致尺度。這不表示只放大標題就能改善所有資訊層級。[USWDS Using type](https://designsystem.digital.gov/design-tokens/typesetting/overview/)

**適用與專案用途：** 首頁的作品名稱、次標題、長段限制需要可掃讀的區別；庫存表格的商品名／SKU／庫存數／狀態不可都依賴小字。沿用 `src/index.css` 與現有元件字型設定及數字樣式，不新增字型或套件；不照搬英文每行字數作中文硬性標準。

**本專案初步尺度，預定步驟22：** 下表是後續實作目標，px僅為根字級16px時的對照；不鎖定根字級，不裁掉使用者放大的文字。字重主要用400／500／600／700。

| 文字角色 | 規劃字級 | 字重／無單位行高 | 應用位置 |
|---|---|---|---|
| 頁面主標題 | 窄版1.5rem（24px），寬版最高2rem（32px） | 700／1.25～1.35 | 首頁h1、庫存頁h1 |
| 區塊標題 | 1.25rem（20px） | 600或700／1.4 | 首頁h2、彈窗標題 |
| 次層標題 | 1rem（16px） | 600／1.5 | 技能h3、作品h3／h4；同級一致、用群組間距區分 |
| 主要內文 | 1rem（16px） | 400／1.6 | 自介、作品段落、重要錯誤說明 |
| 標籤／表格主要資料 | 0.875rem（14px） | 400或500，表頭600／1.5 | 搜尋篩選、商品資訊、表單標籤 |
| 輔助文字／數字 | 輔助至少0.75rem（12px），關鍵數字至少0.875rem | 輔助400、關鍵600／1.5 | SKU、單位、狀態及庫存；沿用tabular數字，另以明確標籤區分 |

狀態保留文字，錯誤保留原因，不只改顏色。數字對齊與單位一致，但不改任何庫存、金額、計算公式或真實個人資料。這輪只研究，未將上述尺度套用到網站。

### 原則三：互動狀態須清楚、可鍵盤操作，回饋須符合真實結果

**來源原則（S3、S5、S6）：** 操作元件要有明確動詞與可辨識的預設、hover、按下及焦點狀態；優先使用原生按鈕，停用外觀不能代替實際阻擋。沒有取得焦點的結果訊息仍應能被輔助技術辨識。尊重減少動態效果的偏好，減少非必要動作，但保留資訊。[USWDS Button](https://designsystem.digital.gov/components/button/)、[W3C Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)、[MDN reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)

**適用與專案用途：** 首頁入口、複製Email、篩選、角色切換及表單確認／取消需要一致的回饋。複製Email已有真實Promise判斷、停用與 `role="status" aria-live="polite"`，應保留；現有業務驗證失敗的 `role="alert"` 也不移除。

**本專案規格，預定步驟23：**

| 狀態 | 預定呈現與限制 | 驗收方式（未執行） |
|---|---|---|
| Hover／按下 | 使用輕微背景、邊框等變化；不以hover作唯一開啟方法，不用位移改變點擊位置 | 滑鼠與按下狀態對照，觸控仍有可用入口 |
| 鍵盤Focus | 延續已有 `focus-visible`，主要操作規劃2px輪廓與2px間距；不被容器裁掉 | Tab可到達，Enter／Space按原生語意操作，焦點可見；選單能開關且焦點合理返回 |
| 停用 | 用原生disabled及明確狀態文字；需要保持可聚焦時才考慮aria-disabled並保留程式防護 | 外觀與可操作性一致；原有共用入口防重不改 |
| 等待 | 只有真實非同步等待才顯示忙碌，例如剪貼簿Promise；不為同步採購操作製造等待或假載入 | mock延後Promise時才呈現等待，未完成前不顯示成功 |
| 成功／錯誤 | 文字具體，成功只依實際結果；保留輸入及完整Email，不用alert取代頁面回饋 | 既有成功、拒絕、不支援案例分開核對，訊息能被適當live region宣告 |
| Transition／減少動態 | 暫定120～180ms的顏色／邊框過渡；`prefers-reduced-motion: reduce` 時取消非必要動畫、縮放／位移及過渡，保留即時文字與焦點 | 一般與reduce偏好對照；不閃爍、不影響業務狀態與資訊 |

上述輪廓尺寸、過渡時長是本專案選擇，不是來源硬性數字。現有 `ServiceUsageModal.tsx:53` 的1200ms為成功後關閉定時器，不是等待實際寫入；不得在定時器之前宣稱「仍在處理」。訊息是否停留足夠尚待驗證，若需改善，只限回饋呈現，不改領料結果。

## 三、六張原圖觀察與問題對照

本輪實際開啟六張原圖，並讀取以下元件。首頁三尺寸皆可見五區段及頁尾；沒有從首頁寬少15px推斷網站溢出。桌機庫存圖可作可讀欄位參照；平板與手機問題有直接圖片依據。下列程式行號以研究時版本為準，之後修改可能移動。

| 問題／證據等級 | 證據位置 | 相關檔案與元件 | 原則 | 預定步驟 | 修改方向 | 驗收方式 |
|---|---|---|---|---|---|---|
| D01：固定側欄壓縮主內容，原圖確認 | [inventory-mobile.png](screenshots/before/inventory-mobile.png) 左側0～255px與右側主欄；[inventory-tablet.png](screenshots/before/inventory-tablet.png) 同位置 | [Sidebar.tsx](../src/components/layout/Sidebar.tsx):85 的w-64／shrink-0；[App.tsx](../src/App.tsx):40–42 | 一 | 21 | 窄版改不持續占位的導覽；main有可縮放寬度，九頁與Provider不改 | 390／820的標題、搜尋及主要內容有可用寬度；導覽開關與返回可達；非表格一般內容無橫向溢出 |
| D01：手機工具列文字直排、領料按鈕突出，原圖確認 | inventory-mobile.png 頂部品牌／角色區與「現場領料」長按鈕 | [Header.tsx](../src/components/layout/Header.tsx):32 的h-16、63–101；[DataStorageStatus.tsx](../src/components/layout/DataStorageStatus.tsx):17–19已有flex-wrap | 一 | 21 | 工具列可分列且高度自適應；保留保存狀態與既有按鈕，不靠隱藏重要文字處理 | 390／820工具列不覆蓋主標題，領料／通知／角色可達；既有保存說明可換行 |
| D02：搜尋框擠小、表頭／內容碎裂，原圖確認 | inventory-tablet.png 搜尋區只見窄輸入框，表格y約565以下；手機圖的右側窄欄 | [InventoryView.tsx](../src/components/inventory/InventoryView.tsx):119–167、239–252；已有overflow-x-auto，table僅w-full | 一 | 21 | 搜尋／狀態分列、篩選換行；表格設定合理最小欄寬及局部橫捲，不刪欄位 | 完整SKU可輸入；篩選可到達；庫存／單位／SKU可讀，右側欄在表格內可捲到；頁面本體不橫捲 |
| 彈窗短螢幕可達性：疑似，待測試；不能稱已發生遮擋 | 六張原圖都沒有彈窗；依程式推測 | [ServiceUsageModal.tsx](../src/components/modals/ServiceUsageModal.tsx):62–63無高度限制／捲動；[NewProductModal.tsx](../src/components/modals/NewProductModal.tsx):62、78已有max-h／overflow，80、106有固定2／3欄；[NewPOModal.tsx](../src/components/modals/NewPOModal.tsx):108、119–121；[ProductDetailModal.tsx](../src/components/products/ProductDetailModal.tsx):123、224已有內部捲動 | 一 | 21 | 沿用已可用捲動，僅補不足的高度與窄版欄位；不重做彈窗架構 | 390×844及短高度390×600，標題／錯誤／底部確認與關閉能捲到並鍵盤到達；未操作前維持待驗證 |
| D03：首頁作品次層級接近、系統小字密集，視覺觀察 | [home-desktop.png](screenshots/before/home-desktop.png)、[home-tablet.png](screenshots/before/home-tablet.png)、[home-mobile.png](screenshots/before/home-mobile.png) 作品及限制；庫存桌機／平板表頭與SKU | [PersonalHome.tsx](../src/components/home/PersonalHome.tsx):48、61、95–126；InventoryView:128、141、242；[src/index.css](../src/index.css) | 二 | 22 | 套少量一致文字角色；保留完整文案，重點數字／狀態與輔助資訊分級 | 同三尺寸辨識頁標題、區塊、內文、標籤；字級／行高符合本規劃或有理由記錄調整；放大不裁字 |
| D04：主要目標未保證44px，程式確認；真實觸控待驗證 | home-mobile.png 頂部五個導覽緊排；庫存頁控制列 | PersonalHome:36–41導覽僅hover；Header:67、77；InventoryView:153、177等僅padding；部分入口已有min-h-11 | 一／三 | 21尺寸；23狀態 | 補足主要點擊區；不把所有現有按鈕判為不合格，也不靠放大圖示充當點擊區 | 實作後量測主要目標44×44 CSS px並確認不重疊；目前未量測、不填通過 |
| D04：角色選單只依hover展開，程式確認；觸控／鍵盤效果待驗證 | 六圖均未展開選單；不是由截圖確認操作失敗 | Header:89–101外層div／group-hover，沒有可聚焦開關按鈕 | 一／三 | 21入口可操作；23焦點／狀態 | 21以原生按鈕及明確開關取代hover-only入口；23統一focus／pressed呈現，不新增權限功能 | Tab可開啟、選擇、關閉；窄版可點擊；角色仍僅示範，未操作前不宣稱通過 |
| D05：互動樣式／減少動態規則未統一，程式依據；動態效果待驗證 | 首頁原圖只有靜態預設狀態，無法證明hover／focus／動畫效果 | PersonalHome:54、142、167有hover與focus但未統一transition；Header:57 animate-pulse；Sidebar:124 transition-colors；ServiceUsageModal:83有縮放類；src/index.css未見reduce規則 | 三 | 23 | 統一狀態與適量過渡、補reduce；保留Email結果與現有錯誤宣告 | 以鍵盤、一般／reduce偏好及既有mock核對；截圖不足的動態結果另記，不冒充已實測 |
| D06：首頁驗收限制文案落後於本人A～E通過紀錄，已確認 | 首頁三圖作品「目前限制」第二點；開發紀錄步驟18及最新彙總 | PersonalHome:129；[initial-self-evaluation.md](initial-self-evaluation.md) D06 | 內容正確性，非本輪三原則的改寫任務 | 後續內容核對待辦，未納入21～23主要問題 | 保留初版原貌；收尾時只按已有證據更新驗收範圍 | 區分本人回報、核心mock與未做的瀏覽器／全面驗收；本輪不改寫 |

卡片另外確認：[DashboardView.tsx](../src/components/dashboard/DashboardView.tsx):122已有單欄／lg三欄Grid，413已有單欄／lg雙欄；這是既有實作，不列為已確認缺點。主欄寬度修正後再核對卡片長文字及按鈕，缺少卡片窄版截圖，不預先宣稱合格或故障。首頁技能目前是清單，也不強制為研究而改成卡片。

## 四、三輪獨立範圍與證據計畫

每輪只解決下表一類主要問題；記錄原因、實際修改及受影響範圍。不修改庫存／帳本／採購／保存／角色示範規則，不新增套件或重構Provider。必要的窄版導覽開關屬21的排版可操作性；23僅整理其狀態與焦點，不重做導覽。

| 步驟／唯一主要問題 | 預計修改位置與原因 | 修改前後代表畫面 | 驗收條件與證據狀態 |
|---|---|---|---|
| 21 第一輪：窄版主內容被導覽與控制列擠壓 | App、Sidebar、Header、InventoryView；必要時局部修正上述代表性彈窗與卡片容器。釋放主欄、重排控制列及保住資料欄寬 | 庫存三尺寸為主；首頁三尺寸確認導覽尺寸；領料／新增商品／採購彈窗僅於同條件加拍需要的代表畫面；卡片在受影響窄版核對 | 一般內容不因固定側欄／工具列出框；表格局部捲動；主要目標44×44；彈窗內容與按鈕可達；保留九頁及資料。既有六圖可作初版參照；新增彈窗前圖、實作、版本、後圖及實際操作證據均待完成 |
| 22 第二輪：資訊角色不易快速區分 | PersonalHome、InventoryView、Header及代表性彈窗；必要時以少量共用樣式統一文字尺度，沿用現有字型 | 首頁三尺寸的作品／技能／聯絡；庫存三尺寸的標題／表頭／SKU／庫存／狀態；代表性錯誤說明。每對前後使用相同捲動位置 | 依二節文字角色核對字級／字重／行高；重要內容不只靠色彩；不裁切完整個資／文案或改業務數字。以21完成版本當直接前圖；版本、直接前圖與後圖待完成 |
| 23 第三輪：操作狀態與回饋不一致 | PersonalHome、Header、Sidebar、InventoryView及相關彈窗的狀態樣式；必要的src/index.css reduced-motion規則 | 沿用三尺寸基準；同位置補入口／選單的hover、focus、pressed、disabled狀態；複製Email成功／失敗；代表性表單錯誤 | 按鈕可鍵盤操作、焦點可見；成功與失敗依原結果；等待只來自真實非同步；保留aria-live；reduce不播放非必要動態。以22版本為直接前圖；mock／鍵盤／偏好操作及後圖均待完成 |

步驟24只在21～23後仍有明確需要時，追加配色、圓角、邊框或陰影整理；目前未授權執行、未產生版本或證據，不預先認定必做。

### 共用拍攝與版本規則

1. 保留before六張原檔與[原規格](screenshots/before/README.md)，不覆寫、縮放、補邊、裁切或修圖。原圖實際尺寸如下；首頁少15px仍屬拍攝差異，原因未確認，不能轉寫為網站溢出。
2. 同一來源 `http://localhost:3000/`，用隔離且確認為預設資料的環境，避免重設一般視窗使用者資料。預設Sarah／Owner；111 SKU、2382件、庫存成本NT$1,456,370來自既有初始化計算紀錄，不稱全部已從六圖逐值核對。
3. CSS視窗為1440×900、820×1180、390×844；DPR1、網頁縮放100%、Responsive、Device type Desktop。原Chrome155.0.8059.80，原拍攝2026-10-17 22:35～22:41（Asia/Taipei），條件由本人確認。後續記錄實際日期／版本；若瀏覽器更新，不假裝相同版本。
4. 首頁拍全頁、庫存拍可視範圍；搜尋空白、全部篩選、預設stock-asc、無彈窗／選單、未操作複製、頁面與表格回起點；只導覽、不新增／領料／採購。狀態或彈窗補圖另外標明操作與資料條件，不與六張預設狀態混用。
5. 每輪直接比較「上一輪已保存版本→本輪版本」，並保留初版作共同參照；前圖若尚未拍，不能事後把後版當前版。圖片分存 `docs/screenshots/iteration-21/{before,after}/`、`iteration-22/{before,after}/`、`iteration-23/{before,after}/`，本輪僅規劃路徑，不建立假圖。
6. 每輪將實際Prompt原文存入現有ai-conversations索引，原因與結果追加同一development-log；記錄commit短雜湊及相關檔案，工作區有未提交變更則另記差異，不移動兩個基準標籤。
7. 圖片可證明靜態版面；開關、捲動、focus、結果與reduce仍需相應操作證據。瀏覽器工具已知不可用，本輪不重試；未來工具仍受限時，如實保留缺口，必要人工確認集中處理，不每輪重跑九頁。

| 畫面 | CSS視窗 | 擷取方式 | 初版原圖實際像素／檔案 |
|---|---|---|---|
| 首頁桌機 | 1440×900 | 全頁 | 1425×2378／[home-desktop.png](screenshots/before/home-desktop.png) |
| 首頁平板 | 820×1180 | 全頁 | 805×2378／[home-tablet.png](screenshots/before/home-tablet.png) |
| 首頁手機 | 390×844 | 全頁 | 375×2872／[home-mobile.png](screenshots/before/home-mobile.png) |
| 庫存桌機 | 1440×900 | 可視範圍 | 1440×900／[inventory-desktop.png](screenshots/before/inventory-desktop.png) |
| 庫存平板 | 820×1180 | 可視範圍 | 820×1180／[inventory-tablet.png](screenshots/before/inventory-tablet.png) |
| 庫存手機 | 390×844 | 可視範圍 | 390×844／[inventory-mobile.png](screenshots/before/inventory-mobile.png) |

## 五、既有證據與仍待完成的事項

- **已有實作及舊證據：** 共用資料與九頁、首頁切換、驗證、出入庫／帳本、採購防重與本機保存已存在；既有204項核心／handler／mock通過、本人A～E回報通過，以及複製Email既有5項mock證據，分別保留。不合併為歷史去重總數，不改稱瀏覽器端對端測試，本輪未重跑。
- **研究已完成：** 六個官方來源相關段落、三項原則、六圖觀察及程式位置、三輪範圍／驗收及證據計畫。
- **預定修改：** 步驟21～23全部仍待開始；本輪沒有產生改版程式、改版操作結果或前後比較圖片。
- **未驗證：** 真實觸控／鍵盤／螢幕閱讀器、彈窗短高度、動畫與reduce、320px邊界及新增長字串情境；自動瀏覽器／Console仍未執行。靜態程式與原圖不替代這些操作。
- **既有待辦保留：** favicon 404與既有建置警告、零需求與庫存門檻業務定義、D06驗收說明更新；完整主線／分支對話匯出仍0檔，另保存的本輪單則Prompt不冒稱完整紀錄。這些不擴張為本輪網站修改。

## 六、本輪文件檢查

本輪只作文件／證據檢查，不執行lint、build、功能測試、瀏覽器操作或真人驗收。下列通過只代表研究文件符合本輪要求。

| 測試目的 | 測試輸入 | 預期輸出 | 實際輸出 | 問題與通過判定 |
|---|---|---|---|---|
| 三項研究完整 | 六個官方頁面與三節原則 | 每項有來源、章節、日期、重點與應用 | 六來源正文可讀；三原則分列來源與專案規格 | 文件審查通過；不代表網站已符合原則 |
| 問題有實據 | 六張PNG、自評D01～D06及實際元件 | 可查圖或程式；推測另標待驗證 | 六圖已開啟，問題矩陣列元件與行號；彈窗／動態缺口分開 | 文件審查通過；未操作項目仍未驗證 |
| 三輪獨立且可驗收 | 第四節三輪表 | 每輪一主要問題、位置、代表畫面與條件 | 21排版、22文字、23狀態；24僅選做，新增證據均待完成 | 範圍檢查通過；三輪未實作 |
| Prompt與索引 | 原使用者訊息、Prompt檔、對話README | 完整本輪原文可讀，有實際索引 | 已保存單則Prompt全文，歷史／完整回覆缺口仍明列 | 文件檢查通過；完整對話尚未保存 |
| 保護原始網站與證據 | 本輪前後檔案SHA-256、Git差異與兩標籤 | 只新增／追加研究與紀錄；程式及六圖不變 | 前後44個受保護檔案雜湊一致，兩標籤提交不變；差異限本輪4份Markdown | 靜態範圍檢查通過；未重跑任何功能測試 |
