import {competitorResearch} from './competitor-patterns.js';
import {listCapabilities} from './capabilities.js';

export function builderResearch(){
  return {
    generatedAt:new Date().toISOString(),
    methodology:'Current public product documentation and official feature pages were reviewed for capability patterns. Coding Vibes implements original interfaces and architecture rather than copying source code, proprietary assets, branding or protected content.',
    sources:[
      {name:'Replit Agent',url:'https://replit.com/products/agent',patterns:['agentic build','web search','database','auth','integrations','deployment']},
      {name:'Lovable',url:'https://lovable.dev/build/app-builder',patterns:['prompt to app','database','auth','hosting','integrations','security']},
      {name:'WordPress',url:'https://wordpress.org/about/features/',patterns:['CMS','themes','plugins','custom content','publishing']},
      {name:'Bubble',url:'https://bubble.io/ai-app-builder',patterns:['visual full-stack','database','workflows','web/mobile','security']},
      {name:'FlutterFlow',url:'https://flutterflow.io/ai',patterns:['mobile','AI agent','testing','Android/iOS/web']},
      {name:'Bolt',url:'https://bolt.new/use-cases/ai-website-builder',patterns:['prompt build','preview','deployment','responsive']},
      {name:'Base44',url:'https://base44.com/features',patterns:['auth','database','storage','email','AI','integrations']},
      {name:'v0',url:'https://v0.dev',patterns:['visual design mode','GitHub sync','Vercel deployment','team collaboration']},
      {name:'Webflow',url:'https://webflow.com/pricing',patterns:['visual builder','CMS','SEO/AEO','publishing','workspace governance']},
    ],
    patterns:competitorResearch(),
    capabilityCount:listCapabilities().length,
  };
}
