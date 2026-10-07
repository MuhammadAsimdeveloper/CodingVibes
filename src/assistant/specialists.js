const SPECIALISTS={
  product:{label:'Product strategist',scope:'Clarify product goals, audience, core flows, scope and acceptance criteria.',keywords:['idea','plan','feature','audience','user','workflow']},
  ux:{label:'UX designer',scope:'Improve information architecture, layout, interaction patterns, usability and responsive behavior.',keywords:['ux','ui','layout','design','spacing','navigation','mobile','responsive']},
  code:{label:'Coding engineer',scope:'Reason about generated code, APIs, data models, bugs and implementation constraints.',keywords:['code','bug','error','api','database','function','typescript','javascript','python']},
  qa:{label:'QA engineer',scope:'Design functional, browser, visual, accessibility and release verification checks.',keywords:['qa','test','verify','verification','quality','broken','regression']},
  seo:{label:'SEO/AEO specialist',scope:'Improve metadata, canonical URLs, structured data, internal links and machine-readable discovery.',keywords:['seo','aeo','google','search','metadata','sitemap','ranking']},
  threeD:{label:'3D experience specialist',scope:'Handle models, textures, images, video, hotspots, camera paths, materials, lighting and fallbacks.',keywords:['3d','glb','gltf','model','texture','material','lighting','hotspot','camera','scene','walkthrough']},
  content:{label:'Content specialist',scope:'Structure copy, products, posts, properties, media and editable collections.',keywords:['copy','content','product','image','video','post','property','catalog','media']},
  launch:{label:'Launch engineer',scope:'Prepare export, deployment, domains, environment configuration, health checks and rollback.',keywords:['deploy','publish','domain','hosting','hostinger','github','release','launch','rollback']},
  security:{label:'Security reviewer',scope:'Protect secrets, auth, permissions, dependencies, input boundaries and production surfaces.',keywords:['security','auth','permission','secret','token','vulnerability','privacy']}
};

export function assistantCapabilityMap(){return Object.fromEntries(Object.entries(SPECIALISTS).map(([id,x])=>[id,{id,label:x.label,scope:x.scope}]));}
export function routeSpecialists(request=''){
  const text=String(request||'').toLowerCase();
  const scores=Object.entries(SPECIALISTS).map(([id,s])=>[id,s.keywords.reduce((n,k)=>n+(text.includes(k)?1:0),0)]);
  const ranked=scores.filter(([,score])=>score>0).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([id])=>id);
  if(!ranked.includes('product'))ranked.unshift('product');
  if(!ranked.includes('qa'))ranked.push('qa');
  return [...new Set(ranked)].slice(0,6);
}
export function specialistInstructions(ids=[]){
  return ids.map(id=>SPECIALISTS[id]?SPECIALISTS[id].label+': '+SPECIALISTS[id].scope:'').filter(Boolean);
}
export {SPECIALISTS};