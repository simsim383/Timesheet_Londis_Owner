import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";

const T={bg:"#F5F5F7",card:"#FFFFFF",border:"#F0F0F0",text:"#0A0A0A",sub:"#6B7280",muted:"#9CA3AF",accent:"#E07B39",accentLight:"#FDF0E8",green:"#16A34A",greenLight:"#F0FDF4",red:"#DC2626",redLight:"#FEF2F2",amber:"#D97706",amberLight:"#FFFBEB",blue:"#2563EB",blueLight:"#EFF6FF",div:"#F3F4F6",purple:"#7C3AED",purpleLight:"#F5F3FF"};
const SC=["#E07B39","#2563EB","#8B5CF6","#16A34A","#D97706","#DC2626","#0891B2"];
const SECTOR_ICONS={convenience:"🏪",gym:"🏋️",cafe:"☕",bar:"🍺",restaurant:"🍽️",hotel:"🏨",default:"🏢"};
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
  cafe:{Monday:{_all:["Opening Setup","Pastry Display","Milk Restock","Syrup Restock","Floor Sweep","Till Check"]},Tuesday:{_all:["Opening Setup","Pastry Display","Milk Restock","Machine Clean","Floor Sweep","Till Check"]},Wednesday:{_all:["Opening Setup","Pastry Display","Milk Restock","Syrup Restock","Window Clean","Till Check"]},Thursday:{_all:["Opening Setup","Pastry Display","Milk Restock","Machine Clean","Floor Sweep","Till Check"]},Friday:{_all:["Opening Setup","Pastry Display","Milk Restock","Syrup Restock","Deep Clean","Till Check"]},Saturday:{_all:["Opening Setup","Pastry Display","Milk Restock","Floor Sweep","Till Check"]},Sunday:{_all:["Opening Setup","Pastry Display","Milk Restock","Closing Clean"]}},
  bar:{Monday:{_all:["Opening Setup","Bar Stock Check","Glass Polish","Floor Sweep","Till Check","Cellar Check"]},Tuesday:{_all:["Opening Setup","Bar Stock Check","Glass Polish","Floor Sweep","Till Check","Fridge Restock"]},Wednesday:{_all:["Opening Setup","Bar Stock Check","Glass Polish","Cellar Check","Floor Sweep","Till Check"]},Thursday:{_all:["Opening Setup","Bar Stock Check","Glass Polish","Floor Sweep","Deep Clean","Till Check"]},Friday:{_all:["Opening Setup","Bar Stock Check","Glass Polish","Cellar Check","Floor Sweep","Till Check"]},Saturday:{_all:["Opening Setup","Bar Stock Check","Glass Polish","Floor Sweep","Till Check","Closing Clean"]},Sunday:{_all:["Opening Setup","Bar Stock Check","Glass Polish","Floor Sweep","Closing Clean"]}},
  restaurant:{Monday:{_all:["Opening Setup","Table Setup","Kitchen Prep","Floor Sweep","Fridge Temp Check","Till Check"]},Tuesday:{_all:["Opening Setup","Table Setup","Kitchen Prep","Floor Sweep","Stock Count","Till Check"]},Wednesday:{_all:["Opening Setup","Table Setup","Kitchen Prep","Floor Sweep","Fridge Temp Check","Till Check"]},Thursday:{_all:["Opening Setup","Table Setup","Kitchen Prep","Deep Clean","Floor Sweep","Till Check"]},Friday:{_all:["Opening Setup","Table Setup","Kitchen Prep","Fridge Temp Check","Floor Sweep","Till Check"]},Saturday:{_all:["Opening Setup","Table Setup","Kitchen Prep","Floor Sweep","Till Check","Closing Clean"]},Sunday:{_all:["Opening Setup","Table Setup","Kitchen Prep","Floor Sweep","Closing Clean"]}},
  hotel:{Monday:{_all:["Room Checks","Linen Restock","Reception Cover","Breakfast Setup","Lost Property Log","Maintenance Check"]},Tuesday:{_all:["Room Checks","Linen Restock","Reception Cover","Breakfast Setup","Stock Count","Maintenance Check"]},Wednesday:{_all:["Room Checks","Linen Restock","Reception Cover","Breakfast Setup","Deep Clean","Maintenance Check"]},Thursday:{_all:["Room Checks","Linen Restock","Reception Cover","Breakfast Setup","Lost Property Log","Maintenance Check"]},Friday:{_all:["Room Checks","Linen Restock","Reception Cover","Breakfast Setup","Stock Count","Maintenance Check"]},Saturday:{_all:["Room Checks","Linen Restock","Reception Cover","Breakfast Setup","Maintenance Check","Closing Check"]},Sunday:{_all:["Room Checks","Linen Restock","Reception Cover","Breakfast Setup","Closing Check"]}}
};
const DEFAULT_SCHEDULE=SECTOR_DEFAULTS.convenience;

async function atFetchAll(tableId,formula){let rows=[],offset=null;do{let url=`https://api.airtable.com/v0/${AT_BASE}/${tableId}?pageSize=100`;if(formula)url+=`&filterByFormula=${encodeURIComponent(formula)}`;if(offset)url+=`&offset=${encodeURIComponent(offset)}`;const r=await fetch(url,{headers:{"Authorization":`Bearer ${AT_TOKEN}`}});if(!r.ok){const e=await r.json();throw new Error(e?.error?.message||"Airtable fetch failed");}const d=await r.json();rows=[...rows,...d.records];offset=d.offset||null;}while(offset);return rows;}
function getOwnerIdFromURL(){return new URLSearchParams(window.location.search).get("owner")||null;}
function parseShop(r){return{id:r.id,shopId:r.fields["Shop ID"]||"",shopName:r.fields["Shop Name"]||"",sector:(r.fields["Sector"]||"convenience").toLowerCase(),shiftHours:parseInt(r.fields["Shift Hours"]||6),staff:(()=>{try{return JSON.parse(r.fields["Staff"]||"[]");}catch{return[];}})(),ownerPin:r.fields["Owner PIN"]||"0000",ownerId:r.fields["Owner ID"]||""};}
async function fetchOwnerShops(ownerId){const rows=await atFetchAll(AT_SHOPS,`AND({Active}=1,{Owner ID}="${ownerId}")`);return rows.map(parseShop);}
async function fetchAllShops(){const rows=await atFetchAll(AT_SHOPS,`{Active}=1`);return rows.map(parseShop);}
function parseRec(r){return{id:r.id,staff:r.fields["Staff Name"]||"",date:r.fields["Date"]||"",task:r.fields["Task Name"]||"",category:r.fields["Category"]||"",mins:Number(r.fields["Total Minutes"]||0),notes:r.fields["Task Notes"]||"",incident:r.fields["Shift Incident"]||"",week:Number(r.fields["Week Number"]||0),shopId:r.fields["Shop ID"]||"",shopName:r.fields["Store"]||"",sector:r.fields["Sector"]||""};}
async function fetchShiftsForShop(shopId){const rows=await atFetchAll(AT_SHIFTS,`{Shop ID}="${shopId}"`);return rows.map(parseRec).filter(r=>r.staff&&r.date);}
async function fetchAllShifts(){const rows=await atFetchAll(AT_SHIFTS);return rows.map(parseRec).filter(r=>r.staff&&r.date);}
async function fetchSchedule(shopId,sector,staffNames){
  const defaults=SECTOR_DEFAULTS[sector]||SECTOR_DEFAULTS.convenience;
  let rows=[];
  // Skip Shop ID filter entirely if it's a linked field - go straight to staff name filter
  if(staffNames&&staffNames.length>0){
    try{
      const orClauses=staffNames.map(n=>`{Staff Name}="${n}"`).join(",");
      rows=await atFetchAll(AT_TASKS,`OR(${orClauses})`);
    }catch(e){console.warn("Schedule fetch by staff name failed:",e);}
  }
  // If no staff names or that failed, try Shop ID as a last resort
  if(rows.length===0){
    try{rows=await atFetchAll(AT_TASKS,`{Shop ID}="${shopId}"`);}catch(e){console.warn("Schedule fetch by shop ID failed:",e);}
  }
  const sched=JSON.parse(JSON.stringify(defaults));
  rows.forEach(r=>{
    const staff=r.fields["Staff Name"],day=r.fields["Day"],tasks=r.fields["Tasks"],
      shiftStart=(r.fields["Shift Start"]||"").trim(),shiftEnd=(r.fields["Shift End"]||"").trim();
    // Sanitise record ID - must start with "rec" and contain no colons
    const recId=r.id&&r.id.startsWith("rec")&&!r.id.includes(":")?r.id:null;
    if(staff&&day&&recId){
      try{
        if(!sched[day])sched[day]={};
        if(tasks)sched[day][staff]=JSON.parse(tasks);
        if(!sched[day]._ids)sched[day]._ids={};
        sched[day]._ids[staff]=recId;
        if(shiftStart||shiftEnd){if(!sched[day]._times)sched[day]._times={};sched[day]._times[staff]={start:shiftStart,end:shiftEnd};}
      }catch(e){}
    }
  });
  return sched;
}

// ─── PERFORMANCE NOTES (stored in Shops table as JSON in Staff field extension) ─
// We store notes as a separate key in Airtable Shops: "Staff Notes" (Long text, JSON)
async function fetchStaffNotes(shopRecordId){
  const r=await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_SHOPS}/${shopRecordId}`,{headers:AT_HDR});
  if(!r.ok)return{};
  const d=await r.json();
  try{return JSON.parse(d.fields["Staff Notes"]||"{}");}catch{return{};}
}
async function saveStaffNotes(shopRecordId,notes){
  await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_SHOPS}/${shopRecordId}`,{method:"PATCH",headers:AT_HDR,body:JSON.stringify({fields:{"Staff Notes":JSON.stringify(notes)}})});
}

