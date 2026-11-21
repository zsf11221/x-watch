import {db,intEnv,fail} from '@/lib/config';
import {postsFor,lookupPosts,XError} from '@/lib/x';
export const dynamic='force-dynamic';
export const maxDuration=60;
const DAILY_LIMIT=300;
function utcDay(){return new Date().toISOString().slice(0,10)}
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;
 if(!secret || request.headers.get('authorization')!=='Bearer '+secret)return fail('Unauthorized',401);
 const client=db();
 const report:{account:string;added?:number;rechecked?:number;error?:string}[]=[];
 try{
  const day=utcDay();
  const {count:already,error:usageError}=await client.from('x_watch_read_ledger').select('post_id',{head:true,count:'exact'}).eq('day',day);
  if(usageError)throw usageError;
  if((already||0)>=DAILY_LIMIT)return Response.json({ok:false,paused:true,reason:'Daily resource safety threshold reached',observedResources:already,limit:DAILY_LIMIT,report});
  const {data:accounts,error:accountError}=await client.from('accounts').select('id,username,last_checked_at').order('last_checked_at',{ascending:true,nullsFirst:true}).limit(intEnv('ACCOUNTS_PER_RUN',5));
  if(accountError)throw accountError;
  let observed=already||0;
  for(const account of accounts||[]){
    if(observed>=DAILY_LIMIT)break;
    let added=0,rechecked=0;
    try{
      // X bills on post resources returned, with best-effort UTC-day deduplication.
      // since_id avoids repeatedly requesting already indexed posts.
      const {data:latest,error:latestErr}=await client.from('posts').select('id').eq('account_id',account.id).order('posted_at',{ascending:false}).limit(1);
      if(latestErr)throw latestErr;
      const sinceId=latest?.[0]?.id;
      const received=(await postsFor(account.id,5,sinceId)).data||[];
      const ids=received.map((p:{id:string})=>p.id);
      if(ids.length){
        const {error:ledgerError}=await client.from('x_watch_read_ledger').upsert(ids.map((post_id:string)=>({day,post_id})),{onConflict:'day,post_id',ignoreDuplicates:true});
        if(ledgerError)throw ledgerError;
        observed+=ids.length; // conservative count; duplicates cannot decrease the budget
      }
      for(const post of received){
        const {data:existing,error:e}=await client.from('posts').select('id').eq('id',post.id).maybeSingle();
        if(e)throw e;
        if(existing)continue;
        const {error:i}=await client.from('posts').insert({id:post.id,account_id:account.id,text:post.text,posted_at:post.created_at,status:'visible',missing_checks:0,last_checked_at:new Date().toISOString()});
        if(i){if(i.code==='23505')continue;throw i}
        const {error:ev}=await client.from('events').insert({account_id:account.id,post_id:post.id,type:'new'});if(ev)throw ev;
        added++;
      }
      // One oldest-stale archived post per account: checks for removals without
      // hammering all older posts every minute. This is NOT an instant delete feed.
      if(observed<DAILY_LIMIT){
        const cutoff=new Date(Date.now()-15*60*1000).toISOString();
        const {data:older,error:oe}=await client.from('posts').select('id,status,missing_checks').eq('account_id',account.id).neq('status','unavailable').or('last_checked_at.is.null,last_checked_at.lt.'+cutoff).order('last_checked_at',{ascending:true,nullsFirst:true}).limit(1);
        if(oe)throw oe;
        for(const post of older||[]){
          const res=await lookupPosts([post.id]);
          const found=!!res.data?.some((p:{id:string})=>p.id===post.id);
          // Only an explicitly unavailable post counts; empty API responses alone
          // cannot prove deletion. Preserve records until confirmed on recheck.
          const unavailable=!!res.errors?.some((e:{value?:string})=>e.value===post.id);
          const now=new Date().toISOString();
          if(found){
            const {error:u}=await client.from('posts').update({status:'visible',missing_checks:0,last_checked_at:now}).eq('id',post.id);if(u)throw u;
            if(post.status==='suspected')await client.from('events').insert({account_id:account.id,post_id:post.id,type:'restored'});
          }else if(unavailable){
            const n=(post.missing_checks||0)+1;
            const status=n>=2?'unavailable':'suspected';
            const {error:u}=await client.from('posts').update({status,missing_checks:n,last_checked_at:now,...(status==='unavailable'?{text:null}:{})}).eq('id',post.id);if(u)throw u;
            if(status==='unavailable')await client.from('events').insert({account_id:account.id,post_id:post.id,type:'unavailable'});
          }
          rechecked++;
          const {error:l}=await client.from('x_watch_read_ledger').upsert({day,post_id:post.id},{onConflict:'day,post_id',ignoreDuplicates:true});if(l)throw l;
          observed++;
        }
      }
      const {error:u}=await client.from('accounts').update({last_checked_at:new Date().toISOString()}).eq('id',account.id);if(u)throw u;
      report.push({account:account.username,added,rechecked});
    }catch(e){console.error('[cron:account]',account.username,e instanceof Error?e.message:JSON.stringify(e));report.push({account:account.username,error:e instanceof XError?'X API HTTP '+e.status:'processing failed'})}
  }
  return Response.json({ok:report.every(x=>!x.error),report,observedResources:observed,dailyLimit:DAILY_LIMIT,frequency:'every minute via Supabase Cron',timestamp:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('[cron]',e instanceof Error?e.message:JSON.stringify(e));return fail('采集任务失败',503)}
}
