import { useState, useEffect, useCallback } from "react";

/* ---------- identity ---------- */
const USER_NAME = "Isa";

/* ---------- palette & type ---------- */
const C = {
  bgTop: "#FBF2E4",
  bgMid: "#F6F0FB",
  bgBottom: "#EFEAFB",
  card: "#FFFFFF",
  ink: "#23234A",
  sub: "#8A89B0",
  subFaint: "#C0BEDD",
  line: "#EBE8F6",
  accent: "#F0A63A",
  accentDeep: "#D98A1B",
  accentSoft: "#FCEBD1",
  violet: "#7C6FE0",
  violetSoft: "#EDE9FC",
  success: "#2E9E5B",
  successSoft: "#E1F5E9",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;600;700&family=Karla:wght@400;500;700;800&display=swap');

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes ringGlow {
  0%, 100% { filter: drop-shadow(0 0 0px rgba(240,166,58,0)); }
  50% { filter: drop-shadow(0 0 12px rgba(240,166,58,.65)); }
}
@keyframes popIn {
  0% { transform: scale(0.85); opacity: 0; }
  60% { transform: scale(1.06); opacity: 1; }
  100% { transform: scale(1); }
}
* { box-sizing: border-box; }
button { font: inherit; }
`;

/* ---------- date helpers ---------- */
const toKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const isoWeek = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week };
};
const weekKey = (d) => {
  const { year, week } = isoWeek(d);
  return `${year}-W${String(week).padStart(2, "0")}`;
};

/* ---------- schedule ---------- */
const VIDEO_THEME = {
  1: "Business",
  2: "Mentality · take notes",
  3: "Computer science",
  4: "Styling / curly hair",
  5: "Sports",
  6: "Books / free pick",
  0: "Books / free pick",
};

function habitsFor(date) {
  const dow = date.getDay(); // 0 Sun
  const { week } = isoWeek(date);
  const even = week % 2 === 0;
  const list = [];

  if (dow >= 1 && dow <= 5)
    list.push({ id: "gym", label: "Morning gym", time: "Early AM" });

  list.push(
    { id: "piano", label: "Piano · 30 min", time: "After work" },
    { id: "study", label: "Study hour", time: "After piano" }
  );

  if (dow === 1 && even)
    list.push({ id: "cleaning", label: "House cleaning", time: "7:30 PM" });
  if (dow === 2) list.push({ id: "tennis", label: "Tennis", time: "7:30 PM" });
  if (dow === 3)
    list.push(
      even
        ? { id: "padel", label: "Padel business planning", time: "7:30 PM" }
        : { id: "insta", label: "Instagram content (Andrés)", time: "7:30 PM" }
    );
  if (dow === 4)
    list.push({ id: "buffer", label: "Buffer · catch-up", time: "7:30 PM" });
  if (dow === 5) list.push({ id: "social", label: "Social night", time: "Evening" });
  if (dow === 6)
    list.push({ id: "biz", label: "Business projects block", time: "10–12 AM" });
  if (dow === 0)
    list.push(
      { id: "maint", label: "Maintenance (prep · laundry)", time: "Flexible" },
      { id: "review", label: "Weekly review · 30 min", time: "Evening" }
    );

  list.push(
    { id: "gratitude", label: "Gratitude journal", time: "Stacked" },
    { id: "facecare", label: "Face care", time: "Stacked" },
    { id: "reading", label: "Reading", time: "Stacked" },
    { id: "video", label: `Video · ${VIDEO_THEME[dow]}`, time: "Before sleep" }
  );
  return list;
}

const ICONS = {
  gym: "🏋️",
  piano: "🎹",
  study: "📚",
  cleaning: "🧹",
  tennis: "🎾",
  padel: "🏓",
  insta: "📸",
  buffer: "🌿",
  social: "🎉",
  biz: "💼",
  maint: "🧺",
  review: "📝",
  gratitude: "🙏",
  facecare: "🧴",
  reading: "📖",
  video: "🎬",
};

/* ---------- storage (browser localStorage — stays on this device) ---------- */
const STORE_KEY = "isa-tracker-2026";

async function loadData() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* first run — nothing saved yet */
  }
  return { days: {}, weeks: {} };
}
async function saveData(data) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Save failed", e);
  }
}

/* ---------- copy ---------- */
function greetingWord() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function motivation(pct, doneCount) {
  if (pct >= 1) return "Perfect day. You're unstoppable. 🎉";
  if (pct >= 0.75) return "So close — finish it out.";
  if (pct >= 0.4) return "Good momentum, keep going.";
  if (doneCount > 0) return "Nice start — keep it up.";
  return "Let's make today count.";
}

/* ---------- small pieces ---------- */
function DayRing({ pct, dateNum, size = 76, stroke = 6, glow = false }) {
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const gradId = `ring-grad-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ animation: glow && pct >= 1 ? "ringGlow 2.2s ease-in-out infinite" : "none" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={C.accent} />
          <stop offset="100%" stopColor={C.violet} />
        </linearGradient>
      </defs>
      <circle cx={c} cy={c} r={r} fill="none" stroke={C.line} strokeWidth={stroke} />
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        transform={`rotate(-90 ${c} ${c})`}
        style={{ transition: "stroke-dashoffset .5s cubic-bezier(.4,0,.2,1)" }}
      />
      {dateNum != null && (
        <text
          x={c}
          y={c + size * 0.08}
          textAnchor="middle"
          style={{
            fontFamily: "'Zilla Slab', serif",
            fontSize: size * 0.29,
            fontWeight: 700,
            fill: C.ink,
          }}
        >
          {dateNum}
        </text>
      )}
    </svg>
  );
}

