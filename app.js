const dataset = window.FIELD_SURVEY_DATA || { headers: {}, rows: [], dropdowns: {} };
const STORAGE_KEY = "wild-creek-field-survey-v3";
const LEGACY_STORAGE_KEY = "wild-creek-field-survey-v2";
const SYNC_KEY = "wild-creek-sync-state-v1";

const viewCols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "L", "M", "N", "O", "P", "AB", "AC", "AD", "AE", "AF"];
const editCols = ["K", "Q", "R", "S", "T", "U"];
const dropdownCols = ["V", "W", "X", "Y", "Z", "AG"];
const extraCols = ["AH", "AI", "AJ", "AK", "AL", "AM"];
const exportCols = [...viewCols, ...editCols, ...dropdownCols, ...extraCols];

const townSelect = document.querySelector("#townSelect");
const keywordInput = document.querySelector("#keywordInput");
const siteList = document.querySelector("#siteList");
const recordCount = document.querySelector("#recordCount");
const savedCount = document.querySelector("#savedCount");
const syncStatusText = document.querySelector("#syncStatusText");
const networkStatus = document.querySelector("#networkStatus");
const fieldForm = document.querySelector("#fieldForm");
const selectedTown = document.querySelector("#selectedTown");
const selectedTitle = document.querySelector("#selectedTitle");
const viewFields = document.querySelector("#viewFields");
const editFields = document.querySelector("#editFields");
const dropdownFields = document.querySelector("#dropdownFields");
const ahSelect = document.querySelector("#ahSelect");
const ahOtherWrap = document.querySelector("#ahOtherWrap");
const ahOther = document.querySelector("#ahOther");
const aiDate = document.querySelector("#aiDate");
const ajInspector = document.querySelector("#ajInspector");
const akDate = document.querySelector("#akDate");
const alPhotoLink = document.querySelector("#alPhotoLink");
const amNote = document.querySelector("#amNote");
const saveRecord = document.querySelector("#saveRecord");
const exportOne = document.querySelector("#exportOne");
const exportAll = document.querySelector("#exportAll");
const clearRecord = document.querySelector("#clearRecord");
const backToList = document.querySelector("#backToList");

let selectedId = "";
let saved = loadSavedRecords();
let syncState = loadJson(SYNC_KEY, { status: "local-only", updatedAt: "" });

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function persistJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadSavedRecords() {
  const current = loadJson(STORAGE_KEY, null);
  if (current) return current;

  const legacy = loadJson(LEGACY_STORAGE_KEY, {});
  if (Object.keys(legacy).length) {
    persistJson(STORAGE_KEY, legacy);
  }
  return legacy;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function valueOf(row, col) {
  return saved[row.id]?.[col] ?? row.values[col] ?? "";
}

function getHeader(col) {
  return `${col} ${dataset.headers[col] || col}`;
}

function isFilledRecord(id) {
  const data = saved[id] || {};
  return Object.values(data).some((value) => String(value || "").trim());
}

function getSavedRows() {
  return dataset.rows.filter((row) => isFilledRecord(row.id));
}

function markLocalChanged() {
  syncState = {
    status: "local-only",
    updatedAt: new Date().toISOString()
  };
  persistJson(SYNC_KEY, syncState);
  updateSyncStatus();
}

function updateSyncStatus() {
  const count = getSavedRows().length;
  savedCount.textContent = `${count} 筆已填`;
  syncStatusText.textContent = count
    ? "本機暫存，尚未雲端同步"
    : "尚無填寫資料";
}

function updateNetworkStatus() {
  networkStatus.textContent = navigator.onLine ? "線上" : "離線";
  networkStatus.classList.toggle("is-offline", !navigator.onLine);
}

function setupTownSelect() {
  const towns = [...new Set(dataset.rows.map((row) => row.values.B).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "zh-Hant"));
  towns.forEach((town) => {
    const option = document.createElement("option");
    option.value = town;
    option.textContent = town;
    townSelect.appendChild(option);
  });
}

function getFilteredRows() {
  const town = townSelect.value;
  const keyword = keywordInput.value.trim().toLowerCase();
  return dataset.rows.filter((row) => {
    const matchTown = !town || row.values.B === town;
    const text = ["A", "E", "F", "G", "H", "I"].map((col) => valueOf(row, col)).join(" ").toLowerCase();
    return matchTown && (!keyword || text.includes(keyword));
  });
}

function renderList() {
  const rows = getFilteredRows();
  recordCount.textContent = `${rows.length} 筆`;
  siteList.innerHTML = "";

  if (!townSelect.value) {
    siteList.innerHTML = '<div class="empty-state">請先選擇鄉鎮市，系統會只顯示該鄉鎮市的檢視清單。</div>';
    updateSyncStatus();
    return;
  }

  if (!rows.length) {
    siteList.innerHTML = '<div class="empty-state">目前篩選條件沒有資料。</div>';
    updateSyncStatus();
    return;
  }

  rows.forEach((row) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `site-card ${isFilledRecord(row.id) ? "is-saved" : ""}`;
    button.innerHTML = `
      <strong>${valueOf(row, "A") || "未編號"}｜${valueOf(row, "E") || "未填溪段"}</strong>
      <span>${valueOf(row, "F") || ""} ${valueOf(row, "G") || ""}</span>
      <span>風險等級：${valueOf(row, "I") || "未填"}　列號：${row.excelRow}</span>
    `;
    button.addEventListener("click", () => selectRecord(row.id));
    siteList.appendChild(button);
  });
  updateSyncStatus();
}

