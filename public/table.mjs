// The viewer stays at the bottom. Increasing seats proceed counterclockwise.
export const POSITIONS={
 4:[[50,85],[85,49],[50,15],[15,49]],
 5:[[50,85],[85,58],[72,15],[28,15],[15,58]],
 6:[[50,85],[85,66],[85,22],[50,15],[15,22],[15,66]],
 7:[[50,85],[85,70],[85,35],[68,15],[32,15],[15,35],[15,70]],
 8:[[50,85],[86,73],[86,44],[86,15],[50,15],[14,15],[14,44],[14,73]]
};
export function seatsFromViewer(players,viewerId){
 const mine=players.findIndex(p=>p.id===viewerId);
 if(mine<0)return [];
 return Array.from({length:players.length},(_,offset)=>{
  const index=(mine+offset)%players.length;
  return {player:players[index],seat:index+1,offset,position:POSITIONS[players.length]?.[offset]};
 });
}
export function nextLiving(players,currentId){
 const index=players.findIndex(p=>p.id===currentId);if(index<0)return null;
 for(let n=1;n<players.length;n++){const p=players[(index+n)%players.length];if(p.alive)return p;}
 return null;
}
export function timerState(decision,now=Date.now()){
 if(!decision?.deadline)return {seconds:null,fraction:1,urgent:false};
 const ms=Math.max(0,decision.deadline-now),budget=Math.max(1,decision.deadline-decision.startedAt);
 return {seconds:Math.ceil(ms/1000),fraction:Math.min(1,ms/budget),urgent:ms<=10000};
}
// The Lord is a fixed visual anchor; physical seat numbers and engine order stay intact.
export function seatsFromLord(players){const start=Math.max(0,players.findIndex(p=>p.role==='lord'));return Array.from({length:players.length},(_,offset)=>{const index=(start+offset)%players.length;return {player:players[index],seat:index+1,offset};});}

// Opponents stay in seat order; the local player lives in the bottom dock.
export function opponentsFromViewer(players,viewerId){return seatsFromViewer(players,viewerId).filter(s=>s.offset!==0);}
