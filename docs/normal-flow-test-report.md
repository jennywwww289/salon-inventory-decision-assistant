# 步驟25｜正常流程測試報告

日期：2026-10-18（Asia/Taipei）。

**判定：A～E正式程式整合／handler與storage mock通過；真實React掛載、瀏覽器畫面、點擊、錨點捲動、重新整理及Console未執行。** 本輪沒有新增真人通過回報，也沒有要求補拍或重測。正常案例不列為步驟26五個找錯案例。

## 版本、範圍與環境

- 真正專案根目錄：`C:\Users\yanmo\OneDrive\桌面\創業課-倉儲管理\salon-inventory-decision-assistant-main\salon-inventory-decision-assistant-main`。
- 起點HEAD：`6976366149d7d37ac83f6e8ebe19fec40aeae0b1`；正式程式：`f84cf5e2bb7fe67656a0d597c172530c5c16d4d6`（第三輪互動回饋）。本輪正式程式、樣式、示範資料及套件均未修改。
- 起點已有：`docs/development-log.md`與`docs/ai-conversations/README.md`未提交；`docs/design-principles-research.md`與步驟20 Prompt未追蹤。保留原文，只在共用紀錄追加本輪；不把這些既有修改混入本輪提交。
- `original-baseline`仍為`2ad1f4dc9c22e56d242a030079a650a2a2a0c154`；`pre-beautification-v1`仍為`0a4d62020a8a33ce0337d2a790c73b80103d9411`。沒有移動標籤、切換或重設工作區。
- 工具：PowerShell、Git、Node v24.22.0、現有tsx／esbuild、Node內建test及TypeScript。精確部署模型／思考等級未確認。
- 沿用已知瀏覽器工具不可用的紀錄，本輪未重試、未安裝框架、未啟動或操作網站。使用VM執行正式TSX元件函式，React hooks及儲存介面採既有mock；不是真實React排程、DOM、原生事件或瀏覽器測試。
- 新增測試直接使用目前正式demo匯入及初始化副本，沒有替換業務實作或另造簡化商品陣列。正式Context自動呼叫saveCoreData；新Context透過loadCoreData與validateCoreData還原。沒有自行組JSON代替保存動作。
- 只有獨立MockStorage，保留其無關key；未接觸日常瀏覽器、真實LocalStorage、剪貼簿、憑證或外部服務；未呼叫localStorage.clear()。

## 實際輸入與起始資料

起始N＝111 SKU、Q＝2382件、V＝1456370元庫存成本；9筆交易、3張歷史採購、8品牌、5供應商、4人員。歷史異常單據只保留，不作正常驗收測試，也不改寫。

| 測試商品欄位 | 實際值 |
|---|---|
| SKU／名稱 | STEP25-NORMAL-001／正常流程測試商品 |
| 規格／品類 | 250ml／洗髮淨化 |
| 品牌 | b-1／AROMASE 艾瑪絲 |
| 供應商 | sup-1／沛森生化物流有限公司；其suppliedBrandIds包含b-1 |
| 初始庫存／成本／售價 | 10／100／150 |
| 補貨點／MOQ／交期 | 2／1／10天；交期沿用表單現有預設，沒有新增欄位 |
| 每週／每月需求 | 1／4；月需求由正式表單Math.round(1×4.3)產生 |
| 領料 | Service Usage，3；使用初始化的第一位示範使用者 |
| 採購 | 同供應商、同商品，5×100＝500，預期到貨日2026-10-20 |

SKU若已存在，測試會另選新的唯一值；此次實際使用001。測試時鐘固定為2026-10-18T00:00:00Z，僅用於可重現的ID／事件時間，不代表真實操作發生時間。

商品ID：`prod-1792281600000`；採購ID：`po-1792281600000`；單號：`PO-2026-1792281600000`。

## A～E逐項驗收

