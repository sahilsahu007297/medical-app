import { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Activity, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PulseOrb } from './MedicalGraphics';
import './health.css';

type AuthValue = { session: Session | null; scope: string; name: string; signOut: () => Promise<void> };
const AuthContext = createContext<AuthValue>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthGate({children}: {children: React.ReactNode}) {
  const [session,setSession]=useState<Session|null>(null);
  const [loading,setLoading]=useState(!!supabase);
  const [preview,setPreview]=useState(()=>!supabase && sessionStorage.getItem('rest-preview')==='yes');
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{
    if(!supabase)return;
    let alive=true;
    supabase.auth.getSession().then(({data,error})=>{if(alive){setSession(data.session);setLoading(false);if(error)setError(error.message);}}).catch(()=>{if(alive){setLoading(false);setError('Could not restore your session. Please try signing in again.');}});
    const {data}=supabase.auth.onAuthStateChange((_event,session)=>{setSession(session);setLoading(false);setBusy(false);});
    return()=>{alive=false;data.subscription.unsubscribe();};
  },[]);
  async function signIn() {
    if(!supabase)return;
    setError('');setBusy(true);
    try { const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin+'/'}});if(error)throw error; }
    catch(e){setError(e instanceof Error?e.message:'Sign-in failed. Please try again.');setBusy(false);}
  }
  async function signOut() {
    if(supabase){const {error}=await supabase.auth.signOut({scope:'local'});if(error){setError(error.message);throw error;}}
    sessionStorage.removeItem('rest-preview');setPreview(false);setSession(null);
  }
  if(loading)return <div className="auth-loading">Opening your health space…</div>;
  if(session || preview)return <AuthContext.Provider value={{session,scope:session?.user.id||'local',name:session?.user.user_metadata?.full_name||'Your profile',signOut}}>{children}</AuthContext.Provider>;
  return <div className="signin-page"><div className="signin-art"><a className="signin-brand" href="/"><Activity/> rest.</a><span className="eyebrow">A LITTLE CARE. A BETTER YOU.</span><h1>Your health.<br/>Beautifully connected.</h1><p>Your daily movement, little wins, and healthier habits.<br/>All in one thoughtful space.</p><PulseOrb><Heart size={76} strokeWidth={.9}/><span>IN SYNC WITH YOU</span></PulseOrb><div className="signin-art-footer"><span>MOVE WITH INTENTION</span><span>✳</span></div></div><section className="signin-form"><div><span className="eyebrow">WELCOME TO YOUR HEALTH SPACE</span><h2>Feel a little more<br/>in sync.</h2><p>Keep your steps, workouts, and daily progress together. Pick up right where you left off.</p><button className="google-button" onClick={signIn} disabled={!supabase||busy}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.2h5.4a4.7 4.7 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.5Z"/><path fill="#34A853" d="M12 22c2.7 0 5-1 6.6-2.4L15.4 17c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.8a6 6 0 0 1 0-3.6V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6Z"/><path fill="#EA4335" d="M12 6c1.5 0 2.7.5 3.7 1.5l2.8-2.8A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.9 5.6l3.3 2.6A6 6 0 0 1 12 6Z"/></svg>{busy?'Opening Google…':'Login with Google'}<ArrowRight size={16}/></button><small className="google-only">Only login with Google. No passwords to remember.</small>{!supabase&&<div className="auth-setup-note"><p>Google sign-in will be available once the app is connected.</p><button onClick={()=>{sessionStorage.setItem('rest-preview','yes');setPreview(true)}}>Preview on this device <ArrowRight size={14}/></button><small>Local preview only. This does not create an account.</small></div>}{error&&<p className="health-error" role="alert">{error}</p>}<div className="signin-privacy"><ShieldCheck size={18}/><span>Your health story belongs to you.<br/>Private records. A space of your own.</span></div></div><footer>Small steps today. A healthier tomorrow.</footer></section></div>;
}
