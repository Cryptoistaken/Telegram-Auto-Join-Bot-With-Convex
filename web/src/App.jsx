import { useState, useEffect, useCallback, Component } from "react";
import { ConvexProvider, ConvexReactClient, useQuery, useMutation } from "convex/react";
import { api } from "./convex/_generated/api";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
const STORAGE_KEY = "tgbot_apikey";

/* ── Icons ───────────────────────────────────────────────────────────── */
const Icon = {
  Lock: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>),
  Users: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  Plus: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  LogIn: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>),
  List: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>),
  LogOut: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>),
  Trash: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>),
  Check: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  X: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  Send: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
  Phone: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.9 1.19h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>),
  Dashboard: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>),
  Menu: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>),
  ChevronDown: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>),
  Activity: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>),
  Server: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>),
};
/* ── Error Boundary ──────────────────────────────────────────────────── */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { console.warn("Caught UI error:", error?.message); }
  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

/* ── Global Styles ───────────────────────────────────────────────────── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Roboto+Mono:wght@400;500&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-family: 'Inter', system-ui, sans-serif; background: #F9FAFB; color: #101827; -webkit-font-smoothing: antialiased; }
  body { min-height: 100vh; }
  input, button { font-family: inherit; }
  button { cursor: pointer; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #F9FAFB; }
  ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }
  @media (max-width: 600px) {
    .main-container { padding: 12px 12px 80px !important; }
    .card-grid { grid-template-columns: 1fr !important; }
    .stat-grid { grid-template-columns: 1fr 1fr !important; }
    .tab-nav { padding-bottom: 0 !important; }
    .header-actions .logout-label { display: none !important; }
  }
`;

/* ── Design Tokens ───────────────────────────────────────────────────── */
const C = {
  text: "#101827", bg: "#FFFFFF", surface: "#F9FAFB", tertiary: "#F3F4F6",
  accent: "#F97315", accentHover: "#EA580C", border: "#E5E7EB", muted: "#6B7280",
  success: "#10B981", error: "#EF4444",
};

const S = {
  container: { maxWidth: 840, margin: "0 auto", background: C.bg, borderRadius: 16, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)", border: `1px solid ${C.border}` },
  label: { fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted },
  input: { width: "100%", padding: "10px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, outline: "none", transition: "border 0.15s ease, box-shadow 0.15s ease" },
  btnPrimary: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", background: C.text, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "background 0.15s ease, opacity 0.15s ease" },
  btnDefault: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "background 0.15s ease" },
  btnDanger: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", background: C.bg, color: C.error, border: `1px solid ${C.error}`, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "background 0.15s ease" },
  divider: { borderTop: `1px solid ${C.border}`, margin: "24px 0" },
  card: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, transition: "border-color 0.15s ease, transform 0.15s ease" },
  mono: { fontFamily: "'Roboto Mono', 'SF Mono', monospace" },
};

/* ── Input ───────────────────────────────────────────────────────────── */
function Input({ label, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <span style={S.label}>{label}</span>}
      <input {...props} style={{ ...S.input, borderColor: focused ? C.accent : C.border, boxShadow: focused ? "0 0 0 3px rgba(249,115,21,0.1)" : "none" }}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      />
    </div>
  );
}

/* ── Button ──────────────────────────────────────────────────────────── */
function Btn({ variant = "default", disabled, children, style, ...props }) {
  const [hov, setHov] = useState(false);
  const base = variant === "primary" ? S.btnPrimary : variant === "danger" ? S.btnDanger : S.btnDefault;
  const hovStyle = variant === "primary" ? { background: "#1F2937" } : variant === "danger" ? { background: "#FEF2F2" } : { background: C.surface };
  return (
    <button {...props} disabled={disabled}
      style={{ ...base, ...(hov && !disabled ? hovStyle : {}), ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}), ...style }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >{children}</button>
  );
}

/* ── Spinner ─────────────────────────────────────────────────────────── */
function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 0.8s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

/* ── Toast ───────────────────────────────────────────────────────────── */
function Toast({ message, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  const color = type === "success" ? C.success : C.error;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.bg, border: `1px solid ${color}`, borderRadius: 8, padding: "12px 20px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", color, fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, animation: "slideUp 0.2s ease", zIndex: 999, whiteSpace: "nowrap" }}>
      {type === "success" ? <Icon.Check /> : <Icon.X />}{message}
    </div>
  );
}

