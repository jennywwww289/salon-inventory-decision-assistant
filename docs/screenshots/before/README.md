# 美化前初版截圖

狀態：**程式版本與拍攝規格完成，截圖待補。** 六張原圖全部取得、能開啟且核對後，才判定步驟十八完成。

## 程式與資料基準

- 真正專案根目錄：`C:\Users\yanmo\OneDrive\桌面\創業課-倉儲管理\salon-inventory-decision-assistant-main\salon-inventory-decision-assistant-main`
- 美化前程式標籤：`pre-beautification-v1` → `0a4d62020a8a33ce0337d2a790c73b80103d9411`；可用 `git rev-parse pre-beautification-v1^{commit}` 查詢。標籤固定，不移動；後續圖片／文件提交不改變此程式版本。
- 原始起點：`original-baseline` → `2ad1f4dc9c22e56d242a030079a650a2a2a0c154`，保留原歷史。
- 網址固定：`http://localhost:3000/`。不要改用 127.0.0.1、其他 port 或部署網址混拍。
- 資料來源：此標籤內 `mockData.ts` 經正式 `createDemoData()` 初始化的新副本，無既有 LocalStorage 快照；不是步驟十七的測試商品或目前一般視窗資料。
- 預設角色：`user-1`，莎拉 (Sarah)，Owner，負責人／首席設計師。六張都不切換角色。
- Node 直接讀取正式初始化與統計函式的核對結果：**111 SKU／2,382 件／庫存成本 NT$1,456,370**。公式分別為商品筆數、Σstock、Σ(stock × unitCost)；不由歷史交易推回庫存。
- 其他基準：8 品牌、5 供應商、4 人員、9 筆歷史交易、3 張採購單；庫存狀態為健康 76／偏低 26／危急 3／過量 6。這是程式資料查詢，不是截圖或業務測試。
- 本人已於本對話明確回報步驟十七 A～E 全部符合，記為「本人回報通過」。204 項核心／mock 結果獨立保留；Codex 自動瀏覽器及 Console 檢查仍未執行。

## 固定拍攝條件

1. 使用 Chrome **新的獨立無痕工作階段**。無痕視窗之間會共用仍開啟的無痕工作階段；若已另有無痕視窗，先自行確認是否有未保存工作，保存後關閉那些視窗，再開一個新的無痕視窗。不要清除或重設一般視窗的資料。
2. 同一瀏覽器／版本、同一來源、同一份預設資料與同一預設角色拍完六張。拍前在儀表板「門市庫存健康度總覽」核對上述三值；不符就先停止，不要在原使用環境按重設。之後返回首頁，完成首頁三張，再拍庫存三張。
3. 搜尋空白；品牌、供應商、分類及狀態均「全部」。庫存排序保持「現有庫存：低到高 (優先關注)」；不是自行排序後的結果。
4. 沒有彈窗、通知面板或展開選單；滑鼠移到頁面空白處，避免角色 hover 選單。頁面／main 的垂直捲動、整頁與表格的水平捲動皆回到頂端／最左端。
5. Chrome 網頁縮放以 Ctrl+0 回到 100%；DevTools 裝置模式使用 Responsive、自訂 CSS 寬高、DPR **1**，並固定 Device type 為 Desktop（本組作 CSS viewport 比較，三尺寸都相同；不是實體手機／平板驗收）。不使用裝置外框。
6. 若模擬畫面超過實際螢幕，可用 DevTools 的 Fit to window 顯示預覽，**不可因此改小 CSS 寬高或 DPR**；記錄預覽縮放，截圖仍由瀏覽器原生功能產生，不用系統螢幕截圖。
7. 拍攝前等首頁／頁面與字體穩定，時間等動態資訊如實保留。拍攝時間使用 Asia/Taipei（UTC+08:00），填實際日期時間；目前不得預填已拍。
8. 只導覽，不新增商品、不領料、不建採購、不採納建議、不點重設示範資料。首頁複製 Email 狀態保持未操作。
9. 不裁切、不修圖、不用 CSS／Console 隱藏側欄或缺陷。手機／平板原有溢出、遮擋或截斷照原樣拍並記錄；不要將看不到全部表格改拍全頁冒充可視範圍。
10. 拍攝前若網站來源、設定、鎖定檔、示範資料或樣式又改動，先記錄差異，不再宣稱符合此標籤；必要時另建唯一版本與新比較批次，不移動本標籤。補圖片／文件可另作本機提交。

## 六張原圖清單

存放資料夾：`C:\Users\yanmo\OneDrive\桌面\創業課-倉儲管理\salon-inventory-decision-assistant-main\salon-inventory-decision-assistant-main\docs\screenshots\before`

