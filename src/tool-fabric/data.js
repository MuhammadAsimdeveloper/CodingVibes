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
    for (const key of Object.keys(value)) {
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
  const cell = (value,forceText = false) => {
    const raw = csvValue(value);
    if (Buffer.byteLength(raw,'utf8') > MAX_CELL_BYTES) invalid('A CSV cell exceeds the 100 KB limit.');
    const safe = typeof value === 'string' || forceText ? safeSpreadsheetText(raw) : {value:raw,sanitized:false};
    if (safe.sanitized) sanitizedCellCount++;
    return escapeCsv(safe.value);
  };
  const records = [columns.map(key => cell(key,true)).join(',')];
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


const MAX_CSV_BYTES = 500_000;

function parseCsvRows(source) {
  const text = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  if (!text.length) invalid('CSV input must not be empty.');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let afterQuote = false;
  let atFieldStart = true;
  const pushField = () => {
    if (Buffer.byteLength(field,'utf8') > MAX_CELL_BYTES) invalid('A CSV cell exceeds the 100 KB limit.');
    row.push(field);
    field = '';
    afterQuote = false;
    atFieldStart = true;
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i+1] === '"') { field += '"'; i++; }
        else { inQuotes = false; afterQuote = true; }
      } else {
        field += ch;
      }
      if (field.length > MAX_CELL_BYTES) invalid('A CSV cell exceeds the 100 KB limit.');
      continue;
    }
    if (afterQuote) {
      if (ch === ',') pushField();
      else if (ch === '\n') pushRow();
      else if (ch === '\r' && text[i+1] === '\n') { pushRow(); i++; }
      else invalid('Unexpected characters after a closing CSV quote.');
      if (rows.length > MAX_ROWS + 1) invalid('CSV input exceeds 10000 data rows.');
      continue;
    }
    if (ch === '"' && atFieldStart && field.length === 0) {
      inQuotes = true;
      atFieldStart = false;
    } else if (ch === '"') {
      invalid('A quote may only begin a CSV field.');
    } else if (ch === ',') {
      pushField();
    } else if (ch === '\n') {
      pushRow();
    } else if (ch === '\r') {
      if (text[i+1] !== '\n') invalid('CSV records must use LF or CRLF line endings.');
      pushRow();
      i++;
    } else {
      field += ch;
      atFieldStart = false;
      if (field.length > MAX_CELL_BYTES) invalid('A CSV cell exceeds the 100 KB limit.');
    }
    if (rows.length > MAX_ROWS + 1) invalid('CSV input exceeds 10000 data rows.');
  }
  if (inQuotes) invalid('CSV input ends inside a quoted field.');
  if (!text.endsWith('\n') && !text.endsWith('\r\n')) {
    pushField();
    rows.push(row);
  }
  if (rows.length < 1 || rows.length > MAX_ROWS + 1) invalid('CSV must contain a header and no more than 10000 data rows.');
  return rows;
}

function csvToJson(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) invalid('Input must be an object.');
  if (Object.keys(input).some(key => key !== 'csv')) invalid('Only the csv input field is supported.');
  const csv = input.csv;
  if (typeof csv !== 'string') invalid('csv must be a string.');
  if (Buffer.byteLength(csv,'utf8') > MAX_CSV_BYTES) {
    const error = new Error('CSV input exceeds the 500 KB limit.');
    error.status = 'INPUT_TOO_LARGE';
    throw error;
  }
  const rows = parseCsvRows(csv);
  const columns = rows[0];
  if (!columns.length || columns.length > MAX_COLUMNS) invalid('CSV must contain between 1 and 200 columns.');
  const seen = new Set();
  for (const column of columns) {
    if (!column.trim() || UNSAFE_KEYS.has(column) || seen.has(column)) {
      invalid('CSV headers must be non-empty, unique and not prototype-sensitive.');
    }
    seen.add(column);
  }
  const dataRows = rows.slice(1);
  if (dataRows.some(record => record.length !== columns.length)) {
    invalid('Every CSV record must have the same number of fields as the header.');
  }
  const json = dataRows.map(record => {
    const item = {};
    for (let i = 0; i < columns.length; i++) item[columns[i]] = record[i];
    return item;
  });
  const jsonString = JSON.stringify(json);
  const byteLength = Buffer.byteLength(jsonString,'utf8');
  if (byteLength > MAX_OUTPUT_BYTES) {
    const error = new Error('Generated JSON exceeds the 1 MB output limit.');
    error.status = 'INPUT_TOO_LARGE';
    throw error;
  }
  return {output:{json,jsonString,columns,rowCount:json.length,byteLength},warnings:[]};
}

export function runDataTool(id,input = {}) {
  if (id === 'data.json.csv') return jsonToCsv(input);
  if (id === 'data.csv.json') return csvToJson(input);
  invalid('No data conversion executor is registered for this id.');
}
