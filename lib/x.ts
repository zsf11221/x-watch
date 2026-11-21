const root='https://api.x.com/2';
export class XError extends Error{constructor(public status:number){super('X API '+status)}}
async function request(path:string){
 const token=process.env.X_BEARER_TOKEN;if(!token)throw new Error('X API token not configured');
 const r=await fetch(root+path,{headers:{Authorization:'Bearer '+token},cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw new XError(r.status);return r.json();
}
export async function lookupUser(name:string){return request('/users/by/username/'+encodeURIComponent(name)+'?user.fields=profile_image_url,verified')}
export async function postsFor(userId:string,max=5,sinceId?:string){
 const params=new URLSearchParams({max_results:String(Math.max(5,Math.min(100,max))),'tweet.fields':'created_at','exclude':'retweets'});
 if(sinceId)params.set('since_id',sinceId);
 return request('/users/'+encodeURIComponent(userId)+'/tweets?'+params.toString());
}
export async function lookupPosts(ids:string[]){return request('/tweets?ids='+ids.map(encodeURIComponent).join(',')+'&tweet.fields=created_at')}
