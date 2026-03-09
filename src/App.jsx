import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, Cell
} from "recharts";

// ─── THEME ───────────────────────────────────────────────────────────────────
const T = {
  bg:          "#F5F5F7",
  card:        "#FFFFFF",
  cardBorder:  "#F0F0F0",
  text:        "#0A0A0A",
  textSub:     "#6B7280",
  textMuted:   "#9CA3AF",
  accent:      "#E07B39",
  accentLight: "#FDF0E8",
  green:       "#16A34A",
  greenLight:  "#F0FDF4",
  red:         "#DC2626",
  redLight:    "#FEF2F2",
  amber:       "#D97706",
  amberLight:  "#FFFBEB",
  blue:        "#2563EB",
  blueLight:   "#EFF6FF",
  divider:     "#F3F4F6",
};
const SC = { Michelle:"#E07B39", Alyson:"#2563EB", Susan:"#8B5CF6" };
const STAFF  = ["Michelle","Alyson","Susan"];
const SHIFTS = { Michelle:"Morning", Alyson:"Morning", Susan:"Evening" };
const WDAYS  = [1,2,3,4,5,6];
const DNAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── AIRTABLE ────────────────────────────────────────────────────────────────
const AT_BASE  = "app6DROW7O9mZnmTY";
const AT_TABLE = "tbl4sVuVCiDCyXF3O";
const AT_TOKEN = "patppMWHKbx68aeNP.8d37f524addbaf4997c863c9682c7da9932bb0927727dade5272a72157835ea4";

async function fetchAll() {
  let rows = [], offset = null;
  do {
    const url = new URL(`https://api.airtable.com/v0/${AT_BASE}/${AT_TABLE}`);
    url.searchParams.set("pageSize","100");
    if (offset) url.searchParams.set("offset", offset);
    const r = await fetch(url.toString(), { headers:{ Authorization:`Bearer ${AT_TOKEN}` }});
    if (!r.ok) throw new Error("Airtable fetch failed");
    const d = await r.json();
    rows = [...rows, ...d.records];
    offset = d.offset || null;
  } while (offset);
  return rows;
}

