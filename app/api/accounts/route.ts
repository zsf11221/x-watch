import {db,intEnv,fail} from '@/lib/config';
import {lookupUser,XError} from '@/lib/x';
import {parseUsername} from '@/lib/username';
import {createHash} from 'node:crypto';
export const dynamic='force-dynamic';
export async function GET(){try{const {data,error}=await db().from('accounts').select('id,username,name,last_checked_at').order('created_at',{ascending:false}).limit(100);if(error)throw error;return Response.json({accounts:data},{headers:{'Cache-Control':'no-store'}})}catch{return fail('数据库尚未配置或暂不可用',503)}}
export async function POST(request:Request){
try{
 const data=await request.json().catch(()=>null);const name=parseUsername(String(data?.username||''));if(!name)return fail('请输入有效的 X 用户名',400);
 const client=db();const {data:existing,error:existError}=await client.from('accounts').select('id,username').ilike('username',name).maybeSingle();if(existError)throw existError;if(existing)return Response.json({account:existing,alreadyExists:true});
 const {count,error:countError}=await client.from('accounts').select('id',{head:true,count:'exact'});if(countError)throw countError;if((count||0)>=intEnv('MAX_ACCOUNTS',20))return fail('当前测试名额已满',429);
 const ip=(request.headers.get('x-forwarded-for')||'').split(',')[0].trim();if(!ip)return fail('无法验证请求来源',400);
 const hash=createHash('sha256').update((process.env.CRON_SECRET||'unset')+':'+ip).digest('hex');
 const {data:allowed,error:guardError}=await client.rpc('claim_add_slot',{p_ip_hash:hash});if(guardError)throw guardError;if(!allowed)return fail('添加过于频繁，请稍后再试',429);
 const user=(await lookupUser(name)).data;if(!user)return fail('未找到该公开账号',404);
 const {data:created,error}=await client.from('accounts').insert({id:user.id,username:user.username,name:user.name}).select('id,username,name').single();
 if(error){if(error.code==='23505')return Response.json({alreadyExists:true});throw error}return Response.json({account:created},{status:201});
}catch(e){if(e instanceof XError)return fail(e.status===429?'X API 调用额度暂不可用':'X API 查询失败',e.status===429?429:502);return fail('添加失败：请检查数据库和 X API 配置',503)}}
