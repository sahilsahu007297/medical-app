export type CheckIn = { mood: string; sleep: number; symptoms: string[]; date: string };
export type HeartReading = {bpm:number;at:number;device:string};
export type DayRecord = { date: string; deviceId: string; steps: number; water: number; waterAt: string; checkin: CheckIn | null; checkinAt: string; updatedAt: string; heart?:HeartReading[] };
export type Workout = { id: string; date: string; type: string; seconds: number; steps: number; finishedAt: string };
export type Journal = { days: Record<string, DayRecord>; workouts: Record<string, Workout> };
export const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const previousDay = (date: string) => { const d = new Date(date+'T12:00:00'); d.setDate(d.getDate()-1); return dateKey(d); };
export function emptyDay(deviceId: string, date = dateKey()): DayRecord {
  return { date, deviceId, steps: 0, water: 0, waterAt: '', checkin: null, checkinAt: '', updatedAt: '' };
}
export function combineDays(days: DayRecord[], date: string) {
  const rows = days.filter(d => d.date === date);
  const water = [...rows].sort((a,b) => b.waterAt.localeCompare(a.waterAt))[0]?.water || 0;
  const checkin = [...rows].sort((a,b) => b.checkinAt.localeCompare(a.checkinAt))[0]?.checkin || null;
  return { date, steps: rows.reduce((n,d) => n+d.steps,0), water, checkin, heart:rows.flatMap(r=>r.heart||[]).sort((a,b)=>a.at-b.at) };
}
export function streak(days: DayRecord[], workouts: Workout[], today = dateKey(), workoutOnly = false) {
  const active = new Set(workouts.filter(w=>w.seconds>=60).map(w=>w.date));
  if (!workoutOnly) days.filter(d=>d.checkin || d.steps>=100 || d.water>0).forEach(d=>active.add(d.date));
  let cursor = active.has(today) ? today : previousDay(today), count = 0;
  while(active.has(cursor)) { count++; cursor = previousDay(cursor); }
  return count;
}
export function mergeJournal(local: Journal, remote: Journal): Journal {
  const days = { ...remote.days };
  for (const [key,row] of Object.entries(local.days)) {
    const other=days[key];
    if(!other){days[key]=row;continue;}
    const water=row.waterAt>=other.waterAt?row:other;
    const checkin=row.checkinAt>=other.checkinAt?row:other;
    const heart=[...new Map([...(other.heart||[]),...(row.heart||[])].map(p=>[p.at+':'+p.device,p])).values()].sort((a,b)=>a.at-b.at).slice(-1440);
    days[key]={...row,steps:Math.max(row.steps,other.steps),water:water.water,waterAt:water.waterAt,checkin:checkin.checkin,checkinAt:checkin.checkinAt,updatedAt:row.updatedAt>=other.updatedAt?row.updatedAt:other.updatedAt,...(heart.length?{heart}:{})};
  }
  return { days, workouts: { ...remote.workouts, ...local.workouts } };
}

// Orientation-independent peak detection with gravity removal, hysteresis,
// plausible cadence and a three-step confirmation window to reject single bumps.
export class StepDetector {
  gravity = 9.81; smooth = 0; armed = true; lastPeak = -Infinity;
  candidate: number[] = []; lastTime = -Infinity;
  reset() { this.gravity=9.81; this.smooth=0; this.armed=true; this.lastPeak=-Infinity; this.candidate=[]; this.lastTime=-Infinity; }
  sample(x:number,y:number,z:number,time:number,includesGravity=true) {
    if (![x,y,z,time].every(Number.isFinite)) return 0;
    if(time-this.lastTime>2000) { this.reset(); this.gravity=includesGravity?Math.hypot(x,y,z):0; }
    this.lastTime=time;
    const magnitude=Math.hypot(x,y,z);
    this.gravity=.92*this.gravity+.08*magnitude;
    const signal=includesGravity?magnitude-this.gravity:magnitude;
    this.smooth=.55*this.smooth+.45*signal;
    if(this.smooth < .35) this.armed=true;
    if(!this.armed || this.smooth < 1.05 || time-this.lastPeak < 300) return 0;
    this.armed=false;
    const gap=time-this.lastPeak;
    if(gap>1600) this.candidate=[];
    this.lastPeak=time;
    this.candidate.push(time);
    if(this.candidate.length>4)this.candidate.shift();
    if(this.candidate.length===3) return 3;
    return this.candidate.length>3?1:0;
  }
}
