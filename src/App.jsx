import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";

// ─── THEME ───────────────────────────────────────────────────────────────────
const T = {
  bg:"#F5F5F7", card:"#FFFFFF", border:"#F0F0F0", text:"#0A0A0A", sub:"#6B7280",
  muted:"#9CA3AF", accent:"#E07B39", accentLight:"#FDF0E8", green:"#16A34A",
  greenLight:"#F0FDF4", red:"#DC2626", redLight:"#FEF2F2", amber:"#D97706",
  amberLight:"#FFFBEB", blue:"#2563EB", blueLight:"#EFF6FF", div:"#F3F4F6",
  purple:"#7C3AED", purpleLight:"#F5F3FF",
};

// ─── AIRTABLE CONFIG ──────────────────────────────────────────────────────────
const AT_BASE   = "app6DROW7O9mZnmTY";
const AT_SHIFTS = "tbl4sVuVCiDCyXF3O";
const AT_TASKS  = "tblTl58cC0siAAaSN";
const AT_SHOPS  = "tbl907rSCoxOKJBce"; // ← replace with your Shops table ID
const AT_TOKEN  = "patppMWHKbx68aeNP.8d37f524addbaf4997c863c9682c7da9932bb0927727dade5272a72157835ea4";
const AT_HDR    = { "Authorization": `Bearer ${AT_TOKEN}`, "Content-Type": "application/json" };

const STAFF_COLORS = ["#E07B39","#2563EB","#8B5CF6","#16A34A","#D97706","#DC2626","#0891B2"];
const SECTOR_ICONS = { convenience:"🏪", gym:"🏋️", cafe:"☕", default:"🏢" };
const DAY_NAMES    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const WDAYS        = [1,2,3,4,5,6];

// ─── AIRTABLE HELPERS ─────────────────────────────────────────────────────────
async function atFetchAll(tableId, formula) {
  let rows = [], offset = null;
  do {
    const url = new URL(`https://api.airtable.com/v0/${AT_BASE}/${tableId}`);
    url.searchParams.set("pageSize","100");
    if (formula) url.searchParams.set("filterByFormula", formula);
    if (offset)  url.searchParams.set("offset", offset);
    const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${AT_TOKEN}` } });
    if (!r.ok) throw new Error("Airtable fetch failed");
    const d = await r.json();
    rows = [...rows, ...d.records];
    offset = d.offset || null;
  } while (offset);
  return rows;
}

async function fetchAllShops() {
  const rows = await atFetchAll(AT_SHOPS, `{Active}=1`);
  return rows.map(r => ({
    id:         r.id,
    shopId:     r.fields["Shop ID"] || "",
    shopName:   r.fields["Shop Name"] || "",
    sector:     (r.fields["Sector"] || "convenience").toLowerCase(),
    shiftHours: parseInt(r.fields["Shift Hours"] || 6),
    staff:      (() => { try { return JSON.parse(r.fields["Staff"] || "[]"); } catch { return []; } })(),
    ownerPin:   r.fields["Owner PIN"] || "0000",
  }));
}

async function fetchShiftsForShop(shopId) {
  const rows = await atFetchAll(AT_SHIFTS, `{Shop ID}="${shopId}"`);
  return rows.map(r => ({
    id:       r.id,
    staff:    r.fields["Staff Name"] || "",
    date:     r.fields["Date"] || "",
    task:     r.fields["Task Name"] || "",
    category: r.fields["Category"] || "",
    mins:     Number(r.fields["Total Minutes"] || 0),
    notes:    r.fields["Task Notes"] || "",
    week:     Number(r.fields["Week Number"] || 0),
    shopId:   r.fields["Shop ID"] || "",
    sector:   r.fields["Sector"] || "",
  })).filter(r => r.staff && r.date);
}

async function fetchAllShifts() {
  const rows = await atFetchAll(AT_SHIFTS);
  return rows.map(r => ({
    id:       r.id,
    staff:    r.fields["Staff Name"] || "",
    date:     r.fields["Date"] || "",
    task:     r.fields["Task Name"] || "",
    category: r.fields["Category"] || "",
    mins:     Number(r.fields["Total Minutes"] || 0),
    notes:    r.fields["Task Notes"] || "",
    week:     Number(r.fields["Week Number"] || 0),
    shopId:   r.fields["Shop ID"] || "",
    shopName: r.fields["Store"] || "",
    sector:   r.fields["Sector"] || "",
  })).filter(r => r.staff && r.date);
}

async function createShopInAirtable(shopData) {
  const r = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_SHOPS}`, {
    method: "POST", headers: AT_HDR,
    body: JSON.stringify({ fields: {
      "Shop ID":     shopData.shopId,
      "Shop Name":   shopData.shopName,
      "Sector":      shopData.sector,
      "Shift Hours": shopData.shiftHours,
      "Staff":       JSON.stringify(shopData.staff),
      "Owner PIN":   shopData.ownerPin,
      "Active":      true,
    }}),
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e?.error?.message || "Failed to create shop"); }
  return r.json();
}

