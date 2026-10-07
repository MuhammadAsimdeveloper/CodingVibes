const COLORS={blue:'#3b82f6',red:'#ef4444',green:'#22c55e',purple:'#8b5cf6',black:'#111827',white:'#ffffff'};
const clean=s=>String(s??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim();
function op(css,reason){return{css,reason};}
export function classifyAssistantRequest(request=''){
 const text=clean(request).toLowerCase(),operations=[];
 if(/\bblue\b/.test(text))operations.push(op({color:COLORS.blue},'color'));
 if(/\bred\b/.test(text))operations.push(op({color:COLORS.red},'color'));
 if(/\bgreen\b/.test(text))operations.push(op({color:COLORS.green},'color'));
 if(/\bpurple\b/.test(text))operations.push(op({color:COLORS.purple},'color'));
 if(/\bblack\b/.test(text))operations.push(op({color:COLORS.black},'color'));
 if(/\bwhite\b/.test(text))operations.push(op({color:COLORS.white},'color'));
 if(/\b(center|centered|centre|centred)\b/.test(text))operations.push(op({textAlign:'center'},'alignment'));
 if(/\b(bold|heavier|stronger)\b/.test(text))operations.push(op({fontWeight:'700'},'weight'));
 if(/\b(rounded|round)\b/.test(text))operations.push(op({borderRadius:'16px'},'radius'));
 if(/\b(bigger|larger|increase.*size)\b/.test(text))operations.push(op({fontSize:'1.125em'},'size'));
 if(/\b(smaller|shrink|decrease.*size)\b/.test(text))operations.push(op({fontSize:'0.925em'},'size'));
 if(/\b(left|left-align)\b/.test(text))operations.push(op({textAlign:'left'},'alignment'));
 if(/\b(right|right-align)\b/.test(text))operations.push(op({textAlign:'right'},'alignment'));
 return {intent:'visual-edit',request:clean(request).slice(0,2000),operations};
}
