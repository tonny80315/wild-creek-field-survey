const dataset = window.FIELD_SURVEY_DATA || { headers: {}, rows: [], dropdowns: {} };
const previousResults = window.PREVIOUS_RESULTS_DATA || { basePath: "./previous-results/", records: {} };
const STORAGE_KEY = "wild-creek-field-survey-v3";
const LEGACY_STORAGE_KEY = "wild-creek-field-survey-v2";
const SYNC_KEY = "wild-creek-sync-state-v1";
const SYNC_URL_KEY = "wild-creek-sync-web-app-url-v1";
const DEFAULT_SYNC_URL = "https://script.google.com/macros/s/AKfycbxRNQ9TARshouTwTg5TFtgRGcFoyAcv_02hPPWByO4itCiGT8OLVF1rkR5WGE5ew_XC/exec";
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
  ["W_DEPOSIT_HEIGHT_M", "通水斷面平均淤積高度約(公尺)"],
  ["W_DEPOSIT_WIDTH_M", "通水斷面平均淤積寬度約(公尺)"],
  ["CATCHMENT_AREA_HA", "集水區面積(ha)"],
  ["RUNOFF_COEFFICIENT_C", "逕流係數 C"],
  ["ANNUAL_RAINFALL_MM", "年平均雨量 P(mm)"],
  ["CONCENTRATION_TIME_MIN", "集流時間 tc(分)"],
  ["RAINFALL_INTENSITY_50_MM_HR", "I50 降雨強度(mm/hr)"],
  ["ESTIMATED_Q50_CLEAR_WATER_CMS", "估算 Q50 清水流(cms)"],
  ["STREAM_LENGTH_M", "土石流潛勢溪流長度(m)"],
  ["STREAM_HIGH_POINT_M", "溪流最高點高程(m)"],
  ["STREAM_LOW_POINT_M", "溪流最低點高程(m)"],
  ["STREAM_ELEVATION_DIFF_M", "高程差(m)"],
  ["SLOPE_ANGLE_DEG", "計算坡度(角度)"],
  ["Q50_CLEAR_WATER_CMS", "Q50 清水流(cms)"],
  ["Q50_DEBRIS_FLOW_CMS", "Q50 土石流(cms)"],
  ["STRUCTURE_LENGTH_M", "現場既有橫向構造物長(m)"],
  ["STRUCTURE_DEPTH_M", "現場既有橫向構造物深(m)"],
  ["FLOW_VELOCITY_MS", "流速(m/s)"],
  ["EXISTING_CAPACITY_CMS", "既有通洪能力(cms)"],
  ["CAPACITY_CHECK_RESULT", "通洪斷面檢算結果"],
  ["PHOTO_UP_NAME", "上游照片檔名"],
  ["PHOTO_UP_NOTE", "上游照片補充說明"],
  ["PHOTO_DOWN_NAME", "下游照片檔名"],
  ["PHOTO_DOWN_NOTE", "下游照片補充說明"],
  ["PHOTO_SECTION_NAME", "通洪斷面照片檔名"],
  ["PHOTO_SECTION_NOTE", "通洪斷面照片補充說明"]
];
const exportCols = [...viewCols, ...editCols, ...dropdownCols, ...extraCols];
const photoTypes = [
  { key: "PHOTO_UP", nameKey: "PHOTO_UP_NAME", noteKey: "PHOTO_UP_NOTE", label: "上游照片" },
  { key: "PHOTO_DOWN", nameKey: "PHOTO_DOWN_NAME", noteKey: "PHOTO_DOWN_NOTE", label: "下游照片" },
  { key: "PHOTO_SECTION", nameKey: "PHOTO_SECTION_NAME", noteKey: "PHOTO_SECTION_NOTE", label: "通洪斷面" }
];
const wNumberFields = [
  {
    key: "W_DEPOSIT_HEIGHT_M",
    label: "通水斷面平均淤積高度約",
    marker: "通水斷面平均淤積高度",
    toText: (value) => `通水斷面平均淤積高度約${value}公尺`
  },
  {
    key: "W_DEPOSIT_WIDTH_M",
    label: "通水斷面平均淤積寬度約",
    marker: "通水斷面平均淤積寬度",
    toText: (value) => `通水斷面平均淤積寬度約${value}公尺`
  }
];
const kGroups = [
  {
    title: "1. 河道淤積情形",
    otherKey: "K_OTHER_DEPOSIT",
    options: [
      "河道上游無顯著淤積情形",
      "河道下游無顯著淤積情形",
      "河道上下游無顯著淤積情形",
      "河道上游輕度淤積",
      "河道上游中度淤積",
      "河道上游重度淤積",
      "河道下游輕度淤積",
      "河道下游中度淤積",
      "河道下游重度淤積",
      "其他"
    ]
  },
  {
    title: "2. 河道植生情形",
    otherKey: "K_OTHER_VEGETATION",
    options: [
      "河道上下游植生茂密",
      "河道上游植生茂密",
      "河道下游植生茂密",
      "河道兩側有些微植生",
      "河道上下游兩側植生茂密",
      "其他"
    ]
  },
  {
    title: "3. 河道通洪情形",
    otherKey: "K_OTHER_CAPACITY",
    options: [
      "通洪斷面不足",
      "通洪斷面足夠",
      "經檢算通洪斷面不足",
      "其他"
    ]
  },
  {
    title: "4. 補充說明",
    otherKey: "K_NOTE",
    options: []
  }
];

