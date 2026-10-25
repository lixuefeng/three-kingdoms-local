import {llmConfig,createModelRouter} from '../llm-provider.mjs';
const config=llmConfig(),provider=createModelRouter(config),choice=process.argv[2];
const selected=choice==='--all'?provider.models.filter(m=>m.enabled).map(m=>m.id):[choice||provider.defaultProfile];
if(!provider.enabled){console.error('Configure your model endpoint and credentials. See LLM-SETUP.md.');process.exitCode=1;}
else for(const modelProfile of selected){
 if(!provider.supports(modelProfile)){console.error('Model not configured: '+modelProfile);process.exitCode=1;continue;}
 const prompt={id:'connection-check',zone:'options',title:'Connection check: choose ready.',min:1,max:1,options:[{id:'ready',label:'Ready'}],deadline:Date.now()+config.timeoutMs};
 const view={turn:0,phase:'Connection check',players:[{id:'test',name:'Test bot',general:null,role:'rebel',hp:4,maxHp:4,alive:true,hand:[],equip:{},judge:[]}],logs:[],table:[]};
 const result=await provider.decide({view,playerId:'test',prompt,modelProfile,matchId:'connection-check-'+modelProfile});console.log(JSON.stringify(provider.status(),null,2));if(result?.ids[0]==='ready')console.log('Connection OK: '+modelProfile);else{console.error('Connection failed: '+modelProfile+'. Check model access, credentials, token limit and endpoint.');process.exitCode=1;}
}
