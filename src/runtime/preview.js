import {startLocalPreview} from './local.js';
import {startContainerPreview} from './container.js';
import {DaytonaRuntime} from './daytona.js';
export async function startPreview(workspace,options={}){const mode=options.mode||process.env.CODINGVIBES_RUNTIME||(process.env.NODE_ENV==='production'?'daytona':'local');if(mode==='local')return startLocalPreview(workspace,options);if(mode==='container')return startContainerPreview(workspace,options);if(mode==='daytona'){const rt=new DaytonaRuntime();return rt.start(workspace);}throw new Error(`Unknown CODINGVIBES_RUNTIME: ${mode}`);}
