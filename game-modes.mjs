export const MAX_IDENTITY_PLAYERS=10;
export const GAME_MODES={identity:{label:'Identity',seats:null},'2v2':{label:'2v2 · Team elimination',seats:4},'3v3':{label:'3v3 · Classic commander rules',seats:6}};
export const isTeamMode=mode=>mode==='2v2'||mode==='3v3';
export function validateMode(mode){if(!Object.hasOwn(GAME_MODES,mode))throw Error('Unknown game mode.');return mode;}
export const roomCapacity=mode=>GAME_MODES[validateMode(mode)].seats||MAX_IDENTITY_PLAYERS;
export function validateModeSeats(mode,seats){validateMode(mode);const n=GAME_MODES[mode].seats;if(n&&seats!==n)throw Error(`${mode} requires exactly ${n} seated players.`);if(!n&&seats>MAX_IDENTITY_PLAYERS)throw Error(`Identity supports at most ${MAX_IDENTITY_PLAYERS} players.`);}
export function doubleSpyCounts(seats){if(!Number.isInteger(seats)||seats<4||seats>MAX_IDENTITY_PLAYERS)throw Error('Double Spy needs 4–10 seats.');const rebel=Math.max(1,Math.floor(seats/2)-1);return {lord:1,loyal:seats-3-rebel,rebel,spy:2};}

// Ten-player identity can use two disjoint choices with the standard 25-general pool.
export const minimumGenerals=(mode,seats)=>mode==='3v3'?16:mode==='identity'&&seats===10?19:3*seats-(mode==='2v2'?0:2);
export const generalChoiceCount=(mode,seats,available)=>mode==='identity'&&seats===10?Math.min(3,Math.floor((available-1)/(seats-1))):3;
