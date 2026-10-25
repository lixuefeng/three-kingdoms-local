// Original code-drawn vector emblems; no third-party card artwork is bundled.
export function cardImagePath(){return null;}
export function cardArt(card){
 const sword='<path d="M29 16 25 53 35 53 31 16 30 9Z M20 57h20 M30 57v12 M25 70h10"/>';
 const shield='<path d="m30 12 19 8-3 24Q42 59 30 67 18 59 14 44L11 20Z M30 22v32 M20 34h20"/>';
 const flame='<path d="M32 10q8 19 1 26 13-2 12-13 19 30-4 42-28 8-26-18 1-13 10-20-2 14 4 15 10-10 3-32Z"/>';
 const heart='<path d="M30 65 12 44C-6 21 20 7 30 27 40 7 66 21 48 44Z"/>';
 const scroll='<path d="M15 18h31v43H15q-10-7 0-12V18q-10-12 2-12h29 M15 18q8 0 4-8 M23 29h15 M23 38h15 M23 47h10"/>';
 const chain='<rect x="12" y="10" width="24" height="36" rx="12" transform="rotate(-30 24 28)"/><rect x="24" y="33" width="24" height="36" rx="12" transform="rotate(-30 36 51)"/>';
 const paths=card.kind==='shan'?shield:['tao','peach','brotherhood'].includes(card.kind)?heart:['fireSha','fireAttack','rattan'].includes(card.kind)?flame:card.kind==='chain'?chain:card.type==='weapon'||['sha','thunderSha','duel','barbarian','borrow'].includes(card.kind)?sword:card.type==='armor'?shield:scroll;
 const fallback=`<svg class="card-emblem" viewBox="0 0 60 80" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
 return fallback;
}
