const GENRES=[
{id:'web-landing',label:'Landing & Marketing Websites',family:'Websites',kind:'business',experience:['standard','motion'],keywords:['landing','marketing','startup','launch']},
{id:'web-portfolio',label:'Portfolio & Creative',family:'Websites',kind:'portfolio',experience:['standard','motion','3d'],keywords:['portfolio','creative','photography','agency']},
{id:'web-animated',label:'Animated & Motion Websites',family:'Websites',kind:'business',experience:['motion'],keywords:['animated','motion','scroll','microinteraction']},
{id:'web-business',label:'Business & Local Services',family:'Websites',kind:'business',experience:['standard','motion'],keywords:['business','local','services','contractor']},
{id:'web-commerce',label:'Ecommerce & Marketplace',family:'Websites',kind:'ecommerce',experience:['standard','motion','3d'],keywords:['store','shop','ecommerce','marketplace']},
{id:'web-app',label:'SaaS, Dashboards & Web Apps',family:'Web Apps',kind:'business',experience:['standard','motion','3d'],keywords:['saas','dashboard','web app','portal']},
{id:'web-content',label:'Content, Blog & CMS',family:'Websites',kind:'content',experience:['standard','motion'],keywords:['blog','cms','magazine','docs']},
{id:'web-education',label:'Education & Courses',family:'Websites',kind:'education',experience:['standard','motion','3d'],keywords:['course','academy','education']},
{id:'web-event',label:'Events & Conferences',family:'Websites',kind:'event',experience:['standard','motion','3d'],keywords:['event','conference','schedule']},
{id:'web-realestate',label:'Real Estate & Property',family:'Websites',kind:'realEstate',experience:['standard','motion','3d'],keywords:['property','real estate','developer','listing']},
{id:'web-hospitality',label:'Hospitality & Restaurants',family:'Websites',kind:'hospitality',experience:['standard','motion','3d'],keywords:['hotel','restaurant','resort','hospitality']},
{id:'web-3d',label:'3D & Immersive Experiences',family:'Websites',kind:'immersive',experience:['3d'],keywords:['3d','immersive','webgl','interactive']},
{id:'web-pwa',label:'PWA & Offline Web Apps',family:'Web Apps',kind:'business',experience:['standard','motion','3d'],keywords:['pwa','offline','installable']},
{id:'android-apk',label:'Android APK / AAB',family:'Apps',kind:'business',experience:['standard','motion'],keywords:['android','apk','aab']},
{id:'ios-app',label:'iOS Apps',family:'Apps',kind:'business',experience:['standard','motion'],keywords:['ios','iphone','ipad','swiftui']},
{id:'cross-platform',label:'Cross-platform Mobile',family:'Apps',kind:'business',experience:['standard','motion'],keywords:['flutter','react native','kotlin multiplatform']},
{id:'desktop-app',label:'Desktop Apps',family:'Apps',kind:'business',experience:['standard','motion'],keywords:['desktop','electron','tauri']},
{id:'interactive-3d-app',label:'3D Mobile / Desktop Apps',family:'Apps',kind:'business',experience:['3d'],keywords:['3d app','immersive app','interactive app']}
];
export function templateGenres(){return GENRES.map(x=>({...x,experience:[...x.experience],keywords:[...x.keywords]}));}
export function genreForTemplate(template){const t=template||{},e=String(t.experience||'standard'),k=String(t.kind||'business');if(e==='3d'&&k==='immersive')return'web-3d';if(e==='3d'&&['ecommerce','portfolio','realEstate','hospitality'].includes(k))return 'web-'+({ecommerce:'commerce',portfolio:'portfolio',realEstate:'realestate',hospitality:'hospitality'}[k]);return GENRES.find(g=>g.kind===k&&g.experience.includes(e))?.id||'web-business';}
export {GENRES};