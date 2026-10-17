# 第一輪：排版｜版本與截圖證據

日期：2026-10-18（Asia/Taipei）。

**目前判定：程式已實作，型別／建置及206項核心／handler／mock通過；三尺寸畫面、真實點擊、尺寸量測、Console與修改後截圖待補。** 瀏覽器工具沿用已知不可用的限制，本輪沒有重試或安裝其他瀏覽器框架。

## 版本與保留範圍

- 本輪開始HEAD：`5ef7a1af88c0abcccdf86499be5475fbb4ddbfee`。
- 開始時已有步驟20的未提交變更：`docs/development-log.md`、`docs/ai-conversations/README.md`，以及未追蹤的研究文件與步驟20 Prompt。全部保留，沒有混入本輪程式提交。
- 本輪程式提交：`fc2b0ab2788ad878a3a0b6b8b40e3b32e73f6bea`（`style: improve responsive system layout`）。含13份程式／樣式、1份既有測試檔及[本輪完整Prompt](../../ai-conversations/2026-10-18-step21-prompt.md)，共15檔；只作本機提交，未推送。
- 提交時src與tests共32檔的內容指紋：`83974450c81c97c482082a6e899f07ca0109c31155f0aaa1a70687ed84863bbc`。算法：相對路徑使用斜線，各檔SHA-256按路徑排序後以無空白JSON串接，再取SHA-256。
- `original-baseline`仍為提交`2ad1f4d`；`pre-beautification-v1^{commit}`仍為`0a4d620`，未移動標籤。
- 本README、開發紀錄及對話索引在程式提交後補記，與上列程式版本一致；補記不代表已有圖片。既有步驟20文件不改寫。
- 首頁程式、自介、Email、文字層級、配色／字體、庫存／帳本／採購／驗證／統計／LocalStorage及模擬資料未改。沒有新增套件或業務功能。

## 問題 → 研究原則 → 修改 → 驗收

研究依據：[步驟20文件](../../design-principles-research.md)的原則一與D01／D02／D04；下表是本輪實作，不改寫原研究當時的「尚未實作」紀錄。

| 原有問題／證據 | 研究原則 | 修改位置與原因 | 已取得的驗收證據 | 尚待補證 |
|---|---|---|---|---|
| 手機側欄固定256px，主欄被擠壓；初版手機／平板圖可見 | 窄版重排，單向配置沿用Flex | App、Sidebar、Header：小於lg時改為可展開的整列導覽；主欄min-w-0、16／24／32px響應式留白；保留九頁及單一Provider | 正式App／Sidebar事件mock驗證切頁、Esc收合及回傳focus呼叫；往返後分頁／核心資料不變 | 真實三尺寸、Tab順序、焦點位置及導覽完整捲動 |
| 工具列固定高度、角色只靠hover；窄版文字直排及按鈕突出 | 依內容換行，提供可操作入口 | Header：取消固定h-16，品牌／主要操作可換列；角色改原生button開關、Esc／離焦收合；沒有改角色能力 | Header正式事件mock驗證開關、Esc、選擇角色、離焦及focus呼叫 | 真實滑鼠／鍵盤與窄版選單位置 |
| 搜尋及篩選擠壓 | Grid分區、Flex換行 | InventoryView：搜尋與狀態區依寬度分列；篩選1／2／4欄；清除按鈕保留並置於輸入框右側 | 既有正式handler串接的搜尋、空結果、篩選／清除mock回歸通過 | 真實操作可達性及一般內容無橫向溢位 |
| 表格表頭碎裂、操作欄看不到 | 二維資料表保留欄寬及局部捲動 | 共用table-scroll；庫存表最小72rem，品牌表與商品帳本最小48rem；庫存供應商文字不再以130px截斷；容器可鍵盤聚焦 | 靜態接線確認，無全頁overflow-hidden掩蓋；交易及計算回歸通過 | 右側操作可捲到、鍵盤橫捲及實際欄寬；桌機也可能需少量局部橫捲 |
| 部分彈窗無高度限制，其他彈窗有各自規則；短高度問題原先僅疑似 | 依可用高度配置、內容可捲動 | 共用modal-overlay／modal-panel／modal-body；8個既有彈窗共用最大高度calc(100dvh - 2rem)，整個panel捲動，窄版Grid單欄；採購品項列可換行，商品明細頁尾可換行 | 全部8處接入；表單既有成功／失敗及資料邏輯mock仍通過 | 窄版與390×600時標題、關閉、確認／取消能到達；沒有初版彈窗圖片，不能補造前圖 |
| 系統按鈕等點擊區未統一 | 專案主要觸控目標44×44規格 | src/index.css對system-shell內button、select及非勾選框input設2.75rem最小寬高（根字級16px時為44px）；不改字級／顏色 | CSS規則靜態確認，不能當成實際尺寸量測 | 實際根字級、主要命中區尺寸及有無重疊 |

導覽是**非遮罩、推開內容的展開區域**，不使用dialog／aria-modal或焦點陷阱。開啟後保留原生Tab順序；切頁、關閉或Esc時呼叫原開關的focus。回首頁會收合，Provider始終在同一層。真正DOM焦點行為仍待本人操作確認。