function createTextInput(row, col) {
  const label = document.createElement("label");
  label.textContent = getHeader(col);
  const input = document.createElement(["K", "AM"].includes(col) ? "textarea" : "input");
  input.dataset.col = col;
  input.value = valueOf(row, col);
  if (input.tagName === "TEXTAREA") input.rows = 3;
  input.addEventListener("input", handleFieldInput);
  label.appendChild(input);
  return label;
}

function createSelectInput(row, col) {
  const label = document.createElement("label");
  label.textContent = getHeader(col);
  const select = document.createElement("select");
  select.dataset.col = col;
  select.appendChild(new Option("請選擇", ""));
  (dataset.dropdowns[col] || []).forEach((item) => select.appendChild(new Option(item, item)));
  const current = valueOf(row, col);
  if (current && !Array.from(select.options).some((option) => option.value === current)) {
    select.appendChild(new Option(current, current));
  }
  select.value = current;
  select.addEventListener("change", handleFieldInput);
  label.appendChild(select);
  return label;
}

function renderSelected(row) {
  selectedTown.textContent = `${valueOf(row, "B")}｜Excel 第 ${row.excelRow} 列`;
  selectedTitle.textContent = `${valueOf(row, "A") || "未編號"} ${valueOf(row, "E") || ""}`;

  viewFields.innerHTML = "";
  viewCols.forEach((col) => {
    const item = document.createElement("div");
    item.className = "view-item";
    item.innerHTML = `<span>${getHeader(col)}</span><strong>${valueOf(row, col) || "-"}</strong>`;
    viewFields.appendChild(item);
  });

  editFields.innerHTML = "";
  editCols.forEach((col) => editFields.appendChild(createTextInput(row, col)));

  dropdownFields.innerHTML = "";
  dropdownCols.forEach((col) => dropdownFields.appendChild(createSelectInput(row, col)));

  renderAh(row);
  aiDate.value = valueOf(row, "AI");
  ajInspector.value = valueOf(row, "AJ");
  akDate.value = valueOf(row, "AK");
  alPhotoLink.value = valueOf(row, "AL");
  amNote.value = valueOf(row, "AM");

  fieldForm.hidden = false;
  fieldForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderAh(row) {
  ahSelect.innerHTML = "";
  ahSelect.appendChild(new Option("請選擇", ""));
  dataset.dropdowns.AH.forEach((item) => ahSelect.appendChild(new Option(item, item)));

  const current = valueOf(row, "AH");
  const matched = dataset.dropdowns.AH.includes(current);
  ahSelect.value = matched ? current : current ? "其他" : "";
  ahOther.value = matched ? "" : current;
  ahOtherWrap.hidden = ahSelect.value !== "其他";
}

function selectRecord(id) {
  selectedId = id;
  const row = dataset.rows.find((item) => item.id === id);
  if (row) renderSelected(row);
}

function ensureTimestamp(record) {
  const hasContent = ["K", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "AG", "AH", "AJ", "AL", "AM"]
    .some((col) => String(record[col] || "").trim());
  if (hasContent) {
    if (!record.AI) record.AI = today();
    if (!record.AK) record.AK = today();
  }
}

function collectCurrentRecord() {
  const row = dataset.rows.find((item) => item.id === selectedId);
  if (!row) return null;

  const record = { ...(saved[selectedId] || {}) };
  document.querySelectorAll("[data-col]").forEach((input) => {
    record[input.dataset.col] = input.value.trim();
  });

  record.AH = ahSelect.value === "其他" ? ahOther.value.trim() || "其他" : ahSelect.value;
  record.AI = aiDate.value;
  record.AJ = ajInspector.value.trim();
  record.AK = akDate.value;
  record.AL = alPhotoLink.value.trim();
  record.AM = amNote.value.trim();
  ensureTimestamp(record);
  return record;
}

function saveCurrentRecord() {
  if (!selectedId) return;
  saved[selectedId] = collectCurrentRecord();
  persistJson(STORAGE_KEY, saved);
  markLocalChanged();
  const row = dataset.rows.find((item) => item.id === selectedId);
  renderSelected(row);
  renderList();
}

function handleFieldInput() {
  const draft = collectCurrentRecord();
  if (!draft) return;
  aiDate.value = draft.AI || "";
  akDate.value = draft.AK || "";
  ahOtherWrap.hidden = ahSelect.value !== "其他";
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function buildCsv(rows) {
  const headers = exportCols.map((col) => getHeader(col));
  const body = rows.map((row) => {
    const stored = saved[row.id] || {};
    return exportCols.map((col) => csvEscape(stored[col] ?? row.values[col] ?? "")).join(",");
  });
  return "\uFEFF" + [headers.map(csvEscape).join(","), ...body].join("\n");
}

function downloadCsv(filename, rows) {
  const blob = new Blob([buildCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./service-worker.js").catch((error) => {
    console.warn("Service worker registration failed", error);
  });
}

townSelect.addEventListener("change", renderList);
keywordInput.addEventListener("input", renderList);
saveRecord.addEventListener("click", saveCurrentRecord);
backToList.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
ahSelect.addEventListener("change", handleFieldInput);
ahOther.addEventListener("input", handleFieldInput);
[aiDate, ajInspector, akDate, alPhotoLink, amNote].forEach((input) => input.addEventListener("input", handleFieldInput));
window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);

clearRecord.addEventListener("click", () => {
  if (!selectedId || !confirm("確定清除本筆已填內容？")) return;
  delete saved[selectedId];
  persistJson(STORAGE_KEY, saved);
  markLocalChanged();
  selectRecord(selectedId);
  renderList();
});

exportOne.addEventListener("click", () => {
  if (!selectedId) return;
  saveCurrentRecord();
  const row = dataset.rows.find((item) => item.id === selectedId);
  downloadCsv(`${valueOf(row, "A") || "單筆"}_${valueOf(row, "B") || "外業"}_外業資料.csv`, [row]);
});

exportAll.addEventListener("click", () => {
  const rows = getSavedRows();
  if (!rows.length) {
    alert("目前沒有已填寫資料可匯出。");
    return;
  }
  downloadCsv(`野溪外業已填資料_${today()}.csv`, rows);
});

registerServiceWorker();
setupTownSelect();
updateNetworkStatus();
updateSyncStatus();
renderList();
