import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity, Heart, Footprints, Droplet, Moon, Eye, Sparkles, Brain,
  Shield, Wind, Bone, Utensils, ChevronRight, ChevronLeft, Check,
  Bell, Bluetooth, Camera, Zap, Flame, ArrowRight, Pause, Play,
  Bell as BellIcon, Download, Cloud, Lock, WifiOff, Info, CircleUser,
  Smartphone, Settings as SettingsIcon, LayoutGrid, LineChart as LineChartIcon,
  Home as HomeIcon,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Area, AreaChart,
} from "recharts";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import bodyModel from "@/imports/image.png";

/* ============================ Status system (green/amber/red) ============================ */
const STATUS = {
  green: { color: "#22c55e", soft: "#e4f6e9", label: "Good", text: "No issues logged" },
  amber: { color: "#e79a3a", soft: "#fbeed6", label: "Watch", text: "Mild / occasional" },
  red: { color: "#ef4444", soft: "#fbe0e0", label: "Flagged", text: "Frequent / flagged" },
} as const;
type StatusKey = keyof typeof STATUS;

const ORANGE = "#3f9d6a";
const CARD = "bg-white/60 backdrop-blur-xl rounded-[26px] border border-white/75 shadow-[0_18px_44px_-26px_rgba(37,76,52,0.32)]";

/* ============================ Shared bits ============================ */
function StatusDot({ status, size = 10 }: { status: StatusKey; size?: number }) {
  return (
    <span className="inline-block rounded-full shrink-0"
      style={{ width: size, height: size, background: STATUS[status].color, boxShadow: `0 0 0 3px ${STATUS[status].soft}` }} />
  );
}
function StatusBadge({ status }: { status: StatusKey }) {
  const s = STATUS[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: s.soft, color: s.color }}>
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: s.color }} /> {s.label}
    </span>
  );
}

