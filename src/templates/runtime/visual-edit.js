const STYLE_ID='cv-visual-edit-style';
function ensureStyle(){if(document.getElementById(STYLE_ID))return;const s=document.createElement('style');s.id=STYLE_ID;s.textContent='[data-cv-selected]{outline:2px solid #7d8dff!important;outline-offset:3px!important;cursor:crosshair!important}';document.head.append(s);}
function describe(el){
 const text=(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,120);
 const id=String(el.id||'').replace(/[^A-Za-z0-9_-]/g,'');const classes=String(el.className||'').split(/\s+/).filter(x=>/^[A-Za-z_-][A-Za-z0-9_-]*$/.test(x)).slice(0,2);const selector=id?'#'+id:classes.length?'.'+classes.join('.'):(el.tagName||'').toLowerCase();return {tag:el.tagName.toLowerCase(),id:el.id||null,classes,text,selector};
}
let last=null;
document.addEventListener('click',e=>{
 if(e.defaultPrevented)return;
 if(!e.target||!(e.target instanceof Element))return;
 const el=e.target.closest('main,header,section,article,button,a,h1,h2,h3,p,img,form,input,select,textarea');
 if(!el||el.id==='visualEditToggle')return;
 e.preventDefault();
 if(last)last.removeAttribute('data-cv-selected');
 el.setAttribute('data-cv-selected','1');last=el;ensureStyle();
 try{window.parent.postMessage({type:'buildvibe:visual-select',selection:describe(el)},'*')}catch{}
},true);
window.addEventListener('beforeunload',()=>last?.removeAttribute('data-cv-selected'));
