const DEFAULT_MAX_ROUTES=100;
function safeRoute(pathname){const value=String(pathname||'/').split('?')[0].trim()||'/';return value.length>160?value.slice(0,160):value;}
export class RequestTelemetry{
  constructor({maxRoutes=DEFAULT_MAX_ROUTES}={}){this.maxRoutes=Math.max(1,Math.min(500,Number(maxRoutes)||DEFAULT_MAX_ROUTES));this.startedAt=Date.now();this.total=0;this.errors=0;this.statuses=new Map();this.routes=new Map();}
  record({method='GET',path='/',status=200,durationMs=0}={}){
    this.total++;
    if(Number(status)>=500)this.errors++;
    const family=Math.floor(Number(status)/100)||0;this.statuses.set(family,(this.statuses.get(family)||0)+1);
    const key=String(method).toUpperCase()+' '+safeRoute(path);const current=this.routes.get(key)||{method:String(method).toUpperCase(),path:safeRoute(path),requests:0,errors:0,totalDurationMs:0,maxDurationMs:0};
    current.requests++;current.totalDurationMs+=Math.max(0,Number(durationMs)||0);current.maxDurationMs=Math.max(current.maxDurationMs,Math.max(0,Number(durationMs)||0));if(Number(status)>=500)current.errors++;this.routes.set(key,current);
    if(this.routes.size>this.maxRoutes)this.routes.delete(this.routes.keys().next().value);
  }
  snapshot(){
    const routes=[...this.routes.values()].sort((a,b)=>b.requests-a.requests).map(x=>({...x,avgDurationMs:x.requests?Math.round((x.totalDurationMs/x.requests)*100)/100:0,totalDurationMs:Math.round(x.totalDurationMs*100)/100}));
    return {startedAt:new Date(this.startedAt).toISOString(),uptimeSeconds:Math.max(0,Math.floor((Date.now()-this.startedAt)/1000)),requests:{total:this.total,errors:this.errors},statusFamilies:Object.fromEntries([...this.statuses.entries()].sort((a,b)=>a[0]-b[0]).map(([k,v])=>[String(k),v])),routes};
  }
}
export const telemetry=new RequestTelemetry({maxRoutes:Number(process.env.CODINGVIBES_TELEMETRY_MAX_ROUTES||100)});
