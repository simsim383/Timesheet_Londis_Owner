import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, Cell
} from "recharts";

// ─── BRAND & THEME ───────────────────────────────────────────────────────────
const T = {
  bg:         "#F5F5F7",
  card:       "#FFFFFF",
  cardBorder: "#F0F0F0",
  text:       "#0A0A0A",
  textSub:    "#6B7280",
  textMuted:  "#9CA3AF",
  accent:     "#E07B39",
  accentLight:"#FDF0E8",
  green:      "#16A34A",
  greenLight: "#F0FDF4",
  red:        "#DC2626",
  redLight:   "#FEF2F2",
  amber:      "#D97706",
  amberLight: "#FFFBEB",
  blue:       "#2563EB",
  blueLight:  "#EFF6FF",
  divider:    "#F3F4F6",
};

const STAFF_COLORS = {
  Michelle: "#E07B39",
  Alyson:   "#2563EB",
  Susan:    "#8B5CF6",
};

const STAFF_NAMES  = ["Michelle", "Alyson", "Susan"];
const STAFF_SHIFTS = { Michelle:"Morning", Alyson:"Morning", Susan:"Evening" };
const WORK_DAYS    = [1,2,3,4,5,6];
const DAY_NAMES    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const AIRTABLE_BASE_ID  = "app6DROW7O9mZnmTY";
const AIRTABLE_TABLE_ID = "tbl4sVuVCiDCyXF3O";
const AIRTABLE_TOKEN    = "patppMWHKbx68aeNP.8d37f524addbaf4997c863c9682c7da9932bb0927727dade5272a72157835ea4";

