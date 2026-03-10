import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";

const T={bg:"#F5F5F7",card:"#FFFFFF",border:"#F0F0F0",text:"#0A0A0A",sub:"#6B7280",muted:"#9CA3AF",accent:"#E07B39",accentLight:"#FDF0E8",green:"#16A34A",greenLight:"#F0FDF4",red:"#DC2626",redLight:"#FEF2F2",amber:"#D97706",amberLight:"#FFFBEB",blue:"#2563EB",blueLight:"#EFF6FF",div:"#F3F4F6",purple:"#7C3AED",purpleLight:"#F5F3FF"};
const SC=["#E07B39","#2563EB","#8B5CF6","#16A34A","#D97706","#DC2626","#0891B2"];
const SECTOR_ICONS={convenience:"🏪",gym:"🏋️",cafe:"☕",default:"🏢"};
const ALL_DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const WDAYS=[1,2,3,4,5,6];
const DNAMES=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const AT_BASE="app6DROW7O9mZnmTY";
const AT_SHIFTS="tbl4sVuVCiDCyXF3O";
const AT_TASKS="tblTl58cC0siAAaSN";
const AT_SHOPS="tbl907rSCoxOKJBce";
const AT_TOKEN="patppMWHKbx68aeNP.8d37f524addbaf4997c863c9682c7da9932bb0927727dade5272a72157835ea4";
const AT_HDR={"Authorization":`Bearer ${AT_TOKEN}`,"Content-Type":"application/json"};
const TASK_POOL=["Post Office","Till Lift / End of Shift Count","Personal Training","Pies","Magazine Returns","Newspaper Returns","Crisp Stacking","Pop Stacking","Beers Stacking","Wine Stacking","Dog Food Stacking","Fridge Stacking","Freezer Stacking","Grocery Stacking","Cards Stacking","Chocolate/Sweets Stacking","Mix Ups","Cigarette/Vape Stacking","Spirits Stacking","Fridge Date Check / Temp Check","Product Date Checks","Fridges Clean","Mop","Door Clean / Outside Clean","Behind Counter Clean","Stock Room Clean","Cash and Carry List","Pricing","Promotions","Delivery Unload","Serving","Equipment Check","Locker Room Clean","Class Setup","Reception Cover","Towel Restock","Weights Area Tidy","Cardio Zone Check","Protein Bar Restock","Opening Setup","Machine Clean","Stock Count","Till Check","Fridge Temp Check","Pastry Display","Floor Sweep","Milk Restock","Syrup Restock","Closing Clean","Deep Clean","Window Clean"];
const SECTOR_DEFAULTS={
  convenience:{Monday:{_all:["Post Office","Till Lift / End of Shift Count","Pies","Magazine Returns","Newspaper Returns","Crisp Stacking"]},Tuesday:{_all:["Post Office","Till Lift / End of Shift Count","Pies","Magazine Returns","Newspaper Returns","Dog Food Stacking"]},Wednesday:{_all:["Post Office","Till Lift / End of Shift Count","Pies","Magazine Returns","Newspaper Returns","Pop Stacking"]},Thursday:{_all:["Post Office","Till Lift / End of Shift Count","Pies","Magazine Returns","Newspaper Returns","Grocery Stacking"]},Friday:{_all:["Post Office","Till Lift / End of Shift Count","Pies","Magazine Returns","Newspaper Returns","Crisp Stacking"]},Saturday:{_all:["Post Office","Till Lift / End of Shift Count","Pies","Magazine Returns","Newspaper Returns"]},Sunday:{_all:["Post Office","Till Lift / End of Shift Count","Newspaper Returns"]}},
  gym:{Monday:{_all:["Opening Setup","Equipment Check","Locker Room Clean","Reception Cover","Weights Area Tidy","Cardio Zone Check"]},Tuesday:{_all:["Opening Setup","Equipment Check","Towel Restock","Reception Cover","Protein Bar Restock","Machine Clean"]},Wednesday:{_all:["Opening Setup","Equipment Check","Locker Room Clean","Reception Cover","Class Setup","Cardio Zone Check"]},Thursday:{_all:["Opening Setup","Equipment Check","Towel Restock","Reception Cover","Weights Area Tidy","Machine Clean"]},Friday:{_all:["Opening Setup","Equipment Check","Locker Room Clean","Reception Cover","Protein Bar Restock","Cardio Zone Check"]},Saturday:{_all:["Opening Setup","Equipment Check","Class Setup","Reception Cover","Towel Restock"]},Sunday:{_all:["Opening Setup","Equipment Check","Reception Cover","Locker Room Clean"]}},
  cafe:{Monday:{_all:["Opening Setup","Pastry Display","Milk Restock","Syrup Restock","Floor Sweep","Till Check"]},Tuesday:{_all:["Opening Setup","Pastry Display","Milk Restock","Machine Clean","Floor Sweep","Till Check"]},Wednesday:{_all:["Opening Setup","Pastry Display","Milk Restock","Syrup Restock","Window Clean","Till Check"]},Thursday:{_all:["Opening Setup","Pastry Display","Milk Restock","Machine Clean","Floor Sweep","Till Check"]},Friday:{_all:["Opening Setup","Pastry Display","Milk Restock","Syrup Restock","Deep Clean","Till Check"]},Saturday:{_all:["Opening Setup","Pastry Display","Milk Restock","Floor Sweep","Till Check"]},Sunday:{_all:["Opening Setup","Pastry Display","Milk Restock","Closing Clean"]}}
};
const DEFAULT_SCHEDULE=SECTOR_DEFAULTS.convenience;

async function atFetchAll(tableId,formula){let rows=[],offset=null;do{const url=new URL(`https://api.airtable.com/v0/${AT_BASE}/${tableId}`);url.searchParams.set("pageSize","100");if(formula)url.searchParams.set("filterByFormula",formula);if(offset)url.searchParams.set("offset",offset);const r=await fetch(url.toString(),{headers:{"Authorization":`Bearer ${AT_TOKEN}`}});if(!r.ok)throw new Error("Airtable fetch failed");const d=await r.json();rows=[...rows,...d.records];offset=d.offset||null;}while(offset);return rows;}
function getOwnerIdFromURL(){return new URLSearchParams(window.location.search).get("owner")||null;}
function parseShop(r){return{id:r.id,shopId:r.fields["Shop ID"]||"",shopName:r.fields["Shop Name"]||"",sector:(r.fields["Sector"]||"convenience").toLowerCase(),shiftHours:parseInt(r.fields["Shift Hours"]||6),staff:(()=>{try{return JSON.parse(r.fields["Staff"]||"[]");}catch{return[];}})(),ownerPin:r.fields["Owner PIN"]||"0000",ownerId:r.fields["Owner ID"]||""};}
async function fetchOwnerShops(ownerId){const rows=await atFetchAll(AT_SHOPS,`AND({Active}=1,{Owner ID}="${ownerId}")`);return rows.map(parseShop);}
async function fetchAllShops(){const rows=await atFetchAll(AT_SHOPS,`{Active}=1`);return rows.map(parseShop);}
function parseRec(r){return{id:r.id,staff:r.fields["Staff Name"]||"",date:r.fields["Date"]||"",task:r.fields["Task Name"]||"",category:r.fields["Category"]||"",mins:Number(r.fields["Total Minutes"]||0),notes:r.fields["Task Notes"]||"",week:Number(r.fields["Week Number"]||0),shopId:r.fields["Shop ID"]||"",shopName:r.fields["Store"]||"",sector:r.fields["Sector"]||""};}
async function fetchShiftsForShop(shopId){const rows=await atFetchAll(AT_SHIFTS,`{Shop ID}="${shopId}"`);return rows.map(parseRec).filter(r=>r.staff&&r.date);}
async function fetchAllShifts(){const rows=await atFetchAll(AT_SHIFTS);return rows.map(parseRec).filter(r=>r.staff&&r.date);}
async function fetchSchedule(shopId,sector){const defaults=SECTOR_DEFAULTS[sector]||SECTOR_DEFAULTS.convenience;const rows=await atFetchAll(AT_TASKS,`{Shop ID}="${shopId}"`);const sched=JSON.parse(JSON.stringify(defaults));rows.forEach(r=>{const staff=r.fields["Staff Name"],day=r.fields["Day"],tasks=r.fields["Tasks"];if(staff&&day&&tasks){try{if(!sched[day])sched[day]={};sched[day][staff]=JSON.parse(tasks);if(!sched[day]._ids)sched[day]._ids={};sched[day]._ids[staff]=r.id;}catch(e){}}});return sched;}
function saveScheduleToAirtable(sched,shopId,day,staff,tasks,existingId){const fields={"Staff Name":staff,"Day":day,"Tasks":JSON.stringify(tasks),"Shop ID":shopId,"Last Updated":new Date().toISOString().split("T")[0]};if(existingId){return fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_TASKS}/${existingId}`,{method:"PATCH",headers:AT_HDR,body:JSON.stringify({fields})}).then(r=>{if(!r.ok)throw new Error("Save failed");return existingId;});}else{return fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_TASKS}`,{method:"POST",headers:AT_HDR,body:JSON.stringify({fields})}).then(r=>{if(!r.ok)throw new Error("Create failed");return r.json();}).then(d=>d.id);}}
async function createShop(data){const r=await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_SHOPS}`,{method:"POST",headers:AT_HDR,body:JSON.stringify({fields:{"Shop ID":data.shopId,"Shop Name":data.shopName,"Sector":data.sector,"Shift Hours":data.shiftHours,"Staff":JSON.stringify(data.staff),"Owner PIN":data.ownerPin,"Owner ID":data.ownerId,"Active":true}})});if(!r.ok){const e=await r.json();throw new Error(e?.error?.message||"Failed");}return r.json();}
async function updateShop(recordId,data){const r=await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_SHOPS}/${recordId}`,{method:"PATCH",headers:AT_HDR,body:JSON.stringify({fields:{"Shop Name":data.shopName,"Sector":data.sector,"Shift Hours":data.shiftHours,"Staff":JSON.stringify(data.staff),"Owner PIN":data.ownerPin}})});if(!r.ok){const e=await r.json();throw new Error(e?.error?.message||"Failed");}return r.json();}

