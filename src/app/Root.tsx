import App from './App';
import { AuthGate, useAuth } from './health/Auth';
import { WellnessProvider, useWellness } from './health/WellnessProvider';
import { HeartMonitorProvider } from './health/HeartMonitor';
import './medical.css';
function MonitoredApp(){const health=useWellness();return <HeartMonitorProvider onRecord={health.addHeart}><App/></HeartMonitorProvider>;}
function AccountApp(){const {scope}=useAuth();return <WellnessProvider key={scope}><MonitoredApp/></WellnessProvider>;}
export default function Root(){return <AuthGate><AccountApp/></AuthGate>;}