// ─── FETCH ───────────────────────────────────────────────────────────────────
async function fetchAllRecords() {
  let records = [], offset = null;
  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`);
    url.searchParams.set("pageSize","100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url.toString(), { headers:{ Authorization:`Bearer ${AIRTABLE_TOKEN}` }});
    if (!res.ok) throw new Error("Failed to fetch data");
    const data = await res.json();
    records = [...records, ...data.records];
    offset = data.offset || null;
  } while (offset);
  return records;
}

function processRecords(raw) {
  return raw.map(r => ({
    id:          r.id,
    staffName:   r.fields["Staff Name"] || "",
    date:        r.fields["Date"] || "",
    taskName:    r.fields["Task Name"] || "",
    category:    r.fields["Category"] || "",
    taskHours:   Number(r.fields["Task Hours"]||0),
    taskMinutes: Number(r.fields["Task Minutes"]||0),
    totalMins:   Number(r.fields["Total Minutes"]||0),
    notes:       r.fields["Task Notes"] || "",
    weekNumber:  Number(r.fields["Week Number"]||0),
    submittedAt: r.fields["Shift Submitted At"] || "",
  })).filter(r => r.staffName && r.date);
}

// ─── DATE HELPERS ────────────────────────────────────────────────────────────
function getWeekNumber(dateStr) {
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  d.setDate(d.getDate()+4-(d.getDay()||7));
  const y = new Date(d.getFullYear(),0,1);
  return Math.ceil((((d-y)/86400000)+1)/7);
}
function currentWeekNum() { return getWeekNumber(new Date().toISOString().split("T")[0]); }
function lastWeekNum()    { const d=new Date(); d.setDate(d.getDate()-7); return getWeekNumber(d.toISOString().split("T")[0]); }
function getExpectedWorkDays(days=30) {
  const result=[];
  const today=new Date();
  for(let i=1;i<=days;i++){
    const d=new Date(today); d.setDate(today.getDate()-i);
    if(WORK_DAYS.includes(d.getDay())) result.push(d.toISOString().split("T")[0]);
  }
  return result;
}
function fmtMins(mins) {
  if (!mins) return "0m";
  const h = Math.floor(mins/60), m = mins%60;
  return h>0 ? `${h}h ${m>0?m+"m":""}`.trim() : `${m}m`;
}
function pctChange(curr, prev) {
  if (!prev) return null;
  return Math.round(((curr-prev)/prev)*100);
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
function getShiftDates(records) {
  const map={};
  STAFF_NAMES.forEach(n=>map[n]=new Set());
  records.forEach(r=>{ if(map[r.staffName]) map[r.staffName].add(r.date); });
  return map;
}
function shiftTotals(records, staffName) {
  const map={};
  records.filter(r=>r.staffName===staffName).forEach(r=>{ map[r.date]=(map[r.date]||0)+r.totalMins; });
  return map;
}
function taskAvgForStaff(records, staffName, taskName) {
  const vals=records.filter(r=>r.staffName===staffName&&r.taskName===taskName&&r.totalMins>0).map(r=>r.totalMins);
  return vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : null;
}
function teamTaskAvg(records, taskName) {
  const vals=records.filter(r=>r.taskName===taskName&&r.totalMins>0).map(r=>r.totalMins);
  return vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : null;
}
function consistencyScore(records, staffName) {
  const vals=Object.values(shiftTotals(records,staffName));
  if(vals.length<2) return null;
  const mean=vals.reduce((a,b)=>a+b,0)/vals.length;
  const cv=Math.sqrt(vals.reduce((a,b)=>a+Math.pow(b-mean,2),0)/vals.length)/mean;
  return Math.max(0,Math.round((1-Math.min(cv,1))*100));
}
function weeklyMins(records, staffName, weekNum) {
  return records.filter(r=>r.staffName===staffName&&r.weekNumber===weekNum&&r.totalMins>0)
    .reduce((a,r)=>a+r.totalMins,0);
}
function allTasksForStaff(records, staffName) {
  const map={};
  records.filter(r=>r.staffName===staffName&&r.totalMins>0).forEach(r=>{
    if(!map[r.taskName]) map[r.taskName]={task:r.taskName,category:r.category,vals:[],count:0};
    map[r.taskName].vals.push(r.totalMins);
    map[r.taskName].count++;
  });
  return Object.values(map).map(t=>({...t, avg:Math.round(t.vals.reduce((a,b)=>a+b,0)/t.vals.length)}));
}
function bestDayForTask(records, taskName) {
  const byDay={};
  records.filter(r=>r.taskName===taskName&&r.totalMins>0).forEach(r=>{
    const dow=new Date(r.date).getDay();
    if(!byDay[dow]) byDay[dow]=[];
    byDay[dow].push(r.totalMins);
  });
  const avgs=Object.entries(byDay).map(([dow,vals])=>({
    day:DAY_NAMES[dow], avg:Math.round(vals.reduce((a,b)=>a+b,0)/vals.length), count:vals.length
  })).filter(d=>d.count>=1).sort((a,b)=>a.avg-b.avg);
  return avgs[0]||null;
}

// ─── AI SUMMARY GENERATOR ────────────────────────────────────────────────────
function generateSummary(records, expectedDays) {
  const points = [];
  const shiftDateMap = getShiftDates(records);
  const currWk = currentWeekNum(), lastWk = lastWeekNum();

  if (records.length === 0) {
    return [{ type:"info", text:"No data yet. Once staff submit their first shifts, your insights will appear here." }];
  }

  // WoW comparison per staff
  STAFF_NAMES.forEach(name => {
    const curr = weeklyMins(records, name, currWk);
    const prev = weeklyMins(records, name, lastWk);
    const chg  = pctChange(curr, prev);
    if (chg !== null && Math.abs(chg) >= 15) {
      points.push({
        type: chg > 0 ? "good" : "warn",
        text: `${name} logged ${Math.abs(chg)}% ${chg>0?"more":"less"} time this week vs last week (${fmtMins(curr)} vs ${fmtMins(prev)}).`
      });
    }
  });

  // Cross-staff slowest task
  const allTasks = new Set(records.map(r=>r.taskName));
  let worstDiff=0, worstInsight=null;
  allTasks.forEach(task=>{
    const teamAvg = teamTaskAvg(records,task);
    if(!teamAvg) return;
    STAFF_NAMES.forEach(name=>{
      const sa = taskAvgForStaff(records,name,task);
      if(!sa) return;
      const diff = Math.round(((sa-teamAvg)/teamAvg)*100);
      if(diff>worstDiff&&diff>30){ worstDiff=diff; worstInsight={name,task,diff,sa,teamAvg}; }
    });
  });
  if(worstInsight) points.push({ type:"flag", text:`${worstInsight.name} is ${worstInsight.diff}% slower than average on "${worstInsight.task}" — ${worstInsight.sa} mins vs team avg of ${worstInsight.teamAvg} mins.` });

  // Best day for common tasks
  ["Personal Training","Post Office","Till Lift / End of Shift Count"].forEach(task=>{
    const best = bestDayForTask(records, task);
    if(best) points.push({ type:"insight", text:`"${task}" is completed fastest on ${best.day}s — average ${best.avg} mins.` });
  });

  // Missing submissions
  STAFF_NAMES.forEach(name=>{
    const missing = expectedDays.filter(d=>!shiftDateMap[name]?.has(d)).length;
    if(missing>3) points.push({ type:"flag", text:`${name} has ${missing} missing shift submissions in the last 30 days.` });
  });

  // Most consistent
  const scores = STAFF_NAMES.map(n=>({ name:n, score:consistencyScore(records,n)||0 })).sort((a,b)=>b.score-a.score);
  if(scores[0].score>75) points.push({ type:"good", text:`${scores[0].name} is your most consistent staff member with a reliability score of ${scores[0].score}/100.` });

  if(points.length===0) points.push({ type:"info", text:"Keep collecting data — more detailed insights will appear as more shifts are submitted." });
  return points;
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
function Badge({ label, type="neutral" }) {
  const styles = {
    good:    { bg:T.greenLight, color:T.green },
    warn:    { bg:T.amberLight, color:T.amber },
    flag:    { bg:T.redLight,   color:T.red },
    neutral: { bg:T.accentLight,color:T.accent },
    blue:    { bg:T.blueLight,  color:T.blue },
  };
  const st = styles[type]||styles.neutral;
  return <span style={{ background:st.bg, color:st.color, fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, whiteSpace:"nowrap" }}>{label}</span>;
}

function ChangeChip({ pct }) {
  if (pct===null||pct===undefined) return <span style={{ fontSize:12,color:T.textMuted }}>—</span>;
  const up = pct>=0;
  return <span style={{ fontSize:12,fontWeight:700,color:up?T.green:T.red }}>{up?"▲":"▼"} {Math.abs(pct)}% WoW</span>;
}

function Card({ children, style, onPress }) {
  return (
    <div onClick={onPress} style={{ background:T.card, borderRadius:16, border:`1px solid ${T.cardBorder}`,
      boxShadow:"0 2px 12px rgba(0,0,0,0.05)", padding:16, ...style, cursor:onPress?"pointer":"default" }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize:11,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:10,marginTop:4 }}>{children}</div>;
}

function InsightRow({ item }) {
  const icon = { good:"✅", warn:"⚠️", flag:"🚨", insight:"💡", info:"📊" }[item.type]||"•";
  const color = { good:T.green, warn:T.amber, flag:T.red, insight:T.blue, info:T.textSub }[item.type]||T.textSub;
  return (
    <div style={{ display:"flex",gap:10,padding:"12px 0",borderBottom:`1px solid ${T.divider}` }}>
      <span style={{ fontSize:18,flexShrink:0 }}>{icon}</span>
      <p style={{ margin:0,fontSize:14,color,lineHeight:1.6,fontWeight:500 }}>{item.text}</p>
    </div>
  );
}

function StaffAvatar({ name, size=36 }) {
  return (
    <div style={{ width:size,height:size,borderRadius:"50%",background:STAFF_COLORS[name]||T.accent,
      color:"#fff",fontWeight:800,fontSize:size*0.35,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
      {name.slice(0,2).toUpperCase()}
    </div>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = max>0 ? Math.min((value/max)*100,100) : 0;
  return (
    <div style={{ height:6,background:T.divider,borderRadius:99,overflow:"hidden" }}>
      <div style={{ height:"100%",width:`${pct}%`,background:color,borderRadius:99,transition:"width 0.5s" }}/>
    </div>
  );
}

// ─── SCREENS ─────────────────────────────────────────────────────────────────

// HOME SCREEN
function HomeScreen({ records, onNavigate, expectedDays }) {
  const shiftDateMap = getShiftDates(records);
  const today = new Date().toISOString().split("T")[0];
  const todayDow = new Date().getDay();
  const isWorkDay = WORK_DAYS.includes(todayDow);
  const currWk = currentWeekNum(), lastWk = lastWeekNum();
  const summary = useMemo(()=>generateSummary(records,expectedDays),[records]);

  // Missing today
  const missingToday = isWorkDay ? STAFF_NAMES.filter(n=>!shiftDateMap[n]?.has(today)) : [];

  // Weekly totals
  const weekStats = STAFF_NAMES.map(name=>{
    const curr = weeklyMins(records,name,currWk);
    const prev = weeklyMins(records,name,lastWk);
    return { name, curr, prev, chg: pctChange(curr,prev) };
  });
  const teamCurrTotal = weekStats.reduce((a,b)=>a+b.curr,0);
  const teamPrevTotal = weekStats.reduce((a,b)=>a+b.prev,0);

  return (
    <div style={{ padding:"0 16px 100px" }}>

      {/* ── MISSING ALERT ── */}
      {missingToday.length > 0 && (
        <div style={{ background:T.redLight,border:`1px solid #FECACA`,borderRadius:14,padding:"14px 16px",marginBottom:14 }}>
          <div style={{ fontWeight:800,fontSize:14,color:T.red,marginBottom:6 }}>🚨 Not Submitted Today</div>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            {missingToday.map(n=>(
              <div key={n} style={{ display:"flex",alignItems:"center",gap:6 }}>
                <StaffAvatar name={n} size={24}/>
                <span style={{ fontSize:13,fontWeight:700,color:T.red }}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── THIS WEEK HEADER ── */}
      <SectionLabel>This Week · W{currWk}</SectionLabel>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
        <Card>
          <div style={{ fontSize:11,fontWeight:700,color:T.textMuted,marginBottom:4 }}>TEAM HOURS</div>
          <div style={{ fontSize:26,fontWeight:800,color:T.text }}>{fmtMins(teamCurrTotal)}</div>
          <ChangeChip pct={pctChange(teamCurrTotal,teamPrevTotal)}/>
        </Card>
        <Card>
          <div style={{ fontSize:11,fontWeight:700,color:T.textMuted,marginBottom:4 }}>SUBMISSIONS</div>
          <div style={{ fontSize:26,fontWeight:800,color:T.text }}>
            {STAFF_NAMES.filter(n=>shiftDateMap[n]?.has(today)).length}<span style={{ fontSize:16,color:T.textMuted }}>/{STAFF_NAMES.length}</span>
          </div>
          <div style={{ fontSize:12,color:T.textMuted }}>today</div>
        </Card>
      </div>

      {/* ── STAFF CARDS ── */}
      <SectionLabel>Staff This Week</SectionLabel>
      {weekStats.map(({ name, curr, prev, chg }) => {
        const consistency = consistencyScore(records,name);
        const missing30 = expectedDays.filter(d=>!shiftDateMap[name]?.has(d)).length;
        const submittedToday = shiftDateMap[name]?.has(today);
        return (
          <Card key={name} style={{ marginBottom:10 }} onPress={()=>onNavigate("staff",name)}>
            <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
              <StaffAvatar name={name} size={44}/>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontSize:16,fontWeight:800,color:T.text }}>{name}</span>
                  <Badge label={STAFF_SHIFTS[name]} type="neutral"/>
                  {!submittedToday&&isWorkDay&&<Badge label="Not in" type="flag"/>}
                  {submittedToday&&<Badge label="✓ Today" type="good"/>}
                </div>
                <div style={{ fontSize:12,color:T.textMuted,marginTop:2 }}>
                  {consistency!==null?`${consistency}/100 consistency · `:""}
                  {missing30>0?<span style={{ color:T.red }}>{missing30} missing</span>:"All shifts logged"}
                </div>
              </div>
              <span style={{ fontSize:20,color:T.textMuted }}>›</span>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
              <div>
                <div style={{ fontSize:11,color:T.textMuted,fontWeight:600 }}>THIS WEEK</div>
                <div style={{ fontSize:18,fontWeight:800,color:STAFF_COLORS[name] }}>{fmtMins(curr)||"—"}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11,color:T.textMuted,fontWeight:600 }}>LAST WEEK</div>
                <div style={{ fontSize:18,fontWeight:800,color:T.textSub }}>{fmtMins(prev)||"—"}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11,color:T.textMuted,fontWeight:600 }}>CHANGE</div>
                <ChangeChip pct={chg}/>
              </div>
            </div>
            <ProgressBar value={curr} max={Math.max(teamCurrTotal/STAFF_NAMES.length*1.5,360)} color={STAFF_COLORS[name]}/>
          </Card>
        );
      })}

      {/* ── AI SUMMARY ── */}
      <SectionLabel>Intelligence Summary</SectionLabel>
      <Card style={{ marginBottom:14 }}>
        {summary.map((item,i)=><InsightRow key={i} item={item}/>)}
        {summary.length===0&&<p style={{ color:T.textMuted,fontSize:14,margin:0 }}>Collecting data...</p>}
      </Card>

      {/* ── WEEK ON WEEK CHART ── */}
      {weekStats.some(s=>s.curr>0||s.prev>0) && (
        <>
          <SectionLabel>Week-on-Week Comparison</SectionLabel>
          <Card style={{ marginBottom:14, padding:"16px 8px 8px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekStats.map(s=>({ name:s.name, "This Week":Math.round(s.curr/60*10)/10, "Last Week":Math.round(s.prev/60*10)/10 }))}
                margin={{ left:0,right:8,top:4,bottom:8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.divider}/>
                <XAxis dataKey="name" tick={{ fontSize:12,fill:T.textSub,fontWeight:700 }}/>
                <YAxis tick={{ fontSize:11,fill:T.textMuted }} width={28}/>
                <Tooltip formatter={v=>[`${v}h`]} contentStyle={{ borderRadius:12,border:`1px solid ${T.cardBorder}`,fontSize:13 }}/>
                <Legend wrapperStyle={{ fontSize:12 }}/>
                <Bar dataKey="This Week" radius={[6,6,0,0]}>
                  {weekStats.map(s=><Cell key={s.name} fill={STAFF_COLORS[s.name]}/>)}
                </Bar>
                <Bar dataKey="Last Week" fill="#E5E7EB" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  );
}

// STAFF DETAIL SCREEN
function StaffScreen({ staffName, records, onNavigate, expectedDays }) {
  const [activeTab, setActiveTab] = useState("overview");
  const color = STAFF_COLORS[staffName];
  const staffRecords = records.filter(r=>r.staffName===staffName);
  const currWk = currentWeekNum(), lastWk = lastWeekNum();
  const curr = weeklyMins(records,staffName,currWk);
  const prev = weeklyMins(records,staffName,lastWk);
  const shiftDateMap = getShiftDates(records);
  const missing30 = expectedDays.filter(d=>!shiftDateMap[staffName]?.has(d));
  const consistency = consistencyScore(records,staffName);
  const today = new Date().toISOString().split("T")[0];
  const submittedToday = shiftDateMap[staffName]?.has(today);

  // All-time avg shift
  const shiftMap = shiftTotals(records,staffName);
  const shiftVals = Object.values(shiftMap);
  const avgShiftMins = shiftVals.length ? Math.round(shiftVals.reduce((a,b)=>a+b,0)/shiftVals.length) : 0;

  // Tasks with comparison
  const myTasks = allTasksForStaff(staffRecords,staffName);
  const tasksWithDiff = myTasks.map(t=>{
    const teamAvg = teamTaskAvg(records,t.task);
    const diff = teamAvg ? Math.round(((t.avg-teamAvg)/teamAvg)*100) : 0;
    return { ...t, teamAvg, diff };
  }).sort((a,b)=>b.diff-a.diff);

  // Weekly trend
  const weekTrend = useMemo(()=>{
    const weeks = new Set(records.filter(r=>r.staffName===staffName).map(r=>`W${r.weekNumber}`));
    return [...weeks].sort().map(wk=>{
      const wnum = parseInt(wk.replace("W",""));
      const mins = weeklyMins(records,staffName,wnum);
      return { week:wk, hours:Math.round(mins/60*10)/10 };
    });
  },[records,staffName]);

  // Category breakdown
  const catBreakdown = useMemo(()=>{
    const map={};
    staffRecords.filter(r=>r.totalMins>0).forEach(r=>{ map[r.category]=(map[r.category]||0)+r.totalMins; });
    const total = Object.values(map).reduce((a,b)=>a+b,0);
    return Object.entries(map).map(([cat,mins])=>({ cat, mins, pct:Math.round((mins/total)*100) })).sort((a,b)=>b.mins-a.mins);
  },[staffRecords]);

  // Best days per task
  const taskDayInsights = useMemo(()=>{
    const tasks = ["Personal Training","Post Office","Crisp Stacking","Serving"];
    return tasks.map(task=>({ task, best:bestDayForTask(staffRecords,task) })).filter(t=>t.best);
  },[staffRecords]);

  const tabs = ["overview","tasks","trends","insights"];

  return (
    <div style={{ padding:"0 16px 100px" }}>
      {/* Staff hero card */}
      <Card style={{ marginBottom:14 }}>
        <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:14 }}>
          <StaffAvatar name={staffName} size={52}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20,fontWeight:800,color:T.text }}>{staffName}</div>
            <div style={{ display:"flex",gap:6,marginTop:4,flexWrap:"wrap" }}>
              <Badge label={STAFF_SHIFTS[staffName]} type="neutral"/>
              {submittedToday?<Badge label="✓ Submitted Today" type="good"/>:<Badge label="Not submitted today" type="flag"/>}
            </div>
          </div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
          {[
            { label:"THIS WEEK", value:fmtMins(curr)||"—", sub:<ChangeChip pct={pctChange(curr,prev)}/> },
            { label:"AVG SHIFT", value:fmtMins(avgShiftMins)||"—", sub:"all time" },
            { label:"CONSISTENCY", value:consistency!==null?`${consistency}/100`:"—", sub:"reliability" },
          ].map(stat=>(
            <div key={stat.label} style={{ background:T.bg,borderRadius:12,padding:"10px 8px" }}>
              <div style={{ fontSize:10,fontWeight:700,color:T.textMuted,marginBottom:4 }}>{stat.label}</div>
              <div style={{ fontSize:16,fontWeight:800,color:color }}>{stat.value}</div>
              <div style={{ fontSize:11,color:T.textMuted,marginTop:2 }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:2 }}>
        {tabs.map(tab=>(
          <button key={tab} onClick={()=>setActiveTab(tab)} style={{
            background:activeTab===tab?color:T.card,
            color:activeTab===tab?"#fff":T.textSub,
            border:`1px solid ${activeTab===tab?color:T.cardBorder}`,
            borderRadius:20, padding:"8px 16px", fontSize:13, fontWeight:700,
            cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
          }}>
            {tab.charAt(0).toUpperCase()+tab.slice(1)}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab==="overview" && (
        <>
          {/* WoW bar */}
          <SectionLabel>This Week vs Last Week</SectionLabel>
          <Card style={{ marginBottom:14 }}>
            {[{ label:"This Week", val:curr, color }, { label:"Last Week", val:prev, color:"#E5E7EB" }].map(row=>(
              <div key={row.label} style={{ marginBottom:10 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontSize:13,fontWeight:600,color:T.textSub }}>{row.label}</span>
                  <span style={{ fontSize:13,fontWeight:800,color:T.text }}>{fmtMins(row.val)||"0m"}</span>
                </div>
                <ProgressBar value={row.val} max={Math.max(curr,prev,1)} color={row.color}/>
              </div>
            ))}
            <div style={{ marginTop:8,display:"flex",justifyContent:"flex-end" }}>
              <ChangeChip pct={pctChange(curr,prev)}/>
            </div>
          </Card>

          {/* Category breakdown */}
          <SectionLabel>Time by Category</SectionLabel>
          <Card style={{ marginBottom:14 }}>
            {catBreakdown.map(c=>(
              <div key={c.cat} style={{ marginBottom:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontSize:13,fontWeight:600,color:T.textSub }}>{c.cat}</span>
                  <span style={{ fontSize:13,fontWeight:700,color:T.text }}>{fmtMins(c.mins)} <span style={{ color:T.textMuted,fontWeight:400 }}>({c.pct}%)</span></span>
                </div>
                <ProgressBar value={c.pct} max={100} color={color}/>
              </div>
            ))}
            {catBreakdown.length===0&&<p style={{ color:T.textMuted,fontSize:14,margin:0 }}>No data yet.</p>}
          </Card>

          {/* Missing submissions */}
          {missing30.length>0&&(
            <>
              <SectionLabel>Missing Submissions · Last 30 Days</SectionLabel>
              <Card style={{ marginBottom:14 }}>
                <div style={{ fontSize:22,fontWeight:800,color:T.red,marginBottom:8 }}>{missing30.length} <span style={{ fontSize:14,color:T.textMuted,fontWeight:400 }}>missing shifts</span></div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                  {missing30.slice(0,8).map(d=>(
                    <span key={d} style={{ background:T.redLight,color:T.red,fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:20 }}>
                      {new Date(d).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}
                    </span>
                  ))}
                  {missing30.length>8&&<span style={{ fontSize:12,color:T.textMuted,padding:"4px 8px" }}>+{missing30.length-8} more</span>}
                </div>
              </Card>
            </>
          )}
        </>
      )}

      {/* TASKS TAB */}
      {activeTab==="tasks" && (
        <>
          <SectionLabel>All Tasks · Tap to Drill Down</SectionLabel>
          {tasksWithDiff.map((t,idx)=>(
            <Card key={t.task} style={{ marginBottom:8 }} onPress={()=>onNavigate("task",{ task:t.task, staffName })}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14,fontWeight:700,color:T.text }}>{t.task}</div>
                  <div style={{ fontSize:12,color:T.textMuted }}>{t.category} · {t.count} sessions</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:16,fontWeight:800,color:t.diff>20?T.red:t.diff<-20?T.green:T.text }}>{t.avg}m</div>
                  {t.teamAvg&&<div style={{ fontSize:11,color:T.textMuted }}>avg {t.teamAvg}m</div>}
                </div>
                {t.diff!==0&&(
                  <Badge label={`${t.diff>0?"+":""}${t.diff}%`} type={t.diff>20?"flag":t.diff<-20?"good":"neutral"}/>
                )}
                <span style={{ fontSize:16,color:T.textMuted,marginLeft:2 }}>›</span>
              </div>
            </Card>
          ))}
          {tasksWithDiff.length===0&&<p style={{ color:T.textMuted,fontSize:14,textAlign:"center",padding:"32px 0" }}>No tasks logged yet.</p>}
        </>
      )}

      {/* TRENDS TAB */}
      {activeTab==="trends" && (
        <>
          {weekTrend.length>1&&(
            <>
              <SectionLabel>Weekly Hours Trend</SectionLabel>
              <Card style={{ marginBottom:14, padding:"16px 8px 8px" }}>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weekTrend} margin={{ left:0,right:8,top:4,bottom:8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.divider}/>
                    <XAxis dataKey="week" tick={{ fontSize:11,fill:T.textMuted }}/>
                    <YAxis tick={{ fontSize:11,fill:T.textMuted }} width={28}/>
                    <Tooltip formatter={v=>[`${v}h`]} contentStyle={{ borderRadius:12,border:`1px solid ${T.cardBorder}`,fontSize:13 }}/>
                    <Line type="monotone" dataKey="hours" stroke={color} strokeWidth={3} dot={{ fill:color,r:4 }}/>
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </>
          )}

          {tasksWithDiff.length>0&&(
            <>
              <SectionLabel>Task Time vs Team Average</SectionLabel>
              <Card style={{ marginBottom:14, padding:"16px 8px 8px" }}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={tasksWithDiff.slice(0,8).map(t=>({ task:t.task.length>14?t.task.slice(0,13)+"…":t.task, [staffName]:t.avg, "Team":t.teamAvg||t.avg }))}
                    margin={{ left:0,right:8,top:4,bottom:60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.divider}/>
                    <XAxis dataKey="task" tick={{ fontSize:10,fill:T.textMuted }} angle={-35} textAnchor="end" interval={0}/>
                    <YAxis tick={{ fontSize:11,fill:T.textMuted }} width={28}/>
                    <Tooltip contentStyle={{ borderRadius:12,border:`1px solid ${T.cardBorder}`,fontSize:13 }}/>
                    <Legend wrapperStyle={{ fontSize:12,paddingTop:8 }}/>
                    <Bar dataKey={staffName} fill={color} radius={[6,6,0,0]}/>
                    <Bar dataKey="Team" fill="#E5E7EB" radius={[6,6,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </>
          )}

          {/* Recent shifts */}
          <SectionLabel>Recent Shifts</SectionLabel>
          <Card>
            {Object.entries(shiftMap).sort(([a],[b])=>b.localeCompare(a)).slice(0,10).map(([date,mins],idx)=>(
              <div key={date} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"12px 0",borderTop:idx===0?"none":`1px solid ${T.divider}` }}>
                <span style={{ fontSize:14,color:T.textSub }}>
                  {new Date(date).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}
                </span>
                <span style={{ fontSize:14,fontWeight:700,color:mins>=300?T.green:mins>=180?color:T.red }}>
                  {fmtMins(mins)}
                </span>
              </div>
            ))}
            {Object.keys(shiftMap).length===0&&<p style={{ color:T.textMuted,fontSize:14,margin:0 }}>No shifts yet.</p>}
          </Card>
        </>
      )}

      {/* INSIGHTS TAB */}
      {activeTab==="insights" && (
        <>
          <SectionLabel>Best Days for Tasks</SectionLabel>
          <Card style={{ marginBottom:14 }}>
            {taskDayInsights.length>0
              ? taskDayInsights.map((item,i)=>(
                <div key={item.task} style={{ padding:"12px 0",borderTop:i===0?"none":`1px solid ${T.divider}` }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:14,fontWeight:700,color:T.text }}>{item.task}</div>
                      <div style={{ fontSize:12,color:T.textMuted }}>Fastest on <strong>{item.best.day}s</strong></div>
                    </div>
                    <Badge label={`${item.best.avg}m avg`} type="good"/>
                  </div>
                </div>
              ))
              : <p style={{ color:T.textMuted,fontSize:14,margin:0 }}>More data needed for day insights.</p>
            }
          </Card>

          <SectionLabel>Performance Flags</SectionLabel>
          <Card>
            {tasksWithDiff.filter(t=>Math.abs(t.diff)>15).map((t,i)=>(
              <div key={t.task} style={{ padding:"12px 0",borderTop:i===0?"none":`1px solid ${T.divider}` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:14,fontWeight:700,color:T.text }}>{t.task}</div>
                    <div style={{ fontSize:12,color:T.textMuted }}>{t.count} sessions · team avg {t.teamAvg}m</div>
                  </div>
                  <Badge label={`${t.diff>0?"+":""}${t.diff}%`} type={t.diff>15?"flag":"good"}/>
                </div>
              </div>
            ))}
            {tasksWithDiff.filter(t=>Math.abs(t.diff)>15).length===0&&
              <p style={{ color:T.textMuted,fontSize:14,margin:0 }}>No significant deviations yet.</p>}
          </Card>
        </>
      )}
    </div>
  );
}