function cook(raw) {
  return raw.map(r => ({
    id:          r.id,
    staff:       r.fields["Staff Name"]          || "",
    date:        r.fields["Date"]                || "",
    task:        r.fields["Task Name"]           || "",
    category:    r.fields["Category"]            || "",
    hours:       Number(r.fields["Task Hours"]   || 0),
    minutes:     Number(r.fields["Task Minutes"] || 0),
    mins:        Number(r.fields["Total Minutes"]|| 0),
    notes:       r.fields["Task Notes"]          || "",
    week:        Number(r.fields["Week Number"]  || 0),
    submittedAt: r.fields["Shift Submitted At"]  || "",
  })).filter(r => r.staff && r.date);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmt(mins) {
  if (!mins) return "0m";
  const h = Math.floor(mins/60), m = mins%60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
}
function pct(a, b) { return b ? Math.round(((a-b)/b)*100) : null; }
function avg(arr)  { return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0; }

function wkNum(dateStr) {
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  d.setDate(d.getDate()+4-(d.getDay()||7));
  const y = new Date(d.getFullYear(),0,1);
  return Math.ceil((((d-y)/86400000)+1)/7);
}
function curWk() { return wkNum(new Date().toISOString().split("T")[0]); }
function prvWk() { const d=new Date(); d.setDate(d.getDate()-7); return wkNum(d.toISOString().split("T")[0]); }

function expectedDays(n=30) {
  const res=[]; const t=new Date();
  for(let i=1;i<=n;i++){ const d=new Date(t); d.setDate(t.getDate()-i); if(WDAYS.includes(d.getDay())) res.push(d.toISOString().split("T")[0]); }
  return res;
}

function shiftMap(recs, name) {
  const m={};
  recs.filter(r=>r.staff===name).forEach(r=>{ m[r.date]=(m[r.date]||0)+r.mins; });
  return m;
}

function staffDates(recs) {
  const m={}; STAFF.forEach(n=>m[n]=new Set());
  recs.forEach(r=>{ if(m[r.staff]) m[r.staff].add(r.date); });
  return m;
}

function teamAvg(recs, task) {
  const v=recs.filter(r=>r.task===task&&r.mins>0).map(r=>r.mins);
  return v.length ? avg(v) : null;
}

function staffAvg(recs, name, task) {
  const v=recs.filter(r=>r.staff===name&&r.task===task&&r.mins>0).map(r=>r.mins);
  return v.length ? avg(v) : null;
}

function consistency(recs, name) {
  const v=Object.values(shiftMap(recs,name));
  if(v.length<2) return null;
  const m=avg(v), cv=Math.sqrt(v.reduce((a,b)=>a+Math.pow(b-m,2),0)/v.length)/m;
  return Math.max(0,Math.round((1-Math.min(cv,1))*100));
}

function wkMins(recs, name, wk) {
  return recs.filter(r=>r.staff===name&&r.week===wk&&r.mins>0).reduce((a,r)=>a+r.mins,0);
}

// Best day for task (fewest mins)
function bestDay(recs, task) {
  const m={};
  recs.filter(r=>r.task===task&&r.mins>0).forEach(r=>{
    const dow=new Date(r.date).getDay();
    if(!m[dow]) m[dow]=[];
    m[dow].push(r.mins);
  });
  const sorted=Object.entries(m).map(([d,v])=>({ day:DNAMES[d], avg:avg(v), n:v.length }))
    .filter(x=>x.n>=1).sort((a,b)=>a.avg-b.avg);
  return sorted[0]||null;
}

// Heatmap: for each task × day, was it done?
function buildHeatmap(recs, name) {
  // unique tasks for this staff
  const tasks=[...new Set(recs.filter(r=>r.staff===name).map(r=>r.task))];
  // last 4 weeks of data
  const rows=tasks.map(task=>{
    const cells=DNAMES.slice(1,7).map(day=>{ // Mon-Sat
      const done=recs.filter(r=>r.staff===name&&r.task===task&&DNAMES[new Date(r.date).getDay()]===day);
      return { done:done.length>0, count:done.length, avgMins:done.length?avg(done.map(d=>d.mins)):0 };
    });
    return { task, cells };
  });
  return rows;
}

// Weekly trend per task (avg mins per day of week)
function taskDayTrend(recs, task) {
  const m={};
  recs.filter(r=>r.task===task&&r.mins>0).forEach(r=>{
    const d=DNAMES[new Date(r.date).getDay()];
    if(!m[d]) m[d]=[];
    m[d].push(r.mins);
  });
  return DNAMES.slice(1,7).map(d=>({ day:d, mins: m[d]?avg(m[d]):null, n:m[d]?.length||0 }));
}

// AI summary
function genSummary(recs, expDays) {
  if(!recs.length) return [{ type:"info", text:"No data yet. Submit a few shifts to unlock insights." }];
  const pts=[];
  const sdm=staffDates(recs);
  const cw=curWk(), pw=prvWk();

  STAFF.forEach(n=>{
    const c=wkMins(recs,n,cw), p=wkMins(recs,n,pw), chg=pct(c,p);
    if(chg!==null&&Math.abs(chg)>=15)
      pts.push({ type:chg>0?"good":"warn", text:`${n} logged ${Math.abs(chg)}% ${chg>0?"more":"less"} this week vs last (${fmt(c)} vs ${fmt(p)}).` });
  });

  const allTasks=[...new Set(recs.map(r=>r.task))];
  allTasks.forEach(task=>{
    const ta=teamAvg(recs,task); if(!ta) return;
    STAFF.forEach(n=>{
      const sa=staffAvg(recs,n,task); if(!sa) return;
      const d=Math.round(((sa-ta)/ta)*100);
      if(d>35) pts.push({ type:"flag", text:`${n} is ${d}% slower than average on "${task}" — ${sa}m vs ${ta}m team avg.` });
    });
  });

  ["Personal Training","Post Office","Till Lift / End of Shift Count"].forEach(task=>{
    const b=bestDay(recs,task);
    if(b) pts.push({ type:"insight", text:`"${task}" gets done fastest on ${b.day}s — avg ${b.avg} mins.` });
  });

  STAFF.forEach(n=>{
    const miss=expDays.filter(d=>!sdm[n]?.has(d)).length;
    if(miss>3) pts.push({ type:"flag", text:`${n} has ${miss} missing submissions in the last 30 days.` });
  });

  const top=STAFF.map(n=>({ n, sc:consistency(recs,n)||0 })).sort((a,b)=>b.sc-a.sc)[0];
  if(top?.sc>75) pts.push({ type:"good", text:`${top.n} is your most consistent team member — ${top.sc}/100 reliability score.` });

  if(!pts.length) pts.push({ type:"info", text:"Everything looks steady. More data will surface deeper insights." });
  return pts;
}

// ─── MICRO COMPONENTS ────────────────────────────────────────────────────────
function Card({ children, style={}, onPress }) {
  return <div onClick={onPress} style={{ background:T.card, borderRadius:16, border:`1px solid ${T.cardBorder}`,
    boxShadow:"0 2px 12px rgba(0,0,0,0.05)", padding:16, ...style, cursor:onPress?"pointer":"default" }}>{children}</div>;
}
function Lbl({ children }) {
  return <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:8, marginTop:4 }}>{children}</div>;
}
function Badge({ label, type="neutral" }) {
  const m={ good:{bg:T.greenLight,c:T.green}, warn:{bg:T.amberLight,c:T.amber}, flag:{bg:T.redLight,c:T.red}, neutral:{bg:T.accentLight,c:T.accent}, blue:{bg:T.blueLight,c:T.blue} };
  const s=m[type]||m.neutral;
  return <span style={{ background:s.bg, color:s.c, fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, whiteSpace:"nowrap" }}>{label}</span>;
}
function Chip({ pct: p }) {
  if(p===null||p===undefined) return <span style={{ fontSize:12,color:T.textMuted }}>—</span>;
  return <span style={{ fontSize:12, fontWeight:700, color:p>=0?T.green:T.red }}>{p>=0?"▲":"▼"} {Math.abs(p)}% WoW</span>;
}
function Bar2({ val, max, color, h=6 }) {
  return <div style={{ height:h, background:T.divider, borderRadius:99, overflow:"hidden" }}>
    <div style={{ height:"100%", width:`${max>0?Math.min((val/max)*100,100):0}%`, background:color, borderRadius:99, transition:"width 0.5s" }}/>
  </div>;
}
function Avatar({ name, size=36 }) {
  return <div style={{ width:size, height:size, borderRadius:"50%", background:SC[name]||T.accent,
    color:"#fff", fontWeight:800, fontSize:size*.34, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
    {name.slice(0,2).toUpperCase()}</div>;
}
function InsightRow({ item }) {
  const icon={ good:"✅", warn:"⚠️", flag:"🚨", insight:"💡", info:"📊" }[item.type]||"•";
  const col={ good:T.green, warn:T.amber, flag:T.red, insight:T.blue, info:T.textSub }[item.type]||T.textSub;
  return <div style={{ display:"flex", gap:10, padding:"12px 0", borderBottom:`1px solid ${T.divider}` }}>
    <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>
    <p style={{ margin:0, fontSize:14, color:col, lineHeight:1.6, fontWeight:500 }}>{item.text}</p>
  </div>;
}
function NoteTag({ note }) {
  if(!note) return null;
  return <span style={{ background:T.blueLight, color:T.blue, fontSize:11, fontWeight:500, padding:"2px 8px",
    borderRadius:8, display:"inline-block", marginTop:4, maxWidth:"100%", wordBreak:"break-word" }}>
    💬 {note}</span>;
}

// ─── HEATMAP COMPONENT ───────────────────────────────────────────────────────
function Heatmap({ rows }) {
  const days=["Mon","Tue","Wed","Thu","Fri","Sat"];
  if(!rows.length) return <p style={{ color:T.textMuted, fontSize:14 }}>No data yet.</p>;
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ borderCollapse:"collapse", width:"100%", fontSize:11 }}>
        <thead>
          <tr>
            <th style={{ textAlign:"left", color:T.textMuted, fontWeight:700, paddingRight:8, paddingBottom:6, whiteSpace:"nowrap" }}>Task</th>
            {days.map(d=><th key={d} style={{ color:T.textMuted, fontWeight:700, paddingBottom:6, textAlign:"center", minWidth:34 }}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(row=>(
            <tr key={row.task}>
              <td style={{ paddingRight:8, paddingBottom:4, color:T.textSub, fontWeight:600, whiteSpace:"nowrap",
                fontSize:11, maxWidth:130, overflow:"hidden", textOverflow:"ellipsis" }}>{row.task}</td>
              {row.cells.map((cell,i)=>(
                <td key={i} style={{ textAlign:"center", paddingBottom:4 }}>
                  <div title={cell.done?`${cell.count}× · avg ${cell.avgMins}m`:""} style={{
                    width:28, height:28, borderRadius:7, margin:"0 auto",
                    background: cell.done ? (cell.avgMins > 60 ? "#FEE2E2" : cell.avgMins > 30 ? "#FEF3C7" : "#DCFCE7") : "#F3F4F6",
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:13,
                    border: cell.done ? "1px solid rgba(0,0,0,0.06)" : "none",
                  }}>
                    {cell.done ? (cell.avgMins>60?"🔴":cell.avgMins>30?"🟡":"🟢") : ""}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display:"flex", gap:12, marginTop:10, fontSize:11, color:T.textMuted }}>
        <span>🟢 &lt;30m</span><span>🟡 30–60m</span><span>🔴 &gt;60m</span><span style={{ color:T.divider }}>□ not done</span>
      </div>
    </div>
  );
}

// ─── TODAY SNAPSHOT ──────────────────────────────────────────────────────────
function TodaySnapshot({ recs, sdm }) {
  const today = new Date().toISOString().split("T")[0];
  const todayRecs = recs.filter(r=>r.date===today);
  const totalMins = todayRecs.reduce((a,r)=>a+r.mins,0);
  const taskCount = [...new Set(todayRecs.map(r=>r.task))].length;
  const activeStaff = [...new Set(todayRecs.map(r=>r.staff))].length;
  const isWorkDay = WDAYS.includes(new Date().getDay());

  // Most time spent on
  const catMap={};
  todayRecs.forEach(r=>{ catMap[r.category]=(catMap[r.category]||0)+r.mins; });
  const topCat = Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0];
  const avgTaskMins = taskCount > 0 ? Math.round(totalMins/taskCount) : 0;

  const notIn = isWorkDay ? STAFF.filter(n=>!sdm[n]?.has(today)) : [];

  return (
    <Card style={{ marginBottom:14, background:"#111", border:"none" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.5)", letterSpacing:0.8, textTransform:"uppercase" }}>
            Today · {new Date().toLocaleDateString("en-GB",{ weekday:"long", day:"numeric", month:"long" })}
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:"#fff", marginTop:2 }}>
            {isWorkDay ? (activeStaff>0?"Live":"Waiting for submissions") : "Day Off"}
          </div>
        </div>
        <div style={{ width:10, height:10, borderRadius:"50%", background:activeStaff>0?"#22C55E":"#6B7280", marginTop:6,
          boxShadow:activeStaff>0?"0 0 8px #22C55E":"none" }}/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:notIn.length?12:0 }}>
        {[
          { label:"HOURS LOGGED", val:fmt(totalMins), dim:!totalMins },
          { label:"TASKS DONE",   val:taskCount||"—", dim:!taskCount },
          { label:"STAFF IN",     val:`${activeStaff}/${STAFF.length}`, dim:!activeStaff },
          { label:"AVG TASK TIME",val:avgTaskMins?`${avgTaskMins}m`:"—", dim:!avgTaskMins },
        ].map(k=>(
          <div key={k.label} style={{ background:"rgba(255,255,255,0.07)", borderRadius:12, padding:"10px 12px" }}>
            <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>{k.label}</div>
            <div style={{ fontSize:20, fontWeight:800, color:k.dim?"rgba(255,255,255,0.25)":"#fff" }}>{k.val}</div>
          </div>
        ))}
      </div>

      {topCat && (
        <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:12, padding:"10px 12px", marginBottom:notIn.length?8:0 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", marginBottom:2 }}>MOST TIME ON</div>
          <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>{topCat[0]} <span style={{ color:"rgba(255,255,255,0.4)", fontWeight:400 }}>· {fmt(topCat[1])}</span></div>
        </div>
      )}

      {notIn.length>0 && (
        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8, background:"rgba(220,38,38,0.15)", borderRadius:10, padding:"8px 12px" }}>
          <span style={{ fontSize:14 }}>🚨</span>
          <span style={{ fontSize:13, color:"#FCA5A5", fontWeight:600 }}>Not submitted: {notIn.join(", ")}</span>
        </div>
      )}
    </Card>
  );
}

