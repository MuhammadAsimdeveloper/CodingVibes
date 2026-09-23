import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {TARGET_RUNNER_IMAGES,RUNNER_RESOURCE_LIMITS} from './dockerfiles.js';
import {CODINGVIBES_VERSION} from '../version.js';

export const FLEET_VERSION=CODINGVIBES_VERSION;
export const RUNNER_JOB_STATES=['queued','leased','dependency_install','building','artifact_collection','device_smoke','verified','failed','blocked','released'];
export const RUNNER_CAPABILITIES={
  android:{labels:['codingvibes','android-builder'],targets:['android-kotlin','android-twa','mobile-expo','multiplatform-kmp'],device:false},
  flutter:{labels:['codingvibes','flutter-builder'],targets:['mobile-flutter'],device:false},
  rust:{labels:['codingvibes','rust-builder'],targets:['desktop-tauri'],device:false},
  androidDevice:{labels:['codingvibes','android-device'],targets:['android-kotlin','android-twa','mobile-flutter','mobile-expo'],device:true},
  macos:{labels:['codingvibes','macos-xcode','xcode'],targets:['ios-swiftui'],device:false},
};

export function fleetManifest(){return {schema:'codingvibes.runner-fleet.v2',version:FLEET_VERSION,generatedAt:new Date().toISOString(),host:{platform:process.platform,arch:process.arch,node:process.version},limits:RUNNER_RESOURCE_LIMITS,images:TARGET_RUNNER_IMAGES,capabilities:RUNNER_CAPABILITIES,jobStates:RUNNER_JOB_STATES,security:{buildNetwork:'none',dependencyNetwork:'named-controlled-egress-only',macosAuth:'required',macosFixedCommandProfiles:true,artifactSha256:true,artifactUploadTimeout:true,symlinkUploadPolicy:'skip',productionImagePolicy:'digest-pinned',runnerLeasePolicy:'bounded-concurrency',secretEnvPolicy:'deny-by-default'}};}
export function writeFleetManifest(root=path.join(process.cwd(),'data','fleet')){fs.mkdirSync(root,{recursive:true});const file=path.join(root,'fleet-manifest.json');fs.writeFileSync(file,JSON.stringify(fleetManifest(),null,2)+'\n');return file;}
export function makeJobEnvelope({target,phase='build',runId,workspaceSha256,request=''}={}){return {schema:'codingvibes.runner-job.v2',jobId:runId||`cv-${crypto.randomUUID()}`,target,phase,workspaceSha256:workspaceSha256||null,requestHash:crypto.createHash('sha256').update(String(request)).digest('hex'),createdAt:new Date().toISOString(),host:os.hostname(),expiresAt:new Date(Date.now()+RUNNER_RESOURCE_LIMITS.timeoutMs+60_000).toISOString()};}
