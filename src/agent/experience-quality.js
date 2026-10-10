import fs from 'node:fs';
import path from 'node:path';

const MOTION_CSS=":root{--bv-motion-ease:cubic-bezier(.2,.8,.2,1);--bv-motion-duration:240ms;--bv-motion-distance:12px}\n.motion-item{opacity:0;transform:translate3d(0,var(--bv-motion-distance),0);transition:opacity var(--bv-motion-duration) var(--bv-motion-ease),transform var(--bv-motion-duration) var(--bv-motion-ease);transition-delay:calc(min(var(--motion-index,0),3) * 40ms)}\n.motion-visible{opacity:1;transform:none}\n.motion-product{opacity:0;transform:translateY(8px);transition:opacity 240ms var(--bv-motion-ease),transform 240ms var(--bv-motion-ease)}\n.motion-product.motion-visible{opacity:1;transform:none}\nbutton,.primary-link{transition:background-color 140ms ease,border-color 140ms ease,box-shadow 140ms ease}\nbutton:hover,.primary-link:hover{transform:translateY(-1px)}\n@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto!important}.motion-item,.motion-product{opacity:1!important;transform:none!important;transition:none!important}button,.primary-link{transition:none!important;transform:none!important}}\n"
const MOTION_JS="const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;\nconst body=document.body;\nfunction init(){\n if(!body)return;\n const nodes=[...new Set(document.querySelectorAll('main > section, main > article, main > .hero, main > .card, [data-motion-section]'))];\n nodes.forEach((el,index)=>{el.classList.add('motion-item');el.style.setProperty('--motion-index',String(Math.min(index,3)))});\n if(reduced){nodes.forEach(n=>n.classList.add('motion-visible'));return;}\n if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(!e.isIntersecting)return;e.target.classList.add('motion-visible');io.unobserve(e.target)})},{threshold:.08,rootMargin:'0px 0px -4%'});nodes.forEach(n=>io.observe(n))}else nodes.forEach(n=>n.classList.add('motion-visible'));\n}\nif(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();\n"

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
    next=injectOnce(next,'src="/build-vibe-motion.js"','<script type="module" src="/build-vibe-motion.js"></script>');
    if(next!==html){fs.writeFileSync(file,next);changes.push('motion baseline linked: '+relative);}
  }
  return{changedFiles:changes,enhancements:['subtle dependency-free reveal motion','reduced-motion fallback','no cursor-following effects or looping scroll animation'],scanned:files.length,applied:true,kind,mode};
}
