const DEFAULT_MAX_ROUTES=100;
function safeRoute(pathname){const value=String(pathname||'/').split('?')[0].replace(/[\u0000-\u001f\u007f]/g,'').trim()||'/';const route=value.replace(/(^|\/)[A-Za-z0-9_-]{20,}(?=\/|$)/g,'$1:id');return route.length>160?route.slice(0,160):route;}
export function requestLogEvent({requestId='',method='GET',path='/',status=200,durationMs=0,at=new Date()}={}){
  const code=Number.isInteger(Number(status))?Number(status):500;
  const verb=String(method||'GET').toUpperCase().replace(/[^A-Z]/g,'').slice(0,12)||'UNKNOWN';
  const id=String(requestId||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,100);
  const duration=Math.round(Math.max(0,Number(durationMs)||0)*100)/100;
  return {timestamp:new Date(at).toISOString(),level:code>=500?'error':code>=400?'warn':'info',event:'http.request',requestId:id,method:verb,path:safeRoute(path),status:code,durationMs:duration};
}
export class RequestTelemetry{
  constructor({maxRoutes=DEFAULT_MAX_ROUTES}={}){this.maxRoutes=Math.max(1,Math.min(500,Number(maxRoutes)||DEFAULT_MAX_ROUTES));this.startedAt=Date.now();this.total=0;this.errors=0;this.statuses=new Map();this.routes=new Map();}
  record({method='GET',path='/',status=200,durationMs=0}={}){
    this.total++;
    if(Number(status)>=500)this.errors++;
    const family=Math.floor(Number(status)/100)||0;this.statuses.set(family,(this.statuses.get(family)||0)+1);
    const key=String(method).toUpperCase()+' '+safeRoute(path);const current=this.routes.get(key)||{method:String(method).toUpperCase(),path:safeRoute(path),requests:0,errors:0,totalDurationMs:0,maxDurationMs:0,durations:[]};
    const duration=Math.max(0,Number(durationMs)||0);current.requests++;current.totalDurationMs+=duration;current.maxDurationMs=Math.max(current.maxDurationMs,duration);current.durations.push(duration);if(current.durations.length>100)current.durations.shift();if(Number(status)>=500)current.errors++;this.routes.set(key,current);
    if(this.routes.size>this.maxRoutes)this.routes.delete(this.routes.keys().next().value);
  }
  snapshot(){
    const routeStats=[...this.routes.values()];
    const percentile=(values,p)=>{
      const xs=values.filter(Number.isFinite).sort((a,b)=>a-b);if(!xs.length)return 0;
      const index=Math.min(xs.length-1,Math.max(0,Math.ceil(xs.length*p)-1));return Number(xs[index].toFixed(2));
    };
    const durations=routeStats.flatMap(x=>x.durations||[]);
    const routes=routeStats.sort((a,b)=>b.requests-a.requests).map(x=>({...x,avgDurationMs:x.requests?Math.round((x.totalDurationMs/x.requests)*100)/100:0,totalDurationMs:Math.round(x.totalDurationMs*100)/100,p95DurationMs:percentile(x.durations,0.95),durations:undefined}));
    return {startedAt:new Date(this.startedAt).toISOString(),uptimeSeconds:Math.max(0,Math.floor((Date.now()-this.startedAt)/1000)),requests:{total:this.total,errors:this.errors,errorRate:this.total?Number((this.errors/this.total).toFixed(4)):0},latency:{p95Ms:percentile(durations,0.95)},statusFamilies:Object.fromEntries([...this.statuses.entries()].sort((a,b)=>a[0]-b[0]).map(([k,v])=>[String(k),v])),routes};
  }
}
export const telemetry=new RequestTelemetry({maxRoutes:Number(process.env.CODINGVIBES_TELEMETRY_MAX_ROUTES||100)});
