(() => {
  const SELECTOR='[data-visual-edit],main h1,main h2,main h3,main p,main a,main button,main img,main section,main article,main nav,main form';
  let selected=null,outline=null;
  function payload(el){return {
    type:'buildvibe:visual-select',
    selector:el.id?'#'+el.id:null,
    tag:el.tagName?.toLowerCase()||'element',
    id:el.id||'',
    classes:String(el.className||'').slice(0,300),
    text:(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,240),
    rect:(()=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()
  };}
  function select(el){
    if(!el||el.closest?.('[data-visual-edit-ignore]'))return;
    selected=el;
    if(!outline){outline=document.createElement('div');outline.setAttribute('data-visual-edit-ignore','true');outline.style.cssText='position:fixed;z-index:2147483646;pointer-events:none;border:2px solid #7d8dff;border-radius:6px;box-shadow:0 0 0 1px #0b1020,0 0 24px rgba(125,141,255,.35);';document.body.appendChild(outline);}
    const r=el.getBoundingClientRect();Object.assign(outline.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
    window.parent?.postMessage(payload(el),'*');
  }
  function apply(css){if(!selected||!css||typeof css!=='object')return;for(const [key,value] of Object.entries(css)){if(typeof key!=='string'||typeof value!=='string')continue;if(['color','backgroundColor','fontSize','fontWeight','textAlign','borderRadius','letterSpacing','lineHeight','padding','margin','width','maxWidth'].includes(key))selected.style[key]=value;}select(selected);}
  function parseCommand(input){
    const text=String(input||'').toLowerCase(),css={};
    const colors={blue:'#3b82f6',red:'#ef4444',green:'#22c55e',black:'#000',white:'#fff',purple:'#8b5cf6',orange:'#f97316',yellow:'#eab308',pink:'#ec4899',gray:'#6b7280',grey:'#6b7280'};
    const color=text.match(/\b(blue|red|green|black|white|purple|orange|yellow|pink|gray|grey)\b/);if(color)css.color=colors[color[1]];
    if(/\bbackground\b/.test(text)&&color)css.backgroundColor=colors[color[1]];
    if(/\b(center|centered)\b/.test(text))css.textAlign='center';else if(/\bleft\b/.test(text))css.textAlign='left';else if(/\bright\b/.test(text))css.textAlign='right';
    if(/\b(?:bigger|larger|increase)\b/.test(text))css.fontSize='1.18rem';if(/\b(?:smaller|shrink|decrease)\b/.test(text))css.fontSize='0.9rem';
    if(/\b(?:bold|heavier|stronger)\b/.test(text))css.fontWeight='700';if(/\b(?:rounded|rounder)\b/.test(text))css.borderRadius='16px';if(/\b(?:square|less rounded)\b/.test(text))css.borderRadius='4px';
    return css;
  }
  function clear(){selected=null;if(outline){outline.remove();outline=null;}}
  document.addEventListener('click',e=>{const el=e.target?.closest?.(SELECTOR);if(!el)return;select(el);e.preventDefault();e.stopPropagation();},{capture:true});
  window.addEventListener('scroll',()=>{if(selected)select(selected)},{passive:true});
  window.addEventListener('resize',()=>{if(selected)select(selected)},{passive:true});
  window.addEventListener('keydown',e=>{if(e.key==='Escape')clear();});
  window.addEventListener('message',e=>{if(e.source!==window.parent)return;const d=e.data||{};if(d.type==='buildvibe:visual-apply')apply(d.css||{});if(d.type==='buildvibe:visual-command')apply(parseCommand(d.command||''));if(d.type==='buildvibe:visual-clear')clear();});
  document.documentElement.setAttribute('data-visual-selection','enabled');
  window.buildVibeVisualEdit={select,apply,clear};
  // buildvibe:visual-select
})();