const townSelect = document.querySelector("#townSelect");
const keywordInput = document.querySelector("#keywordInput");
const siteList = document.querySelector("#siteList");
const recordCount = document.querySelector("#recordCount");
const savedCount = document.querySelector("#savedCount");
const syncStatusText = document.querySelector("#syncStatusText");
const syncUpload = document.querySelector("#syncUpload");
const syncUrlInput = document.querySelector("#syncUrlInput");
const networkStatus = document.querySelector("#networkStatus");
const fieldForm = document.querySelector("#fieldForm");
const selectedTown = document.querySelector("#selectedTown");
const selectedTitle = document.querySelector("#selectedTitle");
const previousResultStatus = document.querySelector("#previousResultStatus");
const previousSummary = document.querySelector("#previousSummary");
const previousResultGallery = document.querySelector("#previousResultGallery");
const imageViewer = document.querySelector("#imageViewer");
const imageViewerTitle = document.querySelector("#imageViewerTitle");
const imageViewerImg = document.querySelector("#imageViewerImg");
const closeImageViewer = document.querySelector("#closeImageViewer");
const viewFields = document.querySelector("#viewFields");
const editFields = document.querySelector("#editFields");
const kMultiSelect = document.querySelector("#kMultiSelect");
const dropdownFields = document.querySelector("#dropdownFields");
const qOriginal = document.querySelector("#qOriginal");
const rOriginal = document.querySelector("#rOriginal");
const qWaterSlope = document.querySelector("#qWaterSlope");
const qDepositSlope = document.querySelector("#qDepositSlope");
const rWaterSlope = document.querySelector("#rWaterSlope");
const rDepositSlope = document.querySelector("#rDepositSlope");
const catchmentArea = document.querySelector("#catchmentArea");
const runoffCoefficient = document.querySelector("#runoffCoefficient");
const annualRainfall = document.querySelector("#annualRainfall");
const concentrationTime = document.querySelector("#concentrationTime");
const streamLength = document.querySelector("#streamLength");
const streamHighPoint = document.querySelector("#streamHighPoint");
const streamLowPoint = document.querySelector("#streamLowPoint");
const calculatedSlopeAngle = document.querySelector("#calculatedSlopeAngle");
const streamElevationDiff = document.querySelector("#streamElevationDiff");
const rainfallIntensity50 = document.querySelector("#rainfallIntensity50");
const estimatedQ50ClearWater = document.querySelector("#estimatedQ50ClearWater");
const q50ClearWater = document.querySelector("#q50ClearWater");
const q50DebrisFlow = document.querySelector("#q50DebrisFlow");
const structureLength = document.querySelector("#structureLength");
const structureDepth = document.querySelector("#structureDepth");
const flowVelocity = document.querySelector("#flowVelocity");
const existingCapacity = document.querySelector("#existingCapacity");
const capacityStatus = document.querySelector("#capacityStatus");
const capacityCompare = document.querySelector("#capacityCompare");
const ahMultiSelect = document.querySelector("#ahMultiSelect");
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
const backToListBottom = document.querySelector("#backToListBottom");

let selectedId = "";
let saved = loadSavedRecords();
let syncState = loadJson(SYNC_KEY, { status: "local-only", updatedAt: "" });
let syncUrl = localStorage.getItem(SYNC_URL_KEY) || DEFAULT_SYNC_URL;
let photoDbPromise = null;
let imageViewerOpen = false;

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

function parseNumber(value) {
  const normalized = String(value ?? "").replace(/,/g, "").trim();
  if (!normalized || normalized === "-") return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return "-";
  return Number(value.toFixed(digits)).toString();
}

function estimateConcentrationTimeMinutes(record) {
  const high = parseNumber(record.STREAM_HIGH_POINT_M);
  const low = parseNumber(record.STREAM_LOW_POINT_M);
  const lengthM = parseNumber(record.STREAM_LENGTH_M);
  if (high === null || low === null || !lengthM || lengthM <= 0 || high <= low) return null;

  const hKm = (high - low) / 1000;
  const lKm = lengthM / 1000;
  const velocityKmh = 72 * Math.pow(hKm / lKm, 0.6);
  if (!Number.isFinite(velocityKmh) || velocityKmh <= 0) return null;
  return (lKm / velocityKmh) * 60;
}

