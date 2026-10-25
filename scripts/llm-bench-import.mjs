// Local-only archive extraction: never commit the resulting private fixture.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const [file,indexText,out]=process.argv.slice(2);
if(!file||!indexText||!out)throw Error('Usage: node scripts/llm-bench-import.mjs archive.jsonl TRACE_INDEX data/ai-benchmarks/case.json (zero-based gameplay trace index)');
const index=Number(indexText);if(!Number.isInteger(index)||index<0)throw Error('Invalid trace index');
const traces=(await readFile(file,'utf8')).split('\n').filter(Boolean).map(line=>JSON.parse(line)).filter(row=>row.type==='ai-trace'&&row.trace?.request&&!['chat','analysis'].includes(row.trace.decisionType));
const trace=traces[index]?.trace;if(!trace)throw Error('Trace index not found; gameplay traces: '+traces.length);
const request=typeof trace.request==='string'?JSON.parse(trace.request):trace.request;
const message=request.messages?.findLast(m=>m.role==='user');
const text=typeof message?.content==='string'?message.content:message?.content?.filter(b=>typeof b.text==='string').map(b=>b.text).join('');
const observation=JSON.parse(text);if(!observation?.prompt?.options||!observation?.you||!Array.isArray(observation.players))throw Error('Trace has no decision observation');
// Use only the bot's original input, never the archive's authoritative state.
delete observation.prompt.deadline;
const destination=resolve(out);await mkdir(dirname(destination),{recursive:true});
await writeFile(destination,JSON.stringify([{id:'imported-'+index,description:'Private saved bot observation; manual strategy review required.',observation}],null,2),{flag:'wx',mode:0o600});
console.log('Saved private fixture: '+destination+'\nContains the bot’s private hand, role and remembered context. Keep it local. The benchmark uses the current gameplay system prompt.');