function HabitRow({ habit, done, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "13px 14px",
        background: done ? C.ink : C.card,
        border: `1px solid ${done ? C.ink : C.line}`,
        borderRadius: 16,
        cursor: "pointer",
        textAlign: "left",
        boxShadow: done
          ? "0 6px 16px -6px rgba(35,35,74,.4)"
          : "0 1px 2px rgba(35,35,74,.03), 0 6px 16px -10px rgba(35,35,74,.12)",
        transition: "background .18s ease, box-shadow .18s ease, transform .12s ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.985)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <span
        style={{
          width: 34,
          height: 34,
          minWidth: 34,
          borderRadius: 11,
          background: done ? "rgba(255,255,255,.12)" : C.accentSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
      >
        {ICONS[habit.id] || "✨"}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontFamily: "'Karla', sans-serif",
            fontWeight: 700,
            fontSize: 14.5,
            color: done ? "#FFFFFF" : C.ink,
            textDecoration: done ? "line-through" : "none",
            textDecorationColor: C.accent,
            textDecorationThickness: 2,
          }}
        >
          {habit.label}
        </span>
        <span
          style={{
            fontFamily: "'Karla', sans-serif",
            fontSize: 11.5,
            color: done ? "#B9B8D6" : C.sub,
          }}
        >
          {habit.time}
        </span>
      </span>
      <span
        style={{
          width: 25,
          height: 25,
          minWidth: 25,
          borderRadius: 8,
          border: `2px solid ${done ? C.accent : C.subFaint}`,
          background: done ? C.accent : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.ink,
          fontWeight: 700,
          fontSize: 14,
          transform: done ? "scale(1.05)" : "scale(1)",
          transition: "transform .18s cubic-bezier(.34,1.56,.64,1), background .18s, border-color .18s",
        }}
      >
        {done ? "✓" : ""}
      </span>
    </button>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div
      style={{
        flex: 1,
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        padding: "16px 16px",
        boxShadow: "0 1px 2px rgba(35,35,74,.03), 0 10px 24px -14px rgba(35,35,74,.18)",
      }}
    >
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 24, color: C.ink }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: C.sub, fontWeight: 700 }}>{label}</div>
    </div>
  );
}

const cardStyle = {
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 1px 2px rgba(35,35,74,.03), 0 10px 28px -16px rgba(35,35,74,.18)",
};

const navBtn = {
  width: 38,
  height: 34,
  borderRadius: 10,
  border: `1px solid ${C.line}`,
  background: C.card,
  color: C.ink,
  cursor: "pointer",
  fontSize: 15,
  fontFamily: "'Karla', sans-serif",
};

const counterBtn = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: `1px solid ${C.line}`,
  background: C.card,
  color: C.ink,
  fontSize: 17,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "'Karla', sans-serif",
};

