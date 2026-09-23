import { createHmac, timingSafeEqual } from 'node:crypto';
function headerValue(signature, key) { return String(signature||'').split(',').map(x=>x.split('=').map(v=>v.trim())).find(([k])=>k===key)?.[1]||null; }
export function verifyStripeSignature(rawBody, signature, secret, toleranceSec=300) {
  if (!rawBody || !signature || !secret) return false;
  const ts = headerValue(signature,'t'); const v1 = headerValue(signature,'v1');
  const timestamp = Number(ts); if (!timestamp || !v1 || Math.abs(Date.now()/1000-timestamp)>toleranceSec) return false;
  const expected = createHmac('sha256', secret).update(`${ts}.${rawBody}`).digest('hex');
  const a=Buffer.from(expected,'hex'), b=Buffer.from(v1,'hex');
  return a.length===b.length && timingSafeEqual(a,b);
}
export async function createCheckoutSession({apiKey,priceId,customerEmail,successUrl,cancelUrl,clientReferenceId,plan}) {
  if(!apiKey||!priceId) throw new Error('stripe_billing_not_configured');
  const fields={mode:'subscription',success_url:successUrl,cancel_url:cancelUrl,'line_items[0][price]':priceId,'line_items[0][quantity]':'1'};if(customerEmail)fields.customer_email=customerEmail;if(clientReferenceId)fields.client_reference_id=clientReferenceId;if(plan)fields['metadata[plan]']=plan;const body=new URLSearchParams(fields);
  const r=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/x-www-form-urlencoded'},body});
  const text=await r.text(); let data={}; try{data=JSON.parse(text)}catch{}
  if(!r.ok) throw new Error(data?.error?.message||`stripe_checkout_${r.status}`);
  return {id:data.id,url:data.url,status:data.status};
}