| 測試目的 | 測試輸入 | 預期輸出 | 實際輸出 | 問題與通過判定 | 驗證方式 | 證據位置 |
|---|---|---|---|---|---|---|
| A：首頁導覽與系統往返 | 首頁5錨點、進入系統、Sidebar依次選9頁、返回再進入；B建立商品後再往返一次 | 每個錨點唯一；分頁對應正確；分頁及共用資料保留 | #home／about／skills／projects／contact各有唯一id；dashboard／inventory／products／brands／suppliers／purchase／analytics／insights／users皆對應正確元件，逐一執行元件本體回傳非空內容；兩次往返資料相同，保留inventory分頁 | 接線與handler mock通過；沒有實際捲動、DOM子元件掛載或9頁瀏覽器開啟證據 | 正式App／首頁／Sidebar及9頁元件本體＋hooks mock、Provider位置靜態確認 | 測試A及B的roundTrip；runner原始輸出A／B |
| B：新增、搜尋、符合篩選與清除 | 正式NewProductModal填上述欄位並送出；完整SKU搜尋、b-1品牌篩選、清除；清單列點擊開明細 | 只新增1項；可搜尋、符合篩選不被排除、清除回全量；明細10／100 | 表單成功關閉一次，SKU僅1筆；112 SKU，2392件，成本1457370；搜尋與品牌條件顯示1筆、清除112筆；商品清單也可查到；明細10／成本100 | 正式新增、搜尋／篩選handler及結果樹通過；原111商品不變 | 正式表單→AppContext.addProduct→共用驗證／保存，正式清單及明細元件＋hooks mock | 測試B；輸出input、checkpoints.B |
| C：正常領料與同步 | 正式ServiceUsageModal選同商品領3 | 7、一筆-3、成本快照100、訊息剩餘7、清單／明細／彙總更新 | 庫存7；僅一筆Service Usage -3，resultingStock=7、unitCost=100；正式成功訊息結果樹含「目前剩餘：7」；112 SKU／2389件／成本1457070；舊明細prop仍讀取最新7 | 正式寫入及元件輸出mock通過；沒有真實畫面成功訊息證據 | 正式表單→recordTransaction→applyInventoryMovement→共同狀態／saveCoreData | 測試C；輸出checkpoints.C |
| D：完整採購及驗收 | 正式NewPOModal新增5@100，從本張明細依序核准、下單、驗收一次 | 草稿／核准／下單庫存7；驗收12，一筆+5連結採購；明細一致，驗收後無本單點收動作 | Draft→Approved→Ordered→Received；庫存7／7／7／12，明細5件、500元；本商品交易共2筆且ID不同，入庫+5／成本100／resultingStock=12／purchaseOrderId正確；選取明細及本單卡片無點收按鈕；清單、原開啟商品明細及帳本皆12／2筆 | 正式採購流程及handler mock通過；首次測試選擇範圍錯誤已修正，詳下節；沒有重複驗收或非法順序測試 | 正式表單及PurchaseOrdersView事件→createPurchaseOrder／updatePOStatus→transitionPurchaseOrder／共用異動 | 測試D；輸出checkpoints.D、poId、poNumber |
| E：統計、正式保存及還原 | 6次成功核心寫入後，由同一MockStorage全新初始化正式AppProvider | 12；-3／+5各1；已驗收不重放；N+1／Q+12／V+1200；六表及原資料一致 | 正式保存6次且只用專用key；新初始化不新增寫入，六表與已發布狀態一致；112 SKU、2394件、成本1457570；總交易11筆、採購4張；本商品交易2筆、已驗收、關聯存在，storageStatus=saved | 正式序列化／驗證／還原整合＋storage mock通過；原資料與無關key不變；不等同瀏覽器重新整理 | 正式Context自動saveCoreData；全新Context初始化loadCoreData／validateCoreData，無自製快照 | 測試E；輸出checkpoints.E |

明細測試刻意保留B建立時的product prop，C與D只重新執行同一明細實例的本體，確認正式依ID查最新共用資料。這是mock狀態與輸出驗證，不保證真實React重新掛載或焦點行為。

## 數量、金額及交易核對

| 時點 | SKU | 總庫存件數 | 庫存成本（元） | 測試商品庫存 | 本商品交易 |
|---|---:|---:|---:|---:|---|
| 初始化／A | 111 | 2382 | 1456370 | 尚未建立 | 0 |
| B新增後 | 112 | 2392 | 1457370 | 10 | 0 |
| C領3後 | 112 | 2389 | 1457070 | 7 | -3一筆 |
| D驗收5後 | 112 | 2394 | 1457570 | 12 | -3／+5各一筆 |
| E還原後 | 112 | 2394 | 1457570 | 12 | 原兩筆均保留 |

公式：SKU=N+1；總量=Q+10-3+5=Q+12；成本=V+(10-3+5)×100=V+1200。只加本次新商品異動，不以不完整歷史帳本重建原庫存。

