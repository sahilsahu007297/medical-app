import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { combineDays, dateKey, emptyDay, mergeJournal, streak, type CheckIn, type DayRecord, type Journal, type Workout } from '@/lib/wellness';
import { useAuth } from './Auth';
import { useStepSensor } from './useStepSensor';

function readJournal(key:string):Journal {
  try{const data=JSON.parse(localStorage.getItem(key)||'null');if(data?.days&&data?.workouts)return data;}catch{}
  return {days:{},workouts:{}};
}
function deviceId(){try{const old=localStorage.getItem('rest-device-id');if(old)return old;const id=crypto.randomUUID();localStorage.setItem('rest-device-id',id);return id;}catch{return crypto.randomUUID();}}
const WellnessContext=createContext<ReturnType<typeof useWellnessState>>(null!);
export const useWellness=()=>useContext(WellnessContext);
export function WellnessProvider({children}:{children:React.ReactNode}){const value=useWellnessState();return <WellnessContext.Provider value={value}>{children}</WellnessContext.Provider>;}

function useWellnessState(){
  const {session,scope}=useAuth();const userId=session?.user.id;
  const key='rest-journal-v1-'+scope;
  const [device]=useState(deviceId),[journal,setJournal]=useState(()=>readJournal(key)),[day,setDay]=useState(dateKey),[syncStatus,setSyncStatus]=useState(userId?'Connecting…':'Saved on this device'),[storageError,setStorageError]=useState('');
  const current=useRef(journal),alive=useRef(true),syncing=useRef(false),lastPull=useRef(0);
  const dirtyDays=useRef(new Set(Object.keys(journal.days).filter(id=>journal.days[id].deviceId===device))),dirtyWorkouts=useRef(new Set(Object.keys(journal.workouts)));
  const commit=(next:Journal)=>{current.current=next;setJournal(next);try{localStorage.setItem(key,JSON.stringify(next));setStorageError('');}catch{setStorageError('Browser storage is full or unavailable. Export your records before closing this page.');}};
  const updateDay=(change:(row:DayRecord)=>DayRecord)=>{
    current.current=mergeJournal(current.current,readJournal(key));
    const date=dateKey(),id=device+':'+date;
    const row=change({... (current.current.days[id] || emptyDay(device,date))});
    row.updatedAt=new Date().toISOString();dirtyDays.current.add(id);
    commit({...current.current,days:{...current.current.days,[id]:row}});
    if(userId)setSyncStatus('Changes waiting to sync');
  };
  const sensor=useStepSensor(count=>updateDay(row=>({...row,steps:row.steps+count})));
  const today=combineDays(Object.values(journal.days),day);
  const setWater=(value:number|((n:number)=>number))=>updateDay(row=>({...row,water:Math.max(0,typeof value==='function'?value(combineDays(Object.values(current.current.days),dateKey()).water):value),waterAt:new Date().toISOString()}));
  const setCheckin=(value:CheckIn)=>updateDay(row=>({...row,checkin:{...value,date:dateKey()},checkinAt:new Date().toISOString()}));
  const addWorkout=(workout:Workout)=>{dirtyWorkouts.current.add(workout.id);commit({...current.current,workouts:{...current.current.workouts,[workout.id]:workout}});if(userId)setSyncStatus('Changes waiting to sync');};
  const addHeart=(point:{bpm:number;at:number;device:string})=>updateDay(row=>({...row,heart:[...(row.heart||[]).slice(-1439),point]}));
  async function sync(force=true){
    if(!supabase||!userId||syncing.current)return;
    if(!force&&!dirtyDays.current.size&&!dirtyWorkouts.current.size&&Date.now()-lastPull.current<60000)return;
    if(!navigator.onLine){setSyncStatus('Offline · saved on this device');return;}
    syncing.current=true;setSyncStatus('Syncing…');
    const pendingDays=[...dirtyDays.current].map(id=>[id,current.current.days[id]] as const);
    const pendingWorkouts=[...dirtyWorkouts.current].map(id=>current.current.workouts[id]);
    try{
      // Flush only this account's cached records. Row keys make retries idempotent.
      if(pendingDays.length){const {error}=await supabase.from('wellness_days').upsert(pendingDays.map(([,r])=>({user_id:userId,device_id:r.deviceId,date:r.date,payload:r})),{onConflict:'user_id,device_id,date'});if(error)throw error;}
      if(pendingWorkouts.length){const {error}=await supabase.from('workouts').upsert(pendingWorkouts.map(r=>({user_id:userId,id:r.id,date:r.date,payload:r})),{onConflict:'user_id,id'});if(error)throw error;}
      async function fetchRows(table:'wellness_days'|'workouts'){
        const all:{payload:any}[]=[];
        for(let offset=0;;offset+=1000){const {data,error}=await supabase!.from(table).select('payload').eq('user_id',userId!).order('date').order(table==='workouts'?'id':'device_id').range(offset,offset+999);if(error)throw error;all.push(...(data||[]));if(!data||data.length<1000)break;}
        return all;
      }
      const [days,workouts]=await Promise.all([fetchRows('wellness_days'),fetchRows('workouts')]);
      if(!alive.current)return;
      const remote:Journal={days:Object.fromEntries(days.map(({payload:r})=>[r.deviceId+':'+r.date,r])),workouts:Object.fromEntries(workouts.map(({payload:r})=>[r.id,r]))};
      commit(mergeJournal(current.current,remote));
      pendingDays.forEach(([id,row])=>{if(current.current.days[id]?.updatedAt===row.updatedAt)dirtyDays.current.delete(id);});
      pendingWorkouts.forEach(r=>dirtyWorkouts.current.delete(r.id));
      lastPull.current=Date.now();
      setSyncStatus(dirtyDays.current.size||dirtyWorkouts.current.size?'Changes waiting to sync':'Synced to your account');
    }catch(e){if(alive.current)setSyncStatus('Sync needs attention: '+(e instanceof Error?e.message:(e as {message?:string})?.message||'Could not connect. Your records remain on this device.'));}
    finally{syncing.current=false;}
  }
  useEffect(()=>{
    alive.current=true;void sync();
    const timer=setInterval(()=>{setDay(dateKey());if(userId)void sync(false);},15000);
    const online=()=>void sync();window.addEventListener('online',online);
    const offline=()=>setSyncStatus('Offline · saved on this device');window.addEventListener('offline',offline);
    const storage=(event:StorageEvent)=>{if(event.key===key){const next=mergeJournal(current.current,readJournal(key));current.current=next;setJournal(next);}};
    window.addEventListener('storage',storage);
    return()=>{alive.current=false;clearInterval(timer);window.removeEventListener('online',online);window.removeEventListener('offline',offline);window.removeEventListener('storage',storage);};
  },[userId]);
  const days=Object.values(journal.days),workouts=Object.values(journal.workouts).sort((a,b)=>b.finishedAt.localeCompare(a.finishedAt));
  const history=[...new Set([...days.map(d=>d.date),...workouts.map(w=>w.date)])].sort().reverse().map(date=>({...combineDays(days,date),workouts:workouts.filter(w=>w.date===date)}));
  return {scope,device,day,journal,today,history,workouts,setWater,setCheckin,addWorkout,addHeart,sensor,sync,syncStatus,storageError,streak:streak(days,workouts,day),workoutStreak:streak(days,workouts,day,true)};
}
