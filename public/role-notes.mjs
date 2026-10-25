export const guessRoles=['loyal','rebel','spy'];
export function roleNote(player,guesses={}){
 if(player.role)return {role:player.role,guessed:false};
 const role=guesses[player.id];return {role:guessRoles.includes(role)?role:null,guessed:true};
}