// ─── ABSENCES (stored in Shops table "Absences" field as JSON) ────────────────
async function fetchAbsences(shopRecordId){
  const r=await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_SHOPS}/${shopRecordId}`,{headers:AT_HDR});
  if(!r.ok)return{};
  const d=await r.json();
  try{return JSON.parse(d.fields["Absences"]||"{}");}catch{return{};}
}
async function saveAbsences(shopRecordId,absences){
  const r=await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_SHOPS}/${shopRecordId}`,{method:"PATCH",headers:AT_HDR,body:JSON.stringify({fields:{"Absences":JSON.stringify(absences)}})});
  if(!r.ok){const e=await r.json();throw new Error(e?.error?.message||"Save failed");}
  return r.json();
}
function saveScheduleToAirtable(sched,shopId,day,staff,tasks,existingId,shiftStart,shiftEnd){
  const s=(shiftStart||"").trim();const e=(shiftEnd||"").trim();
  // Never include Shop ID - it's a linked field and can't be written as plain text
  const fields={"Staff Name":staff,"Day":day,"Tasks":JSON.stringify(tasks),"Last Updated":new Date().toISOString().split("T")[0]};
  if(s)fields["Shift Start"]=s;
  if(e)fields["Shift End"]=e;
  // Only PATCH if existingId is a valid Airtable record ID (starts with "rec", no colons)
  const validId=existingId&&typeof existingId==="string"&&existingId.startsWith("rec")&&!existingId.includes(":")?existingId:null;
  if(validId){
    return fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_TASKS}/${validId}`,{method:"PATCH",headers:AT_HDR,body:JSON.stringify({fields})})
      .then(async r=>{if(!r.ok){const err=await r.json();throw new Error(err?.error?.message||"Save failed");}return validId;});
  }else{
    return fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_TASKS}`,{method:"POST",headers:AT_HDR,body:JSON.stringify({fields})})
      .then(async r=>{if(!r.ok){const err=await r.json();throw new Error(err?.error?.message||"Create failed");}return r.json();})
      .then(d=>d.id);
  }
}
async function createShop(data){const r=await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_SHOPS}`,{method:"POST",headers:AT_HDR,body:JSON.stringify({fields:{"Shop ID":data.shopId,"Shop Name":data.shopName,"Sector":data.sector,"Shift Hours":data.shiftHours,"Staff":JSON.stringify(data.staff),"Owner PIN":data.ownerPin,"Owner ID":data.ownerId,"Active":true}})});if(!r.ok){const e=await r.json();throw new Error(e?.error?.message||"Failed");}return r.json();}
async function updateShop(recordId,data){const r=await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_SHOPS}/${recordId}`,{method:"PATCH",headers:AT_HDR,body:JSON.stringify({fields:{"Shop Name":data.shopName,"Sector":data.sector,"Shift Hours":data.shiftHours,"Staff":JSON.stringify(data.staff),"Owner PIN":data.ownerPin}})});if(!r.ok){const e=await r.json();throw new Error(e?.error?.message||"Failed");}return r.json();}
async function deleteShop(recordId){const r=await fetch(`https://api.airtable.com/v0/${AT_BASE}/${AT_SHOPS}/${recordId}`,{method:"PATCH",headers:AT_HDR,body:JSON.stringify({fields:{"Active":false}})});if(!r.ok){const e=await r.json();throw new Error(e?.error?.message||"Failed");}return r.json();}

const fmt=m=>{if(!m)return"0m";const h=Math.floor(m/60),mn=m%60;return h>0?(h+"h"+(mn>0?" "+mn+"m":"")):(mn+"m");};
const avgArr=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0;

// ─── PAYROLL CSV EXPORT ───────────────────────────────────────────────────────
function exportPayrollCSV(allRecs, shopConfig, period) {
  const pLabel = {today:"Today",week:"This Week",month:"This Month"}[period];
  const recs = allRecs.filter(r => r.mins > 0);
  // Group by staff then by date
  const byStaff = {};
  recs.forEach(r => {
    if (!byStaff[r.staff]) byStaff[r.staff] = {};
    if (!byStaff[r.staff][r.date]) byStaff[r.staff][r.date] = 0;
    byStaff[r.staff][r.date] += r.mins;
  });
  const rows = [["Staff Name","Date","Hours","Minutes","Total Hours","Shift"]];
  Object.entries(byStaff).forEach(([staffName, dates]) => {
    const staffObj = shopConfig.staff.find(s => s.name === staffName);
    Object.entries(dates).sort(([a],[b])=>a.localeCompare(b)).forEach(([date, mins]) => {
      const h = Math.floor(mins/60), m = mins%60;
      rows.push([staffName, date, h, m, (mins/60).toFixed(2), staffObj?.shift||""]);
    });
    // Subtotal row
    const totalMins = Object.values(dates).reduce((a,b)=>a+b,0);
    rows.push([`TOTAL - ${staffName}`, "", "", "", (totalMins/60).toFixed(2), ""]);
    rows.push([]);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${shopConfig.shopName.replace(/\s+/g,"_")}_payroll_${pLabel.replace(/\s+/g,"_")}.csv`;
  a.click(); URL.revokeObjectURL(url);
}
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

// ─── BENCHMARK: LAYER 1 — PORTFOLIO (owner's own shops) ─────────────────────
function portfolioBenchmark(allShifts, allShops, currentShopId, ownedShopIds) {
  const siblings = ownedShopIds.filter(id => id !== currentShopId);
  if (!siblings.length) return null;
  // Build task averages per sibling shop
  const siblingData = siblings.map(shopId => {
    const shop = allShops.find(s => s.shopId === shopId);
    const recs = allShifts.filter(r => r.shopId === shopId && r.mins > 0);
    const taskAvgs = {};
    const taskGroups = {};
    recs.forEach(r => { if (!taskGroups[r.task]) taskGroups[r.task] = []; taskGroups[r.task].push(r.mins); });
    Object.entries(taskGroups).forEach(([t, v]) => { if (v.length >= 1) taskAvgs[t] = avgArr(v); });
    const submitDays = new Set(recs.map(r => r.date)).size;
    const taskVariety = new Set(recs.map(r => r.task)).size;
    return { shopId, shopName: shop?.shopName || shopId, taskAvgs, submitDays, taskVariety, recCount: recs.length };
  });
  // My own averages
  const myRecs = allShifts.filter(r => r.shopId === currentShopId && r.mins > 0);
  const myTaskAvgs = {};
  const myTaskGroups = {};
  myRecs.forEach(r => { if (!myTaskGroups[r.task]) myTaskGroups[r.task] = []; myTaskGroups[r.task].push(r.mins); });
  Object.entries(myTaskGroups).forEach(([t, v]) => { myTaskAvgs[t] = avgArr(v); });
  const mySubmitDays = new Set(allShifts.filter(r => r.shopId === currentShopId).map(r => r.date)).size;
  const myTaskVariety = new Set(myRecs.map(r => r.task)).size;
  return { siblingData, myTaskAvgs, mySubmitDays, myTaskVariety };
}

function genPortfolioInsights(myRecs, portfolio, allShops, currentShopId, period) {
  if (!portfolio || !portfolio.siblingData.length) return null;
  const pts = [];
  const pLabel = {today:"today",week:"this week",month:"this month"}[period];
  const myPeriodTaskAvgs = {};
  myRecs.filter(r => r.mins > 0).forEach(r => { if (!myPeriodTaskAvgs[r.task]) myPeriodTaskAvgs[r.task] = []; myPeriodTaskAvgs[r.task].push(r.mins); });
  // Per-sibling task comparisons
  portfolio.siblingData.forEach(sib => {
    if (sib.recCount < 2) return;
    let wins = [], flags = [];
    Object.entries(myPeriodTaskAvgs).forEach(([task, vals]) => {
      const myAvg = avgArr(vals); const sibAvg = sib.taskAvgs[task];
      if (!sibAvg) return;
      const diff = Math.round(((myAvg - sibAvg) / sibAvg) * 100);
      if (diff <= -15) wins.push({ task, diff, myAvg, sibAvg });
      if (diff >= 15) flags.push({ task, diff, myAvg, sibAvg });
    });
    wins.sort((a, b) => a.diff - b.diff);
    flags.sort((a, b) => b.diff - a.diff);
    if (wins.length) pts.push({ type: "good", text: `Faster than ${sib.shopName} on "${wins[0].task}" — ${wins[0].myAvg}m here vs ${wins[0].sibAvg}m there (${Math.abs(wins[0].diff)}% quicker).` });
    if (flags.length) pts.push({ type: "flag", text: `Slower than ${sib.shopName} on "${flags[0].task}" — ${flags[0].myAvg}m here vs ${flags[0].sibAvg}m there. Could ${sib.shopName}'s approach help?` });
  });
  // Overall ranking across owned shops for each shared task
  const allOwnedIds = [currentShopId, ...portfolio.siblingData.map(s => s.shopId)];
  const sharedTasks = Object.keys(myPeriodTaskAvgs).filter(t => portfolio.siblingData.some(s => s.taskAvgs[t]));
  if (sharedTasks.length >= 2) {
    const myOverallDiffs = sharedTasks.map(task => {
      const sibAvgs = portfolio.siblingData.map(s => s.taskAvgs[task]).filter(Boolean);
      if (!sibAvgs.length) return null;
      const portAvg = avgArr(sibAvgs);
      const myAvg = avgArr(myPeriodTaskAvgs[task]);
      return Math.round(((myAvg - portAvg) / portAvg) * 100);
    }).filter(v => v !== null);
    if (myOverallDiffs.length >= 2) {
      const avg = Math.round(myOverallDiffs.reduce((a, b) => a + b, 0) / myOverallDiffs.length);
      const currentShopName = allShops.find(s => s.shopId === currentShopId)?.shopName || "This shop";
      if (avg <= -10) pts.push({ type: "good", text: `${currentShopName} is your fastest location overall — ${Math.abs(avg)}% quicker than your other shops on average.` });
      else if (avg >= 10) pts.push({ type: "warn", text: `${currentShopName} is running ${avg}% slower than your other locations on average. Worth a closer look.` });
      else pts.push({ type: "insight", text: `${currentShopName} is performing in line with your other locations — consistent across your portfolio.` });
    }
  }
  if (!pts.length) pts.push({ type: "insight", text: `Not enough shared task data yet to compare across your locations. As staff log more shifts the comparisons will fill in.` });
  return pts;
}

// ─── BENCHMARK: LAYER 2 — SECTOR (anonymous external) ────────────────────────
function sectorBenchmark(allShifts, allShops, currentShopId, ownedShopIds, sector, period) {
  const sectorShopIds = new Set(allShops.filter(s => s.sector === sector).map(s => s.shopId));
  // External = sector shops NOT owned by this owner
  const externalShopIds = [...sectorShopIds].filter(id => !ownedShopIds.includes(id));
  if (!externalShopIds.length) return null;
  const allSectorRecs = allShifts.filter(r => sectorShopIds.has(r.shopId) && r.mins > 0);
  const extAllRecs = allShifts.filter(r => externalShopIds.includes(r.shopId) && r.mins > 0);
  const extPeriodRecs = filterPeriod(extAllRecs, period);
  // Task averages from external shops (all time for stability)
  const taskGroups = {}; extAllRecs.forEach(r => { if (!taskGroups[r.task]) taskGroups[r.task] = []; taskGroups[r.task].push(r.mins); });
  const taskAvgs = {}; Object.entries(taskGroups).forEach(([t, v]) => { if (v.length >= 2) taskAvgs[t] = avgArr(v); });
  // Submission consistency
  const extSubmitRates = {}; extPeriodRecs.forEach(r => { if (!extSubmitRates[r.shopId]) extSubmitRates[r.shopId] = new Set(); extSubmitRates[r.shopId].add(r.date); });
  const avgExtSubmitDays = Object.values(extSubmitRates).length ? avgArr(Object.values(extSubmitRates).map(s => s.size)) : null;
  // Task variety
  const extTaskCounts = extPeriodRecs.reduce((acc, r) => { if (!acc[r.shopId]) acc[r.shopId] = new Set(); acc[r.shopId].add(r.task); return acc; }, {});
  const avgExtTaskVariety = Object.values(extTaskCounts).length ? avgArr(Object.values(extTaskCounts).map(s => s.size)) : null;
  // Overall speed index vs external
  const myRecs = allShifts.filter(r => r.shopId === currentShopId && r.mins > 0);
  const myTaskAvgs = {}; const myTaskGroups = {};
  myRecs.forEach(r => { if (!myTaskGroups[r.task]) myTaskGroups[r.task] = []; myTaskGroups[r.task].push(r.mins); });
  Object.entries(myTaskGroups).forEach(([t, v]) => { myTaskAvgs[t] = avgArr(v); });
  const sharedDiffs = Object.entries(myTaskAvgs).map(([task, vals]) => { const ext = taskAvgs[task]; if (!ext) return null; return Math.round(((avgArr(vals) - ext) / ext) * 100); }).filter(v => v !== null);
  const overallSpeedDiff = sharedDiffs.length >= 2 ? Math.round(sharedDiffs.reduce((a, b) => a + b, 0) / sharedDiffs.length) : null;
  return { taskAvgs, avgExtSubmitDays, avgExtTaskVariety, overallSpeedDiff, sharedTaskCount: sharedDiffs.length, externalShopCount: externalShopIds.length, myTaskAvgs };
}

