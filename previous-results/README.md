# 前期成果圖放置說明

請將 114 年前期成果簡報轉出的重點頁圖片放在 `slides/` 資料夾，並到上一層的 `previous-results.js` 建立對應。

建議流程：

1. 將整份 PPT/PDF 匯出成圖片。
2. 只保留每個檢視點位現場比對需要的重點頁。
3. 圖片建議壓縮成 JPG 或 WebP。
4. 檔名建議使用資料列 id 與頁碼，例如 `row-2-no-2-slide-011.webp`。
5. 在 `previous-results.js` 以 `row.id` 建立對應資料。

系統會把 `previous-results.js` 內有列出的圖片加入 PWA 離線快取。

目前已建立：

- `slides/`：114 張已壓縮 WebP 成果圖。
- `match-report.csv`：Excel 資料列、編號、溪段、檢視點位與簡報頁碼比對結果。
