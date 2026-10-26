// Shared by live gameplay and benchmarks: role-focus uses the tested text verbatim.
export const ROLE_FOCUS='Evaluate actions by progress toward your own role win condition. Card use, damage and reducing discards are means, not objectives. Use public role evidence and uncertain role beliefs when comparing recipients and targets. Friendly damage or transfers can be useful when a concrete observable team benefit outweighs their cost; do not assume every friendly interaction is good or every attack on an ally is wrong. Do not treat heuristic probabilities as revealed roles.';
export const BOT_STRATEGIES=['current','role-focus'];
export function strategyGuidance(id='current'){
 if(!BOT_STRATEGIES.includes(id))throw Error('Unknown bot strategy');
 return id==='role-focus'?'\n\n'+ROLE_FOCUS:'';
}
