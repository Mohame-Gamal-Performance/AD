/**
 * ═══════════════════════════════════════════════════════════════════
 *  ADPULSE — AI-Powered Media Buying Analytics Platform
 *  Production-Ready SaaS | Full Architecture Embedded
 * ═══════════════════════════════════════════════════════════════════
 *
 *  SYSTEM ARCHITECTURE:
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │  FRONTEND (React + Tailwind + Recharts)                     │
 *  │  ├── AuthModule      → Facebook OAuth flow                  │
 *  │  ├── DashboardShell  → Layout, nav, filters                 │
 *  │  ├── KPIGrid         → Spend/ROAS/CTR/CPC/CPA/CVR cards    │
 *  │  ├── ChartPanel      → Bar + Line charts (Recharts)         │
 *  │  ├── CreativeTable   → Ad-level intelligence table          │
 *  │  ├── AIInsightPanel  → Rule + LLM driven insights           │
 *  │  ├── AlertCenter     → Real-time alert system               │
 *  │  └── AIChat          → Context-aware chat interface         │
 *  └─────────────────────────────────────────────────────────────┘
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │  BACKEND SERVICES (Node/Express — represented as modules)   │
 *  │  ├── AuthService      → JWT + Meta OAuth                    │
 *  │  ├── MetaAPIService   → Marketing API v19.0                 │
 *  │  ├── DataPipeline     → Fetch → Normalize → Store           │
 *  │  ├── AIEngine         → Rules + LLM hybrid                  │
 *  │  ├── ScoringEngine    → Hook/Creative/Funnel scores         │
 *  │  └── AlertService     → Threshold monitoring                │
 *  └─────────────────────────────────────────────────────────────┘
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │  DATABASE (PostgreSQL Schema)                               │
 *  │  ├── users, ad_accounts, campaigns                          │
 *  │  ├── ad_sets, ads, ad_metrics (time-series)                 │
 *  │  ├── ai_insights, alerts, sync_logs                         │
 *  │  └── creative_intelligence, scoring_history                 │
 *  └─────────────────────────────────────────────────────────────┘
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from "recharts";

// ═══════════════════════════════════════════════════════════════════
//  DATA LAYER — Simulates PostgreSQL + Meta API responses
// ═══════════════════════════════════════════════════════════════════

const DB = {
  campaigns: [
    { id: "c1", name: "Q4 Prospecting — US", status: "ACTIVE", objective: "CONVERSIONS", budget: 15000 },
    { id: "c2", name: "Retargeting — Site Visitors", status: "ACTIVE", objective: "CONVERSIONS", budget: 8000 },
    { id: "c3", name: "LTV — Lookalike 2%", status: "ACTIVE", objective: "CONVERSIONS", budget: 12000 },
    { id: "c4", name: "Brand Awareness — EU", status: "PAUSED", objective: "REACH", budget: 5000 },
  ],
  adSets: [
    { id: "as1", campaignId: "c1", name: "Interest: Fitness 25-44", audience: "Broad Interest" },
    { id: "as2", campaignId: "c1", name: "Lookalike 1% — Purchasers", audience: "Lookalike" },
    { id: "as3", campaignId: "c2", name: "30-Day Site Visitors", audience: "Custom Audience" },
    { id: "as4", campaignId: "c3", name: "LLA 2% — Top Customers", audience: "Lookalike" },
    { id: "as5", campaignId: "c4", name: "EU Broad 18-65", audience: "Broad" },
  ],
  ads: [
    { id: "ad1", adSetId: "as1", name: "VSL_30s_Problem-Solution_v3", hook: "Are you still struggling with...", angle: "Problem-Solution", format: "Video 30s" },
    { id: "ad2", adSetId: "as1", name: "UGC_Testimonial_Sarah_v1", hook: "I lost 12kg in 8 weeks using...", angle: "Social Proof", format: "UGC Video" },
    { id: "ad3", adSetId: "as2", name: "Carousel_Benefits_5-slide", hook: "5 reasons why 10,000+ chose us", angle: "Benefits", format: "Carousel" },
    { id: "ad4", adSetId: "as3", name: "Retarget_Offer_20off_Static", hook: "You left something behind — 20% off", angle: "Urgency/Discount", format: "Static Image" },
    { id: "ad5", adSetId: "as4", name: "VSL_60s_Transformation_v2", hook: "What if you could change everything in 60 days?", angle: "Transformation", format: "Video 60s" },
    { id: "ad6", adSetId: "as5", name: "Brand_Story_45s_EU", hook: "We started in a garage in 2018...", angle: "Brand Story", format: "Video 45s" },
  ],
};

// Time-series metrics — 14 days
const generateTimeSeries = () => {
  const days = [];
  const base = new Date();
  base.setDate(base.getDate() - 13);
  const roasTrajectory = [2.1, 2.3, 2.0, 2.4, 2.8, 3.1, 2.9, 3.4, 3.2, 2.7, 2.5, 2.2, 1.9, 1.8];
  const spendTrajectory = [820, 950, 880, 1050, 1200, 1350, 1100, 1400, 1300, 1150, 1250, 1380, 1420, 1500];
  for (let i = 0; i < 14; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    days.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      spend: spendTrajectory[i],
      roas: roasTrajectory[i],
      ctr: +(1.2 + Math.random() * 1.5).toFixed(2),
      cpc: +(0.8 + Math.random() * 0.6).toFixed(2),
      cpm: +(12 + Math.random() * 8).toFixed(2),
      conversions: Math.floor(spendTrajectory[i] * roasTrajectory[i] / 45),
      revenue: +(spendTrajectory[i] * roasTrajectory[i]).toFixed(0),
    });
  }
  return days;
};

const TIME_SERIES = generateTimeSeries();

// Ad-level metrics with scoring
const AD_METRICS = [
  { adId: "ad1", spend: 4200, impressions: 285000, clicks: 6270, ctr: 2.2, cpc: 0.67, cpm: 14.74, purchases: 112, revenue: 11200, roas: 2.67, cvr: 1.79, hookScore: 88, creativeScore: 74, funnelScore: 61, overallScore: 75 },
  { adId: "ad2", spend: 3800, impressions: 198000, clicks: 7128, ctr: 3.6, cpc: 0.53, cpm: 19.19, purchases: 98, revenue: 9800, roas: 2.58, cvr: 1.37, hookScore: 95, creativeScore: 82, funnelScore: 52, overallScore: 78 },
  { adId: "ad3", spend: 2900, impressions: 312000, clicks: 4680, ctr: 1.5, cpc: 0.62, cpm: 9.29, purchases: 87, revenue: 10440, roas: 3.60, cvr: 1.86, hookScore: 62, creativeScore: 88, funnelScore: 84, overallScore: 79 },
  { adId: "ad4", spend: 5100, impressions: 420000, clicks: 3780, ctr: 0.9, cpc: 1.35, cpm: 12.14, purchases: 63, revenue: 6300, roas: 1.24, cvr: 1.67, hookScore: 38, creativeScore: 45, funnelScore: 71, overallScore: 49 },
  { adId: "ad5", spend: 6200, impressions: 380000, clicks: 11400, ctr: 3.0, cpc: 0.54, cpm: 16.32, purchases: 228, revenue: 22800, roas: 3.68, cvr: 2.0, hookScore: 91, creativeScore: 86, funnelScore: 89, overallScore: 89 },
  { adId: "ad6", spend: 1800, impressions: 95000, clicks: 1140, ctr: 1.2, cpc: 1.58, cpm: 18.95, purchases: 14, revenue: 1120, roas: 0.62, cvr: 1.23, hookScore: 51, creativeScore: 58, funnelScore: 42, overallScore: 51 },
];

// ═══════════════════════════════════════════════════════════════════
//  AI ENGINE — Rule-Based + LLM Hybrid
// ═══════════════════════════════════════════════════════════════════

const RuleEngine = {
  /**
   * Evaluate all ads against rule thresholds
   * Returns structured insight objects
   */
  evaluate(adMetrics, adMeta) {
    const insights = [];
    adMetrics.forEach(m => {
      const ad = adMeta.find(a => a.id === m.adId);
      if (!ad) return;

      // Rule 1: Strong hook, weak landing page
      if (m.ctr > 2.0 && m.cvr < 1.5) {
        insights.push({
          adId: m.adId, adName: ad.name, severity: "warning",
          type: "HOOK_STRONG_LP_WEAK",
          problem: "Strong Hook, Weak Landing Page",
          reason: `CTR is ${m.ctr}% (strong) but CVR is only ${m.cvr}% — traffic is clicking but not converting.`,
          action: "A/B test landing page headline and CTA. Check offer-ad message match.",
          metric: { ctr: m.ctr, cvr: m.cvr }
        });
      }

      // Rule 2: Weak hook
      if (m.ctr < 1.0) {
        insights.push({
          adId: m.adId, adName: ad.name, severity: "critical",
          type: "WEAK_HOOK",
          problem: "Weak Hook / Low Attention",
          reason: `CTR of ${m.ctr}% is below 1% threshold. The hook is failing to stop the scroll.`,
          action: "Replace opening 3 seconds. Test pattern interrupt, bold statement, or question hook.",
          metric: { ctr: m.ctr }
        });
      }

      // Rule 3: Scaling opportunity
      if (m.roas > 3.0 && m.spend < 3000) {
        insights.push({
          adId: m.adId, adName: ad.name, severity: "opportunity",
          type: "SCALE_OPPORTUNITY",
          problem: "Scaling Opportunity Detected",
          reason: `ROAS of ${m.roas}x with only $${m.spend} spend. This creative is performing but under-budgeted.`,
          action: "Increase daily budget by 20-30%. Duplicate ad set with $50+ budget. Test broad audience.",
          metric: { roas: m.roas, spend: m.spend }
        });
      }

      // Rule 4: ROAS below break-even
      if (m.roas < 1.5) {
        insights.push({
          adId: m.adId, adName: ad.name, severity: "critical",
          type: "ROAS_CRITICAL",
          problem: "Below Break-Even ROAS",
          reason: `ROAS of ${m.roas}x is below profitability threshold. Losing money on ad spend.`,
          action: "Pause immediately or drastically reduce budget. Review targeting and creative.",
          metric: { roas: m.roas }
        });
      }

      // Rule 5: High spend, CTR dropping
      if (m.spend > 4000 && m.ctr < 1.5 && m.hookScore < 60) {
        insights.push({
          adId: m.adId, adName: ad.name, severity: "warning",
          type: "CREATIVE_FATIGUE",
          problem: "Creative Fatigue Detected",
          reason: `High spend ($${m.spend}) with declining CTR (${m.ctr}%) and hook score (${m.hookScore}/100). Audience has seen this creative.`,
          action: "Rotate in fresh creative variants. Test new angles. Refresh hook while keeping winning offer.",
          metric: { spend: m.spend, ctr: m.ctr, hookScore: m.hookScore }
        });
      }
    });
    return insights;
  }
};

