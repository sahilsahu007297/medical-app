import { useCallback, useEffect, useRef, useState } from 'react';
import { StepDetector } from '@/lib/wellness';

export function useStepSensor(onSteps: (steps:number)=>void) {
  const [tracking,setTracking]=useState(false),[walking,setWalking]=useState(false),[message,setMessage]=useState('Ready when you are.');
  const [requesting,setRequesting]=useState(false);
  const onStepsRef=useRef(onSteps);onStepsRef.current=onSteps;
  const detector=useRef(new StepDetector()),lastStep=useRef(0),releaseLock=useRef<(()=>void)|null>(null);
  const stop=useCallback(()=>{setTracking(false);setWalking(false);releaseLock.current?.();releaseLock.current=null;setMessage('Tracking paused. Your steps are saved.');},[]);
  async function start() {
    if(tracking||requesting)return;
    if(!window.isSecureContext){setMessage('Motion tracking needs HTTPS. Open the secure app on your phone.');return;}
    if(!('DeviceMotionEvent' in window)){setMessage('This browser has no motion sensor. Open this page on a supported phone.');return;}
    setRequesting(true);
    try {
      const Motion=DeviceMotionEvent as typeof DeviceMotionEvent & {requestPermission?:()=>Promise<string>};
      if(Motion.requestPermission && await Motion.requestPermission()!=='granted'){setMessage('Motion access was denied. Allow Motion & Orientation in your browser settings, then retry.');return;}
      if(navigator.locks){
        const granted=await new Promise<boolean>(resolve=>{navigator.locks.request('rest-step-sensor',{ifAvailable:true},lock=>{
          if(!lock){resolve(false);return;}
          return new Promise<void>(release=>{releaseLock.current=release;resolve(true);});
        }).catch(()=>resolve(false));});
        if(!granted){setMessage('Step tracking is already open in another tab. Pause it there first.');return;}
      }
      detector.current.reset();lastStep.current=0;setTracking(true);setMessage('Listening to your phone. Keep it in your pocket and walk naturally.');
    } catch {setMessage('Motion access is unavailable. Check browser permissions and try again.');}
    finally {setRequesting(false);}
  }
  useEffect(()=>{
    if(!tracking)return;
    let received=false;
    const handler=(event:DeviceMotionEvent)=>{
      if(document.hidden)return;
      const raw=event.accelerationIncludingGravity;
      const direct=event.acceleration;
      const usable=(v:DeviceMotionEventAcceleration|null)=>v && [v.x,v.y,v.z].every(n=>n!==null&&Number.isFinite(n));
      const acceleration=usable(raw)?raw:usable(direct)?direct:null;
      if(!acceleration)return;
      received=true;
      const count=detector.current.sample(acceleration.x!,acceleration.y!,acceleration.z!,performance.now(),acceleration===raw);
      if(count){lastStep.current=performance.now();setWalking(true);setMessage('Walking · steps are being counted');onStepsRef.current(count);}
    };
    const timeout=window.setTimeout(()=>{if(!received){stop();setMessage('No motion data received. Use a phone with motion access enabled, then try again.');}},6000);
    const idle=window.setInterval(()=>{if(lastStep.current&&performance.now()-lastStep.current>1800){setWalking(false);setMessage('Standing still · ready for your next step');}},300);
    const visibility=()=>{if(document.hidden){stop();setMessage('Paused while the app is hidden. Tap Start tracking when you return.');}};
    window.addEventListener('devicemotion',handler);
    document.addEventListener('visibilitychange',visibility);
    return()=>{window.removeEventListener('devicemotion',handler);document.removeEventListener('visibilitychange',visibility);clearTimeout(timeout);clearInterval(idle);releaseLock.current?.();releaseLock.current=null;};
  },[tracking,stop]);
  return {tracking,walking,message,requesting,start,stop};
}
