import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis
} from "recharts";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const AIRTABLE_BASE_ID  = "app6DROW7O9mZnmTY";
const AIRTABLE_TABLE_ID = "tbl4sVuVCiDCyXF3O";
const AIRTABLE_TOKEN    = "patppMWHKbx68aeNP.8d37f524addbaf4997c863c9682c7da9932bb0927727dade5272a72157835ea4";

const STAFF_NAMES   = ["Michelle", "Alyson", "Susan"];
const STAFF_SHIFTS  = { Michelle: "Morning", Alyson: "Morning", Susan: "Evening" };

const COLORS = {
  Michelle: "#E07B39",
  Alyson:   "#3B82F6",
  Susan:    "#8B5CF6",
  average:  "#9ca3af",
};

const BRAND = "#E07B39";

// Days of the week to check for missing submissions (Mon–Sat)
const WORK_DAYS = [1, 2, 3, 4, 5, 6];

// ─── AIRTABLE FETCH ──────────────────────────────────────────────────────────
async function fetchAllRecords() {
  let records = [];
  let offset = null;
  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    });
    if (!res.ok) throw new Error("Failed to fetch Airtable data");
    const data = await res.json();
    records = [...records, ...data.records];
    offset = data.offset || null;
  } while (offset);
  return records;
}

// ─── DATA PROCESSING ─────────────────────────────────────────────────────────
function processRecords(rawRecords) {
  return rawRecords.map(r => ({
    id:          r.id,
    staffName:   r.fields["Staff Name"] || "",
    date:        r.fields["Date"] || "",
    taskName:    r.fields["Task Name"] || "",
    category:    r.fields["Category"] || "",
    taskHours:   Number(r.fields["Task Hours"] || 0),
    taskMinutes: Number(r.fields["Task Minutes"] || 0),
    totalMins:   Number(r.fields["Total Minutes"] || 0),
    notes:       r.fields["Task Notes"] || "",
    weekNumber:  Number(r.fields["Week Number"] || 0),
    submittedAt: r.fields["Shift Submitted At"] || "",
  })).filter(r => r.staffName && r.date);
}

// Get unique shift dates per staff member
function getShiftDates(records) {
  const map = {};
  STAFF_NAMES.forEach(n => map[n] = new Set());
  records.forEach(r => { if (map[r.staffName]) map[r.staffName].add(r.date); });
  return map;
}

// Get all working days (Mon–Sat) in the past N days
function getExpectedWorkDays(days = 30) {
  const result = [];
  const today = new Date();
  for (let i = 1; i <= days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (WORK_DAYS.includes(d.getDay())) {
      result.push(d.toISOString().split("T")[0]);
    }
  }
  return result;
}

// Average minutes for a task across all staff
function taskAverages(records) {
  const map = {};
  records.forEach(r => {
    if (!map[r.taskName]) map[r.taskName] = [];
    if (r.totalMins > 0) map[r.taskName].push(r.totalMins);
  });
  const avgs = {};
  Object.entries(map).forEach(([task, vals]) => {
    avgs[task] = Math.round(vals.reduce((a,b)=>a+b,0) / vals.length);
  });
  return avgs;
}

// Per-staff average for a task
function staffTaskAvg(records, staffName, taskName) {
  const vals = records.filter(r => r.staffName===staffName && r.taskName===taskName && r.totalMins>0).map(r=>r.totalMins);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
}

// Total mins per shift date for a staff member
function shiftTotals(records, staffName) {
  const map = {};
  records.filter(r=>r.staffName===staffName).forEach(r => {
    map[r.date] = (map[r.date]||0) + r.totalMins;
  });
  return map;
}

// Weekly hours logged
function weeklyHours(records, staffName) {
  const map = {};
  records.filter(r=>r.staffName===staffName && r.totalMins>0).forEach(r => {
    const wk = `W${r.weekNumber}`;
    map[wk] = (map[wk]||0) + r.totalMins;
  });
  return Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).map(([week,mins])=>({
    week, hours: Math.round((mins/60)*10)/10
  }));
}

