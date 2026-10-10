import {createHash, randomUUID, timingSafeEqual} from 'node:crypto';

const ALGORITHMS = Object.freeze({
  sha256:'sha256',
  sha384:'sha384',
  sha512:'sha512',
});
const HASH_WARNINGS = Object.freeze([
  'Cryptographic digest utilities are for integrity checks, not password storage or password verification.'
]);
const MAX_TEXT_BYTES = 500_000;

function invalid(message) {
  const error = new Error(message);
  error.status = 'INVALID_INPUT';
  throw error;
}

function inputText(input, key, {allowEmpty = true, maxBytes = MAX_TEXT_BYTES} = {}) {
  const value = input[key];
  if (typeof value !== 'string' || (!allowEmpty && value.length === 0)) {
    invalid(key + ' must be ' + (allowEmpty ? 'a string.' : 'a non-empty string.'));
  }
  if (Buffer.byteLength(value,'utf8') > maxBytes) invalid(key + ' exceeds the ' + maxBytes + '-byte limit.');
  return value;
}

function algorithmFor(raw) {
  if (raw === undefined || raw === null || raw === '') return 'sha256';
  if (typeof raw !== 'string') invalid('algorithm must be a string.');
  const normalized = raw.toLowerCase().replace(/[-_]/g,'').trim();
  const algorithm = ALGORITHMS[normalized];
  if (!algorithm) invalid('Unsupported digest algorithm. Use SHA-256, SHA-384 or SHA-512.');
  return algorithm;
}

function encodingFor(raw) {
  const encoding = raw === undefined || raw === null || raw === '' ? 'hex' : raw;
  if (encoding !== 'hex' && encoding !== 'base64') invalid('encoding must be hex or base64.');
  return encoding;
}

function generateHash(input) {
  const text = inputText(input,'text');
  const algorithm = algorithmFor(input.algorithm);
  const encoding = encodingFor(input.encoding);
  const digest = createHash(algorithm).update(text,'utf8').digest(encoding);
  return {
    output:{algorithm,encoding,digest,byteLength:Buffer.byteLength(text,'utf8')},
    warnings:[...HASH_WARNINGS]
  };
}

function expectedBytes(value, encoding) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 256) {
    invalid('expected must be a non-empty digest string of at most 256 characters.');
  }
  if (encoding === 'hex') {
    if (value.length % 2 !== 0 || !/^[a-f0-9]+$/i.test(value)) invalid('expected is not valid hexadecimal.');
    return Buffer.from(value,'hex');
  }
  const base64Pattern = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  if (!base64Pattern.test(value)) invalid('expected is not valid padded Base64.');
  const decoded = Buffer.from(value,'base64');
  if (!decoded.length || decoded.toString('base64') !== value) invalid('expected is not canonical Base64.');
  return decoded;
}

function verifyChecksum(input) {
  const text = inputText(input,'text');
  const expected = input.expected;
  const algorithm = algorithmFor(input.algorithm);
  const encoding = encodingFor(input.encoding);
  const expectedDigest = expectedBytes(expected,encoding);
  const actualDigest = createHash(algorithm).update(text,'utf8').digest();
  if (expectedDigest.length !== actualDigest.length) invalid('expected digest length does not match the chosen algorithm.');
  const matches = timingSafeEqual(actualDigest,expectedDigest);
  return {
    output:{
      matches,
      algorithm,
      encoding,
      computed:actualDigest.toString(encoding),
      byteLength:Buffer.byteLength(text,'utf8')
    },
    warnings:[...HASH_WARNINGS]
  };
}


const ISO_INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/;

