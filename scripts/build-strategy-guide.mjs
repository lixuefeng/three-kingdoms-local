import {writeFile} from 'node:fs/promises';
import {ALL_GENERALS} from '../cards.mjs';
import {GENERAL_STRATEGIES} from '../general-strategy.mjs';
import {GENERAL_TACTICS} from '../general-tactics.mjs';

let out=`# General strategy playbooks

Expanded 2026-10-25. Covers all 44 supported generals. The Chinese official OL classic strategy series is the starting point, supplemented by longer Chinese guides listed below. This is an original English synthesis with explicit implementation-specific deductions and hypothetical examples, not a translation of whole articles or a demonstrated optimal policy. Some older official pages could only be read through indexed excerpts; a source link does not imply a full article was accessible.

The overview/priorities summarize researched principles. Detailed sequences, reserves, response decisions and examples are our own adaptations to the local classic rules. No numerical win-rate claims or fixed identity tier rankings are imported. Skill text, actionSpec and legal options always override these recommendations.

## Additional Chinese research

- [经典再现——诸葛亮, official mobile strategy centre, 2020-06-30](https://www.sanguosha.cn/pc/guide-info-111.html): detailed deck control and Empty Fortress trade-offs. The article mixes classic and revised versions. We exclude revised fixed observation counts and the second end-phase observation. We retain only transferable advice about judgment/draw ordering, playable hand structure and avoiding forced emptiness.
- [界孙权攻略, 4399 OL game channel, 2020-01-15](https://my.4399.com/yxsgs/ziliao/21718/): useful discussion of card quality, sequencing, known defensive reserves and full-hand cycling risk. This is explicitly a revised-version guide. Its extra full-hand draw, revised Rescue and unsupported matchups are excluded; classic Equilibrium here replaces exactly the discarded quantity.
- [早逝的先知，卖血流标杆——郭嘉, official OL, 2018-12-19](https://www.sanguosha.com/news/20181219_1211_3220): indexed excerpt confirms immediate Legacy support during AOE. Our recipient examples and survival calculations are local-rule deductions; the inaccessible full page is not claimed as reviewed.

## Runtime delivery

Only the acting general gets detailed tactics. Turn prompts receive sequencing, reserves and one worked example; response prompts receive reaction advice, reserves and an example; skill, selection and ordering decisions receive both relevant sequence and reaction advice. Other living generals contribute only short public matchup notes. General selection receives only offered candidate summaries. Nothing is fetched during play and this adds no LLM requests. Inspect generalStrategy.tactics in AI trace Input.

Examples are hypothetical, not assertions about the current hand. Hidden identities and cards must never be inferred from the manual as facts. Team advice uses the bot own role and public evidence; shared kingdom does not establish shared team. Improving guide coverage is not proof of improved model win rate; that needs fresh logged matches.

Version exclusions include new Fiery Bow, Wei Yan Qimou, Zhou Tai Fenji/modern wounds, Zhang Jiao Club healing and modern Yu Ji curses. The old rule text in this build wins over similarly named online variants.

`;
for(const gen of ALL_GENERALS){
 const g=GENERAL_STRATEGIES[gen.id],t=GENERAL_TACTICS[gen.id];
 out+=`## ${gen.name}\n\n${g.plan}\n\n${g.priorities.map(x=>'- '+x).join('\n')}\n\nAvoid: ${g.avoid}\n\n### Play sequence\n\n${t.sequence}\n\n### Resource policy\n\n${t.reserve}\n\n### Skill and response decisions\n\n${t.react}\n\n### Worked example (hypothetical)\n\n${t.example}\n\nFacing this general: ${g.facing}\n\nVersion filter: ${g.version}\n\nSources: ${g.sources.map(s=>`[${s.kind}](${s.url})`).join('; ')}. Detailed tactical sections are original local-rule deductions, not quotations from these sources.\n\n`;
}
await writeFile(new URL('../GENERAL-STRATEGY.md',import.meta.url),out.trimEnd()+'\n');