async function updateShopInAirtable(recordId, shopData) {
  const r = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_SHOPS}/${recordId}`, {
    method: "PATCH", headers: AT_HDR,
    body: JSON.stringify({ fields: {
      "Shop Name":   shopData.shopName,
      "Sector":      shopData.sector,
      "Shift Hours": shopData.shiftHours,
      "Staff":       JSON.stringify(shopData.staff),
      "Owner PIN":   shopData.ownerPin,
    }}),
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e?.error?.message || "Failed to update shop"); }
  return r.json();
}

// ─── STAT HELPERS ─────────────────────────────────────────────────────────────
const fmt = m => { if(!m) return "0m"; const h=Math.floor(m/60),mn=m%60; return h>0?(h+"h"+(mn>0?" "+mn+"m":"")):(mn+"m"); };
const avg = a => a.length ? Math.round(a.reduce((x,y)=>x+y,0)/a.length) : 0;
const pct = (a,b) => b ? Math.round(((a-b)/b)*100) : null;

function wkNum(ds) {
  const d=new Date(ds); d.setHours(0,0,0,0); d.setDate(d.getDate()+4-(d.getDay()||7));
  const y=new Date(d.getFullYear(),0,1); return Math.ceil((((d-y)/86400000)+1)/7);
}
const curWk  = () => wkNum(new Date().toISOString().split("T")[0]);
const prvWk  = () => { const d=new Date(); d.setDate(d.getDate()-7); return wkNum(d.toISOString().split("T")[0]); };
const today  = () => new Date().toISOString().split("T")[0];

function filterPeriod(recs, period) {
  const now = new Date();
  if (period==="today") return recs.filter(r=>r.date===today());
  if (period==="week")  return recs.filter(r=>r.week===curWk());
  if (period==="month") { const y=now.getFullYear(),m=now.getMonth(); return recs.filter(r=>{const d=new Date(r.date);return d.getFullYear()===y&&d.getMonth()===m;}); }
  return recs;
}
function filterPrev(recs, period) {
  const now = new Date();
  if (period==="today") { const p=new Date(now); p.setDate(now.getDate()-1); return recs.filter(r=>r.date===p.toISOString().split("T")[0]); }
  if (period==="week")  return recs.filter(r=>r.week===prvWk());
  if (period==="month") { const y=now.getFullYear(),m=now.getMonth()-1; return recs.filter(r=>{const d=new Date(r.date);return d.getFullYear()===(m<0?y-1:y)&&d.getMonth()===(m<0?11:m);}); }
  return [];
}

function shopStats(recs, shopConfig) {
  const staffNames = shopConfig.staff.map(s=>s.name);
  const staffDates = {};
  staffNames.forEach(n => { staffDates[n] = new Set(); });
  recs.forEach(r => { if(staffDates[r.staff]) staffDates[r.staff].add(r.date); });
  const totalMins = recs.filter(r=>r.mins>0).reduce((a,r)=>a+r.mins,0);
  const activeStaff = [...new Set(recs.filter(r=>r.mins>0).map(r=>r.staff))].length;
  const taskCount = [...new Set(recs.filter(r=>r.mins>0).map(r=>r.task))].length;
  const avgTask = recs.filter(r=>r.mins>0).length ? avg(recs.filter(r=>r.mins>0).map(r=>r.mins)) : 0;
  const isWorkDay = WDAYS.includes(new Date().getDay());
  const notSubmitted = isWorkDay ? staffNames.filter(n=>!staffDates[n]?.has(today())) : [];
  return { totalMins, activeStaff, taskCount, avgTask, notSubmitted, staffDates };
}

function sectorBenchmark(allShifts, sector, period) {
  const sectorRecs = filterPeriod(allShifts.filter(r=>r.sector===sector&&r.mins>0), period);
  if (!sectorRecs.length) return null;
  const shopGroups = {};
  sectorRecs.forEach(r => { if(!shopGroups[r.shopId]) shopGroups[r.shopId]={mins:[],tasks:new Set()}; shopGroups[r.shopId].mins.push(r.mins); shopGroups[r.shopId].tasks.add(r.task); });
  const shopTotals = Object.values(shopGroups).map(s=>s.mins.reduce((a,b)=>a+b,0));
  return {
    avgTotalMins: avg(shopTotals),
    avgTaskMins:  avg(sectorRecs.map(r=>r.mins)),
    shopCount:    Object.keys(shopGroups).length,
  };
}

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
function Card({children, style, onPress}) {
  return <div onClick={onPress} style={{background:T.card,borderRadius:16,border:`1px solid ${T.border}`,boxShadow:"0 2px 12px rgba(0,0,0,0.05)",padding:16,...(style||{}),cursor:onPress?"pointer":"default"}}>{children}</div>;
}
function Lbl({children}) {
  return <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8,marginTop:4}}>{children}</div>;
}
function Badge({label,type}) {
  const m={good:{bg:T.greenLight,c:T.green},warn:{bg:T.amberLight,c:T.amber},flag:{bg:T.redLight,c:T.red},neutral:{bg:T.accentLight,c:T.accent},blue:{bg:T.blueLight,c:T.blue},purple:{bg:T.purpleLight,c:T.purple}};
  const st=m[type||"neutral"]||m.neutral;
  return <span style={{background:st.bg,color:st.c,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap"}}>{label}</span>;
}
function Chip({p}) {
  if(p===null||p===undefined) return <span style={{fontSize:12,color:T.muted}}>—</span>;
  return <span style={{fontSize:12,fontWeight:700,color:p>=0?T.green:T.red}}>{p>=0?"▲":"▼"} {Math.abs(p)}%</span>;
}
function PBar({val,max,color,h}) {
  h=h||6; const w=max>0?Math.min((val/max)*100,100):0;
  return <div style={{height:h,background:T.div,borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:w+"%",background:color,borderRadius:99,transition:"width 0.5s"}}/></div>;
}
function Avatar({name,size,color}) {
  size=size||36;
  return <div style={{width:size,height:size,borderRadius:"50%",background:color||T.accent,color:"#fff",fontWeight:800,fontSize:size*0.34,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{(name||"?").slice(0,2).toUpperCase()}</div>;
}
function PeriodToggle({period,setPeriod}) {
  return <div style={{display:"flex",gap:6,padding:"12px 16px 0",overflowX:"auto"}}>{[{id:"today",label:"Today"},{id:"week",label:"This Week"},{id:"month",label:"This Month"}].map(o=>(
    <button key={o.id} onClick={()=>setPeriod(o.id)} style={{background:period===o.id?"#111":"#fff",color:period===o.id?"#fff":T.sub,border:`1px solid ${period===o.id?"#111":T.border}`,borderRadius:20,padding:"8px 18px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{o.label}</button>
  ))}</div>;
}
function InsightRow({item}) {
  const icons={good:"✅",warn:"⚠️",flag:"🚨",insight:"💡",info:"📊"};
  const cols={good:T.green,warn:T.amber,flag:T.red,insight:T.blue,info:T.sub};
  return <div style={{display:"flex",gap:10,padding:"12px 0",borderBottom:`1px solid ${T.div}`}}><span style={{fontSize:18,flexShrink:0}}>{icons[item.type]||"•"}</span><p style={{margin:0,fontSize:14,color:cols[item.type]||T.sub,lineHeight:1.6,fontWeight:500}}>{item.text}</p></div>;
}

// ─── SHOP SELECTOR MODAL ──────────────────────────────────────────────────────
function ShopSelectorModal({shops, currentShopId, onSelect, onClose}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:480,margin:"0 auto"}}>
        <div style={{width:40,height:4,borderRadius:99,background:"#E5E7EB",margin:"0 auto 20px"}}/>
        <div style={{fontSize:18,fontWeight:800,color:T.text,marginBottom:4}}>Switch Shop</div>
        <div style={{fontSize:13,color:T.muted,marginBottom:20}}>Select which shop to view</div>
        {shops.map((shop,i) => (
          <button key={shop.shopId} onClick={()=>{onSelect(shop.shopId);onClose();}}
            style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:shop.shopId===currentShopId?"#111":T.bg,borderRadius:14,border:`1px solid ${shop.shopId===currentShopId?"#111":T.border}`,cursor:"pointer",marginBottom:8,textAlign:"left"}}>
            <span style={{fontSize:28}}>{SECTOR_ICONS[shop.sector]||SECTOR_ICONS.default}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:shop.shopId===currentShopId?"#fff":T.text}}>{shop.shopName}</div>
              <div style={{fontSize:12,color:shop.shopId===currentShopId?"rgba(255,255,255,0.6)":T.muted,textTransform:"capitalize"}}>{shop.sector} · {shop.staff.length} staff</div>
            </div>
            {shop.shopId===currentShopId && <span style={{color:"#fff",fontSize:18}}>✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── HOME TAB ─────────────────────────────────────────────────────────────────
function HomeTab({shopRecs, allShifts, shopConfig, allShops}) {
  const [period, setPeriod] = useState("today");
  const recs     = useMemo(()=>filterPeriod(shopRecs,period),[shopRecs,period]);
  const prevRecs = useMemo(()=>filterPrev(shopRecs,period),[shopRecs,period]);
  const stats    = useMemo(()=>shopStats(recs,shopConfig),[recs,shopConfig]);
  const prevMins = prevRecs.filter(r=>r.mins>0).reduce((a,r)=>a+r.mins,0);
  const benchmark = useMemo(()=>sectorBenchmark(allShifts,shopConfig.sector,period),[allShifts,shopConfig.sector,period]);

  const staffNames = shopConfig.staff.map(s=>s.name);
  const staffBreak = shopConfig.staff.map((s,i)=>({
    name: s.name,
    color: STAFF_COLORS[i%STAFF_COLORS.length],
    mins: recs.filter(r=>r.staff===s.name&&r.mins>0).reduce((a,r)=>a+r.mins,0),
    prevMins: prevRecs.filter(r=>r.staff===s.name&&r.mins>0).reduce((a,r)=>a+r.mins,0),
  }));
  const maxMins = Math.max(...staffBreak.map(s=>s.mins),1);

  const catMap = {};
  recs.filter(r=>r.mins>0).forEach(r=>{ catMap[r.category]=(catMap[r.category]||0)+r.mins; });
  const catData = Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  const catTotal = catData.reduce((a,b)=>a+b[1],0);

  const mChg = pct(stats.totalMins, prevMins);
  const pLabel = {today:"Today",week:"This Week",month:"This Month"}[period];

  // Benchmark insight
  const benchInsight = () => {
    if(!benchmark||benchmark.shopCount<2) return null;
    const diff = pct(stats.totalMins, benchmark.avgTotalMins);
    if(diff===null) return null;
    if(diff>15) return {type:"flag",text:`${shopConfig.shopName} is ${diff}% above the sector average for ${period}. Consider if tasks are taking longer than expected.`};
    if(diff<-15) return {type:"good",text:`${shopConfig.shopName} is ${Math.abs(diff)}% more efficient than the ${shopConfig.sector} sector average. Great performance.`};
    return {type:"insight",text:`${shopConfig.shopName} is tracking in line with the ${shopConfig.sector} sector average (${fmt(benchmark.avgTotalMins)} avg).`};
  };
  const bi = benchInsight();

  return (
    <div style={{paddingBottom:90}}>
      <PeriodToggle period={period} setPeriod={setPeriod}/>

      {/* Snapshot card */}
      <div style={{margin:"12px 16px 0",background:"#111",borderRadius:16,padding:16,border:"none"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.45)",letterSpacing:0.8,textTransform:"uppercase",marginBottom:2}}>{pLabel}</div>
            <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>{fmt(stats.totalMins)||"No data yet"}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {period==="today"&&stats.activeStaff>0&&<div style={{width:8,height:8,borderRadius:"50%",background:"#22C55E",boxShadow:"0 0 8px #22C55E"}}/>}
            {mChg!==null&&<Chip p={mChg}/>}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:stats.notSubmitted.length?10:0}}>
          {[
            {l:"HOURS LOGGED",val:fmt(stats.totalMins),dim:!stats.totalMins},
            {l:"TASKS DONE",val:stats.taskCount||"—",dim:!stats.taskCount},
            {l:"STAFF IN",val:`${stats.activeStaff}/${shopConfig.staff.length}`,dim:!stats.activeStaff},
            {l:"AVG TASK",val:stats.avgTask?stats.avgTask+"m":"—",dim:!stats.avgTask},
          ].map(k=>(
            <div key={k.l} style={{background:"rgba(255,255,255,0.07)",borderRadius:12,padding:"10px 12px"}}>
              <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:4}}>{k.l}</div>
              <div style={{fontSize:20,fontWeight:800,color:k.dim?"rgba(255,255,255,0.2)":"#fff"}}>{k.val}</div>
            </div>
          ))}
        </div>
        {stats.notSubmitted.length>0&&(
          <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(220,38,38,0.2)",borderRadius:10,padding:"8px 12px",marginTop:8}}>
            <span style={{fontSize:14}}>🚨</span>
            <span style={{fontSize:13,color:"#FCA5A5",fontWeight:600}}>Not submitted: {stats.notSubmitted.join(", ")}</span>
          </div>
        )}
      </div>

      <div style={{padding:"14px 16px 0"}}>

        {/* Sector benchmark */}
        {benchmark && (
          <>
            <Lbl>Sector Benchmark · {shopConfig.sector}</Lbl>
            <Card style={{marginBottom:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                {[
                  {l:"YOUR TOTAL",v:fmt(stats.totalMins),col:T.accent},
                  {l:"SECTOR AVG",v:fmt(benchmark.avgTotalMins),col:T.sub},
                  {l:"SHOPS IN DATA",v:benchmark.shopCount,col:T.blue},
                ].map(k=>(
                  <div key={k.l} style={{background:T.bg,borderRadius:12,padding:"10px 8px",textAlign:"center"}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:4}}>{k.l}</div>
                    <div style={{fontSize:16,fontWeight:800,color:k.col}}>{k.v}</div>
                  </div>
                ))}
              </div>
              {bi && <InsightRow item={bi}/>}
            </Card>
          </>
        )}

        {/* Staff hours */}
        <Lbl>Staff Hours · {pLabel}</Lbl>
        {staffBreak.map(s=>(
          <div key={s.name} style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:14,marginBottom:8,boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <Avatar name={s.name} size={36} color={s.color}/>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:800,color:T.text}}>{s.name}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:18,fontWeight:800,color:s.color}}>{fmt(s.mins)||"—"}</div>
                <Chip p={pct(s.mins,s.prevMins)}/>
              </div>
            </div>
            <PBar val={s.mins} max={maxMins} color={s.color} h={7}/>
          </div>
        ))}

        {/* Category breakdown */}
        {catData.length>0&&(
          <>
            <Lbl>Time by Category</Lbl>
            <Card style={{marginBottom:14}}>
              {catData.map(e=>{const p=Math.round((e[1]/catTotal)*100); return(
                <div key={e[0]} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:600,color:T.sub}}>{e[0]}</span>
                    <span style={{fontSize:13,fontWeight:700,color:T.text}}>{fmt(e[1])} <span style={{color:T.muted,fontWeight:400}}>({p}%)</span></span>
                  </div>
                  <PBar val={p} max={100} color={T.accent} h={7}/>
                </div>
              );})}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

// ─── BENCHMARK TAB ────────────────────────────────────────────────────────────
function BenchmarkTab({allShifts, allShops, currentShopId}) {
  const [period, setPeriod] = useState("week");
  const [sector, setSector] = useState("all");

  const sectors = [...new Set(allShops.map(s=>s.sector))];
  const filteredShops = sector==="all" ? allShops : allShops.filter(s=>s.sector===sector);

  const shopData = useMemo(()=>{
    return filteredShops.map((shop,i)=>{
      const recs = filterPeriod(allShifts.filter(r=>r.shopId===shop.shopId&&r.mins>0), period);
      const totalMins = recs.reduce((a,r)=>a+r.mins,0);
      const taskCount = [...new Set(recs.map(r=>r.task))].length;
      const staffCount = [...new Set(recs.map(r=>r.staff))].length;
      const avgTaskMins = recs.length ? avg(recs.map(r=>r.mins)) : 0;
      const catMap = {};
      recs.forEach(r=>{ catMap[r.category]=(catMap[r.category]||0)+r.mins; });
      const topCat = Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0];
      return { shop, totalMins, taskCount, staffCount, avgTaskMins, topCat, color: STAFF_COLORS[i%STAFF_COLORS.length] };
    }).sort((a,b)=>b.totalMins-a.totalMins);
  },[allShifts,filteredShops,period]);

  const maxMins = Math.max(...shopData.map(s=>s.totalMins),1);
  const sectorAvg = shopData.length ? avg(shopData.map(s=>s.totalMins)) : 0;
  const pLabel = {today:"Today",week:"This Week",month:"This Month"}[period];

  const chartData = shopData.map(s=>({name:s.shop.shopName.split(" ")[0], hours:+(s.totalMins/60).toFixed(1), color:s.color}));

  return (
    <div style={{paddingBottom:90}}>
      <PeriodToggle period={period} setPeriod={setPeriod}/>

      {/* Sector filter */}
      <div style={{display:"flex",gap:6,padding:"12px 16px 0",overflowX:"auto"}}>
        {["all",...sectors].map(s=>(
          <button key={s} onClick={()=>setSector(s)} style={{background:sector===s?T.accent:"#fff",color:sector===s?"#fff":T.sub,border:`1px solid ${sector===s?T.accent:T.border}`,borderRadius:20,padding:"7px 16px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,textTransform:"capitalize"}}>
            {s==="all"?"All Sectors":`${SECTOR_ICONS[s]||""} ${s}`}
          </button>
        ))}
      </div>

      <div style={{padding:"14px 16px 0"}}>

        {/* Sector avg banner */}
        {shopData.length>1&&(
          <div style={{background:"#111",borderRadius:14,padding:"14px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:2}}>SECTOR AVERAGE · {pLabel.toUpperCase()}</div>
              <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>{fmt(sectorAvg)}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:2}}>SHOPS</div>
              <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>{shopData.length}</div>
            </div>
          </div>
        )}

        {/* Bar chart */}
        {chartData.length>0&&chartData.some(d=>d.hours>0)&&(
          <>
            <Lbl>Hours Logged · {pLabel}</Lbl>
            <Card style={{marginBottom:14,padding:"16px 8px 8px"}}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{left:0,right:8,top:4,bottom:8}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.div}/>
                  <XAxis dataKey="name" tick={{fontSize:11,fill:T.sub,fontWeight:700}}/>
                  <YAxis tick={{fontSize:11,fill:T.muted}} width={24}/>
                  <Tooltip formatter={v=>[v+"h"]} contentStyle={{borderRadius:12,border:`1px solid ${T.border}`,fontSize:13}}/>
                  <Bar dataKey="hours" radius={[6,6,0,0]}>
                    {chartData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}

        {/* Shop comparison table */}
        <Lbl>Shop Comparison</Lbl>
        {shopData.length===0?(
          <Card><p style={{color:T.muted,fontSize:14,margin:0,textAlign:"center",padding:"16px 0"}}>No data for this period. Add shops or wait for staff to submit shifts.</p></Card>
        ):shopData.map((s,i)=>{
          const isCurrent = s.shop.shopId===currentShopId;
          const vsAvg = sectorAvg ? pct(s.totalMins,sectorAvg) : null;
          return (
            <Card key={s.shop.shopId} style={{marginBottom:10,border:isCurrent?`2px solid ${T.accent}`:undefined}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <div style={{width:36,height:36,borderRadius:10,background:s.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                  {SECTOR_ICONS[s.shop.sector]||"🏢"}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:15,fontWeight:800,color:T.text}}>{s.shop.shopName}</span>
                    {isCurrent&&<Badge label="Your shop" type="neutral"/>}
                    <span style={{fontSize:11,color:T.muted,textTransform:"capitalize"}}>#{i+1}</span>
                  </div>
                  <div style={{fontSize:12,color:T.muted,textTransform:"capitalize"}}>{s.shop.sector} · {s.shop.staff.length} staff</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:18,fontWeight:800,color:s.color}}>{fmt(s.totalMins)||"—"}</div>
                  {vsAvg!==null&&<Chip p={vsAvg}/>}
                </div>
              </div>
              <PBar val={s.totalMins} max={maxMins} color={s.color} h={6}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:10}}>
                {[{l:"TASKS",v:s.taskCount||"—"},{l:"STAFF IN",v:`${s.staffCount}/${s.shop.staff.length}`},{l:"AVG TASK",v:s.avgTaskMins?s.avgTaskMins+"m":"—"}].map(k=>(
                  <div key={k.l} style={{background:T.bg,borderRadius:8,padding:"6px 8px",textAlign:"center"}}>
                    <div style={{fontSize:9,fontWeight:700,color:T.muted,marginBottom:2}}>{k.l}</div>
                    <div style={{fontSize:13,fontWeight:800,color:T.text}}>{k.v}</div>
                  </div>
                ))}
              </div>
              {s.topCat&&<div style={{marginTop:8,fontSize:12,color:T.sub}}>Top category: <strong>{s.topCat[0]}</strong> · {fmt(s.topCat[1])}</div>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── STAFF TAB ────────────────────────────────────────────────────────────────
function StaffTab({shopRecs, shopConfig, allShifts, allShops}) {
  const [period, setPeriod] = useState("week");
  const [selectedStaff, setSelectedStaff] = useState(null);

  const recs     = useMemo(()=>filterPeriod(shopRecs,period),[shopRecs,period]);
  const prevRecs = useMemo(()=>filterPrev(shopRecs,period),[shopRecs,period]);
  const isWorkDay = WDAYS.includes(new Date().getDay());

  if (selectedStaff) {
    const staffRecs = shopRecs.filter(r=>r.staff===selectedStaff);
    const pRecs     = filterPeriod(staffRecs,period);
    const allRecs   = shopRecs;
    const totalMins = pRecs.filter(r=>r.mins>0).reduce((a,r)=>a+r.mins,0);
    const prevMins  = filterPrev(staffRecs,period).filter(r=>r.mins>0).reduce((a,r)=>a+r.mins,0);
    const staffIdx  = shopConfig.staff.findIndex(s=>s.name===selectedStaff);
    const color     = STAFF_COLORS[staffIdx%STAFF_COLORS.length];
    const taskMap   = {};
    pRecs.filter(r=>r.mins>0).forEach(r=>{ if(!taskMap[r.task]) taskMap[r.task]={mins:[],notes:[]}; taskMap[r.task].mins.push(r.mins); if(r.notes) taskMap[r.task].notes.push(r.notes); });
    const tasks = Object.entries(taskMap).map(([task,v])=>({task,avg:avg(v.mins),count:v.mins.length,lastNote:v.notes[v.notes.length-1]||null})).sort((a,b)=>b.avg-a.avg);

    // Benchmark this staff member's avg task time vs sector avg
    const sectorRecs = filterPeriod(allShifts.filter(r=>r.sector===shopConfig.sector&&r.mins>0),period);
    const sectorTaskAvg = task => { const v=sectorRecs.filter(r=>r.task===task&&r.mins>0).map(r=>r.mins); return v.length?avg(v):null; };

    return (
      <div style={{paddingBottom:90}}>
        <div style={{padding:"16px 16px 0",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setSelectedStaff(null)} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"6px 12px",cursor:"pointer",color:T.text,fontSize:13,fontWeight:700}}>← Back</button>
          <Avatar name={selectedStaff} size={36} color={color}/>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:800,color:T.text}}>{selectedStaff}</div>
            <div style={{fontSize:12,color:T.muted}}>{shopConfig.shopName}</div>
          </div>
        </div>
        <PeriodToggle period={period} setPeriod={setPeriod}/>
        <div style={{padding:"14px 16px 0"}}>
          <Card style={{marginBottom:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[{l:"PERIOD HRS",v:fmt(totalMins)||"—",col:color},{l:"VS PREV",v:<Chip p={pct(totalMins,prevMins)}/>,col:T.sub}].map(k=>(
                <div key={k.l} style={{background:T.bg,borderRadius:12,padding:"10px 8px",textAlign:"center"}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:4}}>{k.l}</div>
                  <div style={{fontSize:16,fontWeight:800,color:k.col}}>{k.v}</div>
                </div>
              ))}
            </div>
          </Card>
          <Lbl>Task Performance vs Sector</Lbl>
          {tasks.map(t=>{
            const sa=sectorTaskAvg(t.task);
            const diff=sa?pct(t.avg,sa):null;
            return (
              <Card key={t.task} style={{marginBottom:8}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:T.text}}>{t.task}</div>
                    <div style={{fontSize:12,color:T.muted}}>{t.count} sessions</div>
                    {t.lastNote&&<div style={{fontSize:11,color:T.blue,marginTop:4,fontStyle:"italic"}}>💬 {t.lastNote}</div>}
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:16,fontWeight:800,color:diff!==null&&diff>15?T.red:diff!==null&&diff<-15?T.green:T.text}}>{t.avg}m</div>
                    {sa&&<div style={{fontSize:11,color:T.muted}}>sector {sa}m</div>}
                  </div>
                  {diff!==null&&Math.abs(diff)>10&&<Badge label={diff>0?diff+"% slower":Math.abs(diff)+"% faster"} type={diff>0?"flag":"good"}/>}
                </div>
              </Card>
            );
          })}
          {!tasks.length&&<p style={{color:T.muted,fontSize:14,textAlign:"center",padding:"32px 0"}}>No data for this period.</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{paddingBottom:90}}>
      <PeriodToggle period={period} setPeriod={setPeriod}/>
      <div style={{padding:"14px 16px 0"}}>
        {shopConfig.staff.map((s,i)=>{
          const color = STAFF_COLORS[i%STAFF_COLORS.length];
          const sRecs = recs.filter(r=>r.staff===s.name&&r.mins>0);
          const totalMins = sRecs.reduce((a,r)=>a+r.mins,0);
          const prevMins  = prevRecs.filter(r=>r.staff===s.name&&r.mins>0).reduce((a,r)=>a+r.mins,0);
          const submitted = shopRecs.filter(r=>r.staff===s.name).some(r=>r.date===today());
          const allStaffMax = Math.max(...shopConfig.staff.map(st=>recs.filter(r=>r.staff===st.name&&r.mins>0).reduce((a,r)=>a+r.mins,0)),1);
          return (
            <Card key={s.name} style={{marginBottom:12}} onPress={()=>setSelectedStaff(s.name)}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <Avatar name={s.name} size={50} color={color}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:4}}>
                    <span style={{fontSize:17,fontWeight:800,color:T.text}}>{s.name}</span>
                    <Badge label={s.shift} type="neutral"/>
                  </div>
                  {submitted?<Badge label="✓ Submitted Today" type="good"/>:isWorkDay?<Badge label="Not submitted" type="flag"/>:null}
                </div>
                <span style={{fontSize:20,color:T.muted}}>›</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                {[{l:"HOURS",v:fmt(totalMins)||"—",col:color},{l:"VS PREV",v:<Chip p={pct(totalMins,prevMins)}/>,col:T.sub}].map(k=>(
                  <div key={k.l} style={{background:T.bg,borderRadius:10,padding:"8px 10px"}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:3}}>{k.l}</div>
                    <div style={{fontSize:15,fontWeight:800,color:k.col}}>{k.v}</div>
                  </div>
                ))}
              </div>
              <PBar val={totalMins} max={allStaffMax} color={color} h={6}/>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── MANAGE TAB ───────────────────────────────────────────────────────────────
function ManageTab({shops, onShopsUpdated}) {
  const [view, setView]           = useState("list"); // list | edit | add
  const [editShop, setEditShop]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState(null);

  // Form state
  const [fName, setFName]         = useState("");
  const [fId, setFId]             = useState("");
  const [fSector, setFSector]     = useState("convenience");
  const [fHours, setFHours]       = useState("6");
  const [fPin, setFPin]           = useState("0000");
  const [fStaff, setFStaff]       = useState([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffPin, setNewStaffPin]   = useState("");
  const [newStaffShift, setNewStaffShift] = useState("morning");

  const openEdit = (shop) => {
    setEditShop(shop);
    setFName(shop.shopName); setFId(shop.shopId); setFSector(shop.sector);
    setFHours(String(shop.shiftHours)); setFPin(shop.ownerPin||"0000");
    setFStaff([...shop.staff]);
    setView("edit");
  };

  const openAdd = () => {
    setEditShop(null);
    setFName(""); setFId(""); setFSector("convenience"); setFHours("6"); setFPin("0000"); setFStaff([]);
    setView("add");
  };

  const addStaffMember = () => {
    if (!newStaffName.trim() || newStaffPin.length!==4) return;
    const initials = newStaffName.trim().slice(0,2).toUpperCase();
    setFStaff(p=>[...p,{name:newStaffName.trim(),pin:newStaffPin,initials,shift:newStaffShift}]);
    setNewStaffName(""); setNewStaffPin(""); setNewStaffShift("morning");
  };

  const handleSave = async () => {
    if (!fName.trim()||!fId.trim()) return;
    setSaving(true); setSaveMsg(null);
    try {
      const data = { shopId:fId.trim().toLowerCase().replace(/\s+/g,"_"), shopName:fName.trim(), sector:fSector, shiftHours:parseInt(fHours)||6, staff:fStaff, ownerPin:fPin };
      if (editShop) await updateShopInAirtable(editShop.id, data);
      else await createShopInAirtable(data);
      setSaveMsg("ok");
      await onShopsUpdated();
      setTimeout(()=>{ setSaveMsg(null); setView("list"); },1500);
    } catch(e) { setSaveMsg(e.message||"Save failed"); }
    finally { setSaving(false); }
  };

  const inputStyle = {width:"100%",padding:"12px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:15,color:T.text,boxSizing:"border-box",marginBottom:12,outline:"none"};
  const lblStyle   = {display:"block",fontSize:13,fontWeight:700,color:T.sub,marginBottom:6};

  if (view==="list") return (
    <div style={{padding:"16px 16px 90px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <div style={{fontSize:20,fontWeight:800,color:T.text}}>Manage Shops</div>
        <button onClick={openAdd} style={{background:"#111",color:"#fff",border:"none",borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add Shop</button>
      </div>
      <div style={{fontSize:14,color:T.muted,marginBottom:20}}>Edit staff, shift hours and settings for each shop.</div>
      {shops.map((shop,i)=>(
        <Card key={shop.shopId} style={{marginBottom:10}} onPress={()=>openEdit(shop)}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:12,background:STAFF_COLORS[i%STAFF_COLORS.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{SECTOR_ICONS[shop.sector]||"🏢"}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:800,color:T.text}}>{shop.shopName}</div>
              <div style={{fontSize:12,color:T.muted,textTransform:"capitalize"}}>{shop.sector} · {shop.staff.length} staff · {shop.shiftHours}h shifts</div>
              <div style={{fontSize:11,color:T.muted,marginTop:2}}>Staff URL: ?shop={shop.shopId}</div>
            </div>
            <span style={{fontSize:20,color:T.muted}}>›</span>
          </div>
        </Card>
      ))}
      {!shops.length&&<p style={{color:T.muted,fontSize:14,textAlign:"center",padding:"32px 0"}}>No shops yet. Add your first one.</p>}
    </div>
  );

  return (
    <div style={{padding:"16px 16px 90px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
        <button onClick={()=>setView("list")} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"6px 12px",cursor:"pointer",color:T.text,fontSize:13,fontWeight:700}}>← Back</button>
        <div style={{fontSize:18,fontWeight:800,color:T.text}}>{view==="edit"?"Edit Shop":"Add New Shop"}</div>
      </div>

      <label style={lblStyle}>Shop Name</label>
      <input style={inputStyle} value={fName} onChange={e=>setFName(e.target.value)} placeholder="e.g. Londis Horden"/>

      <label style={lblStyle}>Shop ID (used in URL)</label>
      <input style={inputStyle} value={fId} onChange={e=>setFId(e.target.value)} placeholder="e.g. londis_horden" disabled={view==="edit"}/>
      {view==="add"&&<div style={{fontSize:12,color:T.muted,marginTop:-8,marginBottom:12}}>Staff URL: yourapp.vercel.app/?shop={fId||"your_id"}</div>}

      <label style={lblStyle}>Sector</label>
      <select style={{...inputStyle}} value={fSector} onChange={e=>setFSector(e.target.value)}>
        <option value="convenience">🏪 Convenience Store</option>
        <option value="gym">🏋️ Gym / Fitness</option>
        <option value="cafe">☕ Cafe / Coffee Shop</option>
      </select>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <label style={lblStyle}>Shift Hours</label>
          <input style={inputStyle} type="number" value={fHours} onChange={e=>setFHours(e.target.value)} min="1" max="12"/>
        </div>
        <div>
          <label style={lblStyle}>Owner PIN</label>
          <input style={inputStyle} type="text" maxLength={4} value={fPin} onChange={e=>setFPin(e.target.value)} placeholder="0000"/>
        </div>
      </div>

      <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:12,marginTop:4}}>Staff Members</div>
      {fStaff.map((st,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.bg,borderRadius:10,padding:"10px 14px",marginBottom:8}}>
          <Avatar name={st.name} size={32} color={STAFF_COLORS[i%STAFF_COLORS.length]}/>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:T.text}}>{st.name}</div>
            <div style={{fontSize:12,color:T.muted}}>PIN: {st.pin} · {st.shift}</div>
          </div>
          <button onClick={()=>setFStaff(p=>p.filter((_,j)=>j!==i))} style={{background:T.redLight,color:T.red,border:"none",borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Remove</button>
        </div>
      ))}

      <div style={{background:T.bg,borderRadius:12,padding:"14px",marginBottom:16,border:`1px dashed ${T.border}`}}>
        <div style={{fontSize:13,fontWeight:700,color:T.sub,marginBottom:10}}>Add Staff Member</div>
        <input style={{...inputStyle,marginBottom:8}} value={newStaffName} onChange={e=>setNewStaffName(e.target.value)} placeholder="Name"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <input style={{...inputStyle,marginBottom:8}} type="text" maxLength={4} value={newStaffPin} onChange={e=>setNewStaffPin(e.target.value)} placeholder="4-digit PIN"/>
          <select style={{...inputStyle,marginBottom:8}} value={newStaffShift} onChange={e=>setNewStaffShift(e.target.value)}>
            <option value="morning">Morning</option>
            <option value="evening">Evening</option>
            <option value="full">Full Day</option>
          </select>
        </div>
        <button onClick={addStaffMember} style={{background:T.accent,color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer",width:"100%"}}>+ Add to Staff List</button>
      </div>

      {saveMsg==="ok"&&<div style={{background:T.greenLight,color:T.green,borderRadius:10,padding:"12px 16px",fontSize:14,fontWeight:700,marginBottom:12}}>✓ Saved successfully!</div>}
      {saveMsg&&saveMsg!=="ok"&&<div style={{background:T.redLight,color:T.red,borderRadius:10,padding:"12px 16px",fontSize:14,marginBottom:12}}>⚠️ {saveMsg}</div>}

      <button onClick={handleSave} disabled={saving||!fName.trim()||!fId.trim()}
        style={{display:"block",width:"100%",background:saving?"#9ca3af":"#111",color:"#fff",border:"none",padding:"18px",borderRadius:12,fontSize:16,fontWeight:700,cursor:"pointer"}}>
        {saving?"Saving…":"Save Shop"}
      </button>
    </div>
  );
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [shops, setShops]                 = useState([]);
  const [shopsLoading, setShopsLoading]   = useState(true);
  const [shopsError, setShopsError]       = useState(null);
  const [currentShopId, setCurrentShopId] = useState(null);
  const [shopRecs, setShopRecs]           = useState([]);
  const [allShifts, setAllShifts]         = useState([]);
  const [dataLoading, setDataLoading]     = useState(false);
  const [showShopPicker, setShowShopPicker] = useState(false);
  const [bottomTab, setBottomTab]         = useState("home");

  const now = new Date();
  const greeting = now.getHours()<12?"Good morning":now.getHours()<17?"Good afternoon":"Good evening";

  // Load all shops
  const loadShops = async () => {
    try {
      const s = await fetchAllShops();
      setShops(s);
      if (!currentShopId && s.length>0) setCurrentShopId(s[0].shopId);
      return s;
    } catch(e) {
      setShopsError(e.message);
    }
  };

  useEffect(()=>{
    setShopsLoading(true);
    loadShops().finally(()=>setShopsLoading(false));
  },[]);

  // Load shift data when shop changes
  useEffect(()=>{
    if (!currentShopId) return;
    setDataLoading(true);
    Promise.all([fetchShiftsForShop(currentShopId), fetchAllShifts()])
      .then(([sRecs, all])=>{ setShopRecs(sRecs); setAllShifts(all); })
      .catch(e=>console.error("Data load error",e))
      .finally(()=>setDataLoading(false));
  },[currentShopId]);

  const currentShop = shops.find(s=>s.shopId===currentShopId);

  if (shopsLoading) return (
    <div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${T.div}`,borderTop:`3px solid ${T.accent}`,animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}/>
        <p style={{color:T.muted,fontSize:15}}>Loading your shops…</p>
      </div>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );

  if (shopsError) return (
    <div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif",padding:16}}>
      <div style={{background:T.redLight,border:`1px solid #FECACA`,borderRadius:14,padding:20,color:T.red,fontSize:14,maxWidth:400}}>
        ⚠️ {shopsError}<br/><br/>Make sure AT_SHOPS is set to your Shops table ID.
      </div>
    </div>
  );

  return (
    <div style={{background:T.bg,minHeight:"100vh",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif",maxWidth:480,margin:"0 auto"}}>

      {/* Header */}
      <div style={{background:"#111",position:"sticky",top:0,zIndex:20,boxShadow:"0 2px 16px rgba(0,0,0,0.15)"}}>
        <div style={{padding:"14px 16px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"#fff",letterSpacing:-0.3}}>
              {currentShop ? `${SECTOR_ICONS[currentShop.sector]||"🏢"} ${currentShop.shopName}` : "StaffLog"}
            </div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:1}}>{greeting} · {now.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {shops.length>1&&(
              <button onClick={()=>setShowShopPicker(true)} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,padding:"6px 12px",fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.7)",cursor:"pointer"}}>
                Switch ▾
              </button>
            )}
            <button onClick={()=>{ setDataLoading(true); fetchShiftsForShop(currentShopId).then(r=>setShopRecs(r)).finally(()=>setDataLoading(false)); }}
              disabled={dataLoading}
              style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,padding:"6px 12px",fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.7)",cursor:"pointer"}}>
              {dataLoading?"…":"↻"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {dataLoading && !shopRecs.length ? (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"80px 0"}}>
          <div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${T.div}`,borderTop:`3px solid ${T.accent}`,animation:"spin 0.8s linear infinite"}}/>
          <p style={{color:T.muted,marginTop:16,fontSize:15}}>Loading shift data…</p>
        </div>
      ) : !currentShop ? (
        <div style={{padding:16}}>
          <Card>
            <p style={{color:T.muted,fontSize:14,textAlign:"center",margin:0}}>No shops found. Go to Manage to add your first shop.</p>
          </Card>
        </div>
      ) : bottomTab==="home" ? (
        <HomeTab shopRecs={shopRecs} allShifts={allShifts} shopConfig={currentShop} allShops={shops}/>
      ) : bottomTab==="staff" ? (
        <StaffTab shopRecs={shopRecs} shopConfig={currentShop} allShifts={allShifts} allShops={shops}/>
      ) : bottomTab==="benchmark" ? (
        <BenchmarkTab allShifts={allShifts} allShops={shops} currentShopId={currentShopId}/>
      ) : (
        <ManageTab shops={shops} onShopsUpdated={async()=>{ const s=await loadShops(); }}/>
      )}

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:`1px solid ${T.border}`,display:"flex",zIndex:20,boxShadow:"0 -4px 20px rgba(0,0,0,0.08)"}}>
        {[{id:"home",icon:"🏠",label:"Home"},{id:"staff",icon:"👥",label:"Staff"},{id:"benchmark",icon:"📊",label:"Benchmark"},{id:"manage",icon:"⚙️",label:"Manage"}].map(tab=>(
          <button key={tab.id} onClick={()=>setBottomTab(tab.id)} style={{flex:1,background:"none",border:"none",padding:"12px 0 16px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{fontSize:20}}>{tab.icon}</span>
            <span style={{fontSize:10,fontWeight:700,color:bottomTab===tab.id?T.accent:T.muted}}>{tab.label}</span>
            {bottomTab===tab.id&&<div style={{width:20,height:3,borderRadius:99,background:T.accent,marginTop:1}}/>}
          </button>
        ))}
      </div>

      {/* Shop picker modal */}
      {showShopPicker&&(
        <ShopSelectorModal shops={shops} currentShopId={currentShopId}
          onSelect={id=>{ setCurrentShopId(id); setShopRecs([]); }}
          onClose={()=>setShowShopPicker(false)}/>
      )}

      <style>{"@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}body{margin:0}::-webkit-scrollbar{display:none}"}</style>
    </div>
  );
}