function parseIsoInstant(value) {
  if (typeof value !== 'string' || value.length > 40) invalid('value must be a strict ISO-8601 instant with an explicit UTC offset.');
  const match = ISO_INSTANT.exec(value);
  if (!match) invalid('value must include a full date/time and an explicit Z or ±HH:MM offset.');
  const [,yearText,monthText,dayText,hourText,minuteText,secondText,fraction='',offset] = match;
  const year=Number(yearText), month=Number(monthText), day=Number(dayText);
  const hour=Number(hourText), minute=Number(minuteText), second=Number(secondText);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month-1] ||
      hour > 23 || minute > 59 || second > 59) {
    invalid('value contains an impossible calendar date or time.');
  }
  if (offset !== 'Z') {
    const offsetHour=Number(offset.slice(1,3)), offsetMinute=Number(offset.slice(4,6));
    if (offsetHour > 23 || offsetMinute > 59) invalid('value contains an invalid UTC offset.');
  }
  const milliseconds=Date.parse(value);
  if (!Number.isFinite(milliseconds) || Math.abs(milliseconds) > 8.64e15) invalid('value is outside the supported JavaScript date range.');
  return milliseconds;
}

function convertTimestamp(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).some(key => key !== 'value' && key !== 'mode')) {
    invalid('Input must contain only value and mode.');
  }
  const modes=new Set(['iso-to-unix-seconds','iso-to-unix-milliseconds','unix-seconds-to-iso','unix-milliseconds-to-iso']);
  if (typeof input.mode !== 'string' || !modes.has(input.mode)) {
    invalid('mode must be iso-to-unix-seconds, iso-to-unix-milliseconds, unix-seconds-to-iso or unix-milliseconds-to-iso.');
  }
  let milliseconds;
  if (input.mode.startsWith('iso-to-')) {
    milliseconds=parseIsoInstant(input.value);
  } else if (input.mode === 'unix-seconds-to-iso') {
    if (typeof input.value !== 'number' || !Number.isFinite(input.value) || Math.abs(input.value) > 8.64e12) {
      invalid('value must be a finite Unix-seconds number within the supported date range.');
    }
    milliseconds=Math.round(input.value*1000);
  } else {
    if (typeof input.value !== 'number' || !Number.isSafeInteger(input.value) || Math.abs(input.value) > 8.64e15) {
      invalid('value must be a safe integer Unix-milliseconds number within the supported date range.');
    }
    milliseconds=input.value;
  }
  const date=new Date(milliseconds);
  if (!Number.isFinite(date.getTime())) invalid('timestamp is outside the supported date range.');
  const iso=date.toISOString();
  return {output:{mode:input.mode,iso,unixMilliseconds:milliseconds,unixSeconds:milliseconds/1000},warnings:[]};
}


const CRON_FIELDS = Object.freeze([
  {name:'minute',min:0,max:59},
  {name:'hour',min:0,max:23},
  {name:'dayOfMonth',min:1,max:31},
  {name:'month',min:1,max:12},
  {name:'dayOfWeek',min:0,max:7},
]);

function parseCronField(source,field) {
  const values=new Set();
  const wildcard=source === '*';
  const segments=source.split(',');
  if (!source || segments.length > 100) invalid('Cron fields must contain a bounded list of values.');
  for (const segment of segments) {
    if (!segment) invalid('Cron lists may not contain empty items.');
    const slash=segment.split('/');
    if (slash.length > 2) invalid('Cron steps must use one slash.');
    let step=1;
    if (slash.length===2) {
      if (!/^\\d+$/.test(slash[1])) invalid('Cron step must be a positive integer.');
      step=Number(slash[1]);
      if (step < 1 || step > field.max-field.min+1) invalid('Cron step is outside the supported range.');
    }
    const base=slash[0];
    let start,end;
    if (base==='*') { start=field.min; end=field.max; }
    else if (base.includes('-')) {
      const parts=base.split('-');
      if (parts.length!==2 || !/^\\d+$/.test(parts[0]) || !/^\\d+$/.test(parts[1])) invalid('Cron ranges must use numeric start-end values.');
      start=Number(parts[0]); end=Number(parts[1]);
      if (start>end) invalid('Cron ranges may not wrap around.');
    } else {
      if (!/^\\d+$/.test(base)) invalid('Cron fields support numbers, lists, ranges, wildcards and steps only.');
      start=Number(base);
      end=slash.length===2 ? field.max : start;
    }
    if (start<field.min || start>field.max || end<field.min || end>field.max) invalid('Cron field value is outside the allowed range for '+field.name+'.');
    for(let value=start;value<=end;value+=step) values.add(field.name==='dayOfWeek' && value===7 ? 0 : value);
  }
  if (!values.size) invalid('Cron field did not select any values.');
  return {values,wildcard};
}

