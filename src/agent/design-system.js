const has=(s,...xs)=>xs.some(x=>s.includes(x));

const MOTION_PRESETS={
  reduced:{mode:'reduced',scroll:'none',hover:'subtle'},
  smooth:{mode:'smooth',scroll:'reveal',hover:'lift'},
  snappy:{mode:'snappy',scroll:'reveal',hover:'lift'},
  cinematic:{mode:'cinematic',scroll:'reveal',hover:'lift'}
};

export function inferDesignSystem(text,visual){
  const lower=String(text||'').toLowerCase();
  const style=visual?.style||'modern';
  const palettes={
    minimal:{background:'#fafafa',surface:'#ffffff',text:'#171717',muted:'#666666',accent:'#111111'},
    brutalist:{background:'#f4f0e8',surface:'#fffdf8',text:'#111111',muted:'#4b4b4b',accent:'#ff5a36'},
    editorial:{background:'#f6f1e8',surface:'#fffdf7',text:'#1d1b19',muted:'#6b645c',accent:'#9b2c2c'},
    retro:{background:'#f7e9c8',surface:'#fff4d8',text:'#38260d',muted:'#705632',accent:'#d14b2f'},
    glass:{background:'#08111f',surface:'rgba(255,255,255,.08)',text:'#f7fbff',muted:'#a8b7ca',accent:'#8ea8ff'},
    luxury:{background:'#0a0a0a',surface:'#151515',text:'#f6f1e7',muted:'#aaa092',accent:'#d5b36a'},
    futuristic:{background:'#060812',surface:'#0c1021',text:'#eff3ff',muted:'#9aa9c5',accent:'#38bdf8'},
    playful:{background:'#fffaf7',surface:'#ffffff',text:'#241a22',muted:'#766773',accent:'#ff6bb6'},
    bold:{background:'#f8f8f5',surface:'#ffffff',text:'#121212',muted:'#565656',accent:'#0f766e'},
    modern:{background:'#0b1020',surface:'#11192c',text:'#eef3ff',muted:'#aebbd1',accent:'#83a4ff'}
  };
  const palette={...(palettes[style]||palettes.modern)};
  const radius=has(lower,'sharp','square','brutalist')?'4px':has(lower,'rounded','soft')?'12px':'8px';
  const shadow=style==='minimal'||style==='editorial'?'subtle':style==='luxury'||style==='futuristic'?'dramatic':'soft';
  const explicitStatic=has(lower,'static','no animation','without animation','reduced motion only');
  const requestedMotion=explicitStatic?'reduced':visual?.animation?(has(lower,'slow','cinematic')?'cinematic':has(lower,'snappy','fast')?'snappy':'smooth'):(has(lower,'luxury','premium','editorial')?'luxury':has(lower,'playful','fun','friendly')?'playful':'smooth');
  const motion={...(MOTION_PRESETS[requestedMotion]||MOTION_PRESETS.smooth),tokens:{
    duration:{fast:'120ms',base:'240ms',slow:'360ms',scene:'500ms'},
    easing:{standard:'cubic-bezier(.22,1,.36,1)',enter:'cubic-bezier(.16,1,.3,1)',exit:'cubic-bezier(.7,0,.84,0)'},
    stagger:'40ms',
    distance:'12px'
  },accessibility:{reducedMotion:true}};
  const layout=has(lower,'bento','asymmetric')?'bento':has(lower,'split','two column')?'split':has(lower,'centered')?'centered':'responsive-grid';
  const type={
    heading:has(lower,'serif','editorial','magazine')?'serif-display':has(lower,'mono','monospace','terminal')?'mono':'display-sans',
    body:has(lower,'serif body')?'serif':'sans',
    scale:has(lower,'huge','oversized','giant hero')?'dramatic':has(lower,'compact','dense')?'compact':'fluid'
  };
  return {style,palette,radius,shadow,motion,layout,type,accessibility:{semanticHtml:true,keyboardFocus:true,contrastTarget:'AA',reducedMotion:true},responsive:{breakpoints:[480,768,1024,1440],touchTargets:'comfortable'},effects:{gradients:Boolean(visual?.gradients),glass:Boolean(visual?.glass),threeD:Boolean(visual?.threeD),canvas:Boolean(visual?.canvas),parallax:false,magneticHover:false,clipReveal:false,cursorGlow:false,staggeredGrid:true},content:{tone:style==='editorial'?'editorial':style==='playful'?'friendly':'clear',density:visual?.density||'comfortable'}};
}