// Category breakdown for a staff member
function categoryBreakdown(records, staffName) {
  const map = {};
  records.filter(r=>r.staffName===staffName && r.totalMins>0).forEach(r => {
    map[r.category] = (map[r.category]||0) + r.totalMins;
  });
  return Object.entries(map).map(([cat,mins])=>({ category:cat, minutes:mins, hours: Math.round((mins/60)*10)/10 }))
    .sort((a,b)=>b.minutes-a.minutes);
}

// Slowest tasks for a staff member vs team average
function slowestTasks(records, staffName, teamAvgs) {
  const staffTasks = {};
  records.filter(r=>r.staffName===staffName && r.totalMins>0).forEach(r=>{
    if (!staffTasks[r.taskName]) staffTasks[r.taskName]=[];
    staffTasks[r.taskName].push(r.totalMins);
  });
  return Object.entries(staffTasks)
    .map(([task,vals])=>{
      const avg = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
      const teamAvg = teamAvgs[task];
      const diff = teamAvg ? Math.round(((avg-teamAvg)/teamAvg)*100) : 0;
      return { task, staffAvg:avg, teamAvg:teamAvg||avg, diff, count:vals.length };
    })
    .filter(t=>t.count>=2)
    .sort((a,b)=>b.diff-a.diff);
}

// Consistency score: lower variance = more consistent (0–100)
function consistencyScore(records, staffName) {
  const totals = Object.values(shiftTotals(records, staffName));
  if (totals.length < 2) return null;
  const mean = totals.reduce((a,b)=>a+b,0)/totals.length;
  const variance = totals.reduce((a,b)=>a+Math.pow(b-mean,2),0)/totals.length;
  const cv = Math.sqrt(variance)/mean; // coefficient of variation
  return Math.max(0, Math.round((1 - Math.min(cv, 1)) * 100));
}