const fmt=m=>{if(!m)return"0m";const h=Math.floor(m/60),mn=m%60;return h>0?(h+"h"+(mn>0?" "+mn+"m":"")):(mn+"m");};
const avgArr=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0;
const pctChg=(a,b)=>b?Math.round(((a-b)/b)*100):null;
function wkNum(ds){const d=new Date(ds);d.setHours(0,0,0,0);d.setDate(d.getDate()+4-(d.getDay()||7));const y=new Date(d.getFullYear(),0,1);return Math.ceil((((d-y)/86400000)+1)/7);}
const curWk=()=>wkNum(new Date().toISOString().split("T")[0]);
const prvWk=()=>{const d=new Date();d.setDate(d.getDate()-7);return wkNum(d.toISOString().split("T")[0]);};
const todayStr=()=>new Date().toISOString().split("T")[0];
function expDaysArr(n){n=n||30;const res=[],t=new Date();for(let i=1;i<=n;i++){const d=new Date(t);d.setDate(t.getDate()-i);if(WDAYS.includes(d.getDay()))res.push(d.toISOString().split("T")[0]);}return res;}
function filterPeriod(recs,period){const now=new Date();if(period==="today")return recs.filter(r=>r.date===todayStr());if(period==="week")return recs.filter(r=>r.week===curWk());if(period==="month"){const y=now.getFullYear(),m=now.getMonth();return recs.filter(r=>{const d=new Date(r.date);return d.getFullYear()===y&&d.getMonth()===m;});}return recs;}
function filterPrev(recs,period){const now=new Date();if(period==="today"){const p=new Date(now);p.setDate(now.getDate()-1);return recs.filter(r=>r.date===p.toISOString().split("T")[0]);}if(period==="week")return recs.filter(r=>r.week===prvWk());if(period==="month"){const y=now.getFullYear(),m=now.getMonth()-1;return recs.filter(r=>{const d=new Date(r.date);return d.getFullYear()===(m<0?y-1:y)&&d.getMonth()===(m<0?11:m);});}return[];}
function staffDatesMap(recs,staffNames){const m={};staffNames.forEach(n=>{m[n]=new Set();});recs.forEach(r=>{if(m[r.staff])m[r.staff].add(r.date);});return m;}
function shiftTotals(recs,name){const m={};recs.filter(r=>r.staff===name&&r.mins>0).forEach(r=>{m[r.date]=(m[r.date]||0)+r.mins;});return m;}
function teamTaskAvg(recs,task){const v=recs.filter(r=>r.task===task&&r.mins>0).map(r=>r.mins);return v.length?avgArr(v):null;}
function staffTaskAvg(recs,name,task){const v=recs.filter(r=>r.staff===name&&r.task===task&&r.mins>0).map(r=>r.mins);return v.length?avgArr(v):null;}
function consistScore(recs,name){const v=Object.values(shiftTotals(recs,name));if(v.length<2)return null;const m=avgArr(v),cv=Math.sqrt(v.reduce((a,b)=>a+Math.pow(b-m,2),0)/v.length)/m;return Math.max(0,Math.round((1-Math.min(cv,1))*100));}
function wkMins(recs,name,wk){return recs.filter(r=>r.staff===name&&r.week===wk&&r.mins>0).reduce((a,r)=>a+r.mins,0);}
function bestDayFor(recs,task){const m={};recs.filter(r=>r.task===task&&r.mins>0).forEach(r=>{const d=DNAMES[new Date(r.date).getDay()];if(!m[d])m[d]=[];m[d].push(r.mins);});const s=Object.entries(m).map(e=>({day:e[0],avg:avgArr(e[1]),n:e[1].length})).filter(x=>x.n>=1).sort((a,b)=>a.avg-b.avg);return s[0]||null;}
function taskDayTrendData(recs,task){const m={};recs.filter(r=>r.task===task&&r.mins>0).forEach(r=>{const d=DNAMES[new Date(r.date).getDay()];if(!m[d])m[d]=[];m[d].push(r.mins);});return DNAMES.slice(1,7).map(d=>({day:d,mins:m[d]?avgArr(m[d]):null,n:m[d]?m[d].length:0}));}

// Anonymous benchmark — uses all shops in sector including own, compares current shop vs rest
// Privacy: never reveals other shops' names or exact figures, only anonymous averages
function anonBenchmark(allShifts,allShops,currentShopId,sector,period){
  // Build sector shopId set from Shops table so we don't rely on Sector field being filled in shifts
  const sectorShopIds=new Set(allShops.filter(s=>s.sector===sector).map(s=>s.shopId));
  // All sector records across all time for task averages, filtered by period for totals
  const allSectorRecs=allShifts.filter(r=>sectorShopIds.has(r.shopId)&&r.mins>0);
  const periodSectorRecs=filterPeriod(allSectorRecs,period);
  // Other shops = any sector shop that isn't the current one
  const otherShopIds=[...sectorShopIds].filter(id=>id!==currentShopId);
  if(otherShopIds.length<1)return null;
  const otherAllRecs=allSectorRecs.filter(r=>otherShopIds.includes(r.shopId));
  const otherPeriodRecs=periodSectorRecs.filter(r=>otherShopIds.includes(r.shopId));
  // Task averages from ALL time (more data, more stable)
  const taskGroups={};otherAllRecs.forEach(r=>{if(!taskGroups[r.task])taskGroups[r.task]=[];taskGroups[r.task].push(r.mins);});
  const taskAvgs={};Object.entries(taskGroups).forEach(([t,v])=>{if(v.length>=2)taskAvgs[t]=avgArr(v);});
  // Period totals per shop for sector average comparison
  const shopGroups={};otherPeriodRecs.forEach(r=>{if(!shopGroups[r.shopId])shopGroups[r.shopId]=[];shopGroups[r.shopId].push(r.mins);});
  const shopTotals=Object.values(shopGroups).map(v=>v.reduce((a,b)=>a+b,0));
  const sectorAvgTotal=shopTotals.length?avgArr(shopTotals):null;
  const submitRates={};otherPeriodRecs.forEach(r=>{if(!submitRates[r.shopId])submitRates[r.shopId]=new Set();submitRates[r.shopId].add(r.date);});
  const avgSubmitDays=Object.values(submitRates).length?avgArr(Object.values(submitRates).map(s=>s.size)):null;
  return{taskAvgs,sectorAvgTotal,avgSubmitDays,otherShopCount:otherShopIds.length};
}

function genAnonInsights(myRecs,benchmark,shopConfig,period){
  if(!benchmark||benchmark.otherShopCount<1)return[{type:"info",text:`Not enough sector data yet for benchmarking. As more ${shopConfig.sector} businesses join, anonymous comparisons will appear here.`}];
  const pts=[];
  const pLabel={today:"today",week:"this week",month:"this month"}[period];
  const myTaskAvgs={};myRecs.filter(r=>r.mins>0).forEach(r=>{if(!myTaskAvgs[r.task])myTaskAvgs[r.task]=[];myTaskAvgs[r.task].push(r.mins);});
  let biggestWin=null,biggestFlag=null;
  Object.entries(myTaskAvgs).forEach(([task,vals])=>{
    const myAvg=avgArr(vals);const sectAvg=benchmark.taskAvgs[task];
    if(!sectAvg)return;
    const diff=Math.round(((myAvg-sectAvg)/sectAvg)*100);
    if(diff<-10&&(!biggestWin||diff<biggestWin.diff))biggestWin={task,diff,myAvg,sectAvg};
    if(diff>10&&(!biggestFlag||diff>biggestFlag.diff))biggestFlag={task,diff,myAvg,sectAvg};
  });
  if(biggestWin)pts.push({type:"good",text:`Your business completes "${biggestWin.task}" ${Math.abs(biggestWin.diff)}% faster than others in your sector. A genuine strength.`});
  if(biggestFlag)pts.push({type:"flag",text:`"${biggestFlag.task}" is taking ${biggestFlag.diff}% longer than the sector average. Worth investigating.`});
  if(!biggestWin&&!biggestFlag&&Object.keys(myTaskAvgs).length>0){
    const sharedTasks=Object.keys(myTaskAvgs).filter(t=>benchmark.taskAvgs[t]);
    if(sharedTasks.length>0)pts.push({type:"insight",text:`Your task times are closely in line with the ${shopConfig.sector} sector average across ${sharedTasks.length} shared task${sharedTasks.length>1?"s":""}. Consistent performance.`});
  }
  if(benchmark.sectorAvgTotal){const myTotal=myRecs.filter(r=>r.mins>0).reduce((a,r)=>a+r.mins,0);const diff=pctChg(myTotal,benchmark.sectorAvgTotal);if(diff!==null){if(diff>20)pts.push({type:"warn",text:`Your total logged time ${pLabel} is ${diff}% above the sector average. Your team may be working slower or logging more thoroughly.`});else if(diff<-20)pts.push({type:"good",text:`Your total logged time ${pLabel} is ${Math.abs(diff)}% below the sector average — your team is completing work efficiently.`});else pts.push({type:"insight",text:`Your total time ${pLabel} is in line with the ${shopConfig.sector} sector average. Consistent performance.`});}}
  const mySubmitDays=new Set(myRecs.map(r=>r.date)).size;
  if(benchmark.avgSubmitDays&&mySubmitDays>0){const diff=pctChg(mySubmitDays,benchmark.avgSubmitDays);if(diff!==null&&Math.abs(diff)>10){if(diff>0)pts.push({type:"good",text:`Your staff submit on more days than the sector average — ${diff}% above. Strong tracking habits.`});else pts.push({type:"warn",text:`Your staff are submitting on ${Math.abs(diff)}% fewer days than the sector average. Some shifts may be going unlogged.`});}}
  if(!pts.length)pts.push({type:"insight",text:`Your ${shopConfig.sector} performance is tracking closely with the sector average. Keep collecting data for deeper insights.`});
  return pts;
}