// ─── HOME SCREEN ─────────────────────────────────────────────────────────────
function HomeScreen({ recs, onNav, expDays }) {
  const sdm = useMemo(()=>staffDates(recs),[recs]);
  const summary = useMemo(()=>genSummary(recs,expDays),[recs]);
  const cw=curWk(), pw=prvWk();
  const today=new Date().toISOString().split("T")[0];
  const weekStats = STAFF.map(n=>({ n, curr:wkMins(recs,n,cw), prev:wkMins(recs,n,pw) }));
  const teamCurr = weekStats.reduce((a,b)=>a+b.curr,0);
  const teamPrev = weekStats.reduce((a,b)=>a+b.prev,0);

  // KPI: all time
  const totalRecs = recs.filter(r=>r.mins>0);
  const allMins = totalRecs.reduce((a,r)=>a+r.mins,0);
  const allTasks = [...new Set(totalRecs.map(r=>r.task))].length;
  const avgTask  = totalRecs.length ? avg(totalRecs.map(r=>r.mins)) : 0;

  return (
    <div style={{ padding:"0 16px 100px" }}>
      <TodaySnapshot recs={recs} sdm={sdm}/>

      {/* KPI ROW */}
      <Lbl>All-Time KPIs</Lbl>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
        {[
          { label:"TOTAL HOURS",   val:fmt(allMins),      color:T.accent },
          { label:"UNIQUE TASKS",  val:allTasks,          color:T.blue },
          { label:"AVG TASK TIME", val:avgTask?`${avgTask}m`:"—", color:T.green },
          { label:"TOTAL RECORDS", val:totalRecs.length,  color:"#8B5CF6" },
        ].map(k=>(
          <Card key={k.label} style={{ padding:"14px" }}>
            <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, marginBottom:4 }}>{k.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.color }}>{k.val}</div>
          </Card>
        ))}
      </div>

      {/* STAFF CARDS */}
      <Lbl>Staff This Week · W{cw}</Lbl>
      {weekStats.map(({ n, curr, prev })=>{
        const miss30 = expDays.filter(d=>!sdm[n]?.has(d)).length;
        const sc = consistency(recs, n);
        const sub = sdm[n]?.has(today);
        return (
          <Card key={n} style={{ marginBottom:10 }} onPress={()=>onNav("staff",n)}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <Avatar name={n} size={44}/>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                  <span style={{ fontSize:16, fontWeight:800, color:T.text }}>{n}</span>
                  <Badge label={SHIFTS[n]} type="neutral"/>
                  {sub?<Badge label="✓ Today" type="good"/>:<Badge label="Not in" type="flag"/>}
                </div>
                <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>
                  {sc!==null?`${sc}/100 consistency · `:""}
                  {miss30>0?<span style={{ color:T.red }}>{miss30} missing (30d)</span>:"All shifts logged"}
                </div>
              </div>
              <span style={{ fontSize:18, color:T.textMuted }}>›</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div><div style={{ fontSize:10,color:T.textMuted,fontWeight:700 }}>THIS WK</div>
                <div style={{ fontSize:18,fontWeight:800,color:SC[n] }}>{fmt(curr)||"—"}</div></div>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:10,color:T.textMuted,fontWeight:700 }}>LAST WK</div>
                <div style={{ fontSize:18,fontWeight:800,color:T.textSub }}>{fmt(prev)||"—"}</div></div>
              <div style={{ textAlign:"right" }}><div style={{ fontSize:10,color:T.textMuted,fontWeight:700 }}>CHANGE</div>
                <Chip pct={pct(curr,prev)}/></div>
            </div>
            <Bar2 val={curr} max={Math.max(teamCurr/STAFF.length*1.5,360)} color={SC[n]}/>
          </Card>
        );
      })}

      {/* WoW CHART */}
      {weekStats.some(s=>s.curr>0||s.prev>0)&&(
        <>
          <Lbl>Week-on-Week</Lbl>
          <Card style={{ marginBottom:14, padding:"16px 8px 8px" }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weekStats.map(s=>({ name:s.n, "This Week":+(s.curr/60).toFixed(1), "Last Week":+(s.prev/60).toFixed(1) }))} margin={{ left:0,right:8,top:4,bottom:8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.divider}/>
                <XAxis dataKey="name" tick={{ fontSize:12,fill:T.textSub,fontWeight:700 }}/>
                <YAxis tick={{ fontSize:11,fill:T.textMuted }} width={26}/>
                <Tooltip formatter={v=>[`${v}h`]} contentStyle={{ borderRadius:12,border:`1px solid ${T.cardBorder}`,fontSize:13 }}/>
                <Legend wrapperStyle={{ fontSize:12 }}/>
                <Bar dataKey="This Week" radius={[6,6,0,0]}>{weekStats.map(s=><Cell key={s.n} fill={SC[s.n]}/>)}</Bar>
                <Bar dataKey="Last Week" fill="#E5E7EB" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {/* AI SUMMARY */}
      <Lbl>Intelligence Summary</Lbl>
      <Card style={{ marginBottom:14 }}>
        {summary.map((item,i)=><InsightRow key={i} item={item}/>)}
      </Card>
    </div>
  );
}

// ─── STAFF SCREEN ─────────────────────────────────────────────────────────────
function StaffScreen({ name, recs, onNav, expDays }) {
  const [tab, setTab] = useState("overview");
  const color = SC[name];
  const sRecs = recs.filter(r=>r.staff===name);
  const cw=curWk(), pw=prvWk();
  const curr=wkMins(recs,name,cw), prev=wkMins(recs,name,pw);
  const sdm=staffDates(recs);
  const miss30=expDays.filter(d=>!sdm[name]?.has(d));
  const sc=consistency(recs,name);
  const today=new Date().toISOString().split("T")[0];
  const sub=sdm[name]?.has(today);

  const sm=shiftMap(recs,name);
  const sv=Object.values(sm);
  const avgShift=sv.length?avg(sv):0;

  // tasks with diff
  const myTasks=useMemo(()=>{
    const m={};
    sRecs.filter(r=>r.mins>0).forEach(r=>{
      if(!m[r.task]) m[r.task]={ task:r.task, cat:r.category, vals:[], notes:[] };
      m[r.task].vals.push(r.mins);
      if(r.notes) m[r.task].notes.push({ date:r.date, note:r.notes, mins:r.mins });
    });
    return Object.values(m).map(t=>{
      const ta=teamAvg(recs,t.task);
      const sa=avg(t.vals);
      const d=ta?Math.round(((sa-ta)/ta)*100):0;
      return { ...t, avg:sa, teamAvg:ta, diff:d, count:t.vals.length };
    }).sort((a,b)=>b.diff-a.diff);
  },[sRecs]);

  // weekly trend
  const wkTrend=useMemo(()=>{
    const wks=[...new Set(sRecs.map(r=>`W${r.week}`))].sort();
    return wks.map(wk=>({ week:wk, hours:+(wkMins(recs,name,+wk.slice(1))/60).toFixed(1) }));
  },[sRecs]);

  // category breakdown
  const catBreak=useMemo(()=>{
    const m={};
    sRecs.filter(r=>r.mins>0).forEach(r=>{ m[r.category]=(m[r.category]||0)+r.mins; });
    const tot=Object.values(m).reduce((a,b)=>a+b,0);
    return Object.entries(m).map(([c,v])=>({ c, v, p:Math.round((v/tot)*100) })).sort((a,b)=>b.v-a.v);
  },[sRecs]);

  // heatmap
  const heatRows=useMemo(()=>buildHeatmap(recs,name),[recs,name]);

  const tabs=["overview","tasks","heatmap","trends"];

  return (
    <div style={{ padding:"0 16px 100px" }}>
      {/* Hero */}
      <Card style={{ marginBottom:14 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:14 }}>
          <Avatar name={name} size={52}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20,fontWeight:800,color:T.text }}>{name}</div>
            <div style={{ display:"flex",gap:6,marginTop:4,flexWrap:"wrap" }}>
              <Badge label={SHIFTS[name]} type="neutral"/>
              {sub?<Badge label="✓ Submitted Today" type="good"/>:<Badge label="Not submitted today" type="flag"/>}
            </div>
          </div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
          {[
            { l:"THIS WEEK", v:fmt(curr)||"—", s:<Chip pct={pct(curr,prev)}/>, col:color },
            { l:"AVG SHIFT",  v:fmt(avgShift)||"—", s:"all time", col:color },
            { l:"CONSISTENCY",v:sc!==null?`${sc}/100`:"—", s:"reliability", col:sc>70?T.green:sc>40?T.amber:T.red },
          ].map(k=>(
            <div key={k.l} style={{ background:T.bg,borderRadius:12,padding:"10px 8px" }}>
              <div style={{ fontSize:10,fontWeight:700,color:T.textMuted,marginBottom:4 }}>{k.l}</div>
              <div style={{ fontSize:16,fontWeight:800,color:k.col }}>{k.v}</div>
              <div style={{ fontSize:11,color:T.textMuted,marginTop:2 }}>{k.s}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:2 }}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            background:tab===t?color:T.card, color:tab===t?"#fff":T.textSub,
            border:`1px solid ${tab===t?color:T.cardBorder}`, borderRadius:20,
            padding:"8px 16px", fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
          }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab==="overview"&&(
        <>
          <Lbl>This Week vs Last Week</Lbl>
          <Card style={{ marginBottom:14 }}>
            {[{ l:"This Week",v:curr,col:color },{ l:"Last Week",v:prev,col:"#E5E7EB" }].map(row=>(
              <div key={row.l} style={{ marginBottom:10 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontSize:13,fontWeight:600,color:T.textSub }}>{row.l}</span>
                  <span style={{ fontSize:13,fontWeight:800,color:T.text }}>{fmt(row.v)||"0m"}</span>
                </div>
                <Bar2 val={row.v} max={Math.max(curr,prev,1)} color={row.col}/>
              </div>
            ))}
            <div style={{ display:"flex",justifyContent:"flex-end",marginTop:4 }}><Chip pct={pct(curr,prev)}/></div>
          </Card>

          <Lbl>Time by Category</Lbl>
          <Card style={{ marginBottom:14 }}>
            {catBreak.map(c=>(
              <div key={c.c} style={{ marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontSize:13,fontWeight:600,color:T.textSub }}>{c.c}</span>
                  <span style={{ fontSize:13,fontWeight:700,color:T.text }}>{fmt(c.v)} <span style={{ color:T.textMuted,fontWeight:400 }}>({c.p}%)</span></span>
                </div>
                <Bar2 val={c.p} max={100} color={color}/>
              </div>
            ))}
            {!catBreak.length&&<p style={{ color:T.textMuted,fontSize:14,margin:0 }}>No data yet.</p>}
          </Card>

          {miss30.length>0&&(
            <>
              <Lbl>Missing Submissions</Lbl>
              <Card style={{ marginBottom:14 }}>
                <div style={{ fontSize:22,fontWeight:800,color:T.red,marginBottom:8 }}>{miss30.length} <span style={{ fontSize:13,color:T.textMuted,fontWeight:400 }}>days</span></div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                  {miss30.slice(0,8).map(d=>(
                    <span key={d} style={{ background:T.redLight,color:T.red,fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:20 }}>
                      {new Date(d).toLocaleDateString("en-GB",{ weekday:"short",day:"numeric",month:"short" })}
                    </span>
                  ))}
                  {miss30.length>8&&<span style={{ fontSize:12,color:T.textMuted,padding:"4px 8px" }}>+{miss30.length-8} more</span>}
                </div>
              </Card>
            </>
          )}
        </>
      )}

      {/* TASKS */}
      {tab==="tasks"&&(
        <>
          <Lbl>All Tasks · Tap for detail</Lbl>
          {myTasks.map(t=>(
            <Card key={t.task} style={{ marginBottom:8 }} onPress={()=>onNav("task",{ task:t.task, staff:name })}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14,fontWeight:700,color:T.text }}>{t.task}</div>
                  <div style={{ fontSize:12,color:T.textMuted }}>{t.cat} · {t.count} sessions</div>
                  {/* Show latest note if exists */}
                  {t.notes.length>0&&<NoteTag note={t.notes[t.notes.length-1].note}/>}
                </div>
                <div style={{ textAlign:"right",flexShrink:0 }}>
                  <div style={{ fontSize:16,fontWeight:800,color:t.diff>20?T.red:t.diff<-20?T.green:T.text }}>{t.avg}m</div>
                  {t.teamAvg&&<div style={{ fontSize:11,color:T.textMuted }}>avg {t.teamAvg}m</div>}
                </div>
                {t.diff!==0&&<Badge label={`${t.diff>0?"+":""}${t.diff}%`} type={t.diff>20?"flag":t.diff<-20?"good":"neutral"}/>}
                <span style={{ fontSize:16,color:T.textMuted }}>›</span>
              </div>
            </Card>
          ))}
          {!myTasks.length&&<p style={{ color:T.textMuted,fontSize:14,textAlign:"center",padding:"32px 0" }}>No tasks logged yet.</p>}
        </>
      )}

      {/* HEATMAP */}
      {tab==="heatmap"&&(
        <>
          <Lbl>Task Completion Heatmap</Lbl>
          <Card style={{ marginBottom:14, overflowX:"auto" }}>
            <Heatmap rows={heatRows}/>
          </Card>
          <p style={{ fontSize:12,color:T.textMuted,padding:"0 4px" }}>Colour shows avg time taken. Empty = not logged. Tap a staff card and switch to Trends to see day-by-day patterns.</p>
        </>
      )}

      {/* TRENDS */}
      {tab==="trends"&&(
        <>
          {wkTrend.length>1&&(
            <>
              <Lbl>Weekly Hours Trend</Lbl>
              <Card style={{ marginBottom:14,padding:"16px 8px 8px" }}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={wkTrend} margin={{ left:0,right:8,top:4,bottom:8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.divider}/>
                    <XAxis dataKey="week" tick={{ fontSize:11,fill:T.textMuted }}/>
                    <YAxis tick={{ fontSize:11,fill:T.textMuted }} width={26}/>
                    <Tooltip formatter={v=>[`${v}h`]} contentStyle={{ borderRadius:12,border:`1px solid ${T.cardBorder}`,fontSize:13 }}/>
                    <Line type="monotone" dataKey="hours" stroke={color} strokeWidth={3} dot={{ fill:color,r:4 }}/>
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </>
          )}

          <Lbl>Recent Shifts</Lbl>
          <Card>
            {Object.entries(sm).sort(([a],[b])=>b.localeCompare(a)).slice(0,10).map(([date,mins],i)=>(
              <div key={date} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"12px 0",borderTop:i===0?"none":`1px solid ${T.divider}` }}>
                <span style={{ fontSize:14,color:T.textSub }}>{new Date(date).toLocaleDateString("en-GB",{ weekday:"short",day:"numeric",month:"short" })}</span>
                <span style={{ fontSize:14,fontWeight:700,color:mins>=300?T.green:mins>=180?color:T.red }}>{fmt(mins)}</span>
              </div>
            ))}
            {!Object.keys(sm).length&&<p style={{ color:T.textMuted,fontSize:14,margin:0 }}>No shifts yet.</p>}
          </Card>
        </>
      )}
    </div>
  );
}