| 畫面 | 視窗尺寸 CSS px | 檔名 | 擷取方式 | 計畫 DPR | 實際圖片尺寸／DPR／日期 | 完成與檢查狀態 |
|---|---|---|---|---|---|---|
| 首頁 | 1440×900 | home-desktop.png | 全頁 | 1 | 待補 | 待補；尚無圖片 |
| 首頁 | 820×1180 | home-tablet.png | 全頁 | 1 | 待補 | 待補；尚無圖片 |
| 首頁 | 390×844 | home-mobile.png | 全頁 | 1 | 待補 | 待補；尚無圖片 |
| 庫存清單 | 1440×900 | inventory-desktop.png | 可視範圍 | 1 | 待補 | 待補；尚無圖片 |
| 庫存清單 | 820×1180 | inventory-tablet.png | 可視範圍 | 1 | 待補 | 待補；尚無圖片 |
| 庫存清單 | 390×844 | inventory-mobile.png | 可視範圍 | 1 | 待補 | 待補；尚無圖片 |

首頁全頁 PNG 高度可以超過指定視窗高度；以實際檔案為準。DPR=1 的庫存可視範圍原圖預期依序為 1440×900、820×1180、390×844 實體像素，取得後仍須核對。若全頁圖因水平溢出擴寬，記錄實際尺寸及缺陷，不裁切偽裝符合。只有 PNG 尺寸不足以證明原來的 CSS viewport／DPR，須配合操作條件回報。

## 一次完成的操作

1. 在新的 Chrome 無痕視窗（Ctrl+Shift+N）開啟 `http://localhost:3000/`，Ctrl+0。點首頁「進入庫存系統」，保持預設莎拉角色；在「總覽儀表板」向下找到「門市庫存健康度總覽」，核對 111 SKU、2,382 件、NT$1,456,370。這是資料拍攝核對，不必重做功能測試。再捲回頂端，點「返回個人首頁」。
2. 按 F12（或 Ctrl+Shift+I）開 DevTools，再按 Ctrl+Shift+M 開裝置工具列。Dimensions 選 Responsive；輸入寬 1440、高 900，Enter。
3. 在**裝置工具列**右側 ⋮，選 Add device pixel ratio／新增裝置像素比，將 DPR 設 1；同一選單選 Add device type／新增裝置類型，設 Desktop。關閉選單，維持此值拍完六張。不要選 Chrome 主選單的列印／儲存網頁。
4. 頁面停在首頁，捲回頂端／最左，不展開選單。在裝置工具列 ⋮ 選 **Capture full size screenshot／擷取完整大小的螢幕截圖**，存成 `home-desktop.png`。再只改寬高為 820×1180、390×844，各回到起點，同法存 `home-tablet.png`、`home-mobile.png`。
5. 將寬高先改回 1440×900，點「進入庫存系統」，左側點「庫存管理動態」，應見「門市即時庫存動態表」。搜尋空白、全部篩選、預設庫存低到高。頁面與表格捲軸回到頂端／最左，滑鼠移到空白處。
6. 在裝置工具列 ⋮ 選 **Capture screenshot／擷取螢幕截圖**（本次不要選 full size），存 `inventory-desktop.png`。再改 820×1180、390×844，各回起點並用相同可視範圍方式存 `inventory-tablet.png`、`inventory-mobile.png`。窄版側欄擠壓或表格遮擋原樣保留。
7. 六張均存進上述資料夾。若 Chrome 自動存 Downloads，按 Ctrl+J 找到原始 PNG，將它們移入此資料夾並依清單重新命名；不要另存成壓縮／編輯過的圖片。可在檔案總管網址列貼入完整資料夾路徑。
8. 拍完一次回報「六張已存」、Chrome 版本（⋮→說明→關於 Google Chrome）、實際 DPR、拍攝日期時間／範圍及有無溢出等狀況。後續由 Codex 開啟原圖、核對尺寸／畫面、補填本表及 Git 紀錄；不要求重新驗收 A～E。

Chrome 操作依據：[Chrome DevTools 裝置模式官方說明](https://developer.chrome.com/docs/devtools/device-mode)（DPR／Device type／Capture screenshot／full size）。這裡使用模擬尺寸，不稱為實體裝置測試。

## 尚缺的證據

- 六張原始 PNG：目前 0／6。
- 實際 Chrome 版本、DPR、CSS 尺寸設定、拍攝時間及預覽縮放回報：待補。
- 每張圖片的可讀性、指定畫面／尺寸、缺陷保留情況：尚未驗證。
- 本階段不作初版自評，不修改版面，不新增外部服務。
