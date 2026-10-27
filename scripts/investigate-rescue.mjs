import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {llmConfig} from '../llm-provider.mjs';
import {readRescueObservation,focusRescue,investigate} from './rescue-investigation.mjs';
const args=process.argv.slice(2),opts={};
for(let i=0;i<args.length;i++){
 const k=args[i];if(k==='--dry-run'||k==='--help')opts[k]=true;
 else if(['--archive','--prompt-id','--runs','--model','--out'].includes(k)&&args[i+1]&&!args[i+1].startsWith('--'))opts[k]=args[++i];
 else throw Error('Unknown or incomplete argument: '+k);
}
if(opts['--help']){console.log('Usage: npm run llm:investigate-rescue -- --archive MATCH.jsonl --prompt-id ID [--runs 1..20] [--model claude] [--out DIR] [--dry-run]');process.exit(0);}
if(!opts['--archive']||!opts['--prompt-id'])throw Error('--archive and --prompt-id are required');
const runs=Number(opts['--runs']||3);if(!Number.isInteger(runs)||runs<1||runs>20)throw Error('--runs must be 1..20');
const observation=await readRescueObservation(opts['--archive'],opts['--prompt-id']);focusRescue(observation);
const cfg=llmConfig(),profile=(cfg.profiles||[]).find(p=>p.id===(opts['--model']||'claude'));
console.log(`Position found. ${runs} runs; 4 independent tests per run (up to 6 model calls with corrections).`);
if(opts['--dry-run']){console.log('Dry run: no model calls or report.');process.exit(0);}
if(!profile?.enabled)throw Error('Requested model is not configured');
const dir=resolve(opts['--out']||'data/ai-investigations/'+new Date().toISOString().replaceAll(':','-'));await mkdir(dir,{recursive:true,mode:0o700});
const controller=new AbortController();process.once('SIGINT',()=>controller.abort());
const rows=[];
for(let run=1;run<=runs&&!controller.signal.aborted;run++){
 console.log(`Run ${run}/${runs}...`);
 const result=await investigate(observation,profile,{signal:controller.signal,focusedFirst:run%2===0});rows.push({run,...result});
 await writeFile(resolve(dir,'results.json'),JSON.stringify({version:1,model:profile.model,profile:profile.id,promptId:opts['--prompt-id'],note:'Independent probes. Knowledge and comprehension answers require manual review; no hidden-role truth is sent. Original/focused results are not causal proof.',rows},null,2),{mode:0o600});
 const show=x=>x.status==='model'?JSON.stringify(x.action?.ids||[]):x.status;
 console.log(`knowledge=${result.knowledge.status}, comprehension=${result.comprehension.status}, original=${show(result.original)}, focused=${show(result.focused)}`);
}
console.log('Private results: '+resolve(dir,'results.json'));
if(controller.signal.aborted)process.exitCode=130;
