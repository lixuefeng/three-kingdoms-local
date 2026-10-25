import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {llmConfig} from '../llm-provider.mjs';
import {prepareCase,runCase,markdownReport} from './decision-bench.mjs';
const appVersion=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).version;
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i++){
 const key=args[i];if(['--list','--dry-run','--help'].includes(key))options[key]=true;
 else if(['--file','--case','--models','--runs','--variants','--out'].includes(key)&&args[i+1]&&!args[i+1].startsWith('--'))options[key]=args[++i];
 else throw Error('Unknown or incomplete argument: '+key);
}
if(options['--help']){console.log('llm:bench [--list] [--dry-run] [--file fixtures.json] [--case id,id] [--models kimi,claude,deepseek|all] [--runs 1..20] [--variants current,focused,tools] [--out directory]');process.exit(0);}
const file=options['--file']||new URL('../test/fixtures/decision-cases.json',import.meta.url);
let cases=JSON.parse(await readFile(file,'utf8'));if(!Array.isArray(cases))throw Error('Fixture file must be an array');
if(options['--case']){const ids=options['--case'].split(',');for(const id of ids)if(!cases.some(c=>c.id===id))throw Error('Unknown case: '+id);cases=cases.filter(c=>ids.includes(c.id));}
const runs=Number(options['--runs']||1),variants=(options['--variants']||'current').split(',');
if(!Number.isInteger(runs)||runs<1||runs>20)throw Error('runs must be 1..20');
for(const c of cases)for(const variant of variants)prepareCase(c,variant);
if(options['--list']){for(const c of cases)console.log(c.id+': '+c.description);process.exit(0);}
const config=llmConfig(),catalog=config.profiles?.length?config.profiles:[{...config,id:'custom'}];
if(options['--dry-run'])for(const id of ['kimi','claude','deepseek'])if(!catalog.some(p=>p.id===id))catalog.push({id,enabled:false});
const ids=(options['--models']||config.defaultProfile||catalog[0].id).split(',');
const profiles=ids[0]==='all'?catalog.filter(p=>p.enabled):ids.map(id=>{const p=catalog.find(p=>p.id===id);if(!p)throw Error('Unknown model: '+id);return p;});
const count=cases.length*profiles.length*runs*variants.reduce((n,v)=>n+(v==='tools'?4:2),0);if(!count||count>300)throw Error('Select 1..300 requests per invocation');
console.log( `Up to ${count} requests, sequential, no transport retries; at most one invalid-action correction. Cases: ${cases.length}; variants: ${variants.join(', ')}; runs: ${runs}`);
if(options['--dry-run']){console.log('Dry run: no network requests or reports.');process.exit(0);}
for(const p of profiles)if(!p.enabled)throw Error('Model not configured: '+p.id);
const out=resolve(options['--out']||'data/ai-benchmarks/'+new Date().toISOString().replaceAll(':','-'));await mkdir(out,{recursive:true});
const controller=new AbortController();process.once('SIGINT',()=>controller.abort());
const rows=[];
outer:for(const p of profiles)for(const variant of variants)for(const c of cases)for(let run=1;run<=runs;run++){
 if(controller.signal.aborted)break outer;
 const row={profile:p.id,model:p.model,run,...await runCase(c,p,variant,{signal:controller.signal})};rows.push(row);
 // Checkpoint after every request so interrupted runs remain reviewable.
 await writeFile(resolve(out,'results.json'),JSON.stringify({version:1,appVersion,cases:cases.map(c=>({id:c.id,description:c.description,expected:c.expected})),rows},null,2),{mode:0o600});
 await writeFile(resolve(out,'report.md'),markdownReport(rows),{mode:0o600});
 console.log(`${p.id} ${variant} ${c.id} #${run}: ${row.status}; strategy ${row.grade.strategy}`);
}
console.log('Reports: '+out);
if(controller.signal.aborted)process.exitCode=130;
