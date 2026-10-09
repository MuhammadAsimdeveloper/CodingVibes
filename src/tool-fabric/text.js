const MAX_TEXT_BYTES = 1_000_000;
const MAX_DIFF_LINES = 500;

function textError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
function readText(input, key = 'text') {
  if (typeof input[key] !== 'string') throw textError('INVALID_INPUT', key + ' must be a string.');
  if (Buffer.byteLength(input[key], 'utf8') > MAX_TEXT_BYTES) throw textError('INPUT_TOO_LARGE', key + ' exceeds the 1 MB text limit.');
  return input[key];
}
function boundedOutput(output) {
  if (Buffer.byteLength(JSON.stringify(output), 'utf8') > MAX_TEXT_BYTES) {
    throw textError('INPUT_TOO_LARGE', 'Text utility output exceeds the 1 MB limit.');
  }
  return output;
}
function splitLines(text) {
  if (text === '') return {lines:[], trailingNewline:false};
  const normalized = text.replace(/\r\n?/gu, '\n');
  const trailingNewline = normalized.endsWith('\n');
  const lines = normalized.split('\n');
  if (trailingNewline) lines.pop();
  return {lines, trailingNewline};
}
function joinLines(lines, trailingNewline = false) {
  return lines.join('\n') + (trailingNewline && lines.length ? '\n' : '');
}
function booleanOption(input, key, fallback) {
  if (input[key] === undefined) return fallback;
  if (typeof input[key] !== 'boolean') throw textError('INVALID_INPUT', key + ' must be a boolean.');
  return input[key];
}
function wordTokens(text) {
  return text.match(/[\p{L}\p{N}]+/gu) || [];
}
function capitalize(word) {
  return word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '';
}

function countText(input) {
  const text = readText(input);
  const normalized = text.replace(/\r\n?/gu, '\n');
  const paragraphs = normalized.trim() ? normalized.trim().split(/\n[ \t]*\n+/u).length : 0;
  return {
    characters:Array.from(text).length,
    utf16CodeUnits:text.length,
    utf8Bytes:Buffer.byteLength(text, 'utf8'),
    words:(text.trim().match(/\S+/gu) || []).length,
    lines:splitLines(text).lines.length,
    paragraphs
  };
}

function convertCase(input) {
  const text = readText(input);
  const mode = String(input.mode || '');
  const tokens = wordTokens(text);
  const lower = tokens.map(token => token.toLowerCase());
  let converted;
  switch (mode) {
    case 'lower': converted = text.toLowerCase(); break;
    case 'upper': converted = text.toUpperCase(); break;
    case 'title': converted = tokens.map(capitalize).join(' '); break;
    case 'sentence': {
      const value = text.toLowerCase();
      const points = Array.from(value);
      converted = points.length ? points[0].toUpperCase() + points.slice(1).join('') : '';
      break;
    }
    case 'camel': converted = lower.map((token,index) => index === 0 ? token : capitalize(token)).join(''); break;
    case 'pascal': converted = lower.map(capitalize).join(''); break;
    case 'kebab': converted = lower.join('-'); break;
    case 'snake': converted = lower.join('_'); break;
    case 'constant': converted = lower.join('_').toUpperCase(); break;
    default: throw textError('INVALID_INPUT', 'mode must be lower, upper, title, sentence, camel, pascal, kebab, snake or constant.');
  }
  return boundedOutput({text:converted,mode});
}

function sortLines(input) {
  const text = readText(input);
  const {lines,trailingNewline} = splitLines(text);
  const order = input.order === undefined ? 'asc' : input.order;
  if (!['asc','desc'].includes(order)) throw textError('INVALID_INPUT', 'order must be asc or desc.');
  const caseSensitive = booleanOption(input,'caseSensitive',true);
  const sorted = lines.map((value,index)=>({value,index})).sort((a,b)=>{
    const compared = caseSensitive
      ? a.value.localeCompare(b.value,'en',{sensitivity:'variant'})
      : a.value.localeCompare(b.value,'en',{sensitivity:'base'});
    return (order === 'desc' ? -compared : compared) || a.index-b.index;
  }).map(item=>item.value);
  return boundedOutput({text:joinLines(sorted,trailingNewline),lineCount:sorted.length});
}

function removeDuplicates(input) {
  const text = readText(input);
  const {lines,trailingNewline} = splitLines(text);
  const caseSensitive = booleanOption(input,'caseSensitive',true);
  const trim = booleanOption(input,'trim',false);
  const seen = new Set();
  const unique = [];
  for (const original of lines) {
    const value = trim ? original.trim() : original;
    const key = caseSensitive ? value : value.toLocaleLowerCase('en');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(value);
  }
  return boundedOutput({text:joinLines(unique,trailingNewline),lineCount:unique.length,removedCount:lines.length-unique.length});
}

