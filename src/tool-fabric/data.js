const MAX_ROWS = 10_000;
const MAX_COLUMNS = 200;
const MAX_INPUT_BYTES = 500_000;
const MAX_OUTPUT_BYTES = 1_000_000;
const MAX_CELL_BYTES = 100_000;
const UNSAFE_KEYS = new Set(['__proto__','constructor','prototype']);

function invalid(message) {
  const error = new Error(message);
  error.status = 'INVALID_INPUT';
  throw error;
}

function stableValue(value, seen = new Set(), depth = 0) {
  if (depth > 20) invalid('Nested JSON values may not exceed 20 levels.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) invalid('JSON numbers must be finite.');
    return value;
  }
  if (typeof value !== 'object') invalid('Rows may contain only JSON-compatible values.');
  if (seen.has(value)) invalid('Circular data is not valid JSON input.');
  seen.add(value);
  let result;
  if (Array.isArray(value)) {
    result = value.map(item => stableValue(item,seen,depth+1));
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) invalid('Rows must contain plain JSON objects.');
    result = {};
    for (const key of Object.keys(value).sort()) {
      if (!key || UNSAFE_KEYS.has(key)) invalid('Column or nested keys may not be empty or prototype-sensitive.');
      if (Buffer.byteLength(key,'utf8') > 1_000) invalid('Column names may not exceed 1000 UTF-8 bytes.');
      result[key] = stableValue(value[key],seen,depth+1);
    }
  }
  seen.delete(value);
  return result;
}

function csvValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return JSON.stringify(value);
}

function safeSpreadsheetText(value) {
  if (typeof value === 'string' && /^\s*[=+\-@\t\r]/.test(value)) {
    return {value:"'" + value,sanitized:true};
  }
  return {value,sanitized:false};
}

function escapeCsv(value) {
  const text = String(value);
  if (/[",\r\n]/.test(text)) return '"' + text.replace(/"/g,'""') + '"';
  return text;
}

export function jsonToCsv(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) invalid('Input must be an object.');
  if (Object.keys(input).some(key => key !== 'json')) invalid('Only the json input field is supported.');
  const rows = input.json;
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > MAX_ROWS) {
    invalid('Provide an array containing 1 to 10000 JSON object rows.');
  }
  let serialized;
  try { serialized = JSON.stringify(rows); } catch { invalid('The input is not serializable JSON data.'); }
  if (typeof serialized !== 'string' || Buffer.byteLength(serialized,'utf8') > MAX_INPUT_BYTES) {
    const error = new Error('JSON input exceeds the 500 KB limit.');
    error.status = 'INPUT_TOO_LARGE';
    throw error;
  }

  const normalized = rows.map((row,index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) invalid('Row ' + (index+1) + ' must be a JSON object.');
    return stableValue(row);
  });
  const columns = [];
  const known = new Set();
  for (const row of normalized) {
    for (const key of Object.keys(row)) {
      if (!known.has(key)) {
        known.add(key);
        columns.push(key);
        if (columns.length > MAX_COLUMNS) invalid('CSV output is limited to 200 columns.');
      }
    }
  }
  if (!columns.length) invalid('At least one column is required across the supplied rows.');

  let sanitizedCellCount = 0;
  const cell = value => {
    const raw = csvValue(value);
    if (Buffer.byteLength(raw,'utf8') > MAX_CELL_BYTES) invalid('A CSV cell exceeds the 100 KB limit.');
    const safe = safeSpreadsheetText(raw);
    if (safe.sanitized) sanitizedCellCount++;
    return escapeCsv(safe.value);
  };
  const records = [columns.map(cell).join(',')];
  for (const row of normalized) records.push(columns.map(key => cell(Object.hasOwn(row,key) ? row[key] : null)).join(','));
  const csv = records.join('\r\n');
  const byteLength = Buffer.byteLength(csv,'utf8');
  if (byteLength > MAX_OUTPUT_BYTES) {
    const error = new Error('Generated CSV exceeds the 1 MB output limit.');
    error.status = 'INPUT_TOO_LARGE';
    throw error;
  }
  return {
    output:{csv,columns,rowCount:normalized.length,sanitizedCellCount,byteLength},
    warnings:sanitizedCellCount ? ['Spreadsheet formula-like strings were prefixed with an apostrophe to reduce formula-injection risk.'] : []
  };
}

export function runDataTool(id,input = {}) {
  if (id === 'data.json.csv') return jsonToCsv(input);
  invalid('No data conversion executor is registered for this id.');
}