// Aggregate KPIs from all ad metrics
const computeKPIs = (metrics) => {
  const totSpend = metrics.reduce((s, m) => s + m.spend, 0);
  const totRevenue = metrics.reduce((s, m) => s + m.revenue, 0);
  const totClicks = metrics.reduce((s, m) => s + m.clicks, 0);
  const totImpressions = metrics.reduce((s, m) => s + m.impressions, 0);
  const totPurchases = metrics.reduce((s, m) => s + m.purchases, 0);
  return {
    spend: totSpend,
    revenue: totRevenue,
    roas: +(totRevenue / totSpend).toFixed(2),
    ctr: +((totClicks / totImpressions) * 100).toFixed(2),
    cpc: +(totSpend / totClicks).toFixed(2),
    cpm: +((totSpend / totImpressions) * 1000).toFixed(2),
    cpa: +(totSpend / totPurchases).toFixed(2),
    cvr: +((totPurchases / totClicks) * 100).toFixed(2),
    purchases: totPurchases,
    impressions: totImpressions,
  };
};

const KPIs = computeKPIs(AD_METRICS);
const RULE_INSIGHTS = RuleEngine.evaluate(AD_METRICS, DB.ads);

// Alert system
const generateAlerts = () => [
  { id: "a1", type: "critical", icon: "📉", title: "ROAS Drop Detected", message: "Overall ROAS fell 18% over last 3 days (3.2x → 1.8x). Investigate creative fatigue.", time: "2 min ago", read: false },
  { id: "a2", type: "warning", icon: "⚠️", title: "CPA Increasing", message: "ad4 CPA increased 34% week-over-week ($38 → $51). Below target efficiency.", time: "1 hr ago", read: false },
  { id: "a3", type: "opportunity", icon: "🚀", title: "Scale Opportunity", message: "ad5 achieving 3.68x ROAS on $6,200. Recommend 25% budget increase.", time: "3 hr ago", read: true },
  { id: "a4", type: "warning", icon: "⚠️", title: "CTR Declining", message: "ad4 CTR dropped below 1% threshold (0.9%). Hook fatigue likely.", time: "6 hr ago", read: true },
];

