import {db,intEnv,fail} from '@/lib/config';import {postsFor,lookupPosts,XError} from '@/lib/x';
export const dynamic='force-dynamic';export const maxDuration=60;
export async function GET(req:Request){
 const secret=process.env.CRON_SECRET;if(!secret||req.headers.get('authorization')!=='Bearer '+secret)return fail('Unauthorized',401);
 const c=db();const report:any[]=[];
 try{
  const {data:accounts,error}=await c.from('accounts').select('id,username,last_checked_at').order('last_checked_at',{ascending:true,nullsFirst:true}).limit(intEnv('ACCOUNTS_PER_RUN',5));if(error)throw error;
  for(const a of accounts||[]){
   try{
    const current=(await postsFor(a.id,intEnv('FETCH_MAX_RESULTS',10))).data||[];
    let added=0;
    for(const p of current){
      const {data:existing,error:e}=await c.from('posts').select('id').eq('id',p.id).maybeSingle();if(e)throw e;
      if(!existing){const {error:i}=await c.from('posts').insert({id:p.id,account_id:a.id,text:p.text,posted_at:p.created_at,status:'visible',missing_checks:0});if(i)throw i;const {error:ev}=await c.from('events').insert({account_id:a.id,post_id:p.id,type:'new'});if(ev)throw ev;added++;}
    }
    const {data:older,error:oe}=await c.from('posts').select('id,status,missing_checks').eq('account_id',a.id).neq('status','unavailable').order('last_checked_at',{ascending:true,nullsFirst:true}).limit(intEnv('RECHECK_PER_ACCOUNT',2));if(oe)throw oe;
    for(const post of older||[]){
      const now=new Date().toISOString();
      let found=false,individualError=false;
      try{const res=await lookupPosts([post.id]);found=!!res.data?.some((p:any)=>p.id===post.id);individualError=!!res.errors?.some((e:any)=>e.value===post.id);}catch(e){if(e instanceof XError)throw e;throw e;}
      if(found){const {error:u}=await c.from('posts').update({status:'visible',missing_checks:0,last_checked_at:now}).eq('id',post.id);if(u)throw u;if(post.status==='suspected')await c.from('events').insert({account_id:a.id,post_id:post.id,type:'restored'});}
      else if(individualError){const n=(post.missing_checks||0)+1;const state=n>=2?'unavailable':'suspected';const {error:u}=await c.from('posts').update({status:state,missing_checks:n,last_checked_at:now,...(state==='unavailable'?{text:null}:{})}).eq('id',post.id);if(u)throw u;if(state==='unavailable'){const {error:ev}=await c.from('events').insert({account_id:a.id,post_id:post.id,type:'unavailable'});if(ev)throw ev;}}
    }
    const {error:u}=await c.from('accounts').update({last_checked_at:new Date().toISOString()}).eq('id',a.id);if(u)throw u;report.push({account:a.username,added,rechecked:older?.length||0});
   }catch(e){report.push({account:a.username,error:e instanceof XError?'X API HTTP '+e.status:'processing failed'});}
  }
  return Response.json({ok:true,report},{headers:{'Cache-Control':'no-store'}});
 }catch{return fail('采集任务失败',503)}
}
