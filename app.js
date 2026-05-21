const dataset = window.FIELD_SURVEY_DATA || { headers: {}, rows: [], dropdowns: {} };
const STORAGE_KEY = "wild-creek-field-survey-v3";
const LEGACY_STORAGE_KEY = "wild-creek-field-survey-v2";
const SYNC_KEY = "wild-creek-sync-state-v1";
const PHOTO_DB_NAME = "wild-creek-field-photos";
const PHOTO_STORE = "photos";

const viewCols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "L", "M", "N", "O", "P", "AB", "AC", "AD", "AE", "AF"];
const editCols = ["K", "S", "T", "U"];
const dropdownCols = ["V", "W", "X", "Y", "Z", "AG"];
const extraCols = ["AH", "AI", "AJ", "AK", "AL", "AM"];
const customExportCols = [
  ["Q_WATER", "Q-1 上游水流坡度(%)"],
  ["Q_DEPOSIT", "Q-2 上游淤積坡度(%)"],
  ["R_WATER", "R-1 下游水流坡度(%)"],
  ["R_DEPOSIT", "R-2 下游淤積坡度(%)"],
  ["PHOTO_UP_NAME", "上游照片檔名"],
  ["PHOTO_DOWN_NAME", "下游照片檔名"],
  ["PHOTO_SECTION_NAME", "通洪斷面照片檔名"]
];
const exportCols = [...viewCols, ...editCols, ...dropdownCols, ...extraCols];
const photoTypes = [
  { key: "PHOTO_UP", nameKey: "PHOTO_UP_NAME", label: "上游照片" },
  { key: "PHOTO_DOWN", nameKey: "PHOTO_DOWN_NAME", label: "下游照片" },
  { key: "PHOTO_SECTION", nameKey: "PHOTO_SECTION_NAME", label: "通洪斷面" }
];

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
const qWaterSlope = document.querySelector("#qWaterSlope");
const qDepositSlope = document.querySelector("#qDepositSlope");
const rWaterSlope = document.querySelector("#rWaterSlope");
const rDepositSlope = document.querySelector("#rDepositSlope");
const ahSelect = document.querySelector("#ahSelect");
const ahOtherWrap = document.querySelector("#ahOtherWrap");
const ahOther = document.querySelector("#ahOther");
const aiDate = document.querySelector("#aiDate");
const ajInspector = document.querySelector("#ajInspector");
const akDate = document.querySelector("#akDate");
const alPhotoLink = document.querySelector("#alPhotoLink");
const amNote = document.querySelector("#amNote");
const photoFields = document.querySelector("#photoFields");
const saveRecord = document.querySelector("#saveRecord");
const exportOne = document.querySelector("#exportOne");
const exportAll = document.querySelector("#exportAll");
const clearRecord = document.querySelector("#clearRecord");
const backToList = document.querySelector("#backToList");

let selectedId = "";
let saved = loadSavedRecords();
let syncState = loadJson(SYNC_KEY, { status: "local-only", updatedAt: "" });
let photoDbPromise = null;

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

function openPhotoDb() {
  if (photoDbPromise) return photoDbPromise;
  photoDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(PHOTO_DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(PHOTO_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return photoDbPromise;
}

async function getPhoto(key) {
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readonly");
    const request = tx.objectStore(PHOTO_STORE).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function setPhoto(key, value) {
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readwrite");
    tx.objectStore(PHOTO_STORE).put(value, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function deletePhoto(key) {
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, "readwrite");
    tx.objectStore(PHOTO_STORE).delete(key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function photoStorageKey(recordId, photoKey) {
  return `${recordId}:${photoKey}`;
}

function compressImage(file, maxSize = 1280, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

function getExportHeader(col) {
  const custom = customExportCols.find(([key]) => key === col);
  return custom ? custom[1] : getHeader(col);
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

  qWaterSlope.value = valueOf(row, "Q_WATER");
  qDepositSlope.value = valueOf(row, "Q_DEPOSIT");
  rWaterSlope.value = valueOf(row, "R_WATER");
  rDepositSlope.value = valueOf(row, "R_DEPOSIT");

  renderAh(row);
  aiDate.value = valueOf(row, "AI");
  ajInspector.value = valueOf(row, "AJ");
  akDate.value = valueOf(row, "AK");
  alPhotoLink.value = valueOf(row, "AL");
  amNote.value = valueOf(row, "AM");
  renderPhotoFields(row);

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
  const hasContent = ["K", "Q_WATER", "Q_DEPOSIT", "R_WATER", "R_DEPOSIT", "S", "T", "U", "V", "W", "X", "Y", "Z", "AG", "AH", "AJ", "AL", "AM", "PHOTO_UP_NAME", "PHOTO_DOWN_NAME", "PHOTO_SECTION_NAME"]
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
  record.Q_WATER = qWaterSlope.value;
  record.Q_DEPOSIT = qDepositSlope.value;
  record.R_WATER = rWaterSlope.value;
  record.R_DEPOSIT = rDepositSlope.value;
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

async function renderPhotoFields(row) {
  photoFields.innerHTML = "";
  for (const photo of photoTypes) {
    const card = document.createElement("div");
    card.className = "photo-card";
    const inputId = `${photo.key}-input`;
    const photoData = await getPhoto(photoStorageKey(row.id, photo.key));
    const fileName = valueOf(row, photo.nameKey);
    card.innerHTML = `
      <label for="${inputId}">
        ${photo.label}
        <input id="${inputId}" type="file" accept="image/*" capture="environment">
      </label>
      <div class="photo-actions">
        <div>
          ${photoData ? `<img class="photo-preview" alt="${photo.label}" src="${photoData.dataUrl}">` : ""}
          <p class="photo-meta">${fileName ? `已暫存：${fileName}` : "尚未選擇照片"}</p>
        </div>
        <button type="button" class="ghost-button" data-remove-photo="${photo.key}">移除</button>
      </div>
    `;
    const input = card.querySelector("input");
    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file || !selectedId) return;
      const dataUrl = await compressImage(file);
      await setPhoto(photoStorageKey(selectedId, photo.key), {
        dataUrl,
        name: file.name,
        type: "image/jpeg",
        updatedAt: new Date().toISOString()
      });
      const record = collectCurrentRecord();
      record[photo.nameKey] = file.name;
      saved[selectedId] = record;
      persistJson(STORAGE_KEY, saved);
      markLocalChanged();
      renderPhotoFields(row);
      renderList();
    });
    card.querySelector("[data-remove-photo]").addEventListener("click", async () => {
      if (!selectedId) return;
      await deletePhoto(photoStorageKey(selectedId, photo.key));
      const record = collectCurrentRecord();
      record[photo.nameKey] = "";
      saved[selectedId] = record;
      persistJson(STORAGE_KEY, saved);
      markLocalChanged();
      renderPhotoFields(row);
      renderList();
    });
    photoFields.appendChild(card);
  }
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function buildCsv(rows) {
  const allCols = [...exportCols, ...customExportCols.map(([key]) => key)];
  const headers = allCols.map((col) => getExportHeader(col));
  const body = rows.map((row) => {
    const stored = saved[row.id] || {};
    return allCols.map((col) => csvEscape(stored[col] ?? row.values[col] ?? "")).join(",");
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
[qWaterSlope, qDepositSlope, rWaterSlope, rDepositSlope].forEach((input) => input.addEventListener("input", handleFieldInput));
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
