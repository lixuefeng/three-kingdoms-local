// Never assume a tunnel/proxy error page is JSON, or retry a game mutation.
export async function readApiResponse(response){
 let raw;try{raw=await response.text();}catch{throw new Error('The connection was interrupted while receiving the server response. Wait for the table to reconnect before trying again.');}
 let data;try{data=JSON.parse(raw);}catch{
  const status=response.status?` (HTTP ${response.status})`:'';
  throw new Error(`The server or tunnel returned ${raw.trim()?'a non-JSON':'an empty'} response${status}. Wait for the connection to recover. The action may already have been accepted; check the current table before trying again.`);
 }
 if(!response.ok)throw new Error(typeof data?.error==='string'?data.error:`Request failed (HTTP ${response.status}).`);
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('The server returned an unexpected response. Wait for the table to reconnect.');
 return data;
}