function genSummary(recs,period,staffNames){
  if(!recs.length)return[{type:"info",text:"No data for this period yet. Once staff submit shifts, insights will appear here."}];
  const pts=[];const pLabel={today:"today",week:"this week",month:"this month"}[period];
  const catMap={};recs.filter(r=>r.mins>0).forEach(r=>{catMap[r.category]=(catMap[r.category]||0)+r.mins;});
  const topCat=Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0];
  if(topCat)pts.push({type:"insight",text:`Most time ${pLabel} was spent on ${topCat[0]} — ${fmt(topCat[1])} logged.`});
  const allTasks=[...new Set(recs.map(r=>r.task))];let wd=0,wi=null;
  allTasks.forEach(task=>{const ta=teamTaskAvg(recs,task);if(!ta)return;staffNames.forEach(n=>{const sa=staffTaskAvg(recs,n,task);if(!sa)return;const d=Math.round(((sa-ta)/ta)*100);if(d>wd&&d>25){wd=d;wi={n,task,d,sa,ta};}});});
  if(wi)pts.push({type:"flag",text:`${wi.n} is ${wi.d}% slower than your team average on "${wi.task}" — ${wi.sa}m vs ${wi.ta}m.`});
  const staffMins=staffNames.map(n=>({n,total:recs.filter(r=>r.staff===n&&r.mins>0).reduce((a,r)=>a+r.mins,0)})).filter(s=>s.total>0).sort((a,b)=>b.total-a.total);
  if(staffMins.length>0)pts.push({type:"good",text:`${staffMins[0].n} logged the most time ${pLabel} — ${fmt(staffMins[0].total)}.`});
  if(period!=="today"){["Personal Training","Post Office","Opening Setup","Equipment Check"].forEach(task=>{const b=bestDayFor(recs,task);if(b)pts.push({type:"insight",text:`"${task}" gets done fastest on ${b.day}s — avg ${b.avg} mins.`});});}
  const today=todayStr();const notIn=WDAYS.includes(new Date().getDay())?staffNames.filter(n=>!staffDatesMap(recs,staffNames)[n]?.has(today)):[];
  if(notIn.length&&(period==="today"||period==="week"))pts.push({type:"flag",text:`${notIn.join(", ")} ${notIn.length===1?"has":"have"} not submitted today.`});
  if(!pts.length)pts.push({type:"info",text:"Everything looks steady. More submissions will surface deeper patterns."});
  return pts;
}

function genStaffInsights(name,recs,allRecs,period){
  const pts=[];const sRecs=recs.filter(r=>r.staff===name&&r.mins>0);
  if(!sRecs.length)return[{type:"info",text:"No data for this period yet."},{type:"info",text:"Try switching to This Week or This Month."},{type:"info",text:"Insights appear once shifts are submitted."}];
  const taskMap={};sRecs.forEach(r=>{if(!taskMap[r.task])taskMap[r.task]=[];taskMap[r.task].push(r.mins);});
  const taskComps=Object.entries(taskMap).map(e=>{const sa=avgArr(e[1]),ta=teamTaskAvg(allRecs,e[0]);const diff=ta?Math.round(((sa-ta)/ta)*100):null;return{task:e[0],sa,ta,diff,count:e[1].length};}).filter(t=>t.diff!==null);
  const faster=taskComps.filter(t=>t.diff<-10).sort((a,b)=>a.diff-b.diff);
  const slower=taskComps.filter(t=>t.diff>10).sort((a,b)=>b.diff-a.diff);
  if(faster.length>0){const f=faster[0];pts.push({type:"good",text:`Standout speed: ${name} completes "${f.task}" ${Math.abs(f.diff)}% faster than the team average (${f.sa}m vs ${f.ta}m).`});}
  else pts.push({type:"insight",text:`No tasks significantly faster than team average this ${period}. More data will surface ${name}'s strongest areas.`});
  if(slower.length>0){const s=slower[0];pts.push({type:"flag",text:`Watch point: "${s.task}" is taking ${s.diff}% longer than average (${s.sa}m vs ${s.ta}m). A quick conversation could help.`});}
  else pts.push({type:"good",text:`No tasks flagged as significantly slower this ${period}. ${name} is performing consistently.`});
  const totalMins=sRecs.reduce((a,r)=>a+r.mins,0);const bench={today:360,week:1800,month:7200}[period]||360;const benchPct=Math.round((totalMins/bench)*100);
  if(benchPct>=90)pts.push({type:"good",text:`Output: ${name} has logged ${fmt(totalMins)} this ${period} — ${benchPct}% of the expected shift target. Excellent effort.`});
  else if(benchPct>=55)pts.push({type:"insight",text:`Output: ${name} has logged ${fmt(totalMins)} this ${period} — ${benchPct}% of the expected target. On track.`});
  else pts.push({type:"warn",text:`Output: Only ${fmt(totalMins)} logged this ${period} (${benchPct}% of target). May be a missing submission — worth checking.`});
  return pts.slice(0,3);
}

