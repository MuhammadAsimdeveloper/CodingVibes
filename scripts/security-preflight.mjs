import fs from 'node:fs';
import path from 'node:path';

const required = [
  'public/terms.html',
  'public/privacy.html',
  'public/.well-known/security.txt',
  '.github/dependabot.yml',
  'docs/COMPETITIVE_POSITIONING.md',
  'docs/LAUNCH_AUDIT_2026-10-04.md',
];

const failures = [];
for (const file of required) {
  if (!fs.existsSync(file)) failures.push(`missing:${file}`);
}
const server = fs.readFileSync('src/server.js', 'utf8');
const landing = fs.readFileSync('public/landing.html', 'utf8');

for (const token of [
  'authBuckets',
  'authRateLimit(req',
  'CODINGVIBES_TRUST_PROXY',
  'strict-transport-security',
  "cache-control','no-store",
  'if(method===\'GET\'&&u.pathname===\'/terms\')',
  'if(method===\'GET\'&&u.pathname===\'/privacy\')',
]) {
  if (!server.includes(token)) failures.push(`server_missing:${token}`);
}

if (server.includes("u.pathname==='/api/webhooks/stripe'")) failures.push('legacy_stripe_webhook_route_present');

for (const claim of ['100,000+', '100+ Modern', 'No Code • No Limits', '24/7 Support', 'Drag &amp; Drop']) {
  if (landing.includes(claim)) failures.push(`stale_marketing_claim:${claim}`);
}

const requiredLandingTokens = ['60+ Curated', 'Visual Editing', '60+ Templates', 'Verified Build Loop', 'Portable Export'];
for (const token of requiredLandingTokens) {
  if (!landing.includes(token)) failures.push(`landing_missing:${token}`);
}

if (failures.length) {
  console.error('Build Vibe security preflight failed:');
  for (const item of failures) console.error(`- ${item}`);
  process.exit(2);
}

console.log('Build Vibe security preflight: PASS');
