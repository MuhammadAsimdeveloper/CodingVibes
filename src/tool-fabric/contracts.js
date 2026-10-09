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
  create('json.format','Developer',['json-formatter','json-validator'],['text'],{properties:{text:{type:'string'}},provenance:'Asim Tools source id: json-formatter'}),
  create('json.typescript','Developer',['json-to-typescript'],['json'],{properties:{json:{} ,rootName:{type:'string'}},provenance:'Local deterministic JSON-to-TypeScript conversion'}),
  create('api.test','API & Testing',['api-tester'],['url'],{riskClass:'high',executionMode:'adapter',networkRequired:true,authRequired:true,confirmationRequired:true,status:'NOT_CONFIGURED',timeoutMs:15000,fallback:'validate and produce a redacted request plan; never send until a governed network adapter is configured',properties:{url:{type:'string'},method:{type:'string'},headers:{type:'object'},body:{}} ,provenance:'Security-governed request-plan contract; live networking intentionally not configured'}),
  create('regex.test','Developer',['regex-tester'],['pattern','input'],{properties:{pattern:{type:'string'},input:{type:'string'},flags:{type:'string'}},provenance:'Bounded regex tester with conservative unsafe-pattern rejection'}),
  create('jwt.inspect','Security',['jwt-inspector'],['token'],{properties:{token:{type:'string'}},provenance:'Asim Tools source id: jwt-inspector; decoding only, never claims verification'}),
  create('encoding.base64-binary','Developer',['base64-binary'],['operation','value'],{properties:{operation:{type:'string'},value:{type:'string'}},provenance:'Asim Tools source ids: base64-encoder, base64-decoder, binary-encoder, binary-decoder'}),
  create('design.color.palette','Design',['color-palette'],['color'],{properties:{color:{type:'string'}},provenance:'Asim Tools source id: color-converter'}),
  create('design.css.gradient','Design',['css-gradient'],['colors'],{properties:{colors:{type:'array'},angle:{type:'number'},stops:{type:'array'}},provenance:'Asim Tools source id: gradient-generator'}),
  create('qr.generate','Generators',['qr-generator'],['text'],{properties:{text:{type:'string'}},provenance:'Dependency-free QR Code Model 2 byte mode, error correction level L, versions 1–4'})
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
