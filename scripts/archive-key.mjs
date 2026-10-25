import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const directory=process.env.SGS_DATA_DIR||fileURLToPath(new URL('../data/',import.meta.url));
try{const key=readFileSync(join(directory,'archive-access.key'),'utf8').trim();console.log('Private archive recovery key (unlocks all saved game and AI logs):\n'+key);}
catch{console.error('Archive key not found. Start this version of the server first, then run with the same SGS_DATA_DIR.');process.exitCode=1;}