// ─── TASK DRILL-DOWN ──────────────────────────────────────────────────────────
function TaskScreen({ task, staffName, recs }) {
  const color=SC[staffName];
  const sRecs=recs.filter(r=>r.staff===staffName&&r.task===task&&r.mins>0);
  const ta=teamAvg(recs,task);
  const sa=staffAvg(recs,staffName,task);
  const diff=ta&&sa?Math.round(((sa-ta)/ta)*100):null;
  const best=bestDay(recs.filter(r=>r.staff===staffName),task);

  // Day-of-week trend
  const dayTrend=taskDayTrend(recs.filter(r=>r.staff===staffName),task).filter(d=>d.mins!==null);

  // All staff comparison
  const allAvgs=STAFF.map(n=>({ n, avg:staffAvg(recs,n,task)||0 })).filter(s=>s.avg>0);

  // Session history with notes
  const sessions=sRecs.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,15).map(r=>({
    date:new Date(r.date).toLocaleDateString("en-GB",{ weekday:"short",day:"numeric",month:"short" }),
    mins:r.mins, notes:r.notes,
  }));

  return (
    <div style={{ padding:"0 16px 100px" }}>
      {/* Header card */}
      <Card style={{ marginBottom:14 }}>
        <div style={{ fontSize:18,fontWeight:800,color:T.text,marginBottom:4 }}>{task}</div>
        <div style={{ fontSize:13,color:T.textMuted,marginBottom:14 }}>{staffName} · {sRecs.length} sessions</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
          {[
            { l:"STAFF AVG", v:sa?`${sa}m`:"—", col:color },
            { l:"TEAM AVG",  v:ta?`${ta}m`:"—", col:T.textSub },
            { l:"DIFF",      v:diff!==null?`${diff>0?"+":""}${diff}%`:"—", col:diff>15?T.red:diff<-15?T.green:T.text },
          ].map(s=>(
            <div key={s.l} style={{ background:T.bg,borderRadius:12,padding:"10px 8px",textAlign:"center" }}>
              <div style={{ fontSize:10,fontWeight:700,color:T.textMuted,marginBottom:4 }}>{s.l}</div>
              <div style={{ fontSize:18,fontWeight:800,color:s.col }}>{s.v}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* All staff comparison */}
      {allAvgs.length>1&&(
        <>
          <Lbl>All Staff Comparison</Lbl>
          <Card style={{ marginBottom:14,padding:"16px 8px 8px" }}>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={allAvgs.map(s=>({ name:s.n, mins:s.avg }))} margin={{ left:0,right:8,top:4,bottom:8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.divider}/>
                <XAxis dataKey="name" tick={{ fontSize:12,fill:T.textSub,fontWeight:700 }}/>
                <YAxis tick={{ fontSize:11,fill:T.textMuted }} width={26}/>
                <Tooltip formatter={v=>[`${v} mins`]} contentStyle={{ borderRadius:12,border:`1px solid ${T.cardBorder}`,fontSize:13 }}/>
                <Bar dataKey="mins" radius={[6,6,0,0]}>{allAvgs.map(s=><Cell key={s.n} fill={SC[s.n]||T.accent}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {/* Day of week trend */}
      {dayTrend.length>1&&(
        <>
          <Lbl>Avg Time by Day of Week</Lbl>
          <Card style={{ marginBottom:14,padding:"16px 8px 8px" }}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dayTrend} margin={{ left:0,right:8,top:4,bottom:8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.divider}/>
                <XAxis dataKey="day" tick={{ fontSize:12,fill:T.textSub }}/>
                <YAxis tick={{ fontSize:11,fill:T.textMuted }} width={26}/>
                <Tooltip formatter={v=>[`${v} mins`]} contentStyle={{ borderRadius:12,border:`1px solid ${T.cardBorder}`,fontSize:13 }}/>
                <Bar dataKey="mins" radius={[6,6,0,0]}>
                  {dayTrend.map((d,i)=>(
                    <Cell key={i} fill={best&&d.day===best.day?"#22C55E":d.mins>60?"#FCA5A5":d.mins>30?"#FCD34D":color}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {best&&<div style={{ fontSize:12,color:T.green,fontWeight:600,textAlign:"center",marginTop:6 }}>✓ Fastest on {best.day}s</div>}
          </Card>
        </>
      )}

      {/* Session history with notes */}
      <Lbl>Session History · with Notes</Lbl>
      <Card>
        {sessions.map((s,i)=>(
          <div key={i} style={{ padding:"12px 0",borderTop:i===0?"none":`1px solid ${T.divider}` }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
              <span style={{ fontSize:13,color:T.textSub,fontWeight:500 }}>{s.date}</span>
              <span style={{ fontSize:14,fontWeight:700,color:ta&&s.mins>ta*1.3?T.red:ta&&s.mins<ta*0.7?T.green:T.text }}>{s.mins}m</span>
            </div>
            {s.notes&&<NoteTag note={s.notes}/>}
          </div>
        ))}
        {!sessions.length&&<p style={{ color:T.textMuted,fontSize:14,margin:0 }}>No sessions yet.</p>}
      </Card>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [recs, setRecs]     = useState([]);
  const [loading, setLoad]  = useState(true);
  const [error, setErr]     = useState(null);
  const [refreshed, setRef] = useState(null);
  const [nav, setNav]       = useState({ screen:"home" });
  const expDays = useMemo(()=>expectedDays(30),[]);

  const load = async () => {
    setLoad(true); setErr(null);
    try { const r=await fetchAll(); setRecs(cook(r)); setRef(new Date()); }
    catch(e) { setErr(e.message); }
    finally { setLoad(false); }
  };
  useEffect(()=>{ load(); },[]);

  function goNav(screen, data) {
    if(screen==="staff") setNav({ screen:"staff", staff:data });
    else if(screen==="task") setNav({ screen:"task", staff:data.staff, task:data.task });
    else setNav({ screen:"home" });
    window.scrollTo(0,0);
  }

  const sdm = useMemo(()=>staffDates(recs),[recs]);
  const today = new Date().toISOString().split("T")[0];
  const missingN = WDAYS.includes(new Date().getDay()) ? STAFF.filter(n=>!sdm[n]?.has(today)).length : 0;

  const title = nav.screen==="home" ? "StaffLog"
    : nav.screen==="staff" ? nav.staff
    : nav.task?.length>22 ? nav.task.slice(0,21)+"…" : nav.task;
  const sub = nav.screen==="home"
    ? new Date().toLocaleDateString("en-GB",{ weekday:"long",day:"numeric",month:"long" })
    : nav.screen==="staff" ? `${SHIFTS[nav.staff]} · tap tabs for detail`
    : nav.staff;

  return (
    <div style={{ background:T.bg, minHeight:"100vh", fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif", maxWidth:480, margin:"0 auto" }}>
      {/* TOP BAR */}
      <div style={{ background:T.card, borderBottom:`1px solid ${T.cardBorder}`, position:"sticky", top:0, zIndex:20, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            {nav.screen!=="home"&&(
              <button onClick={()=>{ nav.screen==="task"?goNav("staff",nav.staff):goNav("home"); }}
                style={{ background:"none",border:"none",fontSize:20,cursor:"pointer",color:T.text,padding:"0 4px 0 0",lineHeight:1 }}>←</button>
            )}
            <div style={{ width:32,height:32,background:"#111",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>⚡</div>
            <div>
              <div style={{ fontSize:15,fontWeight:800,color:T.text,letterSpacing:-0.3 }}>{title}</div>
              <div style={{ fontSize:11,color:T.textMuted }}>{sub}</div>
            </div>
          </div>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            {missingN>0&&nav.screen==="home"&&<Badge label={`${missingN} missing`} type="flag"/>}
            <button onClick={load} disabled={loading} style={{ background:T.bg,border:`1px solid ${T.cardBorder}`,borderRadius:10,padding:"6px 12px",fontSize:13,fontWeight:700,color:T.textSub,cursor:"pointer" }}>
              {loading?"…":"↻"}
            </button>
          </div>
        </div>

        {/* Staff pills — home only */}
        {nav.screen==="home"&&(
          <div style={{ display:"flex",gap:8,padding:"0 16px 12px",overflowX:"auto" }}>
            {STAFF.map(n=>{
              const ok=sdm[n]?.has(today);
              return (
                <button key={n} onClick={()=>goNav("staff",n)} style={{
                  display:"flex",alignItems:"center",gap:6,
                  background:ok?T.greenLight:T.redLight,
                  border:`1px solid ${ok?"#BBF7D0":"#FECACA"}`,
                  borderRadius:20,padding:"6px 12px",cursor:"pointer",flexShrink:0,
                }}>
                  <div style={{ width:7,height:7,borderRadius:"50%",background:ok?T.green:T.red }}/>
                  <span style={{ fontSize:13,fontWeight:700,color:T.text }}>{n}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div style={{ paddingTop:12 }}>
        {loading&&!recs.length ? (
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"80px 0" }}>
            <div style={{ width:36,height:36,borderRadius:"50%",border:`3px solid ${T.divider}`,borderTop:`3px solid ${T.accent}`,animation:"spin 0.8s linear infinite" }}/>
            <p style={{ color:T.textMuted,marginTop:16,fontSize:15 }}>Loading staff data...</p>
          </div>
        ) : error ? (
          <div style={{ margin:16,background:T.redLight,border:`1px solid #FECACA`,borderRadius:14,padding:20,color:T.red,fontSize:14 }}>
            ⚠️ {error}
            <button onClick={load} style={{ marginLeft:12,background:"none",border:`1px solid ${T.red}`,color:T.red,borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:13 }}>Retry</button>
          </div>
        ) : nav.screen==="home" ? (
          <HomeScreen recs={recs} onNav={goNav} expDays={expDays}/>
        ) : nav.screen==="staff" ? (
          <StaffScreen name={nav.staff} recs={recs} onNav={goNav} expDays={expDays}/>
        ) : (
          <TaskScreen task={nav.task} staffName={nav.staff} recs={recs}/>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}body{margin:0}::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}