function calculateI50(record) {
  const p = parseNumber(record.ANNUAL_RAINFALL_MM);
  const t = parseNumber(record.CONCENTRATION_TIME_MIN);
  if (p === null || t === null || p <= 0 || t <= 0) return null;

  const rainfall25Hour = Math.pow(p / (25.29 + 0.094 * p), 2);
  const coefficientA = Math.pow(p / (-189.96 + 0.31 * p), 2);
  const coefficientB = 55;
  const coefficientC = Math.pow(p / (-381.71 + 1.45 * p), 2);
  const coefficientG = Math.pow(p / (42.89 + 1.33 * p), 2);
  const coefficientH = Math.pow(p / (-65.33 + 1.836 * p), 2);
  const frequencyFactor = coefficientG + coefficientH * Math.log10(50);
  const durationFactor = coefficientA / Math.pow(t + coefficientB, coefficientC);
  const intensity = rainfall25Hour * frequencyFactor * durationFactor;

  return Number.isFinite(intensity) && intensity > 0 ? intensity : null;
}

function calculateQ50ClearWater(record) {
  const c = parseNumber(record.RUNOFF_COEFFICIENT_C);
  const i50 = calculateI50(record);
  const area = parseNumber(record.CATCHMENT_AREA_HA);
  if (c === null || i50 === null || area === null || c <= 0 || area <= 0) return null;
  return c * i50 * area / 360;
}

function calculateCapacityDraft(record) {
  const high = parseNumber(record.STREAM_HIGH_POINT_M);
  const low = parseNumber(record.STREAM_LOW_POINT_M);
  const length = parseNumber(record.STREAM_LENGTH_M);
  const structureWidth = parseNumber(record.STRUCTURE_LENGTH_M);
  const structureDepthValue = parseNumber(record.STRUCTURE_DEPTH_M);
  const velocity = parseNumber(record.FLOW_VELOCITY_MS) ?? 5;
  const q50Clear = parseNumber(record.Q50_CLEAR_WATER_CMS);
  const q50ClearEstimated = calculateQ50ClearWater(record);
  const q50Debris = parseNumber(record.Q50_DEBRIS_FLOW_CMS) ?? (q50Clear !== null ? q50Clear * 1.5 : q50ClearEstimated !== null ? q50ClearEstimated * 1.5 : null);
  const i50 = calculateI50(record);
  const elevationDiff = high !== null && low !== null ? high - low : null;
  const slopeAngle = elevationDiff !== null && length > 0
    ? Math.atan(elevationDiff / length) * 180 / Math.PI
    : null;
  const capacity = structureWidth !== null && structureDepthValue !== null && velocity !== null
    ? structureWidth * structureDepthValue * velocity
    : null;
  const targets = [q50Clear, q50Debris].filter((value) => value !== null);
  const required = targets.length ? Math.max(...targets) : null;
  const passes = capacity !== null && required !== null ? capacity >= required : null;

  return {
    elevationDiff,
    slopeAngle,
    capacity,
    required,
    passes,
    q50Clear,
    q50ClearEstimated,
    q50Debris,
    i50
  };
}