function inspectCron(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).some(key=>key!=='expression'&&key!=='after')) {
    invalid('Input must contain only expression and optional after.');
  }
  if (typeof input.expression!=='string' || input.expression.length>100) invalid('expression must be a five-field cron string of at most 100 characters.');
  const parts=input.expression.trim().split(/\\s+/);
  if (parts.length!==5) invalid('Only five-field cron syntax is supported: minute hour day-of-month month day-of-week.');
  const fields=parts.map((part,index)=>parseCronField(part,CRON_FIELDS[index]));
  const afterMs=input.after===undefined ? Date.now() : parseIsoInstant(input.after);
  const startMinute=Math.floor(afterMs/60_000)*60_000+60_000;
  const endMinute=startMinute+366*24*60*60_000;
  const nextRuns=[];
  for(let timestamp=startMinute;timestamp<endMinute&&nextRuns.length<5;timestamp+=60_000){
    const date=new Date(timestamp);
    const minuteMatch=fields[0].values.has(date.getUTCMinutes());
    const hourMatch=fields[1].values.has(date.getUTCHours());
    const domMatch=fields[2].values.has(date.getUTCDate());
    const monthMatch=fields[3].values.has(date.getUTCMonth()+1);
    const dowMatch=fields[4].values.has(date.getUTCDay());
    const dayMatch=fields[2].wildcard ? dowMatch : fields[4].wildcard ? domMatch : domMatch||dowMatch;
    if(minuteMatch&&hourMatch&&monthMatch&&dayMatch) nextRuns.push(date.toISOString());
  }
  const warnings=nextRuns.length?[]:['No occurrence was found within the bounded 366-day search window.'];
  return {
    output:{
      expression:parts.join(' '),
      fields:Object.fromEntries(CRON_FIELDS.map((field,index)=>[field.name,[...fields[index].values].sort((a,b)=>a-b)])),
      timeZone:'UTC',
      dayMatchPolicy:'day-of-month OR day-of-week when both are restricted',
      searchWindowDays:366,
      nextRuns
    },
    warnings
  };
}

function makeUuid() {
  return {output:{uuid:randomUUID(),version:4},warnings:[]};
}

function encodeUrl(input) {
  const value = inputText(input,'value');
  const operation = input.operation;
  if (typeof operation !== 'string') invalid('operation must be an explicit URL encoding mode.');
  const operations = {
    'encode-component':encodeURIComponent,
    'decode-component':decodeURIComponent,
    'encode-uri':encodeURI,
    'decode-uri':decodeURI,
  };
  const action = operations[operation];
  if (!action) invalid('operation must be encode-component, decode-component, encode-uri or decode-uri.');
  try {
    return {output:{value:action(value),operation},warnings:[]};
  } catch {
    invalid('value contains malformed percent-encoding for the selected decode operation.');
  }
}

export function runDeveloperTool(id,input={}) {
  switch (id) {
    case 'dev.hash.generate': return generateHash(input);
    case 'security.checksum.verify': return verifyChecksum(input);
    case 'dev.uuid.generate': return makeUuid();
    case 'dev.url.encode': return encodeUrl(input);
    case 'dev.timestamp.convert': return convertTimestamp(input);
    case 'dev.cron.inspect': return inspectCron(input);
    default: invalid('No developer utility executor is registered for this id.');
  }
}
