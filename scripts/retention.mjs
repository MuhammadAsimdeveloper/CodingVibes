import {Store} from '../src/db/store.js';
import {retentionConfig,applyRetention} from '../src/ops/retention.js';
const store=new Store(process.env.DATABASE_PATH||undefined);
try{console.log(JSON.stringify(applyRetention(store),null,2));}finally{store.close();}