function ProgressRing({
  value, size = 84, stroke = 8, color = ORANGE, track = "#e7e1db", children,
}: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(value, 100) / 100) * c;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: off }}
          transition={{ duration: 1, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

function CheckPop({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className="grid place-items-center w-6 h-6 rounded-full bg-[#22c55e] text-white shrink-0">
          <Check size={14} strokeWidth={3} />
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function DisclaimerBanner() {
  return (
    <div className="flex gap-2.5 rounded-2xl bg-accent border border-[#f2c7a8] p-3.5">
      <Info size={18} className="text-[#b3480f] shrink-0 mt-0.5" />
      <p className="text-xs leading-relaxed text-[#8a4416]">
        General wellness information only — not a recommendation. Talk to your doctor before starting any supplement.
      </p>
    </div>
  );
}

function PillButton({
  children, onClick, variant = "primary", className = "",
}: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "soft"; className?: string }) {
  const base = "w-full rounded-full py-3.5 font-semibold text-[15px] transition active:scale-[0.98]";
  if (variant === "ghost") return <button onClick={onClick} className={`${base} text-muted-foreground ${className}`}>{children}</button>;
  if (variant === "soft") return <button onClick={onClick} className={`${base} bg-secondary text-primary ${className}`}>{children}</button>;
  return (
    <button onClick={onClick}
      className={`${base} bg-primary text-white shadow-[0_14px_30px_-10px_rgba(239,106,46,0.65)] ${className}`}>
      {children}
    </button>
  );
}

/* Big thin numeral, matching reference */
function BigStat({ value, unit, className = "" }: { value: React.ReactNode; unit?: string; className?: string }) {
  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className="font-extralight tracking-tighter leading-none text-foreground" style={{ fontSize: 64 }}>{value}</span>
      {unit && <span className="text-base font-normal text-muted-foreground">{unit}</span>}
    </div>
  );
}

/* Circular countdown/elapsed timer with pause — from the ECG reference */
function RingTimer({ seconds, total, running, onToggle }: { seconds: number; total: number; running: boolean; onToggle: () => void }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <div className="relative grid place-items-center" style={{ width: 150, height: 150 }}>
      <ProgressRing value={(seconds / total) * 100} size={150} stroke={5} color={ORANGE} track="#e7e1db" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className="font-mono text-2xl font-light tracking-widest text-foreground">{mm}:{ss}</span>
        <button onClick={onToggle} className="grid h-9 w-9 place-items-center rounded-full text-primary">
          {running ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
      </div>
    </div>
  );
}

/* ============================ Data ============================ */
const GOALS = [
  { id: "energy", label: "Feel more energetic", icon: Zap },
  { id: "sleep", label: "Sleep better", icon: Moon },
  { id: "move", label: "Move more", icon: Footprints },
  { id: "track", label: "Just track everything", icon: Activity },
];
const MOODS = [
  { v: 1, face: "😞", label: "Rough" }, { v: 2, face: "😕", label: "Low" },
  { v: 3, face: "😐", label: "Okay" }, { v: 4, face: "🙂", label: "Good" }, { v: 5, face: "😄", label: "Great" },
];
const SYMPTOMS = [
  { id: "headache", label: "Headache" }, { id: "fatigue", label: "Fatigue" }, { id: "joint", label: "Joint pain" },
  { id: "sleep", label: "Poor sleep" }, { id: "digestion", label: "Digestion" }, { id: "eyestrain", label: "Eye strain" }, { id: "none", label: "None" },
];

type System = {
  id: string; name: string; short: string; icon: any; status: StatusKey;
  does: string; habit: string; how: string; supplements: string[]; region: { top: string; left: string; w: string; h: string };
};
const SYSTEMS: System[] = [
  { id: "cardio", name: "Cardiovascular", short: "Heart & circulation", icon: Heart, status: "green",
    does: "Pumps oxygen-rich blood to every cell and clears waste from your tissues.",
    habit: "Take a 10-minute brisk walk after lunch.",
    how: "Set a timer, keep a pace where you can still talk but not sing. Consistency beats intensity.",
    supplements: ["Omega-3 (fish oil)", "Coenzyme Q10", "Magnesium"], region: { top: "20%", left: "40%", w: "20%", h: "12%" } },
  { id: "musculo", name: "Musculoskeletal", short: "Muscles & joints", icon: Bone, status: "amber",
    does: "Supports your frame, stores minerals, and lets you move without pain.",
    habit: "Do 5 minutes of gentle mobility in the morning.",
    how: "Roll shoulders, circle wrists and ankles, and do slow hip openers before screens.",
    supplements: ["Vitamin D3", "Collagen peptides", "Calcium"], region: { top: "55%", left: "30%", w: "40%", h: "25%" } },
  { id: "digestive", name: "Digestive", short: "Gut & nutrients", icon: Utensils, status: "green",
    does: "Breaks down food, absorbs nutrients, and hosts most of your immune activity.",
    habit: "Add one fiber-rich food to each meal.",
    how: "Think beans, berries, oats, or leafy greens — small additions, no overhaul.",
    supplements: ["Probiotics", "Psyllium fiber", "Digestive enzymes"], region: { top: "40%", left: "42%", w: "16%", h: "14%" } },
  { id: "respiratory", name: "Respiratory", short: "Lungs & breath", icon: Wind, status: "green",
    does: "Delivers oxygen to your blood and removes carbon dioxide with every breath.",
    habit: "Practice 4-7-8 breathing once a day.",
    how: "Inhale 4s, hold 7s, exhale 8s. Repeat four cycles to steady your nervous system.",
    supplements: ["Vitamin C", "Quercetin", "NAC"], region: { top: "22%", left: "34%", w: "32%", h: "12%" } },
  { id: "sleep", name: "Sleep & Recovery", short: "Rest & repair", icon: Moon, status: "amber",
    does: "Consolidates memory, repairs tissue, and resets hormones overnight.",
    habit: "Keep a consistent wind-down at the same time nightly.",
    how: "Dim lights an hour before bed and put screens away 30 minutes prior.",
    supplements: ["Magnesium glycinate", "L-theanine", "Melatonin"], region: { top: "6%", left: "43%", w: "14%", h: "10%" } },
  { id: "eyes", name: "Eyes", short: "Vision & focus", icon: Eye, status: "red",
    does: "Focus light into signals your brain reads as sight — sensitive to screen strain.",
    habit: "Follow the 20-20-20 rule.",
    how: "Every 20 minutes, look at something 20 feet away for 20 seconds.",
    supplements: ["Lutein & zeaxanthin", "Omega-3", "Vitamin A"], region: { top: "8%", left: "44%", w: "12%", h: "5%" } },
  { id: "skin", name: "Skin", short: "Barrier & hydration", icon: Sparkles, status: "green",
    does: "Your largest organ — a barrier that regulates temperature and hydration.",
    habit: "Hydrate and use SPF each morning.",
    how: "A glass of water on waking and broad-spectrum SPF 30 before you head out.",
    supplements: ["Collagen", "Vitamin C", "Zinc"], region: { top: "48%", left: "18%", w: "10%", h: "20%" } },
  { id: "mental", name: "Mental / Cognitive", short: "Mind & focus", icon: Brain, status: "amber",
    does: "Governs mood, memory, and focus — shaped by sleep, movement, and stress.",
    habit: "Take a 3-minute mindful pause midday.",
    how: "Close your eyes, notice five things you can hear, and let your breath slow.",
    supplements: ["Omega-3 (DHA)", "B-complex", "L-theanine"], region: { top: "2%", left: "44%", w: "12%", h: "6%" } },
  { id: "immune", name: "Immune", short: "Defense & repair", icon: Shield, status: "green",
    does: "Detects and clears threats, and remembers them for faster future defense.",
    habit: "Prioritize 7+ hours of sleep tonight.",
    how: "Sleep is when immune cells consolidate — protect your bedtime like a meeting.",
    supplements: ["Vitamin D3", "Zinc", "Vitamin C"], region: { top: "34%", left: "36%", w: "12%", h: "10%" } },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const stepsData = [4200, 6800, 5100, 8300, 7200, 3900, 6845].map((v, i) => ({ d: DAYS[i], v }));
const hrData = [70, 74, 68, 72, 76, 69, 72].map((v, i) => ({ d: DAYS[i], v }));
const sleepData = [6.5, 7.2, 5.8, 8.1, 7.0, 6.2, 7.2].map((v, i) => ({ d: DAYS[i], v }));
const moodData = [3, 4, 2, 5, 4, 3, 4].map((v, i) => ({ d: DAYS[i], v }));

/* ============================ Phone shell ============================ */
function PhoneShell({ children, offline }: { children: React.ReactNode; offline?: boolean }) {
  return (
    <div className="min-h-screen w-full overflow-hidden"
      style={{ background: "radial-gradient(circle at 12% 18%,rgba(255,255,255,.8),transparent 26%), linear-gradient(145deg,#e9f1e8 0%,#dce9dc 55%,#c9ddca 100%)" }}>
      <div className="relative min-h-screen w-full overflow-hidden">
        <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full border border-white/40 opacity-60" />
        <div className="pointer-events-none absolute -left-28 bottom-16 h-80 w-80 rounded-full border border-white/35 opacity-60" />
        {offline && (
          <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-center gap-2 bg-foreground py-2 text-xs font-medium text-white">
            <WifiOff size={13} /> You're offline — data will sync when reconnected
          </div>
        )}
        <div className="hide-scrollbar relative z-10 min-h-screen overflow-y-auto">{children}</div>
      </div>
      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}

function Screen({ children, k }: { children: React.ReactNode; k: string }) {
  return (
    <motion.div key={k} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.28, ease: "easeOut" }} className="min-h-full">
      {children}
    </motion.div>
  );
}

/* Light top bar — centered title + optional back / right slot (reference style) */
function TopBar({ title, onBack, right }: { title?: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 pb-2 pt-16">
      {onBack ? (
        <button onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full bg-white/70 text-foreground shadow-sm active:scale-95">
          <ChevronLeft size={20} />
        </button>
      ) : <span className="h-10 w-10" />}
      {title && <h2 className="text-[17px] font-semibold text-foreground">{title}</h2>}
      <div className="flex h-10 min-w-10 items-center justify-end">{right}</div>
    </div>
  );
}

/* Greeting header — mixed weight, reference style */
function Greeting({ small, big, right }: { small: string; big: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between px-6 pb-3 pt-16">
      <div>
        <p className="text-[15px] font-normal text-muted-foreground">{small}</p>
        <h1 className="text-[26px] font-bold leading-tight text-foreground">{big}</h1>
      </div>
      {right}
    </div>
  );
}

/* ============================ App ============================ */
type ScreenId =
  | "splash" | "goal" | "hr-onboard" | "perm-motion" | "checkin" | "summary"
  | "perm-notif" | "streak" | "home" | "bodymap" | "detail" | "trends" | "settings" | "hr-check" | "pairing";

export default function App() {
  const [screen, setScreen] = useState<ScreenId>("splash");
  const [goal, setGoal] = useState<string | null>(null);
  const [activeSystem, setActiveSystem] = useState<System>(SYSTEMS[0]);
  const [water, setWater] = useState(750);
  const [checkinDone, setCheckinDone] = useState(false);
  const [offline, setOffline] = useState(false);

  const isTab = ["home", "bodymap", "trends", "settings"].includes(screen);
  const goalObj = GOALS.find((g) => g.id === goal);

  return (
    <PhoneShell offline={offline}>
      <div className="relative min-h-full">
        <AnimatePresence mode="wait">
          <Screen k={screen}>
            {screen === "splash" && <Splash onStart={() => setScreen("goal")} />}
            {screen === "goal" && <GoalPick onPick={(g) => { setGoal(g); setScreen("hr-onboard"); }} />}
            {screen === "hr-onboard" && <HeartRate onboarding onDone={() => setScreen("perm-motion")} onBack={() => setScreen("goal")} />}
            {screen === "perm-motion" && <PermMotion onNext={() => setScreen("checkin")} />}
            {screen === "checkin" && <CheckIn onDone={() => { setCheckinDone(true); setScreen("summary"); }} />}
            {screen === "summary" && <Summary goal={goalObj} water={water} onNext={() => setScreen("perm-notif")} />}
            {screen === "perm-notif" && <PermNotif onNext={() => setScreen("streak")} />}
            {screen === "streak" && <Streak onNext={() => setScreen("home")} />}

            {screen === "home" && (
              <Home goal={goalObj} water={water} setWater={setWater} checkinDone={checkinDone}
                offline={offline} setOffline={setOffline}
                onBody={() => setScreen("bodymap")} onHR={() => setScreen("hr-check")}
                onCheckin={() => setScreen("checkin")} onPair={() => setScreen("pairing")} />
            )}
            {screen === "bodymap" && <BodyMap onBack={() => setScreen("home")} onOpen={(s) => { setActiveSystem(s); setScreen("detail"); }} />}
            {screen === "detail" && <SystemDetail system={activeSystem} onBack={() => setScreen("bodymap")} />}
            {screen === "trends" && <Trends />}
            {screen === "settings" && <SettingsScreen offline={offline} setOffline={setOffline} onPair={() => setScreen("pairing")} />}
            {screen === "hr-check" && <HeartRate onDone={() => setScreen("home")} onBack={() => setScreen("home")} onPair={() => setScreen("pairing")} />}
            {screen === "pairing" && <Pairing onBack={() => setScreen("home")} />}
          </Screen>
        </AnimatePresence>
        {isTab && <BottomNav screen={screen} setScreen={setScreen} />}
      </div>
    </PhoneShell>
  );
}

/* ============================ Splash ============================ */
function Splash({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex min-h-[800px] flex-col px-8 pb-12 pt-20">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
          className="mb-10 grid h-24 w-24 place-items-center rounded-[30px] bg-accent">
          <Heart size={44} className="text-primary" fill={ORANGE} />
        </motion.div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">Rest</p>
        <h1 className="text-[34px] font-light leading-[1.15] tracking-tight text-foreground">
          Know your body in<br /><span className="font-bold">3 taps a day.</span>
        </h1>
        <p className="mt-5 max-w-[280px] text-[15px] leading-relaxed text-muted-foreground">
          A calm daily check-in. No forms, no diagnosis — just gentle, body-system guidance.
        </p>
      </div>
      <PillButton onClick={onStart}>Get Started</PillButton>
      <p className="mt-4 text-center text-xs text-muted-foreground">No sign-up needed to begin</p>
    </div>
  );
}

/* ============================ Goal ============================ */
function GoalPick({ onPick }: { onPick: (g: string) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div className="min-h-[800px] px-6 pb-10 pt-20">
      <p className="text-sm font-semibold text-primary">Step 1 of 3</p>
      <h1 className="mt-2 text-[26px] font-light leading-tight text-foreground">What brings you <span className="font-bold">here today?</span></h1>
      <p className="mt-2 text-[15px] text-muted-foreground">We'll tailor your daily focus to this.</p>
      <div className="mt-7 space-y-3">
        {GOALS.map((g, i) => {
          const active = sel === g.id;
          return (
            <motion.button key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              onClick={() => { setSel(g.id); setTimeout(() => onPick(g.id), 320); }}
              className={`flex w-full items-center gap-4 rounded-[24px] border p-4 text-left transition ${
                active ? "border-primary bg-accent" : "border-white/70 bg-white/60 backdrop-blur"}`}>
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${active ? "bg-primary text-white" : "bg-secondary text-primary"}`}>
                <g.icon size={22} />
              </span>
              <span className="flex-1 text-[16px] font-semibold text-foreground">{g.label}</span>
              {active ? <CheckPop show /> : <ChevronRight size={20} className="text-muted-foreground" />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ Heart rate (with ring timer + ECG) ============================ */
function HeartRate({ onboarding, onDone, onBack, onPair }: { onboarding?: boolean; onDone: () => void; onBack: () => void; onPair?: () => void }) {
  const [phase, setPhase] = useState<"intro" | "hold" | "reading" | "result">("intro");
  const [bpm, setBpm] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const TOTAL = 12;

  useEffect(() => {
    if (phase === "reading" && running) {
      const iv = setInterval(() => {
        setElapsed((e) => {
          const n = e + 1;
          setBpm(60 + Math.floor(Math.random() * 30));
          if (n >= TOTAL) { clearInterval(iv); setBpm(95); setPhase("result"); return TOTAL; }
          return n;
        });
      }, 1000);
      return () => clearInterval(iv);
    }
  }, [phase, running]);

  const range: StatusKey = bpm < 60 ? "amber" : bpm <= 100 ? "green" : "red";
  const rangeLabel = bpm < 60 ? "below resting" : bpm <= 100 ? "resting, normal range" : "elevated";

  return (
    <div className="min-h-[800px]">
      <TopBar title={onboarding ? "Instant check-up" : "Heart Rate"} onBack={onBack} />
      <div className="px-6 pt-2">
        <h1 className="text-[24px] font-light leading-tight text-foreground">
          Let's measure<br /><span className="font-bold">your heart rate</span>
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">Place your fingertip gently over the camera and flash.</p>
      </div>

      <div className="px-6 pb-10 pt-6">
        <div className={`${CARD} p-6`}>
          {phase === "intro" && (
            <div className="text-center">
              <div className="mx-auto mb-5 grid h-40 w-40 place-items-center rounded-full bg-secondary">
                <Camera size={54} className="text-primary" />
              </div>
              <p className="text-[15px] text-muted-foreground">This takes about 12 seconds. Nothing leaves your device.</p>
              <div className="mt-6"><PillButton onClick={() => setPhase("hold")}>Start reading</PillButton></div>
            </div>
          )}

          {phase === "hold" && (
            <div className="text-center">
              <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}
                className="mx-auto mb-5 grid h-40 w-40 place-items-center rounded-full border-4 border-dashed border-primary/40 bg-secondary">
                <Camera size={48} className="text-primary" />
              </motion.div>
              <h3 className="font-bold text-foreground">Hold still</h3>
              <p className="mt-1 text-[14px] text-muted-foreground">Cover the lens fully and keep your finger steady.</p>
              <div className="mt-6"><PillButton onClick={() => { setElapsed(0); setRunning(true); setPhase("reading"); }}>I'm holding steady</PillButton></div>
            </div>
          )}

          {phase === "reading" && <Reading bpm={bpm} elapsed={elapsed} total={TOTAL} running={running} onToggle={() => setRunning((r) => !r)} />}

          {phase === "result" && (
            <div className="text-center">
              <div className="flex flex-col items-center">
                <BigStat value={bpm} unit="bpm" className="justify-center" />
                <div className="mt-3"><StatusBadge status={range} /></div>
                <p className="mt-2 text-[15px] font-medium capitalize" style={{ color: STATUS[range].color }}>{rangeLabel}</p>
              </div>
              <EcgLine className="my-5" />
              <div className="space-y-2.5">
                <PillButton onClick={onDone}>{onboarding ? "Nice — continue" : "Save reading"}</PillButton>
                {onPair && <PillButton variant="soft" onClick={onPair}>Use a Bluetooth monitor instead</PillButton>}
              </div>
            </div>
          )}
        </div>
        {onboarding && phase === "intro" && (
          <p className="mt-4 text-center text-xs text-muted-foreground">A quick taste of what Rest does — before we ask for anything.</p>
        )}
      </div>
    </div>
  );
}

function Reading({ bpm, elapsed, total, running, onToggle }: { bpm: number; elapsed: number; total: number; running: boolean; onToggle: () => void }) {
  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">ECG Recording</p>
      <BigStat value={bpm || "--"} unit="bpm" className="mt-2 justify-center" />
      <EcgLine className="my-5" live={running} />
      <div className="flex justify-center">
        <RingTimer seconds={elapsed} total={total} running={running} onToggle={onToggle} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{running ? "Measuring — keep holding" : "Paused"}</p>
    </div>
  );
}

/* Orange ECG waveform */
function EcgLine({ className = "", live = false }: { className?: string; live?: boolean }) {
  const [pts, setPts] = useState<number[]>(Array(60).fill(40));
  useEffect(() => {
    if (!live) return;
    const iv = setInterval(() => {
      setPts((p) => {
        const next = [...p.slice(1)];
        const t = Date.now() / 110;
        const beat = Math.sin(t) > 0.92 ? -28 : Math.sin(t) < -0.92 ? 10 : 0;
        next.push(40 + beat + Math.sin(t * 4) * 3);
        return next;
      });
    }, 45);
    return () => clearInterval(iv);
  }, [live]);
  const staticWave = "0,40 8,40 12,30 16,10 20,55 24,25 28,40 40,40 44,32 48,8 52,58 56,28 60,40 72,40 76,34 80,12 84,52 88,30 100,40";
  const d = live ? pts.map((y, i) => `${(i / (pts.length - 1)) * 100},${y}`).join(" ") : staticWave;
  return (
    <div className={`w-full ${className}`}>
      <svg viewBox="0 0 100 70" className="h-20 w-full" preserveAspectRatio="none">
        <polyline points={d} fill="none" stroke={ORANGE} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ============================ Permissions ============================ */
function PermCard({
  icon: Icon, title, line1, line2, onEnable, onSkip, step,
}: { icon: any; title: string; line1: string; line2: string; onEnable: () => void; onSkip: () => void; step?: string }) {
  return (
    <div className="min-h-[800px] flex flex-col px-6 pb-10 pt-20">
      {step && <p className="text-sm font-semibold text-primary">{step}</p>}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}
          className="mb-7 grid h-24 w-24 place-items-center rounded-[30px] bg-accent">
          <Icon size={42} className="text-primary" />
        </motion.div>
        <h1 className="text-[24px] font-light text-foreground">{title}</h1>
        <p className="mt-3 max-w-[300px] text-[15px] leading-relaxed text-muted-foreground">{line1}</p>
        <p className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-[#22c55e]"><Lock size={13} /> {line2}</p>
      </div>
      <div className="space-y-2">
        <PillButton onClick={onEnable}>Enable</PillButton>
        <PillButton variant="ghost" onClick={onSkip}>Not now</PillButton>
      </div>
    </div>
  );
}
function PermMotion({ onNext }: { onNext: () => void }) {
  return <PermCard icon={Footprints} step="Step 2 of 3" title="Count your steps automatically"
    line1="Rest uses your phone's motion sensor to passively track steps while the app is open."
    line2="This stays on your phone." onEnable={onNext} onSkip={onNext} />;
}
function PermNotif({ onNext }: { onNext: () => void }) {
  return <PermCard icon={BellIcon} title="Want a gentle reminder each morning?"
    line1="One calm nudge a day to do your 3-tap check-in. No streak-shaming, ever."
    line2="You can turn this off anytime." onEnable={onNext} onSkip={onNext} />;
}

/* ============================ Check-in ============================ */
function CheckIn({ onDone }: { onDone: () => void }) {
  const [mood, setMood] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [sleep, setSleep] = useState(7);
  const [touchedSleep, setTouchedSleep] = useState(false);

  const toggleSym = (id: string) => {
    setSymptoms((prev) => {
      if (id === "none") return ["none"];
      const withoutNone = prev.filter((p) => p !== "none");
      return withoutNone.includes(id) ? withoutNone.filter((p) => p !== id) : [...withoutNone, id];
    });
  };
  const complete = mood !== null;

  return (
    <div className="min-h-[800px] px-6 pb-28 pt-20">
      <p className="text-sm font-semibold text-primary">Today's 3 quick questions</p>
      <h1 className="mt-1 text-[26px] font-light text-foreground">Daily <span className="font-bold">check-in</span></h1>
      <p className="mt-1.5 text-[14px] text-muted-foreground">Each answer saves itself. No submit button.</p>

      <div className={`${CARD} mt-6 p-5`}>
        <div className="mb-3 flex items-center justify-between"><h3 className="font-bold text-foreground">How do you feel?</h3><CheckPop show={mood !== null} /></div>
        <div className="flex justify-between">
          {MOODS.map((m) => (
            <button key={m.v} onClick={() => setMood(m.v)} className="flex flex-col items-center gap-1.5">
              <motion.span whileTap={{ scale: 1.3 }}
                className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl transition ${mood === m.v ? "bg-accent ring-2 ring-primary" : "bg-muted grayscale-[0.4]"}`}>{m.face}</motion.span>
              <span className={`text-[11px] ${mood === m.v ? "font-semibold text-primary" : "text-muted-foreground"}`}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={`${CARD} mt-4 p-5`}>
        <div className="mb-3 flex items-center justify-between">
          <div><h3 className="font-bold text-foreground">Anything bothering you?</h3><p className="text-xs text-muted-foreground">Optional — tap all that apply</p></div>
          <CheckPop show={symptoms.length > 0} />
        </div>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map((s) => {
            const active = symptoms.includes(s.id);
            const isNone = s.id === "none";
            return (
              <button key={s.id} onClick={() => toggleSym(s.id)}
                className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                  active ? (isNone ? "border-[#22c55e] bg-[#e4f6e9] text-[#15803d]" : "border-primary bg-accent text-[#b3480f]") : "border-border bg-muted text-muted-foreground"}`}>
                {active && !isNone && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary" />}{s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`${CARD} mt-4 p-5`}>
        <div className="mb-3 flex items-center justify-between"><h3 className="font-bold text-foreground">Hours of sleep last night</h3><CheckPop show={touchedSleep} /></div>
        <div className="mb-2 flex items-baseline gap-1"><span className="text-[32px] font-extralight text-primary">{sleep}</span><span className="font-semibold text-muted-foreground">hrs</span></div>
        <input type="range" min={0} max={12} step={0.5} value={sleep}
          onChange={(e) => { setSleep(Number(e.target.value)); setTouchedSleep(true); }} className="w-full accent-[#ef6a2e]" />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>0h</span><span>6h</span><span>12h</span></div>
      </div>

      <div className="sticky mx-auto max-w-[380px] px-1" style={{ bottom: 16, paddingTop: 16 }}>
        <PillButton onClick={onDone} className={complete ? "" : "opacity-50 pointer-events-none"}>
          {complete ? "All saved — see today's tip" : "Tap your mood to begin"}
        </PillButton>
      </div>
    </div>
  );
}

/* ============================ Summary ============================ */
function Summary({ goal, water, onNext }: { goal: any; water: number; onNext: () => void }) {
  const tips: Record<string, string> = {
    energy: "a 10-min walk after lunch to steady your afternoon energy.",
    sleep: "dimming the lights an hour before bed tonight.",
    move: "taking the stairs once today — small wins compound.",
    track: "logging a glass of water now to start your hydration streak.",
  };
  return (
    <div className="min-h-[800px] flex flex-col px-6 pb-10 pt-20">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className={`${CARD} w-full p-7 text-center`}>
          <div className="mx-auto mb-5">
            <ProgressRing value={100} size={120} color="#22c55e">
              <div><Check size={30} className="mx-auto text-[#22c55e]" strokeWidth={3} /><p className="mt-0.5 text-xs font-semibold text-muted-foreground">Check-in</p></div>
            </ProgressRing>
          </div>
          <h1 className="text-[22px] font-light text-foreground">Nice — <span className="font-bold">you're all set for today</span></h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Based on your goal (<span className="font-semibold text-primary">{goal?.label.toLowerCase() ?? "wellness"}</span>), here's one thing to try:
          </p>
          <p className="mt-2 text-[16px] font-semibold leading-relaxed text-foreground">Try {tips[goal?.id] ?? tips.track}</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <MiniRing label="Steps" value={62} unit="6.8k" color="#22c55e" />
            <MiniRing label="Water" value={(water / 2500) * 100} unit={`${(water / 1000).toFixed(1)}L`} color={ORANGE} />
            <MiniRing label="Check-in" value={100} unit="Done" color="#1c1b1a" />
          </div>
        </div>
      </div>
      <PillButton onClick={onNext} className="mt-6">Continue</PillButton>
    </div>
  );
}
function MiniRing({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <ProgressRing value={value} size={64} stroke={6} color={color}><span className="text-[11px] font-bold text-foreground">{unit}</span></ProgressRing>
      <span className="mt-1.5 text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/* ============================ Streak ============================ */
function Streak({ onNext }: { onNext: () => void }) {
  return (
    <div className="min-h-[800px] flex flex-col px-8 pb-12 pt-20">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 220, damping: 14 }}
          className="mb-6 grid h-28 w-28 place-items-center rounded-full bg-accent">
          <Flame size={54} className="text-primary" fill={ORANGE} />
        </motion.div>
        <p className="text-[15px] font-medium text-muted-foreground">Day 1 complete</p>
        <h1 className="mt-1 text-[64px] font-extralight leading-none text-foreground">1<span className="ml-2 align-middle text-4xl">🔥</span></h1>
        <p className="mt-4 max-w-[280px] text-[15px] leading-relaxed text-muted-foreground">
          Your streak starts today. Come back tomorrow and you'll have something to protect.
        </p>
      </div>
      <div className="space-y-2.5">
        <PillButton onClick={onNext}>Back up my streak (optional)</PillButton>
        <PillButton variant="ghost" onClick={onNext}>Maybe later — go to my dashboard</PillButton>
      </div>
    </div>
  );
}

/* ============================ Home ============================ */
function Home({ goal, water, setWater, checkinDone, offline, setOffline, onBody, onHR, onCheckin, onPair }: any) {
  const steps = 6845, stepGoal = 10000;
  return (
    <div className="min-h-[800px] pb-28">
      <Greeting small="Good morning," big="Emma"
        right={
          <div className="flex items-center gap-2">
            <button onClick={() => setOffline((o: boolean) => !o)} className="grid h-10 w-10 place-items-center rounded-full bg-white/70 text-foreground shadow-sm">
              {offline ? <WifiOff size={18} /> : <Bell size={18} />}
            </button>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white/70 text-foreground shadow-sm"><CircleUser size={22} /></div>
          </div>
        } />
      <div className="mx-6 mb-4 flex items-center justify-between rounded-2xl bg-[#d4ead8]/80 px-3.5 py-2.5 text-[12px] text-[#32734d]">
        <span className="flex items-center gap-2"><Flame size={15} fill={ORANGE} /> 1-day streak</span>
        <span>Goal: {goal?.label ?? "Track everything"}</span>
      </div>

      <div className="space-y-4 px-5">
        <button onClick={onCheckin} className={`${CARD} flex w-full items-center gap-4 p-4 text-left transition hover:-translate-y-0.5`}>
          <ProgressRing value={checkinDone ? 100 : 0} size={56} stroke={6} color={checkinDone ? "#22c55e" : ORANGE}>
            {checkinDone ? <Check size={20} className="text-[#22c55e]" strokeWidth={3} /> : <span className="text-xs font-bold text-primary">Go</span>}
          </ProgressRing>
          <div className="flex-1">
            <p className="font-bold text-foreground">{checkinDone ? "Today's check-in done" : "Do today's check-in"}</p>
            <p className="text-[13px] text-muted-foreground">{checkinDone ? "Great — see you tomorrow" : "3 quick taps, under 60 seconds"}</p>
          </div>
          <ChevronRight className="text-muted-foreground" />
        </button>

        <div className="grid grid-cols-2 gap-4">
          <div className={`${CARD} p-4`}>
            <div className="mb-1 flex items-center gap-1.5"><Footprints size={16} className="text-[#22c55e]" /><span className="text-xs font-semibold text-muted-foreground">Steps</span></div>
            <div className="my-2 grid place-items-center">
              <ProgressRing value={(steps / stepGoal) * 100} size={92} color="#22c55e">
                <div><p className="text-[18px] font-extralight text-foreground">{steps.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">of {stepGoal / 1000}k</p></div>
              </ProgressRing>
            </div>
            <p className="flex items-center justify-center gap-1 rounded-full bg-accent py-1 text-[10px] font-medium text-[#b3480f]"><Info size={11} /> Keep app open while walking</p>
          </div>

          <div className={`${CARD} p-4`}>
            <div className="mb-1 flex items-center gap-1.5"><Droplet size={16} className="text-primary" /><span className="text-xs font-semibold text-muted-foreground">Water</span></div>
            <div className="my-2 grid place-items-center">
              <ProgressRing value={(water / 2500) * 100} size={92} color={ORANGE}>
                <div><p className="text-[18px] font-extralight text-foreground">{(water / 1000).toFixed(2)}L</p><p className="text-[10px] text-muted-foreground">of 2.5L</p></div>
              </ProgressRing>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setWater((w: number) => w + 250)} className="flex-1 rounded-full bg-secondary py-1.5 text-[11px] font-bold text-primary active:scale-95">+250</button>
              <button onClick={() => setWater((w: number) => w + 500)} className="flex-1 rounded-full bg-secondary py-1.5 text-[11px] font-bold text-primary active:scale-95">+500</button>
            </div>
          </div>
        </div>

        <button onClick={onHR} className={`${CARD} flex w-full items-center gap-4 p-4 text-left`}>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent">
            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}><Heart size={22} fill={ORANGE} className="text-primary" /></motion.span>
          </span>
          <div className="flex-1"><p className="font-bold text-foreground">Heart-rate quick check</p><p className="text-[13px] text-muted-foreground">Last: 95 bpm · camera or Bluetooth</p></div>
          <ChevronRight className="text-muted-foreground" />
        </button>

        <button onClick={onBody} className="flex w-full items-center gap-4 rounded-[26px] bg-[#293633] p-5 text-left text-white shadow-[0_18px_40px_-16px_rgba(32,55,44,0.38)] transition hover:-translate-y-0.5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20"><LayoutGrid size={24} /></span>
          <div className="flex-1"><p className="font-bold">Body Systems</p><p className="text-[13px] text-white/85">See how each system is trending</p></div>
          <ArrowRight />
        </button>

        <button onClick={onPair} className="mx-auto flex items-center gap-2 text-sm font-medium text-muted-foreground"><Bluetooth size={15} /> Pair a device</button>
      </div>
    </div>
  );
}

/* ============================ Body map ============================ */
function BodyMap({ onBack, onOpen }: { onBack: () => void; onOpen: (s: System) => void }) {
  const [mode, setMode] = useState<"grid" | "model">("model");
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div className="min-h-[800px] pb-28">
      <TopBar title="Body Systems" onBack={onBack} />
      <div className="px-6 pt-1">
        <p className="text-[14px] text-muted-foreground">Color-coded by your recent check-in trends.</p>
        <div className="mt-4 flex gap-1 rounded-full bg-secondary p-1">
          {(["model", "grid"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`flex-1 rounded-full py-2 text-sm font-semibold capitalize transition ${mode === m ? "bg-foreground text-white" : "text-muted-foreground"}`}>
              {m === "model" ? "On the model" : "Grid"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-4 px-6 py-4 text-xs text-muted-foreground">
        {(Object.keys(STATUS) as StatusKey[]).map((k) => (<span key={k} className="flex items-center gap-1.5"><StatusDot status={k} size={9} /> {STATUS[k].text}</span>))}
      </div>

      {mode === "model" ? (
        <div className="px-5">
          <div className={`${CARD} relative overflow-hidden p-4`}>
            <p className="mb-2 text-center text-[13px] font-medium text-muted-foreground">Tap a highlighted region to open its detail</p>
            <div className="relative mx-auto w-full max-w-[300px]">
              <ImageWithFallback src={bodyModel} alt="Anatomical human body model" className="w-full select-none" />
              {SYSTEMS.map((s) => {
                const active = hover === s.id;
                return (
                  <button key={s.id} onClick={() => onOpen(s)} onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)}
                    className="absolute rounded-2xl transition"
                    style={{ top: s.region.top, left: s.region.left, width: s.region.w, height: s.region.h,
                      background: `${STATUS[s.status].color}${active ? "55" : "22"}`,
                      boxShadow: active ? `0 0 0 3px ${STATUS[s.status].color}` : `inset 0 0 0 1.5px ${STATUS[s.status].color}80` }}>
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ background: STATUS[s.status].color }} />
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 min-h-[44px] rounded-2xl bg-secondary p-3 text-center">
              {hover ? (() => { const s = SYSTEMS.find((x) => x.id === hover)!; return (
                <span className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground"><StatusDot status={s.status} /> {s.name}</span>
              ); })() : <span className="text-sm text-muted-foreground">Hover or tap a marker to preview</span>}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5">
          {SYSTEMS.map((s) => (
            <button key={s.id} onClick={() => onOpen(s)} className={`${CARD} p-4 text-left active:scale-[0.98]`}>
              <div className="mb-3 flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: STATUS[s.status].soft }}><s.icon size={20} style={{ color: STATUS[s.status].color }} /></span>
                <StatusDot status={s.status} />
              </div>
              <p className="text-[14px] font-bold leading-tight text-foreground">{s.name}</p>
              <p className="text-[12px] text-muted-foreground">{s.short}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ System detail ============================ */
function SystemDetail({ system, onBack }: { system: System; onBack: () => void }) {
  const s = STATUS[system.status];
  return (
    <div className="min-h-[800px] pb-10">
      <TopBar title={system.name} onBack={onBack} right={<StatusBadge status={system.status} />} />
      <div className="flex items-center gap-3 px-6 pt-1">
        <span className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: s.soft }}><system.icon size={28} style={{ color: s.color }} /></span>
        <div><p className="text-[13px] text-muted-foreground">{system.short}</p><p className="text-[15px] font-bold text-foreground">{s.text}</p></div>
      </div>

      <div className="space-y-4 px-5 pt-5">
        <div className={`${CARD} p-5`}>
          <h3 className="mb-1.5 font-bold text-foreground">What this system does</h3>
          <p className="text-[14px] leading-relaxed text-muted-foreground">{system.does}</p>
        </div>
        <div className={`${CARD} p-5`}>
          <div className="mb-2 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-accent"><Sparkles size={16} className="text-primary" /></span><h3 className="font-bold text-foreground">Today's habit</h3></div>
          <p className="text-[15px] font-semibold text-foreground">{system.habit}</p>
          <div className="mt-3 rounded-2xl bg-secondary p-3.5">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-primary">How to do it</p>
            <p className="text-[13px] leading-relaxed text-muted-foreground">{system.how}</p>
          </div>
        </div>
        <div className={`${CARD} p-5`}>
          <h3 className="mb-1 font-bold text-foreground">Commonly considered supplements</h3>
          <p className="mb-3 text-xs text-muted-foreground">People exploring {system.name.toLowerCase()} support often ask about:</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {system.supplements.map((sup) => (<span key={sup} className="rounded-full bg-muted px-3 py-1.5 text-[13px] font-medium text-foreground">{sup}</span>))}
          </div>
          <DisclaimerBanner />
        </div>
      </div>
    </div>
  );
}

/* ============================ Trends ============================ */
const chartAxis = { fontSize: 11, fill: "#8a847d" };
const tip = { borderRadius: 14, border: "none", boxShadow: "0 8px 24px -8px rgba(60,45,30,.35)", background: "#fff" };
function ChartCard({ title, unit, children }: { title: string; unit: string; children: React.ReactNode }) {
  return (
    <div className={`${CARD} p-4`}>
      <div className="mb-2 flex items-baseline justify-between"><h3 className="font-bold text-foreground">{title}</h3><span className="text-xs text-muted-foreground">{unit}</span></div>
      <div className="h-40">{children}</div>
    </div>
  );
}
function Trends() {
  return (
    <div className="min-h-[800px] pb-28">
      <Greeting small="Hi, Emma!" big="Weekly summary" />
      <div className="px-6 pb-1"><p className="text-[14px] text-muted-foreground">Last 7 days at a glance.</p></div>

      <div className="space-y-4 px-5 pt-4">
        <div className="mx-1 flex items-center gap-2 rounded-2xl bg-primary p-3.5 text-white shadow-[0_14px_30px_-14px_rgba(239,106,46,0.7)]">
          <Info size={18} className="shrink-0" /><p className="text-[13px] font-medium">Your HRV is 5% higher than average for your age group.</p>
        </div>

        <ChartCard title="Steps" unit="daily">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stepsData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e7e1db" />
              <XAxis dataKey="d" tick={chartAxis} axisLine={false} tickLine={false} />
              <YAxis tick={chartAxis} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#efe8e2" }} contentStyle={tip} />
              <Bar dataKey="v" fill={ORANGE} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Heart rate" unit="bpm">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hrData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e7e1db" />
              <XAxis dataKey="d" tick={chartAxis} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 82]} tick={chartAxis} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tip} />
              <Line dataKey="v" stroke={ORANGE} strokeWidth={3} dot={{ r: 3, fill: ORANGE }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sleep" unit="hours">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sleepData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs><linearGradient id="sl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ORANGE} stopOpacity={0.35} /><stop offset="100%" stopColor={ORANGE} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="#e7e1db" />
              <XAxis dataKey="d" tick={chartAxis} axisLine={false} tickLine={false} />
              <YAxis tick={chartAxis} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tip} />
              <Area dataKey="v" stroke={ORANGE} strokeWidth={3} fill="url(#sl)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Mood" unit="1–5 scale">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e7e1db" />
              <XAxis dataKey="d" tick={chartAxis} axisLine={false} tickLine={false} />
              <YAxis domain={[1, 5]} tick={chartAxis} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tip} />
              <Line dataKey="v" stroke="#1c1b1a" strokeWidth={3} dot={{ r: 4, fill: "#1c1b1a" }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

/* ============================ Pairing ============================ */
function Pairing({ onBack }: { onBack: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [connected, setConnected] = useState<string | null>(null);
  const devices = [
    { id: "hr", name: "Polar H10", type: "Heart-rate monitor", icon: Heart },
    { id: "bottle", name: "HidrateSpark", type: "Smart water bottle", icon: Droplet },
  ];
  return (
    <div className="min-h-[800px] pb-10">
      <TopBar title="Pair a device" onBack={onBack} />
      <div className="px-6 pt-1"><p className="text-[14px] text-muted-foreground">Connect a heart-rate monitor or smart bottle.</p></div>

      <div className="space-y-4 px-5 pt-5">
        <div className="flex gap-2.5 rounded-2xl bg-secondary border border-border p-3.5">
          <Smartphone size={18} className="text-primary shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-foreground/80">Bluetooth pairing works on <b>Android &amp; Desktop Chrome</b> only — it isn't supported on iPhone Safari. On iOS, use the camera pulse check instead.</p>
        </div>

        <button onClick={() => { setScanning(true); setTimeout(() => setScanning(false), 2200); }} className={`${CARD} flex w-full items-center gap-3 p-4`}>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent">
            <motion.span animate={scanning ? { scale: [1, 1.2, 1] } : {}} transition={{ repeat: Infinity, duration: 1 }}><Bluetooth size={22} className="text-primary" /></motion.span>
          </span>
          <div className="flex-1 text-left"><p className="font-bold text-foreground">{scanning ? "Scanning…" : "Scan for devices"}</p><p className="text-[13px] text-muted-foreground">Make sure your device is in pairing mode</p></div>
        </button>

        <div className="space-y-3">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available devices</p>
          {devices.map((d) => (
            <div key={d.id} className={`${CARD} flex items-center gap-3 p-4`}>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-muted"><d.icon size={20} className="text-primary" /></span>
              <div className="flex-1"><p className="font-bold text-foreground">{d.name}</p><p className="text-[13px] text-muted-foreground">{d.type}</p></div>
              <button onClick={() => setConnected(d.id)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${connected === d.id ? "bg-[#e4f6e9] text-[#15803d]" : "bg-primary text-white"}`}>
                {connected === d.id ? <span className="flex items-center gap-1"><Check size={14} /> Connected</span> : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================ Settings ============================ */
function SettingsScreen({ offline, setOffline, onPair }: any) {
  const [notif, setNotif] = useState(true);
  const [sync, setSync] = useState(false);
  return (
    <div className="min-h-[800px] pb-28">
      <TopBar title="Settings" />
      <div className="px-6 pb-1"><p className="text-[14px] text-muted-foreground">You're in control of your data.</p></div>

      <div className="space-y-4 px-5 pt-4">
        <div className={`${CARD} divide-y divide-border`}>
          <Row icon={Bell} title="Daily reminder" sub="Morning check-in nudge"><Toggle on={notif} set={setNotif} /></Row>
          <Row icon={Cloud} title="Account & cloud sync" sub={sync ? "Backing up your streak" : "Optional — off by default"}><Toggle on={sync} set={setSync} /></Row>
          <Row icon={WifiOff} title="Offline mode (demo)" sub="Preview the offline banner"><Toggle on={offline} set={setOffline} /></Row>
        </div>

        <button onClick={onPair} className={`${CARD} flex w-full items-center gap-3 p-4 text-left`}>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent"><Bluetooth size={20} className="text-primary" /></span>
          <div className="flex-1"><p className="font-bold text-foreground">Paired devices</p><p className="text-[13px] text-muted-foreground">Manage Bluetooth connections</p></div>
          <ChevronRight className="text-muted-foreground" />
        </button>

        <button className={`${CARD} flex w-full items-center gap-3 p-4 text-left`}>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary"><Download size={20} className="text-primary" /></span>
          <div className="flex-1"><p className="font-bold text-foreground">Export my data</p><p className="text-[13px] text-muted-foreground">Download a copy (JSON)</p></div>
          <ChevronRight className="text-muted-foreground" />
        </button>

        <div className={`${CARD} p-5`}>
          <div className="mb-2 flex items-center gap-2"><Lock size={18} className="text-[#22c55e]" /><h3 className="font-bold text-foreground">Privacy & data storage</h3></div>
          <p className="text-[13px] leading-relaxed text-muted-foreground">Rest is <b>local-first</b>. Your daily logs live in your phone's storage and never leave it unless you turn on sync.</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
            <div className="rounded-2xl bg-[#e4f6e9] p-3"><p className="mb-1 font-bold text-[#15803d]">Stays on device</p><p className="text-[#15803d]/80">Check-ins, HR readings, steps, water</p></div>
            <div className="rounded-2xl bg-accent p-3"><p className="mb-1 font-bold text-[#b3480f]">Syncs (if on)</p><p className="text-[#b3480f]/80">Streak count & account backup only</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
function Row({ icon: Icon, title, sub, children }: any) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary"><Icon size={20} className="text-primary" /></span>
      <div className="flex-1"><p className="font-bold text-foreground">{title}</p><p className="text-[13px] text-muted-foreground">{sub}</p></div>
      {children}
    </div>
  );
}
function Toggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <button onClick={() => set(!on)} className={`relative h-7 w-12 rounded-full transition ${on ? "bg-primary" : "bg-switch-background"}`}>
      <motion.span layout className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow" style={{ left: on ? 22 : 2 }} />
    </button>
  );
}

/* ============================ Bottom nav ============================ */
function BottomNav({ screen, setScreen }: { screen: ScreenId; setScreen: (s: ScreenId) => void }) {
  const items = [
    { id: "home", icon: HomeIcon }, { id: "bodymap", icon: LayoutGrid },
    { id: "trends", icon: LineChartIcon }, { id: "settings", icon: SettingsIcon },
  ] as const;
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 px-5 pb-5">
      <div className="mx-auto flex max-w-[320px] items-center justify-between rounded-full bg-white/80 px-3 py-2.5 shadow-[0_16px_40px_-14px_rgba(60,45,30,0.4)] backdrop-blur-xl">
        {items.map((it) => {
          const active = screen === it.id;
          return (
            <button key={it.id} onClick={() => setScreen(it.id)}
              className={`grid h-12 w-12 place-items-center rounded-full transition ${active ? "bg-foreground text-white" : "text-muted-foreground"}`}>
              <it.icon size={22} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