function genSectorInsights(myRecs, sectorBench, shopConfig, period) {
  if (!sectorBench || sectorBench.externalShopCount < 1) return [{ type: "info", text: `No external ${shopConfig.sector} businesses in the platform yet. Sector comparisons will appear once other businesses join.` }];
  const pts = [];
  const pLabel = {today:"today",week:"this week",month:"this month"}[period];
  const myTaskAvgs = {};
  myRecs.filter(r => r.mins > 0).forEach(r => { if (!myTaskAvgs[r.task]) myTaskAvgs[r.task] = []; myTaskAvgs[r.task].push(r.mins); });
  // Best and worst task vs external sector
  let biggestWin = null, biggestFlag = null;
  Object.entries(myTaskAvgs).forEach(([task, vals]) => {
    const myAvg = avgArr(vals); const extAvg = sectorBench.taskAvgs[task];
    if (!extAvg) return;
    const diff = Math.round(((myAvg - extAvg) / extAvg) * 100);
    if (diff < -10 && (!biggestWin || diff < biggestWin.diff)) biggestWin = { task, diff, myAvg, extAvg };
    if (diff > 10 && (!biggestFlag || diff > biggestFlag.diff)) biggestFlag = { task, diff, myAvg, extAvg };
  });
  if (biggestWin) pts.push({ type: "good", text: `Your team completes "${biggestWin.task}" ${Math.abs(biggestWin.diff)}% faster than other ${shopConfig.sector} businesses — ${biggestWin.myAvg}m vs the ${biggestWin.extAvg}m market average.` });
  if (biggestFlag) pts.push({ type: "flag", text: `"${biggestFlag.task}" takes ${biggestFlag.diff}% longer than the ${shopConfig.sector} market average — ${biggestFlag.myAvg}m vs ${biggestFlag.extAvg}m.` });
  // Overall speed vs sector
  if (sectorBench.overallSpeedDiff !== null && sectorBench.sharedTaskCount >= 2) {
    const d = sectorBench.overallSpeedDiff;
    if (d <= -10) pts.push({ type: "good", text: `Across ${sectorBench.sharedTaskCount} tasks, your team is ${Math.abs(d)}% faster than the ${shopConfig.sector} market average. A genuine competitive edge.` });
    else if (d >= 10) pts.push({ type: "warn", text: `Across ${sectorBench.sharedTaskCount} tasks, your team is ${d}% slower than the ${shopConfig.sector} market average.` });
    else pts.push({ type: "insight", text: `Across ${sectorBench.sharedTaskCount} tasks, your speed is in line with the broader ${shopConfig.sector} market.` });
  }
  // Submission consistency vs sector
  if (sectorBench.avgExtSubmitDays) {
    const myDays = new Set(myRecs.map(r => r.date)).size;
    if (myDays > 0) {
      const diff = pctChg(myDays, sectorBench.avgExtSubmitDays);
      if (diff !== null && Math.abs(diff) > 15) {
        if (diff > 0) pts.push({ type: "good", text: `Your staff log shifts on more days than other ${shopConfig.sector} businesses — ${diff}% above market average.` });
        else pts.push({ type: "warn", text: `Your staff are logging on ${Math.abs(diff)}% fewer days than the ${shopConfig.sector} average. Some shifts may be going untracked.` });
      }
    }
  }
  if (!pts.length) pts.push({ type: "insight", text: `Your performance is closely in line with the ${shopConfig.sector} market. Keep collecting data for deeper insights.` });
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

function HomeTab({allRecs,allShifts,allShops,shopConfig,currentShopId,ownedShopIds,expDays,dataLoading}){
  const [period,setPeriod]=useState("today");
  const recs=useMemo(()=>filterPeriod(allRecs,period),[allRecs,period]);
  const prevRecs=useMemo(()=>filterPrev(allRecs,period),[allRecs,period]);
  const staffNames=shopConfig.staff.map(s=>s.name);
  const sdm=useMemo(()=>staffDatesMap(allRecs,staffNames),[allRecs]);
  const summary=useMemo(()=>genSummary(recs,period,staffNames),[recs,period]);
  const portfolio=useMemo(()=>portfolioBenchmark(allShifts,allShops,currentShopId,ownedShopIds),[allShifts,allShops,currentShopId,ownedShopIds]);
  const portfolioInsights=useMemo(()=>genPortfolioInsights(recs,portfolio,allShops,currentShopId,period),[recs,portfolio,period]);
  const sectBench=useMemo(()=>sectorBenchmark(allShifts,allShops,currentShopId,ownedShopIds,shopConfig.sector,period),[allShifts,allShops,currentShopId,ownedShopIds,shopConfig.sector,period]);
  const sectorInsights=useMemo(()=>genSectorInsights(recs,sectBench,shopConfig,period),[recs,sectBench,period]);
  const incidents=useMemo(()=>allRecs.filter(r=>r.incident&&r.incident.trim()).reduce((acc,r)=>{const key=r.staff+"_"+r.date;if(!acc.find(x=>x.key===key))acc.push({key,staff:r.staff,date:r.date,incident:r.incident.trim()});return acc;},[]).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10),[allRecs]);
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
    {dataLoading&&<div style={{height:3,background:T.div,position:"sticky",top:64,zIndex:10}}><div style={{height:"100%",background:T.accent,width:"60%",borderRadius:99,animation:"loadbar 1.2s ease-in-out infinite"}}/><style>{"@keyframes loadbar{0%{width:0%;margin-left:0}50%{width:60%;margin-left:20%}100%{width:0%;margin-left:100%}}"}</style></div>}
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
      {catData.length>0&&<><Lbl>Time by Category · {pLabel}</Lbl><Card style={{marginBottom:14}}>{catData.map(e=>{const p=Math.round((e[1]/catTotal)*100);return<div key={e[0]} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:600,color:T.sub}}>{e[0]}</span><span style={{fontSize:13,fontWeight:700}}>{fmt(e[1])} <span style={{color:T.muted,fontWeight:400}}>({p}%)</span></span></div><PBar val={p} max={100} color={T.accent} h={7}/></div>;})}
      </Card></>}
      <Lbl>Intelligence · {pLabel}</Lbl>
      <Card style={{marginBottom:14}}>{summary.map((item,i)=><InsightRow key={i} item={item}/>)}</Card>
      {incidents.length>0&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,marginTop:4}}>
          <Lbl>Incident Log</Lbl>
          {incidents.some(i=>i.date===today)&&<div style={{fontSize:11,fontWeight:700,color:T.red,background:T.redLight,padding:"2px 8px",borderRadius:20,marginBottom:8}}>🚨 New today</div>}
        </div>
        <Card style={{marginBottom:14,border:`1px solid #FECACA`}}>
          {incidents.map((inc,i)=><div key={inc.key} style={{padding:"12px 0",borderTop:i===0?"none":`1px solid ${T.div}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>🚩</span><span style={{fontSize:14,fontWeight:700,color:T.text}}>{inc.staff}</span></div>
              <span style={{fontSize:12,color:T.muted}}>{inc.date}</span>
            </div>
            <div style={{fontSize:13,color:T.sub,lineHeight:1.6,paddingLeft:24}}>{inc.incident}</div>
          </div>)}
        </Card>
      </>}
      <Lbl>Payroll Export</Lbl>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:13,color:T.sub,marginBottom:12}}>Download a CSV of all staff hours for {pLabel.toLowerCase()}. Import directly into your payroll or accounting software.</div>
        <button onClick={()=>exportPayrollCSV(recs,shopConfig,period)} style={{background:"#111",color:"#fff",border:"none",borderRadius:10,padding:"12px 18px",fontSize:14,fontWeight:700,cursor:"pointer",width:"100%"}}>⬇ Download {pLabel} Payroll CSV</button>
      </Card>
    </div>
  </div>;
}

function BenchmarksTab({allRecs,allShifts,allShops,shopConfig,currentShopId,ownedShopIds}){
  const [period,setPeriod]=useState("week");
  const recs=useMemo(()=>filterPeriod(allRecs,period),[allRecs,period]);
  const pLabel={today:"Today",week:"This Week",month:"This Month"}[period];
  const staffNames=shopConfig.staff.map(s=>s.name);

  // ── Section 1: Within-business staff comparison ──────────────────────────
  const staffBreak=useMemo(()=>shopConfig.staff.map((s,i)=>{
    const sRecs=recs.filter(r=>r.staff===s.name&&r.mins>0);
    const totalMins=sRecs.reduce((a,r)=>a+r.mins,0);
    const taskCount=[...new Set(sRecs.map(r=>r.task))].length;
    const avgTask=sRecs.length?avgArr(sRecs.map(r=>r.mins)):0;
    const taskMap={};sRecs.forEach(r=>{if(!taskMap[r.task])taskMap[r.task]=[];taskMap[r.task].push(r.mins);});
    return{name:s.name,color:SC[i%SC.length],shift:s.shift,totalMins,taskCount,avgTask,taskMap};
  }),[recs,shopConfig]);
  const maxMins=Math.max(...staffBreak.map(s=>s.totalMins),1);
  // Task-level staff comparison: find tasks done by 2+ staff
  const sharedTasks=useMemo(()=>{
    const taskStaff={};recs.filter(r=>r.mins>0).forEach(r=>{if(!taskStaff[r.task])taskStaff[r.task]={};if(!taskStaff[r.task][r.staff])taskStaff[r.task][r.staff]=[];taskStaff[r.task][r.staff][taskStaff[r.task][r.staff].length]=r.mins;});
    return Object.entries(taskStaff).filter(e=>Object.keys(e[1]).length>=2).map(([task,byStaff])=>{
      const avgs=Object.entries(byStaff).map(([n,vals])=>({name:n,avg:avgArr(vals),color:SC[shopConfig.staff.findIndex(s=>s.name===n)%SC.length]})).sort((a,b)=>a.avg-b.avg);
      return{task,avgs};
    }).sort((a,b)=>b.avgs.length-a.avgs.length).slice(0,8);
  },[recs,shopConfig]);

  // ── Section 2: Portfolio (owner's other locations, same sector) ──────────
  const portfolio=useMemo(()=>portfolioBenchmark(allShifts,allShops,currentShopId,ownedShopIds),[allShifts,allShops,currentShopId,ownedShopIds]);
  const portfolioInsights=useMemo(()=>genPortfolioInsights(recs,portfolio,allShops,currentShopId,period),[recs,portfolio,period]);
  const sameSecShops=useMemo(()=>allShops.filter(s=>ownedShopIds.includes(s.shopId)&&s.shopId!==currentShopId&&s.sector===shopConfig.sector),[allShops,ownedShopIds,currentShopId,shopConfig.sector]);
  const portfolioTaskComp=useMemo(()=>{
    if(!sameSecShops.length)return[];
    const allPoolRecs=allShifts.filter(r=>ownedShopIds.includes(r.shopId)&&r.mins>0);
    const myAvgs={};recs.filter(r=>r.mins>0).forEach(r=>{if(!myAvgs[r.task])myAvgs[r.task]=[];myAvgs[r.task].push(r.mins);});
    return Object.entries(myAvgs).map(([task,vals])=>{
      const myAvg=avgArr(vals);
      const comparisons=sameSecShops.map(sh=>{
        const theirVals=allPoolRecs.filter(r=>r.shopId===sh.shopId&&r.task===task).map(r=>r.mins);
        return theirVals.length?{shopName:sh.shopName,avg:avgArr(theirVals)}:null;
      }).filter(Boolean);
      return comparisons.length?{task,myAvg,comparisons}:null;
    }).filter(Boolean).sort((a,b)=>b.comparisons.length-a.comparisons.length).slice(0,6);
  },[recs,allShifts,sameSecShops,ownedShopIds]);

  // ── Section 3: External sector benchmark ─────────────────────────────────
  const sectBench=useMemo(()=>sectorBenchmark(allShifts,allShops,currentShopId,ownedShopIds,shopConfig.sector,period),[allShifts,allShops,currentShopId,ownedShopIds,shopConfig.sector,period]);
  const sectorInsights=useMemo(()=>genSectorInsights(recs,sectBench,shopConfig,period),[recs,sectBench,period]);
  const externalShopCount=useMemo(()=>new Set(allShifts.filter(r=>!ownedShopIds.includes(r.shopId)&&r.sector===shopConfig.sector).map(r=>r.shopId)).size,[allShifts,ownedShopIds,shopConfig.sector]);

  return <div style={{paddingBottom:90}}>
    <PeriodToggle period={period} setPeriod={setPeriod}/>
    <div style={{padding:"14px 16px 0"}}>

      {/* ── SECTION 1: YOUR TEAM ── */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <div style={{width:4,height:20,background:T.accent,borderRadius:99}}/>
        <div style={{fontSize:16,fontWeight:800,color:T.text}}>Your Team</div>
        <div style={{fontSize:12,color:T.muted,marginLeft:2}}>· {shopConfig.shopName}</div>
      </div>
      <Card style={{marginBottom:10}}>
        <div style={{fontSize:12,color:T.muted,marginBottom:12}}>Hours logged {pLabel.toLowerCase()} — ranked</div>
        {[...staffBreak].sort((a,b)=>b.totalMins-a.totalMins).map((s,i)=><div key={s.name} style={{marginBottom:i<staffBreak.length-1?14:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <div style={{width:20,height:20,borderRadius:"50%",background:i===0?"#F59E0B":i===1?"#9CA3AF":i===2?"#CD7C3F":"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:i<3?"#fff":T.muted,flexShrink:0}}>{i+1}</div>
            <Avatar name={s.name} size={32} color={s.color}/>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:T.text}}>{s.name}</div><div style={{fontSize:11,color:T.muted}}>{s.taskCount} tasks · avg {s.avgTask}m each</div></div>
            <div style={{fontSize:16,fontWeight:800,color:s.color}}>{fmt(s.totalMins)||"—"}</div>
          </div>
          <PBar val={s.totalMins} max={maxMins} color={s.color} h={6}/>
        </div>)}
        {!staffBreak.some(s=>s.totalMins>0)&&<p style={{color:T.muted,fontSize:14,margin:0,textAlign:"center",padding:"16px 0"}}>No data for this period yet.</p>}
      </Card>
      {sharedTasks.length>0&&<>
        <Lbl>Task Speed Analysis</Lbl>
        <Card style={{marginBottom:14}}>
          {sharedTasks.map(({task,avgs},ti)=>{
            const fastest=avgs[0];const slowest=avgs[avgs.length-1];
            const diff=slowest&&fastest&&fastest.avg>0?Math.round(((slowest.avg-fastest.avg)/fastest.avg)*100):0;
            return <div key={task} style={{padding:"12px 0",borderTop:ti===0?"none":`1px solid ${T.div}`}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:6}}>{task}</div>
              <ul style={{margin:0,padding:"0 0 0 18px",listStyle:"disc"}}>
                <li style={{fontSize:13,color:T.green,marginBottom:3,lineHeight:1.5}}>
                  {fastest.name} is the fastest at {fastest.avg}m avg{avgs.length>1?` — ${diff}% quicker than ${slowest.name} (${slowest.avg}m)`:""}
                </li>
                {avgs.slice(1,-1).map(a=><li key={a.name} style={{fontSize:13,color:T.sub,marginBottom:3,lineHeight:1.5}}>{a.name} averages {a.avg}m</li>)}
                {avgs.length>1&&<li style={{fontSize:13,color:T.red,lineHeight:1.5}}>{slowest.name} takes longest at {slowest.avg}m — worth a quick conversation if this is consistent</li>}
              </ul>
            </div>;
          })}
        </Card>
      </>}

      {/* ── SECTION 2: YOUR OTHER LOCATIONS ── */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,marginTop:20}}>
        <div style={{width:4,height:20,background:T.blue,borderRadius:99}}/>
        <div style={{fontSize:16,fontWeight:800,color:T.text}}>Your Other Locations</div>
      </div>
      {sameSecShops.length===0?<Card style={{marginBottom:14,border:`1px solid ${T.border}`}}>
        <div style={{textAlign:"center",padding:"16px 0"}}>
          <div style={{fontSize:24,marginBottom:8}}>🏢</div>
          <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:4}}>No other {shopConfig.sector} locations</div>
          <div style={{fontSize:13,color:T.muted}}>Add more businesses in the same sector to compare performance across your portfolio.</div>
        </div>
      </Card>:<>
        <Card style={{marginBottom:10,border:`1px solid #BFDBFE`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontSize:20}}>🏢</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:T.blue}}>Compared against your other {shopConfig.sector} locations</div>
              <div style={{fontSize:11,color:T.muted,marginTop:1}}>Names shown — these are your own businesses</div>
            </div>
          </div>
          {portfolioInsights.map((item,i)=><InsightRow key={i} item={item}/>)}
        </Card>
        {portfolioTaskComp.length>0&&<>
          <Lbl>Task Comparison Across Locations</Lbl>
          <Card style={{marginBottom:14}}>
            {portfolioTaskComp.map(({task,myAvg,comparisons},ti)=>{
              const allLocs=[{shopName:shopConfig.shopName,avg:myAvg,isMe:true},...comparisons].sort((a,b)=>a.avg-b.avg);
              const fastest=allLocs[0];const slowest=allLocs[allLocs.length-1];
              return <div key={task} style={{padding:"12px 0",borderTop:ti===0?"none":`1px solid ${T.div}`}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:6}}>{task}</div>
                <ul style={{margin:0,padding:"0 0 0 18px",listStyle:"disc"}}>
                  {allLocs.map((loc,i)=>{
                    const isFastest=i===0;const isSlowest=i===allLocs.length-1&&allLocs.length>1;
                    return <li key={loc.shopName} style={{fontSize:13,color:isFastest?T.green:isSlowest?T.red:T.sub,marginBottom:3,lineHeight:1.5}}>
                      {loc.shopName}{loc.isMe?" (this location)":""} — {loc.avg}m avg{isFastest&&allLocs.length>1?" 🏆":""}
                    </li>;
                  })}
                  {allLocs.length>1&&<li style={{fontSize:13,color:T.sub,lineHeight:1.5,marginTop:4}}>
                    {fastest.shopName} is {Math.round(((slowest.avg-fastest.avg)/fastest.avg)*100)}% faster than {slowest.shopName} on this task
                  </li>}
                </ul>
              </div>;
            })}
          </Card>
        </>}
      </>}

      {/* ── SECTION 3: EXTERNAL SECTOR ── */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,marginTop:20}}>
        <div style={{width:4,height:20,background:T.purple,borderRadius:99}}/>
        <div style={{fontSize:16,fontWeight:800,color:T.text}}>External {shopConfig.sector.charAt(0).toUpperCase()+shopConfig.sector.slice(1)} Benchmark</div>
        {externalShopCount>0&&<div style={{fontSize:11,fontWeight:700,color:T.purple,background:T.purpleLight,padding:"2px 8px",borderRadius:20}}>{externalShopCount} {externalShopCount===1?"business":"businesses"}</div>}
      </div>
      <Card style={{marginBottom:14,border:`1px solid ${T.purpleLight}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <span style={{fontSize:20}}>🔒</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.purple}}>Anonymous comparison · other {shopConfig.sector} businesses</div>
            <div style={{fontSize:11,color:T.muted,marginTop:1}}>No names, no identifiable data — your data excluded from others' views too</div>
          </div>
        </div>
        {sectorInsights.map((item,i)=><InsightRow key={i} item={item}/>)}
      </Card>
    </div>
  </div>;
}

function StaffTab({allRecs,expDays,onNav,shopConfig,onShopConfigUpdated}){
  const [period,setPeriod]=useState("week");
  const [addingStaff,setAddingStaff]=useState(false);
  const [nName,setNName]=useState("");const [nPin,setNPin]=useState("");const [nShift,setNShift]=useState("morning");const [nRate,setNRate]=useState("12.21");
  const [savingNew,setSavingNew]=useState(false);const [addErr,setAddErr]=useState(null);
  const recs=useMemo(()=>filterPeriod(allRecs,period),[allRecs,period]);
  const prevRecs=useMemo(()=>filterPrev(allRecs,period),[allRecs,period]);
  const sdm=useMemo(()=>staffDatesMap(allRecs,shopConfig.staff.map(s=>s.name)),[allRecs]);
  const today=todayStr();const isWorkDay=WDAYS.includes(new Date().getDay());

  const handleAddStaff=async()=>{
    if(!nName.trim()){setAddErr("Enter a name");return;}
    if(nPin.length!==4||!/^\d{4}$/.test(nPin)){setAddErr("PIN must be 4 digits");return;}
    if(shopConfig.staff.find(s=>s.pin===nPin)){setAddErr("That PIN is already in use");return;}
    setSavingNew(true);setAddErr(null);
    const newStaff={name:nName.trim(),pin:nPin,initials:nName.trim().slice(0,2).toUpperCase(),shift:nShift,hourlyRate:parseFloat(nRate)||12.21};
    const updated=[...shopConfig.staff,newStaff];
    try{
      await updateShop(shopConfig.id,{...shopConfig,staff:updated});
      await onShopConfigUpdated();
      setNName("");setNPin("");setNShift("morning");setNRate("12.21");setAddingStaff(false);
    }catch(e){setAddErr(e.message||"Save failed");}
    finally{setSavingNew(false);}
  };

  return <div style={{paddingBottom:90}}><PeriodToggle period={period} setPeriod={setPeriod}/><div style={{padding:"14px 16px 0"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <div style={{fontSize:20,fontWeight:800,color:T.text}}>Staff</div>
      <button onClick={()=>setAddingStaff(v=>!v)} style={{background:addingStaff?T.bg:T.accent,color:addingStaff?T.sub:"#fff",border:`1px solid ${addingStaff?T.border:T.accent}`,borderRadius:20,padding:"7px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>{addingStaff?"Cancel":"+ Add Staff"}</button>
    </div>
    {addingStaff&&<Card style={{marginBottom:16,border:`1px solid ${T.accent}`}}>
      <div style={{fontSize:14,fontWeight:800,color:T.text,marginBottom:12}}>New Staff Member</div>
      <input value={nName} onChange={e=>setNName(e.target.value)} placeholder="Full name" style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:14,color:T.text,boxSizing:"border-box",marginBottom:8,outline:"none"}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        <input type="text" maxLength={4} value={nPin} onChange={e=>setNPin(e.target.value.replace(/\D/g,""))} placeholder="4-digit PIN" style={{padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:14,color:T.text,outline:"none"}}/>
        <select value={nShift} onChange={e=>setNShift(e.target.value)} style={{padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:14,color:T.text,outline:"none",background:"#fff"}}>
          <option value="morning">Morning</option><option value="evening">Evening</option><option value="full">Full Day</option>
        </select>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span style={{fontSize:13,fontWeight:700,color:T.sub,whiteSpace:"nowrap"}}>£ Hourly rate</span>
        <input type="number" step="0.01" min="0" value={nRate} onChange={e=>setNRate(e.target.value)} style={{flex:1,padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:14,color:T.text,outline:"none"}}/>
      </div>
      {addErr&&<div style={{background:T.redLight,color:T.red,borderRadius:8,padding:"8px 12px",fontSize:12,fontWeight:600,marginBottom:8}}>{addErr}</div>}
      <button onClick={handleAddStaff} disabled={savingNew} style={{background:"#111",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",width:"100%",opacity:savingNew?0.5:1}}>{savingNew?"Saving…":"Add Staff Member"}</button>
    </Card>}
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

function StaffDetail({name,allRecs,expDays,onNav,shopConfig,onBack,onRemoveStaff}){
  const [tab,setTab]=useState("overview");const [period,setPeriod]=useState("week");
  const [confirmRemove,setConfirmRemove]=useState(false);const [removing,setRemoving]=useState(false);
  const staffIdx=shopConfig.staff.findIndex(s=>s.name===name);const color=SC[staffIdx%SC.length];
  const recs=useMemo(()=>filterPeriod(allRecs,period),[allRecs,period]);
  const prevRecs=useMemo(()=>filterPrev(allRecs,period),[allRecs,period]);
  const sRecs=useMemo(()=>recs.filter(r=>r.staff===name),[recs,name]);
  const sdm=useMemo(()=>staffDatesMap(allRecs,shopConfig.staff.map(s=>s.name)),[allRecs]);
  const today=todayStr();
  // Performance notes
  const [notes,setNotes]=useState({});const [newNote,setNewNote]=useState("");const [savingNote,setSavingNote]=useState(false);
  useEffect(()=>{if(shopConfig?.id)fetchStaffNotes(shopConfig.id).then(setNotes).catch(()=>{});},[shopConfig?.id]);
  const staffNotes=(notes[name]||[]).slice().reverse();
  const addNote=async()=>{if(!newNote.trim())return;setSavingNote(true);const entry={text:newNote.trim(),date:todayStr(),author:"Owner"};const updated={...notes,[name]:[...(notes[name]||[]),entry]};try{await saveStaffNotes(shopConfig.id,updated);setNotes(updated);setNewNote("");}catch(e){}finally{setSavingNote(false);}};
  const deleteNote=async(idx)=>{const arr=[...(notes[name]||[])];arr.splice(arr.length-1-idx,1);const updated={...notes,[name]:arr};try{await saveStaffNotes(shopConfig.id,updated);setNotes(updated);}catch(e){}};
  const staffMember=shopConfig.staff.find(s=>s.name===name);
  const hourlyRate=staffMember?.hourlyRate||12.21;
  const curr=sRecs.filter(r=>r.mins>0).reduce((a,r)=>a+r.mins,0);
  const todayMins=allRecs.filter(r=>r.staff===name&&r.date===today&&r.mins>0).reduce((a,r)=>a+r.mins,0);
  const weekStart=new Date();weekStart.setDate(weekStart.getDate()-weekStart.getDay()+1);weekStart.setHours(0,0,0,0);
  const weekMinsVal=allRecs.filter(r=>r.staff===name&&r.mins>0&&new Date(r.date)>=weekStart).reduce((a,r)=>a+r.mins,0);
  const monthStart=new Date();monthStart.setDate(1);monthStart.setHours(0,0,0,0);
  const monthMinsVal=allRecs.filter(r=>r.staff===name&&r.mins>0&&new Date(r.date)>=monthStart).reduce((a,r)=>a+r.mins,0);
  const fmtPay=mins=>`£${((mins/60)*hourlyRate).toFixed(2)}`;
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
  return <><div style={{paddingBottom:90}}><PeriodToggle period={period} setPeriod={setPeriod}/><div style={{padding:"12px 16px 0"}}>
    <Card style={{marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
        <Avatar name={name} size={52} color={color}/>
        <div style={{flex:1}}><div style={{fontSize:20,fontWeight:800,color:T.text}}>{name}</div><div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}><Badge label={staffShift} type="neutral"/>{sub?<Badge label="✓ Today" type="good"/>:<Badge label="Not submitted today" type="flag"/>}</div></div>
        <button onClick={()=>setConfirmRemove(true)} style={{background:T.redLight,color:T.red,border:"none",borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>Remove</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[{l:"PERIOD HRS",v:fmt(curr)||"—",s:<Chip p={pctChg(curr,prev)}/>,col:color},{l:"AVG SHIFT",v:fmt(avgShift)||"—",s:"all time",col:color},{l:"CONSISTENCY",v:sc!==null?sc+"/100":"—",s:"reliability",col:sc>70?T.green:sc>40?T.amber:T.red}].map(k=><div key={k.l} style={{background:T.bg,borderRadius:12,padding:"10px 8px"}}><div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:4}}>{k.l}</div><div style={{fontSize:16,fontWeight:800,color:k.col}}>{k.v}</div><div style={{fontSize:11,color:T.muted,marginTop:2}}>{k.s}</div></div>)}</div>
    </Card>
    <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:2}}>{["overview","tasks","heatmap","trends","notes"].map(t=><button key={t} onClick={()=>setTab(t)} style={{background:tab===t?color:T.card,color:tab===t?"#fff":T.sub,border:`1px solid ${tab===t?color:T.border}`,borderRadius:20,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>)}</div>
    {tab==="overview"&&<>
      <Card style={{marginBottom:14}}>{[{l:"This Period",v:curr,col:color},{l:"Previous",v:prev,col:"#E5E7EB"}].map(row=><div key={row.l} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:600,color:T.sub}}>{row.l}</span><span style={{fontSize:13,fontWeight:800}}>{fmt(row.v)||"0m"}</span></div><PBar val={row.v} max={Math.max(curr,prev,1)} color={row.col}/></div>)}<div style={{display:"flex",justifyContent:"flex-end",marginTop:4}}><Chip p={pctChg(curr,prev)}/></div></Card>
      <Lbl>💷 Estimated Pay · £{hourlyRate.toFixed(2)}/hr</Lbl>
      <Card style={{marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[{l:"TODAY",mins:todayMins},{l:"THIS WEEK",mins:weekMinsVal},{l:"THIS MONTH",mins:monthMinsVal}].map(p=><div key={p.l} style={{background:T.bg,borderRadius:10,padding:"10px 8px",textAlign:"center"}}><div style={{fontSize:10,fontWeight:700,color:T.muted,marginBottom:4}}>{p.l}</div><div style={{fontSize:16,fontWeight:800,color:T.text}}>{fmtPay(p.mins)}</div><div style={{fontSize:11,color:T.muted,marginTop:2}}>{fmt(p.mins)||"0m"}</div></div>)}
        </div>
        <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${T.div}`,fontSize:12,color:T.muted}}>Based on logged hours · Holiday pay & deductions not included</div>
      </Card>
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
    {tab==="notes"&&<>
      <Lbl>Manager Notes · {name}</Lbl>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:13,color:T.sub,marginBottom:12}}>Private notes — only visible to you. Use this to log performance conversations, improvements, or anything worth remembering.</div>
        <textarea value={newNote} onChange={e=>setNewNote(e.target.value)} placeholder={`Add a note about ${name}…`} style={{width:"100%",padding:"12px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:14,color:T.text,background:T.bg,boxSizing:"border-box",resize:"none",minHeight:80,outline:"none",fontFamily:"inherit",lineHeight:1.5,marginBottom:8}}/>
        <button onClick={addNote} disabled={savingNote||!newNote.trim()} style={{background:"#111",color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:14,fontWeight:700,cursor:"pointer",opacity:savingNote||!newNote.trim()?0.5:1}}>{savingNote?"Saving…":"+ Add Note"}</button>
      </Card>
      {staffNotes.length>0?staffNotes.map((n,i)=><Card key={i} style={{marginBottom:10,border:`1px solid ${T.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14}}>📝</span><span style={{fontSize:12,fontWeight:700,color:T.sub}}>{n.author||"Owner"}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,color:T.muted}}>{n.date}</span><button onClick={()=>deleteNote(i)} style={{background:T.redLight,color:T.red,border:"none",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700,cursor:"pointer"}}>✕</button></div>
        </div>
        <div style={{fontSize:14,color:T.text,lineHeight:1.6}}>{n.text}</div>
      </Card>):<div style={{textAlign:"center",padding:"32px 0",color:T.muted,fontSize:14}}>No notes yet. Add your first note above.</div>}
    </>}
  </div></div>
  {confirmRemove&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={()=>!removing&&setConfirmRemove(false)}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"28px 20px 44px",width:"100%",maxWidth:480,margin:"0 auto"}}><div style={{width:40,height:4,borderRadius:99,background:"#E5E7EB",margin:"0 auto 20px"}}/><div style={{width:56,height:56,borderRadius:"50%",background:T.redLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 14px"}}>👤</div><div style={{fontSize:18,fontWeight:800,color:T.text,textAlign:"center",marginBottom:8}}>Remove {name}?</div><div style={{fontSize:14,color:T.sub,textAlign:"center",lineHeight:1.7,marginBottom:6}}>This will remove {name} from the staff list and they will no longer be able to log in.</div><div style={{fontSize:13,color:T.muted,textAlign:"center",marginBottom:24}}>Historical shift data will be retained.</div><div style={{display:"flex",gap:10}}><button onClick={()=>setConfirmRemove(false)} disabled={removing} style={{flex:1,padding:"14px",borderRadius:14,background:T.bg,color:T.sub,fontSize:15,fontWeight:700,border:`1px solid ${T.border}`,cursor:"pointer"}}>Cancel</button><button disabled={removing} onClick={async()=>{setRemoving(true);try{const updated=shopConfig.staff.filter(s=>s.name!==name);await updateShop(shopConfig.id,{...shopConfig,staff:updated});if(onRemoveStaff)onRemoveStaff();}catch(e){setConfirmRemove(false);}finally{setRemoving(false);}}} style={{flex:1,padding:"14px",borderRadius:14,background:T.red,color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer"}}>{removing?"Removing…":"Remove"}</button></div></div></div>}
  </>;
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
  const [activeSection,setActiveSection]=useState("schedule"); // "schedule" | "absences"
  const [absences,setAbsences]=useState({});const [absFrom,setAbsFrom]=useState("");const [absTo,setAbsTo]=useState("");const [absComment,setAbsComment]=useState("");const [savingAbs,setSavingAbs]=useState(false);
  const [shiftStart,setShiftStart]=useState("");const [shiftEnd,setShiftEnd]=useState("");
  // Reset everything when the active shop changes
  useEffect(()=>{setSelStaff(null);setSchedule(null);setSaveStatus(null);setAdding(false);setNewTask("");setActiveSection("schedule");},[shopId]);
  // Load absences when shop loads
  useEffect(()=>{if(shopConfig?.id)fetchAbsences(shopConfig.id).then(setAbsences).catch(()=>{});},[shopConfig?.id]);
  // Fetch schedule when a staff member is selected for the current shop
  useEffect(()=>{if(!selStaff||!shopId)return;setLoadingS(true);setSchedule(null);const staffNames=shopConfig.staff.map(s=>s.name);fetchSchedule(shopId,shopConfig.sector,staffNames).then(s=>{setSchedule(s);setLoadingS(false);}).catch(()=>{setSchedule(JSON.parse(JSON.stringify(SECTOR_DEFAULTS[shopConfig.sector]||SECTOR_DEFAULTS.convenience)));setLoadingS(false);});},[selStaff,shopId]);
  // Load current times when day or staff changes
  useEffect(()=>{if(!schedule||!selStaff)return;const t=schedule[selDay]?._times?.[selStaff];setShiftStart(t?.start||"");setShiftEnd(t?.end||"");},[schedule,selDay,selStaff]);
  // Staff-specific tasks first, then sector default for the day, then empty
  const todayTasks=schedule&&selStaff&&schedule[selDay]?(schedule[selDay][selStaff]!==undefined?schedule[selDay][selStaff]:schedule[selDay]._all||[]):[];
  const unusedTasks=TASK_POOL.filter(t=>!todayTasks.includes(t));
  const existingId=schedule&&schedule[selDay]&&schedule[selDay]._ids?schedule[selDay]._ids[selStaff]||null:null;
  const [saveError,setSaveError]=useState(null);
  function persistChange(newTasks,start,end,forceCurrId){
    const s=start!==undefined?start:shiftStart;
    const e=end!==undefined?end:shiftEnd;
    const currId=forceCurrId!==undefined?forceCurrId:existingId;
    setSaving(true);setSaveStatus(null);setSaveError(null);
    saveScheduleToAirtable(schedule,shopId,selDay,selStaff,newTasks,currId,s,e).then(newId=>{
      setSchedule(prev=>{
        const u=JSON.parse(JSON.stringify(prev));
        if(!u[selDay])u[selDay]={};
        if(!u[selDay]._ids)u[selDay]._ids={};
        u[selDay]._ids[selStaff]=newId;
        u[selDay][selStaff]=newTasks;
        if(!u[selDay]._times)u[selDay]._times={};
        if(s||e)u[selDay]._times[selStaff]={start:s,end:e};
        return u;
      });
      setSaveStatus("ok");setSaving(false);setTimeout(()=>setSaveStatus(null),2500);
    }).catch((err)=>{setSaveStatus("err");setSaveError(err.message||"Unknown error");setSaving(false);setTimeout(()=>{setSaveStatus(null);},5000);});
  }
  function removeTask(task){
    const nt=todayTasks.filter(t=>t!==task);
    const currId=existingId;
    setSchedule(prev=>{const u=JSON.parse(JSON.stringify(prev));if(!u[selDay])u[selDay]={};u[selDay][selStaff]=nt;return u;});
    persistChange(nt,undefined,undefined,currId);
  }
  function addTask(t){
    if(!t.trim())return;
    if(todayTasks.includes(t)){setNewTask("");setAdding(false);return;}
    const nt=[...todayTasks,t];
    const currId=existingId;
    setSchedule(prev=>{const u=JSON.parse(JSON.stringify(prev));if(!u[selDay])u[selDay]={};u[selDay][selStaff]=nt;return u;});
    persistChange(nt,undefined,undefined,currId);
    setNewTask("");setAdding(false);
  }
  const [absError,setAbsError]=useState(null);
  const [confirmAbs,setConfirmAbs]=useState(null); // group to confirm removal
  const addAbsence=async()=>{
    if(!absFrom||!selStaff)return;setSavingAbs(true);setAbsError(null);
    const endDate=absTo&&absTo>=absFrom?absTo:absFrom;
    const dates=[];let d=new Date(absFrom+"T12:00:00");const end=new Date(endDate+"T12:00:00");
    while(d<=end){dates.push(d.toISOString().split("T")[0]);d.setDate(d.getDate()+1);}
    const existing=(absences[selStaff]||[]).filter(a=>!dates.includes(a.date));
    const newEntries=dates.map(date=>({date,type:"absent",comment:absComment.trim()}));
    const updated={...absences,[selStaff]:[...existing,...newEntries]};
    try{await saveAbsences(shopConfig.id,updated);setAbsences(updated);setAbsFrom("");setAbsTo("");setAbsComment("");}
    catch(e){setAbsError(e.message||"Save failed — check connection");}
    finally{setSavingAbs(false);};
  };
  const removeAbsenceGroup=async(group)=>{
    const datesToRemove=new Set(group.dates);
    const staffAbs=(absences[selStaff]||[]).filter(a=>!datesToRemove.has(a.date));
    const updated={...absences,[selStaff]:staffAbs};
    try{await saveAbsences(shopConfig.id,updated);setAbsences(updated);}
    catch(e){setAbsError(e.message||"Remove failed");}
    setConfirmAbs(null);
  };
  const staffAbs=(absences[selStaff]||[]).sort((a,b)=>b.date.localeCompare(a.date));
  const staffIdx=selStaff?shopConfig.staff.findIndex(s=>s.name===selStaff):0;
  const staffColor=SC[staffIdx%SC.length];
  const absTypeColors={absent:{bg:T.redLight,col:T.red,label:"Absent"},holiday:{bg:"#EFF6FF",col:T.blue,label:"Holiday"},sick:{bg:"#FFF7ED",col:T.amber,label:"Sick"},late:{bg:"#F5F3FF",col:T.purple,label:"Late"}};
  // Group consecutive absence ranges for display
  const groupedAbs=useMemo(()=>{
    if(!staffAbs.length)return[];
    const sorted=[...staffAbs].sort((a,b)=>a.date.localeCompare(b.date));
    const groups=[];let g=null;
    sorted.forEach(a=>{
      if(g&&g.comment===(a.comment||"")){const prev=new Date(g.to+"T12:00:00");prev.setDate(prev.getDate()+1);if(prev.toISOString().split("T")[0]===a.date){g.to=a.date;g.dates.push(a.date);return;}}
      g={type:"absent",comment:a.comment||"",from:a.date,to:a.date,dates:[a.date]};groups.push(g);
    });
    return groups.sort((a,b)=>b.from.localeCompare(a.from));
  },[staffAbs]);
  if(!selStaff)return <div style={{padding:"16px 16px 90px"}}><div style={{fontSize:20,fontWeight:800,color:T.text,marginBottom:4}}>Actions</div><div style={{fontSize:14,color:T.sub,marginBottom:20}}>Edit schedules and track absences for each staff member.</div>{shopConfig.staff.map((s,i)=>{const absCount=(absences[s.name]||[]).filter(a=>{const d=new Date(a.date);const now=new Date();const diff=(now-d)/(1000*60*60*24);return diff<=30;}).length;return <Card key={s.name} style={{marginBottom:10}} onPress={()=>setSelStaff(s.name)}><div style={{display:"flex",alignItems:"center",gap:12}}><Avatar name={s.name} size={46} color={SC[i%SC.length]}/><div style={{flex:1}}><div style={{fontSize:16,fontWeight:800,color:T.text}}>{s.name}</div><div style={{fontSize:13,color:T.muted}}>{s.shift} shift · Tap to edit</div></div>{absCount>0&&<span style={{background:T.redLight,color:T.red,fontSize:12,fontWeight:700,padding:"3px 8px",borderRadius:20}}>{absCount} abs</span>}<span style={{fontSize:20,color:T.muted}}>›</span></div></Card>;})}
    </div>;
  return <div style={{padding:"0 16px 90px"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 0 12px"}}><button onClick={()=>setSelStaff(null)} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"6px 12px",cursor:"pointer",color:T.text,fontSize:13,fontWeight:700}}>← Back</button><Avatar name={selStaff} size={36} color={staffColor}/><div style={{flex:1}}><div style={{fontSize:16,fontWeight:800,color:T.text}}>{selStaff}</div><div style={{fontSize:12,color:T.muted}}>{shopConfig.staff.find(s=>s.name===selStaff)?.shift} shift</div></div>{saving&&<span style={{fontSize:12,color:T.muted}}>Saving…</span>}{saveStatus==="ok"&&<span style={{fontSize:12,color:T.green,fontWeight:700}}>✓ Saved</span>}{saveStatus==="err"&&<span style={{fontSize:12,color:T.red,fontWeight:700}}>⚠ Failed</span>}</div>
    {saveError&&<div style={{background:T.redLight,border:`1px solid ${T.red}`,borderRadius:10,padding:"10px 14px",fontSize:12,color:T.red,marginBottom:12,wordBreak:"break-all"}}>❌ Error: {saveError}</div>}
    <div style={{display:"flex",gap:8,marginBottom:16}}><button onClick={()=>setActiveSection("schedule")} style={{flex:1,background:activeSection==="schedule"?staffColor:T.bg,color:activeSection==="schedule"?"#fff":T.sub,border:`1px solid ${activeSection==="schedule"?staffColor:T.border}`,borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>📋 Schedule</button><button onClick={()=>setActiveSection("absences")} style={{flex:1,background:activeSection==="absences"?staffColor:T.bg,color:activeSection==="absences"?"#fff":T.sub,border:`1px solid ${activeSection==="absences"?staffColor:T.border}`,borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>📅 Absences {staffAbs.length>0&&`(${groupedAbs.length})`}</button></div>
    {activeSection==="absences"&&<>
      <Lbl>Log Absence</Lbl>
      <Card style={{marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div><div style={{fontSize:12,fontWeight:700,color:T.sub,marginBottom:6}}>From</div><input type="date" value={absFrom} onChange={e=>setAbsFrom(e.target.value)} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:14,color:T.text,boxSizing:"border-box",outline:"none"}}/></div>
          <div><div style={{fontSize:12,fontWeight:700,color:T.sub,marginBottom:6}}>To <span style={{fontWeight:400,color:T.muted}}>(optional)</span></div><input type="date" value={absTo} min={absFrom} onChange={e=>setAbsTo(e.target.value)} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:14,color:T.text,boxSizing:"border-box",outline:"none"}}/></div>
        </div>
        {absFrom&&<div style={{fontSize:12,color:T.muted,marginBottom:10}}>{absTo&&absTo>absFrom?`${Math.round((new Date(absTo+"T12:00:00")-new Date(absFrom+"T12:00:00"))/(1000*60*60*24))+1} days`:"Single day"}</div>}
        <div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:T.sub,marginBottom:6}}>Comment <span style={{fontWeight:400,color:T.muted}}>(optional)</span></div><input value={absComment} onChange={e=>setAbsComment(e.target.value)} placeholder="e.g. Doctor's appointment, Holiday, etc." style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:14,color:T.text,boxSizing:"border-box",outline:"none"}}/></div>
        {absError&&<div style={{background:T.redLight,color:T.red,borderRadius:8,padding:"8px 12px",fontSize:12,fontWeight:600,marginBottom:8}}>{absError}</div>}
        <button onClick={addAbsence} disabled={!absFrom||savingAbs} style={{background:"#111",color:"#fff",border:"none",borderRadius:10,padding:"11px 18px",fontSize:14,fontWeight:700,cursor:"pointer",width:"100%",opacity:!absFrom||savingAbs?0.5:1}}>{savingAbs?"Saving…":"+ Log Absence"}</button>
      </Card>
      {groupedAbs.length>0?<><Lbl>Record ({staffAbs.length} days)</Lbl><Card>{groupedAbs.map((g,i)=>{const isSingle=g.from===g.to;const fmtD=d=>new Date(d+"T12:00:00").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});return <div key={g.from} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 0",borderTop:i===0?"none":`1px solid ${T.div}`}}><span style={{background:T.redLight,color:T.red,fontSize:12,fontWeight:700,padding:"3px 10px",borderRadius:20,flexShrink:0}}>Absent</span><div style={{flex:1}}>{isSingle?<div style={{fontSize:13,color:T.sub}}>{fmtD(g.from)}</div>:<><div style={{fontSize:13,fontWeight:700,color:T.text}}>{fmtD(g.from)} – {fmtD(g.to)}</div><div style={{fontSize:11,color:T.muted}}>{g.dates.length} days</div></>}{g.comment&&<div style={{fontSize:11,color:T.muted,marginTop:2,fontStyle:"italic"}}>"{g.comment}"</div>}</div><button onClick={()=>setConfirmAbs(g)} style={{background:T.redLight,color:T.red,border:"none",borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Remove</button></div>;})}
      </Card></>:<p style={{color:T.muted,fontSize:14,textAlign:"center",padding:"24px 0"}}>No absences logged for {selStaff}.</p>}
      {confirmAbs&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={()=>setConfirmAbs(null)}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:480,margin:"0 auto"}}><div style={{width:40,height:4,borderRadius:99,background:"#E5E7EB",margin:"0 auto 20px"}}/><div style={{fontSize:17,fontWeight:800,color:T.text,marginBottom:8,textAlign:"center"}}>Remove Absence?</div><div style={{fontSize:14,color:T.sub,textAlign:"center",marginBottom:6,lineHeight:1.6}}>{confirmAbs.from===confirmAbs.to?`Remove absence on ${new Date(confirmAbs.from+"T12:00:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"short"})}`:`Remove ${confirmAbs.dates.length} day absence period for ${selStaff}?`}</div>{confirmAbs.comment&&<div style={{fontSize:13,color:T.muted,textAlign:"center",marginBottom:6,fontStyle:"italic"}}>"{confirmAbs.comment}"</div>}<div style={{fontSize:12,color:T.muted,textAlign:"center",marginBottom:24}}>This cannot be undone.</div><div style={{display:"flex",gap:10}}><button onClick={()=>setConfirmAbs(null)} style={{flex:1,padding:"14px",borderRadius:14,background:T.bg,color:T.sub,fontSize:15,fontWeight:700,border:`1px solid ${T.border}`,cursor:"pointer"}}>Cancel</button><button onClick={()=>removeAbsenceGroup(confirmAbs)} style={{flex:1,padding:"14px",borderRadius:14,background:T.red,color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer"}}>Remove</button></div></div></div>}
    </>}
    {activeSection==="schedule"&&<>
    {saveError&&<div style={{background:"#fef2f2",border:"1px solid #dc2626",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#dc2626",marginBottom:12,lineHeight:1.6}}><strong>Airtable Error:</strong> {saveError}<br/><span style={{opacity:0.8}}>Check that your TaskSchedules table has fields: Staff Name, Day, Tasks, Shop ID (all Single line text). Shift Start and Shift End are optional.</span></div>}
    <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:2}}>{ALL_DAYS.map(d=><button key={d} onClick={()=>setSelDay(d)} style={{background:selDay===d?staffColor:"#fff",color:selDay===d?"#fff":T.sub,border:`1px solid ${selDay===d?staffColor:T.border}`,borderRadius:20,padding:"8px 14px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{d.slice(0,3)}</button>)}</div>
    {loadingS?<div style={{display:"flex",alignItems:"center",gap:10,padding:"24px 0",color:T.muted,fontSize:14}}><div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${T.div}`,borderTop:`2px solid ${T.accent}`,animation:"spin 0.8s linear infinite"}}/>Loading schedule…</div>:<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><Lbl>{selDay} Tasks ({todayTasks.length})</Lbl><button onClick={()=>setAdding(true)} style={{background:T.accent,color:"#fff",border:"none",borderRadius:20,padding:"6px 14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add</button></div>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:T.sub,marginBottom:8}}>🕐 Shift Times · {selDay}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><div style={{fontSize:11,color:T.muted,fontWeight:700,marginBottom:4}}>Start</div><input type="time" value={shiftStart} onChange={e=>setShiftStart(e.target.value)} style={{width:"100%",padding:"9px 10px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:14,color:T.text,boxSizing:"border-box",outline:"none"}}/></div>
          <div><div style={{fontSize:11,color:T.muted,fontWeight:700,marginBottom:4}}>End</div><input type="time" value={shiftEnd} onChange={e=>setShiftEnd(e.target.value)} style={{width:"100%",padding:"9px 10px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:14,color:T.text,boxSizing:"border-box",outline:"none"}}/></div>
        </div>
        <button onClick={()=>{const currId=existingId;persistChange(todayTasks,shiftStart,shiftEnd,currId);}} disabled={saving} style={{background:T.accent,color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:700,cursor:"pointer",opacity:saving?0.5:1}}>💾 Save Times</button>
        {shiftStart&&shiftEnd&&<span style={{fontSize:12,color:T.muted,marginLeft:10}}>Staff will see {shiftStart} – {shiftEnd}</span>}
      </Card>
      {adding&&<Card style={{marginBottom:12,border:`1px solid ${T.accent}`}}><div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:10}}>Add task for {selDay}</div><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{unusedTasks.slice(0,12).map(t=><button key={t} onClick={()=>addTask(t)} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:600,color:T.sub,cursor:"pointer"}}>{t}</button>)}</div><div style={{display:"flex",gap:8}}><input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addTask(newTask);}} placeholder="Or type a custom task…" style={{flex:1,padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:14,color:T.text}}/><button onClick={()=>addTask(newTask)} style={{background:T.accent,color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Add</button></div><button onClick={()=>setAdding(false)} style={{background:"none",border:"none",color:T.muted,fontSize:13,cursor:"pointer",marginTop:8,padding:0}}>Cancel</button></Card>}
      <Card>{todayTasks.length===0&&<p style={{color:T.muted,fontSize:14,margin:0}}>No tasks for {selDay}. Tap + Add.</p>}{todayTasks.map((task,i)=><div key={task} style={{display:"flex",alignItems:"center",gap:10,padding:"13px 0",borderTop:i===0?"none":`1px solid ${T.div}`}}><div style={{width:10,height:10,borderRadius:"50%",background:T.accent,flexShrink:0}}/><span style={{flex:1,fontSize:14,fontWeight:600,color:T.text}}>{task}</span><button onClick={()=>setConfirmTask(task)} disabled={saving} style={{background:T.redLight,color:T.red,border:"none",borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:700,cursor:"pointer",opacity:saving?0.5:1}}>Remove</button></div>)}</Card>
    </>}
    {confirmTask&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={()=>setConfirmTask(null)}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:480,margin:"0 auto"}}><div style={{width:40,height:4,borderRadius:99,background:"#E5E7EB",margin:"0 auto 20px"}}/><div style={{fontSize:17,fontWeight:800,color:T.text,marginBottom:8,textAlign:"center"}}>Remove Task?</div><div style={{fontSize:14,color:T.sub,textAlign:"center",marginBottom:24,lineHeight:1.6}}>Remove "{confirmTask}" from {selStaff}'s {selDay} schedule?</div><div style={{display:"flex",gap:10}}><button onClick={()=>setConfirmTask(null)} style={{flex:1,padding:"14px",borderRadius:14,background:T.bg,color:T.sub,fontSize:15,fontWeight:700,border:`1px solid ${T.border}`,cursor:"pointer"}}>Cancel</button><button onClick={()=>{removeTask(confirmTask);setConfirmTask(null);}} style={{flex:1,padding:"14px",borderRadius:14,background:T.red,color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer"}}>Remove</button></div></div></div>}
    </>}
  </div>;
}

function ManageTab({shops,ownerId,onShopsUpdated}){
  const [view,setView]=useState("list");const [editShop,setEditShop]=useState(null);const [saving,setSaving]=useState(false);const [saveMsg,setSaveMsg]=useState(null);
  const [confirmDelete,setConfirmDelete]=useState(null);const [deleting,setDeleting]=useState(false);
  const [fName,setFName]=useState("");const [fId,setFId]=useState("");const [fSector,setFSector]=useState("convenience");const [fHours,setFHours]=useState("6");const [fPin,setFPin]=useState("0000");const [fStaff,setFStaff]=useState([]);
  const [nName,setNName]=useState("");const [nPin,setNPin]=useState("");const [nShift,setNShift]=useState("morning");const [nRate,setNRate]=useState("12.21");
  const openEdit=shop=>{setEditShop(shop);setFName(shop.shopName);setFId(shop.shopId);setFSector(shop.sector);setFHours(String(shop.shiftHours));setFPin(shop.ownerPin||"0000");setFStaff([...shop.staff]);setView("edit");};
  const openAdd=()=>{setEditShop(null);setFName("");setFId("");setFSector("convenience");setFHours("6");setFPin("0000");setFStaff([]);setView("add");};
  const addStaff=()=>{if(!nName.trim()||nPin.length!==4)return;setFStaff(p=>[...p,{name:nName.trim(),pin:nPin,initials:nName.trim().slice(0,2).toUpperCase(),shift:nShift,hourlyRate:parseFloat(nRate)||12.21}]);setNName("");setNPin("");setNShift("morning");setNRate("12.21");};
  const handleSave=async()=>{if(!fName.trim()||!fId.trim())return;setSaving(true);setSaveMsg(null);try{const data={shopId:fId.trim().toLowerCase().replace(/\s+/g,"_"),shopName:fName.trim(),sector:fSector,shiftHours:parseInt(fHours)||6,staff:fStaff,ownerPin:fPin,ownerId};if(editShop)await updateShop(editShop.id,data);else await createShop(data);setSaveMsg("ok");await onShopsUpdated();setTimeout(()=>{setSaveMsg(null);setView("list");},1500);}catch(e){setSaveMsg(e.message||"Save failed");}finally{setSaving(false);}};
  const handleDelete=async()=>{if(!confirmDelete)return;setDeleting(true);try{await deleteShop(confirmDelete.id);await onShopsUpdated();setConfirmDelete(null);setView("list");}catch(e){setSaveMsg(e.message||"Delete failed");}finally{setDeleting(false);}};
  const inp={width:"100%",padding:"12px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:15,color:T.text,boxSizing:"border-box",marginBottom:12,outline:"none"};
  const lbl={display:"block",fontSize:13,fontWeight:700,color:T.sub,marginBottom:6};
  return <>
  {view==="list"?<div style={{padding:"16px 16px 90px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><div style={{fontSize:20,fontWeight:800,color:T.text}}>Manage Businesses</div><button onClick={openAdd} style={{background:"#111",color:"#fff",border:"none",borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add Business</button></div>
    <div style={{fontSize:14,color:T.muted,marginBottom:20}}>Edit settings and staff for each of your businesses.</div>
    {shops.map((shop,i)=>{const staffUrl=`https://timesheet-staff-retail-intelligence.vercel.app/?shop=${shop.shopId}`;return <Card key={shop.shopId} style={{marginBottom:10}} onPress={()=>openEdit(shop)}><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:44,height:44,borderRadius:12,background:SC[i%SC.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{SECTOR_ICONS[shop.sector]||"🏢"}</div><div style={{flex:1}}><div style={{fontSize:15,fontWeight:800,color:T.text}}>{shop.shopName}</div><div style={{fontSize:12,color:T.muted,textTransform:"capitalize"}}>{shop.sector} · {shop.staff.length} staff · {shop.shiftHours}h shifts</div><div style={{fontSize:11,color:T.blue,marginTop:4,wordBreak:"break-all",lineHeight:1.5}}>📲 Staff link: {staffUrl}</div></div><span style={{fontSize:20,color:T.muted,flexShrink:0}}>›</span></div></Card>;})}
    {!shops.length&&<p style={{color:T.muted,fontSize:14,textAlign:"center",padding:"32px 0"}}>No businesses yet. Tap + Add Business.</p>}
    <div style={{marginTop:20,background:T.blueLight,borderRadius:12,padding:"14px 16px",border:"1px solid #BFDBFE"}}><div style={{fontSize:13,fontWeight:700,color:T.blue,marginBottom:4}}>🔗 Your Owner Dashboard Link</div><div style={{fontSize:13,color:T.blue,lineHeight:1.6,wordBreak:"break-all"}}>https://timesheet-owner-retail-intelligence.vercel.app/?owner={ownerId}</div><div style={{fontSize:12,color:T.blue,marginTop:6,opacity:0.7}}>Bookmark this. Each owner gets their own unique link.</div></div>
  </div>
  :<div style={{padding:"16px 16px 90px"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}><button onClick={()=>setView("list")} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"6px 12px",cursor:"pointer",color:T.text,fontSize:13,fontWeight:700}}>← Back</button><div style={{fontSize:18,fontWeight:800,color:T.text,flex:1}}>{view==="edit"?"Edit Business":"Add New Business"}</div>{view==="edit"&&editShop&&<button onClick={()=>setConfirmDelete(editShop)} style={{background:T.redLight,color:T.red,border:"none",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>🗑 Delete</button>}</div>
    <label style={lbl}>Business Name</label><input style={inp} value={fName} onChange={e=>setFName(e.target.value)} placeholder="e.g. Londis Horden"/>
    <label style={lbl}>Business ID (used in staff link)</label><input style={inp} value={fId} onChange={e=>setFId(e.target.value)} placeholder="e.g. londis_horden" disabled={view==="edit"}/>
    {view==="add"&&fId&&<div style={{fontSize:12,color:T.blue,marginTop:-8,marginBottom:12,wordBreak:"break-all"}}>📲 Staff link: https://timesheet-staff-retail-intelligence.vercel.app/?shop={fId}</div>}
    <label style={lbl}>Sector</label><select style={inp} value={fSector} onChange={e=>setFSector(e.target.value)}><option value="convenience">🏪 Convenience Store</option><option value="gym">🏋️ Gym / Fitness</option><option value="cafe">☕ Cafe / Coffee Shop</option><option value="bar">🍺 Bar / Pub</option><option value="restaurant">🍽️ Restaurant</option><option value="hotel">🏨 Hotel</option></select>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><label style={lbl}>Shift Hours</label><input style={inp} type="number" value={fHours} onChange={e=>setFHours(e.target.value)} min="1" max="12"/></div><div><label style={lbl}>Owner PIN</label><input style={inp} type="text" maxLength={4} value={fPin} onChange={e=>setFPin(e.target.value)} placeholder="0000"/></div></div>
    <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:12,marginTop:4}}>Staff Members</div>
    {fStaff.map((st,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.bg,borderRadius:10,padding:"10px 14px",marginBottom:8}}><Avatar name={st.name} size={32} color={SC[i%SC.length]}/><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:T.text}}>{st.name}</div><div style={{fontSize:12,color:T.muted}}>PIN: {st.pin} · {st.shift} · £{(st.hourlyRate||12.21).toFixed(2)}/hr</div></div><input type="number" step="0.01" min="0" value={st.hourlyRate||12.21} onChange={e=>setFStaff(p=>p.map((s,j)=>j===i?{...s,hourlyRate:parseFloat(e.target.value)||12.21}:s))} style={{width:64,padding:"4px 6px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,textAlign:"center",color:T.text}}/><button onClick={()=>setFStaff(p=>p.filter((_,j)=>j!==i))} style={{background:T.redLight,color:T.red,border:"none",borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Remove</button></div>)}
    <div style={{background:T.bg,borderRadius:12,padding:"14px",marginBottom:16,border:`1px dashed ${T.border}`}}><div style={{fontSize:13,fontWeight:700,color:T.sub,marginBottom:10}}>Add Staff Member</div><input style={{...inp,marginBottom:8}} value={nName} onChange={e=>setNName(e.target.value)} placeholder="Name"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><input style={{...inp,marginBottom:8}} type="text" maxLength={4} value={nPin} onChange={e=>setNPin(e.target.value)} placeholder="4-digit PIN"/><select style={{...inp,marginBottom:8}} value={nShift} onChange={e=>setNShift(e.target.value)}><option value="morning">Morning</option><option value="evening">Evening</option><option value="full">Full Day</option></select></div><div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:8,alignItems:"center",marginBottom:8}}><span style={{fontSize:13,fontWeight:700,color:T.sub,whiteSpace:"nowrap"}}>£ Hourly Rate</span><input style={{...inp,marginBottom:0}} type="number" step="0.01" min="0" value={nRate} onChange={e=>setNRate(e.target.value)} placeholder="12.21"/></div><button onClick={addStaff} style={{background:T.accent,color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer",width:"100%"}}>+ Add to Staff List</button></div>
    {saveMsg==="ok"&&<div style={{background:T.greenLight,color:T.green,borderRadius:10,padding:"12px 16px",fontSize:14,fontWeight:700,marginBottom:12}}>✓ Saved successfully!</div>}
    {saveMsg&&saveMsg!=="ok"&&<div style={{background:T.redLight,color:T.red,borderRadius:10,padding:"12px 16px",fontSize:14,marginBottom:12}}>⚠️ {saveMsg}</div>}
    <button onClick={handleSave} disabled={saving||!fName.trim()||!fId.trim()} style={{display:"block",width:"100%",background:saving?"#9ca3af":"#111",color:"#fff",border:"none",padding:"18px",borderRadius:12,fontSize:16,fontWeight:700,cursor:"pointer"}}>{saving?"Saving…":"Save Business"}</button>
  </div>}
  {confirmDelete&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:20}} onClick={()=>!deleting&&setConfirmDelete(null)}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:380,boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
      <div style={{width:52,height:52,borderRadius:"50%",background:T.redLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 16px"}}>🗑</div>
      <div style={{fontSize:19,fontWeight:800,color:T.text,textAlign:"center",marginBottom:8}}>Remove Business?</div>
      <div style={{fontSize:14,color:T.sub,textAlign:"center",lineHeight:1.7,marginBottom:8}}>You're about to remove <span style={{fontWeight:700,color:T.text}}>{confirmDelete.shopName}</span> from your dashboard.</div>
      <div style={{fontSize:13,color:T.muted,textAlign:"center",lineHeight:1.6,marginBottom:24}}>Staff will lose access to their timesheet link. All historical data will be retained.</div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>setConfirmDelete(null)} disabled={deleting} style={{flex:1,padding:"14px",borderRadius:14,background:T.bg,color:T.sub,fontSize:15,fontWeight:700,border:`1px solid ${T.border}`,cursor:"pointer"}}>Cancel</button>
        <button onClick={handleDelete} disabled={deleting} style={{flex:1,padding:"14px",borderRadius:14,background:T.red,color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer"}}>{deleting?"Removing…":"Remove"}</button>
      </div>
    </div>
  </div>}
  </>;
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

  if(loading)return <div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif"}}><div style={{textAlign:"center"}}><div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${T.div}`,borderTop:`3px solid ${T.accent}`,animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}/><p style={{color:T.muted,fontSize:15}}>Loading your business…</p></div><style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style></div>;
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
    {!currentShop?<div style={{padding:16}}><Card><p style={{color:T.muted,fontSize:14,textAlign:"center",margin:0}}>No shops found. Go to Manage to add your first shop.</p></Card></div>
    :isSubPage?(subNav.type==="staffDetail"?<StaffDetail name={subNav.staff} allRecs={myRecs} expDays={expDays} onNav={onNav} shopConfig={currentShop} onBack={()=>setSubNav(null)} onRemoveStaff={async()=>{await loadShops();setSubNav(null);}}/>:<TaskDetail task={subNav.task} staffName={subNav.staff} allRecs={myRecs} shopConfig={currentShop}/>)
    :bottomTab==="home"?<HomeTab allRecs={myRecs} allShifts={allShifts} allShops={shops} shopConfig={currentShop} currentShopId={currentShopId} ownedShopIds={ownedShopIds} expDays={expDays} dataLoading={dataLoading}/>
    :bottomTab==="benchmarks"?<BenchmarksTab allRecs={myRecs} allShifts={allShifts} allShops={shops} shopConfig={currentShop} currentShopId={currentShopId} ownedShopIds={ownedShopIds}/>
    :bottomTab==="staff"?<StaffTab allRecs={myRecs} expDays={expDays} onNav={onNav} shopConfig={currentShop} onShopConfigUpdated={async()=>{await loadShops();}}/>
    :bottomTab==="actions"?<ActionsTab shopConfig={currentShop} shopId={currentShopId}/>
    :<ManageTab shops={shops} ownerId={ownerId} onShopsUpdated={async()=>{await loadShops();}}/>}
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:`1px solid ${T.border}`,display:"flex",zIndex:20,boxShadow:"0 -4px 20px rgba(0,0,0,0.08)"}}>
      {[{id:"home",icon:"🏠",label:"Home"},{id:"benchmarks",icon:"📊",label:"Benchmarks"},{id:"staff",icon:"👥",label:"Staff"},{id:"actions",icon:"✏️",label:"Actions"},{id:"manage",icon:"⚙️",label:"Businesses"}].map(tab=><button key={tab.id} onClick={()=>{setBottomTab(tab.id);setSubNav(null);window.scrollTo(0,0);}} style={{flex:1,background:"none",border:"none",padding:"12px 0 16px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><span style={{fontSize:20}}>{tab.icon}</span><span style={{fontSize:10,fontWeight:700,color:bottomTab===tab.id?T.accent:T.muted}}>{tab.label}</span>{bottomTab===tab.id&&!isSubPage&&<div style={{width:20,height:3,borderRadius:99,background:T.accent,marginTop:1}}/>}</button>)}
    </div>
    {showSwitcher&&<ShopSwitcher shops={shops} currentShopId={currentShopId} onSelect={id=>{setCurrentShopId(id);setSubNav(null);setShowSwitcher(false);}} onClose={()=>setShowSwitcher(false)}/>}
    <style>{"@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}body{margin:0}::-webkit-scrollbar{display:none}"}</style>
  </div>;
}
