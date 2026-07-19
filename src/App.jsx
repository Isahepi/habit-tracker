import { useState, useEffect, useCallback } from "react";

/* ---------- palette & type ---------- */
const C = {
  bg: "#F3F2F9",
  card: "#FFFFFF",
  ink: "#23234A",
  sub: "#8A89B0",
  line: "#E4E2F0",
  accent: "#F0A63A",
  accentSoft: "#FCEBD1",
  done: "#23234A",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;600;700&family=Karla:wght@400;500;700&display=swap');
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

/* ---------- small pieces ---------- */
function DayRing({ pct, dateNum }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76">
      <circle cx="38" cy="38" r={r} fill="none" stroke={C.line} strokeWidth="6" />
      <circle
        cx="38"
        cy="38"
        r={r}
        fill="none"
        stroke={C.accent}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        transform="rotate(-90 38 38)"
        style={{ transition: "stroke-dashoffset .4s ease" }}
      />
      <text
        x="38"
        y="44"
        textAnchor="middle"
        style={{
          fontFamily: "'Zilla Slab', serif",
          fontSize: 22,
          fontWeight: 700,
          fill: C.ink,
        }}
      >
        {dateNum}
      </text>
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
        gap: 14,
        width: "100%",
        padding: "14px 16px",
        background: done ? C.ink : C.card,
        border: `1px solid ${done ? C.ink : C.line}`,
        borderRadius: 14,
        cursor: "pointer",
        textAlign: "left",
        transition: "background .15s ease",
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          minWidth: 26,
          borderRadius: 8,
          border: `2px solid ${done ? C.accent : C.sub}`,
          background: done ? C.accent : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.ink,
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        {done ? "✓" : ""}
      </span>
      <span style={{ flex: 1 }}>
        <span
          style={{
            display: "block",
            fontFamily: "'Karla', sans-serif",
            fontWeight: 700,
            fontSize: 15,
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
            fontSize: 12,
            color: done ? "#B9B8D6" : C.sub,
          }}
        >
          {habit.time}
        </span>
      </span>
    </button>
  );
}

/* ---------- main ---------- */
export default function HabitTracker() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("today");
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
          background: C.bg,
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

  const shiftDay = (n) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + n);
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
        background: C.bg,
        fontFamily: "'Karla', sans-serif",
        color: C.ink,
        padding: "20px 16px 40px",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <style>{FONTS}</style>

      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
        <DayRing pct={pct} dateNum={viewDate.getDate()} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "'Zilla Slab', serif",
              fontWeight: 700,
              fontSize: 24,
              lineHeight: 1.1,
            }}
          >
            {dayName}
          </div>
          <div style={{ color: C.sub, fontSize: 13 }}>
            {monthName} {viewDate.getFullYear()} · {doneCount}/{habits.length} done
          </div>
          <div
            style={{
              marginTop: 4,
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
          </div>
        </div>
      </div>

      {/* date nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "10px 0 14px",
        }}
      >
        <button onClick={() => shiftDay(-1)} style={navBtn}>
          ← 
        </button>
        {!isToday && (
          <button
            onClick={() => setViewDate(new Date())}
            style={{ ...navBtn, width: "auto", padding: "6px 16px", fontWeight: 700 }}
          >
            Back to today
          </button>
        )}
        <button onClick={() => shiftDay(1)} style={navBtn}>
           →
        </button>
      </div>

      {/* tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#E9E7F4",
          borderRadius: 12,
          padding: 4,
          marginBottom: 16,
        }}
      >
        {seg("today", "Today")}
        {seg("week", "Week")}
        {seg("year", "Year")}
      </div>

      {tab === "today" && (
        <>
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
          <div
            style={{
              marginTop: 18,
              background: C.card,
              border: `1px solid ${C.line}`,
              borderRadius: 14,
              padding: 16,
            }}
          >
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
                Podcasts <span style={{ color: C.sub }}>(goal 3)</span>
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
                    color: week.podcasts >= 3 ? "#2E7D46" : C.ink,
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
                background: week.takeaway ? C.accentSoft : "transparent",
                border: `1px solid ${week.takeaway ? C.accent : C.line}`,
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
              <span>{week.takeaway ? "✓" : "○"}</span> 1 takeaway written this week
            </button>
          </div>
        </>
      )}

      {tab === "week" && (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 }}>
          <div
            style={{
              fontFamily: "'Zilla Slab', serif",
              fontWeight: 700,
              fontSize: 16,
              marginBottom: 14,
            }}
          >
            Week of {monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
            {weekDays.map(({ d, pct: p }) => {
              const today = toKey(d) === toKey(new Date());
              return (
                <button
                  key={toKey(d)}
                  onClick={() => {
                    setViewDate(d);
                    setTab("today");
                  }}
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "'Karla', sans-serif",
                  }}
                >
                  <span style={{ fontSize: 11, color: C.sub, fontWeight: 700 }}>
                    {d.toLocaleDateString("en-US", { weekday: "narrow" })}
                  </span>
                  <span
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      color: p >= 0.75 ? "#fff" : C.ink,
                      background:
                        p >= 0.75 ? C.ink : p > 0 ? C.accentSoft : "#EFEDF8",
                      border: today ? `2px solid ${C.accent}` : "2px solid transparent",
                    }}
                  >
                    {d.getDate()}
                  </span>
                  <span style={{ fontSize: 10, color: C.sub }}>
                    {Math.round(p * 100)}%
                  </span>
                </button>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: `1px solid ${C.line}`,
              fontSize: 13,
              color: C.sub,
            }}
          >
            Tap a day to open its checklist. A day counts toward your streak at 75%+.
          </div>
        </div>
      )}

      {tab === "year" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <StatCard label="Current streak" value={`${streak}d`} />
            <StatCard label="Habits checked" value={totalChecks} />
          </div>
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.line}`,
              borderRadius: 14,
              padding: 16,
            }}
          >
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
                      background: p > 0 ? C.accent : C.line,
                      borderRadius: 4,
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

const navBtn = {
  width: 40,
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

function StatCard({ label, value }) {
  return (
    <div
      style={{
        flex: 1,
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          fontFamily: "'Zilla Slab', serif",
          fontWeight: 700,
          fontSize: 24,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: C.sub, fontWeight: 700 }}>{label}</div>
    </div>
  );
}

