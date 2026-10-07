import fs from 'node:fs';
import path from 'node:path';
import {auditDiscoverability,aeoSummary} from '../src/verification/discoverability.js';

const root=path.resolve('public');
const base=String(process.env.CODINGVIBES_PUBLIC_URL||'__SITE_URL__').replace(/\/$/,'');
if(!fs.existsSync(root))throw new Error('public_directory_missing');
const audit=auditDiscoverability(root,{baseUrl:base});
const summary=aeoSummary(audit);
console.log(JSON.stringify({ok:audit.ok,score:audit.score,grade:audit.grade,baseUrl:base,aeo:summary,pages:audit.pages.map(p=>({route:p.route,private:p.private,title:p.title,description:p.description,canonical:p.canonical,robots:p.robots,og:p.og,twitter:p.twitter,jsonLd:p.jsonLd,schemaTypes:p.schemaTypes})),issues:audit.issues,warnings:audit.warnings},null,2));
process.exitCode=audit.ok?0:2;
