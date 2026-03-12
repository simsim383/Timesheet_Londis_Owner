import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from "recharts";

const T={bg:"#F5F5F7",card:"#FFFFFF",border:"#F0F0F0",text:"#0A0A0A",sub:"#6B7280",muted:"#9CA3AF",accent:"#E07B39",accentLight:"#FDF0E8",green:"#16A34A",greenLight:"#F0FDF4",red:"#DC2626",redLight:"#FEF2F2",amber:"#D97706",amberLight:"#FFFBEB",blue:"#2563EB",blueLight:"#EFF6FF",div:"#F3F4F6",purple:"#7C3AED",purpleLight:"#F5F3FF"};
const SC=["#E07B39","#2563EB","#8B5CF6","#16A34A","#D97706","#DC2626","#0891B2"];
const SECTOR_ICONS={convenience:"🏪",gym:"🏋️",cafe:"☕",bar:"🍺",restaurant:"🍽️",hotel:"🏨",default:"🏢"};
const ALL_DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const WDAYS=[1,2,3,4,5,6];
const DNAMES=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
// ── SUPABASE ──────────────────────────────────────────────────────
const SB_URL="https://zdotindfglkiasieqosq.supabase.co";
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkb3RpbmRmZ2xraWFzaWVxb3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjE1OTYsImV4cCI6MjA4ODg5NzU5Nn0.4VUdZQbsGFgnTmjbhp2_GFCV563soIKqbcvgrp7QJdI";
const SB_HDR={"apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}`,"Content-Type":"application/json","Prefer":"return=representation"};
async function sbGet(t,p=""){const r=await fetch(`${SB_URL}/rest/v1/${t}?${p}`,{headers:SB_HDR});if(!r.ok){const e=await r.json();throw new Error(e?.message||`GET ${t} failed`);}return r.json();}
async function sbPost(t,b){const r=await fetch(`${SB_URL}/rest/v1/${t}`,{method:"POST",headers:SB_HDR,body:JSON.stringify(b)});if(!r.ok){const e=await r.json();throw new Error(e?.message||`POST ${t} failed`);}return r.json();}
async function sbPatch(t,p,b){const r=await fetch(`${SB_URL}/rest/v1/${t}?${p}`,{method:"PATCH",headers:{...SB_HDR,"Prefer":"return=representation"},body:JSON.stringify(b)});if(!r.ok){const e=await r.json();throw new Error(e?.message||`PATCH ${t} failed`);}return r.json();}
async function sbDelete(t,p){const r=await fetch(`${SB_URL}/rest/v1/${t}?${p}`,{method:"DELETE",headers:SB_HDR});if(!r.ok){const e=await r.json();throw new Error(e?.message||`DELETE ${t} failed`);}return r.json();}

// Task categories mirrored from staff app — used to seed the category editor
const SECTOR_TASK_CATEGORIES_OWNER={
  convenience:[
    {category:"Customer Service",emoji:"🛎️",items:["Serving"]},
    {category:"Stacking",emoji:"📦",items:["Crisp Stacking","Pop Stacking","Beers Stacking","Wine Stacking","Dog Food Stacking","Fridge Stacking","Freezer Stacking","Grocery Stacking","Cards Stacking","Chocolate/Sweets Stacking","Mix Ups","Cigarette/Vape Stacking","Spirits Stacking"]},
    {category:"Checks",emoji:"✅",items:["Fridge Date Check / Temp Check","Product Date Checks"]},
    {category:"Cleaning",emoji:"🧹",items:["Fridges Clean","Mop","Door Clean / Outside Clean","Behind Counter Clean","Stock Room Clean"]},
    {category:"Admin & Ops",emoji:"📋",items:["Cash and Carry List","Magazine Returns","Newspaper Returns","Pies","Pricing","Promotions","Delivery Unload","Till Lift / End of Shift Count","Post Office","Personal Training"]},
    {category:"Other",emoji:"➕",items:[]},
  ],
  gym:[
    {category:"Equipment",emoji:"🏋️",items:["Equipment Check","Weights Area Tidy","Cardio Zone Check","Pool Check"]},
    {category:"Cleaning",emoji:"🧹",items:["Locker Room Clean","Deep Clean Zone","Cleaning Rota"]},
    {category:"Classes",emoji:"📅",items:["Class Setup"]},
    {category:"Reception",emoji:"🛎️",items:["Reception Cover","Membership Queries"]},
    {category:"Stock",emoji:"📦",items:["Towel Restock","Protein Bar Restock"]},
    {category:"Other",emoji:"➕",items:[]},
  ],
  cafe:[
    {category:"Opening",emoji:"🌅",items:["Opening Setup","Pastry Display"]},
    {category:"Drinks",emoji:"☕",items:["Milk Restock","Syrup Restock","Machine Clean"]},
    {category:"Cleaning",emoji:"🧹",items:["Floor Sweep","Window Clean","Closing Clean","Deep Clean"]},
    {category:"Stock",emoji:"📦",items:["Stock Count"]},
    {category:"Admin & Ops",emoji:"📋",items:["Till Check"]},
    {category:"Other",emoji:"➕",items:[]},
  ],
  bar:[
    {category:"Bar",emoji:"🍺",items:["Opening Setup","Bar Stock Check","Glass Polish","Fridge Restock"]},
    {category:"Cellar",emoji:"🪣",items:["Cellar Check"]},
    {category:"Cleaning",emoji:"🧹",items:["Floor Sweep","Deep Clean","Closing Clean"]},
    {category:"Admin & Ops",emoji:"📋",items:["Till Check"]},
    {category:"Other",emoji:"➕",items:[]},
  ],
  restaurant:[
    {category:"Kitchen",emoji:"🍳",items:["Kitchen Prep","Fridge Temp Check","Stock Count"]},
    {category:"Front of House",emoji:"🍽️",items:["Opening Setup","Table Setup"]},
    {category:"Cleaning",emoji:"🧹",items:["Floor Sweep","Deep Clean","Closing Clean"]},
    {category:"Admin & Ops",emoji:"📋",items:["Till Check"]},
    {category:"Other",emoji:"➕",items:[]},
  ],
  hotel:[
    {category:"Rooms",emoji:"🛏️",items:["Room Checks","Linen Restock"]},
    {category:"Reception",emoji:"🛎️",items:["Reception Cover","Breakfast Setup","Lost Property Log"]},
    {category:"Maintenance",emoji:"🔧",items:["Maintenance Check"]},
    {category:"Admin & Ops",emoji:"📋",items:["Stock Count","Closing Check"]},
    {category:"Other",emoji:"➕",items:[]},
  ],
};

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

function getOwnerIdFromURL(){return new URLSearchParams(window.location.search).get("owner")||null;}
function parseShop(row){return{id:row.id,shopId:row.id,shopName:row.name,sector:(row.sector||"convenience").toLowerCase(),shiftHours:parseInt(row.shift_hours||6),staff:Array.isArray(row.staff)?row.staff:(typeof row.staff==="string"?JSON.parse(row.staff):[]),staffNotes:row.staff_notes||{},ownerPin:row.owner_pin||"0000",ownerId:row.owner_id,taskCategories:row.task_categories||null};}
function parseRec(row){return{id:row.id,staff:row.staff_name||"",date:row.date||"",task:row.task||"",category:row.category||"",mins:Number(row.mins||0),notes:row.notes||"",incident:row.incident||false,week:Number(row.week||0),year:Number(row.year||0),shopId:row.shop_id||""};}
async function fetchOwnerShops(ownerId){const rows=await sbGet("shops",`owner_id=eq.${encodeURIComponent(ownerId)}&active=eq.true&order=name`);return rows.map(parseShop);}
async function fetchAllShops(){const rows=await sbGet("shops","active=eq.true&order=name");return rows.map(parseShop);}
async function fetchShiftsForShop(shopId){const since=new Date();since.setMonth(since.getMonth()-13);const s=since.toISOString().split("T")[0];const rows=await sbGet("shifts",`shop_id=eq.${encodeURIComponent(shopId)}&date=gte.${s}&order=date.desc&limit=50000`);return rows.map(parseRec).filter(r=>r.staff&&r.date);}
async function fetchAllShifts(){const since=new Date();since.setMonth(since.getMonth()-13);const s=since.toISOString().split("T")[0];const rows=await sbGet("shifts",`date=gte.${s}&order=date.desc&limit=200000`);return rows.map(parseRec).filter(r=>r.staff&&r.date);}
async function fetchSchedule(shopId,sector,staffNames){
  const defaults=SECTOR_DEFAULTS[sector]||SECTOR_DEFAULTS.convenience;
  let rows=[];
  try{rows=await sbGet("task_schedules",`shop_id=eq.${encodeURIComponent(shopId)}&order=staff_name`);}catch(e){console.warn("fetchSchedule failed:",e);}
  const sched=JSON.parse(JSON.stringify(defaults));
  rows.forEach(row=>{
    const{staff_name:staff,day,tasks,shift_start,shift_end,id}=row;
    if(!staff||!day)return;
    try{
      if(!sched[day])sched[day]={};
      if(tasks)sched[day][staff]=Array.isArray(tasks)?tasks:JSON.parse(tasks);
      if(!sched[day]._ids)sched[day]._ids={};
      sched[day]._ids[staff]=id;
      if(shift_start||shift_end){if(!sched[day]._times)sched[day]._times={};sched[day]._times[staff]={start:shift_start||"",end:shift_end||""};}
    }catch(e){}
  });
  return sched;
}
function saveScheduleToAirtable(sched,shopId,day,staff,tasks,existingId,shiftStart,shiftEnd){
  const payload={shop_id:shopId,staff_name:staff,day,tasks,shift_start:(shiftStart||"").trim()||null,shift_end:(shiftEnd||"").trim()||null,updated_at:new Date().toISOString()};
  if(existingId){
    return sbPatch("task_schedules",`id=eq.${existingId}`,payload).then(rows=>rows[0]?.id??existingId);
  }else{
    return fetch(`${SB_URL}/rest/v1/task_schedules`,{method:"POST",headers:{...SB_HDR,"Prefer":"resolution=merge-duplicates,return=representation"},body:JSON.stringify(payload)})
      .then(async r=>{if(!r.ok){const e=await r.json();throw new Error(e?.message||"Schedule save failed");}return r.json();})
      .then(rows=>rows[0]?.id);
  }
}
async function fetchStaffNotes(shopId){const rows=await sbGet("shops",`id=eq.${encodeURIComponent(shopId)}&select=staff_notes`);if(!rows.length)return{};return rows[0].staff_notes||{};}
async function saveStaffNotes(shopId,notes){return sbPatch("shops",`id=eq.${encodeURIComponent(shopId)}`,{staff_notes:notes});}
async function fetchAbsences(shopId){const rows=await sbGet("absences",`shop_id=eq.${encodeURIComponent(shopId)}&order=date.desc`);const out={};rows.forEach(row=>{if(!out[row.staff_name])out[row.staff_name]=[];out[row.staff_name].push({date:row.date,type:"absent",comment:row.comment||"",_id:row.id});});return out;}
async function saveAbsences(shopId,absencesObj){await sbDelete("absences",`shop_id=eq.${encodeURIComponent(shopId)}`);const rows=[];Object.entries(absencesObj).forEach(([staffName,entries])=>{(entries||[]).forEach(e=>{rows.push({shop_id:shopId,staff_name:staffName,date:e.date,comment:e.comment||null});});});if(rows.length)await sbPost("absences",rows);}
async function createShop(data){const rows=await sbPost("shops",{id:data.shopId,name:data.shopName,sector:data.sector,owner_id:data.ownerId,owner_pin:data.ownerPin,shift_hours:String(data.shiftHours||8),active:true,staff:data.staff||[],staff_notes:{},task_categories:data.taskCategories||null});return rows[0];}
async function updateShop(shopId,data){const rows=await sbPatch("shops",`id=eq.${encodeURIComponent(shopId)}`,{name:data.shopName,sector:data.sector,owner_id:data.ownerId,owner_pin:data.ownerPin,shift_hours:String(data.shiftHours||8),staff:data.staff||[],task_categories:data.taskCategories!==undefined?data.taskCategories:undefined});return rows[0];}
async function deleteShop(shopId){return sbPatch("shops",`id=eq.${encodeURIComponent(shopId)}`,{active:false});}
async function fetchCustomTasks(shopId){try{const rows=await sbGet("custom_tasks",`shop_id=eq.${encodeURIComponent(shopId)}&order=category,name`);return rows;}catch(e){return[];}}
async function saveCustomTask(shopId,name,category){return sbPost("custom_tasks",{shop_id:shopId,name:name.trim(),category});}
async function deleteCustomTask(id){return sbDelete("custom_tasks",`id=eq.${id}`);}

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
  const recs=useMemo(()=>filterPeriod(allRecs,period),[allRecs,period]);
  const prevRecs=useMemo(()=>filterPrev(allRecs,period),[allRecs,period]);
  const sdm=useMemo(()=>staffDatesMap(allRecs,shopConfig.staff.map(s=>s.name)),[allRecs]);
  const today=todayStr();const isWorkDay=WDAYS.includes(new Date().getDay());
  return <div style={{paddingBottom:90}}><PeriodToggle period={period} setPeriod={setPeriod}/><div style={{padding:"14px 16px 0"}}>
    <div style={{fontSize:20,fontWeight:800,color:T.text,marginBottom:14}}>Staff</div>
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
  const [customTasks,setCustomTasks]=useState([]);const [savingCustom,setSavingCustom]=useState(false);
  // permanence modal state — shown when a typed custom task is added
  const [permanenceTask,setPermanenceTask]=useState(null); // {name, addToSchedule:bool}
  const [permanenceCat,setPermanenceCat]=useState("Other");
  const [activeSection,setActiveSection]=useState("schedule"); // "schedule" | "absences"
  const [absences,setAbsences]=useState({});const [absFrom,setAbsFrom]=useState("");const [absTo,setAbsTo]=useState("");const [absComment,setAbsComment]=useState("");const [savingAbs,setSavingAbs]=useState(false);
  const [shiftStart,setShiftStart]=useState("");const [shiftEnd,setShiftEnd]=useState("");
  // Reset everything when the active shop changes
  useEffect(()=>{setSelStaff(null);setSchedule(null);setSaveStatus(null);setAdding(false);setNewTask("");setActiveSection("schedule");},[shopId]);
  useEffect(()=>{if(!shopId)return;fetchCustomTasks(shopId).then(setCustomTasks).catch(()=>{});},[shopId]);
  // Load absences when shop loads
  useEffect(()=>{if(shopConfig?.id)fetchAbsences(shopConfig.id).then(setAbsences).catch(()=>{});},[shopConfig?.id]);
  // Fetch schedule when a staff member is selected for the current shop
  useEffect(()=>{if(!selStaff||!shopId)return;setLoadingS(true);setSchedule(null);const staffNames=shopConfig.staff.map(s=>s.name);fetchSchedule(shopId,shopConfig.sector,staffNames).then(s=>{setSchedule(s);setLoadingS(false);}).catch(()=>{setSchedule(JSON.parse(JSON.stringify(SECTOR_DEFAULTS[shopConfig.sector]||SECTOR_DEFAULTS.convenience)));setLoadingS(false);});},[selStaff,shopId]);
  // Load current times when day or staff changes
  useEffect(()=>{if(!schedule||!selStaff)return;const t=schedule[selDay]?._times?.[selStaff];setShiftStart(t?.start||"");setShiftEnd(t?.end||"");},[schedule,selDay,selStaff]);
  // Staff-specific tasks first, then sector default for the day, then empty
  const todayTasks=schedule&&selStaff&&schedule[selDay]?(schedule[selDay][selStaff]!==undefined?schedule[selDay][selStaff]:schedule[selDay]._all||[]):[];
  // Merge built-in pool with this shop's saved custom tasks
  const allAvailableTasks=[...new Set([...TASK_POOL,...customTasks.map(t=>t.name)])];
  const unusedTasks=allAvailableTasks.filter(t=>!todayTasks.includes(t));
  const existingId=schedule&&schedule[selDay]&&schedule[selDay]._ids?schedule[selDay]._ids[selStaff]||null:null;
  const [saveError,setSaveError]=useState(null);
  // Categories for this sector, used in the permanence modal
  const SECTOR_CATS={convenience:["Admin & Ops","Stacking","Cleaning","Checks","Customer Service","Other"],gym:["Equipment","Cleaning","Classes","Reception","Stock","Other"],cafe:["Opening","Drinks","Cleaning","Stock","Other"],bar:["Bar","Cellar","Cleaning","Stock","Other"],restaurant:["Kitchen","Front of House","Cleaning","Stock","Other"],hotel:["Rooms","Reception","Cleaning","Stock","Other"]};
  const sectorCats=SECTOR_CATS[shopConfig?.sector||"convenience"]||SECTOR_CATS.convenience;
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
  function addTaskToSchedule(t){
    if(!t||!t.trim())return;
    if(todayTasks.includes(t)){setNewTask("");setAdding(false);return;}
    const nt=[...todayTasks,t];
    const currId=existingId;
    setSchedule(prev=>{const u=JSON.parse(JSON.stringify(prev));if(!u[selDay])u[selDay]={};u[selDay][selStaff]=nt;return u;});
    persistChange(nt,undefined,undefined,currId);
    setNewTask("");setAdding(false);
  }
  function addTask(t){
    if(!t||!t.trim())return;
    // If it's a new task not in the built-in pool and not already saved as custom, show permanence modal
    const isKnown=TASK_POOL.includes(t)||customTasks.some(c=>c.name===t);
    if(!isKnown){
      // Queue the task — user decides one-off or permanent
      setPermanenceTask(t);setPermanenceCat(sectorCats[0]||"Other");
    }else{
      addTaskToSchedule(t);
    }
  }
  const confirmPermanence=async(permanent)=>{
    const t=permanenceTask;
    if(!t){setPermanenceTask(null);return;}
    if(permanent){
      setSavingCustom(true);
      try{
        await saveCustomTask(shopId,t,permanenceCat);
        const updated=await fetchCustomTasks(shopId);
        setCustomTasks(updated);
      }catch(e){console.warn("Custom task save failed",e);}
      finally{setSavingCustom(false);}
    }
    addTaskToSchedule(t);
    setPermanenceTask(null);
  };
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
      {adding&&<Card style={{marginBottom:12,border:`1px solid ${T.accent}`}}>
        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:10}}>Add task for {selDay}</div>
        {customTasks.length>0&&<><div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>Your saved tasks</div><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{customTasks.filter(t=>!todayTasks.includes(t.name)).map(t=><button key={t.id} onClick={()=>addTaskToSchedule(t.name)} style={{background:T.accentLight,border:`1px solid ${T.accent}`,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:700,color:T.accent,cursor:"pointer"}}>{t.name}</button>)}</div></>}
        <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>Common tasks</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{unusedTasks.filter(t=>!customTasks.some(c=>c.name===t)).slice(0,12).map(t=><button key={t} onClick={()=>addTask(t)} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:600,color:T.sub,cursor:"pointer"}}>{t}</button>)}</div>
        <div style={{display:"flex",gap:8}}><input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addTask(newTask);}} placeholder="Type a new task…" style={{flex:1,padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:14,color:T.text}}/><button onClick={()=>addTask(newTask)} disabled={!newTask.trim()} style={{background:newTask.trim()?T.accent:"#9ca3af",color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Add</button></div>
        <button onClick={()=>setAdding(false)} style={{background:"none",border:"none",color:T.muted,fontSize:13,cursor:"pointer",marginTop:8,padding:0}}>Cancel</button>
      </Card>}
      <Card>{todayTasks.length===0&&<p style={{color:T.muted,fontSize:14,margin:0}}>No tasks for {selDay}. Tap + Add.</p>}{todayTasks.map((task,i)=><div key={task} style={{display:"flex",alignItems:"center",gap:10,padding:"13px 0",borderTop:i===0?"none":`1px solid ${T.div}`}}><div style={{width:10,height:10,borderRadius:"50%",background:T.accent,flexShrink:0}}/><span style={{flex:1,fontSize:14,fontWeight:600,color:T.text}}>{task}</span><button onClick={()=>setConfirmTask(task)} disabled={saving} style={{background:T.redLight,color:T.red,border:"none",borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:700,cursor:"pointer",opacity:saving?0.5:1}}>Remove</button></div>)}</Card>
    </>}
    {confirmTask&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={()=>setConfirmTask(null)}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:480,margin:"0 auto"}}><div style={{width:40,height:4,borderRadius:99,background:"#E5E7EB",margin:"0 auto 20px"}}/><div style={{fontSize:17,fontWeight:800,color:T.text,marginBottom:8,textAlign:"center"}}>Remove Task?</div><div style={{fontSize:14,color:T.sub,textAlign:"center",marginBottom:24,lineHeight:1.6}}>Remove "{confirmTask}" from {selStaff}'s {selDay} schedule?</div><div style={{display:"flex",gap:10}}><button onClick={()=>setConfirmTask(null)} style={{flex:1,padding:"14px",borderRadius:14,background:T.bg,color:T.sub,fontSize:15,fontWeight:700,border:`1px solid ${T.border}`,cursor:"pointer"}}>Cancel</button><button onClick={()=>{removeTask(confirmTask);setConfirmTask(null);}} style={{flex:1,padding:"14px",borderRadius:14,background:T.red,color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer"}}>Remove</button></div></div></div>}
    {/* ── Permanence modal — shown when a new custom task is typed ── */}
    {permanenceTask&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"flex-end",zIndex:300}}><div style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"28px 20px 44px",width:"100%",maxWidth:480,margin:"0 auto"}}>
      <div style={{width:40,height:4,borderRadius:99,background:"#E5E7EB",margin:"0 auto 20px"}}/>
      <div style={{fontSize:18,fontWeight:900,color:T.text,marginBottom:4,textAlign:"center"}}>"{permanenceTask}"</div>
      <div style={{fontSize:14,color:T.sub,textAlign:"center",marginBottom:24,lineHeight:1.6}}>Is this a one-off task, or should it be saved to your task list so staff can log it any week?</div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:12,fontWeight:700,color:T.sub,marginBottom:8}}>Category (if saving permanently)</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{sectorCats.map(cat=><button key={cat} onClick={()=>setPermanenceCat(cat)} style={{padding:"7px 14px",borderRadius:20,border:`1.5px solid ${permanenceCat===cat?T.accent:T.border}`,background:permanenceCat===cat?T.accentLight:"#fff",color:permanenceCat===cat?T.accent:T.sub,fontSize:13,fontWeight:700,cursor:"pointer"}}>{cat}</button>)}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <button onClick={()=>confirmPermanence(true)} disabled={savingCustom} style={{padding:"16px",borderRadius:14,background:T.accent,color:"#fff",fontSize:15,fontWeight:800,border:"none",cursor:"pointer",opacity:savingCustom?0.6:1}}>{savingCustom?"Saving…":"💾 Save permanently + add to today"}</button>
        <button onClick={()=>confirmPermanence(false)} style={{padding:"16px",borderRadius:14,background:T.bg,color:T.sub,fontSize:15,fontWeight:700,border:`1px solid ${T.border}`,cursor:"pointer"}}>One-off — just add to today</button>
        <button onClick={()=>setPermanenceTask(null)} style={{background:"none",border:"none",color:T.muted,fontSize:13,cursor:"pointer",padding:4}}>Cancel</button>
      </div>
    </div></div>}
    </>}
  </div>;
}


