const digits:Record<string,string[]>={
 '0':['01110','11011','11011','11011','11011','11011','01110'],
 '1':['00110','01110','00110','00110','00110','00110','01111'],
 '2':['01110','11011','00011','00110','01100','11000','11111'],
 '3':['11110','00011','00011','01110','00011','00011','11110'],
 '4':['00011','00111','01111','11011','11111','00011','00011'],
 '5':['11111','11000','11000','11110','00011','00011','11110'],
 '6':['01110','11000','11000','11110','11011','11011','01110'],
 '7':['11111','00011','00110','00110','01100','01100','01100'],
 '8':['01110','11011','11011','01110','11011','11011','01110'],
 '9':['01110','11011','11011','01111','00011','00011','01110'],
 '—':['00000','00000','00000','11111','00000','00000','00000']};
export function DotNumber({value}:{value:number|null}){const text=value===null?'——':String(value);return <svg className="dot-number" viewBox={`0 0 ${text.length*38} 48`} role="img" aria-label={value===null?'No reading':`${value} beats per minute`}>{[...text].flatMap((d,k)=>(digits[d]||digits['—']).flatMap((row,y)=>[...row].map((c,x)=>c==='1'?<circle key={`${k}-${y}-${x}`} cx={k*38+x*6.8+3} cy={y*6.8+3} r="2.7" fill="currentColor"/>:null)))}</svg>}
export function DotGraph({values=[],dark=false}:{values?:number[];dark?:boolean}){const width=48,rows=11;return <svg className="dot-graph" viewBox="0 0 288 70" role="img" aria-label={values.length?'Recorded heart-rate trend, not an ECG':'No recorded heart-rate data'}>{Array.from({length:width*rows},(_,i)=>{const x=i%width,y=Math.floor(i/width),index=Math.floor(x/width*values.length),value=values[index];const height=value===undefined?0:Math.max(1,Math.min(rows,Math.round(value/180*rows)));return <circle key={i} cx={x*6+3} cy={y*6+3} r="1.7" fill={rows-y<=height?'#fa343b':dark?'#353535':'#dedee0'}/>;})}</svg>}
export function PulseOrb({active=false,children}:{active?:boolean;children?:React.ReactNode}){return <div className={'pulse-orb '+(active?'active':'')}><svg viewBox="0 0 320 320" aria-hidden="true">{Array.from({length:1100},(_,i)=>{const angle=i*2.39996,radius=108+Math.sin(i*1.79)*17+Math.sin(i*.013)*7;return <circle key={i} cx={160+Math.cos(angle)*radius} cy={160+Math.sin(angle)*radius} r={.45+(i%4)*.13} fill={i%3?'#ff2a35':'#8b1720'} opacity={.3+(i%7)*.1}/>;})}</svg><div className="pulse-orb-center">{children}</div></div>}
