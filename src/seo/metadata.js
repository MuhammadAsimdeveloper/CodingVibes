export const PUBLIC_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

export function normalizeBaseUrl(value=''){
  try{const u=new URL(String(value).trim());if(!/^https?:$/.test(u.protocol))return '';return u.origin.replace(/\/$/,'');}
  catch{return '';}
}
export function absoluteUrl(base,path='/'){
  const root=normalizeBaseUrl(base)||String(base||'').replace(/\/$/,'');
  const target=String(path||'/').startsWith('/')?String(path||'/'):'/';
  return root?root+target:target;
}
export function cleanTitle(value,fallback='Untitled page'){
  const text=String(value||fallback).replace(/\s+/g,' ').trim();
  return text.length<=60?text:text.slice(0,57).replace(/\s+$/,'')+'…';
}
export function cleanDescription(value,fallback=''){
  const text=String(value||fallback).replace(/\s+/g,' ').trim();
  return text.length<=160?text:text.slice(0,157).replace(/\s+$/,'')+'…';
}
export function keywordSet(value){
  return [...new Set(String(value||'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean))].slice(0,24);
}
export function organizationSchema(baseUrl,name='Build Vibe'){
  const base=normalizeBaseUrl(baseUrl)||'__SITE_URL__';
  return {'@type':'Organization','@id':base+'/#organization',name,url:base+'/',logo:absoluteUrl(base,'/favicon.svg')};
}
export function websiteSchema(baseUrl,name='Build Vibe',description='AI website and app builder'){
  const base=normalizeBaseUrl(baseUrl)||'__SITE_URL__';
  return {'@type':'WebSite','@id':base+'/#website',name,url:base+'/',description,publisher:{'@id':base+'/#organization'}};
}
export function softwareApplicationSchema(baseUrl){
  const base=normalizeBaseUrl(baseUrl)||'__SITE_URL__';
  return {'@type':['SoftwareApplication','WebApplication'],'@id':base+'/#software',name:'Build Vibe',url:base+'/',applicationCategory:'DeveloperApplication',operatingSystem:'Web',description:'AI website and app builder for creating verified websites, web apps and mobile product foundations.',offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}};
}
export function breadcrumbSchema(baseUrl,items=[]){
  const base=normalizeBaseUrl(baseUrl)||'__SITE_URL__';
  return {'@type':'BreadcrumbList','itemListElement':items.map((item,index)=>({'@type':'ListItem',position:index+1,name:String(item.name||''),item:absoluteUrl(base,item.path||'/')}))};
}
export function jsonLdGraph(nodes=[]){
  return JSON.stringify({'@context':'https://schema.org','@graph':nodes}).replaceAll('</','<\\/');
}
export function publicSeoGraph(baseUrl,{title,description,path='/',includeSoftware=false,siteName='Build Vibe'}={}){
  const base=normalizeBaseUrl(baseUrl)||'__SITE_URL__';
  const nodes=[organizationSchema(base,siteName),websiteSchema(base,siteName,'AI website and app builder'),{'@type':'WebPage','@id':absoluteUrl(base,path)+'#webpage',url:absoluteUrl(base,path),name:title,description,isPartOf:{'@id':base+'/#website'},about:{'@id':base+'/#organization'}}];
  if(includeSoftware)nodes.push(softwareApplicationSchema(base));
  return jsonLdGraph(nodes);
}
