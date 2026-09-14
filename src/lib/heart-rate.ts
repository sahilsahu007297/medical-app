export type HeartMeasurement = { bpm:number; contact:'detected'|'not-detected'|'unsupported'; rr:number[] };
// Bluetooth SIG Heart Rate Measurement (0x2A37), little endian.
export function parseHeartRate(value:DataView):HeartMeasurement|null {
  if(value.byteLength<2)return null;
  const flags=value.getUint8(0);let offset=1;
  if((flags&1)&&value.byteLength<3)return null;
  const bpm=flags&1?value.getUint16(offset,true):value.getUint8(offset);offset+=flags&1?2:1;
  const contact=flags&4?(flags&2?'detected':'not-detected'):'unsupported';
  if(flags&8){if(value.byteLength<offset+2)return null;offset+=2;}
  const rr:number[]=[];
  if(flags&16){if(value.byteLength<offset+2||(value.byteLength-offset)%2!==0)return null;while(offset+1<value.byteLength){rr.push(value.getUint16(offset,true)/1024*1000);offset+=2;}}
  if(bpm===0||contact==='not-detected')return null;
  return {bpm,contact,rr};
}