/* ── Empty ───────────────────────────────────────────────────────────── */
function Empty({ icon: IconComp, text }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0", color: C.muted }}>
      <div style={{ opacity: 0.3, marginBottom: 12 }}><IconComp /></div>
      <span style={{ fontSize: 14 }}>{text}</span>
    </div>
  );
}

/* ── Backend Status Indicator ────────────────────────────────────────── */
function BackendStatusInner() {
  const heartbeat = useQuery(api.queries.getBackendHeartbeat);
  const [status, setStatus] = useState("unknown");

  useEffect(() => {
    if (heartbeat === undefined) { setStatus("unknown"); return; }
    if (heartbeat === null) { setStatus("offline"); return; }
    setStatus(Date.now() - heartbeat < 45000 ? "online" : "offline");
  }, [heartbeat]);

  const cfg = {
    online:  { color: "#10B981", label: "Backend Online" },
    offline: { color: "#EF4444", label: "Backend Offline" },
    unknown: { color: "#6B7280", label: "Checking..." },
  }[status];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, boxShadow: status === "online" ? `0 0 8px ${cfg.color}` : "none", transition: "all 0.3s ease" }} />
      <span style={{ color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>
    </div>
  );
}

function BackendStatus() {
  return (
    <ErrorBoundary fallback={
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.muted }} />
        <span style={{ color: C.muted, fontWeight: 500 }}>Status N/A</span>
      </div>
    }>
      <BackendStatusInner />
    </ErrorBoundary>
  );
}

