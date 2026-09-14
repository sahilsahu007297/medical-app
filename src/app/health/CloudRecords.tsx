import { useEffect, useState } from 'react';
import { Cloud, Download, FileText, LogOut, RefreshCw, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './Auth';
import { useWellness } from './WellnessProvider';

export function HealthAccount(){
  const auth=useAuth(),health=useWellness(),[error,setError]=useState('');
  return <section className="panel content-panel health-account"><div className="panel-heading"><h2>{auth.session?'Your connected account':'Your local preview'}</h2><Cloud size={20}/></div><p className="muted-copy">{auth.session?.user.email||'Sign in with Google after setup to keep records across devices. Local preview records stay separate from signed-in accounts.'}</p><div className="setting-row"><div><strong>Daily records & workouts</strong><p className="muted-copy">{health.syncStatus}</p></div>{auth.session&&<button className="outline-button" onClick={()=>void health.sync()}><RefreshCw size={15}/> Retry sync</button>}</div><button className="outline-button" onClick={()=>{health.sensor.stop();auth.signOut().catch(e=>setError(e.message));}}><LogOut size={15}/>{auth.session?'Sign out':'Back to sign in'}</button>{error&&<p className="health-error" role="alert">{error}</p>}</section>;
}
export function CloudRecords(){
  const {session}=useAuth(),[files,setFiles]=useState<{name:string;created_at?:string}[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const folder=session?.user.id;
  async function refresh(){if(!supabase||!folder)return;const {data,error}=await supabase.storage.from('health-records').list(folder,{limit:100,sortBy:{column:'created_at',order:'desc'}});if(error)setError(error.message);else setFiles(data||[]);}
  useEffect(()=>{void refresh();},[folder]);
  async function upload(file:File){
    if(!supabase||!folder)return;
    if(file.size>10*1024*1024||!['application/pdf','image/jpeg','image/png'].includes(file.type)){setError('Choose a PDF, JPG, or PNG up to 10 MB.');return;}
    setBusy(true);setError('');
    try{const path=folder+'/'+crypto.randomUUID()+'_'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const {error}=await supabase.storage.from('health-records').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;await refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  async function download(name:string){if(!supabase||!folder)return;setError('');const {data,error}=await supabase.storage.from('health-records').download(folder+'/'+name);if(error){setError(error.message);return;}const url=URL.createObjectURL(data);const a=document.createElement('a');a.href=url;a.download=name.slice(37);a.click();URL.revokeObjectURL(url);}
  return <section className="panel content-panel cloud-records"><div className="panel-heading"><div><span className="eyebrow">YOUR PRIVATE HEALTH LIBRARY</span><h2>Keep your reports close.</h2></div><label className={'outline-button upload-label '+(!session||busy?'disabled':'')}><Upload size={15}/>{busy?'Uploading…':'Upload report'}<input aria-label="Upload health report" type="file" accept="application/pdf,image/jpeg,image/png" disabled={!session||busy} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value='';}}/></label></div><p className="muted-copy">{session?'Private files, available only to your account. PDF, JPG or PNG · up to 10 MB per file. Showing the latest 100 reports.':'Connect Google sign-in to upload private health reports. Your local daily records work without cloud storage.'}</p>{error&&<div className="health-error" role="alert">{error}<button className="text-button" onClick={()=>void refresh()}>Retry loading files</button></div>}{files.map(f=><div className="booking-item" key={f.name}><span className="report-icon"><FileText size={20}/></span><div><h3>{f.name.slice(37)}</h3><p>{f.created_at?new Date(f.created_at).toLocaleDateString():''}</p></div><button className="outline-button" aria-label={'Download '+f.name.slice(37)} onClick={()=>void download(f.name)}><Download size={16}/>Download</button></div>)}</section>;
}