## 修改檔案清單

- `src/App.tsx`、`src/components/layout/{Header,Sidebar}.tsx`：共用外框、窄版導覽及必要狀態／鍵盤處理。
- `src/components/inventory/InventoryView.tsx`：搜尋、篩選、表格、列資訊與頁尾的換行／寬度。
- `src/index.css`：系統觸控尺寸、表格與彈窗共用排版規則；沒有新增全頁裁切、文字尺度或動畫規則。
- `src/components/modals/{ServiceUsageModal,NewProductModal,NewPOModal,NotificationModal}.tsx`：接入共用彈窗；採購品項排版與關閉按鈕名稱。
- `src/components/products/ProductDetailModal.tsx`：共用彈窗、帳本捲動、頁尾換行與關閉名稱。
- `src/components/{brands/BrandsView,suppliers/SuppliersView,users/UsersView}.tsx`：既有內嵌彈窗接共用規則；品牌表格局部捲動。
- `tests/dataValidation.test.ts`：既有Sidebar呼叫補新props；新增2項正式元件事件mock，未新增CSS類別比對測試。
- 本輪Prompt、本README、development-log追加第38節及ai-conversations索引追加第9節。

共用版型影響的九個分頁均靜態檢視其根容器／Grid／工具列，原有響應式卡片保持；只針對品牌表格及三個內嵌彈窗補同類排版，沒有重做其他頁。

## 本輪測試

以下命令各跑一次，沒有失敗後重跑；測試使用獨立fixtures與mock storage，不動日常瀏覽器資料。

| 測試目的 | 測試輸入 | 預期輸出 | 實際輸出 | 問題與通過判定 |
|---|---|---|---|---|
| 型別檢查 | npm.cmd run lint | tsc --noEmit結束碼0 | 結束碼0 | 通過；非畫面驗收 |
| 正式建置 | npm.cmd run build | 可產生正式產物 | 結束碼0；Vite8.3.4／1686模組 | 通過；既有__dirname設定警告仍在 |
| 核心回歸 | node --import tsx --test --test-reporter=tap tests/dataValidation.test.ts | 舊規則及新增導覽事件均通過 | 206測試／206通過，0失敗、取消、跳過；既有204＋本輪2項 | 核心／handler／mock通過；不是206項瀏覽器測試 |
| 導覽事件 | 正式App＋Sidebar，開啟、選商品頁、再開啟並Esc、首頁往返 | 收合、保留頁面與核心資料，呼叫focus | 狀態正確，focus stub被呼叫2次，資料不變 | mock通過；沒有真實DOM／快速點擊驗收 |
| 角色入口 | 正式Header，點擊、Esc、選擇、離焦 | 展開狀態與角色正確，關閉時回焦點 | aria-expanded／hidden與角色狀態正確，focus stub被呼叫 | mock通過；真實鍵盤／滑鼠待補 |
| 靜態保護範圍 | Git差異、開始時雜湊及兩標籤 | 只改排版及必要事件，既有資料／首頁／規則不變 | Context、utils、types、mockData、PersonalHome、套件／設定、六圖與兩標籤保留；開發紀錄／索引舊內容只追加 | 靜態檢查通過；不替代視覺檢查 |
| 本機網址 | localhost:3000 listener及HTTP GET | 既有Node提供網站 | Node PID16120、0.0.0.0:3000、HTTP200 | 僅伺服器可回應；不算畫面或Console通過 |
| 三尺寸與溢位 | 首頁／庫存1440×900、820×1180、390×844 | 可閱讀、一般內容無水平擠出，表格可局部捲動 | 未執行 | 待實際操作確認 |
| 表格及彈窗 | 右側操作欄、390×844／390×600領料表單 | 操作及關閉／提交均可到達 | 未執行；未提交任何真實資料 | 待實際操作確認 |
| 點擊區與Console | 主要觸控尺寸、本輪流程錯誤紀錄 | 目標至少44×44 CSS px、沒有新增程式錯誤 | 未量測／未檢查Console；既有favicon404未重查 | 未驗證，不預填通過 |

## 截圖清單與固定條件

修改前原圖仍位於[before](../before/README.md)，不另存加工副本。本輪只建立清單，**目前修改後PNG為0／5，全部待補**；不建立假圖片。

| 修改前參照 | 本輪修改後檔名 | 設定viewport（CSS px） | 擷取方式 | 實際PNG尺寸 | 拍攝日期／Chrome／狀態 |
|---|---|---|---|---|---|
| [inventory-desktop.png](../before/inventory-desktop.png) | inventory-desktop.png | 1440×900 | 可視範圍 | 待量測 | 待補 |
| [inventory-tablet.png](../before/inventory-tablet.png) | inventory-tablet.png | 820×1180 | 可視範圍 | 待量測 | 待補 |
| [inventory-mobile.png](../before/inventory-mobile.png) | inventory-mobile.png | 390×844 | 可視範圍 | 待量測 | 待補 |
| 無初版彈窗截圖；僅有初版程式 | service-mobile-top.png | 390×600 | 可視範圍，彈窗頂端 | 待量測 | 待補 |
| 同上，不假造前圖 | service-mobile-bottom.png | 390×600 | 可視範圍，彈窗捲至底端 | 待量測 | 待補 |