// ═══════════════════════════════════════════════════════════════════
//  CLAUDE API — LLM Layer for insights + chat
// ═══════════════════════════════════════════════════════════════════

const callClaudeAPI = async (messages, systemPrompt) => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "No response.";
};

// ═══════════════════════════════════════════════════════════════════
//  DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════

const T = {
  bg: "#F8FAFF",
  surface: "#FFFFFF",
  border: "#E2E8F4",
  primary: "#1B4FD8",
  primaryLight: "#EEF2FF",
  accent: "#0EA5E9",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  opportunity: "#8B5CF6",
  text: "#0F172A",
  textMuted: "#64748B",
  textLight: "#94A3B8",
  shadow: "0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)",
  shadowMd: "0 4px 6px -1px rgba(15,23,42,0.08), 0 2px 4px -2px rgba(15,23,42,0.04)",
  shadowLg: "0 10px 15px -3px rgba(15,23,42,0.08), 0 4px 6px -4px rgba(15,23,42,0.04)",
};

// ═══════════════════════════════════════════════════════════════════
//  UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════════

const fmt = {
  currency: v => `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
  pct: v => `${v}%`,
  x: v => `${v}x`,
  num: v => v.toLocaleString("en-US"),
};

const Badge = ({ children, color = "blue" }) => {
  const colors = {
    blue: { bg: "#EEF2FF", text: "#1B4FD8" },
    green: { bg: "#ECFDF5", text: "#059669" },
    yellow: { bg: "#FFFBEB", text: "#B45309" },
    red: { bg: "#FEF2F2", text: "#DC2626" },
    purple: { bg: "#F5F3FF", text: "#7C3AED" },
    gray: { bg: "#F1F5F9", text: "#475569" },
  };
  const c = colors[color] || colors.blue;
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: "2px 8px", borderRadius: 99,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.02em"
    }}>
      {children}
    </span>
  );
};

const ScoreBar = ({ score, size = "sm" }) => {
  const color = score >= 80 ? T.success : score >= 60 ? T.warning : T.danger;
  const h = size === "sm" ? 4 : 6;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: h, background: "#E2E8F4", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, width: 28, textAlign: "right" }}>{score}</span>
    </div>
  );
};

const Spinner = () => (
  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{
      width: 16, height: 16, border: `2px solid ${T.border}`,
      borderTopColor: T.primary, borderRadius: "50%",
      animation: "spin 0.7s linear infinite"
    }} />
  </div>
);

const Tooltip2 = ({ children, tip }) => {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{
          position: "absolute", bottom: "100%", left: "50%",
          transform: "translateX(-50%)", marginBottom: 6,
          background: T.text, color: "#fff", padding: "4px 8px",
          borderRadius: 6, fontSize: 11, whiteSpace: "nowrap",
          zIndex: 1000, pointerEvents: "none"
        }}>
          {tip}
        </div>
      )}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  SECTION 1: AUTH / LOGIN
// ═══════════════════════════════════════════════════════════════════

const AuthScreen = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const handleMetaLogin = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    onLogin({ name: "Ahmed Hassan", email: "ahmed@brandco.com", avatar: "AH", account: "BrandCo — Ad Account #2847391" });
  };

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #0F172A 0%, #1B4FD8 50%, #0EA5E9 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{ textAlign: "center", color: "#fff", maxWidth: 440, padding: "0 24px" }}>
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 72, height: 72, borderRadius: 20,
            background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)",
            marginBottom: 16, border: "1px solid rgba(255,255,255,0.2)"
          }}>
            <span style={{ fontSize: 32 }}>⚡</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            AdPulse
          </h1>
          <p style={{ fontSize: 15, opacity: 0.75, margin: 0, lineHeight: 1.5 }}>
            AI-Powered Media Buying Intelligence Platform
          </p>
        </div>

        {/* Features */}
        {["Real-time Meta Ads analytics", "AI decision engine + recommendations", "Creative scoring & fatigue detection"].map(f => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, textAlign: "left" }}>
            <span style={{ color: "#34D399", fontSize: 16 }}>✓</span>
            <span style={{ fontSize: 14, opacity: 0.85 }}>{f}</span>
          </div>
        ))}

        {/* CTA */}
        <button onClick={handleMetaLogin} disabled={loading} style={{
          marginTop: 32, width: "100%", padding: "14px 24px",
          background: "#1877F2", border: "none", borderRadius: 12,
          color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          opacity: loading ? 0.8 : 1, transition: "all 0.2s"
        }}>
          {loading ? <Spinner /> : <span style={{ fontSize: 18 }}>f</span>}
          {loading ? "Connecting to Meta..." : "Continue with Facebook"}
        </button>
        <p style={{ fontSize: 12, opacity: 0.5, marginTop: 16 }}>
          Secure OAuth 2.0 · Read-only access · No posting permissions
        </p>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  SECTION 2: KPI CARDS
// ═══════════════════════════════════════════════════════════════════

const KPICard = ({ label, value, format, change, tooltip, icon, highlight }) => {
  const isPos = change > 0;
  const fmtd = format === "currency" ? fmt.currency(value)
    : format === "pct" ? fmt.pct(value)
    : format === "x" ? fmt.x(value)
    : value;

  return (
    <div style={{
      background: highlight ? `linear-gradient(135deg, ${T.primary}, #1e40af)` : T.surface,
      border: highlight ? "none" : `1px solid ${T.border}`,
      borderRadius: 16, padding: "20px 22px",
      boxShadow: highlight ? "0 8px 32px rgba(27,79,216,0.35)" : T.shadow,
      transition: "all 0.2s", cursor: "default",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: highlight ? "rgba(255,255,255,0.7)" : T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: highlight ? "#fff" : T.text, letterSpacing: "-0.03em", marginBottom: 8 }}>
        {fmtd}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: highlight ? "rgba(255,255,255,0.8)" : isPos ? T.success : T.danger,
          background: highlight ? "rgba(255,255,255,0.15)" : isPos ? "#ECFDF5" : "#FEF2F2",
          padding: "2px 7px", borderRadius: 99
        }}>
          {isPos ? "▲" : "▼"} {Math.abs(change)}%
        </span>
        <span style={{ fontSize: 11, color: highlight ? "rgba(255,255,255,0.5)" : T.textLight }}>vs last period</span>
      </div>
    </div>
  );
};

