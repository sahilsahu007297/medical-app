import { useId } from 'react';
export type Scene = 'garden' | 'coast' | 'studio';
export function Walker({moving,scene='garden',compact=false}:{moving:boolean;scene?:Scene;compact?:boolean}) {
  const id=useId().replaceAll(':','');
  return <div className={`walker-scene ${scene} ${moving?'is-walking':'is-still'} ${compact?'compact':''}`} role="img" aria-label={`${moving?'Walking':'Standing'} person in the ${scene}`}>
    <div className="scene-sun"/><div className="scene-landscape land-back"/><div className="scene-landscape land-front"/>
    <svg viewBox="0 0 260 300" className="walker-svg" aria-hidden="true"><defs><linearGradient id={id+'shirt'} x1="0" x2="1"><stop stopColor="#6671c8"/><stop offset=".45" stopColor="#a2a7e7"/><stop offset="1" stopColor="#6971c0"/></linearGradient><linearGradient id={id+'skin'}><stop stopColor="#d29b80"/><stop offset=".5" stopColor="#f5cdb2"/><stop offset="1" stopColor="#e8b395"/></linearGradient><linearGradient id={id+'pants'}><stop stopColor="#3c416f"/><stop offset="1" stopColor="#666b9a"/></linearGradient></defs>
    <ellipse className="walker-shadow" cx="132" cy="274" rx="43" ry="9" fill="#3d4b5c18"/>
    <g className="walker-person"><g className="walker-arm arm-back"><path d="M144 106 Q162 125 157 159" fill="none" stroke="#6b74bf" strokeWidth="15" strokeLinecap="round"/><path d="M157 157l-2 16" stroke={`url(#${id}skin)`} strokeWidth="11" strokeLinecap="round"/></g>
    <g className="walker-leg leg-back"><path d="M139 176 L143 219 L145 260" fill="none" stroke="#414774" strokeWidth="18" strokeLinecap="round"/><path d="M142 259 Q153 260 162 270 L140 271" fill="#e9eee8" stroke="#56628e" strokeWidth="4" strokeLinejoin="round"/></g>
    <g className="walker-leg leg-front"><path d="M119 176 L116 219 L116 261" fill="none" stroke={`url(#${id}pants)`} strokeWidth="20" strokeLinecap="round"/><path d="M113 259 Q126 260 132 270 L109 271" fill="#f8faf0" stroke="#747fac" strokeWidth="4" strokeLinejoin="round"/></g>
    <path d="M110 99 Q128 89 145 100 Q154 125 150 176 Q127 187 106 177 Q101 137 110 99Z" fill={`url(#${id}shirt)`}/><path d="M115 174q14 5 30 0" stroke="#c1c4e9" fill="none" strokeWidth="3"/>
    <path d="M125 83v15q5 6 11 0V83" fill={`url(#${id}skin)`}/><ellipse cx="130" cy="65" rx="21" ry="27" fill={`url(#${id}skin)`}/><ellipse cx="151" cy="69" rx="4" ry="7" fill="#efc0a1"/>
    <path d="M109 68q-8-24 5-29q3-18 22-9q22-2 20 21l-7 16l-4-18q-12 6-27 0l-2 21Z" fill="#557e85"/><path d="M113 43q11-16 28-8" fill="none" stroke="#87b5b8" strokeWidth="6" strokeLinecap="round"/>
    <ellipse cx="125" cy="66" rx="2" ry="3" fill="#3b4252"/><ellipse cx="142" cy="65" rx="2" ry="3" fill="#3b4252"/><path d="M132 68l-1 7h4m-7 6q5 3 9-1" fill="none" stroke="#b87f6c" strokeWidth="1.5" strokeLinecap="round"/>
    <g className="walker-arm arm-front"><path d="M112 107 Q102 129 109 158" fill="none" stroke={`url(#${id}shirt)`} strokeWidth="17" strokeLinecap="round"/><path d="M109 157l3 15" stroke={`url(#${id}skin)`} strokeWidth="11" strokeLinecap="round"/></g></g>
    <ellipse cx="131" cy="279" rx="65" ry="12" fill="none" stroke="#94ad813a" strokeWidth="3"/>
    </svg><div className="scene-path"><span/><span/><span/><span/></div>
  </div>;
}
