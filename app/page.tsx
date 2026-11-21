'use client';
import {useCallback,useEffect,useState} from 'react';
import {Search,ArrowUpRight,ArrowRight,Plus,Layers3,ShieldCheck,BellRing,BarChart3,Eye,Clock3,AlertTriangle,RefreshCw,Radio,Menu,X as CloseIcon,Check,ExternalLink} from 'lucide-react';

type Account={id:string;username:string;name:string;last_checked_at:string|null};
type Event={id:number;type:string;created_at:string;post_id:string;username:string;name:string;post_text?:string|null};
const eventName=(t:string)=>t==='new'?'发现新推文':t==='unavailable'?'推文不可访问':t==='restored'?'恢复可访问':'疑似不可访问';
function Portrait(){return <svg viewBox="0 0 480 470" role="img" aria-label="水墨风格的银发人物装饰插画" className="portrait-svg"><defs><radialGradient id="paper"><stop stopColor="#f0e9d9"/><stop offset="1" stopColor="#c9bcaa"/></radialGradient><linearGradient id="hair" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#faf8ee"/><stop offset=".53" stopColor="#a3a19c"/><stop offset="1" stopColor="#f1ece1"/></linearGradient><linearGradient id="robe"><stop stopColor="#e6e3dc"/><stop offset="1" stopColor="#6e6d69"/></linearGradient></defs>
<circle cx="246" cy="231" r="210" fill="url(#paper)" opacity=".98"/>
<g fill="#413f39" opacity=".22"><path d="M40 288q55-36 88 2t86-12q-37 58-107 43t-67-33ZM293 85q64-44 136-13-36 1-64 34-35-19-72-21ZM65 171q-27 1-35 25 30-19 50-3 10-18-15-22Z"/></g>
<path d="M375 80q43 6 28 78-13 31-8 67 9 58 18 115-22 35-47 11-22-54-8-122-23-66 17-149Z" fill="url(#hair)" stroke="#67645d" strokeWidth="2"/>
<path d="M302 86q70-41 85 19-5 35-32 62-8 64-3 120l22 105q-50 45-89-6l-16-165Z" fill="url(#hair)" stroke="#66645f" strokeWidth="2"/>
<path d="M337 103q50-31 68-4 17 19 8 49-42 37-82 6Z" fill="#ddd9cf" stroke="#67615a" strokeWidth="3"/>
<path d="M335 150q-20 20-42 25-27 27-56 31-8 18-27 28l-23 28 31 10q22 21 58-10l24-9q39-38 41-103Z" fill="#d6c5ad" stroke="#695f53" strokeWidth="2"/>
<path d="M209 234q32-9 46-10 8 3 7 6-24 3-45 15Z" fill="#5d5550"/>
<path d="M250 205l25-4q-18 13-26 8Z" fill="#41413e"/>
<path d="M236 226q19-4 29-1" stroke="#62574f" strokeWidth="2" fill="none"/>
<path d="M224 267q35 24 63 3l24-22q21 32 34 53l23 154H127q8-110 97-188Z" fill="url(#robe)" stroke="#655f57" strokeWidth="3"/>
<path d="M244 286q-29 31-41 77l-11 90M307 259q-36 72-38 194M311 300q24 23 37 56" fill="none" stroke="#8c877f" strokeWidth="3"/>
<path d="M194 231q22-24 18-52-35-25-13-60 27-37 71-33 44-17 80 12-25 27-36 61-23 14-41 25-7 35-34 57-18 12-45-10Z" fill="url(#hair)" stroke="#6f6b63" strokeWidth="3"/>
<path d="M220 117q34-35 90-25-41 26-50 62-29 27-37 67M247 108q29-19 63-11-17 28-27 52M319 110q-27 36-33 75" fill="none" stroke="#f7f5ee" strokeWidth="5" opacity=".8"/>
<path d="M341 113q-4 49-33 100-6 13-8 43M376 123q-35 82-24 154 6 46 26 102" fill="none" stroke="#68645e" strokeWidth="2" opacity=".6"/>
<path d="M140 385q-63-25-109 17l85-10M386 389q32-25 70 3l-53-6" fill="#34342f" opacity=".35"/>
</svg>}
export default function Home(){
 const [username,setUsername]=useState(''),[accounts,setAccounts]=useState<Account[]>([]),[events,setEvents]=useState<Event[]>([]),[stats,setStats]=useState({accounts:0,posts:0,unavailable:0}),[error,setError]=useState(''),[loading,setLoading]=useState(false),[config,setConfig]=useState(false),[menu,setMenu]=useState(false),[refreshing,setRefreshing]=useState(false);
 const refresh=useCallback(async()=>{try{const [a,e,s]=await Promise.all([fetch('/api/accounts',{cache:'no-store'}),fetch('/api/events',{cache:'no-store'}),fetch('/api/stats',{cache:'no-store'})]);if(!a.ok||!e.ok||!s.ok){setConfig(true);return}const [aa,ee,ss]=await Promise.all([a.json(),e.json(),s.json()]);setAccounts(aa.accounts||[]);setEvents(ee.events||[]);setStats(ss);setConfig(false)}catch{setConfig(true)}},[]);
 useEffect(()=>{void refresh()},[refresh]);
 async function add(event:React.FormEvent){event.preventDefault();setError('');setLoading(true);try{const res=await fetch('/api/accounts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username})});const data=await res.json();if(!res.ok)throw new Error(data.error||'添加失败');setUsername('');await refresh()}catch(e){setError(e instanceof Error?e.message:'添加失败')}finally{setLoading(false)}}
 async function reload(){setRefreshing(true);await refresh();setRefreshing(false)}
 const fmt=(d?:string|null)=>d?new Date(d).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'等待首次采集';
 const unavailable=events.filter(e=>e.type==='unavailable');
 return <div className="site">
 <header className="topbar"><a href="#" className="wordmark"><span>X</span> Watch</a><nav className={menu?'nav open':'nav'} aria-label="主导航"><a href="#home" onClick={()=>setMenu(false)} className="selected">首页</a><a href="#watchlist" onClick={()=>setMenu(false)}>监控账号</a><a href="#activity" onClick={()=>setMenu(false)}>动态记录</a><a href="#alerts" onClick={()=>setMenu(false)}>不可用推文</a><a href="#guide" onClick={()=>setMenu(false)}>使用指南</a></nav><span className="header-note"><Radio size={14}/> PUBLIC MONITOR</span><button className="hamburger" aria-label={menu?'关闭菜单':'打开菜单'} aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?<CloseIcon size={22}/>:<Menu size={22}/>}</button></header>
 <main id="home">
 <section className="hero">
  <div className="hero-copy"><div className="eyebrow">X ACCOUNT MONITORING <i/> 公开账号动态追踪</div><h1>持续追踪<br/>你关心的 <em>X</em> 账号<span className="title-stop">.</span></h1><p className="hero-lead">重要的发推、变化与消失的内容，<br/>留下可验证的时间线。</p>
  <form className="hero-search" onSubmit={add}><Search size={21} strokeWidth={1.6}/><input value={username} onChange={e=>setUsername(e.target.value)} maxLength={100} aria-label="输入 X 用户名" placeholder="输入 X 用户名，例如 @elonmusk"/><button disabled={loading||!username.trim()}><Plus size={18}/> {loading?'正在验证':'添加监控'}</button></form>
  <div className="feature-line"><span><BellRing size={16}/> 新动态记录</span><span><Layers3 size={16}/> 已捕获内容索引</span><span><ShieldCheck size={16}/> 不可访问检测</span></div>
  {error&&<p className="error-message" role="alert">{error}</p>}{config&&<p className="config-message" role="status">当前尚未连接实际监控数据。需配置 Supabase 和 X API 后才能添加账号。</p>}
  </div>
  <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="ink-splash splash-one"/><div className="ink-splash splash-two"/><Portrait/><span className="art-caption">OBSERVE / ARCHIVE / VERIFY</span></div>
 </section>
 <section className="stats-grid" aria-label="监控统计"><div className="metric"><div className="metric-head"><span>01 / ACCOUNT</span><Eye size={21}/></div><p>正在监控的账号</p><strong>{stats.accounts.toLocaleString('zh-CN')}<small> 个</small></strong><span className="metric-foot">已添加至公共监控列表</span></div><div className="metric"><div className="metric-head"><span>02 / ARCHIVE</span><Layers3 size={21}/></div><p>累计索引推文</p><strong>{stats.posts.toLocaleString('zh-CN')}<small> 条</small></strong><span className="metric-foot">首次捕获时记录</span></div><div className="metric"><div className="metric-head"><span>03 / SIGNAL</span><ShieldCheck size={21}/></div><p>不可访问推文</p><strong>{stats.unavailable.toLocaleString('zh-CN')}<small> 条</small></strong><span className="metric-foot">无法直接证明是作者删推</span></div></section>
 <section className="content-grid"><div className="paper-card" id="watchlist"><div className="section-head"><div><span className="section-index">01 — ACCOUNTS</span><h2>监控账号 <span className="count">{stats.accounts}</span></h2></div><button onClick={reload} className="text-button" disabled={refreshing}><RefreshCw size={15} className={refreshing?'spinning':''}/> 刷新</button></div>
 {accounts.length===0?<div className="empty-state"><Eye size={30} strokeWidth={1.2}/><strong>尚无监控账号</strong><p>在上方输入公开 X 用户名，建立你的第一条监控记录。</p></div>:<div className="account-list">{accounts.map((a,index)=><a className="account-item" key={a.id} href={'https://x.com/'+a.username} target="_blank" rel="noopener noreferrer"><span className="account-avatar">{(a.name||a.username).slice(0,1).toUpperCase()}</span><span className="account-identity"><strong>{a.name}</strong><small>@{a.username}</small></span><span className="account-state"><i/>{a.last_checked_at?'已执行采集':'等待采集'}</span><span className="account-time">{fmt(a.last_checked_at)}</span><ArrowUpRight size={16}/></a>)}</div>}
 </div>
 <div className="paper-card" id="activity"><div className="section-head"><div><span className="section-index">02 — TIMELINE</span><h2>最近动态</h2></div><span className="small-quiet">显示最近 50 条</span></div>
 {events.length===0?<div className="empty-state"><Clock3 size={30} strokeWidth={1.2}/><strong>等待第一条监控事件</strong><p>后台采集启动后，这里会展示首次发现的推文和可用性变化。</p></div>:<div className="timeline-list">{events.slice(0,12).map(e=><div className="timeline-entry" key={e.id}><span className={'timeline-mark '+(e.type==='unavailable'?'amber':'')}>{e.type==='new'?<Plus size={15}/>:e.type==='restored'?<Check size={15}/>:<AlertTriangle size={15}/>}</span><div className="timeline-info"><strong>{eventName(e.type)}</strong><p><b>@{e.username}</b> · {e.type==='unavailable'?'此推文目前无法解析，原因尚未确定。':e.post_text||'查看原帖详情'}</p></div><span className="timeline-time">{fmt(e.created_at)}</span><a aria-label="在 X 中查看原帖" href={'https://x.com/'+e.username+'/status/'+e.post_id} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/></a></div>)}</div>}
 </div></section>
 <section className="bottom-grid"><div className="dark-feature" id="alerts"><div className="section-index">03 — SIGNAL INTELLIGENCE</div><h2>不可访问推文检测</h2><p>当已记录的推文无法重新获取时，系统会进行复查并标记状态。不可访问不等同于确认作者删除。</p><div className="feature-bottom"><strong>{stats.unavailable}<small> 条记录</small></strong><span>已发现的不可访问推文</span></div>{unavailable.length>0&&<a className="feature-link" href={'https://x.com/'+unavailable[0].username+'/status/'+unavailable[0].post_id} target="_blank" rel="noopener noreferrer">查看最近一条 <ArrowUpRight size={16}/></a>}</div>
 <div className="paper-card state-explain" id="guide"><div className="section-head"><div><span className="section-index">04 — HOW IT WORKS</span><h2>监控状态说明</h2></div></div><div className="states"><div><i className="dot green"/><strong>已捕获</strong><p>后台成功获取的公开推文，会记录发现时间和原帖 ID。</p></div><div><i className="dot amber"/><strong>疑似不可访问</strong><p>首次复查无法解析时暂不认定为删除，继续验证。</p></div><div><i className="dot gray"/><strong>不可访问</strong><p>多次验证失败后标记。可能是删除、账号权限变化等原因。</p></div></div><div className="guide-note"><ShieldCheck size={18}/> 仅监控公开内容；不保证捕获短时间内删除的推文，结果受 X API 可用性与配额影响。</div></div></section>
 </main><footer className="footer"><span><b>X Watch</b> / Observe the signal.</span><span>独立第三方工具 · 非 X 官方产品 · 数据以实际采集结果为准</span><a href="#home">回到顶部 ↑</a></footer>
 </div>
}