function renderCapacityCalculation(record) {
  const calc = calculateCapacityDraft(record);
  streamElevationDiff.textContent = calc.elevationDiff === null ? "-" : `${formatNumber(calc.elevationDiff)} m`;
  calculatedSlopeAngle.textContent = calc.slopeAngle === null ? "-" : `${formatNumber(calc.slopeAngle)} deg`;
  rainfallIntensity50.textContent = calc.i50 === null ? "-" : `${formatNumber(calc.i50)} mm/hr`;
  estimatedQ50ClearWater.textContent = calc.q50ClearEstimated === null ? "-" : `${formatNumber(calc.q50ClearEstimated)} cms`;
  existingCapacity.textContent = calc.capacity === null ? "-" : `${formatNumber(calc.capacity)} cms`;

  if (calc.passes === null) {
    capacityStatus.textContent = "尚未檢算";
    capacityStatus.classList.remove("is-pass", "is-fail");
  } else {
    capacityStatus.textContent = calc.passes ? "符合" : "不符合";
    capacityStatus.classList.toggle("is-pass", calc.passes);
    capacityStatus.classList.toggle("is-fail", !calc.passes);
  }

  const rows = [
    ["Q50 清水流", calc.q50Clear],
    ["Q50 土石流", calc.q50Debris]
  ];
  capacityCompare.innerHTML = rows.map(([label, demand]) => {
    const ok = calc.capacity !== null && demand !== null ? calc.capacity >= demand : null;
    return `
      <div class="capacity-compare-item ${ok === true ? "is-pass" : ok === false ? "is-fail" : ""}">
        <span>${label}</span>
        <strong>${demand === null ? "-" : `${formatNumber(demand)} cms`}</strong>
        <em>${ok === null ? "待輸入" : ok ? "符合" : "不符合"}</em>
      </div>
    `;
  }).join("");

  return calc;
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
  if (!count) {
    syncStatusText.textContent = "尚無填寫資料";
    return;
  }
  if (syncState.status === "sent" && syncState.updatedAt) {
    syncStatusText.textContent = `已送出同步請求：${new Date(syncState.updatedAt).toLocaleString("zh-TW")}`;
    return;
  }
  syncStatusText.textContent = "本機暫存，尚未雲端同步";
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
    const savedBadge = isFilledRecord(row.id) ? '<em class="saved-badge">已填寫</em>' : "";
    const button = document.createElement("button");
    button.type = "button";
    button.className = `site-card ${isFilledRecord(row.id) ? "is-saved" : ""}`;
    button.innerHTML = `
      <strong><span>${valueOf(row, "A") || "未編號"}｜${valueOf(row, "E") || "未填溪段"}</span>${savedBadge}</strong>
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

function parseMultiValue(value) {
  return String(value || "")
    .split(/[;；]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createCheckboxOption(name, value, checked) {
  const label = document.createElement("label");
  label.className = "multi-option";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = name;
  input.value = value;
  input.checked = checked;
  input.addEventListener("change", handleFieldInput);
  label.appendChild(input);
  label.append(value);
  return label;
}

function renderKMulti(row) {
  kMultiSelect.innerHTML = "";

  kGroups.forEach((group, groupIndex) => {
    const selected = saved[row.id]?.[`K_GROUP_${groupIndex}`] || parseMultiValue(valueOf(row, "K"));
    const wrap = document.createElement("div");
    wrap.className = "multi-group";
    wrap.innerHTML = `<p class="multi-group-title">${group.title}</p>`;

    if (group.options.length) {
      const options = document.createElement("div");
      options.className = "multi-options";
      group.options.forEach((option) => {
        options.appendChild(createCheckboxOption(`kOption-${groupIndex}`, option, selected.includes(option)));
      });
      wrap.appendChild(options);
    }

    const other = document.createElement("textarea");
    other.className = "other-input";
    other.dataset.kOther = group.otherKey;
    other.rows = groupIndex === 3 ? 4 : 3;
    other.placeholder = groupIndex === 3 ? "補充說明" : "選擇其他時，請在此補充";
    other.value = saved[row.id]?.[group.otherKey] || "";
    other.hidden = group.options.length > 0 && !selected.includes("其他");
    other.addEventListener("input", handleFieldInput);
    wrap.appendChild(other);
    kMultiSelect.appendChild(wrap);
  });
}

function renderAhMulti(row) {
  const selected = parseMultiValue(valueOf(row, "AH"));
  ahMultiSelect.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "multi-group";
  const options = document.createElement("div");
  options.className = "multi-options";
  dataset.dropdowns.AH.forEach((option) => {
    options.appendChild(createCheckboxOption("ahOption", option, selected.includes(option)));
  });
  wrap.appendChild(options);

  const other = document.createElement("textarea");
  other.className = "other-input";
  other.dataset.ahOther = "AH_OTHER";
  other.rows = 4;
  other.placeholder = "選擇其他時，請在此補充說明";
  other.value = saved[row.id]?.AH_OTHER || "";
  other.hidden = !selected.includes("其他");
  other.addEventListener("input", handleFieldInput);
  wrap.appendChild(other);
  ahMultiSelect.appendChild(wrap);
}

function collectChecked(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

function isWNumberOption(value) {
  return wNumberFields.some((field) => String(value || "").includes(field.marker));
}

function splitWParts(value) {
  return String(value || "")
    .split(/[;；]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function extractWNumber(value, marker) {
  const part = splitWParts(value).find((item) => item.includes(marker)) || "";
  const tail = part.slice(part.indexOf(marker) + marker.length);
  const match = tail.match(/約\s*([0-9]+(?:\.[0-9]+)?)/);
  return match ? match[1] : "";
}

function extractWSelectValue(value) {
  return splitWParts(value).find((part) => !isWNumberOption(part)) || "";
}

function createWInput(row) {
  const wrap = document.createElement("div");
  wrap.className = "compound-field";

  const label = document.createElement("label");
  label.textContent = getHeader("W");
  const select = document.createElement("select");
  select.dataset.col = "W_SELECT";
  select.appendChild(new Option("請選擇", ""));
  (dataset.dropdowns.W || [])
    .filter((item) => !isWNumberOption(item))
    .forEach((item) => select.appendChild(new Option(item, item)));
  const savedRecord = saved[row.id] || {};
  const current = savedRecord.W_SELECT || extractWSelectValue(valueOf(row, "W"));
  if (current && !Array.from(select.options).some((option) => option.value === current)) {
    select.appendChild(new Option(current, current));
  }
  select.value = current;
  select.addEventListener("change", handleFieldInput);
  label.appendChild(select);
  wrap.appendChild(label);

  const numbers = document.createElement("div");
  numbers.className = "compound-number-fields";
  wNumberFields.forEach((field) => {
    const numberLabel = document.createElement("label");
    numberLabel.className = "number-sentence-field";
    numberLabel.innerHTML = `
      <span>${field.label}</span>
      <input type="number" step="0.01" inputmode="decimal" data-w-number="${field.key}" placeholder="填數字">
      <span>公尺</span>
    `;
    const input = numberLabel.querySelector("input");
    input.value = savedRecord[field.key] || extractWNumber(valueOf(row, "W"), field.marker);
    input.addEventListener("input", handleFieldInput);
    numbers.appendChild(numberLabel);
  });
  wrap.appendChild(numbers);
  return wrap;
}

function createSelectInput(row, col) {
  if (col === "W") return createWInput(row);
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

function previousResultImageUrl(page) {
  if (!page?.image) return "";
  if (/^(https?:)?\/\//.test(page.image) || page.image.startsWith("./") || page.image.startsWith("/")) {
    return page.image;
  }
  return `${previousResults.basePath || "./previous-results/"}${page.image}`;
}

function openImageViewer(imageUrl, title) {
  imageViewerTitle.textContent = title || "前期成果圖";
  imageViewerImg.src = imageUrl;
  imageViewerImg.alt = title || "前期成果大圖";
  imageViewer.hidden = false;
  document.body.classList.add("viewer-open");
  imageViewerOpen = true;
  if (!history.state?.imageViewer) {
    history.pushState({ ...(history.state || {}), imageViewer: true }, "");
  }
}

function closeImageViewerPanel(fromPopState = false) {
  if (!imageViewerOpen) return;
  imageViewer.hidden = true;
  imageViewerImg.removeAttribute("src");
  document.body.classList.remove("viewer-open");
  imageViewerOpen = false;
  if (!fromPopState && history.state?.imageViewer) {
    history.back();
  }
}

function renderPreviousResults(row) {
  const result = previousResults.records?.[row.id];
  const summaryItems = [
    ["114年前期溪段現況淤積情形", valueOf(row, "J")],
    ["114年前期處理等級分類", valueOf(row, "AB")],
    ["114年前期建議處理對策", valueOf(row, "AC")],
    ["114年前期勘查日期", valueOf(row, "AD")],
    ["114年前期勘查人員", valueOf(row, "AF")]
  ];

  previousSummary.innerHTML = "";
  summaryItems.forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "previous-summary-item";
    item.innerHTML = `<span>${label}</span><strong>${value || "-"}</strong>`;
    previousSummary.appendChild(item);
  });

  previousResultGallery.innerHTML = "";
  const pages = result?.pages || [];
  previousResultStatus.textContent = pages.length ? `${pages.length} 張成果圖` : "尚未對應成果圖";

  if (result?.title || result?.description) {
    const intro = document.createElement("div");
    intro.className = "previous-result-intro";
    intro.innerHTML = `
      ${result.title ? `<strong>${result.title}</strong>` : ""}
      ${result.description ? `<p>${result.description}</p>` : ""}
    `;
    previousResultGallery.appendChild(intro);
  }

  if (!pages.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "尚未建立前期成果簡報對應。";
    previousResultGallery.appendChild(empty);
    return;
  }

  pages.forEach((page, index) => {
    const imageUrl = previousResultImageUrl(page);
    const imageTitle = page.title || `前期成果圖 ${index + 1}`;
    const card = document.createElement("article");
    card.className = "previous-result-card";
    card.innerHTML = `
      <button type="button" class="previous-image-button" aria-label="開啟前期成果大圖">
        <img src="${imageUrl}" alt="${imageTitle}" loading="lazy">
      </button>
      <div class="previous-result-body">
        <strong>${imageTitle}</strong>
        <span>${page.sourcePage ? `來源頁碼：${page.sourcePage}` : ""}</span>
        ${page.note ? `<p>${page.note}</p>` : ""}
        <button type="button" class="secondary-button previous-open-link">開啟大圖</button>
      </div>
    `;
    card.querySelector(".previous-image-button").addEventListener("click", () => openImageViewer(imageUrl, imageTitle));
    card.querySelector(".previous-open-link").addEventListener("click", () => openImageViewer(imageUrl, imageTitle));
    previousResultGallery.appendChild(card);
  });
}

function renderSelected(row) {
  selectedTown.textContent = `${valueOf(row, "B")}｜Excel 第 ${row.excelRow} 列`;
  selectedTitle.textContent = `${valueOf(row, "A") || "未編號"} ${valueOf(row, "E") || ""}`;

  renderPreviousResults(row);

  viewFields.innerHTML = "";
  viewCols.forEach((col) => {
    const item = document.createElement("div");
    item.className = "view-item";
    item.innerHTML = `<span>${getHeader(col)}</span><strong>${valueOf(row, col) || "-"}</strong>`;
    viewFields.appendChild(item);
  });

  editFields.innerHTML = "";
  editCols.filter((col) => col !== "K").forEach((col) => editFields.appendChild(createTextInput(row, col)));
  renderKMulti(row);

  dropdownFields.innerHTML = "";
  dropdownCols.forEach((col) => dropdownFields.appendChild(createSelectInput(row, col)));

  qOriginal.textContent = row.values.Q || "-";
  rOriginal.textContent = row.values.R || "-";
  qWaterSlope.value = valueOf(row, "Q_WATER");
  qDepositSlope.value = valueOf(row, "Q_DEPOSIT");
  rWaterSlope.value = valueOf(row, "R_WATER");
  rDepositSlope.value = valueOf(row, "R_DEPOSIT");
  catchmentArea.value = valueOf(row, "CATCHMENT_AREA_HA") || valueOf(row, "P");
  runoffCoefficient.value = valueOf(row, "RUNOFF_COEFFICIENT_C") || "0.8";
  annualRainfall.value = valueOf(row, "ANNUAL_RAINFALL_MM");
  streamLength.value = valueOf(row, "STREAM_LENGTH_M") || valueOf(row, "N");
  streamHighPoint.value = valueOf(row, "STREAM_HIGH_POINT_M") || valueOf(row, "L");
  streamLowPoint.value = valueOf(row, "STREAM_LOW_POINT_M") || valueOf(row, "M");
  concentrationTime.value = valueOf(row, "CONCENTRATION_TIME_MIN") || formatNumber(estimateConcentrationTimeMinutes({
    STREAM_HIGH_POINT_M: streamHighPoint.value,
    STREAM_LOW_POINT_M: streamLowPoint.value,
    STREAM_LENGTH_M: streamLength.value
  }), 1).replace("-", "");
  q50ClearWater.value = valueOf(row, "Q50_CLEAR_WATER_CMS");
  q50DebrisFlow.value = valueOf(row, "Q50_DEBRIS_FLOW_CMS");
  structureLength.value = valueOf(row, "STRUCTURE_LENGTH_M") || valueOf(row, "T");
  structureDepth.value = valueOf(row, "STRUCTURE_DEPTH_M") || valueOf(row, "U");
  flowVelocity.value = valueOf(row, "FLOW_VELOCITY_MS") || "5";
  renderCapacityCalculation(collectCurrentRecord() || {});

  renderAhMulti(row);
  aiDate.value = valueOf(row, "AI");
  ajInspector.value = valueOf(row, "AJ");
  akDate.value = valueOf(row, "AK");
  alPhotoLink.value = valueOf(row, "AL");
  amNote.value = valueOf(row, "AM");
  renderPhotoFields(row);

  fieldForm.hidden = false;
  fieldForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function selectRecord(id) {
  selectedId = id;
  const row = dataset.rows.find((item) => item.id === id);
  if (row) renderSelected(row);
}

function ensureTimestamp(record) {
  const hasContent = ["K", "Q_WATER", "Q_DEPOSIT", "R_WATER", "R_DEPOSIT", "CATCHMENT_AREA_HA", "RUNOFF_COEFFICIENT_C", "ANNUAL_RAINFALL_MM", "CONCENTRATION_TIME_MIN", "STREAM_LENGTH_M", "STREAM_HIGH_POINT_M", "STREAM_LOW_POINT_M", "Q50_CLEAR_WATER_CMS", "Q50_DEBRIS_FLOW_CMS", "STRUCTURE_LENGTH_M", "STRUCTURE_DEPTH_M", "FLOW_VELOCITY_MS", "S", "T", "U", "V", "W", "X", "Y", "Z", "AG", "AH", "AJ", "AL", "AM", "PHOTO_UP_NAME", "PHOTO_UP_NOTE", "PHOTO_DOWN_NAME", "PHOTO_DOWN_NOTE", "PHOTO_SECTION_NAME", "PHOTO_SECTION_NOTE"]
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

  const ahSelected = collectChecked("ahOption");
  const kOtherFields = Array.from(document.querySelectorAll("[data-k-other]"));
  kOtherFields.forEach((input) => {
    record[input.dataset.kOther] = input.value.trim();
  });
  const ahOtherInput = document.querySelector("[data-ah-other]");
  record.AH_OTHER = ahOtherInput?.value.trim() || "";
  const kParts = [];
  kGroups.forEach((group, groupIndex) => {
    const selected = collectChecked(`kOption-${groupIndex}`);
    record[`K_GROUP_${groupIndex}`] = selected;
    const otherText = record[group.otherKey];
    const groupValues = selected
      .filter((item) => item !== "其他")
      .concat(selected.includes("其他") && otherText ? [`其他：${otherText}`] : selected.includes("其他") ? ["其他"] : [])
      .concat(group.options.length === 0 && otherText ? [otherText] : []);
    if (groupValues.length) {
      kParts.push(`${group.title}：${groupValues.join("、")}`);
    }
  });
  record.K = kParts.join("；");
  record.AH = ahSelected
    .concat(record.AH_OTHER ? [record.AH_OTHER] : [])
    .join("；");
  wNumberFields.forEach((field) => {
    const input = document.querySelector(`[data-w-number="${field.key}"]`);
    record[field.key] = input?.value.trim() || "";
  });
  const wParts = [];
  if (record.W_SELECT) wParts.push(record.W_SELECT);
  wNumberFields.forEach((field) => {
    if (record[field.key]) wParts.push(field.toText(record[field.key]));
  });
  record.W = wParts.join("；");
  record.Q_WATER = qWaterSlope.value;
  record.Q_DEPOSIT = qDepositSlope.value;
  record.R_WATER = rWaterSlope.value;
  record.R_DEPOSIT = rDepositSlope.value;
  record.CATCHMENT_AREA_HA = catchmentArea.value;
  record.RUNOFF_COEFFICIENT_C = runoffCoefficient.value;
  record.ANNUAL_RAINFALL_MM = annualRainfall.value;
  record.CONCENTRATION_TIME_MIN = concentrationTime.value;
  record.STREAM_LENGTH_M = streamLength.value;
  record.STREAM_HIGH_POINT_M = streamHighPoint.value;
  record.STREAM_LOW_POINT_M = streamLowPoint.value;
  record.Q50_CLEAR_WATER_CMS = q50ClearWater.value;
  record.Q50_DEBRIS_FLOW_CMS = q50DebrisFlow.value;
  record.STRUCTURE_LENGTH_M = structureLength.value;
  record.STRUCTURE_DEPTH_M = structureDepth.value;
  record.FLOW_VELOCITY_MS = flowVelocity.value || "5";
  const capacityCalc = calculateCapacityDraft(record);
  record.RAINFALL_INTENSITY_50_MM_HR = capacityCalc.i50 === null ? "" : formatNumber(capacityCalc.i50);
  record.ESTIMATED_Q50_CLEAR_WATER_CMS = capacityCalc.q50ClearEstimated === null ? "" : formatNumber(capacityCalc.q50ClearEstimated);
  if (!record.Q50_CLEAR_WATER_CMS && capacityCalc.q50ClearEstimated !== null) {
    record.Q50_CLEAR_WATER_CMS = formatNumber(capacityCalc.q50ClearEstimated);
  }
  if (!record.Q50_DEBRIS_FLOW_CMS && parseNumber(record.Q50_CLEAR_WATER_CMS) !== null) {
    record.Q50_DEBRIS_FLOW_CMS = formatNumber(parseNumber(record.Q50_CLEAR_WATER_CMS) * 1.5);
  }
  record.STREAM_ELEVATION_DIFF_M = capacityCalc.elevationDiff === null ? "" : formatNumber(capacityCalc.elevationDiff);
  record.SLOPE_ANGLE_DEG = capacityCalc.slopeAngle === null ? "" : formatNumber(capacityCalc.slopeAngle);
  record.EXISTING_CAPACITY_CMS = capacityCalc.capacity === null ? "" : formatNumber(capacityCalc.capacity);
  record.CAPACITY_CHECK_RESULT = capacityCalc.passes === null ? "" : capacityCalc.passes ? "符合" : "不符合";
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
  q50ClearWater.value = draft.Q50_CLEAR_WATER_CMS || "";
  q50DebrisFlow.value = draft.Q50_DEBRIS_FLOW_CMS || "";
  renderCapacityCalculation(draft);
  document.querySelectorAll("[data-k-other]").forEach((input) => {
    const group = input.closest(".multi-group");
    const hasOther = Boolean(group?.querySelector('input[value="其他"]:checked'));
    const isNote = input.dataset.kOther === "K_NOTE";
    input.hidden = !isNote && !hasOther;
  });
  const ahOtherInput = document.querySelector("[data-ah-other]");
  if (ahOtherInput) {
    ahOtherInput.hidden = !Boolean(document.querySelector('input[name="ahOption"][value="其他"]:checked'));
  }
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
        <input id="${inputId}" type="file" accept="image/*">
      </label>
      <div class="photo-actions">
        <div>
          ${photoData ? `<img class="photo-preview" alt="${photo.label}" src="${photoData.dataUrl}">` : ""}
          <p class="photo-meta">${fileName ? `已暫存：${fileName}` : "尚未選擇照片"}</p>
        </div>
        <button type="button" class="ghost-button" data-remove-photo="${photo.key}">移除</button>
      </div>
      <label class="photo-note">
        ${photo.label}補充說明
        <textarea rows="3" data-photo-note="${photo.noteKey}" placeholder="記錄照片位置、拍攝方向、異常狀況或照片編號">${valueOf(row, photo.noteKey)}</textarea>
      </label>
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
    card.querySelector("[data-photo-note]").addEventListener("input", (event) => {
      if (!selectedId) return;
      const record = collectCurrentRecord();
      record[event.target.dataset.photoNote] = event.target.value.trim();
      saved[selectedId] = record;
      persistJson(STORAGE_KEY, saved);
      markLocalChanged();
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

function buildSyncRows(rows) {
  const allCols = [...exportCols, ...customExportCols.map(([key]) => key)];
  return rows.map((row) => {
    const stored = saved[row.id] || {};
    const values = {};
    allCols.forEach((col) => {
      values[col] = stored[col] ?? row.values[col] ?? "";
    });
    return {
      recordId: row.id,
      excelRow: row.excelRow,
      town: row.values.B || "",
      creek: row.values.E || "",
      submittedAt: new Date().toISOString(),
      values
    };
  });
}

function buildSyncPayload(rows) {
  const allCols = [...exportCols, ...customExportCols.map(([key]) => key)];
  const headers = {};
  allCols.forEach((col) => {
    headers[col] = getExportHeader(col);
  });
  return {
    app: "wild-creek-field-survey",
    version: "pwa-v19",
    submittedAt: new Date().toISOString(),
    headers,
    rows: buildSyncRows(rows)
  };
}

async function syncSavedRows() {
  const rows = getSavedRows();
  const url = syncUrlInput.value.trim();
  if (!rows.length) {
    alert("目前沒有已填寫資料可同步。");
    return;
  }
  if (!url) {
    alert("請先貼上 Google Apps Script Web App URL。");
    syncUrlInput.focus();
    return;
  }

  syncUrl = url;
  localStorage.setItem(SYNC_URL_KEY, syncUrl);
  syncUpload.disabled = true;
  syncUpload.textContent = "同步中";

  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: new URLSearchParams({
        payload: JSON.stringify(buildSyncPayload(rows))
      }).toString()
    });
    syncState = {
      status: "sent",
      updatedAt: new Date().toISOString()
    };
    persistJson(SYNC_KEY, syncState);
    updateSyncStatus();
    alert("已送出同步請求。請到 Google 試算表確認資料是否寫入。");
  } catch (error) {
    syncState = {
      status: "local-only",
      updatedAt: new Date().toISOString(),
      error: String(error)
    };
    persistJson(SYNC_KEY, syncState);
    updateSyncStatus();
    alert("同步送出失敗，請確認網路與 Web App URL。");
  } finally {
    syncUpload.disabled = false;
    syncUpload.textContent = "同步上傳";
  }
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

function safeFilename(value) {
  return String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 60);
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
backToListBottom.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
[aiDate, ajInspector, akDate, alPhotoLink, amNote].forEach((input) => input.addEventListener("input", handleFieldInput));
[qWaterSlope, qDepositSlope, rWaterSlope, rDepositSlope].forEach((input) => input.addEventListener("input", handleFieldInput));
[catchmentArea, runoffCoefficient, annualRainfall, concentrationTime, streamLength, streamHighPoint, streamLowPoint, q50ClearWater, q50DebrisFlow, structureLength, structureDepth, flowVelocity].forEach((input) => input.addEventListener("input", handleFieldInput));
window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);
window.addEventListener("popstate", () => closeImageViewerPanel(true));
imageViewer.addEventListener("click", (event) => {
  if (event.target === imageViewer || event.target.classList.contains("image-viewer-stage")) {
    closeImageViewerPanel();
  }
});
closeImageViewer.addEventListener("click", () => closeImageViewerPanel());
syncUrlInput.value = syncUrl;
syncUrlInput.addEventListener("change", () => {
  syncUrl = syncUrlInput.value.trim();
  localStorage.setItem(SYNC_URL_KEY, syncUrl);
});
syncUpload.addEventListener("click", syncSavedRows);

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
  const parts = [
    safeFilename(valueOf(row, "A") || "單筆"),
    safeFilename(valueOf(row, "B") || "外業"),
    safeFilename(valueOf(row, "F") || valueOf(row, "G") || valueOf(row, "E") || "檢視點位")
  ].filter(Boolean);
  downloadCsv(`${parts.join("_")}_外業資料.csv`, [row]);
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
