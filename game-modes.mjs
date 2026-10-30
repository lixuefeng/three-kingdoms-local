export const GAME_MODES={identity:{label:'Identity',seats:null},'2v2':{label:'2v2 · Team elimination',seats:4},'3v3':{label:'3v3 · Team elimination',seats:6}};
export const isTeamMode=mode=>mode==='2v2'||mode==='3v3';
export function validateMode(mode){if(!Object.hasOwn(GAME_MODES,mode))throw Error('Unknown game mode.');return mode;}
export function validateModeSeats(mode,seats){validateMode(mode);const n=GAME_MODES[mode].seats;if(n&&seats!==n)throw Error(`${mode} requires exactly ${n} seated players.`);}
export function doubleSpyCounts(seats){if(!Number.isInteger(seats)||seats<4||seats>8)throw Error('Double Spy needs 4–8 seats.');const rebel=Math.max(1,Math.floor(seats/2)-1);return {lord:1,loyal:seats-3-rebel,rebel,spy:2};}
