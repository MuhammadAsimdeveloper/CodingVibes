export class OutboxRelay{
 constructor({repository,queue,workerId=process.env.HOSTNAME||('relay-'+process.pid),batchSize=20,intervalMs=1000,logger=console,signal}={}){
  if(!repository?.claimOutbox||!queue?.enqueue)throw new Error('outbox_repository_and_queue_required');this.repository=repository;this.queue=queue;this.workerId=workerId;this.batchSize=Math.max(1,Math.min(Number(batchSize)||20,100));this.intervalMs=Math.max(100,Number(intervalMs)||1000);this.logger=logger;this.signal=signal||null;this.stopping=false;this.timer=null;
 }
 stop(){this.stopping=true;if(this.timer){clearTimeout(this.timer);this.timer=null;}}
 async once(){
  const rows=await this.repository.claimOutbox({workerId:this.workerId,limit:this.batchSize});
  for(const item of rows){try{await this.queue.enqueue({id:item.id,type:item.topic,payload:item.payload,attempt:item.attempts});await this.repository.completeOutbox(item.id);}catch(error){await this.repository.failOutbox(item.id,error,{dead:Number(item.attempts||0)>=5});this.logger.error?.('outbox relay failure',error);}}
  return rows.length;
 }
 async start(){
  if(this.signal)this.signal.addEventListener('abort',()=>this.stop(),{once:true});
  while(!this.stopping){try{const count=await this.once();if(count===0)await sleep(this.intervalMs);}catch(error){this.logger.error?.('outbox relay loop failure',error);await sleep(Math.min(this.intervalMs*5,10000));}}
 }
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));