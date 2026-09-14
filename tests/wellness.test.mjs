import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StepDetector, dateKey, previousDay, emptyDay, streak, combineDays, mergeJournal } from '../src/lib/wellness.ts';
import { parseHeartRate } from '../src/lib/heart-rate.ts';

test('stationary sensor noise and a single bump do not create steps',()=>{
  const detector=new StepDetector();let count=0;
  for(let t=0;t<5000;t+=20)count+=detector.sample(0,0,9.81+.12*Math.sin(t),t);
  for(let t=5000;t<8000;t+=20)count+=detector.sample(0,0,t<5150?13:9.81,t);
  assert.equal(count,0);
});
test('plausible walking cadence produces steps, then stationary samples stop counting',()=>{
  const detector=new StepDetector();let count=0;
  for(let t=0;t<10000;t+=20)count+=detector.sample(0,0,9.81+3*Math.sin(2*Math.PI*2*t/1000),t);
  assert.ok(count>=16&&count<=21,`Expected about 20 steps, got ${count}`);
  const before=count;
  for(let t=10000;t<14000;t+=20)count+=detector.sample(0,0,9.81,t);
  assert.equal(count,before);
});
test('phone rotation without movement and non-finite samples create no steps',()=>{
  const detector=new StepDetector();let count=0;
  for(let t=0;t<5000;t+=20)count+=detector.sample(9.81*Math.sin(t/1000),0,9.81*Math.cos(t/1000),t);
  assert.equal(count,0);assert.equal(detector.sample(NaN,0,0,5000),0);
});
test('local calendar keys handle year boundaries and leap days',()=>{
  assert.equal(previousDay('2026-01-01'),'2025-12-31');
  assert.equal(previousDay('2024-03-01'),'2024-02-29');
  assert.equal(dateKey(new Date(2026,8,14,23,59)),'2026-09-14');
});
const row=(date,steps=100)=>({...emptyDay('device-a',date),steps,updatedAt:date+'T12:00:00.000Z'});
test('wellness streak includes yesterday, deduplicates devices, and breaks at a missing day',()=>{
  const days=[row('2026-09-13'),row('2026-09-12'),{...row('2026-09-12'),deviceId:'device-b'},row('2026-09-10')];
  assert.equal(streak(days,[],'2026-09-14'),2);
  assert.equal(streak(days,[],'2026-09-15'),0);
  assert.equal(streak([...days,row('2026-09-14',0)],[],'2026-09-14'),2);
});
test('workout streak requires completed minute-long sessions',()=>{
  const workout={id:'a',date:'2026-09-14',seconds:59,type:'Walking',steps:0,finishedAt:''};
  assert.equal(streak([], [workout], '2026-09-14',true),0);
  assert.equal(streak([], [{...workout,seconds:60}], '2026-09-14',true),1);
});
test('daily aggregation sums device steps and uses the most recently logged fields',()=>{
  const a={...row('2026-09-14',120),water:250,waterAt:'2026-09-14T12:00:00Z',checkin:{mood:'Good',sleep:8,symptoms:[],date:'2026-09-14'},checkinAt:'2026-09-14T10:00:00Z'};
  const b={...row('2026-09-14',30),deviceId:'b',water:500,waterAt:'2026-09-14T13:00:00Z'};
  const result=combineDays([a,b,row('2026-09-13',999)],'2026-09-14');
  assert.equal(result.steps,150);assert.equal(result.water,500);assert.equal(result.checkin.sleep,8);
});
test('offline merge preserves higher step count and newer hydration independently and is idempotent',()=>{
  const local={days:{a:{...row('2026-09-14',150),water:250,waterAt:'2026-09-14T10:00:00Z'}},workouts:{}};
  const remote={days:{a:{...row('2026-09-14',100),water:750,waterAt:'2026-09-14T13:00:00Z',updatedAt:'2026-09-14T13:00:00Z'}},workouts:{}};
  const result=mergeJournal(local,remote);
  assert.equal(result.days.a.steps,150);assert.equal(result.days.a.water,750);
  assert.deepEqual(mergeJournal(result,remote),result);
});
test('Bluetooth parser reads 8-bit and 16-bit heart rates in little endian',()=>{
  assert.equal(parseHeartRate(new DataView(Uint8Array.from([0,72]).buffer)).bpm,72);
  assert.equal(parseHeartRate(new DataView(Uint8Array.from([1,4,1]).buffer)).bpm,260);
});
test('Bluetooth parser rejects lost contact, zero values and truncated packets',()=>{
  for(const bytes of [[0],[1,72],[4,72],[0,0],[8,72],[16,72],[16,72,1]])assert.equal(parseHeartRate(new DataView(Uint8Array.from(bytes).buffer)),null);
});
test('Bluetooth parser respects energy field and RR interval units',()=>{
  const result=parseHeartRate(new DataView(Uint8Array.from([30,80,10,0,0,4]).buffer));
  assert.equal(result.contact,'detected');assert.equal(result.bpm,80);assert.deepEqual(result.rr,[1000]);
});
