const root='https://api.x.com/2';
export class XError extends Error{constructor(public status:number){super('X API '+status)}}
async function request(path:string){
 const token=process.env.X_BEARER_TOKEN;if(!token)throw new Error('X API token not configured');
 const r=await fetch(root+path,{headers:{Authorization:'Bearer '+token},cache:'no-store'});
 if(!r.ok)throw new XError(r.status);return r.json();
}
export async function lookupUser(name:string){return request('/users/by/username/'+encodeURIComponent(name)+'?user.fields=profile_image_url,verified')}
export async function postsFor(userId:string,max=10){return request('/users/'+encodeURIComponent(userId)+'/tweets?max_results='+Math.max(5,Math.min(100,max))+'&tweet.fields=created_at&exclude=retweets')}
export async function lookupPosts(ids:string[]){return request('/tweets?ids='+ids.map(encodeURIComponent).join(',')+'&tweet.fields=created_at')}