// ─── AI INSIGHT GENERATOR ────────────────────────────────────────────────────
function generateInsights(records, staffName, teamAvgs, allRecords) {
  const insights = [];
  const slow = slowestTasks(records, staffName, teamAvgs).slice(0, 5);
  const fast = slowestTasks(records, staffName, teamAvgs).filter(t=>t.diff<-15).slice(0, 3);
  const consistency = consistencyScore(allRecords, staffName);
  const shifts = Object.keys(shiftTotals(allRecords, staffName));
  const totalShifts = shifts.length;
  const avgShiftMins = totalShifts > 0
    ? Object.values(shiftTotals(allRecords, staffName)).reduce((a,b)=>a+b,0)/totalShifts
    : 0;

  // Compare to other staff avg shift time
  const otherStaff = STAFF_NAMES.filter(n=>n!==staffName);
  const otherAvgShifts = otherStaff.map(n=>{
    const s = shiftTotals(allRecords, n);
    const vals = Object.values(s);
    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
  }).filter(v=>v>0);
  const teamShiftAvg = otherAvgShifts.length
    ? otherAvgShifts.reduce((a,b)=>a+b,0)/otherAvgShifts.length : 0;
  const shiftDiff = teamShiftAvg > 0 ? Math.round(((avgShiftMins-teamShiftAvg)/teamShiftAvg)*100) : 0;

  if (totalShifts === 0) {
    insights.push({ type:"info", icon:"📭", text:`No shift data yet for ${staffName}. Once they start submitting, insights will appear here.` });
    return insights;
  }

  // Shift time vs team
  if (shiftDiff > 20) {
    insights.push({ type:"warning", icon:"⏱️", text:`${staffName} logs ${shiftDiff}% more time per shift than the team average — currently averaging ${Math.round(avgShiftMins/60*10)/10}h vs team average of ${Math.round(teamShiftAvg/60*10)/10}h.` });
  } else if (shiftDiff < -20) {
    insights.push({ type:"flag", icon:"⚠️", text:`${staffName} logs significantly less time than the team average (${Math.round(avgShiftMins/60*10)/10}h vs ${Math.round(teamShiftAvg/60*10)/10}h). Check if tasks are being completed fully.` });
  } else {
    insights.push({ type:"good", icon:"✅", text:`${staffName}'s average shift hours (${Math.round(avgShiftMins/60*10)/10}h) are in line with the rest of the team.` });
  }

  // Slowest tasks
  slow.filter(t=>t.diff>25).forEach(t=>{
    insights.push({ type:"warning", icon:"🐢", text:`${staffName} takes ${t.diff}% longer than the team average on "${t.task}" — ${t.staffAvg} mins vs team avg of ${t.teamAvg} mins.` });
  });

  // Fastest tasks
  fast.forEach(t=>{
    insights.push({ type:"good", icon:"⚡", text:`${staffName} is notably quick at "${t.task}" — ${Math.abs(t.diff)}% faster than the team average.` });
  });

  // Consistency
  if (consistency !== null) {
    if (consistency >= 80) {
      insights.push({ type:"good", icon:"📈", text:`${staffName} is highly consistent — scoring ${consistency}/100 for shift-to-shift reliability.` });
    } else if (consistency < 50) {
      insights.push({ type:"flag", icon:"📉", text:`${staffName}'s output varies significantly week to week (consistency score: ${consistency}/100). Worth a conversation to understand why.` });
    }
  }

  if (insights.length === 1 && insights[0].type === "good") {
    insights.push({ type:"info", icon:"💡", text:`Keep collecting data — more shifts logged means more detailed insights will appear here.` });
  }

  return insights;
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function InsightCard({ insight }) {
  const bg = { warning:"#fff7ed", flag:"#fef2f2", good:"#f0fdf4", info:"#eff6ff" }[insight.type] || "#f9fafb";
  const border = { warning:"#fed7aa", flag:"#fecaca", good:"#bbf7d0", info:"#bfdbfe" }[insight.type] || "#e5e7eb";
  const color = { warning:"#c2410c", flag:"#dc2626", good:"#15803d", info:"#1d4ed8" }[insight.type] || "#374151";
  return (
    <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:12, padding:"14px 16px", marginBottom:10 }}>
      <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
        <span style={{ fontSize:20, flexShrink:0 }}>{insight.icon}</span>
        <p style={{ margin:0, fontSize:14, color, lineHeight:1.6, fontWeight:500 }}>{insight.text}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background:"#fff", border:"1px solid #f3f4f6", borderRadius:14, padding:"16px", flex:1, minWidth:0, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800, color:color||"#111", lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:"#9ca3af", marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function MissingBadge({ count }) {
  if (!count) return null;
  return (
    <span style={{ background:"#fef2f2", color:"#dc2626", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20, border:"1px solid #fecaca" }}>
      {count} missing
    </span>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize:16, fontWeight:800, color:"#111", marginBottom:12, marginTop:4 }}>{children}</div>;
}

