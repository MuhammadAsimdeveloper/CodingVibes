import {TARGET_RUNNER_IMAGES} from './dockerfiles.js';
import {RUNNER_CAPABILITIES} from './fleet.js';
import {runnerLeaseManager} from './scheduler.js';

const DEP_NETWORK=/^codingvibes-deps-[a-z0-9-]{1,48}$/;
export function fleetStatus(store=null){
  const mode=process.env.CODINGVIBES_TARGET_RUNNER_MODE||'disabled';
  const dependencyNetwork=process.env.CODINGVIBES_DEPENDENCY_NETWORK||'';
  const production=process.env.NODE_ENV==='production';
  const pinned=Object.values(TARGET_RUNNER_IMAGES).every(x=>/@sha256:[a-f0-9]{64}$/i.test(String(x)))||process.env.CODINGVIBES_REQUIRE_PINNED_IMAGES==='false';
  const runners=store?store.listRunners({staleMs:Number(process.env.CODINGVIBES_RUNNER_STALE_MS||120000)}):[];
  return {mode,production,ready:mode!=='disabled'&&(!production||pinned),images:TARGET_RUNNER_IMAGES,capabilities:RUNNER_CAPABILITIES,network:{configured:Boolean(dependencyNetwork),safe:!dependencyNetwork||DEP_NETWORK.test(dependencyNetwork)},security:{pinnedImagesRequired:production&&process.env.CODINGVIBES_REQUIRE_PINNED_IMAGES!=='false',pinnedImagesSatisfied:pinned,androidDevice:process.env.CODINGVIBES_ANDROID_DEVICE==='true',controlTokenConfigured:Boolean(process.env.CODINGVIBES_RUNNER_CONTROL_TOKEN)},leases:runnerLeaseManager.snapshot(),runners,macos:{configured:Boolean(process.env.CODINGVIBES_MACOS_RUNNER_URL),https:!process.env.CODINGVIBES_MACOS_RUNNER_URL||process.env.CODINGVIBES_MACOS_RUNNER_URL.startsWith('https://')}};
}
