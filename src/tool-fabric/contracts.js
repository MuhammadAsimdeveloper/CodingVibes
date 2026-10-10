const create = (id, category, aliases, required, options = {}) => Object.freeze({
  id, aliases: Object.freeze(aliases), owner: 'build-vibe', version: 1, category,
  inputSchema: Object.freeze({type:'object',required:Object.freeze(required),properties:Object.freeze(options.properties||{})}),
  outputSchema: Object.freeze({type:'object'}),
  riskClass: options.riskClass || 'low',
  executionMode: options.executionMode || 'local',
  networkRequired: Boolean(options.networkRequired),
  authRequired: Boolean(options.authRequired),
  confirmationRequired: Boolean(options.confirmationRequired),
  timeoutMs: options.timeoutMs || 5000,
  maxRetries: options.maxRetries ?? 0,
  auditEvent: 'tool.' + id.replaceAll('.', '_'),
  fallback: options.fallback || 'return_explicit_status_without_fabricating_success',
  status: options.status || 'READY',
  provenance: options.provenance || 'Adapted from the corresponding local Asim Tools source-family contract; no runtime dependency.'
});

export const TOOL_CONTRACTS = Object.freeze([
  create('seo.meta.generate','SEO & Web',['seo-meta-generator'],['title','description'],{properties:{title:{type:'string'},description:{type:'string'},url:{type:'string'}} ,provenance:'Asim Tools source id: meta-generator'}),
  create('seo.sitemap.generate','SEO & Web',['sitemap-generator'],['urls'],{properties:{urls:{type:'array',items:{type:'string'}}},provenance:'Asim Tools source id: sitemap-generator'}),
  create('seo.robots.generate','SEO & Web',['robots-generator'],[],{properties:{allow:{type:'array'},disallow:{type:'array'},sitemap:{type:'string'}},provenance:'Asim Tools source id: robots-generator'}),
  create('design.favicon.generate','Design',['favicon-generator'],[],{properties:{text:{type:'string'},background:{type:'string'},foreground:{type:'string'}},provenance:'Asim Tools source id: favicon-generator'}),
  create('seo.og.generate','SEO & Web',['og-generator'],['title','description','url'],{properties:{title:{type:'string'},description:{type:'string'},url:{type:'string'},image:{type:'string'}},provenance:'Asim Tools source id: og-generator'}),
  create('seo.audit','SEO & Web',['seo-auditor','seo-meta-checker'],['html'],{properties:{html:{type:'string'}},provenance:'Asim Tools source id: seo-meta-checker'}),
  create('web.performance.audit','SEO & Web',['performance-auditor'],[],{properties:{metrics:{type:'object'}},status:'NEEDS_BROWSER_METRICS',provenance:'Static metrics evaluator; browser/Lighthouse measurements must be supplied by a certified runner.'}),
  create('web.accessibility.audit','SEO & Web',['accessibility-auditor'],['html'],{properties:{html:{type:'string'}},provenance:'Static HTML audit; not a substitute for assistive-technology testing.'}),
  create('image.optimize','Images',['image-optimizer'],[],{executionMode:'browser',status:'BROWSER_REQUIRED',fallback:'offer browser-local Canvas/ImageBitmap adapter; do not pretend server-side compression occurred',properties:{file:{type:'object'},format:{type:'string'},quality:{type:'number'}} ,provenance:'Asim Tools source id: image-compressor'}),
  create('text.count','Text',['text-counter'],['text'],{properties:{text:{type:'string'}},provenance:'Local Unicode-aware character, word, line, paragraph and UTF-8 byte counts'}),
  create('text.case.convert','Text',['case-converter'],['text','mode'],{properties:{text:{type:'string'},mode:{type:'string'}},provenance:'Local deterministic text casing without evaluating user expressions'}),
  create('text.lines.sort','Text',['line-sorter'],['text'],{properties:{text:{type:'string'},order:{type:'string'},caseSensitive:{type:'boolean'}},provenance:'Local stable line sorting; output uses LF line endings'}),
  create('text.duplicates.remove','Text',['duplicate-lines-remover'],['text'],{properties:{text:{type:'string'},caseSensitive:{type:'boolean'},trim:{type:'boolean'}},provenance:'Local stable duplicate-line removal preserving first occurrence'}),
  create('text.replace','Text',['literal-text-replace'],['text','search','replace'],{properties:{text:{type:'string'},search:{type:'string'},replace:{type:'string'},mode:{type:'string'},maxReplacements:{type:'number'}},provenance:'Literal string replacement only; never treats user text as a regular expression'}),
  create('text.diff','Text',['text-diff'],['before','after'],{properties:{before:{type:'string'},after:{type:'string'}},provenance:'Bounded local line diff capped at 500 lines per side'}),
  create('text.whitespace.clean','Text',['whitespace-cleaner'],['text'],{properties:{text:{type:'string'},mode:{type:'string'}},provenance:'Local newline/trailing-space/blank-line normalization and whitespace collapse'}),
  create('text.slug.generate','Text',['slug-generator'],['text'],{properties:{text:{type:'string'},maxLength:{type:'number'}},provenance:'Local ASCII slug generation with bounded length and empty-result rejection'}),
  create('text.unicode.inspect','Text',['unicode-inspector'],['text'],{properties:{text:{type:'string'},maxCodePoints:{type:'number'}},provenance:'Local Unicode scalar, UTF-16 offset and UTF-8 byte inspection capped at 1000 code points'}),
  create('json.format','Developer',['json-formatter','json-validator'],['text'],{properties:{text:{type:'string'}},provenance:'Asim Tools source id: json-formatter'}),
  create('json.typescript','Developer',['json-to-typescript'],['json'],{properties:{json:{} ,rootName:{type:'string'}},provenance:'Local deterministic JSON-to-TypeScript conversion'}),
  create('data.json.csv','Data',['json-to-csv','json-csv-converter'],['json'],{timeoutMs:10000,properties:{json:{type:'array',minItems:1,maxItems:10000,items:{type:'object'}}},provenance:'Local JSON object-array to CSV conversion with bounded rows/columns/cells and spreadsheet-formula string neutralization.'}),
  create('data.csv.json','Data',['csv-to-json','csv-json-converter'],['csv'],{timeoutMs:10000,properties:{csv:{type:'string'}},provenance:'Local bounded CSV parser with strict quoting, unique safe headers, consistent row widths and output byte limits.'}),
  create('data.json.yaml','Data',['json-to-yaml','json-yaml-converter'],['json'],{timeoutMs:10000,properties:{json:{type:'string'}},provenance:'Local JSON-to-YAML 1.2-compatible block serialization with conservative quoted strings, safe keys and bounded nesting/node/output counts.'}),
  create('api.test','API & Testing',['api-tester'],['url'],{riskClass:'high',executionMode:'adapter',networkRequired:true,authRequired:true,confirmationRequired:true,status:'NOT_CONFIGURED',timeoutMs:15000,fallback:'validate and produce a redacted request plan; never send until a governed network adapter is configured',properties:{url:{type:'string'},method:{type:'string'},headers:{type:'object'},body:{}} ,provenance:'Security-governed request-plan contract; live networking intentionally not configured'}),
  create('regex.test','Developer',['regex-tester'],['pattern','input'],{properties:{pattern:{type:'string'},input:{type:'string'},flags:{type:'string'}},provenance:'Bounded regex tester with conservative unsafe-pattern rejection'}),
  create('jwt.inspect','Security',['jwt-inspector'],['token'],{properties:{token:{type:'string'}},provenance:'Asim Tools source id: jwt-inspector; decoding only, never claims verification'}),
  create('encoding.base64-binary','Developer',['base64-binary'],['operation','value'],{properties:{operation:{type:'string'},value:{type:'string'}},provenance:'Asim Tools source ids: base64-encoder, base64-decoder, binary-encoder, binary-decoder'}),
  create('design.color.palette','Design',['color-palette'],['color'],{properties:{color:{type:'string'}},provenance:'Asim Tools source id: color-converter'}),
  create('design.css.gradient','Design',['css-gradient'],['colors'],{properties:{colors:{type:'array'},angle:{type:'number'},stops:{type:'array'}},provenance:'Asim Tools source id: gradient-generator'}),
  create('calc.percentage','Calculators',['percentage-calculator'],['value','percentage'],{properties:{value:{type:'number'},percentage:{type:'number'}},provenance:'Local percentage-of-value arithmetic; finite operands only.'}),
  create('calc.ratio','Calculators',['ratio-calculator'],['left','right'],{properties:{left:{type:'number'},right:{type:'number'}},provenance:'Positive ratio simplification to six decimal places with share percentages.'}),
  create('calc.discount','Calculators',['discount-calculator'],['price','discountPercent'],{properties:{price:{type:'number'},discountPercent:{type:'number'},taxPercent:{type:'number'}},provenance:'Discount and optional post-discount tax calculation; percent inputs are bounded.'}),
  create('calc.profit_margin','Calculators',['profit-margin-calculator'],['revenue','cost'],{properties:{revenue:{type:'number'},cost:{type:'number'}},provenance:'Revenue minus cost and profit margin; no market data required.'}),
  create('calc.roi','Calculators',['roi-calculator'],['initialInvestment','finalValue'],{properties:{initialInvestment:{type:'number'},finalValue:{type:'number'}},provenance:'Return-on-investment calculation from supplied values only.'}),
  create('calc.break_even','Calculators',['break-even-calculator'],['fixedCosts','pricePerUnit','variableCostPerUnit'],{properties:{fixedCosts:{type:'number'},pricePerUnit:{type:'number'},variableCostPerUnit:{type:'number'}},provenance:'Contribution-margin and break-even unit calculation with positive contribution margin.'}),
  create('calc.compound_interest','Calculators',['compound-interest-calculator'],['principal','annualRatePercent','compoundsPerYear','years'],{properties:{principal:{type:'number'},annualRatePercent:{type:'number'},compoundsPerYear:{type:'integer'},years:{type:'number'}},provenance:'Compound interest calculation from user-provided principal, rate, periods and duration.'}),
  create('calc.loan','Calculators',['loan-calculator','loan-payment-calculator'],['principal','annualRatePercent','termMonths'],{properties:{principal:{type:'number'},annualRatePercent:{type:'number'},termMonths:{type:'integer'}},provenance:'Fixed-payment amortization estimate; excludes fees, taxes and variable-rate changes.'}),
  create('convert.units','Conversions',['unit-converter'],['value','fromUnit','toUnit'],{properties:{value:{type:'number'},fromUnit:{type:'string'},toUnit:{type:'string'}},provenance:'Deterministic local length, mass, volume, time and temperature conversion.'}),
  create('time.duration','Date & Time',['duration-converter'],['value','fromUnit','toUnit'],{properties:{value:{type:'number'},fromUnit:{type:'string'},toUnit:{type:'string'}},provenance:'Converts elapsed durations using fixed time units; calendar months and years are intentionally excluded.'}),
  create('time.age','Date & Time',['age-calculator','date-age-calculator'],['birthDate'],{properties:{birthDate:{type:'string'},asOfDate:{type:'string'}},provenance:'Calendar age between strict YYYY-MM-DD dates; leap-day birthdays use the final day of February in non-leap years.'}),
  create('time.timezone','Date & Time',['timezone-converter','time-zone-converter'],['datetime','fromTimeZone','toTimeZone'],{properties:{datetime:{type:'string'},fromTimeZone:{type:'string'},toTimeZone:{type:'string'}},provenance:'IANA time-zone conversion using the runtime Intl database for a supplied unambiguous ISO-8601 instant.'}),
  create('data.size.convert','Data',['data-size-converter'],['value','fromUnit','toUnit'],{properties:{value:{type:'number'},fromUnit:{type:'string'},toUnit:{type:'string'}},provenance:'Converts decimal SI and binary IEC byte units; rejects values outside exact integer range.'}),
  create('dev.hash.generate','Developer',['hash-generator'],['text'],{properties:{text:{type:'string'},algorithm:{type:'string'},encoding:{type:'string'}},provenance:'Node crypto SHA-256/SHA-384/SHA-512 hashes for integrity checks; explicitly not password storage.'}),
  create('security.checksum.verify','Security',['checksum-verifier'],['text','expected'],{properties:{text:{type:'string'},expected:{type:'string'},algorithm:{type:'string'},encoding:{type:'string'}},provenance:'Local fixed-size constant-time digest comparison for supplied data; integrity only, not password authentication.'}),
  create('dev.uuid.generate','Developer',['uuid-generator'],[],{properties:{},provenance:'Cryptographically secure version-4 UUID generation from the Node runtime.'}),
  create('dev.url.encode','Developer',['url-encoder','url-decoder'],['value','operation'],{properties:{value:{type:'string'},operation:{type:'string'}},provenance:'Local encodeURI/encodeURIComponent and matching decode helpers; no navigation or network request.'}),
  create('qr.generate','Generators',['qr-generator'],['text'],{properties:{text:{type:'string'}},provenance:'Dependency-free QR Code Model 2 byte mode, error correction level L, versions 1–4'}),
  create('pdf.info','Documents',['pdf-info','pdf-metadata'],['pdfBase64'],{timeoutMs:15000,properties:{pdfBase64:{type:'string'}},provenance:'Local PDF metadata/page inspection using pdf-lib; input size and page count are bounded.'}),
  create('pdf.merge','Documents',['pdf-merge','merge-pdf'],['documents'],{timeoutMs:20000,properties:{documents:{type:'array',minItems:2,maxItems:10,items:{type:'object'}}},provenance:'Local PDF page merge using pdf-lib; source count, pages and total bytes are bounded.'}),
  create('pdf.split','Documents',['pdf-split','split-pdf'],['pdfBase64','pages'],{timeoutMs:20000,properties:{pdfBase64:{type:'string'},pages:{type:'array',minItems:1,maxItems:200,items:{type:'integer',minimum:1}}},provenance:'Local one-based page extraction using pdf-lib; output count and bytes are bounded.'}),
  create('pdf.rotate','Documents',['pdf-rotate','rotate-pdf'],['pdfBase64','angle'],{timeoutMs:15000,properties:{pdfBase64:{type:'string'},angle:{type:'integer',enum:[-270,-180,-90,90,180,270]},pages:{type:'array',items:{type:'integer',minimum:1}}},provenance:'Local right-angle page rotation using pdf-lib; selected page numbers are one-based.'}),
  create('pdf.reorder','Documents',['pdf-reorder','reorder-pdf'],['pdfBase64','pages'],{timeoutMs:20000,properties:{pdfBase64:{type:'string'},pages:{type:'array',minItems:1,maxItems:200,items:{type:'integer',minimum:1}}},provenance:'Local full page permutation using pdf-lib; order is supplied as unique one-based page numbers.'}),
  create('image.to_pdf','Documents',['image-to-pdf','image-pdf-converter'],['images'],{timeoutMs:20000,properties:{images:{type:'array',minItems:1,maxItems:20,items:{type:'object',required:['mimeType','imageBase64'],properties:{mimeType:{type:'string',enum:['image/png','image/jpeg']},imageBase64:{type:'string'},filename:{type:'string'}}}}},provenance:'Local PNG/JPEG-to-PDF conversion using pdf-lib; MIME/signature, dimensions, image-count and input/output byte budgets are bounded.'})
]);

const BY_ID = new Map();
for (const contract of TOOL_CONTRACTS) {
  BY_ID.set(contract.id, contract);
  for (const alias of contract.aliases) BY_ID.set(alias, contract);
}
export function getToolContract(id) { return BY_ID.get(String(id || '').trim()) || null; }
export function listToolContracts({category='',query='',status=''} = {}) {
  const cat = String(category || '').toLowerCase();
  const q = String(query || '').toLowerCase();
  const wantedStatus = String(status || '').toUpperCase();
  return TOOL_CONTRACTS.filter(item =>
    (!cat || item.category.toLowerCase() === cat) &&
    (!wantedStatus || item.status === wantedStatus) &&
    (!q || (item.id + ' ' + item.aliases.join(' ') + ' ' + item.category + ' ' + item.provenance).toLowerCase().includes(q))
  );
}