- 領料交易：`tx-1792281600000`，-3、成本100、剩餘7。
- 採購交易：`tx-1792281600000-1`，+5、成本100、剩餘12，連結上述poId與單號。
- 兩筆交易ID不同；還原沒有重新產生ID、重放入庫或再驗收。
- 各階段對照原六表既有ID與內容；原商品、交易、採購、品牌、供應商、人員不變。匯入的原始mockData陣列也未污染；測試紀錄只存在本次獨立記憶體。

## 執行指令、問題及重測

在真正專案根目錄以PowerShell執行：

```powershell
& 'C:\Program Files\nodejs\node.exe' --import tsx --test --test-reporter=tap --test-name-pattern '^Step25 normal flow' tests/dataValidation.test.ts
& 'C:\Program Files\nodejs\npm.cmd' run lint
```

| 測試目的 | 測試輸入 | 預期輸出 | 實際輸出 | 問題與通過判定 |
|---|---|---|---|---|
| 首輪正常流程 | 新增Step25五組整合案例 | 全部符合正常流程 | A／B／C／E通過，D最後按鈕斷言失敗；runner tests6、pass4、fail2（包含失敗父測試） | 測試問題，不是網站故障：全頁尚有其他歷史Ordered單的合法點收按鈕 |
| 修正斷言範圍並重測 | 將D的全頁「點收」計數改為本張選取明細與本單卡片，兩處均檢查無點收入口 | 本單驗收後沒有再點收操作，其他單不受影響 | A～E全通過，runner tests6／pass6／fail0／skip0／cancel0，exit0 | 通過；重播同一個有前置資料依賴的A～E鏈以重建D條件，未重跑歷史全套或無關案例 |
| 首輪型別檢查 | npm.cmd run lint | tsc成功 | 新測試original為any，兩個callback隱含any，TS7006 | 本輪測試型別缺漏，未改正式程式 |
| 補型別後檢查 | 僅為original加CoreData型別，重跑lint | exit0 | tsc --noEmit成功、exit0 | 通過；純型別註記不改執行邏輯，未為此重跑A～E |
| 正式建置／歷史回歸 | 同一正式程式f84cf5e，步驟23已有成功紀錄 | 無正式程式變更時沿用證據 | 本輪未執行build或全套測試；引用步驟23的lint／build、17項受影響mock與5項Clipboard工具測試 | 引用既有證據，不列為本輪新通過，也不把不同次數相加 |

最終runner的**6包含1個父測試＋A～E五個子測試**，不是6個獨立使用者情境；首輪及重跑數字不相加，歷史204／206及步驟23選取測試也不相加。本輪沒有發現需要修改正式程式的正常流程錯誤。

## 證據索引及未驗證範圍

- [正式測試檔](../tests/dataValidation.test.ts)：搜尋「Step25 normal flow」；沿用既有runtime／component／MockStorage，新增1父5子，沒有測試框架或業務替代實作。
- [最終runner原始輸出](test-evidence/step25-normal-flow-output.txt)：保留TAP、實際計數及完整輸入／檢查點診斷；CoreData型別註記不影響此執行結果。
- [完整使用者Prompt](ai-conversations/2026-10-18-step25-prompt.md)、[開發紀錄](development-log.md)第47～48節、[對話索引](ai-conversations/README.md)第18節。
- [第三輪既有檢查](screenshots/round-3-feedback/README.md)、[第二輪截圖與擷取差異](screenshots/round-2-typography/README.md)、[第一輪有效截圖](screenshots/round-1-layout/README.md)。
- 尚未執行：真實React掛載／排程、實際9頁渲染與點擊、原生表單約束、錨點捲動、原生disabled／鍵盤、瀏覽器刷新／LocalStorage、真實Clipboard、動畫／reduce、Console及44px獨立量測。
- 圖片維持初版6、第一輪7（正式5）、第二輪3、第三輪0；第二輪桌機同位置擷取及第三輪狀態前後圖仍缺。靜態截圖不能證明本輪操作。
- favicon404、Vite既有__dirname警告、庫存門檻業務定義、舊異常示範採購及首頁D06驗收說明等既有待辦保留；本輪不擴大處理。
- 步驟24依使用者指示跳過；本輪完成25可執行測試及紀錄，不進入26或27，不安排人工補證。