// ── CATEGORY EDITOR ──────────────────────────────────────────────────────────
// Shown as a full sub-view inside the Businesses edit screen.
// fCats: [{category, emoji, items:[string]}]
// onSave: (cats) => void   onBack: () => void
function CategoryEditor({fCats,setFCats,sector,customTasks,onBack}){
  const [expandedIdx,setExpandedIdx]=useState(null);
  const [renamingIdx,setRenamingIdx]=useState(null);
  const [renameVal,setRenameVal]=useState("");
  const [newCatName,setNewCatName]=useState("");
  const [addingTask,setAddingTask]=useState(null); // category index
  const [newTaskVal,setNewTaskVal]=useState("");
  const inp={width:"100%",padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:14,color:T.text,boxSizing:"border-box",outline:"none"};

  const allTaskPool=[...new Set([
    ...fCats.flatMap(c=>c.items),
    ...customTasks.map(t=>t.name),
  ])];

  const moveTask=(fromCatIdx,task,toCatName)=>{
    setFCats(prev=>{
      const next=prev.map(c=>({...c,items:[...c.items]}));
      next[fromCatIdx].items=next[fromCatIdx].items.filter(t=>t!==task);
      const toIdx=next.findIndex(c=>c.category===toCatName);
      if(toIdx>=0&&!next[toIdx].items.includes(task))next[toIdx].items.push(task);
      return next;
    });
  };

  const removeTaskFromCat=(catIdx,task)=>{
    setFCats(prev=>prev.map((c,i)=>i===catIdx?{...c,items:c.items.filter(t=>t!==task)}:c));
  };

  const addTaskToCat=(catIdx,taskName)=>{
    if(!taskName.trim())return;
    setFCats(prev=>prev.map((c,i)=>{
      if(i!==catIdx)return c;
      if(c.items.includes(taskName.trim()))return c;
      return{...c,items:[...c.items,taskName.trim()]};
    }));
    setNewTaskVal("");setAddingTask(null);
  };

  const renameCategory=(idx,newName)=>{
    if(!newName.trim())return;
    setFCats(prev=>prev.map((c,i)=>i===idx?{...c,category:newName.trim()}:c));
    setRenamingIdx(null);setRenameVal("");
  };

  const deleteCategory=(idx)=>{
    setFCats(prev=>prev.filter((_,i)=>i!==idx));
    if(expandedIdx===idx)setExpandedIdx(null);
  };

  const addCategory=()=>{
    if(!newCatName.trim())return;
    setFCats(prev=>[...prev,{category:newCatName.trim(),emoji:"📌",items:[]}]);
    setNewCatName("");
  };

  const moveCatUp=(idx)=>{
    if(idx===0)return;
    setFCats(prev=>{const n=[...prev];[n[idx-1],n[idx]]=[n[idx],n[idx-1]];return n;});
    setExpandedIdx(idx-1);
  };
  const moveCatDown=(idx)=>{
    setFCats(prev=>{if(idx>=prev.length-1)return prev;const n=[...prev];[n[idx],n[idx+1]]=[n[idx+1],n[idx]];return n;});
    setExpandedIdx(idx+1);
  };

  // Tasks not in any category — orphans from custom tasks
  const assignedTasks=new Set(fCats.flatMap(c=>c.items));
  const unassigned=allTaskPool.filter(t=>!assignedTasks.has(t));

  return <div style={{padding:"0 0 90px"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 0 12px"}}>
      <button onClick={onBack} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"6px 12px",cursor:"pointer",color:T.text,fontSize:13,fontWeight:700}}>← Back</button>
      <div style={{fontSize:17,fontWeight:800,color:T.text,flex:1}}>Edit Categories</div>
    </div>
    <div style={{fontSize:13,color:T.sub,marginBottom:16,lineHeight:1.6}}>Rename categories, move tasks between them, or add new ones. Changes apply to this business only and update what staff see.</div>

    {fCats.map((cat,idx)=><div key={idx} style={{background:"#fff",borderRadius:14,border:`1.5px solid ${expandedIdx===idx?T.accent:T.border}`,marginBottom:10,overflow:"hidden"}}>
      {/* Category header */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"13px 14px",cursor:"pointer"}} onClick={()=>setExpandedIdx(expandedIdx===idx?null:idx)}>
        <span style={{fontSize:20}}>{cat.emoji||"📌"}</span>
        {renamingIdx===idx
          ? <input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")renameCategory(idx,renameVal);if(e.key==="Escape"){setRenamingIdx(null);}}}
              onClick={e=>e.stopPropagation()}
              style={{...inp,flex:1,padding:"6px 10px",marginBottom:0}}/>
          : <span style={{flex:1,fontSize:14,fontWeight:800,color:T.text}}>{cat.category}</span>
        }
        <span style={{fontSize:12,color:T.muted,fontWeight:600,marginRight:4}}>{cat.items.length} tasks</span>
        <span style={{fontSize:18,color:T.muted,transform:expandedIdx===idx?"rotate(90deg)":"none",transition:"transform 0.2s"}}>›</span>
      </div>

      {expandedIdx===idx&&<div style={{borderTop:`1px solid ${T.div}`,padding:"12px 14px"}}>
        {/* Rename + order controls */}
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          {renamingIdx===idx
            ? <><button onClick={()=>renameCategory(idx,renameVal)} style={{background:T.accent,color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save name</button>
                <button onClick={()=>setRenamingIdx(null)} style={{background:T.bg,color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Cancel</button></>
            : <button onClick={e=>{e.stopPropagation();setRenamingIdx(idx);setRenameVal(cat.category);}} style={{background:T.bg,color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>✏️ Rename</button>
          }
          <button onClick={()=>moveCatUp(idx)} disabled={idx===0} style={{background:T.bg,color:idx===0?T.muted:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:idx===0?"default":"pointer",opacity:idx===0?0.4:1}}>↑</button>
          <button onClick={()=>moveCatDown(idx)} disabled={idx===fCats.length-1} style={{background:T.bg,color:idx===fCats.length-1?T.muted:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:idx===fCats.length-1?"default":"pointer",opacity:idx===fCats.length-1?0.4:1}}>↓</button>
          {cat.items.length===0&&<button onClick={()=>deleteCategory(idx)} style={{background:T.redLight,color:T.red,border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>🗑 Delete</button>}
        </div>

        {/* Task list */}
        {cat.items.length===0&&<p style={{color:T.muted,fontSize:13,margin:"0 0 12px"}}>No tasks in this category.</p>}
        {cat.items.map(task=><div key={task} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 0",borderBottom:`1px solid ${T.div}`}}>
          <span style={{flex:1,fontSize:13,fontWeight:600,color:T.text}}>{task}</span>
          {/* Move to another category */}
          <select value="" onChange={e=>{if(e.target.value)moveTask(idx,task,e.target.value);}}
            style={{padding:"4px 8px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,color:T.sub,background:"#fff",cursor:"pointer"}}
            onClick={e=>e.stopPropagation()}>
            <option value="">Move to…</option>
            {fCats.filter((_,i)=>i!==idx).map(c=><option key={c.category} value={c.category}>{c.category}</option>)}
          </select>
          <button onClick={()=>removeTaskFromCat(idx,task)} style={{background:T.redLight,color:T.red,border:"none",borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>✕</button>
        </div>)}

        {/* Add task to this category */}
        {addingTask===idx
          ? <div style={{display:"flex",gap:8,marginTop:10}}>
              <input autoFocus value={newTaskVal} onChange={e=>setNewTaskVal(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")addTaskToCat(idx,newTaskVal);if(e.key==="Escape")setAddingTask(null);}}
                placeholder="Task name…" style={{...inp,flex:1,padding:"8px 10px",marginBottom:0}}/>
              <button onClick={()=>addTaskToCat(idx,newTaskVal)} style={{background:T.accent,color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Add</button>
              <button onClick={()=>setAddingTask(null)} style={{background:T.bg,color:T.sub,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontWeight:700,cursor:"pointer"}}>✕</button>
            </div>
          : <button onClick={()=>{setAddingTask(idx);setNewTaskVal("");}} style={{marginTop:10,background:T.bg,border:`1px dashed ${T.border}`,borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:700,color:T.sub,cursor:"pointer",width:"100%"}}>+ Add task to {cat.category}</button>
        }
      </div>}
    </div>)}

    {/* Unassigned tasks */}
    {unassigned.length>0&&<div style={{background:T.amberLight,borderRadius:12,padding:"12px 14px",marginBottom:14,border:`1px solid #FDE68A`}}>
      <div style={{fontSize:13,fontWeight:700,color:T.amber,marginBottom:8}}>⚠️ Unassigned tasks ({unassigned.length})</div>
      <div style={{fontSize:12,color:T.amber,marginBottom:10}}>These tasks aren't in any category. Assign them or they won't appear to staff.</div>
      {unassigned.map(task=><div key={task} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid #FDE68A`}}>
        <span style={{flex:1,fontSize:13,fontWeight:600,color:T.text}}>{task}</span>
        <select value="" onChange={e=>{if(!e.target.value)return;setFCats(prev=>prev.map(c=>c.category===e.target.value?{...c,items:[...c.items,task]}:c));}}
          style={{padding:"4px 8px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,color:T.sub,background:"#fff"}}>
          <option value="">Add to…</option>
          {fCats.map(c=><option key={c.category} value={c.category}>{c.category}</option>)}
        </select>
      </div>)}
    </div>}

    {/* Add new category */}
    <div style={{background:T.bg,borderRadius:12,padding:"14px",border:`1px dashed ${T.border}`,marginBottom:16}}>
      <div style={{fontSize:13,fontWeight:700,color:T.sub,marginBottom:8}}>Add New Category</div>
      <div style={{display:"flex",gap:8}}>
        <input value={newCatName} onChange={e=>setNewCatName(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter")addCategory();}}
          placeholder="e.g. Deliveries" style={{...inp,flex:1,marginBottom:0}}/>
        <button onClick={addCategory} disabled={!newCatName.trim()} style={{background:newCatName.trim()?"#111":"#9ca3af",color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Add</button>
      </div>
    </div>

    <div style={{background:T.blueLight,borderRadius:12,padding:"12px 14px",border:"1px solid #BFDBFE",fontSize:13,color:T.blue,lineHeight:1.6}}>
      💡 Changes are saved when you tap <strong>Save Business</strong> on the previous screen.
    </div>
  </div>;
}

function ManageTab({shops,ownerId,onShopsUpdated}){
  const [view,setView]=useState("list");const [editShop,setEditShop]=useState(null);const [saving,setSaving]=useState(false);const [saveMsg,setSaveMsg]=useState(null);
  const [confirmDelete,setConfirmDelete]=useState(null);const [deleting,setDeleting]=useState(false);
  const [fName,setFName]=useState("");const [fId,setFId]=useState("");const [fSector,setFSector]=useState("convenience");const [fHours,setFHours]=useState("6");const [fPin,setFPin]=useState("0000");const [fStaff,setFStaff]=useState([]);
  const [managingTasksFor,setManagingTasksFor]=useState(null); // shopId
  const [shopCustomTasks,setShopCustomTasks]=useState([]);const [loadingCT,setLoadingCT]=useState(false);const [deletingCT,setDeletingCT]=useState(null);
  const openTaskManager=async(shop)=>{setManagingTasksFor(shop);setLoadingCT(true);try{const t=await fetchCustomTasks(shop.shopId);setShopCustomTasks(t);}catch(e){}finally{setLoadingCT(false);}};
  // Category editor state
  const [editingCats,setEditingCats]=useState(false);
  const [fCats,setFCats]=useState([]); // [{category,emoji,items}]
  const [editCatCustomTasks,setEditCatCustomTasks]=useState([]);
  const [nName,setNName]=useState("");const [nPin,setNPin]=useState("");const [nShift,setNShift]=useState("morning");const [nRate,setNRate]=useState("12.21");const [nHours,setNHours]=useState("6");
  const openEdit=async(shop)=>{
    setEditShop(shop);setFName(shop.shopName);setFId(shop.shopId);setFSector(shop.sector);setFHours(String(shop.shiftHours));setFPin(shop.ownerPin||"0000");setFStaff([...shop.staff]);
    // Init category editor — use saved custom or fall back to sector default
    const base=shop.taskCategories||SECTOR_TASK_CATEGORIES_OWNER[shop.sector]||SECTOR_TASK_CATEGORIES_OWNER.convenience;
    setFCats(JSON.parse(JSON.stringify(base)));
    setEditingCats(false);
    // Also fetch custom tasks for this shop so editor knows about them
    try{const ct=await fetchCustomTasks(shop.shopId);setEditCatCustomTasks(ct);}catch(e){setEditCatCustomTasks([]);}
    setView("edit");
  };
  const openAdd=()=>{setEditShop(null);setFName("");setFId("");setFSector("convenience");setFHours("6");setFPin("0000");setFStaff([]);setFCats(JSON.parse(JSON.stringify(SECTOR_TASK_CATEGORIES_OWNER.convenience)));setEditingCats(false);setEditCatCustomTasks([]);setView("add");};
  const addStaff=()=>{if(!nName.trim()||nPin.length!==4)return;setFStaff(p=>[...p,{name:nName.trim(),pin:nPin,initials:nName.trim().slice(0,2).toUpperCase(),shift:nShift,hourlyRate:parseFloat(nRate)||12.21,shiftHours:parseFloat(nHours)||parseFloat(fHours)||6}]);setNName("");setNPin("");setNShift("morning");setNRate("12.21");setNHours(fHours||"6");};
  const handleSave=async()=>{if(!fName.trim()||!fId.trim())return;setSaving(true);setSaveMsg(null);try{const data={shopId:fId.trim().toLowerCase().replace(/\s+/g,"_"),shopName:fName.trim(),sector:fSector,shiftHours:parseInt(fHours)||6,staff:fStaff,ownerPin:fPin,ownerId,taskCategories:fCats};if(editShop)await updateShop(editShop.id,data);else await createShop(data);setSaveMsg("ok");await onShopsUpdated();setTimeout(()=>{setSaveMsg(null);setView("list");},1500);}catch(e){setSaveMsg(e.message||"Save failed");}finally{setSaving(false);}};
  const handleDelete=async()=>{if(!confirmDelete)return;setDeleting(true);try{await deleteShop(confirmDelete.id);await onShopsUpdated();setConfirmDelete(null);setView("list");}catch(e){setSaveMsg(e.message||"Delete failed");}finally{setDeleting(false);}};
  const inp={width:"100%",padding:"12px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:15,color:T.text,boxSizing:"border-box",marginBottom:12,outline:"none"};
  const lbl={display:"block",fontSize:13,fontWeight:700,color:T.sub,marginBottom:6};
  return <>
  {view==="list"?<div style={{padding:"16px 16px 90px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><div style={{fontSize:20,fontWeight:800,color:T.text}}>Manage Businesses</div><button onClick={openAdd} style={{background:"#111",color:"#fff",border:"none",borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add Business</button></div>
    <div style={{fontSize:14,color:T.muted,marginBottom:20}}>Edit settings and staff for each of your businesses.</div>
    {shops.map((shop,i)=>{const staffUrl=`https://timesheet-staff-retail-intelligence.vercel.app/?shop=${shop.shopId}`;return <Card key={shop.shopId} style={{marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>openEdit(shop)}><div style={{width:44,height:44,borderRadius:12,background:SC[i%SC.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{SECTOR_ICONS[shop.sector]||"🏢"}</div><div style={{flex:1}}><div style={{fontSize:15,fontWeight:800,color:T.text}}>{shop.shopName}</div><div style={{fontSize:12,color:T.muted,textTransform:"capitalize"}}>{shop.sector} · {shop.staff.length} staff</div><div style={{fontSize:11,color:T.blue,marginTop:4,wordBreak:"break-all",lineHeight:1.5}}>📲 Staff link: {staffUrl}</div></div><span style={{fontSize:20,color:T.muted,flexShrink:0}}>›</span></div><button onClick={()=>openTaskManager(shop)} style={{marginTop:10,width:"100%",background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:700,color:T.sub,cursor:"pointer",textAlign:"left"}}>📋 Manage saved tasks for {shop.shopName}</button></Card>;})}
    {!shops.length&&<p style={{color:T.muted,fontSize:14,textAlign:"center",padding:"32px 0"}}>No businesses yet. Tap + Add Business.</p>}
    <div style={{marginTop:20,background:T.blueLight,borderRadius:12,padding:"14px 16px",border:"1px solid #BFDBFE"}}><div style={{fontSize:13,fontWeight:700,color:T.blue,marginBottom:4}}>🔗 Your Owner Dashboard Link</div><div style={{fontSize:13,color:T.blue,lineHeight:1.6,wordBreak:"break-all"}}>https://timesheet-owner-retail-intelligence.vercel.app/?owner={ownerId}</div><div style={{fontSize:12,color:T.blue,marginTop:6,opacity:0.7}}>Bookmark this. Each owner gets their own unique link.</div></div>
  </div>
  :<div style={{padding:"16px 16px 90px"}}>
    {editingCats && <CategoryEditor fCats={fCats} setFCats={setFCats} sector={fSector} customTasks={editCatCustomTasks} onBack={()=>setEditingCats(false)}/>}
    {!editingCats && <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}><button onClick={()=>setView("list")} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"6px 12px",cursor:"pointer",color:T.text,fontSize:13,fontWeight:700}}>← Back</button><div style={{fontSize:18,fontWeight:800,color:T.text,flex:1}}>{view==="edit"?"Edit Business":"Add New Business"}</div>{view==="edit"&&editShop&&<button onClick={()=>setConfirmDelete(editShop)} style={{background:T.redLight,color:T.red,border:"none",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>🗑 Delete</button>}</div>}
    {!editingCats && <div>
    <label style={lbl}>Business Name</label><input style={inp} value={fName} onChange={e=>setFName(e.target.value)} placeholder="e.g. Londis Horden"/>
    <label style={lbl}>Business ID (used in staff link)</label><input style={inp} value={fId} onChange={e=>setFId(e.target.value)} placeholder="e.g. londis_horden" disabled={view==="edit"}/>
    {view==="add"&&fId&&<div style={{fontSize:12,color:T.blue,marginTop:-8,marginBottom:12,wordBreak:"break-all"}}>📲 Staff link: https://timesheet-staff-retail-intelligence.vercel.app/?shop={fId}</div>}
    <label style={lbl}>Sector</label><select style={inp} value={fSector} onChange={e=>setFSector(e.target.value)}><option value="convenience">🏪 Convenience Store</option><option value="gym">🏋️ Gym / Fitness</option><option value="cafe">☕ Cafe / Coffee Shop</option><option value="bar">🍺 Bar / Pub</option><option value="restaurant">🍽️ Restaurant</option><option value="hotel">🏨 Hotel</option></select>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:4}}><div><label style={lbl}>Default Shift Hours</label><input style={inp} type="number" value={fHours} onChange={e=>setFHours(e.target.value)} min="1" max="16"/><div style={{fontSize:11,color:T.muted,marginTop:-8,marginBottom:8}}>Used as fallback if staff member has no individual hours set</div></div><div><label style={lbl}>Owner PIN</label><input style={inp} type="text" maxLength={4} value={fPin} onChange={e=>setFPin(e.target.value)} placeholder="0000"/></div></div>
    <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:12,marginTop:4}}>Staff Members</div>
    {fStaff.map((st,i)=><div key={i} style={{background:T.bg,borderRadius:10,padding:"12px 14px",marginBottom:8,border:`1px solid ${T.border}`}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <Avatar name={st.name} size={32} color={SC[i%SC.length]}/>
        <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:T.text}}>{st.name}</div><div style={{fontSize:12,color:T.muted}}>PIN: {st.pin} · {st.shift}</div></div>
        <button onClick={()=>setFStaff(p=>p.filter((_,j)=>j!==i))} style={{background:T.redLight,color:T.red,border:"none",borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Remove</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div><div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:4}}>SHIFT HOURS</div><input type="number" step="0.5" min="1" max="16" value={st.shiftHours||fHours||6} onChange={e=>setFStaff(p=>p.map((s,j)=>j===i?{...s,shiftHours:parseFloat(e.target.value)||6}:s))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,color:T.text,outline:"none"}}/></div>
        <div><div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:4}}>HOURLY RATE (£)</div><input type="number" step="0.01" min="0" value={st.hourlyRate||12.21} onChange={e=>setFStaff(p=>p.map((s,j)=>j===i?{...s,hourlyRate:parseFloat(e.target.value)||12.21}:s))} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,color:T.text,outline:"none"}}/></div>
      </div>
    </div>)}
    <div style={{background:T.bg,borderRadius:12,padding:"14px",marginBottom:16,border:`1px dashed ${T.border}`}}><div style={{fontSize:13,fontWeight:700,color:T.sub,marginBottom:10}}>Add Staff Member</div><input style={{...inp,marginBottom:8}} value={nName} onChange={e=>setNName(e.target.value)} placeholder="Name"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><input style={{...inp,marginBottom:8}} type="text" maxLength={4} value={nPin} onChange={e=>setNPin(e.target.value)} placeholder="4-digit PIN"/><select style={{...inp,marginBottom:8}} value={nShift} onChange={e=>setNShift(e.target.value)}><option value="morning">Morning</option><option value="evening">Evening</option><option value="full">Full Day</option></select></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}><div><div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:4}}>SHIFT HOURS</div><input type="number" step="0.5" min="1" max="16" value={nHours} onChange={e=>setNHours(e.target.value)} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,color:T.text,outline:"none",boxSizing:"border-box"}}/></div><div><div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:4}}>HOURLY RATE (£)</div><input type="number" step="0.01" min="0" value={nRate} onChange={e=>setNRate(e.target.value)} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,color:T.text,outline:"none",boxSizing:"border-box"}}/></div></div><button onClick={addStaff} style={{background:T.accent,color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer",width:"100%"}}>+ Add to Staff List</button></div>
    {saveMsg==="ok"&&<div style={{background:T.greenLight,color:T.green,borderRadius:10,padding:"12px 16px",fontSize:14,fontWeight:700,marginBottom:12}}>✓ Saved successfully!</div>}
    {saveMsg&&saveMsg!=="ok"&&<div style={{background:T.redLight,color:T.red,borderRadius:10,padding:"12px 16px",fontSize:14,marginBottom:12}}>⚠️ {saveMsg}</div>}
    <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:10,marginTop:4}}>Task Categories</div>
    <div style={{background:T.bg,borderRadius:12,border:`1px solid ${T.border}`,padding:"12px 14px",marginBottom:16}}>
      <div style={{fontSize:13,color:T.sub,marginBottom:10,lineHeight:1.5}}>Control which task categories staff see and what's in each one. Currently <strong>{fCats.length}</strong> categories with <strong>{fCats.reduce((a,c)=>a+c.items.length,0)}</strong> tasks.</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{fCats.map(c=><span key={c.category} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600,color:T.sub}}>{c.emoji||"📌"} {c.category} ({c.items.length})</span>)}</div>
      <button onClick={()=>setEditingCats(true)} style={{background:"#111",color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer",width:"100%"}}>✏️ Edit Categories</button>
    </div>
    <button onClick={handleSave} disabled={saving||!fName.trim()||!fId.trim()} style={{display:"block",width:"100%",background:saving?"#9ca3af":"#111",color:"#fff",border:"none",padding:"18px",borderRadius:12,fontSize:16,fontWeight:700,cursor:"pointer"}}>{saving?"Saving…":"Save Business"}</button>
    </div>}
  {managingTasksFor&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",zIndex:300}} onClick={()=>setManagingTasksFor(null)}>
    <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 44px",width:"100%",maxWidth:480,margin:"0 auto",maxHeight:"80vh",overflowY:"auto"}}>
      <div style={{width:40,height:4,borderRadius:99,background:"#E5E7EB",margin:"0 auto 16px"}}/>
      <div style={{fontSize:17,fontWeight:800,color:T.text,marginBottom:4}}>📋 Saved Tasks</div>
      <div style={{fontSize:13,color:T.sub,marginBottom:20,lineHeight:1.6}}>{managingTasksFor.shopName} — tasks your staff can log any week. Add via Actions tab when scheduling.</div>
      {loadingCT?<div style={{color:T.muted,fontSize:14,textAlign:"center",padding:"24px 0"}}>Loading…</div>:shopCustomTasks.length===0?<div style={{color:T.muted,fontSize:14,textAlign:"center",padding:"24px 0"}}>No saved tasks yet. When you add a new task in the Actions tab and choose "Save permanently", it will appear here.</div>:
      <div>{Object.entries(shopCustomTasks.reduce((acc,t)=>{if(!acc[t.category])acc[t.category]=[];acc[t.category].push(t);return acc;},{})).map(([cat,tasks])=><div key={cat} style={{marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>{cat}</div>
        {tasks.map(t=><div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:T.bg,borderRadius:10,marginBottom:6}}>
          <span style={{flex:1,fontSize:14,fontWeight:600,color:T.text}}>{t.name}</span>
          <button onClick={async()=>{setDeletingCT(t.id);try{await deleteCustomTask(t.id);setShopCustomTasks(p=>p.filter(x=>x.id!==t.id));}catch(e){}finally{setDeletingCT(null);}}} disabled={deletingCT===t.id} style={{background:T.redLight,color:T.red,border:"none",borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:700,cursor:"pointer",opacity:deletingCT===t.id?0.5:1}}>{deletingCT===t.id?"…":"Remove"}</button>
        </div>)}
      </div>)}</div>}
      <button onClick={()=>setManagingTasksFor(null)} style={{marginTop:8,width:"100%",background:"#111",color:"#fff",border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer"}}>Done</button>
    </div>
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

function NewOwnerSetup(){
  const [step,setStep]=useState(1); // 1=invite code, 2=choose owner id, 3=done
  const [inviteCode,setInviteCode]=useState("");
  const [inviteMsg,setInviteMsg]=useState(null);
  const [inviteChecking,setInviteChecking]=useState(false);
  const [ownerId,setOwnerId]=useState("");
  const [ownerIdConfirmed,setOwnerIdConfirmed]=useState("");
  const [checking,setChecking]=useState(false);
  const [checkMsg,setCheckMsg]=useState(null);
  const inp={width:"100%",padding:"14px 16px",borderRadius:12,border:`1.5px solid ${T.border}`,fontSize:16,color:T.text,boxSizing:"border-box",outline:"none",marginBottom:8};
  const ownerUrl=`https://timesheet-owner-retail-intelligence.vercel.app/?owner=${ownerIdConfirmed}`;

  const checkInviteCode=async()=>{
    const code=inviteCode.trim().toUpperCase();
    if(!code){setInviteMsg("Please enter your invite code");return;}
    setInviteChecking(true);setInviteMsg(null);
    try{
      const rows=await sbGet("invite_codes",`code=eq.${encodeURIComponent(code)}&limit=1`);
      if(!rows.length){setInviteMsg("That code isn't valid — check it and try again, or contact support.");return;}
      if(rows[0].used){setInviteMsg("That code has already been used. Each code can only be used once. Contact support if you need a new one.");return;}
      setStep(2);
    }catch(e){setInviteMsg("Could not verify code. Try again.");}
    finally{setInviteChecking(false);}
  };

  const checkAvailability=async()=>{
    const id=ownerId.trim().toLowerCase().replace(/\s+/g,"_");
    if(!id||id.length<3){setCheckMsg("ID must be at least 3 characters");return;}
    setChecking(true);setCheckMsg(null);
    try{
      const [takenOwner,takenShop]=await Promise.all([
        sbGet("owner_ids",`id=eq.${encodeURIComponent(id)}&limit=1`),
        sbGet("shops",`id=eq.${encodeURIComponent(id)}&limit=1`),
      ]);
      if(takenOwner.length>0||takenShop.length>0){
        setCheckMsg("That ID is already taken — try something more specific, e.g. 'smith_retail' or 'joes_cafe_london'");return;
      }
      // Claim the ID immediately — this is the single source of truth
      // If this fails (e.g. race condition or duplicate) it will throw and we catch below
      await sbPost("owner_ids",{id,created_at:new Date().toISOString()});
      // Mark invite code as used
      const code=inviteCode.trim().toUpperCase();
      await sbPatch("invite_codes",`code=eq.${encodeURIComponent(code)}`,{used:true,used_by:id,used_at:new Date().toISOString()});
      setOwnerIdConfirmed(id);setStep(3);
    }catch(e){
      // If the error mentions duplicate/unique violation, give a clear message
      const msg=e.message||"";
      if(msg.includes("duplicate")||msg.includes("unique")||msg.includes("already exists")||msg.includes("23505")){
        setCheckMsg("That ID is already taken — try something more specific.");
      }else{
        setCheckMsg("Could not complete setup: "+msg+". Please try again.");
      }
    }
    finally{setChecking(false);}
  };

  return <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif",padding:20}}>
    <div style={{width:"100%",maxWidth:420}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:40,marginBottom:12}}>📊</div>
        <div style={{fontSize:26,fontWeight:900,color:T.text,letterSpacing:-0.5}}>Retail Intelligence</div>
        <div style={{fontSize:15,color:T.muted,marginTop:6}}>Owner Dashboard Setup</div>
      </div>

      {step===1&&<div style={{background:"#fff",borderRadius:20,padding:"28px 24px",boxShadow:"0 4px 24px rgba(0,0,0,0.07)"}}>
        <div style={{fontSize:18,fontWeight:800,color:T.text,marginBottom:6}}>Enter your invite code</div>
        <div style={{fontSize:14,color:T.sub,marginBottom:20,lineHeight:1.6}}>You should have received a unique invite code. Each code can only be used once to create one account.</div>
        <input style={{...inp,textTransform:"uppercase",letterSpacing:2,fontWeight:700}} value={inviteCode} onChange={e=>setInviteCode(e.target.value.toUpperCase())} placeholder="e.g. HORDEN-2026" onKeyDown={e=>{if(e.key==="Enter")checkInviteCode();}}/>
        {inviteMsg&&<div style={{background:T.redLight,color:T.red,borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:12,lineHeight:1.5}}>{inviteMsg}</div>}
        <button onClick={checkInviteCode} disabled={inviteChecking||!inviteCode.trim()} style={{width:"100%",background:inviteChecking||!inviteCode.trim()?"#9ca3af":"#111",color:"#fff",border:"none",borderRadius:12,padding:"16px",fontSize:15,fontWeight:700,cursor:"pointer"}}>{inviteChecking?"Checking…":"Continue →"}</button>
      </div>}

      {step===2&&<div style={{background:"#fff",borderRadius:20,padding:"28px 24px",boxShadow:"0 4px 24px rgba(0,0,0,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}><div style={{background:T.greenLight,color:T.green,borderRadius:8,padding:"4px 10px",fontSize:12,fontWeight:700}}>✓ Code accepted</div></div>
        <div style={{fontSize:18,fontWeight:800,color:T.text,marginBottom:6}}>Choose your Owner ID</div>
        <div style={{fontSize:14,color:T.sub,marginBottom:20,lineHeight:1.6}}>This becomes your permanent dashboard link. Use your business name or your name — you can't change it later.</div>
        <input style={inp} value={ownerId} onChange={e=>setOwnerId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""))} placeholder="e.g. smiths_newsagent or bob_retail" onKeyDown={e=>{if(e.key==="Enter")checkAvailability();}}/>
        {ownerId&&<div style={{fontSize:12,color:T.blue,marginBottom:12,wordBreak:"break-all"}}>🔗 Your link will be: .../?owner={ownerId}</div>}
        {checkMsg&&<div style={{background:T.redLight,color:T.red,borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:12}}>{checkMsg}</div>}
        <button onClick={checkAvailability} disabled={checking||!ownerId.trim()} style={{width:"100%",background:checking||!ownerId.trim()?"#9ca3af":"#111",color:"#fff",border:"none",borderRadius:12,padding:"16px",fontSize:15,fontWeight:700,cursor:"pointer"}}>{checking?"Setting up…":"Create My Dashboard →"}</button>
      </div>}

      {step===3&&<div style={{background:"#fff",borderRadius:20,padding:"28px 24px",boxShadow:"0 4px 24px rgba(0,0,0,0.07)"}}>
        <div style={{fontSize:18,fontWeight:800,color:T.text,marginBottom:6}}>🎉 You're all set</div>
        <div style={{fontSize:14,color:T.sub,marginBottom:20,lineHeight:1.6}}>Your dashboard is ready. Bookmark the link below — it's your permanent access. There's no password to remember, your link IS your login.</div>
        <div style={{background:T.blueLight,borderRadius:12,padding:"16px",marginBottom:16,border:"1px solid #BFDBFE"}}>
          <div style={{fontSize:13,fontWeight:700,color:T.blue,marginBottom:6}}>🔗 Your Owner Dashboard</div>
          <div style={{fontSize:13,color:T.blue,wordBreak:"break-all",lineHeight:1.7,fontWeight:600}}>{ownerUrl}</div>
          <button onClick={()=>navigator.clipboard?.writeText(ownerUrl)} style={{background:T.blue,color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",marginTop:10}}>Copy Link</button>
        </div>
        <div style={{background:T.amberLight,borderRadius:12,padding:"14px 16px",marginBottom:24,border:"1px solid #FDE68A"}}>
          <div style={{fontSize:13,fontWeight:700,color:T.amber}}>⚠️ Bookmark this now</div>
          <div style={{fontSize:13,color:T.amber,marginTop:4,lineHeight:1.5}}>If you lose this link there is no recovery — your invite code has been used and cannot regenerate it. Save it to your home screen or bookmarks before continuing.</div>
        </div>
        <a href={ownerUrl} style={{display:"block",width:"100%",background:"#111",color:"#fff",border:"none",borderRadius:12,padding:"16px",fontSize:15,fontWeight:700,cursor:"pointer",textAlign:"center",textDecoration:"none",boxSizing:"border-box"}}>Go to My Dashboard →</a>
      </div>}
    </div>
  </div>;
}

export default function App(){
  const ownerId=getOwnerIdFromURL();
  const [shops,setShops]=useState([]);const [allShops,setAllShops]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(null);
  const [currentShopId,setCurrentShopId]=useState(null);const [myRecs,setMyRecs]=useState([]);const [allShifts,setAllShifts]=useState([]);const [dataLoading,setDataLoading]=useState(false);
  const [showSwitcher,setShowSwitcher]=useState(false);const [bottomTab,setBottomTab]=useState("home");const [subNav,setSubNav]=useState(null);
  const expDays=useMemo(()=>expDaysArr(30),[]);
  const now=new Date();const greeting=now.getHours()<12?"Good morning":now.getHours()<17?"Good afternoon":"Good evening";

  if(!ownerId)return <NewOwnerSetup/>;

  const loadShops=async()=>{try{const [ownerShops,all]=await Promise.all([fetchOwnerShops(ownerId),fetchAllShops()]);setShops(ownerShops);setAllShops(all);if(!currentShopId&&ownerShops.length>0)setCurrentShopId(ownerShops[0].shopId);return ownerShops;}catch(e){setError(e.message);return[];}};

  useEffect(()=>{setLoading(true);loadShops().finally(()=>setLoading(false));},[]); // eslint-disable-line
  useEffect(()=>{if(!currentShopId)return;setDataLoading(true);Promise.all([fetchShiftsForShop(currentShopId),fetchAllShifts()]).then(([s,a])=>{setMyRecs(s);setAllShifts(a);}).catch(e=>console.error(e)).finally(()=>setDataLoading(false));},[currentShopId]);

  if(loading)return <div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif"}}><div style={{textAlign:"center"}}><div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${T.div}`,borderTop:`3px solid ${T.accent}`,animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}/><p style={{color:T.muted,fontSize:15}}>Loading your business…</p></div><style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style></div>;
  if(error)return <div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif",padding:16}}><div style={{background:T.redLight,border:"1px solid #FECACA",borderRadius:14,padding:20,color:T.red,fontSize:14,maxWidth:400,textAlign:"center"}}>⚠️ {error}</div></div>;

  const currentShop=shops.find(s=>s.shopId===currentShopId);
  const ownedShopIds=shops.map(s=>s.shopId);
  function onNav(type,data){setSubNav({type,...(typeof data==="string"?{staff:data}:data)});window.scrollTo(0,0);}
  function goBack(){if(subNav?.type==="taskDetail")setSubNav({type:"staffDetail",staff:subNav.staff});else setSubNav(null);window.scrollTo(0,0);}
  const isSubPage=!!subNav;
  const subTitle=subNav?.type==="staffDetail"?subNav.staff:(subNav?.task?.length>22?subNav.task.slice(0,21)+"…":subNav?.task);

  const mainContent=()=>{
    if(!currentShop||bottomTab==="manage")return <ManageTab shops={shops} ownerId={ownerId} onShopsUpdated={async()=>{const s=await loadShops();setShops(s);}}/>;
    if(isSubPage)return subNav.type==="staffDetail"?<StaffDetail name={subNav.staff} allRecs={myRecs} expDays={expDays} onNav={onNav} shopConfig={currentShop} onBack={()=>setSubNav(null)} onRemoveStaff={async()=>{await loadShops();setSubNav(null);}}/>:<TaskDetail task={subNav.task} staffName={subNav.staff} allRecs={myRecs} shopConfig={currentShop}/>;
    if(bottomTab==="home")return <HomeTab allRecs={myRecs} allShifts={allShifts} allShops={shops} shopConfig={currentShop} currentShopId={currentShopId} ownedShopIds={ownedShopIds} expDays={expDays} dataLoading={dataLoading}/>;
    if(bottomTab==="benchmarks")return <BenchmarksTab allRecs={myRecs} allShifts={allShifts} allShops={shops} shopConfig={currentShop} currentShopId={currentShopId} ownedShopIds={ownedShopIds}/>;
    if(bottomTab==="staff")return <StaffTab allRecs={myRecs} expDays={expDays} onNav={onNav} shopConfig={currentShop} onShopConfigUpdated={async()=>{await loadShops();}}/>;
    if(bottomTab==="actions")return <ActionsTab shopConfig={currentShop} shopId={currentShopId}/>;
    return <ManageTab shops={shops} ownerId={ownerId} onShopsUpdated={async()=>{await loadShops();}}/>;
  };

  return <div style={{background:T.bg,minHeight:"100vh",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif",maxWidth:480,margin:"0 auto"}}>
    <div style={{background:"#111",position:"sticky",top:0,zIndex:20,boxShadow:"0 2px 16px rgba(0,0,0,0.15)"}}>
      <div style={{padding:"14px 16px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {isSubPage&&<button onClick={goBack} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:10,padding:"6px 12px",cursor:"pointer",color:"#fff",fontSize:13,fontWeight:700,marginRight:4}}>← Back</button>}
          <div>{!isSubPage?<><div style={{fontSize:16,fontWeight:800,color:"#fff",letterSpacing:-0.3}}>{currentShop?`${SECTOR_ICONS[currentShop.sector]||"🏢"} ${currentShop.shopName}`:"Retail Intelligence"}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:1}}>{greeting} · {now.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</div></>:<><div style={{fontSize:16,fontWeight:800,color:"#fff"}}>{subTitle}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:1}}>{currentShop?.shopName}</div></>}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {shops.length>1&&!isSubPage&&<button onClick={()=>setShowSwitcher(true)} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,padding:"6px 12px",fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.7)",cursor:"pointer"}}>Switch ▾</button>}
          <button onClick={()=>{setDataLoading(true);Promise.all([fetchShiftsForShop(currentShopId),fetchAllShifts()]).then(([s,a])=>{setMyRecs(s);setAllShifts(a);}).finally(()=>setDataLoading(false));}} disabled={dataLoading||!currentShopId} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,padding:"6px 12px",fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.7)",cursor:"pointer"}}>{dataLoading?"…":"↻"}</button>
        </div>
      </div>
    </div>
    {mainContent()}
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:`1px solid ${T.border}`,display:"flex",zIndex:20,boxShadow:"0 -4px 20px rgba(0,0,0,0.08)"}}>
      {[{id:"home",icon:"🏠",label:"Home"},{id:"benchmarks",icon:"📊",label:"Benchmarks"},{id:"staff",icon:"👥",label:"Staff"},{id:"actions",icon:"✏️",label:"Actions"},{id:"manage",icon:"⚙️",label:"Businesses"}].map(tab=><button key={tab.id} onClick={()=>{setBottomTab(tab.id);setSubNav(null);window.scrollTo(0,0);}} style={{flex:1,background:"none",border:"none",padding:"12px 0 16px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><span style={{fontSize:20}}>{tab.icon}</span><span style={{fontSize:10,fontWeight:700,color:bottomTab===tab.id?T.accent:T.muted}}>{tab.label}</span>{bottomTab===tab.id&&!isSubPage&&<div style={{width:20,height:3,borderRadius:99,background:T.accent,marginTop:1}}/>}</button>)}
    </div>
    {showSwitcher&&<ShopSwitcher shops={shops} currentShopId={currentShopId} onSelect={id=>{setCurrentShopId(id);setSubNav(null);setShowSwitcher(false);}} onClose={()=>setShowSwitcher(false)}/>}
    <style>{"@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}body{margin:0}::-webkit-scrollbar{display:none}"}</style>
  </div>;
}