/* ---------- main ---------- */
export default function HabitTracker() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("week");
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    loadData().then(setData);
  }, []);

  const update = useCallback((fn) => {
    setData((prev) => {
      const next = fn(structuredClone(prev));
      saveData(next);
      return next;
    });
  }, []);

  if (!data)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: `linear-gradient(180deg, ${C.bgTop} 0%, ${C.bgMid} 50%, ${C.bgBottom} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Karla', sans-serif",
          color: C.sub,
        }}
      >
        <style>{FONTS}</style>
        Loading your tracker…
      </div>
    );

  const dKey = toKey(viewDate);
  const wKey = weekKey(viewDate);
  const habits = habitsFor(viewDate);
  const dayDone = data.days[dKey] || {};
  const doneCount = habits.filter((h) => dayDone[h.id]).length;
  const pct = habits.length ? doneCount / habits.length : 0;
  const week = data.weeks[wKey] || { podcasts: 0, takeaway: false };

  const toggleHabit = (id) =>
    update((d) => {
      d.days[dKey] = d.days[dKey] || {};
      d.days[dKey][id] = !d.days[dKey][id];
      return d;
    });

  const setWeek = (patch) =>
    update((d) => {
      d.weeks[wKey] = { ...(d.weeks[wKey] || { podcasts: 0, takeaway: false }), ...patch };
      return d;
    });

  /* streak: consecutive days (ending today or yesterday) with ≥75% done */
  const streak = (() => {
    let s = 0;
    const cur = new Date();
    for (let i = 0; i < 400; i++) {
      const k = toKey(cur);
      const hs = habitsFor(cur);
      const dd = data.days[k] || {};
      const p = hs.filter((h) => dd[h.id]).length / hs.length;
      if (p >= 0.75) s++;
      else if (i === 0) {
        /* today not finished yet — don't break streak */
      } else break;
      cur.setDate(cur.getDate() - 1);
    }
    return s;
  })();

  const shiftWeek = (n) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + n * 7);
    setViewDate(d);
  };

  const isToday = toKey(new Date()) === dKey;
  const dayName = viewDate.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = viewDate.toLocaleDateString("en-US", { month: "long" });

  /* ---- year stats ---- */
  const year = new Date().getFullYear();
  const monthStats = Array.from({ length: 12 }, (_, m) => {
    let sum = 0,
      n = 0;
    Object.entries(data.days).forEach(([k, v]) => {
      const [y, mo] = k.split("-").map(Number);
      if (y === year && mo === m + 1) {
        const dt = new Date(y, mo - 1, Number(k.split("-")[2]));
        const hs = habitsFor(dt);
        sum += hs.filter((h) => v[h.id]).length / hs.length;
        n++;
      }
    });
    return n ? sum / n : 0;
  });
  const totalChecks = Object.values(data.days).reduce(
    (a, v) => a + Object.values(v).filter(Boolean).length,
    0
  );

  /* ---- week strip ---- */
  const monday = new Date(viewDate);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const hs = habitsFor(d);
    const dd = data.days[toKey(d)] || {};
    return { d, pct: hs.filter((h) => dd[h.id]).length / hs.length };
  });

  const seg = (id, label) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      style={{
        flex: 1,
        padding: "9px 0",
        borderRadius: 10,
        border: "none",
        cursor: "pointer",
        fontFamily: "'Karla', sans-serif",
        fontWeight: 700,
        fontSize: 13,
        background: tab === id ? C.ink : "transparent",
        color: tab === id ? "#fff" : C.sub,
        transition: "background .15s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${C.bgTop} 0%, ${C.bgMid} 45%, ${C.bgBottom} 100%)`,
        fontFamily: "'Karla', sans-serif",
        color: C.ink,
        padding: "20px 16px 40px",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <style>{FONTS}</style>

      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <DayRing pct={pct} dateNum={viewDate.getDate()} glow={isToday} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: C.sub, fontSize: 12.5, fontWeight: 700 }}>
            {greetingWord()}, {USER_NAME}
          </div>
          <div
            style={{
              fontFamily: "'Zilla Slab', serif",
              fontWeight: 700,
              fontSize: 22,
              lineHeight: 1.15,
            }}
          >
            {dayName}, {monthName} {viewDate.getDate()}
          </div>
          <div
            style={{
              marginTop: 5,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "inline-block",
                background: C.accentSoft,
                color: "#9A6516",
                fontWeight: 700,
                fontSize: 12,
                padding: "2px 10px",
                borderRadius: 20,
              }}
            >
              🔥 {streak}-day streak
            </span>
            <span style={{ color: C.sub, fontSize: 12.5 }}>
              {doneCount}/{habits.length} done
            </span>
          </div>
        </div>
      </div>

      {/* tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#EAE7F6",
          borderRadius: 12,
          padding: 4,
          marginBottom: 16,
        }}
      >
        {seg("week", "This Week")}
        {seg("year", "Year")}
      </div>

      {tab === "week" && (
        <>
          {/* week nav + strip */}
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <button onClick={() => shiftWeek(-1)} style={navBtn}>
                ←
              </button>
              <div style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 15 }}>
                Week of {monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
              <button onClick={() => shiftWeek(1)} style={navBtn}>
                →
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
              {weekDays.map(({ d, pct: p }) => {
                const key = toKey(d);
                const selected = key === dKey;
                const today = key === toKey(new Date());
                return (
                  <button
                    key={key}
                    onClick={() => setViewDate(d)}
                    style={{
                      flex: 1,
                      border: "none",
                      background: selected ? C.violetSoft : "transparent",
                      borderRadius: 14,
                      padding: "8px 2px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 5,
                      fontFamily: "'Karla', sans-serif",
                      transition: "background .15s",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10.5,
                        color: selected ? C.violet : C.sub,
                        fontWeight: 700,
                      }}
                    >
                      {d.toLocaleDateString("en-US", { weekday: "narrow" })}
                    </span>
                    <span style={{ position: "relative" }}>
                      <DayRing pct={p} size={38} stroke={4} />
                      <span
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: C.ink,
                        }}
                      >
                        {d.getDate()}
                      </span>
                      {today && (
                        <span
                          style={{
                            position: "absolute",
                            bottom: -3,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            background: C.accent,
                          }}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {!isToday && (
              <button
                onClick={() => setViewDate(new Date())}
                style={{
                  marginTop: 12,
                  width: "100%",
                  padding: "8px 0",
                  borderRadius: 10,
                  border: `1px solid ${C.line}`,
                  background: "transparent",
                  color: C.sub,
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: "pointer",
                  fontFamily: "'Karla', sans-serif",
                }}
              >
                Back to today
              </button>
            )}
          </div>

          {/* selected day checklist */}
          <div key={dKey} style={{ animation: "fadeSlideIn .3s ease", marginTop: 14 }}>
            {isToday && (
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: pct >= 1 ? C.success : C.violet,
                  marginBottom: 10,
                  paddingLeft: 2,
                }}
              >
                {motivation(pct, doneCount)}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {habits.map((h) => (
                <HabitRow
                  key={h.id}
                  habit={h}
                  done={!!dayDone[h.id]}
                  onToggle={() => toggleHabit(h.id)}
                />
              ))}
            </div>

            {/* weekly goals card */}
            <div style={{ ...cardStyle, marginTop: 14 }}>
              <div
                style={{
                  fontFamily: "'Zilla Slab', serif",
                  fontWeight: 700,
                  fontSize: 16,
                  marginBottom: 10,
                }}
              >
                This week
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 14 }}>
                  🎧 Podcasts <span style={{ color: C.sub }}>(goal 3)</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={() => setWeek({ podcasts: Math.max(0, week.podcasts - 1) })}
                    style={counterBtn}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontFamily: "'Zilla Slab', serif",
                      fontWeight: 700,
                      fontSize: 20,
                      minWidth: 22,
                      textAlign: "center",
                      color: week.podcasts >= 3 ? C.success : C.ink,
                    }}
                  >
                    {week.podcasts}
                  </span>
                  <button
                    onClick={() => setWeek({ podcasts: week.podcasts + 1 })}
                    style={counterBtn}
                  >
                    +
                  </button>
                </span>
              </div>
              <button
                onClick={() => setWeek({ takeaway: !week.takeaway })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: week.takeaway ? C.successSoft : "transparent",
                  border: `1px solid ${week.takeaway ? C.success : C.line}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  width: "100%",
                  cursor: "pointer",
                  fontFamily: "'Karla', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.ink,
                }}
              >
                <span>{week.takeaway ? "✓" : "○"}</span> ✍️ 1 takeaway written this week
              </button>
            </div>

            <div
              style={{
                marginTop: 12,
                fontSize: 12,
                color: C.sub,
                textAlign: "center",
              }}
            >
              A day counts toward your streak at 75%+.
            </div>
          </div>
        </>
      )}

      {tab === "year" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeSlideIn .3s ease" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <StatCard label="Current streak" value={`${streak}d`} icon="🔥" />
            <StatCard label="Habits checked" value={totalChecks} icon="✅" />
          </div>
          <div style={cardStyle}>
            <div
              style={{
                fontFamily: "'Zilla Slab', serif",
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 14,
              }}
            >
              {year} month by month
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 110 }}>
              {monthStats.map((p, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    height: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: `${Math.max(4, p * 100)}%`,
                      background: p > 0 ? `linear-gradient(180deg, ${C.accent}, ${C.violet})` : C.line,
                      borderRadius: 5,
                      transition: "height .3s",
                    }}
                  />
                  <span style={{ fontSize: 9, color: C.sub, fontWeight: 700 }}>
                    {"JFMAMJJASOND"[i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.sub, textAlign: "center" }}>
            Consistency over intensity — 75% every day beats 100% for one week.
          </div>
        </div>
      )}
    </div>
  );
}
