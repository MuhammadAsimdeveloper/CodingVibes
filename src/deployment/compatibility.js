const CAPABILITIES={
  github:{source:true,static:true,server:true,native:true},
  vercel:{source:false,static:true,server:false,native:false},
  netlify:{source:false,static:true,server:false,native:false},
  cloudflare:{source:false,static:true,server:false,native:false},
  'coding-vibes':{source:false,static:true,server:true,native:true},
  manual:{source:true,static:true,server:true,native:true}
};
export function compatibility(provider,artifact){
  const cap=CAPABILITIES[String(provider||'').toLowerCase()];
  if(!cap)return{provider,compatible:false,reason:'Provider is not registered.'};
  const server=Boolean(artifact?.deploymentMetadata?.serverRequired);
  if(server&&!cap.server)return{provider,compatible:false,reason:'Project requires a server-backed runtime. This provider adapter currently supports static output only; use GitHub/manual or a server-capable adapter.'};
  if(!artifact?.deploymentMetadata?.missingFiles?.length===false)return{provider,compatible:false,reason:'Artifact validation failed.'};
  return{provider,compatible:true,mode:server?'server':'static',sourceUnchanged:true};
}
export function compatibilityMatrix(){return Object.entries(CAPABILITIES).map(([provider,capabilities])=>({provider,...capabilities}))}
