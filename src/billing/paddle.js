import { createHmac, timingSafeEqual } from 'node:crypto';

const API_BASE='https://api.paddle.com';

function config(env=process.env){
  return {
    apiKey:String(env.PADDLE_API_KEY||'').trim(),
    webhookSecret:String(env.PADDLE_WEBHOOK_SECRET||'').trim(),
    checkoutUrl:String(env.PADDLE_CHECKOUT_URL||'').trim(),
    proPriceId:String(env.PADDLE_PRICE_PRO_MONTHLY||'').trim(),
    teamPriceId:String(env.PADDLE_PRICE_TEAM_MONTHLY||'').trim(),
    apiBase:String(env.PADDLE_API_URL||API_BASE).trim().replace(/\/$/,'')
  };
}

function headerParts(signature){
  return String(signature||'').split(';').map(part=>part.trim()).filter(Boolean).reduce((out,part)=>{
    const i=part.indexOf('=');
    if(i>0){const key=part.slice(0,i).trim(),value=part.slice(i+1).trim();if(!out[key])out[key]=[];out[key].push(value);}
    return out;
  },{});
}

async function request(path,{env=process.env,method='POST',body,timeoutMs=15000}={}){
  const c=config(env);
  if(!c.apiKey)throw new Error('paddle_billing_not_configured');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),Math.max(1000,Number(timeoutMs)||15000));
  try{
    const response=await fetch(c.apiBase+path,{method,headers:{accept:'application/json','content-type':'application/json',authorization:'Bearer '+c.apiKey},body:body==null?undefined:JSON.stringify(body),signal:controller.signal});
    const raw=await response.text();let data={};
    try{data=raw?JSON.parse(raw):{}}catch{data={raw:raw.slice(0,2000)}}
    if(!response.ok)throw new Error(String(data?.error?.detail||data?.error?.message||data?.detail||`paddle_api_${response.status}`).slice(0,500));
    return data?.data??data;
  }catch(error){
    if(error?.name==='AbortError')throw new Error('paddle_request_timeout');
    throw error;
  }finally{clearTimeout(timer);}
}

export function getPaddleStatus(env=process.env){
  const c=config(env);
  const configured=Boolean(c.apiKey&&c.webhookSecret&&c.proPriceId&&c.teamPriceId);
  return {provider:'paddle',status:configured?'CONFIGURED':'NOT_CONFIGURED',available:configured,checkoutConfigured:Boolean(c.checkoutUrl),prices:{pro:Boolean(c.proPriceId),team:Boolean(c.teamPriceId)}};
}

export async function createPaddleCustomer({email,userId,env=process.env}={}){
  const value=await request('/customers',{env,body:{email:String(email||'').trim().toLowerCase(),custom_data:{build_vibe_user_id:String(userId||'')}}});
  return {id:value?.id||null,email:value?.email||null};
}

export async function createPaddleCheckoutTransaction({priceId,email,userId,plan,successUrl,cancelUrl,customerId=null,env=process.env}={}){
  const c=config(env);
  if(!priceId)throw new Error('paddle_price_not_configured');
  const body={items:[{price_id:String(priceId),quantity:1}],collection_mode:'automatic',custom_data:{build_vibe_user_id:String(userId||''),plan:String(plan||''),success_url:String(successUrl||''),cancel_url:String(cancelUrl||'')}};
  if(customerId)body.customer_id=String(customerId);
  else if(email)body.custom_data.customer_email=String(email).trim().toLowerCase();
  if(c.checkoutUrl)body.checkout={url:c.checkoutUrl};
  const tx=await request('/transactions',{env,body});
  return {id:tx?.id||null,status:tx?.status||'draft',url:tx?.checkout?.url||null,customerId:tx?.customer_id||customerId||null,subscriptionId:tx?.subscription_id||null};
}

export async function createPaddlePortalSession({customerId,subscriptionId=null,env=process.env}={}){
  if(!customerId)throw new Error('paddle_customer_missing');
  const body=subscriptionId?{subscription_ids:[String(subscriptionId)]}:{};
  const data=await request('/customers/'+encodeURIComponent(String(customerId))+'/portal-sessions',{env,body});
  return {id:data?.id||null,url:data?.urls?.general?.overview||null,subscriptionUrl:data?.urls?.subscriptions?.[0]?.view_subscription||null};
}

export function verifyPaddleSignature(rawBody,signature,secret,toleranceSec=5){
  if(!rawBody||!signature||!secret)return false;
  const parts=headerParts(signature),timestamp=Number(parts.ts?.[0]||0),candidates=parts.h1||[];
  if(!timestamp||!candidates.length||Math.abs(Date.now()/1000-timestamp)>Number(toleranceSec||5))return false;
  const expected=createHmac('sha256',String(secret)).update(`${timestamp}:${rawBody}`).digest('hex');
  const expectedBuf=Buffer.from(expected,'hex');
  return candidates.some(candidate=>{
    try{
      const actual=Buffer.from(candidate,'hex');
      return actual.length===expectedBuf.length&&timingSafeEqual(actual,expectedBuf);
    }catch{return false;}
  });
}

export function paddlePlanFromPrice(priceId,env=process.env){
  const id=String(priceId||''),c=config(env);
  if(id&&c.teamPriceId===id)return 'team';
  if(id&&c.proPriceId===id)return 'pro';
  return null;
}

export function paddlePlanFromSubscription(subscription,env=process.env){
  const prices=Array.isArray(subscription?.items)?subscription.items:[];
  for(const item of prices){
    const plan=paddlePlanFromPrice(item?.price?.id,env);
    if(plan)return plan;
    const alt=paddlePlanFromPrice(item?.price_id,env);
    if(alt)return alt;
  }
  const p=String(subscription?.custom_data?.plan||subscription?.metadata?.plan||'');
  return ['pro','team'].includes(p)?p:null;
}

export {config as paddleConfig};