function Card({children,style,onPress}){return <div onClick={onPress} style={{background:T.card,borderRadius:16,border:`1px solid ${T.border}`,boxShadow:"0 2px 12px rgba(0,0,0,0.05)",padding:16,...(style||{}),cursor:onPress?"pointer":"default"}}>{children}</div>;}
function Lbl({children}){return <div style={{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8,marginTop:4}}>{children}</div>;}
function Badge({label,type}){const m={good:{bg:T.greenLight,c:T.green},warn:{bg:T.amberLight,c:T.amber},flag:{bg:T.redLight,c:T.red},neutral:{bg:T.accentLight,c:T.accent},blue:{bg:T.blueLight,c:T.blue},purple:{bg:T.purpleLight,c:T.purple}};const st=m[type||"neutral"]||m.neutral;return <span style={{background:st.bg,color:st.c,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap"}}>{label}</span>;}
function Chip({p}){if(p===null||p===undefined)return <span style={{fontSize:12,color:T.muted}}>—</span>;return <span style={{fontSize:12,fontWeight:700,color:p>=0?T.green:T.red}}>{p>=0?"▲":"▼"} {Math.abs(p)}%</span>;}
function PBar({val,max,color,h}){h=h||6;const w=max>0?Math.min((val/max)*100,100):0;return <div style={{height:h,background:T.div,borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:w+"%",background:color,borderRadius:99,transition:"width 0.5s"}}/></div>;}
function Avatar({name,size,color}){size=size||36;return <div style={{width:size,height:size,borderRadius:"50%",background:color||T.accent,color:"#fff",fontWeight:800,fontSize:size*0.34,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{(name||"?").slice(0,2).toUpperCase()}</div>;}
function InsightRow({item}){const icons={good:"✅",warn:"⚠️",flag:"🚨",insight:"💡",info:"📊"};const cols={good:T.green,warn:T.amber,flag:T.red,insight:T.blue,info:T.sub};return <div style={{display:"flex",gap:10,padding:"12px 0",borderBottom:`1px solid ${T.div}`}}><span style={{fontSize:18,flexShrink:0}}>{icons[item.type]||"•"}</span><p style={{margin:0,fontSize:14,color:cols[item.type]||T.sub,lineHeight:1.6,fontWeight:500}}>{item.text}</p></div>;}
function NoteTag({note}){if(!note)return null;return <span style={{background:T.blueLight,color:T.blue,fontSize:11,fontWeight:500,padding:"2px 8px",borderRadius:8,display:"inline-block",marginTop:4,wordBreak:"break-word"}}>💬 {note}</span>;}
function PeriodToggle({period,setPeriod}){return <div style={{display:"flex",gap:6,padding:"12px 16px 0",overflowX:"auto"}}>{[{id:"today",label:"Today"},{id:"week",label:"This Week"},{id:"month",label:"This Month"}].map(o=><button key={o.id} onClick={()=>setPeriod(o.id)} style={{background:period===o.id?"#111":"#fff",color:period===o.id?"#fff":T.sub,border:`1px solid ${period===o.id?"#111":T.border}`,borderRadius:20,padding:"8px 18px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{o.label}</button>)}</div>;}

function ShopSwitcher({shops,currentShopId,onSelect,onClose}){return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:480,margin:"0 auto"}}><div style={{width:40,height:4,borderRadius:99,background:"#E5E7EB",margin:"0 auto 20px"}}/><div style={{fontSize:18,fontWeight:800,color:T.text,marginBottom:16}}>Your Businesses</div>{shops.map((shop,i)=><button key={shop.shopId} onClick={()=>{onSelect(shop.shopId);onClose();}} style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:shop.shopId===currentShopId?"#111":T.bg,borderRadius:14,border:`1px solid ${shop.shopId===currentShopId?"#111":T.border}`,cursor:"pointer",marginBottom:8,textAlign:"left"}}><span style={{fontSize:26}}>{SECTOR_ICONS[shop.sector]||"🏢"}</span><div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,color:shop.shopId===currentShopId?"#fff":T.text}}>{shop.shopName}</div><div style={{fontSize:12,color:shop.shopId===currentShopId?"rgba(255,255,255,0.5)":T.muted,textTransform:"capitalize"}}>{shop.sector} · {shop.staff.length} staff</div></div>{shop.shopId===currentShopId&&<span style={{color:"#fff"}}>✓</span>}</button>)}</div></div>;}

function HomeTab({allRecs,allShifts,allShops,shopConfig,currentShopId,expDays}){
  const [period,setPeriod]=useState("today");
  const recs=useMemo(()=>filterPeriod(allRecs,period),[allRecs,period]);
  const prevRecs=useMemo(()=>filterPrev(allRecs,period),[allRecs,period]);
  const staffNames=shopConfig.staff.map(s=>s.name);
  const sdm=useMemo(()=>staffDatesMap(allRecs,staffNames),[allRecs]);
  const summary=useMemo(()=>genSummary(recs,period,staffNames),[recs,period]);
  const benchmark=useMemo(()=>anonBenchmark(allShifts,allShops,currentShopId,shopConfig.sector,period),[allShifts,allShops,currentShopId,shopConfig.sector,period]);
  const anonInsights=useMemo(()=>genAnonInsights(recs,benchmark,shopConfig,period),[recs,benchmark,period]);
  const today=todayStr();
  const totalMins=recs.filter(r=>r.mins>0).reduce((a,r)=>a+r.mins,0);
  const prevMins=prevRecs.filter(r=>r.mins>0).reduce((a,r)=>a+r.mins,0);
  const taskCount=[...new Set(recs.filter(r=>r.mins>0).map(r=>r.task))].length;
  const activeStaff=[...new Set(recs.filter(r=>r.mins>0).map(r=>r.staff))].length;
  const avgTask=recs.filter(r=>r.mins>0).length?avgArr(recs.filter(r=>r.mins>0).map(r=>r.mins)):0;
  const isWorkDay=WDAYS.includes(new Date().getDay());
  const notIn=isWorkDay?staffNames.filter(n=>!sdm[n]?.has(today)):[];
  const live=period==="today"&&activeStaff>0;
  const mChg=pctChg(totalMins,prevMins);
  const staffBreak=shopConfig.staff.map((s,i)=>({name:s.name,color:SC[i%SC.length],mins:recs.filter(r=>r.staff===s.name&&r.mins>0).reduce((a,r)=>a+r.mins,0),prevMins:prevRecs.filter(r=>r.staff===s.name&&r.mins>0).reduce((a,r)=>a+r.mins,0)}));
  const maxMins=Math.max(...staffBreak.map(s=>s.mins),1);
  const catMap={};recs.filter(r=>r.mins>0).forEach(r=>{catMap[r.category]=(catMap[r.category]||0)+r.mins;});
  const catData=Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  const catTotal=catData.reduce((a,b)=>a+b[1],0);
  const chartData=staffBreak.map(s=>({name:s.name,Current:+(s.mins/60).toFixed(1),Previous:+(s.prevMins/60).toFixed(1)}));
  const pLabel={today:"Today",week:"This Week",month:"This Month"}[period];
  const prLabel={today:"Yesterday",week:"Last Week",month:"Last Month"}[period];
  return <div style={{paddingBottom:90}}>
    <PeriodToggle period={period} setPeriod={setPeriod}/>
    <Card style={{background:"#111",border:"none",margin:"12px 16px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div><div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.45)",letterSpacing:0.8,textTransform:"uppercase",marginBottom:2}}>{pLabel}</div><div style={{fontSize:22,fontWeight:800,color:"#fff"}}>{live?"Live Data":totalMins?fmt(totalMins):"Waiting for submissions"}</div></div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>{live&&<div style={{width:8,height:8,borderRadius:"50%",background:"#22C55E",boxShadow:"0 0 8px #22C55E"}}/>}{mChg!==null&&<Chip p={mChg}/>}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:notIn.length?10:0}}>
        {[{l:"HOURS LOGGED",val:fmt(totalMins),dim:!totalMins},{l:"TASKS DONE",val:taskCount||"—",dim:!taskCount},{l:"STAFF IN",val:`${activeStaff}/${shopConfig.staff.length}`,dim:!activeStaff},{l:"AVG TASK",val:avgTask?avgTask+"m":"—",dim:!avgTask}].map(k=><div key={k.l} style={{background:"rgba(255,255,255,0.07)",borderRadius:12,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:4}}>{k.l}</div><div style={{fontSize:20,fontWeight:800,color:k.dim?"rgba(255,255,255,0.2)":"#fff"}}>{k.val}</div></div>)}
      </div>
      {notIn.length>0&&<div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(220,38,38,0.2)",borderRadius:10,padding:"8px 12px",marginTop:8}}><span style={{fontSize:14}}>🚨</span><span style={{fontSize:13,color:"#FCA5A5",fontWeight:600}}>Not submitted: {notIn.join(", ")}</span></div>}
    </Card>
    <div style={{padding:"14px 16px 0"}}>
      <Lbl>Staff Hours · {pLabel}</Lbl>
      {staffBreak.map(s=><div key={s.name} style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:14,marginBottom:8,boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><Avatar name={s.name} size={36} color={s.color}/><div style={{flex:1}}><div style={{fontSize:15,fontWeight:800,color:T.text}}>{s.name}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:18,fontWeight:800,color:s.color}}>{fmt(s.mins)||"—"}</div><Chip p={pctChg(s.mins,s.prevMins)}/></div></div>
        <PBar val={s.mins} max={maxMins} color={s.color} h={7}/>
      </div>)}
      {chartData.some(d=>d.Current>0||d.Previous>0)&&<><Lbl>{pLabel} vs {prLabel}</Lbl><Card style={{marginBottom:14,padding:"16px 8px 8px"}}><ResponsiveContainer width="100%" height={180}><BarChart data={chartData} margin={{left:0,right:8,top:4,bottom:8}}><CartesianGrid strokeDasharray="3 3" stroke={T.div}/><XAxis dataKey="name" tick={{fontSize:12,fill:T.sub,fontWeight:700}}/><YAxis tick={{fontSize:11,fill:T.muted}} width={24}/><Tooltip formatter={v=>[v+"h"]} contentStyle={{borderRadius:12,border:`1px solid ${T.border}`,fontSize:13}}/><Bar dataKey="Current" radius={[6,6,0,0]}>{chartData.map((s,i)=><Cell key={i} fill={SC[i%SC.length]}/>)}</Bar><Bar dataKey="Previous" fill="#E5E7EB" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></Card></>}
      {catData.length>0&&<><Lbl>Time by Category</Lbl><Card style={{marginBottom:14}}>{catData.map(e=>{const p=Math.round((e[1]/catTotal)*100);return<div key={e[0]} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:600,color:T.sub}}>{e[0]}</span><span style={{fontSize:13,fontWeight:700}}>{fmt(e[1])} <span style={{color:T.muted,fontWeight:400}}>({p}%)</span></span></div><PBar val={p} max={100} color={T.accent} h={7}/></div>;})}
      </Card></>}
      <Lbl>Intelligence · {pLabel}</Lbl>
      <Card style={{marginBottom:14}}>{summary.map((item,i)=><InsightRow key={i} item={item}/>)}</Card>
      <Lbl>Sector Benchmark · Anonymous</Lbl>
      <Card style={{marginBottom:14,border:`1px solid ${T.purpleLight}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><span style={{fontSize:20}}>🔒</span><div style={{fontSize:12,color:T.purple,fontWeight:600}}>Anonymous — no other business can see your data</div></div>
        {anonInsights.map((item,i)=><InsightRow key={i} item={item}/>)}
      </Card>
    </div>
  </div>;
}

function StaffTab({allRecs,expDays,onNav,shopConfig}){
  const [period,setPeriod]=useState("week");
  const recs=useMemo(()=>filterPeriod(allRecs,period),[allRecs,period]);
  const prevRecs=useMemo(()=>filterPrev(allRecs,period),[allRecs,period]);
  const sdm=useMemo(()=>staffDatesMap(allRecs,shopConfig.staff.map(s=>s.name)),[allRecs]);
  const today=todayStr();const isWorkDay=WDAYS.includes(new Date().getDay());
  return <div style={{paddingBottom:90}}><PeriodToggle period={period} setPeriod={setPeriod}/><div style={{padding:"14px 16px 0"}}>
    {shopConfig.staff.map((s,i)=>{
      const color=SC[i%SC.length];
      const curr=recs.filter(r=>r.staff===s.name&&r.mins>0).reduce((a,r)=>a+r.mins,0);
      const prev=prevRecs.filter(r=>r.staff===s.name&&r.mins>0).reduce((a,r)=>a+r.mins,0);
      const sc=consistScore(allRecs,s.name);
      const miss30=expDays.filter(d=>!sdm[s.name]?.has(d)).length;
      const sub=sdm[s.name]?.has(today);
      const allStaffMax=Math.max(...shopConfig.staff.map(st=>recs.filter(r=>r.staff===st.name&&r.mins>0).reduce((a,r)=>a+r.mins,0)),1);
      return <Card key={s.name} style={{marginBottom:12}} onPress={()=>onNav("staffDetail",s.name)}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}><Avatar name={s.name} size={50} color={color}/><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:4}}><span style={{fontSize:17,fontWeight:800,color:T.text}}>{s.name}</span><Badge label={s.shift} type="neutral"/></div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{sub?<Badge label="✓ Submitted Today" type="good"/>:isWorkDay?<Badge label="Not submitted" type="flag"/>:null}{miss30>0&&<Badge label={`${miss30} missing`} type="warn"/>}</div></div><span style={{fontSize:20,color:T.muted}}>›</span></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>{[{l:"HOURS",val:fmt(curr)||"—",col:color},{l:"VS PREV",val:<Chip p={pctChg(curr,prev)}/>,col:T.sub},{l:"CONSIST.",val:sc!==null?sc+"/100":"—",col:sc>70?T.green:sc>40?T.amber:T.red}].map(k=><div key={k.l} style={{background:T.bg,borderRadius:10,padding:"8px 10px"}}><div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:3}}>{k.l}</div><div style={{fontSize:15,fontWeight:800,color:k.col}}>{k.val}</div></div>)}</div>
        <PBar val={curr} max={allStaffMax} color={color} h={6}/>
      </Card>;
    })}
  </div></div>;
}

function StaffDetail({name,allRecs,expDays,onNav,shopConfig}){
  const [tab,setTab]=useState("overview");const [period,setPeriod]=useState("week");
  const staffIdx=shopConfig.staff.findIndex(s=>s.name===name);const color=SC[staffIdx%SC.length];
  const recs=useMemo(()=>filterPeriod(allRecs,period),[allRecs,period]);
  const prevRecs=useMemo(()=>filterPrev(allRecs,period),[allRecs,period]);
  const sRecs=useMemo(()=>recs.filter(r=>r.staff===name),[recs,name]);
  const sdm=useMemo(()=>staffDatesMap(allRecs,shopConfig.staff.map(s=>s.name)),[allRecs]);
  const today=todayStr();
  const curr=sRecs.filter(r=>r.mins>0).reduce((a,r)=>a+r.mins,0);
  const prev=prevRecs.filter(r=>r.staff===name&&r.mins>0).reduce((a,r)=>a+r.mins,0);
  const sc=consistScore(allRecs,name);
  const miss30=expDays.filter(d=>!sdm[name]?.has(d));
  const sub=sdm[name]?.has(today);
  const sm=useMemo(()=>shiftTotals(allRecs,name),[allRecs,name]);
  const avgShift=Object.values(sm).length?avgArr(Object.values(sm)):0;
  const myTasks=useMemo(()=>{const m={};sRecs.filter(r=>r.mins>0).forEach(r=>{if(!m[r.task])m[r.task]={task:r.task,cat:r.category,vals:[],notes:[]};m[r.task].vals.push(r.mins);if(r.notes)m[r.task].notes.push({date:r.date,note:r.notes,mins:r.mins});});return Object.values(m).map(t=>{const ta=teamTaskAvg(recs,t.task),sa=avgArr(t.vals),d=ta?Math.round(((sa-ta)/ta)*100):0;return{...t,avg:sa,teamAvg:ta,diff:d,count:t.vals.length};}).sort((a,b)=>b.diff-a.diff);},[sRecs]);
  const catBreak=useMemo(()=>{const m={};sRecs.filter(r=>r.mins>0).forEach(r=>{m[r.category]=(m[r.category]||0)+r.mins;});const tot=Object.values(m).reduce((a,b)=>a+b,0);return Object.entries(m).map(e=>({c:e[0],v:e[1],p:Math.round((e[1]/tot)*100)})).sort((a,b)=>b.v-a.v);},[sRecs]);
  const heatRows=useMemo(()=>{const tasks=[...new Set(allRecs.filter(r=>r.staff===name).map(r=>r.task))];return tasks.map(task=>({task,cells:DNAMES.slice(1,7).map(day=>{const done=allRecs.filter(r=>r.staff===name&&r.task===task&&DNAMES[new Date(r.date).getDay()]===day&&r.mins>0);return{done:done.length>0,count:done.length,avgMins:done.length?avgArr(done.map(d=>d.mins)):0};})}));},[allRecs,name]);
  const wkTrend=useMemo(()=>{const wks=[...new Set(allRecs.filter(r=>r.staff===name).map(r=>"W"+r.week))].sort();return wks.map(wk=>({week:wk,hours:+(wkMins(allRecs,name,+wk.slice(1))/60).toFixed(1)}));},[allRecs,name]);
  const insights=useMemo(()=>genStaffInsights(name,recs,allRecs,period),[name,recs,allRecs,period]);
  const staffShift=shopConfig.staff.find(s=>s.name===name)?.shift||"";
  return <div style={{paddingBottom:90}}><PeriodToggle period={period} setPeriod={setPeriod}/><div style={{padding:"12px 16px 0"}}>
    <Card style={{marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}><Avatar name={name} size={52} color={color}/><div style={{flex:1}}><div style={{fontSize:20,fontWeight:800,color:T.text}}>{name}</div><div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}><Badge label={staffShift} type="neutral"/>{sub?<Badge label="✓ Today" type="good"/>:<Badge label="Not submitted today" type="flag"/>}</div></div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[{l:"PERIOD HRS",v:fmt(curr)||"—",s:<Chip p={pctChg(curr,prev)}/>,col:color},{l:"AVG SHIFT",v:fmt(avgShift)||"—",s:"all time",col:color},{l:"CONSISTENCY",v:sc!==null?sc+"/100":"—",s:"reliability",col:sc>70?T.green:sc>40?T.amber:T.red}].map(k=><div key={k.l} style={{background:T.bg,borderRadius:12,padding:"10px 8px"}}><div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:4}}>{k.l}</div><div style={{fontSize:16,fontWeight:800,color:k.col}}>{k.v}</div><div style={{fontSize:11,color:T.muted,marginTop:2}}>{k.s}</div></div>)}</div>
    </Card>
    <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:2}}>{["overview","tasks","heatmap","trends"].map(t=><button key={t} onClick={()=>setTab(t)} style={{background:tab===t?color:T.card,color:tab===t?"#fff":T.sub,border:`1px solid ${tab===t?color:T.border}`,borderRadius:20,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>)}</div>
    {tab==="overview"&&<>
      <Card style={{marginBottom:14}}>{[{l:"This Period",v:curr,col:color},{l:"Previous",v:prev,col:"#E5E7EB"}].map(row=><div key={row.l} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:600,color:T.sub}}>{row.l}</span><span style={{fontSize:13,fontWeight:800}}>{fmt(row.v)||"0m"}</span></div><PBar val={row.v} max={Math.max(curr,prev,1)} color={row.col}/></div>)}<div style={{display:"flex",justifyContent:"flex-end",marginTop:4}}><Chip p={pctChg(curr,prev)}/></div></Card>
      <Lbl>Time by Category</Lbl><Card style={{marginBottom:14}}>{catBreak.map(c=><div key={c.c} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:600,color:T.sub}}>{c.c}</span><span style={{fontSize:13,fontWeight:700}}>{fmt(c.v)} <span style={{color:T.muted,fontWeight:400}}>({c.p}%)</span></span></div><PBar val={c.p} max={100} color={color}/></div>)}{!catBreak.length&&<p style={{color:T.muted,fontSize:14,margin:0}}>No data for this period.</p>}</Card>
      {miss30.length>0&&<><Lbl>Missing Submissions</Lbl><Card style={{marginBottom:14}}><div style={{fontSize:22,fontWeight:800,color:T.red,marginBottom:8}}>{miss30.length} <span style={{fontSize:13,color:T.muted,fontWeight:400}}>days</span></div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{miss30.slice(0,8).map(d=><span key={d} style={{background:T.redLight,color:T.red,fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:20}}>{new Date(d).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}</span>)}{miss30.length>8&&<span style={{fontSize:12,color:T.muted,padding:"4px 8px"}}>+{miss30.length-8} more</span>}</div></Card></>}
      <Lbl>Owner Insights</Lbl><Card style={{marginBottom:14}}>{insights.map((item,i)=><InsightRow key={i} item={item}/>)}</Card>
    </>}
    {tab==="tasks"&&<><Lbl>All Tasks · Tap for detail</Lbl>
      {myTasks.map(t=><Card key={t.task} style={{marginBottom:8}} onPress={()=>onNav("taskDetail",{task:t.task,staff:name})}><div style={{display:"flex",alignItems:"flex-start",gap:10}}><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:T.text}}>{t.task}</div><div style={{fontSize:12,color:T.muted}}>{t.cat} · {t.count} sessions</div>{t.notes.length>0&&<NoteTag note={t.notes[t.notes.length-1].note}/>}</div><div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:16,fontWeight:800,color:t.diff>0?T.red:t.diff<0?T.green:T.text}}>{t.avg}m</div>{t.teamAvg&&<div style={{fontSize:11,color:T.muted}}>avg {t.teamAvg}m</div>}</div>{t.diff!==0&&<Badge label={t.diff>0?t.diff+"% slower":Math.abs(t.diff)+"% faster"} type={t.diff>0?"flag":"good"}/>}<span style={{fontSize:16,color:T.muted}}>›</span></div></Card>)}
      {!myTasks.length&&<p style={{color:T.muted,fontSize:14,textAlign:"center",padding:"32px 0"}}>No tasks for this period.</p>}
    </>}
    {tab==="heatmap"&&<><Lbl>Task Completion Heatmap (All Time)</Lbl><Card style={{marginBottom:14,overflowX:"auto"}}>{heatRows.length>0?<div style={{overflowX:"auto"}}><table style={{borderCollapse:"collapse",width:"100%",fontSize:11}}><thead><tr><th style={{textAlign:"left",color:T.muted,fontWeight:700,paddingRight:8,paddingBottom:6,whiteSpace:"nowrap"}}>Task</th>{["Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><th key={d} style={{color:T.muted,fontWeight:700,paddingBottom:6,textAlign:"center",minWidth:34}}>{d}</th>)}</tr></thead><tbody>{heatRows.map(row=><tr key={row.task}><td style={{paddingRight:8,paddingBottom:4,color:T.sub,fontWeight:600,whiteSpace:"nowrap",fontSize:11,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis"}}>{row.task}</td>{row.cells.map((cell,i)=><td key={i} style={{textAlign:"center",paddingBottom:4}}><div style={{width:28,height:28,borderRadius:7,margin:"0 auto",background:cell.done?(cell.avgMins>60?"#FEE2E2":cell.avgMins>30?"#FEF3C7":"#DCFCE7"):"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,border:cell.done?"1px solid rgba(0,0,0,0.06)":"none"}}>{cell.done?(cell.avgMins>60?"🔴":cell.avgMins>30?"🟡":"🟢"):""}</div></td>)}</tr>)}</tbody></table><div style={{display:"flex",gap:12,marginTop:10,fontSize:11,color:T.muted}}><span>🟢 &lt;30m</span><span>🟡 30–60m</span><span>🔴 &gt;60m</span></div></div>:<p style={{color:T.muted,fontSize:14,margin:0}}>No data yet.</p>}</Card></>}
    {tab==="trends"&&<>
      {wkTrend.length>1&&<><Lbl>Weekly Hours Trend</Lbl><Card style={{marginBottom:14,padding:"16px 8px 8px"}}><ResponsiveContainer width="100%" height={180}><LineChart data={wkTrend} margin={{left:0,right:8,top:4,bottom:8}}><CartesianGrid strokeDasharray="3 3" stroke={T.div}/><XAxis dataKey="week" tick={{fontSize:11,fill:T.muted}}/><YAxis tick={{fontSize:11,fill:T.muted}} width={24}/><Tooltip formatter={v=>[v+"h"]} contentStyle={{borderRadius:12,border:`1px solid ${T.border}`,fontSize:13}}/><Line type="monotone" dataKey="hours" stroke={color} strokeWidth={3} dot={{fill:color,r:4}}/></LineChart></ResponsiveContainer></Card></>}
      <Lbl>Recent Shifts</Lbl><Card>{Object.entries(sm).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,10).map((e,i)=><div key={e[0]} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderTop:i===0?"none":`1px solid ${T.div}`}}><span style={{fontSize:14,color:T.sub}}>{new Date(e[0]).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}</span><span style={{fontSize:14,fontWeight:700,color:e[1]>=300?T.green:e[1]>=180?color:T.red}}>{fmt(e[1])}</span></div>)}{!Object.keys(sm).length&&<p style={{color:T.muted,fontSize:14,margin:0}}>No shifts yet.</p>}</Card>
    </>}
  </div></div>;
}

function TaskDetail({task,staffName,allRecs,shopConfig}){
  const staffIdx=shopConfig.staff.findIndex(s=>s.name===staffName);const color=SC[staffIdx%SC.length];
  const sRecs=allRecs.filter(r=>r.staff===staffName&&r.task===task&&r.mins>0);
  const ta=teamTaskAvg(allRecs,task);const sa=staffTaskAvg(allRecs,staffName,task);
  const diff=ta&&sa?Math.round(((sa-ta)/ta)*100):null;
  const best=bestDayFor(allRecs.filter(r=>r.staff===staffName),task);
  const dayTrend=taskDayTrendData(allRecs.filter(r=>r.staff===staffName),task).filter(d=>d.mins!==null);
  const allAvgs=shopConfig.staff.map((s,i)=>({n:s.name,avg:staffTaskAvg(allRecs,s.name,task)||0,color:SC[i%SC.length]})).filter(s=>s.avg>0);
  const sessions=sRecs.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,15);
  return <div style={{padding:"12px 16px 90px"}}>
    <Card style={{marginBottom:14}}><div style={{fontSize:18,fontWeight:800,color:T.text,marginBottom:4}}>{task}</div><div style={{fontSize:13,color:T.muted,marginBottom:14}}>{staffName} · {sRecs.length} sessions</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[{l:"STAFF AVG",v:sa?sa+"m":"—",col:color},{l:"TEAM AVG",v:ta?ta+"m":"—",col:T.sub},{l:"DIFF",v:diff!==null?(diff>0?"+":"")+diff+"%":"—",col:diff>15?T.red:diff<-15?T.green:T.text}].map(s=><div key={s.l} style={{background:T.bg,borderRadius:12,padding:"10px 8px",textAlign:"center"}}><div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:4}}>{s.l}</div><div style={{fontSize:18,fontWeight:800,color:s.col}}>{s.v}</div></div>)}</div></Card>
    {allAvgs.length>1&&<><Lbl>All Staff Comparison</Lbl><Card style={{marginBottom:14,padding:"16px 8px 8px"}}><ResponsiveContainer width="100%" height={150}><BarChart data={allAvgs.map(s=>({name:s.n,mins:s.avg,color:s.color}))} margin={{left:0,right:8,top:4,bottom:8}}><CartesianGrid strokeDasharray="3 3" stroke={T.div}/><XAxis dataKey="name" tick={{fontSize:12,fill:T.sub,fontWeight:700}}/><YAxis tick={{fontSize:11,fill:T.muted}} width={24}/><Tooltip formatter={v=>[v+" mins"]} contentStyle={{borderRadius:12,border:`1px solid ${T.border}`,fontSize:13}}/><Bar dataKey="mins" radius={[6,6,0,0]}>{allAvgs.map((s,i)=><Cell key={i} fill={s.color}/>)}</Bar></BarChart></ResponsiveContainer></Card></>}
    {dayTrend.length>1&&<><Lbl>Avg Time by Day</Lbl><Card style={{marginBottom:14,padding:"16px 8px 8px"}}><ResponsiveContainer width="100%" height={150}><BarChart data={dayTrend} margin={{left:0,right:8,top:4,bottom:8}}><CartesianGrid strokeDasharray="3 3" stroke={T.div}/><XAxis dataKey="day" tick={{fontSize:12,fill:T.sub}}/><YAxis tick={{fontSize:11,fill:T.muted}} width={24}/><Tooltip formatter={v=>[v+" mins"]} contentStyle={{borderRadius:12,border:`1px solid ${T.border}`,fontSize:13}}/><Bar dataKey="mins" radius={[6,6,0,0]}>{dayTrend.map((d,i)=><Cell key={i} fill={best&&d.day===best.day?"#22C55E":d.mins>60?"#FCA5A5":d.mins>30?"#FCD34D":color}/>)}</Bar></BarChart></ResponsiveContainer>{best&&<div style={{fontSize:12,color:T.green,fontWeight:600,textAlign:"center",marginTop:6}}>Fastest on {best.day}s</div>}</Card></>}
    <Lbl>Session History</Lbl><Card>{sessions.map((s,i)=><div key={i} style={{padding:"12px 0",borderTop:i===0?"none":`1px solid ${T.div}`}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,color:T.sub}}>{new Date(s.date).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}</span><span style={{fontSize:14,fontWeight:700,color:ta&&s.mins>ta*1.3?T.red:ta&&s.mins<ta*0.7?T.green:T.text}}>{s.mins}m</span></div>{s.notes&&<NoteTag note={s.notes}/>}</div>)}{!sessions.length&&<p style={{color:T.muted,fontSize:14,margin:0}}>No sessions yet.</p>}</Card>
  </div>;
}

function ActionsTab({shopConfig,shopId}){
  const [selStaff,setSelStaff]=useState(null);const [schedule,setSchedule]=useState(null);const [loadingS,setLoadingS]=useState(false);const [saving,setSaving]=useState(false);const [saveStatus,setSaveStatus]=useState(null);const [selDay,setSelDay]=useState(ALL_DAYS[new Date().getDay()===0?6:new Date().getDay()-1]);const [adding,setAdding]=useState(false);const [newTask,setNewTask]=useState("");const [confirmTask,setConfirmTask]=useState(null);
  // Reset everything when the active shop changes
  useEffect(()=>{setSelStaff(null);setSchedule(null);setSaveStatus(null);setAdding(false);setNewTask("");},[shopId]);
  // Fetch schedule when a staff member is selected for the current shop
  useEffect(()=>{if(!selStaff||!shopId)return;setLoadingS(true);setSchedule(null);fetchSchedule(shopId,shopConfig.sector).then(s=>{setSchedule(s);setLoadingS(false);}).catch(()=>{setSchedule(JSON.parse(JSON.stringify(SECTOR_DEFAULTS[shopConfig.sector]||SECTOR_DEFAULTS.convenience)));setLoadingS(false);});},[selStaff,shopId]);
  // Staff-specific tasks first, then sector default for the day, then empty
  const todayTasks=schedule&&selStaff&&schedule[selDay]?(schedule[selDay][selStaff]!==undefined?schedule[selDay][selStaff]:schedule[selDay]._all||[]):[];
  const unusedTasks=TASK_POOL.filter(t=>!todayTasks.includes(t));
  const existingId=schedule&&schedule[selDay]&&schedule[selDay]._ids?schedule[selDay]._ids[selStaff]||null:null;
  function persistChange(newTasks){setSaving(true);setSaveStatus(null);saveScheduleToAirtable(schedule,shopId,selDay,selStaff,newTasks,existingId).then(newId=>{setSchedule(prev=>{const u=JSON.parse(JSON.stringify(prev));if(!u[selDay]._ids)u[selDay]._ids={};u[selDay]._ids[selStaff]=newId;return u;});setSaveStatus("ok");setSaving(false);setTimeout(()=>setSaveStatus(null),2500);}).catch(()=>{setSaveStatus("err");setSaving(false);setTimeout(()=>setSaveStatus(null),2500);});}
  function removeTask(task){const nt=todayTasks.filter(t=>t!==task);setSchedule(prev=>{const u=JSON.parse(JSON.stringify(prev));if(!u[selDay])u[selDay]={};u[selDay][selStaff]=nt;return u;});persistChange(nt);}
  function addTask(t){if(!t.trim())return;if(todayTasks.includes(t)){setNewTask("");setAdding(false);return;}const nt=[...todayTasks,t];setSchedule(prev=>{const u=JSON.parse(JSON.stringify(prev));if(!u[selDay])u[selDay]={};u[selDay][selStaff]=nt;return u;});persistChange(nt);setNewTask("");setAdding(false);}
  const staffIdx=selStaff?shopConfig.staff.findIndex(s=>s.name===selStaff):0;
  const staffColor=SC[staffIdx%SC.length];
  if(!selStaff)return <div style={{padding:"16px 16px 90px"}}><div style={{fontSize:20,fontWeight:800,color:T.text,marginBottom:4}}>Actions</div><div style={{fontSize:14,color:T.sub,marginBottom:20}}>Edit each staff member's daily task schedule.</div>{shopConfig.staff.map((s,i)=><Card key={s.name} style={{marginBottom:10}} onPress={()=>setSelStaff(s.name)}><div style={{display:"flex",alignItems:"center",gap:12}}><Avatar name={s.name} size={46} color={SC[i%SC.length]}/><div style={{flex:1}}><div style={{fontSize:16,fontWeight:800,color:T.text}}>{s.name}</div><div style={{fontSize:13,color:T.muted}}>{s.shift} shift · Tap to edit schedule</div></div><span style={{fontSize:20,color:T.muted}}>›</span></div></Card>)}<div style={{marginTop:20,background:T.greenLight,borderRadius:12,padding:"14px 16px",border:"1px solid #BBF7D0"}}><div style={{fontSize:13,fontWeight:700,color:T.green,marginBottom:4}}>✅ Airtable Sync Active</div><div style={{fontSize:13,color:T.green,lineHeight:1.6}}>Schedules save instantly. Staff see updates next time they open the app.</div></div></div>;
  return <div style={{padding:"0 16px 90px"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 0 12px"}}><button onClick={()=>setSelStaff(null)} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"6px 12px",cursor:"pointer",color:T.text,fontSize:13,fontWeight:700}}>← Back</button><Avatar name={selStaff} size={36} color={staffColor}/><div style={{flex:1}}><div style={{fontSize:16,fontWeight:800,color:T.text}}>{selStaff} Schedule</div><div style={{fontSize:12,color:T.muted}}>{shopConfig.staff.find(s=>s.name===selStaff)?.shift} shift</div></div>{saving&&<span style={{fontSize:12,color:T.muted}}>Saving…</span>}{saveStatus==="ok"&&<span style={{fontSize:12,color:T.green,fontWeight:700}}>✓ Synced</span>}{saveStatus==="err"&&<span style={{fontSize:12,color:T.red,fontWeight:700}}>⚠ Failed</span>}</div>
    <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:2}}>{ALL_DAYS.map(d=><button key={d} onClick={()=>setSelDay(d)} style={{background:selDay===d?staffColor:"#fff",color:selDay===d?"#fff":T.sub,border:`1px solid ${selDay===d?staffColor:T.border}`,borderRadius:20,padding:"8px 14px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{d.slice(0,3)}</button>)}</div>
    {loadingS?<div style={{display:"flex",alignItems:"center",gap:10,padding:"24px 0",color:T.muted,fontSize:14}}><div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${T.div}`,borderTop:`2px solid ${T.accent}`,animation:"spin 0.8s linear infinite"}}/>Loading from Airtable…</div>:<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><Lbl>{selDay} Tasks ({todayTasks.length})</Lbl><button onClick={()=>setAdding(true)} style={{background:T.accent,color:"#fff",border:"none",borderRadius:20,padding:"6px 14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add</button></div>
      {adding&&<Card style={{marginBottom:12,border:`1px solid ${T.accent}`}}><div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:10}}>Add task for {selDay}</div><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{unusedTasks.slice(0,12).map(t=><button key={t} onClick={()=>addTask(t)} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:600,color:T.sub,cursor:"pointer"}}>{t}</button>)}</div><div style={{display:"flex",gap:8}}><input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addTask(newTask);}} placeholder="Or type a custom task…" style={{flex:1,padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:14,color:T.text}}/><button onClick={()=>addTask(newTask)} style={{background:T.accent,color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Add</button></div><button onClick={()=>setAdding(false)} style={{background:"none",border:"none",color:T.muted,fontSize:13,cursor:"pointer",marginTop:8,padding:0}}>Cancel</button></Card>}
      <Card>{todayTasks.length===0&&<p style={{color:T.muted,fontSize:14,margin:0}}>No tasks for {selDay}. Tap + Add.</p>}{todayTasks.map((task,i)=><div key={task} style={{display:"flex",alignItems:"center",gap:10,padding:"13px 0",borderTop:i===0?"none":`1px solid ${T.div}`}}><div style={{width:10,height:10,borderRadius:"50%",background:T.accent,flexShrink:0}}/><span style={{flex:1,fontSize:14,fontWeight:600,color:T.text}}>{task}</span><button onClick={()=>setConfirmTask(task)} disabled={saving} style={{background:T.redLight,color:T.red,border:"none",borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:700,cursor:"pointer",opacity:saving?0.5:1}}>Remove</button></div>)}</Card>
    </>}
    {confirmTask&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={()=>setConfirmTask(null)}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:480,margin:"0 auto"}}><div style={{width:40,height:4,borderRadius:99,background:"#E5E7EB",margin:"0 auto 20px"}}/><div style={{fontSize:17,fontWeight:800,color:T.text,marginBottom:8,textAlign:"center"}}>Remove Task?</div><div style={{fontSize:14,color:T.sub,textAlign:"center",marginBottom:24,lineHeight:1.6}}>Remove "{confirmTask}" from {selStaff}'s {selDay} schedule?</div><div style={{display:"flex",gap:10}}><button onClick={()=>setConfirmTask(null)} style={{flex:1,padding:"14px",borderRadius:14,background:T.bg,color:T.sub,fontSize:15,fontWeight:700,border:`1px solid ${T.border}`,cursor:"pointer"}}>Cancel</button><button onClick={()=>{removeTask(confirmTask);setConfirmTask(null);}} style={{flex:1,padding:"14px",borderRadius:14,background:T.red,color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer"}}>Remove</button></div></div></div>}
  </div>;
}