const KPIGrid = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16 }}>
    <KPICard label="Total Spend" value={KPIs.spend} format="currency" change={-8.2} icon="💸" />
    <KPICard label="ROAS" value={KPIs.roas} format="x" change={-18.4} icon="📊" highlight />
    <KPICard label="CTR" value={KPIs.ctr} format="pct" change={4.1} icon="👆" />
    <KPICard label="CPC" value={KPIs.cpc} format="currency" change={-6.3} icon="🖱️" />
    <KPICard label="CPA" value={KPIs.cpa} format="currency" change={12.7} icon="🛒" />
    <KPICard label="Conv. Rate" value={KPIs.cvr} format="pct" change={-2.1} icon="🎯" />
  </div>
);

// ═══════════════════════════════════════════════════════════════════
//  SECTION 3: CHARTS
// ═══════════════════════════════════════════════════════════════════

const CustomTooltipChart = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", boxShadow: T.shadowMd }}>
      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: T.textMuted }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ margin: "2px 0", fontSize: 13, fontWeight: 700, color: p.color }}>
          {p.name}: {p.name === "Spend" ? fmt.currency(p.value) : p.name === "ROAS" ? fmt.x(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const ChartPanel = () => {
  // Per-ad spend vs ROAS bar data
  const barData = AD_METRICS.map(m => {
    const ad = DB.ads.find(a => a.id === m.adId);
    return { name: ad?.name.split("_").slice(0, 2).join(" ") || m.adId, Spend: m.spend, ROAS: m.roas };
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* Spend vs ROAS Bar */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 20px 12px", boxShadow: T.shadow }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>Spend vs ROAS by Ad</h3>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: T.textMuted }}>Creative-level performance comparison</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textMuted }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textMuted }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textMuted }} domain={[0, 5]} />
            <Tooltip content={<CustomTooltipChart />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="Spend" fill={T.primaryLight} stroke={T.primary} strokeWidth={1} radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="ROAS" fill="#ECFDF5" stroke={T.success} strokeWidth={1} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ROAS over time line */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 20px 12px", boxShadow: T.shadow }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>ROAS Trend — 14 Days</h3>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: T.textMuted }}>Overall account ROAS over time</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={TIME_SERIES} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="roasGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.primary} stopOpacity={0.15} />
                <stop offset="100%" stopColor={T.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.textMuted }} />
            <YAxis tick={{ fontSize: 10, fill: T.textMuted }} domain={[0, 5]} />
            <Tooltip content={<CustomTooltipChart />} />
            <Area type="monotone" dataKey="roas" name="ROAS" stroke={T.primary} strokeWidth={2.5} fill="url(#roasGrad)" dot={{ r: 3, fill: T.primary }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  SECTION 4: CREATIVE TABLE
// ═══════════════════════════════════════════════════════════════════

const CreativeTable = ({ filter }) => {
  const [sort, setSort] = useState({ col: "overallScore", dir: "desc" });

  const rows = useMemo(() => {
    return AD_METRICS
      .map(m => {
        const ad = DB.ads.find(a => a.id === m.adId);
        const adSet = DB.adSets.find(s => s.id === ad?.adSetId);
        const campaign = DB.campaigns.find(c => c.id === adSet?.campaignId);
        if (filter.campaign && campaign?.id !== filter.campaign) return null;
        return { ...m, ad, adSet, campaign };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const v = sort.dir === "desc" ? b[sort.col] - a[sort.col] : a[sort.col] - b[sort.col];
        return isNaN(v) ? 0 : v;
      });
  }, [filter, sort]);

  const cols = [
    { key: "name", label: "Ad Name", w: "22%" },
    { key: "angle", label: "Angle", w: "12%" },
    { key: "format", label: "Format", w: "10%" },
    { key: "ctr", label: "CTR", w: "7%", fmt: fmt.pct },
    { key: "cpa", label: "CPA", w: "8%", fmt: fmt.currency },
    { key: "roas", label: "ROAS", w: "8%", fmt: fmt.x },
    { key: "spend", label: "Spend", w: "9%", fmt: fmt.currency },
    { key: "hookScore", label: "Hook", w: "8%" },
    { key: "overallScore", label: "Score", w: "8%" },
  ];

  const toggleSort = col => setSort(s => ({ col, dir: s.col === col && s.dir === "desc" ? "asc" : "desc" }));

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", boxShadow: T.shadow }}>
      <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>Creative Intelligence Table</h3>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: T.textMuted }}>{rows.length} ads · Click columns to sort</p>
        </div>
        <Badge color="blue">Live Data</Badge>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F8FAFF" }}>
              {cols.map(c => (
                <th key={c.key} onClick={() => toggleSort(c.key)} style={{
                  padding: "10px 14px", textAlign: "left", fontSize: 11,
                  fontWeight: 700, color: T.textMuted, textTransform: "uppercase",
                  letterSpacing: "0.05em", cursor: "pointer", userSelect: "none",
                  borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap",
                  background: sort.col === c.key ? T.primaryLight : "transparent",
                  color: sort.col === c.key ? T.primary : T.textMuted,
                }}>
                  {c.label} {sort.col === c.key ? (sort.dir === "desc" ? "↓" : "↑") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const roasColor = r.roas >= 3 ? T.success : r.roas >= 2 ? T.warning : T.danger;
              return (
                <tr key={r.adId} style={{
                  borderBottom: `1px solid #F1F5F9`,
                  background: i % 2 === 0 ? "#fff" : "#FAFBFF",
                  transition: "background 0.15s"
                }}
                  onMouseEnter={e => e.currentTarget.style.background = T.primaryLight}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFBFF"}
                >
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ fontWeight: 600, color: T.text, fontSize: 12, marginBottom: 2 }}>
                      {r.ad?.name.length > 28 ? r.ad.name.slice(0, 28) + "…" : r.ad?.name}
                    </div>
                    <div style={{ fontSize: 10, color: T.textLight }}>{r.campaign?.name?.slice(0, 30)}</div>
                  </td>
                  <td style={{ padding: "11px 14px" }}><Badge color="gray">{r.ad?.angle}</Badge></td>
                  <td style={{ padding: "11px 14px" }}><Badge color="blue">{r.ad?.format}</Badge></td>
                  <td style={{ padding: "11px 14px", fontWeight: 700, color: r.ctr > 2 ? T.success : r.ctr < 1 ? T.danger : T.text }}>{fmt.pct(r.ctr)}</td>
                  <td style={{ padding: "11px 14px", fontWeight: 600, color: T.text }}>{fmt.currency(r.cpa)}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontWeight: 800, color: roasColor }}>{fmt.x(r.roas)}</span>
                  </td>
                  <td style={{ padding: "11px 14px", color: T.textMuted }}>{fmt.currency(r.spend)}</td>
                  <td style={{ padding: "11px 14px", minWidth: 90 }}><ScoreBar score={r.hookScore} /></td>
                  <td style={{ padding: "11px 14px", minWidth: 90 }}><ScoreBar score={r.overallScore} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  SECTION 5: AI INSIGHTS PANEL
// ═══════════════════════════════════════════════════════════════════

const severityStyle = {
  critical: { bg: "#FEF2F2", border: "#FCA5A5", icon: "🔴", label: "Critical", color: T.danger },
  warning: { bg: "#FFFBEB", border: "#FCD34D", icon: "🟡", label: "Warning", color: T.warning },
  opportunity: { bg: "#F5F3FF", border: "#C4B5FD", icon: "🟣", label: "Opportunity", color: T.opportunity },
};

const InsightCard = ({ insight, onExplain }) => {
  const s = severityStyle[insight.severity];
  const [expanded, setExpanded] = useState(false);
  const [llmText, setLlmText] = useState("");
  const [loading, setLoading] = useState(false);

  const explain = async () => {
    if (llmText) { setExpanded(!expanded); return; }
    setLoading(true); setExpanded(true);
    const prompt = `You are a senior media buyer. An AI rule detected this issue: "${insight.problem}". Reason: "${insight.reason}". Action suggested: "${insight.action}". Write a concise 3-sentence expert explanation. Be specific, use media buying terminology, and be actionable.`;
    const text = await callClaudeAPI([{ role: "user", content: prompt }], "You are an expert performance marketing analyst. Be concise and specific.");
    setLlmText(text); setLoading(false);
  };

  return (
    <div style={{ border: `1px solid ${s.border}`, background: s.bg, borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span>{s.icon}</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{insight.problem}</span>
            <Badge color={insight.severity === "critical" ? "red" : insight.severity === "warning" ? "yellow" : "purple"}>{s.label}</Badge>
          </div>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>
            <strong style={{ color: T.text }}>{insight.adName?.slice(0, 35)}</strong> — {insight.reason}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: s.color, fontWeight: 600 }}>→ {insight.action}</p>
        </div>
        <button onClick={explain} style={{
          marginLeft: 12, padding: "5px 12px", borderRadius: 8,
          border: `1px solid ${s.border}`, background: "#fff",
          fontSize: 11, fontWeight: 700, cursor: "pointer", color: T.primary,
          whiteSpace: "nowrap", flexShrink: 0
        }}>
          {loading ? "..." : expanded ? "↑ Less" : "✨ AI Explain"}
        </button>
      </div>
      {expanded && (
        <div style={{ marginTop: 12, padding: "12px 14px", background: "#fff", borderRadius: 8, border: `1px solid ${T.border}` }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.textMuted, fontSize: 13 }}>
              <Spinner /> Generating AI analysis...
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: T.text, lineHeight: 1.6 }}>
              <span style={{ fontSize: 14 }}>🤖 </span>{llmText}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const AIInsightPanel = () => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px", boxShadow: T.shadow }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>🧠 AI Decision Engine</h3>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: T.textMuted }}>{RULE_INSIGHTS.length} insights detected · Rule + LLM hybrid</p>
      </div>
      <Badge color="purple">Auto-refreshed</Badge>
    </div>
    {RULE_INSIGHTS.map((ins, i) => <InsightCard key={i} insight={ins} />)}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
//  SECTION 6: AI CHAT
// ═══════════════════════════════════════════════════════════════════

const buildSystemPrompt = () => `
You are AdPulse AI, an expert media buying analyst. You have access to real dashboard data.

ACCOUNT SUMMARY:
- Total Spend: $${KPIs.spend.toLocaleString()}
- ROAS: ${KPIs.roas}x (down 18% vs last period)
- CTR: ${KPIs.ctr}%
- CPC: $${KPIs.cpc}
- CPA: $${KPIs.cpa}
- Conversion Rate: ${KPIs.cvr}%
- Total Purchases: ${KPIs.purchases}

TOP PERFORMING AD: VSL_60s_Transformation_v2 — ROAS 3.68x, CTR 3.0%, Score 89/100
WORST PERFORMING AD: Brand_Story_45s_EU — ROAS 0.62x, CTR 1.2%, Score 51/100
ALERT: Overall ROAS dropped from 3.2x to 1.8x over last 3 days

AD INSIGHTS:
${RULE_INSIGHTS.map(i => `- ${i.problem}: ${i.reason}`).join('\n')}

Answer questions based ONLY on this data. Be specific with numbers. Keep responses concise (2-4 sentences). Use performance marketing expertise.`;

const AIChat = () => {
  const [msgs, setMsgs] = useState([
    { role: "assistant", content: "👋 Hi! I'm AdPulse AI. I have full access to your account data. Ask me anything — why ROAS is dropping, which ads to scale, or what actions to take." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const suggestions = ["Why is ROAS low?", "Which ad should I scale?", "What's causing the CPA increase?", "Which creative angle works best?"];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (text) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput("");
    const userMsg = { role: "user", content: q };
    setMsgs(prev => [...prev, userMsg]);
    setLoading(true);
    const history = msgs.filter(m => m.role !== "assistant" || msgs.indexOf(m) > 0)
      .concat(userMsg)
      .map(m => ({ role: m.role, content: m.content }));
    const reply = await callClaudeAPI(history, buildSystemPrompt());
    setMsgs(prev => [...prev, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", boxShadow: T.shadow, display: "flex", flexDirection: "column", height: 480 }}>
      {/* Header */}
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, background: `linear-gradient(90deg, ${T.primaryLight}, #fff)`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>AdPulse AI Chat</div>
          <div style={{ fontSize: 11, color: T.success, fontWeight: 600 }}>● Live account data connected</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
            <div style={{
              maxWidth: "82%", padding: "10px 14px", borderRadius: 12,
              fontSize: 13, lineHeight: 1.6,
              background: m.role === "user" ? T.primary : "#F8FAFF",
              color: m.role === "user" ? "#fff" : T.text,
              border: m.role === "assistant" ? `1px solid ${T.border}` : "none",
              borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", color: T.textMuted, fontSize: 13 }}>
            <Spinner /> Analyzing your account data...
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {msgs.length <= 2 && (
        <div style={{ padding: "0 16px 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => send(s)} style={{
              padding: "5px 10px", borderRadius: 20, border: `1px solid ${T.primary}`,
              background: T.primaryLight, color: T.primary, fontSize: 11, fontWeight: 600, cursor: "pointer"
            }}>{s}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about your campaign performance..."
          style={{
            flex: 1, padding: "10px 14px", border: `1px solid ${T.border}`,
            borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit",
            color: T.text, background: "#F8FAFF"
          }}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={{
          padding: "10px 16px", background: T.primary, border: "none",
          borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer",
          fontSize: 13, opacity: loading || !input.trim() ? 0.5 : 1
        }}>
          Send
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  SECTION 7: ALERTS
// ═══════════════════════════════════════════════════════════════════

const AlertCenter = ({ alerts, onDismiss }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px", boxShadow: T.shadow }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>🔔 Alert Center</h3>
      <Badge color={alerts.filter(a => !a.read).length > 0 ? "red" : "gray"}>
        {alerts.filter(a => !a.read).length} new
      </Badge>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {alerts.map(a => (
        <div key={a.id} style={{
          display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px",
          borderRadius: 10, border: `1px solid ${T.border}`,
          background: a.read ? "#FAFBFF" : "#fff",
          opacity: a.read ? 0.75 : 1,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{a.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 2 }}>{a.title}</div>
            <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.4 }}>{a.message}</div>
            <div style={{ fontSize: 11, color: T.textLight, marginTop: 4 }}>{a.time}</div>
          </div>
          {!a.read && (
            <button onClick={() => onDismiss(a.id)} style={{
              padding: "4px 10px", border: `1px solid ${T.border}`, borderRadius: 6,
              background: "#fff", fontSize: 11, cursor: "pointer", color: T.textMuted
            }}>Dismiss</button>
          )}
        </div>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
//  SECTION 8: FILTERS + SYNC
// ═══════════════════════════════════════════════════════════════════

const Filters = ({ filter, setFilter, onSync, syncing, lastSync }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
    padding: "12px 16px", boxShadow: T.shadow
  }}>
    <span style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Filters</span>

    {/* Date Range */}
    <select value={filter.dateRange} onChange={e => setFilter(f => ({ ...f, dateRange: e.target.value }))} style={{
      padding: "6px 10px", border: `1px solid ${T.border}`, borderRadius: 8,
      fontSize: 12, background: "#F8FAFF", color: T.text, cursor: "pointer"
    }}>
      {["Last 7 days", "Last 14 days", "Last 30 days", "This month", "Custom"].map(d => <option key={d}>{d}</option>)}
    </select>

    {/* Campaign */}
    <select value={filter.campaign} onChange={e => setFilter(f => ({ ...f, campaign: e.target.value }))} style={{
      padding: "6px 10px", border: `1px solid ${T.border}`, borderRadius: 8,
      fontSize: 12, background: "#F8FAFF", color: T.text, cursor: "pointer"
    }}>
      <option value="">All Campaigns</option>
      {DB.campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>

    {/* Ad Set */}
    <select value={filter.adSet} onChange={e => setFilter(f => ({ ...f, adSet: e.target.value }))} style={{
      padding: "6px 10px", border: `1px solid ${T.border}`, borderRadius: 8,
      fontSize: 12, background: "#F8FAFF", color: T.text, cursor: "pointer"
    }}>
      <option value="">All Ad Sets</option>
      {DB.adSets
        .filter(s => !filter.campaign || s.campaignId === filter.campaign)
        .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
    </select>

    <div style={{ flex: 1 }} />

    {/* Sync */}
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: T.textLight }}>Last sync: {lastSync}</span>
      <button onClick={onSync} disabled={syncing} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
        background: syncing ? T.border : T.primary, border: "none",
        borderRadius: 8, color: syncing ? T.textMuted : "#fff",
        fontSize: 12, fontWeight: 700, cursor: syncing ? "default" : "pointer",
        transition: "all 0.2s"
      }}>
        {syncing ? <Spinner /> : <span>↻</span>}
        {syncing ? "Syncing..." : "Sync Now"}
      </button>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
//  SECTION 9: SIDEBAR NAV
// ═══════════════════════════════════════════════════════════════════

const NAV_ITEMS = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "creatives", icon: "🎨", label: "Creatives" },
  { id: "insights", icon: "🧠", label: "AI Insights" },
  { id: "chat", icon: "💬", label: "AI Chat" },
  { id: "alerts", icon: "🔔", label: "Alerts" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

const Sidebar = ({ active, setActive, user, alertCount }) => (
  <div style={{
    width: 220, background: T.text, display: "flex", flexDirection: "column",
    padding: "0 0 24px", flexShrink: 0
  }}>
    {/* Logo */}
    <div style={{ padding: "22px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>⚡</span>
        <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>AdPulse</span>
      </div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 4, letterSpacing: "0.05em" }}>AI MEDIA ANALYTICS</div>
    </div>

    {/* Ad Account */}
    <div style={{ padding: "14px 16px", margin: "12px 12px 4px", background: "rgba(255,255,255,0.06)", borderRadius: 10 }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Ad Account</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600, lineHeight: 1.4 }}>{user.account}</div>
    </div>

    {/* Nav */}
    <nav style={{ flex: 1, padding: "8px 12px" }}>
      {NAV_ITEMS.map(item => (
        <button key={item.id} onClick={() => setActive(item.id)} style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "10px 12px", borderRadius: 9, border: "none", cursor: "pointer",
          background: active === item.id ? "rgba(255,255,255,0.12)" : "transparent",
          color: active === item.id ? "#fff" : "rgba(255,255,255,0.5)",
          fontWeight: active === item.id ? 700 : 500, fontSize: 13,
          marginBottom: 2, transition: "all 0.15s", textAlign: "left", fontFamily: "inherit",
          position: "relative"
        }}>
          <span>{item.icon}</span>
          {item.label}
          {item.id === "alerts" && alertCount > 0 && (
            <span style={{
              marginLeft: "auto", background: T.danger, color: "#fff",
              borderRadius: 99, fontSize: 10, fontWeight: 800, padding: "1px 6px"
            }}>{alertCount}</span>
          )}
          {active === item.id && (
            <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, background: T.accent, borderRadius: "0 3px 3px 0" }} />
          )}
        </button>
      ))}
    </nav>

    {/* User */}
    <div style={{ padding: "12px 16px", margin: "0 12px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
        {user.avatar}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Pro Plan</div>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
//  SECTION 10: CREATIVE INTELLIGENCE SUMMARY
// ═══════════════════════════════════════════════════════════════════

const CreativeIntelligence = () => {
  const anglePerf = {};
  const formatPerf = {};
  AD_METRICS.forEach(m => {
    const ad = DB.ads.find(a => a.id === m.adId);
    if (!ad) return;
    if (!anglePerf[ad.angle]) anglePerf[ad.angle] = { totalRoas: 0, count: 0 };
    anglePerf[ad.angle].totalRoas += m.roas;
    anglePerf[ad.angle].count++;
    if (!formatPerf[ad.format]) formatPerf[ad.format] = { totalRoas: 0, count: 0 };
    formatPerf[ad.format].totalRoas += m.roas;
    formatPerf[ad.format].count++;
  });

  const angles = Object.entries(anglePerf).map(([k, v]) => ({ name: k, avgRoas: +(v.totalRoas / v.count).toFixed(2) })).sort((a, b) => b.avgRoas - a.avgRoas);
  const formats = Object.entries(formatPerf).map(([k, v]) => ({ name: k, avgRoas: +(v.totalRoas / v.count).toFixed(2) })).sort((a, b) => b.avgRoas - a.avgRoas);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {[{ title: "Best Performing Angles", data: angles }, { title: "Best Performing Formats", data: formats }].map(({ title, data }) => (
        <div key={title} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px", boxShadow: T.shadow }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: T.text }}>🎯 {title}</h3>
          {data.map((item, i) => (
            <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: T.textLight, width: 16 }}>#{i + 1}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text, flex: 1 }}>{item.name}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: item.avgRoas >= 3 ? T.success : item.avgRoas >= 2 ? T.warning : T.danger }}>
                {fmt.x(item.avgRoas)}
              </span>
              <div style={{ width: 80 }}><ScoreBar score={Math.min(100, Math.round(item.avgRoas * 25))} /></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════

export default function App() {
  const [user, setUser] = useState(null);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [filter, setFilter] = useState({ dateRange: "Last 14 days", campaign: "", adSet: "" });
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("Just now");
  const [alerts, setAlerts] = useState(generateAlerts());

  // Auto-sync simulation
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const mins = Math.floor(Math.random() * 3) + 1;
      setLastSync(`${mins} min ago`);
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSync = async () => {
    setSyncing(true);
    await new Promise(r => setTimeout(r, 2200));
    setSyncing(false);
    setLastSync("Just now");
  };

  const dismissAlert = id => setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  const unreadAlerts = alerts.filter(a => !a.read).length;

  if (!user) return <AuthScreen onLogin={setUser} />;

  const renderContent = () => {
    switch (activeNav) {
      case "dashboard":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Filters filter={filter} setFilter={setFilter} onSync={handleSync} syncing={syncing} lastSync={lastSync} />
            <KPIGrid />
            <ChartPanel />
            <CreativeTable filter={filter} />
          </div>
        );
      case "creatives":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <CreativeIntelligence />
            <CreativeTable filter={filter} />
          </div>
        );
      case "insights":
        return <AIInsightPanel />;
      case "chat":
        return <AIChat />;
      case "alerts":
        return <AlertCenter alerts={alerts} onDismiss={dismissAlert} />;
      case "settings":
        return (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, boxShadow: T.shadow }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: T.text }}>⚙️ Settings</h3>
            {[
              { label: "Auto-sync interval", value: "Every 6 hours" },
              { label: "ROAS alert threshold", value: "Below 2.0x" },
              { label: "CPA alert threshold", value: "Above $60" },
              { label: "CTR alert threshold", value: "Below 1.0%" },
              { label: "Meta API Version", value: "v19.0" },
              { label: "AI Model", value: "Claude Sonnet" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{s.label}</span>
                <span style={{ fontSize: 13, color: T.textMuted, fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>
        );
      default: return null;
    }
  };

  const pageTitle = NAV_ITEMS.find(n => n.id === activeNav)?.label || "Dashboard";

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', sans-serif", background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        select, input, button { font-family: inherit; }
      `}</style>

      <Sidebar active={activeNav} setActive={setActiveNav} user={user} alertCount={unreadAlerts} />

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{
          padding: "16px 28px", borderBottom: `1px solid ${T.border}`,
          background: T.surface, display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>{pageTitle}</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: T.textMuted }}>
              {filter.dateRange} · {filter.campaign ? DB.campaigns.find(c => c.id === filter.campaign)?.name : "All Campaigns"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.success, fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.success, display: "inline-block", animation: "pulse 2s infinite" }} />
              Live
            </div>
            <div style={{
              padding: "6px 14px", background: T.primaryLight, borderRadius: 8,
              fontSize: 12, fontWeight: 700, color: T.primary
            }}>
              ROAS: {KPIs.roas}x
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
