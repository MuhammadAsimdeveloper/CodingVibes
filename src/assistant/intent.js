const COLORS={blue:'#3b82f6',red:'#ef4444',green:'#22c55e',black:'#000000',white:'#ffffff',purple:'#8b5cf6',orange:'#f97316',yellow:'#eab308',pink:'#ec4899',gray:'#6b7280',grey:'#6b7280'};
const clean=v=>String(v??'').toLowerCase().trim();
function op(css,reason){return {type:'style',reason,css};}
export function classifyAssistantRequest(input=''){
  const text=clean(input),operations=[];
  const color=text.match(/\b(blue|red|green|black|white|purple|orange|yellow|pink|gray|grey)\b/);
  if(color)operations.push(op({color:COLORS[color[1]]},'color'));
  if(/\b(?:bigger|larger|increase(?:\s+the)?\s+(?:size|font)|make it larger)\b/.test(text))operations.push(op({fontSize:'1.18rem'},'increase text size'));
  if(/\b(?:smaller|shrink|decrease(?:\s+the)?\s+(?:size|font))\b/.test(text))operations.push(op({fontSize:'0.9rem'},'decrease text size'));
  const align=text.match(/\b(left|center(?:ed)?|right|justify)\b/);if(align)operations.push(op({textAlign:align[1].replace(/ed$/,'' )},'alignment'));
  if(/\b(?:bold|heavier|stronger)\b/.test(text))operations.push(op({fontWeight:'700'},'font weight'));
  if(/\b(?:rounded|rounder|more rounded)\b/.test(text))operations.push(op({borderRadius:'16px'},'border radius'));
  if(/\b(?:square|less rounded)\b/.test(text))operations.push(op({borderRadius:'4px'},'border radius'));
  if(/\b(?:background|bg)\b[\s\S]*\b(blue|red|green|black|white|purple|orange|yellow|pink|gray|grey)\b/.test(text)){
    const bg=text.match(/\b(blue|red|green|black|white|purple|orange|yellow|pink|gray|grey)\b/)?.[1];if(bg)operations.push(op({backgroundColor:COLORS[bg]},'background color'));
  }
  return {kind:operations.length?'visual_edit':'general',operations,summary:operations.length?'Parsed visual changes from the user instruction.':'No deterministic visual edit detected.'};
}
export function summarizeVisualEdit(request=''){return classifyAssistantRequest(request).operations.map(x=>x.reason).join(', ');}