function ManageTab({shops,ownerId,onShopsUpdated}){
  const [view,setView]=useState("list");const [editShop,setEditShop]=useState(null);const [saving,setSaving]=useState(false);const [saveMsg,setSaveMsg]=useState(null);
  const [fName,setFName]=useState("");const [fId,setFId]=useState("");const [fSector,setFSector]=useState("convenience");const [fHours,setFHours]=useState("6");const [fPin,setFPin]=useState("0000");const [fStaff,setFStaff]=useState([]);
  const [nName,setNName]=useState("");const [nPin,setNPin]=useState("");const [nShift,setNShift]=useState("morning");
  const openEdit=shop=>{setEditShop(shop);setFName(shop.shopName);setFId(shop.shopId);setFSector(shop.sector);setFHours(String(shop.shiftHours));setFPin(shop.ownerPin||"0000");setFStaff([...shop.staff]);setView("edit");};
  const openAdd=()=>{setEditShop(null);setFName("");setFId("");setFSector("convenience");setFHours("6");setFPin("0000");setFStaff([]);setView("add");};
  const addStaff=()=>{if(!nName.trim()||nPin.length!==4)return;setFStaff(p=>[...p,{name:nName.trim(),pin:nPin,initials:nName.trim().slice(0,2).toUpperCase(),shift:nShift}]);setNName("");setNPin("");setNShift("morning");};
  const handleSave=async()=>{if(!fName.trim()||!fId.trim())return;setSaving(true);setSaveMsg(null);try{const data={shopId:fId.trim().toLowerCase().replace(/\s+/g,"_"),shopName:fName.trim(),sector:fSector,shiftHours:parseInt(fHours)||6,staff:fStaff,ownerPin:fPin,ownerId};if(editShop)await updateShop(editShop.id,data);else await createShop(data);setSaveMsg("ok");await onShopsUpdated();setTimeout(()=>{setSaveMsg(null);setView("list");},1500);}catch(e){setSaveMsg(e.message||"Save failed");}finally{setSaving(false);}};
  const inp={width:"100%",padding:"12px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:15,color:T.text,boxSizing:"border-box",marginBottom:12,outline:"none"};
  const lbl={display:"block",fontSize:13,fontWeight:700,color:T.sub,marginBottom:6};
  if(view==="list")return <div style={{padding:"16px 16px 90px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><div style={{fontSize:20,fontWeight:800,color:T.text}}>Manage Businesses</div><button onClick={openAdd} style={{background:"#111",color:"#fff",border:"none",borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add Business</button></div>
    <div style={{fontSize:14,color:T.muted,marginBottom:20}}>Edit settings and staff for each of your businesses.</div>
    {shops.map((shop,i)=>{const staffUrl=`https://timesheet-staff-retail-intelligence.vercel.app/?shop=${shop.shopId}`;return <Card key={shop.shopId} style={{marginBottom:10}} onPress={()=>openEdit(shop)}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:44,height:44,borderRadius:12,background:SC[i%SC.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{SECTOR_ICONS[shop.sector]||"🏢"}</div><div style={{flex:1}}><div style={{fontSize:15,fontWeight:800,color:T.text}}>{shop.shopName}</div><div style={{fontSize:12,color:T.muted,textTransform:"capitalize"}}>{shop.sector} · {shop.staff.length} staff · {shop.shiftHours}h shifts</div><div style={{fontSize:11,color:T.blue,marginTop:4,wordBreak:"break-all",lineHeight:1.5}}>📲 Staff link: {staffUrl}</div></div><span style={{fontSize:20,color:T.muted,flexShrink:0}}>›</span></div></Card>;})}
    {!shops.length&&<p style={{color:T.muted,fontSize:14,textAlign:"center",padding:"32px 0"}}>No businesses yet. Tap + Add Business.</p>}
    <div style={{marginTop:20,background:T.blueLight,borderRadius:12,padding:"14px 16px",border:"1px solid #BFDBFE"}}><div style={{fontSize:13,fontWeight:700,color:T.blue,marginBottom:4}}>🔗 Your Owner Dashboard Link</div><div style={{fontSize:13,color:T.blue,lineHeight:1.6,wordBreak:"break-all"}}>https://timesheet-owner-retail-intelligence.vercel.app/?owner={ownerId}</div><div style={{fontSize:12,color:T.blue,marginTop:6,opacity:0.7}}>Bookmark this. Each owner gets their own unique link.</div></div>
  </div>;
  return <div style={{padding:"16px 16px 90px"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}><button onClick={()=>setView("list")} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"6px 12px",cursor:"pointer",color:T.text,fontSize:13,fontWeight:700}}>← Back</button><div style={{fontSize:18,fontWeight:800,color:T.text}}>{view==="edit"?"Edit Business":"Add New Business"}</div></div>
    <label style={lbl}>Shop Name</label><input style={inp} value={fName} onChange={e=>setFName(e.target.value)} placeholder="e.g. Londis Horden"/>
    <label style={lbl}>Shop ID (used in staff URL)</label><input style={inp} value={fId} onChange={e=>setFId(e.target.value)} placeholder="e.g. londis_horden" disabled={view==="edit"}/>
    {view==="add"&&<div style={{fontSize:12,color:T.muted,marginTop:-8,marginBottom:12}}>Staff URL: yourapp.vercel.app/?shop={fId||"your_id"}</div>}
    <label style={lbl}>Sector</label><select style={inp} value={fSector} onChange={e=>setFSector(e.target.value)}><option value="convenience">🏪 Convenience Store</option><option value="gym">🏋️ Gym / Fitness</option><option value="cafe">☕ Cafe / Coffee Shop</option></select>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lbl}>Shift Hours</label><input style={inp} type="number" value={fHours} onChange={e=>setFHours(e.target.value)} min="1" max="12"/></div><div><label style={lbl}>Owner PIN</label><input style={inp} type="text" maxLength={4} value={fPin} onChange={e=>setFPin(e.target.value)} placeholder="0000"/></div></div>
    <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:12,marginTop:4}}>Staff Members</div>
    {fStaff.map((st,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.bg,borderRadius:10,padding:"10px 14px",marginBottom:8}}><Avatar name={st.name} size={32} color={SC[i%SC.length]}/><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:T.text}}>{st.name}</div><div style={{fontSize:12,color:T.muted}}>PIN: {st.pin} · {st.shift}</div></div><button onClick={()=>setFStaff(p=>p.filter((_,j)=>j!==i))} style={{background:T.redLight,color:T.red,border:"none",borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Remove</button></div>)}
    <div style={{background:T.bg,borderRadius:12,padding:"14px",marginBottom:16,border:`1px dashed ${T.border}`}}><div style={{fontSize:13,fontWeight:700,color:T.sub,marginBottom:10}}>Add Staff Member</div><input style={{...inp,marginBottom:8}} value={nName} onChange={e=>setNName(e.target.value)} placeholder="Name"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><input style={{...inp,marginBottom:8}} type="text" maxLength={4} value={nPin} onChange={e=>setNPin(e.target.value)} placeholder="4-digit PIN"/><select style={{...inp,marginBottom:8}} value={nShift} onChange={e=>setNShift(e.target.value)}><option value="morning">Morning</option><option value="evening">Evening</option><option value="full">Full Day</option></select></div><button onClick={addStaff} style={{background:T.accent,color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer",width:"100%"}}>+ Add to Staff List</button></div>
    {saveMsg==="ok"&&<div style={{background:T.greenLight,color:T.green,borderRadius:10,padding:"12px 16px",fontSize:14,fontWeight:700,marginBottom:12}}>✓ Saved successfully!</div>}
    {saveMsg&&saveMsg!=="ok"&&<div style={{background:T.redLight,color:T.red,borderRadius:10,padding:"12px 16px",fontSize:14,marginBottom:12}}>⚠️ {saveMsg}</div>}
    <button onClick={handleSave} disabled={saving||!fName.trim()||!fId.trim()} style={{display:"block",width:"100%",background:saving?"#9ca3af":"#111",color:"#fff",border:"none",padding:"18px",borderRadius:12,fontSize:16,fontWeight:700,cursor:"pointer"}}>{saving?"Saving…":"Save Shop"}</button>
  </div>;
}

export default function App(){
  const ownerId=getOwnerIdFromURL();
  const [shops,setShops]=useState([]);const [allShops,setAllShops]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(null);
  const [currentShopId,setCurrentShopId]=useState(null);const [myRecs,setMyRecs]=useState([]);const [allShifts,setAllShifts]=useState([]);const [dataLoading,setDataLoading]=useState(false);
  const [showSwitcher,setShowSwitcher]=useState(false);const [bottomTab,setBottomTab]=useState("home");const [subNav,setSubNav]=useState(null);
  const expDays=useMemo(()=>expDaysArr(30),[]);
  const now=new Date();const greeting=now.getHours()<12?"Good morning":now.getHours()<17?"Good afternoon":"Good evening";

  const loadShops=async()=>{if(!ownerId){setError("No owner ID in URL. Add ?owner=your_id");return[];}try{const [ownerShops,all]=await Promise.all([fetchOwnerShops(ownerId),fetchAllShops()]);setShops(ownerShops);setAllShops(all);if(!currentShopId&&ownerShops.length>0)setCurrentShopId(ownerShops[0].shopId);return ownerShops;}catch(e){setError(e.message);return[];}};

  useEffect(()=>{setLoading(true);loadShops().finally(()=>setLoading(false));},[]); // eslint-disable-line
  useEffect(()=>{if(!currentShopId)return;setDataLoading(true);Promise.all([fetchShiftsForShop(currentShopId),fetchAllShifts()]).then(([s,a])=>{setMyRecs(s);setAllShifts(a);}).catch(e=>console.error(e)).finally(()=>setDataLoading(false));},[currentShopId]);

  const currentShop=shops.find(s=>s.shopId===currentShopId);
  const ownedShopIds=shops.map(s=>s.shopId);
  function onNav(type,data){setSubNav({type,...(typeof data==="string"?{staff:data}:data)});window.scrollTo(0,0);}
  function goBack(){if(subNav?.type==="taskDetail")setSubNav({type:"staffDetail",staff:subNav.staff});else setSubNav(null);window.scrollTo(0,0);}
  const isSubPage=!!subNav;
  const subTitle=subNav?.type==="staffDetail"?subNav.staff:(subNav?.task?.length>22?subNav.task.slice(0,21)+"…":subNav?.task);

  if(loading)return <div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif"}}><div style={{textAlign:"center"}}><div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${T.div}`,borderTop:`3px solid ${T.accent}`,animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}/><p style={{color:T.muted,fontSize:15}}>Loading your shops…</p></div><style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style></div>;
  if(error)return <div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif",padding:16}}><div style={{background:T.redLight,border:"1px solid #FECACA",borderRadius:14,padding:20,color:T.red,fontSize:14,maxWidth:400,textAlign:"center"}}>⚠️ {error}<br/><br/><span style={{fontSize:12,color:T.muted}}>Make sure AT_SHOPS is set and ?owner=your_id is in the URL.</span></div></div>;

  return <div style={{background:T.bg,minHeight:"100vh",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif",maxWidth:480,margin:"0 auto"}}>
    <div style={{background:"#111",position:"sticky",top:0,zIndex:20,boxShadow:"0 2px 16px rgba(0,0,0,0.15)"}}>
      <div style={{padding:"14px 16px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {isSubPage&&<button onClick={goBack} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:10,padding:"6px 12px",cursor:"pointer",color:"#fff",fontSize:13,fontWeight:700,marginRight:4}}>← Back</button>}
          <div>{!isSubPage?<><div style={{fontSize:16,fontWeight:800,color:"#fff",letterSpacing:-0.3}}>{currentShop?`${SECTOR_ICONS[currentShop.sector]||"🏢"} ${currentShop.shopName}`:"StaffLog Owner"}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:1}}>{greeting} · {now.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</div></>:<><div style={{fontSize:16,fontWeight:800,color:"#fff"}}>{subTitle}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:1}}>{currentShop?.shopName}</div></>}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {shops.length>1&&!isSubPage&&<button onClick={()=>setShowSwitcher(true)} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,padding:"6px 12px",fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.7)",cursor:"pointer"}}>Switch ▾</button>}
          <button onClick={()=>{setDataLoading(true);Promise.all([fetchShiftsForShop(currentShopId),fetchAllShifts()]).then(([s,a])=>{setMyRecs(s);setAllShifts(a);}).finally(()=>setDataLoading(false));}} disabled={dataLoading} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,padding:"6px 12px",fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.7)",cursor:"pointer"}}>{dataLoading?"…":"↻"}</button>
        </div>
      </div>
    </div>
    {dataLoading&&!myRecs.length?<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"80px 0"}}><div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${T.div}`,borderTop:`3px solid ${T.accent}`,animation:"spin 0.8s linear infinite"}}/><p style={{color:T.muted,marginTop:16,fontSize:15}}>Loading shift data…</p></div>
    :!currentShop?<div style={{padding:16}}><Card><p style={{color:T.muted,fontSize:14,textAlign:"center",margin:0}}>No shops found. Go to Manage to add your first shop.</p></Card></div>
    :isSubPage?(subNav.type==="staffDetail"?<StaffDetail name={subNav.staff} allRecs={myRecs} expDays={expDays} onNav={onNav} shopConfig={currentShop}/>:<TaskDetail task={subNav.task} staffName={subNav.staff} allRecs={myRecs} shopConfig={currentShop}/>)
    :bottomTab==="home"?<HomeTab allRecs={myRecs} allShifts={allShifts} allShops={shops} shopConfig={currentShop} currentShopId={currentShopId} expDays={expDays}/>
    :bottomTab==="staff"?<StaffTab allRecs={myRecs} expDays={expDays} onNav={onNav} shopConfig={currentShop}/>
    :bottomTab==="actions"?<ActionsTab shopConfig={currentShop} shopId={currentShopId}/>
    :<ManageTab shops={shops} ownerId={ownerId} onShopsUpdated={async()=>{await loadShops();}}/>}
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:`1px solid ${T.border}`,display:"flex",zIndex:20,boxShadow:"0 -4px 20px rgba(0,0,0,0.08)"}}>
      {[{id:"home",icon:"🏠",label:"Home"},{id:"staff",icon:"👥",label:"Staff"},{id:"actions",icon:"✏️",label:"Actions"},{id:"manage",icon:"⚙️",label:"Businesses"}].map(tab=><button key={tab.id} onClick={()=>{setBottomTab(tab.id);setSubNav(null);window.scrollTo(0,0);}} style={{flex:1,background:"none",border:"none",padding:"12px 0 16px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><span style={{fontSize:20}}>{tab.icon}</span><span style={{fontSize:10,fontWeight:700,color:bottomTab===tab.id?T.accent:T.muted}}>{tab.label}</span>{bottomTab===tab.id&&!isSubPage&&<div style={{width:20,height:3,borderRadius:99,background:T.accent,marginTop:1}}/>}</button>)}
    </div>
    {showSwitcher&&<ShopSwitcher shops={shops} currentShopId={currentShopId} onSelect={id=>{setCurrentShopId(id);setMyRecs([]);}} onClose={()=>setShowSwitcher(false)}/>}
    <style>{"@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}body{margin:0}::-webkit-scrollbar{display:none}"}</style>
  </div>;
}
