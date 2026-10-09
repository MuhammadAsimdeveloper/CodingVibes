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
    default: invalid('No developer utility executor is registered for this id.');
  }
}