// ─── STAFF PAGE ───────────────────────────────────────────────────────────────
function StaffPage({ staffName, allRecords, teamAvgs, expectedDays }) {
  const staffRecords = allRecords.filter(r => r.staffName === staffName);
  const shiftDates   = new Set(staffRecords.map(r => r.date));
  const missingDays  = expectedDays.filter(d => !shiftDates.has(d));
  const insights     = generateInsights(staffRecords, staffName, teamAvgs, allRecords);
  const slow         = slowestTasks(staffRecords, staffName, teamAvgs);
  const catData      = categoryBreakdown(staffRecords, staffName);
  const weekData     = weeklyHours(allRecords, staffName);
  const consistency  = consistencyScore(allRecords, staffName);

  // Shift totals for avg
  const shiftMap   = shiftTotals(allRecords, staffName);
  const shiftVals  = Object.values(shiftMap);
  const avgShiftH  = shiftVals.length ? Math.round((shiftVals.reduce((a,b)=>a+b,0)/shiftVals.length)/60*10)/10 : 0;
  const totalShifts = shiftVals.length;

  // Task comparison chart data (top 8 tasks staff has done vs team avg)
  const taskChartData = slow.slice(0, 8).map(t => ({
    task: t.task.length > 16 ? t.task.slice(0,15)+"…" : t.task,
    [staffName]: t.staffAvg,
    "Team Avg": t.teamAvg,
  }));

  // Recent shifts (last 10)
  const recentShifts = Object.entries(shiftMap)
    .sort(([a],[b]) => b.localeCompare(a))
    .slice(0,10)
    .map(([date,mins]) => ({ date, hours: Math.round((mins/60)*10)/10 }));

  return (
    <div>
      {/* Stats row */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <StatCard label="Total Shifts" value={totalShifts} sub="all time" color={COLORS[staffName]}/>
        <StatCard label="Avg Shift" value={`${avgShiftH}h`} sub="per day logged" color={COLORS[staffName]}/>
        <StatCard label="Consistency" value={consistency !== null ? `${consistency}/100` : "—"} sub="shift reliability"/>
        <StatCard label="Missing" value={missingDays.length} sub="last 30 days" color={missingDays.length > 3 ? "#dc2626" : "#111"}/>
      </div>

      {/* Missing shifts */}
      {missingDays.length > 0 && (
        <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, padding:"14px 16px", marginBottom:20 }}>
          <div style={{ fontWeight:700, color:"#dc2626", fontSize:14, marginBottom:6 }}>⚠️ Missing Submissions ({missingDays.length} days)</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {missingDays.slice(0,10).map(d => (
              <span key={d} style={{ background:"#fee2e2", color:"#991b1b", fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:20 }}>
                {new Date(d).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}
              </span>
            ))}
            {missingDays.length > 10 && <span style={{ fontSize:12, color:"#9ca3af", padding:"3px 8px" }}>+{missingDays.length-10} more</span>}
          </div>
        </div>
      )}

      {/* AI Insights */}
      <SectionTitle>🤖 AI Insights</SectionTitle>
      {insights.map((ins,i) => <InsightCard key={i} insight={ins}/>)}

      {/* Task time vs team avg chart */}
      {taskChartData.length > 0 && (
        <div style={{ marginTop:24 }}>
          <SectionTitle>⏱ Task Time vs Team Average (mins)</SectionTitle>
          <div style={{ background:"#fff", borderRadius:14, padding:"16px 8px 8px", border:"1px solid #f3f4f6", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={taskChartData} margin={{ left:0, right:8, top:4, bottom:60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="task" tick={{ fontSize:11, fill:"#6b7280" }} angle={-35} textAnchor="end" interval={0}/>
                <YAxis tick={{ fontSize:11, fill:"#6b7280" }} width={32}/>
                <Tooltip formatter={(v,n) => [`${v} mins`, n]} contentStyle={{ borderRadius:10, border:"1px solid #e5e7eb", fontSize:13 }}/>
                <Legend wrapperStyle={{ fontSize:13, paddingTop:8 }}/>
                <Bar dataKey={staffName} fill={COLORS[staffName]} radius={[6,6,0,0]}/>
                <Bar dataKey="Team Avg" fill="#d1d5db" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Weekly hours trend */}
      {weekData.length > 1 && (
        <div style={{ marginTop:24 }}>
          <SectionTitle>📅 Weekly Hours Logged</SectionTitle>
          <div style={{ background:"#fff", borderRadius:14, padding:"16px 8px 8px", border:"1px solid #f3f4f6", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weekData} margin={{ left:0, right:8, top:4, bottom:8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="week" tick={{ fontSize:11, fill:"#6b7280" }}/>
                <YAxis tick={{ fontSize:11, fill:"#6b7280" }} width={32}/>
                <Tooltip formatter={v=>[`${v}h`,"Hours"]} contentStyle={{ borderRadius:10, border:"1px solid #e5e7eb", fontSize:13 }}/>
                <Line type="monotone" dataKey="hours" stroke={COLORS[staffName]} strokeWidth={3} dot={{ fill:COLORS[staffName], r:4 }} activeDot={{ r:6 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {catData.length > 0 && (
        <div style={{ marginTop:24 }}>
          <SectionTitle>📊 Time by Category</SectionTitle>
          <div style={{ background:"#fff", borderRadius:14, padding:"16px", border:"1px solid #f3f4f6", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
            {catData.map(cat => {
              const pct = Math.round((cat.minutes / catData.reduce((a,b)=>a+b.minutes,0))*100);
              return (
                <div key={cat.category} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{cat.category}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:"#111" }}>{cat.hours}h <span style={{ color:"#9ca3af", fontWeight:400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height:8, background:"#f3f4f6", borderRadius:99, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:COLORS[staffName], borderRadius:99, transition:"width 0.5s" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent shifts table */}
      {recentShifts.length > 0 && (
        <div style={{ marginTop:24 }}>
          <SectionTitle>🗓 Recent Shifts</SectionTitle>
          <div style={{ background:"#fff", borderRadius:14, border:"1px solid #f3f4f6", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
            {recentShifts.map((shift, idx) => (
              <div key={shift.date} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"13px 16px", borderTop: idx===0?"none":"1px solid #f3f4f6",
                background: idx%2===0?"#fff":"#fafafa"
              }}>
                <span style={{ fontSize:14, color:"#374151" }}>
                  {new Date(shift.date).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
                </span>
                <span style={{ fontSize:14, fontWeight:700, color: shift.hours >= 5 ? "#15803d" : shift.hours >= 3 ? COLORS[staffName] : "#dc2626" }}>
                  {shift.hours}h logged
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slowest tasks detail */}
      {slow.filter(t=>t.diff>0).length > 0 && (
        <div style={{ marginTop:24 }}>
          <SectionTitle>🐢 Slower Than Team Average</SectionTitle>
          <div style={{ background:"#fff", borderRadius:14, border:"1px solid #f3f4f6", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
            {slow.filter(t=>t.diff>0).slice(0,8).map((t,idx)=>(
              <div key={t.task} style={{ display:"flex", alignItems:"center", padding:"13px 16px", borderTop:idx===0?"none":"1px solid #f3f4f6", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"#111" }}>{t.task}</div>
                  <div style={{ fontSize:12, color:"#9ca3af" }}>Based on {t.count} sessions</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:14, fontWeight:700, color: t.diff>30?"#dc2626":t.diff>15?"#d97706":"#374151" }}>+{t.diff}%</div>
                  <div style={{ fontSize:12, color:"#9ca3af" }}>{t.staffAvg}m vs {t.teamAvg}m avg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── OVERVIEW PAGE ────────────────────────────────────────────────────────────
function OverviewPage({ allRecords, teamAvgs, expectedDays }) {
  const shiftDates = getShiftDates(allRecords);

  // Staff comparison: avg shift hours
  const staffCompData = STAFF_NAMES.map(name => {
    const vals = Object.values(shiftTotals(allRecords, name));
    const avg = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
    return { name, avgHours: Math.round((avg/60)*10)/10, shifts: vals.length };
  });

  // Top slowest tasks across all staff
  const allSlow = STAFF_NAMES.flatMap(name =>
    slowestTasks(allRecords.filter(r=>r.staffName===name), name, teamAvgs)
      .filter(t=>t.diff>20)
      .map(t=>({...t, staffName:name}))
  ).sort((a,b)=>b.diff-a.diff).slice(0,6);

  // Weekly hours all staff
  const allWeeks = new Set(allRecords.map(r=>`W${r.weekNumber}`));
  const weekCompData = [...allWeeks].sort().map(wk => {
    const obj = { week: wk };
    STAFF_NAMES.forEach(name => {
      const recs = allRecords.filter(r=>r.staffName===name && `W${r.weekNumber}`===wk && r.totalMins>0);
      obj[name] = recs.length ? Math.round(recs.reduce((a,r)=>a+r.totalMins,0)/60*10)/10 : 0;
    });
    return obj;
  });

  // Missing today
  const today = new Date().toISOString().split("T")[0];
  const todayDow = new Date().getDay();
  const missedToday = WORK_DAYS.includes(todayDow)
    ? STAFF_NAMES.filter(n => !shiftDates[n]?.has(today))
    : [];

  return (
    <div>
      {/* Today's status */}
      <div style={{ background:"#fff", border:"1px solid #f3f4f6", borderRadius:14, padding:"16px", marginBottom:20, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#9ca3af", marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>Today · {new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {STAFF_NAMES.map(name => {
            const submitted = shiftDates[name]?.has(today);
            const isWorkDay = WORK_DAYS.includes(new Date().getDay());
            return (
              <div key={name} style={{
                display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
                background: submitted?"#f0fdf4":isWorkDay?"#fef2f2":"#f9fafb",
                borderRadius:10, border:`1px solid ${submitted?"#bbf7d0":isWorkDay?"#fecaca":"#e5e7eb"}`,
              }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background: submitted?"#22c55e":isWorkDay?"#ef4444":"#d1d5db" }}/>
                <span style={{ fontSize:14, fontWeight:700, color:"#111" }}>{name}</span>
                <span style={{ fontSize:12, color: submitted?"#15803d":isWorkDay?"#dc2626":"#9ca3af" }}>
                  {submitted?"✓ Submitted":isWorkDay?"Not submitted yet":"Day off"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Staff avg shift comparison */}
      <SectionTitle>⏱ Average Shift Hours — All Staff</SectionTitle>
      <div style={{ background:"#fff", borderRadius:14, padding:"16px 8px 8px", border:"1px solid #f3f4f6", boxShadow:"0 2px 8px rgba(0,0,0,0.04)", marginBottom:24 }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={staffCompData} margin={{ left:0, right:8, top:4, bottom:8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
            <XAxis dataKey="name" tick={{ fontSize:13, fill:"#374151", fontWeight:700 }}/>
            <YAxis tick={{ fontSize:11, fill:"#6b7280" }} width={32}/>
            <Tooltip formatter={v=>[`${v}h`,"Avg hours"]} contentStyle={{ borderRadius:10, border:"1px solid #e5e7eb", fontSize:13 }}/>
            <Bar dataKey="avgHours" radius={[8,8,0,0]}>
              {staffCompData.map((entry,i)=>(
                <rect key={i} fill={COLORS[entry.name]}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly hours trend — all staff */}
      {weekCompData.length > 1 && (
        <>
          <SectionTitle>📅 Weekly Hours — All Staff</SectionTitle>
          <div style={{ background:"#fff", borderRadius:14, padding:"16px 8px 8px", border:"1px solid #f3f4f6", boxShadow:"0 2px 8px rgba(0,0,0,0.04)", marginBottom:24 }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weekCompData} margin={{ left:0, right:8, top:4, bottom:8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="week" tick={{ fontSize:11, fill:"#6b7280" }}/>
                <YAxis tick={{ fontSize:11, fill:"#6b7280" }} width={32}/>
                <Tooltip contentStyle={{ borderRadius:10, border:"1px solid #e5e7eb", fontSize:13 }}/>
                <Legend wrapperStyle={{ fontSize:13 }}/>
                {STAFF_NAMES.map(name=>(
                  <Line key={name} type="monotone" dataKey={name} stroke={COLORS[name]} strokeWidth={2.5} dot={{ fill:COLORS[name], r:3 }}/>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Slowest tasks across team */}
      {allSlow.length > 0 && (
        <>
          <SectionTitle>🐢 Biggest Slowdowns Across Team</SectionTitle>
          <div style={{ background:"#fff", borderRadius:14, border:"1px solid #f3f4f6", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.04)", marginBottom:24 }}>
            {allSlow.map((t,idx)=>(
              <div key={`${t.staffName}-${t.task}`} style={{ display:"flex", alignItems:"center", padding:"13px 16px", borderTop:idx===0?"none":"1px solid #f3f4f6", gap:12 }}>
                <div style={{ width:8,height:8,borderRadius:"50%",background:COLORS[t.staffName],flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:14,fontWeight:700,color:"#111" }}>{t.staffName}</span>
                  <span style={{ fontSize:14,color:"#6b7280",marginLeft:6 }}>{t.task}</span>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:14,fontWeight:700,color:t.diff>40?"#dc2626":"#d97706" }}>+{t.diff}% slower</div>
                  <div style={{ fontSize:12,color:"#9ca3af" }}>{t.staffAvg}m vs {t.teamAvg}m avg</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Missing submissions last 30 days */}
      <SectionTitle>📭 Missing Submissions — Last 30 Days</SectionTitle>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:24 }}>
        {STAFF_NAMES.map(name=>{
          const missing = expectedDays.filter(d=>!shiftDates[name]?.has(d)).length;
          return (
            <div key={name} style={{ background:"#fff",border:"1px solid #f3f4f6",borderRadius:12,padding:"14px 16px",flex:1,minWidth:140,boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                <div style={{ width:10,height:10,borderRadius:"50%",background:COLORS[name] }}/>
                <span style={{ fontSize:14,fontWeight:700,color:"#111" }}>{name}</span>
              </div>
              <div style={{ fontSize:22,fontWeight:800,color:missing>5?"#dc2626":missing>2?"#d97706":"#16a34a" }}>{missing}</div>
              <div style={{ fontSize:12,color:"#9ca3af" }}>missing shifts</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activePage, setActivePage] = useState("overview"); // overview | Michelle | Alyson | Susan
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const raw = await fetchAllRecords();
      setRecords(processRecords(raw));
      setLastRefresh(new Date());
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const teamAvgs     = useMemo(() => taskAverages(records), [records]);
  const expectedDays = useMemo(() => getExpectedWorkDays(30), []);

  // Missing counts for nav badges
  const shiftDateMap = useMemo(() => getShiftDates(records), [records]);
  const missingCounts = useMemo(() => {
    const counts = {};
    STAFF_NAMES.forEach(name => {
      counts[name] = expectedDays.filter(d => !shiftDateMap[name]?.has(d)).length;
    });
    return counts;
  }, [records, expectedDays, shiftDateMap]);

  return (
    <div style={s.page}>
      {/* ── SIDEBAR / TOP NAV ── */}
      <div style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <div style={s.sidebarLogo}>⚡</div>
          <div>
            <div style={s.sidebarTitle}>StaffLog</div>
            <div style={s.sidebarSub}>Owner Dashboard</div>
          </div>
        </div>

        <nav style={s.nav}>
          {[
            { id:"overview", label:"Overview", icon:"📊" },
            ...STAFF_NAMES.map(name => ({ id:name, label:name, icon:"👤", missing:missingCounts[name], shift:STAFF_SHIFTS[name] }))
          ].map(item => (
            <button key={item.id}
              style={{ ...s.navItem, background:activePage===item.id?"#fff3e8":item.id==="overview"?"transparent":"transparent",
                color:activePage===item.id?BRAND:"#374151",
                borderLeft:activePage===item.id?`3px solid ${BRAND}`:"3px solid transparent",
              }}
              onClick={() => setActivePage(item.id)}>
              <span style={{ fontSize:16 }}>{item.icon}</span>
              <span style={{ flex:1, fontSize:14, fontWeight:activePage===item.id?700:500 }}>{item.label}</span>
              {item.shift && <span style={{ fontSize:11, color:"#9ca3af" }}>{item.shift}</span>}
              {item.missing > 0 && <MissingBadge count={item.missing}/>}
            </button>
          ))}
        </nav>

        <div style={s.sidebarFooter}>
          <button style={s.refreshBtn} onClick={loadData} disabled={loading}>
            {loading ? "⟳ Loading..." : "⟳ Refresh"}
          </button>
          {lastRefresh && (
            <div style={{ fontSize:11,color:"#9ca3af",textAlign:"center",marginTop:6 }}>
              Updated {lastRefresh.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={s.main}>
        {/* Page header */}
        <div style={s.mainHeader}>
          <div>
            <div style={s.mainTitle}>
              {activePage === "overview" ? "Team Overview" : activePage}
            </div>
            <div style={s.mainSub}>
              {activePage === "overview"
                ? `${records.length} total records · All time`
                : `${STAFF_SHIFTS[activePage]} shift · ${records.filter(r=>r.staffName===activePage).length} records`}
            </div>
          </div>
          {activePage !== "overview" && (
            <div style={{ ...s.staffDot, background:COLORS[activePage] }}>
              {activePage.slice(0,2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={s.mainContent}>
          {loading ? (
            <div style={s.loadingWrap}>
              <div style={s.spinner}/>
              <p style={{ color:"#9ca3af",marginTop:16,fontSize:15 }}>Loading staff data...</p>
            </div>
          ) : error ? (
            <div style={{ background:"#fef2f2",border:"1px solid #fecaca",borderRadius:12,padding:20,color:"#dc2626",fontSize:14 }}>
              ⚠️ Error loading data: {error}
              <button style={{ marginLeft:12,background:"none",border:"1px solid #dc2626",color:"#dc2626",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:13 }} onClick={loadData}>Retry</button>
            </div>
          ) : records.length === 0 ? (
            <div style={{ textAlign:"center",padding:"60px 20px" }}>
              <div style={{ fontSize:48,marginBottom:16 }}>📭</div>
              <div style={{ fontSize:18,fontWeight:700,color:"#111",marginBottom:8 }}>No data yet</div>
              <p style={{ color:"#9ca3af",fontSize:15 }}>Staff data will appear here once shifts are submitted.</p>
            </div>
          ) : activePage === "overview" ? (
            <OverviewPage allRecords={records} teamAvgs={teamAvgs} expectedDays={expectedDays}/>
          ) : (
            <StaffPage staffName={activePage} allRecords={records} teamAvgs={teamAvgs} expectedDays={expectedDays}/>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = {
  page: { display:"flex", minHeight:"100vh", background:"#f9fafb", fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif" },

  // Sidebar
  sidebar: { width:240,background:"#fff",borderRight:"1px solid #f3f4f6",display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,bottom:0,zIndex:10 },
  sidebarHeader: { display:"flex",alignItems:"center",gap:12,padding:"24px 20px 20px",borderBottom:"1px solid #f3f4f6" },
  sidebarLogo: { width:38,height:38,background:"#111",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 },
  sidebarTitle: { fontSize:16,fontWeight:800,color:"#111",letterSpacing:-0.3 },
  sidebarSub: { fontSize:11,color:"#9ca3af" },
  nav: { flex:1,padding:"12px 8px",overflowY:"auto" },
  navItem: { width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"none",cursor:"pointer",textAlign:"left",marginBottom:2,transition:"all 0.15s" },
  sidebarFooter: { padding:"16px" },
  refreshBtn: { width:"100%",background:"#f3f4f6",border:"none",borderRadius:10,padding:"10px",fontSize:13,fontWeight:600,color:"#374151",cursor:"pointer" },

  // Main
  main: { flex:1,marginLeft:240,display:"flex",flexDirection:"column",minHeight:"100vh" },
  mainHeader: { background:"#fff",borderBottom:"1px solid #f3f4f6",padding:"24px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:5 },
  mainTitle: { fontSize:22,fontWeight:800,color:"#111" },
  mainSub: { fontSize:13,color:"#9ca3af",marginTop:3 },
  staffDot: { width:44,height:44,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14 },
  mainContent: { padding:"28px 32px",maxWidth:900 },

  loadingWrap: { display:"flex",flexDirection:"column",alignItems:"center",padding:"80px 0" },
  spinner: { width:36,height:36,borderRadius:"50%",border:`3px solid #f3f4f6`,borderTop:`3px solid ${BRAND}`,animation:"spin 0.8s linear infinite" },
};
