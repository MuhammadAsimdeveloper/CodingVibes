import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fleetStatus} from '../src/runners/status.js';

function command(name,args=['--version']){const r=spawnSync(name,args,{stdio:['ignore','pipe','pipe']});return {available:r.status===0,version:String(r.stdout||r.stderr).trim().split('\n')[0]||null};}
const status=fleetStatus();
const doctor={version:status,host:{node:process.version,platform:process.platform,arch:process.arch},toolchains:{docker:command('docker',['--version']),adb:command('adb',['version']),flutter:command('flutter',['--version']),rust:command('rustc',['--version']),java:command('java',['-version'])},macos:{configured:status.macos.configured,https:status.macos.https},linuxRemote:{configured:Boolean(process.env.CODINGVIBES_LINUX_RUNNER_URL),https:!process.env.CODINGVIBES_LINUX_RUNNER_URL||process.env.CODINGVIBES_LINUX_RUNNER_URL.startsWith('https://')},recommendations:[]};
if(!doctor.toolchains.docker.available)doctor.recommendations.push('Provision Docker on the Linux runner host.');
if(!doctor.toolchains.adb.available&&process.env.CODINGVIBES_ANDROID_DEVICE==='true')doctor.recommendations.push('Provision adb/emulator/device for Android smoke verification.');
if(status.production&&!status.security.pinnedImagesSatisfied)doctor.recommendations.push('Set digest-pinned production runner images.');
if(status.network.configured&&!status.network.safe)doctor.recommendations.push('Replace unsafe dependency network with a codingvibes-deps-* network.');
if(doctor.linuxRemote.configured&&!doctor.linuxRemote.https)doctor.recommendations.push('Use HTTPS for the remote Linux runner in production.');
console.log(JSON.stringify(doctor,null,2));
