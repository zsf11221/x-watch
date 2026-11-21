'use client';
import {useEffect,useState} from 'react';
type Account={id:string;username:string;name:string;last_checked_at:string|null};
type Event={id:number;type:string;created_at:string;post_id:string;username:string;name:string;post_text?:string|null};
export default function Home(){
const [username,setUsername]=useState(''),[accounts,setAccounts]=useState<Account[]>([]),[events,setEvents]=useState<Event[]>([]),[stats,setStats]=useState({accounts:0,posts:0,unavailable:0}),[error,setError]=useState(''),[loading,setLoading]=useState(false),[config,setConfig]=useState(false);
async function refresh(){
try{
 const [a,e,s]=await Promise.all([fetch('/api/accounts'),fetch('/api/events'),fetch('/api/stats')]);
 if(!a.ok||!e.ok||!s.ok){setConfig(true);return;}
 const [aa,ee,ss]=await Promise.all([a.json(),e.json(),s.json()]);
 setAccounts(aa.accounts||[]);setEvents(ee.events||[]);setStats(ss);setConfig(false);
}catch{setConfig(true)}
}
useEffect(()=>{refresh()},[]);
async function add(event:React.FormEvent){event.preventDefault();setError('');setLoading(true);
try{const res=await fetch('/api/accounts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username})});const data=await res.json();if(!res.ok)throw new Error(data.error||'添加失败');setUsername('');await refresh()}catch(e){setError(e instanceof Error?e.message:'添加失败')}finally{setLoading(false)}}
const fmt=(date?:string|null)=>date?new Date(date).toLocaleString('zh-CN',{dateStyle:'short',timeStyle:'short'}):'待首次采集';
return <div className="app">
<header className="header"><div className="brand"><b>◉</b> X WATCH</div><div className="tag">OPEN SOURCE · PUBLIC MONITOR</div></header>
<section className="hero"><h1>每一条动态，<br/><span>都有迹可循。</span></h1><p className="muted">公开 X 账号监控 · 新推文发现 · 推文不可访问检测<br/>输入用户名，加入关注列表。系统仅记录监控开始后实际获取的内容。</p>
<form className="search" onSubmit={add}><input aria-label="X 用户名" value={username} placeholder="@用户名 或 https://x.com/username" onChange={e=>setUsername(e.target.value)} maxLength={100}/><button disabled={loading||!username.trim()}>{loading?'正在查询…':'＋ 添加监控'}</button></form>
<div className="hint">仅支持公开账号 · 数据更新取决于 API 配额和后台调度 · 不保证抓到秒删推文</div>{error&&<div className="error">{error}</div>}{config&&<div className="error">尚未连接数据库或服务暂不可用。页面已部署后，请配置 Supabase 与 X API。</div>}
</section>
<section className="stats"><div className="panel stat"><label>已监控账号</label><strong>{stats.accounts||0}</strong></div><div className="panel stat"><label>已索引推文</label><strong>{stats.posts||0}</strong></div><div className="panel stat"><label>不可访问记录</label><strong>{stats.unavailable||0}</strong></div></section>
<section className="columns"><div className="panel"><h2>◎ 监控账号</h2>{!accounts.length&&<div className="empty">暂无账号。请使用上方输入框添加公开账号。</div>}{accounts.map(a=><div className="account" key={a.id}><div className="avatar">{a.name?.[0]||'X'}</div><div><div className="name">{a.name}</div><div className="sub"><a href={'https://x.com/'+a.username} target="_blank" rel="noopener noreferrer">@{a.username}</a></div></div><span className="stamp">{fmt(a.last_checked_at)}</span></div>)}</div>
<div className="panel"><h2>◷ 最新监控事件</h2>{!events.length&&<div className="empty">暂时没有监控事件。首次数据采集后会显示已捕获的推文。</div>}{events.map(ev=><div className="event" key={ev.id}><div className="row"><strong>{ev.name||ev.username}</strong><span className={'pill '+(ev.type==='unavailable'||ev.type==='suspected'?'warn':'')}>{ev.type==='new'?'首次捕获':ev.type==='unavailable'?'不可访问':ev.type==='restored'?'恢复可访问':'疑似不可访问'}</span><span className="stamp">{fmt(ev.created_at)}</span></div><p>{ev.type==='unavailable'?'该推文 ID 两次复查均无法解析；不能据此断定作者主动删除。':ev.post_text||'查看原文与监控状态'}</p><a className="sub" href={'https://x.com/'+ev.username+'/status/'+ev.post_id} rel="noopener noreferrer" target="_blank">查看 X 原文 ↗</a></div>)}</div></section>
<footer className="foot">X WATCH · Independent public-account monitoring · Not affiliated with X Corp.<br/>不可访问可能来自删除、权限变化、账号状态或 API 限制；本网站不会将不可访问等同于作者主动删推。</footer></div>}
