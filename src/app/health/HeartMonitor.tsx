import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { parseHeartRate } from '@/lib/heart-rate';

export type HeartPoint={bpm:number;at:number;device:string};
type Characteristic=EventTarget & {value?:DataView;startNotifications:()=>Promise<unknown>;stopNotifications:()=>Promise<unknown>};
type Device=EventTarget & {name?:string;gatt?:{connected:boolean;connect:()=>Promise<{getPrimaryService:(name:string)=>Promise<{getCharacteristic:(name:string)=>Promise<Characteristic>}>}>;disconnect:()=>void}};
const Context=createContext<ReturnType<typeof useMonitor>>(null!);
export const useHeart=()=>useContext(Context);
export function HeartMonitorProvider({children,onRecord}:{children:React.ReactNode;onRecord:(point:HeartPoint)=>void}){const value=useMonitor(onRecord);return <Context.Provider value={value}>{children}</Context.Provider>;}
function useMonitor(onRecord:(point:HeartPoint)=>void){
  const [status,setStatus]=useState('Connect a compatible heart-rate monitor.'),[connected,setConnected]=useState(false),[connecting,setConnecting]=useState(false),[latest,setLatest]=useState<HeartPoint|null>(null),[points,setPoints]=useState<HeartPoint[]>([]);
  const device=useRef<Device|null>(null),characteristic=useRef<Characteristic|null>(null),listener=useRef<((event:Event)=>void)|null>(null),record=useRef(onRecord),lastSaved=useRef(0),mounted=useRef(true),attempt=useRef(0);
  record.current=onRecord;
  const disconnected=()=>{if(!mounted.current)return;setConnected(false);setLatest(null);setStatus('Monitor disconnected. Reconnect to resume.');};
  function cleanup(){if(characteristic.current&&listener.current)characteristic.current.removeEventListener('characteristicvaluechanged',listener.current);characteristic.current=null;listener.current=null;if(device.current){device.current.removeEventListener('gattserverdisconnected',disconnected);device.current.gatt?.disconnect();}device.current=null;}
  function disconnect(){attempt.current++;cleanup();setConnecting(false);setConnected(false);setLatest(null);setStatus('Session stopped. Saved readings remain in your history.');}
  async function connect(){
    if(connecting)return;
    const bluetooth=(navigator as Navigator & {bluetooth?:{requestDevice:(options:unknown)=>Promise<Device>}}).bluetooth;
    if(!window.isSecureContext){setStatus('A secure HTTPS connection is required for Bluetooth.');return;}
    if(!bluetooth){setStatus('Bluetooth heart monitors are not supported in this browser. Use a supported Android/desktop Chrome browser and a monitor that broadcasts the standard Heart Rate Service. iPhone Safari cannot connect here.');return;}
    const version=++attempt.current;setConnecting(true);setStatus('Choose your heart-rate monitor…');cleanup();
    try{
      const chosen=await bluetooth.requestDevice({filters:[{services:['heart_rate']}]});
      if(!mounted.current||version!==attempt.current)return;
      device.current=chosen;chosen.addEventListener('gattserverdisconnected',disconnected);
      const server=await chosen.gatt?.connect();if(!server)throw new Error('The monitor does not offer a Bluetooth GATT connection.');
      const service=await server.getPrimaryService('heart_rate');const measurement=await service.getCharacteristic('heart_rate_measurement');
      if(!mounted.current||version!==attempt.current){chosen.gatt?.disconnect();return;}
      characteristic.current=measurement;
      listener.current=(event:Event)=>{
        const value=(event.target as Characteristic)?.value;if(!value)return;
        const parsed=parseHeartRate(value);
        if(!parsed){setLatest(null);setStatus('Waiting for a valid reading. Check sensor contact.');return;}
        const point={bpm:parsed.bpm,at:Date.now(),device:chosen.name||'Heart-rate monitor'};
        setLatest(point);setPoints(v=>[...v.slice(-59),point]);setStatus(parsed.contact==='detected'?'Live · skin contact confirmed':'Live · sensor does not report skin contact');
        if(point.at-lastSaved.current>=60000){record.current(point);lastSaved.current=point.at;}
      };
      measurement.addEventListener('characteristicvaluechanged',listener.current);
      await measurement.startNotifications();
      if(!mounted.current||version!==attempt.current){cleanup();return;}
      lastSaved.current=0;setConnected(true);setStatus('Connected. Waiting for the first reading…');
    }catch(e){cleanup();if(mounted.current&&version===attempt.current){setConnected(false);setLatest(null);setStatus(e instanceof Error?e.message:'Could not connect. Check your monitor and try again.');}}
    finally{if(mounted.current&&version===attempt.current)setConnecting(false);}
  }
  useEffect(()=>{mounted.current=true;const timer=setInterval(()=>{setLatest(p=>{if(p&&Date.now()-p.at>10000){setStatus('Signal paused · waiting for a fresh reading');return null;}return p;});},1000);return()=>{mounted.current=false;attempt.current++;clearInterval(timer);cleanup();};},[]);
  return {connected,connecting,status,latest,points,connect,disconnect};
}