// TASK DRILL-DOWN SCREEN
function TaskDrillScreen({ task, staffName, records }) {
  const color = STAFF_COLORS[staffName];
  const staffRecords = records.filter(r=>r.staffName===staffName&&r.taskName===task&&r.totalMins>0);
  const teamAvg = teamTaskAvg(records,task);
  const staffAvg = taskAvgForStaff(records,staffName,task);
  const diff = teamAvg&&staffAvg ? Math.round(((staffAvg-teamAvg)/teamAvg)*100) : null;
  const best = bestDayForTask(records.filter(r=>r.staffName===staffName),task);

  // All staff comparison for this task
  const allStaffAvgs = STAFF_NAMES.map(n=>({ name:n, avg:taskAvgForStaff(records,n,task)||0 })).filter(s=>s.avg>0);

  // Timeline
  const timeline = staffRecords.sort((a,b)=>a.date.localeCompare(b.date)).map(r=>({
    date:new Date(r.date).toLocaleDateString("en-GB",{day:"numeric",month:"short"}),
    mins:r.totalMins,
    notes:r.notes,
  }));

  return (
    <div style={{ padding:"0 16px 100px" }}>
      {/* Task header */}
      <Card style={{ marginBottom:14 }}>
        <div style={{ fontSize:18,fontWeight:800,color:T.text,marginBottom:4 }}>{task}</div>
        <div style={{ fontSize:13,color:T.textMuted,marginBottom:12 }}>{staffName} · {staffRecords.length} sessions logged</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
          {[
            { label:"STAFF AVG", value:staffAvg?`${staffAvg}m`:"—", color },
            { label:"TEAM AVG",  value:teamAvg?`${teamAvg}m`:"—",  color:T.textSub },
            { label:"DIFFERENCE",value:diff!==null?`${diff>0?"+":""}${diff}%`:"—", color:diff>15?T.red:diff<-15?T.green:T.text },
          ].map(s=>(
            <div key={s.label} style={{ background:T.bg,borderRadius:12,padding:"10px 8px",textAlign:"center" }}>
              <div style={{ fontSize:10,fontWeight:700,color:T.textMuted,marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:18,fontWeight:800,color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Staff comparison */}
      {allStaffAvgs.length>1&&(
        <>
          <SectionLabel>All Staff Comparison</SectionLabel>
          <Card style={{ marginBottom:14, padding:"16px 8px 8px" }}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={allStaffAvgs} margin={{ left:0,right:8,top:4,bottom:8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.divider}/>
                <XAxis dataKey="name" tick={{ fontSize:12,fill:T.textSub,fontWeight:700 }}/>
                <YAxis tick={{ fontSize:11,fill:T.textMuted }} width={28}/>
                <Tooltip formatter={v=>[`${v} mins`]} contentStyle={{ borderRadius:12,border:`1px solid ${T.cardBorder}`,fontSize:13 }}/>
                <Bar dataKey="avg" radius={[6,6,0,0]}>
                  {allStaffAvgs.map(s=><Cell key={s.name} fill={STAFF_COLORS[s.name]||T.accent}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {/* Best day */}
      {best&&(
        <>
          <SectionLabel>Best Day</SectionLabel>
          <Card style={{ marginBottom:14 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ fontSize:16,fontWeight:800,color:T.text }}>{best.day}s are fastest</div>
                <div style={{ fontSize:13,color:T.textMuted }}>Average {best.avg} mins on {best.day}s</div>
              </div>
              <Badge label="Optimal day" type="good"/>
            </div>
          </Card>
        </>
      )}

      {/* Timeline */}
      {timeline.length>0&&(
        <>
          <SectionLabel>Session History</SectionLabel>
          <Card style={{ marginBottom:14, padding:"16px 8px 8px" }}>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={timeline} margin={{ left:0,right:8,top:4,bottom:8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.divider}/>
                <XAxis dataKey="date" tick={{ fontSize:10,fill:T.textMuted }}/>
                <YAxis tick={{ fontSize:11,fill:T.textMuted }} width={28}/>
                <Tooltip formatter={v=>[`${v} mins`]} contentStyle={{ borderRadius:12,border:`1px solid ${T.cardBorder}`,fontSize:13 }}/>
                <Line type="monotone" dataKey="mins" stroke={color} strokeWidth={2.5} dot={{ fill:color,r:3 }}/>
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            {timeline.slice(-8).reverse().map((t,i)=>(
              <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"11px 0",borderTop:i===0?"none":`1px solid ${T.divider}` }}>
                <span style={{ fontSize:13,color:T.textSub }}>{t.date}</span>
                <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                  {t.notes&&<span style={{ fontSize:12,color:T.textMuted,fontStyle:"italic" }}>"{t.notes}"</span>}
                  <span style={{ fontSize:14,fontWeight:700,color:t.mins>=(teamAvg||0)*1.3?T.red:T.green }}>{t.mins}m</span>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Navigation: { screen: "home"|"staff"|"task", staffName, task }
  const [nav, setNav] = useState({ screen:"home" });

  const expectedDays = useMemo(()=>getExpectedWorkDays(30),[]);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const raw = await fetchAllRecords();
      setRecords(processRecords(raw));
      setLastRefresh(new Date());
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ loadData(); },[]);

  function navigate(screen, data) {
    if (screen==="staff") setNav({ screen:"staff", staffName:data });
    else if (screen==="task") setNav({ screen:"task", staffName:data.staffName, task:data.task });
    else setNav({ screen:"home" });
    window.scrollTo(0,0);
  }

  const today = new Date().toLocaleDateString("en-GB",{ weekday:"long",day:"numeric",month:"long" });
  const shiftDateMap = useMemo(()=>getShiftDates(records),[records]);
  const todayStr = new Date().toISOString().split("T")[0];
  const missingCount = WORK_DAYS.includes(new Date().getDay())
    ? STAFF_NAMES.filter(n=>!shiftDateMap[n]?.has(todayStr)).length : 0;

  return (
    <div style={{ background:T.bg, minHeight:"100vh", fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif", maxWidth:480, margin:"0 auto" }}>

      {/* ── TOP BAR ── */}
      <div style={{ background:T.card, borderBottom:`1px solid ${T.cardBorder}`, position:"sticky", top:0, zIndex:20,
        boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            {nav.screen!=="home"&&(
              <button onClick={()=>{ if(nav.screen==="task") navigate("staff",nav.staffName); else navigate("home"); }}
                style={{ background:"none",border:"none",fontSize:20,cursor:"pointer",color:T.text,padding:"0 4px 0 0" }}>←</button>
            )}
            <div style={{ width:32,height:32,background:"#111",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>⚡</div>
            <div>
              <div style={{ fontSize:15,fontWeight:800,color:T.text,letterSpacing:-0.3 }}>
                {nav.screen==="home"?"StaffLog":nav.screen==="staff"?nav.staffName:nav.task?.length>20?nav.task?.slice(0,19)+"…":nav.task}
              </div>
              <div style={{ fontSize:11,color:T.textMuted }}>
                {nav.screen==="home"?today:nav.screen==="staff"?STAFF_SHIFTS[nav.staffName]+" shift":nav.staffName}
              </div>
            </div>
          </div>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            {missingCount>0&&nav.screen==="home"&&(
              <Badge label={`${missingCount} missing`} type="flag"/>
            )}
            <button onClick={loadData} disabled={loading} style={{ background:T.bg,border:`1px solid ${T.cardBorder}`,borderRadius:10,
              padding:"6px 12px",fontSize:12,fontWeight:700,color:T.textSub,cursor:"pointer" }}>
              {loading?"…":"↻"}
            </button>
          </div>
        </div>

        {/* Staff quick-nav pills (home only) */}
        {nav.screen==="home"&&(
          <div style={{ display:"flex",gap:8,padding:"0 16px 12px",overflowX:"auto" }}>
            {STAFF_NAMES.map(name=>{
              const submitted = shiftDateMap[name]?.has(todayStr);
              return (
                <button key={name} onClick={()=>navigate("staff",name)} style={{
                  display:"flex",alignItems:"center",gap:6,
                  background:submitted?T.greenLight:T.redLight,
                  border:`1px solid ${submitted?"#BBF7D0":"#FECACA"}`,
                  borderRadius:20, padding:"6px 12px", cursor:"pointer", flexShrink:0,
                }}>
                  <div style={{ width:8,height:8,borderRadius:"50%",background:submitted?T.green:T.red }}/>
                  <span style={{ fontSize:13,fontWeight:700,color:T.text }}>{name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ paddingTop:12 }}>
        {loading&&records.length===0 ? (
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"80px 0" }}>
            <div style={{ width:36,height:36,borderRadius:"50%",border:`3px solid ${T.divider}`,
              borderTop:`3px solid ${T.accent}`,animation:"spin 0.8s linear infinite" }}/>
            <p style={{ color:T.textMuted,marginTop:16,fontSize:15 }}>Loading staff data...</p>
          </div>
        ) : error ? (
          <div style={{ margin:16,background:T.redLight,border:`1px solid #FECACA`,borderRadius:14,padding:20,color:T.red,fontSize:14 }}>
            ⚠️ {error}
            <button onClick={loadData} style={{ marginLeft:12,background:"none",border:`1px solid ${T.red}`,
              color:T.red,borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:13 }}>Retry</button>
          </div>
        ) : nav.screen==="home" ? (
          <HomeScreen records={records} onNavigate={navigate} expectedDays={expectedDays}/>
        ) : nav.screen==="staff" ? (
          <StaffScreen staffName={nav.staffName} records={records} onNavigate={navigate} expectedDays={expectedDays}/>
        ) : nav.screen==="task" ? (
          <TaskDrillScreen task={nav.task} staffName={nav.staffName} records={records}/>
        ) : null}
      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg); } } * { box-sizing:border-box; } body { margin:0; } ::-webkit-scrollbar { display:none; }`}</style>
    </div>
  );
}