function replaceLiteral(input) {
  const text = readText(input);
  const search = readText(input,'search');
  if (!search) throw textError('INVALID_INPUT','search must not be empty.');
  if (typeof input.replace !== 'string') throw textError('INVALID_INPUT','replace must be a string.');
  const mode = input.mode === undefined ? 'all' : input.mode;
  if (!['first','all'].includes(mode)) throw textError('INVALID_INPUT','mode must be first or all.');
  const maxReplacements = input.maxReplacements === undefined ? 10000 : Number(input.maxReplacements);
  if (!Number.isInteger(maxReplacements) || maxReplacements < 1 || maxReplacements > 10000) {
    throw textError('INVALID_INPUT','maxReplacements must be an integer from 1 to 10000.');
  }
  const pieces = [];
  let offset = 0, replacements = 0;
  while (replacements < maxReplacements) {
    const found = text.indexOf(search,offset);
    if (found < 0) break;
    pieces.push(text.slice(offset,found),input.replace);
    offset = found + search.length;
    replacements++;
    if (mode === 'first') break;
  }
  pieces.push(text.slice(offset));
  const replaced = pieces.join('');
  return boundedOutput({text:replaced,replacements,mode});
}

function textDiff(input) {
  const before = readText(input,'before');
  const after = readText(input,'after');
  const a = splitLines(before).lines, b = splitLines(after).lines;
  if (a.length > MAX_DIFF_LINES || b.length > MAX_DIFF_LINES) {
    throw textError('INPUT_TOO_LARGE','Diff input is limited to 500 lines per side.');
  }
  const rows = a.length + 1, cols = b.length + 1;
  const dp = new Uint32Array(rows * cols);
  for (let i=a.length-1;i>=0;i--) {
    for (let j=b.length-1;j>=0;j--) {
      const cell=i*cols+j;
      dp[cell]=a[i]===b[j] ? dp[(i+1)*cols+j+1]+1 : Math.max(dp[(i+1)*cols+j],dp[i*cols+j+1]);
    }
  }
  const output=[];
  let i=0,j=0,additions=0,removals=0,unchanged=0;
  while(i<a.length || j<b.length) {
    if(i<a.length && j<b.length && a[i]===b[j]) {
      output.push('  '+a[i]);i++;j++;unchanged++;
    } else if(i<a.length && (j>=b.length || dp[(i+1)*cols+j] >= dp[i*cols+j+1])) {
      output.push('- '+a[i]);i++;removals++;
    } else {
      output.push('+ '+b[j]);j++;additions++;
    }
  }
  return boundedOutput({diff:output.join('\n'),additions,removals,unchanged,linesBefore:a.length,linesAfter:b.length});
}

function cleanWhitespace(input) {
  const text = readText(input);
  const mode = input.mode === undefined ? 'normalize' : input.mode;
  let cleaned;
  switch(mode) {
    case 'normalize':
      cleaned = text.replace(/\r\n?/gu,'\n')
        .split('\n')
        .map(line=>line.replace(/[ \t]+$/gu,''))
        .join('\n')
        .replace(/\n{3,}/gu,'\n\n')
        .trim();
      break;
    case 'trim-lines':
      cleaned = joinLines(splitLines(text).lines.map(line=>line.trim()),splitLines(text).trailingNewline);
      break;
    case 'collapse':
      cleaned = text.replace(/\s+/gu,' ').trim();
      break;
    default: throw textError('INVALID_INPUT','mode must be normalize, trim-lines or collapse.');
  }
  return boundedOutput({text:cleaned,mode});
}

function generateSlug(input) {
  const text = readText(input);
  const requestedLength = input.maxLength === undefined ? 120 : Number(input.maxLength);
  if (!Number.isInteger(requestedLength) || requestedLength < 1 || requestedLength > 160) {
    throw textError('INVALID_INPUT','maxLength must be an integer from 1 to 160.');
  }
  const slug = text.normalize('NFKD')
    .replace(/\p{M}/gu,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu,'-')
    .replace(/^-+|-+$/gu,'')
    .slice(0,requestedLength)
    .replace(/-+$/gu,'');
  if (!slug) throw textError('INVALID_INPUT','Text has no ASCII letters or digits from which to create a slug.');
  return {slug};
}

function inspectUnicode(input) {
  const text = readText(input);
  const maxCodePoints = input.maxCodePoints === undefined ? 200 : Number(input.maxCodePoints);
  if (!Number.isInteger(maxCodePoints) || maxCodePoints < 1 || maxCodePoints > 1000) {
    throw textError('INVALID_INPUT','maxCodePoints must be an integer from 1 to 1000.');
  }
  const codePoints=[];
  let total=0, utf16Offset=0;
  for (const character of text) {
    const scalar=character.codePointAt(0);
    if (total < maxCodePoints) {
      codePoints.push({
        character,
        codePoint:'U+'+scalar.toString(16).toUpperCase().padStart(4,'0'),
        utf16Offset,
        utf8Bytes:Buffer.byteLength(character,'utf8')
      });
    }
    total++;
    utf16Offset+=character.length;
  }
  return {codePoints,codePointCount:codePoints.length,totalCodePoints:total,utf16CodeUnits:text.length,utf8Bytes:Buffer.byteLength(text,'utf8'),truncated:total>maxCodePoints};
}

export function runTextTool(id,input) {
  switch(id) {
    case 'text.count': return countText(input);
    case 'text.case.convert': return convertCase(input);
    case 'text.lines.sort': return sortLines(input);
    case 'text.duplicates.remove': return removeDuplicates(input);
    case 'text.replace': return replaceLiteral(input);
    case 'text.diff': return textDiff(input);
    case 'text.whitespace.clean': return cleanWhitespace(input);
    case 'text.slug.generate': return generateSlug(input);
    case 'text.unicode.inspect': return inspectUnicode(input);
    default: throw textError('UNKNOWN_TOOL','Unknown local text utility: '+String(id||''));
  }
}