- 網址固定 `http://localhost:3000/`；新且獨立的Chrome無痕工作階段，無舊LocalStorage資料；不清除／重設一般視窗。若其他無痕視窗有未保存內容，先妥善保存，才能結束舊無痕工作階段並開新的一個。
- 沿用預設Sarah／Owner及示範資料111 SKU／2382件／庫存成本NT$1,456,370；三項數值先在儀表板核對，不相符時先停拍，不對原使用環境按重設。
- 搜尋空白、品牌／供應商／品類／狀態全為全部，預設stock-asc；庫存拍圖無展開導覽／選單／彈窗，頁面及表格皆回到頂端／最左。
- Chrome縮放100%、Responsive自訂CSS寬高、DPR1、Device type Desktop；記錄實際Chrome版本與Asia/Taipei拍攝時間。初版Chrome155.0.8059.80，若版本不同如實記錄，不假裝一樣。預覽Fit倍率可不同，不改CSS尺寸。
- 初版首頁全頁PNG寬1425／805／375，較設定寬少15px，原因未確認；原檔不修改。本輪首頁未改，不額外要求重拍首頁。既有首頁三尺寸只作快速閱讀檢查。
- 彈窗兩圖屬代表性補證，不冒稱初版同狀態已有前圖。拍圖不提交新增、領料或採購，不刪歷史資料。
- 新圖片不得裁切、修圖或加邊；收到後再開圖核對實際像素、版本與拍攝條件。目前不預填尺寸符合。

## 一次完成的最少人工補證

只做本輪排版與必要操作，不重做步驟17 A～E。下列所有實際結果目前均**待本人確認**。

1. **開啟隔離環境與尺寸設定。** 按Ctrl+Shift+N開新無痕工作階段，網址輸入 `http://localhost:3000/`。按Ctrl+0回100%；F12開DevTools，再Ctrl+Shift+M開裝置工具列，上方裝置選Responsive。⋮內顯示DPR／Device type控制後設DPR1、Desktop；寬高先輸入1440、900。若原本另有無痕視窗，先依上方規則處理，避免共用舊資料。預期首頁可閱讀，無白畫面。
2. **核對與拍三張庫存。** 點「進入庫存系統」，在儀表板核對111／2382／1,456,370；點左側「庫存管理動態」。確認全部篩選、空搜尋、低到高排序；導覽收合、表格最左、頁面最上。裝置工具列⋮選Capture screenshot（不要選full size），存inventory-desktop.png。再改820×1180拍inventory-tablet.png、390×844拍inventory-mobile.png。平板／手機先點品牌旁三橫線可選分頁，選完應自動收合。各尺寸可點「返回個人首頁」快速看導覽／段落，再點原入口回庫存；首頁不必截圖。預期首頁正常，庫存主內容不再被256px側欄壓成窄欄，工具列不覆蓋內容。
3. **手機導覽、搜尋與表格。** 保持390×844：點三橫線→點「商品品項清單」，應切頁並收合；再開導覽→選「庫存管理動態」。再開一次導覽，用Tab移到導覽內「關閉導覽」再按Esc，應收合且焦點回三橫線。點角色頭像後按Esc也應收合。搜尋輸入 `ARM-012` 應有對應商品，改 `NO-MATCH-R21` 應無結果；點輸入框「清除」，選第一個非「全部」品牌，應只剩該品牌，再選全部回111項。於表格內水平捲到最右，應能看見「帳本詳情」；一般標題與篩選不應跟著整頁橫捲。測試後回到預設條件，不更動商品。
4. **彈窗窄版／短高度與兩張補圖。** 點頂部「現場領料／服務耗用」，在390×844確認彈窗不出框且能在內部捲動。保持彈窗開啟，把高度改600；在彈窗頂端拍service-mobile-top.png，再把滑鼠放彈窗內向下捲到底，應看見「取消」及「確認扣除庫存」，拍service-mobile-bottom.png。不要提交，點「取消」；若要核對上方X關閉，重新開啟並回到彈窗頂端點X。預期關閉可用，核心資料不變。
5. **集中回報與存圖。** 五張PNG放此資料夾：`C:\Users\yanmo\OneDrive\桌面\創業課-倉儲管理\salon-inventory-decision-assistant-main\salon-inventory-decision-assistant-main\docs\screenshots\round-1-layout`。最後DevTools點Console看本輪是否出現新紅色錯誤；有就回報訊息，既有favicon404另列，不為此重跑其他頁。一次回報「導覽／搜尋／表格／彈窗結果、五圖已存、Chrome版本、DPR1／100%／預設資料確認及拍攝時間」。不用逐項截Console或重跑九頁。

觸控44px實際量測、真實Tab焦點與Console完整狀態沒有自動證據，仍保留待驗證；不能僅因拍到圖片就把這些操作全填通過。收圖後再核對圖片，不移動本輪程式提交或原始兩標籤。
