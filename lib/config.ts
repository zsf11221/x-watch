import {createClient} from '@supabase/supabase-js';
export function db(){const url=process.env.SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error('Database not configured');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
export function intEnv(key:string,fallback:number){const v=Number(process.env[key]);return Number.isFinite(v)&&v>0?Math.floor(v):fallback}
export function fail(message:string,status=500){return Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}})}
