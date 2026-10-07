import fs from 'node:fs';
import path from 'node:path';

const MOTION_CSS=":root{--bv-motion-ease:cubic-bezier(.16,1,.3,1);--bv-motion-duration:700ms;--bv-motion-distance:24px}\n.motion-item{opacity:0;transform:translate3d(0,var(--bv-motion-distance),0) scale(.99);transition:opacity var(--bv-motion-duration) var(--bv-motion-ease),transform var(--bv-motion-duration) var(--bv-motion-ease);transition-delay:calc(var(--motion-index,0) * 55ms)}\n.motion-visible{opacity:1;transform:none}\n.motion-scene{will-change:transform;animation:bv-scene-float 12s ease-in-out infinite}\n.motion-product{opacity:0;transform:translateY(16px) scale(.985);transition:opacity 560ms var(--bv-motion-ease),transform 560ms var(--bv-motion-ease);transition-delay:calc(var(--motion-index,0) * 45ms)}\n.motion-product.motion-visible{opacity:1;transform:none}\n@keyframes bv-scene-float{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-6px,0)}}\nbutton,.primary-link{transition:transform 180ms ease,box-shadow 180ms ease}\nbutton:hover,.primary-link:hover{transform:translate3d(var(--mx,0),calc(-2px + var(--my,0)),0)}\n@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto!important}.motion-item,.motion-product{opacity:1!important;transform:none!important;transition:none!important}.motion-scene{animation:none!important}button,.primary-link{transition:none!important}}\n";
const MOTION_JS="const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;\nconst body=document.body;\nfunction init(){\n if(!body)return;\n const nodes=[...new Set(document.querySelectorAll('main > section, main > article, main > .hero, main > .card, [data-motion-section]'))];\n nodes.forEach((el,index)=>{el.classList.add('motion-item');el.style.setProperty('--motion-index',String(Math.min(index,10)))});\n if(reduced){nodes.forEach(n=>n.classList.add('motion-visible'));return;}\n if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(!e.isIntersecting)return;e.target.classList.add('motion-visible');io.unobserve(e.target)})},{threshold:.08,rootMargin:'0px 0px -8%'});nodes.forEach(n=>io.observe(n))}else nodes.forEach(n=>n.classList.add('motion-visible'));\n if(matchMedia?.('(pointer:fine)').matches){document.querySelectorAll('button,.primary-link').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--mx',((e.clientX-r.left)/Math.max(1,r.width)-.5)*4+'px');el.style.setProperty('--my',((e.clientY-r.top)/Math.max(1,r.height)-.5)*3+'px')});el.addEventListener('pointerleave',()=>{el.style.removeProperty('--mx');el.style.removeProperty('--my')})})}\n}\nif(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();\n";

function publicFiles(root){
  const dir=path.join(root,'public');
  if(!fs.existsSync(dir))return[];
  const out=[];
  const walk=(current)=>{
    for(const entry of fs.readdirSync(current,{withFileTypes:true})){
      if(out.length>=80)break;
      const full=path.join(current,entry.name);
      if(entry.isDirectory())walk(full);
      else if(entry.isFile()&&entry.name.endsWith('.html'))out.push(full);
    }
  };
  walk(dir);return out;
}

function injectOnce(html,needle,replacement){
  return html.includes(needle)?html:html.includes('</head>')?html.replace('</head>',replacement+'</head>'):html;
}

export function applyExperienceQuality(workspace,{kind='business',mode='smooth'}={}){
  const root=path.resolve(workspace);
  const publicDir=path.join(root,'public');
  if(!fs.existsSync(publicDir))return{changedFiles:[],enhancements:[],scanned:0,applied:false};
  fs.mkdirSync(publicDir,{recursive:true});
  const cssPath=path.join(publicDir,'build-vibe-motion.css');
  const jsPath=path.join(publicDir,'build-vibe-motion.js');
  const changes=[];
  if(!fs.existsSync(cssPath)){fs.writeFileSync(cssPath,MOTION_CSS);changes.push('added build-vibe-motion.css');}
  if(!fs.existsSync(jsPath)){fs.writeFileSync(jsPath,MOTION_JS);changes.push('added build-vibe-motion.js');}
  const files=publicFiles(root);
  for(const file of files){
    let html=fs.readFileSync(file,'utf8');
    const relative=path.relative(publicDir,file).split(path.sep).join('/');
    if(/^(admin|login)(?:-|\.)/i.test(relative))continue;
    let next=html;
    next=injectOnce(next,'href="/build-vibe-motion.css"','<link rel="stylesheet" href="/build-vibe-motion.css">');
    next=injectOnce(next,'src="/build-vibe-motion.js"','<script src="/build-vibe-motion.js" defer></script>');
    if(next!==html){fs.writeFileSync(file,next);changes.push('motion baseline linked: '+relative);}
  }
  return{changedFiles:changes,enhancements:['dependency-free motion baseline','reduced-motion fallback','responsive-safe interaction motion'],scanned:files.length,applied:true,kind,mode};
}
