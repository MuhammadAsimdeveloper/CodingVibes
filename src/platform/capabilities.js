const CAPABILITIES = [
  {id:'website',label:'Websites',group:'Web',supports:['landing pages','business sites','blogs','portals','directories','marketing sites']},
  {id:'web-app',label:'Web apps',group:'Web',supports:['SaaS','dashboards','marketplaces','booking','CRM','internal tools']},
  {id:'commerce',label:'Commerce',group:'Product',supports:['catalog','cart','checkout','orders','inventory','discounts']},
  {id:'cms',label:'Visual CMS',group:'Content',supports:['pages','posts','media','custom collections','revisions','scheduled publishing']},
  {id:'backend',label:'Backend',group:'Product',supports:['database','API routes','auth','roles','webhooks','jobs','storage']},
  {id:'ai',label:'AI features',group:'AI',supports:['chat','agents','generation','classification','search','automation']},
  {id:'3d',label:'3D & immersive',group:'Experience',supports:['GLB/GLTF','product viewers','property tours','hotspots','camera paths']},
  {id:'pwa',label:'Progressive Web Apps',group:'Apps',supports:['installable web','offline','push-ready architecture']},
  {id:'android',label:'Android apps / APK',group:'Apps',supports:['Expo','Flutter','native Kotlin','TWA APK/AAB']},
  {id:'ios',label:'iOS apps',group:'Apps',supports:['Expo','Flutter','SwiftUI','App Store packaging architecture']},
  {id:'desktop',label:'Desktop apps',group:'Apps',supports:['Electron','Tauri','Windows','macOS','Linux']},
  {id:'deployment',label:'Deploy anywhere',group:'Delivery',supports:['GitHub','Vercel','Netlify','Cloudflare','ZIP','cPanel/manual hosting']},
  {id:'security',label:'Security & QA',group:'Quality',supports:['ownership','secret isolation','build checks','browser checks','visual QA','security review']},
];

export function listCapabilities(){return CAPABILITIES.map(x=>({...x,supports:[...x.supports]}));}
export function capabilityIds(){return CAPABILITIES.map(x=>x.id);}