/* ── Login ───────────────────────────────────────────────────────────── */
function Login({ onLogin }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const storedKey = useQuery(api.queries.getApiKey);

  const handleSubmit = async () => {
    if (!key.trim()) return;
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 300));
    if (key.trim() === storedKey) { localStorage.setItem(STORAGE_KEY, key.trim()); onLogin(key.trim()); }
    else setError("Invalid API key.");
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: C.surface }}>
      <div style={{ ...S.container, maxWidth: 400, width: "100%", animation: "fadeIn 0.2s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, background: C.text, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Icon.Lock /></div>
          <div>
            <div style={{ fontWeight: 300, fontSize: 20, letterSpacing: "-0.02em" }}>TG Bot Panel</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>Session Manager</div>
          </div>
        </div>
        <hr style={S.divider} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label="API Key" type="password" placeholder="Enter your access key" value={key}
            onChange={e => { setKey(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
          {error && <div style={{ fontSize: 13, color: C.error, display: "flex", alignItems: "center", gap: 6 }}><Icon.X />{error}</div>}
          <Btn variant="primary" style={{ width: "100%", justifyContent: "center" }} onClick={handleSubmit} disabled={loading || !key.trim()}>
            {loading ? <Spinner /> : <Icon.LogIn />}{loading ? "Verifying..." : "Continue"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ── Tab Nav ─────────────────────────────────────────────────────────── */
const TABS = [
  { id: "dashboard", label: "Dashboard", Icon: Icon.Dashboard },
  { id: "sessions",  label: "Sessions",  Icon: Icon.Users },
  { id: "add",       label: "Add Session", Icon: Icon.Plus },
  { id: "join",      label: "Join",      Icon: Icon.LogIn },
  { id: "joined",    label: "Joined",    Icon: Icon.List },
  { id: "leave",     label: "Leave All", Icon: Icon.LogOut },
];

function TabNav({ active, onChange }) {
  return (
    <div className="tab-nav" style={{ display: "flex", gap: 2, borderBottom: `1px solid ${C.border}`, marginBottom: 28, overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
      {TABS.map(({ id, label, Icon: I }) => {
        const isActive = id === active;
        return (
          <button key={id} onClick={() => onChange(id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 12px", fontSize: 13, fontWeight: isActive ? 500 : 400, color: isActive ? C.text : C.muted, background: "none", border: "none", borderBottom: `2px solid ${isActive ? C.accent : "transparent"}`, marginBottom: -1, cursor: "pointer", whiteSpace: "nowrap", transition: "color 0.15s ease, border-color 0.15s ease", flexShrink: 0 }}>
            <I /><span style={{ display: "inline" }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Dashboard Tab ───────────────────────────────────────────────────── */
function BackendStatusCard() {
  const heartbeat = useQuery(api.queries.getBackendHeartbeat);
  const backendAge = heartbeat ? Math.floor((Date.now() - heartbeat) / 1000) : null;
  const isOnline = backendAge !== null && backendAge < 45;
  return (
    <div style={{ padding: "20px 24px", background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 40, height: 40, background: isOnline ? "#D1FAE5" : heartbeat === undefined ? C.tertiary : "#FEE2E2", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: isOnline ? C.success : heartbeat === undefined ? C.muted : C.error, flexShrink: 0 }}>
          <Icon.Server />
        </div>
        <div>
          <div style={{ fontWeight: 500, fontSize: 14 }}>Backend Process (index.js)</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
            {heartbeat === undefined ? "Checking status..." : isOnline ? `Last heartbeat ${backendAge}s ago` : heartbeat === null ? "No heartbeat recorded — deploy and start index.js" : `Last seen ${backendAge}s ago — appears offline`}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8, background: isOnline ? "#D1FAE5" : heartbeat === undefined ? C.tertiary : "#FEE2E2", border: `1px solid ${isOnline ? "#A7F3D0" : heartbeat === undefined ? C.border : "#FCA5A5"}` }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: isOnline ? C.success : heartbeat === undefined ? C.muted : C.error, boxShadow: isOnline ? `0 0 8px ${C.success}` : "none" }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: isOnline ? C.success : heartbeat === undefined ? C.muted : C.error }}>
          {isOnline ? "Online" : heartbeat === undefined ? "Checking" : "Offline"}
        </span>
      </div>
    </div>
  );
}

function DashboardTab() {
  const sessions = useQuery(api.queries.getSessions) ?? [];
  const joined = useQuery(api.queries.getJoinedChannels) ?? [];

  const totalChannels = joined.length;
  const uniqueChannels = new Set(joined.map(j => j.channelLink)).size;
  const sessionCount = sessions.length;
  const avgChannels = sessionCount > 0 ? (totalChannels / sessionCount).toFixed(1) : "0";

  const stats = [
    { label: "Sessions",         value: sessionCount,    sub: "active accounts" },
    { label: "Total Joins",      value: totalChannels,   sub: "across all sessions" },
    { label: "Unique Channels",  value: uniqueChannels,  sub: "distinct channels" },
    { label: "Avg. per Session", value: avgChannels,     sub: "joins per account" },
  ];

  return (
    <div>
      <h2 style={{ fontWeight: 300, fontSize: 22, letterSpacing: "-0.02em", marginBottom: 4 }}>Dashboard</h2>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Overview of your bot activity</div>
      <hr style={S.divider} />

      <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {stats.map(({ label, value, sub }) => (
          <div key={label} style={{ padding: "18px 20px", background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <div style={{ ...S.mono, fontSize: 28, fontWeight: 400, color: C.text, lineHeight: 1 }}>{value}</div>
            <div style={{ ...S.label, marginTop: 6 }}>{label}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      <ErrorBoundary fallback={
        <div style={{ padding: "20px 24px", background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 24, fontSize: 13, color: C.muted }}>
          Backend status unavailable — run <code>npx convex dev</code> to deploy new functions.
        </div>
      }>
        <BackendStatusCard />
      </ErrorBoundary>

      {/* Sessions Quick View */}
      {sessions.length > 0 && (
        <>
          <div style={{ ...S.label, marginBottom: 12 }}>Sessions</div>
          <div className="card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {sessions.map(s => (
              <div key={s._id} style={{ padding: "14px 16px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, background: C.tertiary, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: C.text, flexShrink: 0 }}>
                  {s.name[0]?.toUpperCase() || "?"}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{joined.filter(j => j.sessionName === s.name).length} channels joined</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Sessions Tab ────────────────────────────────────────────────────── */
function SessionCard({ session, onDelete }) {
  const [confirm, setConfirm] = useState(false);
  const [hov, setHov] = useState(false);
  return (
    <div style={{ ...S.card, borderColor: hov ? C.accent : C.border, transform: hov ? "translateY(-1px)" : "none" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.name}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.muted }}><Icon.Phone />{session.phone}</div>
            {session.username !== "N/A" && <div style={{ fontSize: 13, color: C.muted }}>@{session.username}</div>}
          </div>
          <div style={{ marginTop: 10, ...S.label }}>Added {new Date(session.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {confirm ? (
            <>
              <Btn variant="danger" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => { onDelete(session.name); setConfirm(false); }}>Delete</Btn>
              <Btn style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => setConfirm(false)}>Cancel</Btn>
            </>
          ) : (
            <button onClick={() => setConfirm(true)} style={{ padding: 8, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s ease, border-color 0.15s ease" }}
              onMouseEnter={e => { e.currentTarget.style.color = C.error; e.currentTarget.style.borderColor = C.error; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}>
              <Icon.Trash />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionsTab({ showToast }) {
  const sessions = useQuery(api.queries.getSessions) ?? [];
  const createCommand = useMutation(api.mutations.createCommand);
  const handleDelete = async (name) => { await createCommand({ type: "delete_session", payload: { name } }); showToast(`Session "${name}" deleted`, "success"); };
  if (sessions === undefined) return <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner size={24} /></div>;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontWeight: 300, fontSize: 22, letterSpacing: "-0.02em" }}>Sessions</h2>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{sessions.length} account{sessions.length !== 1 ? "s" : ""}</div>
        </div>
      </div>
      <hr style={S.divider} />
      {sessions.length === 0
        ? <Empty icon={Icon.Users} text="No sessions yet. Add one from the Add Session tab." />
        : <div className="card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {sessions.map(s => <SessionCard key={s._id} session={s} onDelete={handleDelete} />)}
          </div>
      }
    </div>
  );
}

/* ── Add Session Tab ─────────────────────────────────────────────────── */
function AddSessionTab({ showToast }) {
  const [phone, setPhone] = useState("");
  const [flowId, setFlowId] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const createCommand = useMutation(api.mutations.createCommand);
  const createAuthFlow = useMutation(api.mutations.createAuthFlow);
  const flowData = useQuery(api.queries.getAuthFlow, flowId ? { flowId } : "skip");

  const handleStart = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    const id = crypto.randomUUID();
    await createAuthFlow({ flowId: id, phone: phone.trim() });
    await createCommand({ type: "auth_start", payload: { flowId: id, phone: phone.trim() } });
    setFlowId(id); setLoading(false);
  };
  const handleSubmit = async (value) => { setLoading(true); await createCommand({ type: "auth_submit", payload: { flowId, value } }); setCode(""); setPassword(""); setLoading(false); };
  const reset = () => { setFlowId(null); setPhone(""); setCode(""); setPassword(""); setLoading(false); };

  useEffect(() => {
    if (flowData?.step === "done") showToast(`Session "${flowData.sessionName}" created`, "success");
    if (flowData?.step === "error") showToast(flowData.error || "Session creation failed", "error");
  }, [flowData?.step]);

  const step = flowData?.step;
  const StepBadge = ({ n, label, active, done }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, background: done ? C.success : active ? C.accent : C.border, color: done || active ? "#fff" : C.muted, transition: "background 0.15s ease" }}>
        {done ? <Icon.Check /> : n}
      </div>
      <span style={{ fontSize: 13, fontWeight: active ? 500 : 400, color: active ? C.text : C.muted }}>{label}</span>
    </div>
  );
  const isConnecting = step === "phone" || step === "connecting";
  const isCode = step === "waiting_code";
  const isPassword = step === "waiting_password";
  const isDone = step === "done";
  const isError = step === "error";
  return (
    <div style={{ maxWidth: 480 }}>
      <h2 style={{ fontWeight: 300, fontSize: 22, letterSpacing: "-0.02em", marginBottom: 4 }}>Add Session</h2>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Add a Telegram account to the bot</div>
      <hr style={S.divider} />
      {flowId && (
        <div style={{ display: "flex", gap: 24, marginBottom: 24, padding: "16px 20px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, flexWrap: "wrap" }}>
          <StepBadge n="1" label="Phone" active={isConnecting} done={!isConnecting && !!flowId} />
          <StepBadge n="2" label="Code" active={isCode} done={!isCode && (isPassword || isDone)} />
          <StepBadge n="3" label="Done" active={isDone} done={false} />
        </div>
      )}
      {!flowId && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label="Phone Number" type="text" placeholder="+8801234567890" value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === "Enter" && handleStart()} />
          <Btn variant="primary" onClick={handleStart} disabled={loading || !phone.trim()}>{loading ? <Spinner /> : <Icon.Send />}{loading ? "Connecting..." : "Send Code"}</Btn>
        </div>
      )}
      {isConnecting && <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 20, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}><Spinner size={18} /><div><div style={{ fontSize: 14, fontWeight: 500 }}>Connecting to Telegram</div><div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Sending code to {phone}...</div></div></div>}
      {isCode && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}><div style={{ fontSize: 13, color: C.muted, padding: "10px 14px", background: C.surface, borderRadius: 8, border: `1px solid ${C.border}` }}>Code sent to <strong>{phone}</strong></div><Input label="Verification Code" type="text" placeholder="12345" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit(code)} /><Btn variant="primary" onClick={() => handleSubmit(code)} disabled={loading || !code.trim()}>{loading ? <Spinner /> : <Icon.Check />}Submit Code</Btn></div>}
      {isPassword && <div style={{ display: "flex", flexDirection: "column", gap: 16 }}><div style={{ fontSize: 13, color: C.muted, padding: "10px 14px", background: C.surface, borderRadius: 8, border: `1px solid ${C.border}` }}>Two-factor authentication required{flowData?.inputValue ? ` — hint: ${flowData.inputValue}` : ""}</div><Input label="2FA Password" type="password" placeholder="Your 2FA password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit(password)} /><Btn variant="primary" onClick={() => handleSubmit(password)} disabled={loading || !password.trim()}>{loading ? <Spinner /> : <Icon.Check />}Submit Password</Btn></div>}
      {isDone && <div style={{ padding: 24, background: C.surface, borderRadius: 12, border: `1px solid ${C.success}`, textAlign: "center" }}><div style={{ width: 40, height: 40, borderRadius: "50%", background: C.success, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", margin: "0 auto 12px" }}><Icon.Check /></div><div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>Session Created</div><div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>{flowData?.sessionName}</div><Btn onClick={reset} style={{ margin: "0 auto" }}>Add Another</Btn></div>}
      {isError && <div style={{ padding: 24, background: C.surface, borderRadius: 12, border: `1px solid ${C.error}`, textAlign: "center" }}><div style={{ width: 40, height: 40, borderRadius: "50%", background: C.error, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", margin: "0 auto 12px" }}><Icon.X /></div><div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>Failed</div><div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>{flowData?.error}</div><Btn onClick={reset} style={{ margin: "0 auto" }}>Try Again</Btn></div>}
    </div>
  );
}

/* ── Join Tab ────────────────────────────────────────────────────────── */
function JoinTab({ showToast }) {
  const sessions = useQuery(api.queries.getSessions) ?? [];
  const createCommand = useMutation(api.mutations.createCommand);
  const [link, setLink] = useState("");
  const [cmdId, setCmdId] = useState(null);
  const [loading, setLoading] = useState(false);
  const cmdData = useQuery(api.queries.getCommand, cmdId ? { id: cmdId } : "skip");
  useEffect(() => {
    if (cmdData?.status === "done") setLoading(false);
    if (cmdData?.status === "error") { setLoading(false); showToast("Join command failed", "error"); }
  }, [cmdData?.status]);
  const handleJoin = async () => { if (!link.trim()) return; setLoading(true); const id = await createCommand({ type: "join", payload: { link: link.trim() } }); setCmdId(id); };
  const reset = () => { setLink(""); setCmdId(null); setLoading(false); };
  const results = cmdData?.result?.results;
  const isDone = cmdData?.status === "done";
  return (
    <div style={{ maxWidth: 520 }}>
      <h2 style={{ fontWeight: 300, fontSize: 22, letterSpacing: "-0.02em", marginBottom: 4 }}>Join Channel</h2>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Join with all {sessions.length} session{sessions.length !== 1 ? "s" : ""}</div>
      <hr style={S.divider} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
        <Input label="Channel Link or Username" type="text" placeholder="https://t.me/channel or @channel" value={link} onChange={e => setLink(e.target.value)} disabled={loading} onKeyDown={e => e.key === "Enter" && !loading && handleJoin()} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn variant="primary" onClick={handleJoin} disabled={loading || !link.trim() || sessions.length === 0}>{loading ? <Spinner /> : <Icon.LogIn />}{loading ? "Joining..." : "Join"}</Btn>
          {isDone && <Btn onClick={reset}><Icon.Plus />New</Btn>}
        </div>
      </div>
      {isDone && results && (
        <>
          <hr style={S.divider} />
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={S.label}>Results</span>
            <span style={{ fontSize: 13, color: C.muted }}>{cmdData.result.successCount}/{cmdData.result.total} succeeded</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {results.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.surface, borderRadius: 8, border: `1px solid ${r.success ? C.success : C.error}`, fontSize: 13 }}>
                <div style={{ color: r.success ? C.success : C.error }}>{r.success ? <Icon.Check /> : <Icon.X />}</div>
                <span style={{ fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.session}</span>
                {!r.success && <span style={{ color: C.muted, fontSize: 12 }}>{r.error}</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Joined Tab ──────────────────────────────────────────────────────── */
function JoinedTab() {
  const joined = useQuery(api.queries.getJoinedChannels) ?? [];
  const grouped = {};
  for (const j of joined) { if (!grouped[j.sessionName]) grouped[j.sessionName] = []; grouped[j.sessionName].push(j.channelLink); }
  const [expanded, setExpanded] = useState({});
  const toggle = (name) => setExpanded(p => ({ ...p, [name]: !p[name] }));
  if (joined === undefined) return <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner size={24} /></div>;
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontWeight: 300, fontSize: 22, letterSpacing: "-0.02em" }}>Joined Channels</h2>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{joined.length} total across {Object.keys(grouped).length} sessions</div>
      </div>
      <hr style={S.divider} />
      {joined.length === 0
        ? <Empty icon={Icon.List} text="No joined channels tracked yet." />
        : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(grouped).map(([session, channels]) => {
              const isOpen = expanded[session] !== false;
              return (
                <div key={session} style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                  <button onClick={() => toggle(session)} style={{ width: "100%", padding: "14px 18px", background: C.surface, border: "none", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "background 0.15s ease" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.tertiary}
                    onMouseLeave={e => e.currentTarget.style.background = C.surface}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{session}</span>
                      <span style={{ ...S.label, background: C.tertiary, padding: "2px 8px", borderRadius: 4 }}>{channels.length}</span>
                    </div>
                    <div style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }}><Icon.ChevronDown /></div>
                  </button>
                  {isOpen && <div style={{ borderTop: `1px solid ${C.border}` }}>
                    {channels.map((ch, i) => (
                      <div key={i} style={{ padding: "10px 18px", fontSize: 13, ...S.mono, color: C.text, borderBottom: i < channels.length - 1 ? `1px solid ${C.border}` : "none", background: C.bg, wordBreak: "break-all" }}>{ch}</div>
                    ))}
                  </div>}
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}

/* ── Leave All Tab ───────────────────────────────────────────────────── */
function LeaveAllTab({ showToast }) {
  const joined = useQuery(api.queries.getJoinedChannels) ?? [];
  const sessions = useQuery(api.queries.getSessions) ?? [];
  const createCommand = useMutation(api.mutations.createCommand);
  const [cmdId, setCmdId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const cmdData = useQuery(api.queries.getCommand, cmdId ? { id: cmdId } : "skip");
  useEffect(() => {
    if (cmdData?.status === "done") { setLoading(false); showToast("All channels left", "success"); }
    if (cmdData?.status === "error") { setLoading(false); showToast("Leave all failed", "error"); }
  }, [cmdData?.status]);
  const handleLeaveAll = async () => { setLoading(true); const id = await createCommand({ type: "leave_all", payload: {} }); setCmdId(id); setConfirmed(false); };
  const reset = () => { setCmdId(null); setLoading(false); setConfirmed(false); };
  const isDone = cmdData?.status === "done";
  return (
    <div style={{ maxWidth: 480 }}>
      <h2 style={{ fontWeight: 300, fontSize: 22, letterSpacing: "-0.02em", marginBottom: 4 }}>Leave All Channels</h2>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Remove all sessions from every tracked channel</div>
      <hr style={S.divider} />
      <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[{ label: "Sessions", value: sessions.length }, { label: "Tracked Channels", value: joined.length }].map(({ label, value }) => (
          <div key={label} style={{ padding: "16px 20px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <div style={{ ...S.mono, fontSize: 28, fontWeight: 400, color: C.text }}>{value}</div>
            <div style={{ ...S.label, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
      {!isDone && (
        !confirmed
          ? <Btn variant="danger" style={{ width: "100%", justifyContent: "center" }} onClick={() => setConfirmed(true)} disabled={joined.length === 0 || loading}><Icon.LogOut />Leave All Channels</Btn>
          : <div style={{ padding: 20, background: "#FEF2F2", borderRadius: 10, border: `1px solid ${C.error}` }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, color: C.error }}>Are you sure?</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>This will leave {joined.length} channel{joined.length !== 1 ? "s" : ""} across {sessions.length} session{sessions.length !== 1 ? "s" : ""}. This cannot be undone.</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn variant="danger" onClick={handleLeaveAll} disabled={loading}>{loading ? <Spinner /> : <Icon.LogOut />}{loading ? "Processing..." : "Confirm"}</Btn>
                <Btn onClick={() => setConfirmed(false)} disabled={loading}>Cancel</Btn>
              </div>
            </div>
      )}
      {isDone && (
        <div style={{ padding: 20, background: C.surface, borderRadius: 10, border: `1px solid ${C.success}`, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.success, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}><Icon.Check /></div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>Complete</div><div style={{ fontSize: 13, color: C.muted }}>All tracked channels have been left.</div></div>
          <Btn onClick={reset} style={{ flexShrink: 0 }}>Done</Btn>
        </div>
      )}
    </div>
  );
}

/* ── Main App ────────────────────────────────────────────────────────── */
function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [tab, setTab] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type) => setToast({ message, type }), []);
  const logout = () => { localStorage.removeItem(STORAGE_KEY); setApiKey(null); };
  if (!apiKey) return <Login onLogin={setApiKey} />;
  return (
    <div className="main-container" style={{ minHeight: "100vh", padding: "24px 16px 64px", background: C.surface }}>
      <div style={{ ...S.container }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: C.text, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
              <Icon.Activity />
            </div>
            <div>
              <div style={{ fontWeight: 300, fontSize: 20, letterSpacing: "-0.02em" }}>TG Bot Panel</div>
              <div style={{ fontSize: 12, color: C.muted }}>Session Manager</div>
            </div>
          </div>
          <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <BackendStatus />
            <Btn onClick={logout} style={{ padding: "6px 12px", fontSize: 13 }}>
              <Icon.LogOut /><span className="logout-label">Logout</span>
            </Btn>
          </div>
        </div>
        <hr style={S.divider} />
        <TabNav active={tab} onChange={setTab} />
        {tab === "dashboard" && <DashboardTab />}
        {tab === "sessions"  && <SessionsTab showToast={showToast} />}
        {tab === "add"       && <AddSessionTab showToast={showToast} />}
        {tab === "join"      && <JoinTab showToast={showToast} />}
        {tab === "joined"    && <JoinedTab />}
        {tab === "leave"     && <LeaveAllTab showToast={showToast} />}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}

/* ── Root ────────────────────────────────────────────────────────────── */
export default function Root() {
  return (
    <>
      <style>{globalStyles}</style>
      <ErrorBoundary fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F9FAFB", padding: 24 }}>
          <div style={{ maxWidth: 400, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontWeight: 500, fontSize: 16, marginBottom: 8 }}>Something went wrong</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
              A component crashed. This can happen if new Convex functions haven't been deployed yet.
              Run <code style={{ background: "#F3F4F6", padding: "2px 6px", borderRadius: 4 }}>npx convex dev</code> in the project root, then refresh.
            </div>
            <button onClick={() => window.location.reload()} style={{ padding: "10px 20px", background: "#101827", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>
              Reload Page
            </button>
          </div>
        </div>
      }>
        <ConvexProvider client={convex}><App /></ConvexProvider>
      </ErrorBoundary>
    </>
  );
}
