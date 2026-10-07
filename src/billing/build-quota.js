export const FREE_BUILD_QUOTAS=Object.freeze({basic:3,threeD:1,animated:1});
export const NATIVE_TARGET_IDS=Object.freeze([
  'android-kotlin','android-twa','mobile-expo','mobile-flutter','ios-swiftui','desktop-electron','desktop-tauri','multiplatform-kmp'
]);

export function classifyBuildKind(request='',targetId=''){
  const target=String(targetId||'').trim().toLowerCase();
  if(NATIVE_TARGET_IDS.includes(target)||/(^|\W)(apk|aab|android app|ios app|native app|flutter app|react native|kotlin|swiftui|electron|tauri)(\W|$)/.test(String(request||'').toLowerCase()))return 'native';
  const text=String(request||'').toLowerCase();
  if(/(^|\W)(3d|3-d|webgl|three\.js|threejs|babylon|spline|immersive|virtual tour|3d viewer|3d product|glb|gltf)(\W|$)/.test(text))return 'threeD';
  if(/(^|\W)(animated|animation|motion|microinteraction|scroll reveal|parallax|gsap|lottie|rive)(\W|$)/.test(text))return 'animated';
  return 'basic';
}

export function buildQuotaUsage(runs=[]){
  const usage={basic:0,threeD:0,animated:0,native:0};
  for(const row of Array.isArray(runs)?runs:[]){
    const kind=classifyBuildKind(row?.request||'',row?.target_id||row?.targetId||'');
    if(kind in usage)usage[kind]+=1;
  }
  return usage;
}

export function targetPlanGate({plan='free',request='',targetId=''}={}){
  const kind=classifyBuildKind(request,targetId);
  if(plan==='free'&&kind==='native'){
    return {ok:false,kind,requiredPlan:'pro',reason:'native_apps_require_paid_plan',message:'Native Android/iOS/desktop builds and APK/AAB export require Pro or Team.'};
  }
  return {ok:true,kind};
}

export function canStartBuildQuota({plan='free',request='',targetId='',usage={}}={}){
  const targetGate=targetPlanGate({plan,request,targetId});
  if(!targetGate.ok)return {...targetGate,usage};
  if(plan!=='free')return {ok:true,kind:targetGate.kind,usage,remaining:null};
  const kind=targetGate.kind;
  const limit=FREE_BUILD_QUOTAS[kind];
  const used=Number(usage?.[kind]||0);
  return {
    ok:used<limit,
    kind,
    limit,
    used,
    remaining:Math.max(0,limit-used),
    usage,
    reason:used<limit?null:'free_build_quota_reached'
  };
}
