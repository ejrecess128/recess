import { useState } from "react";
import { MOCK_CAMPS, SUMMER_WEEKS } from "../data/camps";

const CAT_EMOJI = {
  "Creative Arts": "🎨",
  "Sports & Athletics": "⚽",
  "STEM & Technology": "🤖",
  "Outdoor & Adventure": "🌲",
  "Performing Arts": "🎭",
};

const WEEK_MONTHS = [
  { label: "June",   ids: ["w1","w2","w3","w4"] },
  { label: "July",   ids: ["w5","w6","w7","w8"] },
  { label: "August", ids: ["w9","w10"] },
];

// Generate days for a week given its date string like "Jun 9–13"
function getWeekDays(dateStr) {
  const match = dateStr.match(/(\w+)\s+(\d+)–(\d+)/);
  if (!match) {
    // Handle "Jun 30–Jul 4" style
    const crossMatch = dateStr.match(/(\w+)\s+(\d+)–(\w+)\s+(\d+)/);
    if (!crossMatch) return [];
    const [, m1, d1, m2, d2] = crossMatch;
    const days = [];
    for (let i = 0; i < 5; i++) {
      if (i <= (30 - Number(d1))) {
        days.push({ label: ["Mon","Tue","Wed","Thu","Fri"][i], date: `${m1} ${Number(d1) + i}` });
      } else {
        days.push({ label: ["Mon","Tue","Wed","Thu","Fri"][i], date: `${m2} ${Number(d2) - (4 - i)}` });
      }
    }
    return days;
  }
  const [, month, startDay] = match;
  return ["Mon","Tue","Wed","Thu","Fri"].map((d, i) => ({
    label: d,
    date: `${month} ${Number(startDay) + i}`,
  }));
}

// Parse hours string like "9 AM – 4 PM" into hour blocks
function getHourBlocks(hoursStr) {
  const match = hoursStr.match(/(\d+)(?::(\d+))?\s*(AM|PM)\s*–\s*(\d+)(?::(\d+))?\s*(AM|PM)/i);
  if (!match) return [];
  let startH = Number(match[1]);
  if (match[3].toUpperCase() === "PM" && startH !== 12) startH += 12;
  if (match[3].toUpperCase() === "AM" && startH === 12) startH = 0;
  let endH = Number(match[4]);
  if (match[6].toUpperCase() === "PM" && endH !== 12) endH += 12;
  if (match[6].toUpperCase() === "AM" && endH === 12) endH = 0;
  const blocks = [];
  for (let h = startH; h < endH; h++) {
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const ampm = h >= 12 ? "PM" : "AM";
    blocks.push({ hour: h, label: `${hour12} ${ampm}` });
  }
  return blocks;
}

const CRITERIA = [
  { key: "price", label: "Price / wk", render: (c) => `$${c.price}`, check: (c, f) => c.price <= f.budget },
  { key: "age", label: "Age range", render: (c) => `${c.ageMin}–${c.ageMax}`, check: (c, f) => f.childAge >= c.ageMin && f.childAge <= c.ageMax },
  { key: "type", label: "Day type", render: (c) => c.type, check: (c, f) => f.dayType === "any" || c.type.toLowerCase().includes(f.dayType) },
  { key: "weeks", label: "Your weeks",
    render: (c, f) => { if (f.weeks.length === 0) return "Any"; const n = f.weeks.filter(w => c.weeks.includes(w)).length; return `${n}/${f.weeks.length} weeks`; },
    check: (c, f) => f.weeks.length === 0 || f.weeks.some(w => c.weeks.includes(w)) },
  { key: "avail", label: "Availability", render: (c) => `${c.spotsRemaining} spots`, check: (c) => c.spotsRemaining > 0 },
  { key: "rating", label: "Rating", render: (c) => `★ ${c.rating}`, check: (c) => c.rating >= 4.7 },
  { key: "distance", label: "Distance", render: (c) => `${c.distance} mi`, check: (c) => c.distance <= 4 },
  { key: "location", label: "Location", render: (c) => c.location, check: () => true },
  { key: "hours", label: "Hours", render: (c) => c.hours, check: () => true },
];

export default function ComparePage({ planIds, filters, onBack, onTogglePlan, cartIds, toggleCart, children = [], cartItems = [], compareItems = [], insights = {} }) {
  const [view, setView] = useState("compare");
  const [calAssignments, setCalAssignments] = useState({});
  const [exportMsg, setExportMsg] = useState(null);

  const camps = MOCK_CAMPS.filter(c => planIds.includes(c.id));
  const cartCamps = MOCK_CAMPS.filter(c => cartIds.includes(c.id));

  // Combine cart + compared camps for summary (deduplicated)
  const allSummaryIds = [...new Set([...cartIds, ...planIds])];
  const summaryCamps = MOCK_CAMPS.filter(c => allSummaryIds.includes(c.id));
  const summaryTotal = summaryCamps.reduce((sum, c) => sum + c.price, 0);

  function assignWeek(weekId, campId) {
    setCalAssignments(prev => {
      const next = { ...prev };
      if (next[weekId] === campId) delete next[weekId];
      else next[weekId] = campId;
      return next;
    });
  }

  function handleExport(type) {
    const labels = { pdf: "Generating PDF…", link: "Link copied to clipboard!", gcal: "Opening Google Calendar…" };
    setExportMsg(labels[type]);
    setTimeout(() => setExportMsg(null), 3000);
  }

  return (
    <div className="compare-page">
      <div className="cp-header">
        <div className="cp-header-left">
          <button className="cp-back" onClick={onBack}>← Back to camps</button>
          <h1 className="cp-title">
            Compare & plan
            <span className="cp-count">{camps.length} comparing</span>
          </h1>
        </div>
        <div className="cp-tabs">
          <button className={`cp-tab${view === "compare" ? " active" : ""}`} onClick={() => setView("compare")}>Comparison</button>
          <button className={`cp-tab${view === "calendar" ? " active" : ""}`} onClick={() => setView("calendar")}>Calendar</button>
        </div>
        <div className="cp-actions">
          <button className="cp-action-btn" onClick={() => handleExport("link")}>Share link</button>
          <button className="cp-action-btn" onClick={() => handleExport("pdf")}>Export PDF</button>
        </div>
      </div>

      {exportMsg && <div className="cp-toast">{exportMsg}</div>}

      <div className="cp-layout">
        <div className="cp-content">
          {camps.length === 0 ? (
            <div className="cp-empty">
              <div className="cp-empty-visual">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none"><rect x="8" y="8" width="48" height="48" rx="12" stroke="#E2E2E2" strokeWidth="2" strokeDasharray="6 4"/><path d="M28 32h8M32 28v8" stroke="#C5C5C5" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <h2>No camps to compare yet</h2>
              <p>Add camps from the feed using the compare button on each card.</p>
              <button className="cp-empty-btn" onClick={onBack}>Browse camps</button>
            </div>
          ) : view === "compare" ? (
            <CompareView camps={camps} filters={filters} onTogglePlan={onTogglePlan} planIds={planIds} />
          ) : (
            <CalendarView camps={camps} filters={filters} calAssignments={calAssignments} onAssign={assignWeek} />
          )}
        </div>

        {/* Persistent summary sidebar */}
        <SummarySidebar
          children={children}
          cartItems={cartItems}
          compareItems={compareItems}
          filters={filters}
          onExport={handleExport}
          insights={insights}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUMMARY SIDEBAR — grouped by child
═══════════════════════════════════════════ */
function SummarySidebar({ children, cartItems, compareItems, filters, onExport, insights = {} }) {
  const { conflicts = [], optimizations = [] } = insights;
  // Build per-child summaries
  const allItems = [...cartItems, ...compareItems];
  // Deduplicate per child
  const itemMap = {};
  for (const item of allItems) {
    const key = `${item.childId}-${item.campId}`;
    if (!itemMap[key]) {
      itemMap[key] = { ...item, inCart: false, inCompare: false };
    }
    if (cartItems.some(i => i.childId === item.childId && i.campId === item.campId)) itemMap[key].inCart = true;
    if (compareItems.some(i => i.childId === item.childId && i.campId === item.campId)) itemMap[key].inCompare = true;
  }
  const dedupedItems = Object.values(itemMap);

  let grandTotal = 0;

  return (
    <aside className="cp-summary">
      <div className="cp-summary-header">
        <span className="cp-summary-title">Summary</span>
        <span className="cp-summary-count">{dedupedItems.length} camp{dedupedItems.length !== 1 ? "s" : ""}</span>
      </div>

      {dedupedItems.length === 0 ? (
        <div className="cp-summary-empty">
          <p>No camps selected yet.</p>
          <p className="cp-summary-hint">Add camps to your cart or comparison to see your total here.</p>
        </div>
      ) : (
        <>
          {children.map(child => {
            const childItems = dedupedItems.filter(i => i.childId === child.id);
            if (childItems.length === 0) return null;
            const childTotal = childItems.reduce((sum, i) => {
              const camp = MOCK_CAMPS.find(c => c.id === i.campId);
              return sum + (camp ? camp.price : 0);
            }, 0);
            grandTotal += childTotal;

            return (
              <div key={child.id} className="cp-summary-child-group">
                <div className="cp-summary-child-head">
                  <span className="cp-summary-child-dot" style={{ background: child.color }} />
                  <span className="cp-summary-child-name">{child.name}</span>
                  <span className="cp-summary-child-subtotal">${childTotal}/wk</span>
                </div>
                <div className="cp-summary-items">
                  {childItems.map(item => {
                    const camp = MOCK_CAMPS.find(c => c.id === item.campId);
                    if (!camp) return null;
                    return (
                      <div key={`${item.childId}-${item.campId}`} className="cp-summary-item">
                        <div className="cp-summary-item-info">
                          <span className="cp-summary-item-name">{camp.name}</span>
                          <span className="cp-summary-item-detail">{camp.program}</span>
                          <div className="cp-summary-item-badges">
                            {item.inCart && <span className="cp-summary-badge cp-summary-badge--cart">In cart</span>}
                            {item.inCompare && <span className="cp-summary-badge cp-summary-badge--compare">Comparing</span>}
                          </div>
                        </div>
                        <span className="cp-summary-item-price">${camp.price}/wk</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Also show items not tied to a child (legacy compat) */}

          <div className="cp-summary-totals">
            <div className="cp-summary-total-row">
              <span>Weekly total</span>
              <span className="cp-summary-total-amount">${grandTotal || dedupedItems.reduce((s, i) => { const c = MOCK_CAMPS.find(x => x.id === i.campId); return s + (c ? c.price : 0); }, 0)}</span>
            </div>
            <div className="cp-summary-total-row cp-summary-total-sub">
              <span>{filters.weeks?.length || 1} week{(filters.weeks?.length || 1) !== 1 ? "s" : ""} planned</span>
              <span>${(grandTotal || dedupedItems.reduce((s, i) => { const c = MOCK_CAMPS.find(x => x.id === i.campId); return s + (c ? c.price : 0); }, 0)) * (filters.weeks?.length || 1)} est.</span>
            </div>
          </div>

          {/* Insights: conflicts + optimizations */}
          {(conflicts.length > 0 || optimizations.length > 0) && (
            <div className="cp-insights">
              {conflicts.map((c, i) => (
                <div key={`c${i}`} className="cp-insight cp-insight--conflict">
                  <span className="cp-insight-icon">⚠</span>
                  <span className="cp-insight-text">{c.message}</span>
                </div>
              ))}
              {optimizations.map((o, i) => (
                <div key={`o${i}`} className={`cp-insight cp-insight--${o.type === "over_budget" ? "warn" : "tip"}`}>
                  <span className="cp-insight-icon">{o.type === "over_budget" ? "💸" : o.type === "under_budget" ? "✨" : o.type === "same_camp" ? "🎯" : "📍"}</span>
                  <span className="cp-insight-text">{o.message}</span>
                </div>
              ))}
            </div>
          )}

          <button className="cp-summary-cta">Proceed to booking</button>

          <div className="cp-summary-share">
            <button className="cp-summary-share-btn" onClick={() => onExport("link")}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5l-1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Share with co-parent
            </button>
            <button className="cp-summary-share-btn" onClick={() => onExport("pdf")}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 14h8a1 1 0 001-1V6l-4-4H4a1 1 0 00-1 1v10a1 1 0 001 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Export as PDF
            </button>
          </div>
        </>
      )}

      <div className="cp-summary-tip">
        <span>💡</span>
        <span>Both carted and compared camps are included in your total.</span>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════
   COMPARISON VIEW
═══════════════════════════════════════════ */
function CompareView({ camps, filters, onTogglePlan, planIds }) {
  return (
    <div className="cv-container">
      <div className="cv-grid" style={{ "--camp-count": camps.length }}>
        <div className="cv-labels">
          <div className="cv-label-head">Criteria</div>
          {CRITERIA.map(cr => <div key={cr.key} className="cv-label">{cr.label}</div>)}
          <div className="cv-label">Actions</div>
        </div>
        {camps.map((camp) => {
          const inPlan = planIds.includes(camp.id);
          return (
            <div key={camp.id} className="cv-camp-col">
              <div className="cv-camp-head">
                <img src={camp.image} alt={camp.name} className="cv-camp-photo" />
                <div className="cv-camp-info">
                  <span className="cv-camp-provider">{camp.provider}</span>
                  <span className="cv-camp-name">{camp.name}</span>
                  <span className="cv-camp-program">{camp.program}</span>
                </div>
              </div>
              {CRITERIA.map(cr => {
                const passes = cr.check(camp, filters);
                return (
                  <div key={cr.key} className={`cv-val ${passes ? "cv-val--pass" : "cv-val--fail"}`}>
                    <span className={`cv-icon ${passes ? "cv-icon--pass" : "cv-icon--fail"}`}>{passes ? "✓" : "✗"}</span>
                    <span>{cr.render(camp, filters)}</span>
                  </div>
                );
              })}
              <div className="cv-val cv-val--action">
                <button className={`cv-remove-btn${inPlan ? "" : " cv-remove-btn--add"}`} onClick={() => onTogglePlan(camp.id)}>
                  {inPlan ? "Remove" : "Add back"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CALENDAR VIEW — Week → Day → Hour drill-down
═══════════════════════════════════════════ */
const CAMP_COLORS = [
  { bg: "#E6F4F5", border: "#068D9D", text: "#056B76" },
  { bg: "#EFF6FF", border: "#003DA5", text: "#002D7A" },
  { bg: "#FFF0EB", border: "#E05A2B", text: "#B8421A" },
  { bg: "#F5F3FF", border: "#7C3AED", text: "#5B21B6" },
  { bg: "#FFF8E6", border: "#D97706", text: "#92400E" },
];

function CalendarView({ camps, filters, calAssignments, onAssign }) {
  const [calView, setCalView] = useState("week"); // "week" | "day" | "hour"
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const weekMap = Object.fromEntries(SUMMER_WEEKS.map(w => [w.id, w]));
  const campColorMap = Object.fromEntries(camps.map((c, i) => [c.id, CAMP_COLORS[i % CAMP_COLORS.length]]));

  function drillToDay(wid) {
    setSelectedWeek(wid);
    setCalView("day");
    setSelectedDay(null);
  }

  function drillToHour(dayInfo) {
    setSelectedDay(dayInfo);
    setCalView("hour");
  }

  function goBackToWeek() {
    setCalView("week");
    setSelectedWeek(null);
    setSelectedDay(null);
  }

  function goBackToDay() {
    setCalView("day");
    setSelectedDay(null);
  }

  // ── WEEK VIEW ──
  if (calView === "week") {
    return (
      <div className="calv-content">
        <div className="calv-view-label">
          <span className="calv-view-icon">📅</span>
          <span>Week view</span>
          <span className="calv-view-hint">Click a week to see daily schedule</span>
        </div>
        {WEEK_MONTHS.map(month => (
          <div key={month.label} className="calv-month">
            <div className="calv-month-label">{month.label}</div>
            <div className="calv-weeks">
              {month.ids.map(wid => {
                const wk = weekMap[wid];
                const assignedId = calAssignments[wid];
                const assignedCamp = assignedId ? MOCK_CAMPS.find(c => c.id === assignedId) : null;
                const availableCamps = camps.filter(c => c.weeks.includes(wid));
                const isUserWeek = filters.weeks.includes(wid);
                const col = assignedCamp ? campColorMap[assignedCamp.id] : null;

                return (
                  <div
                    key={wid}
                    className={`calv-week-row calv-week-clickable ${isUserWeek ? "calv-week-selected" : ""}`}
                    onClick={() => drillToDay(wid)}
                  >
                    <div className="calv-week-label">
                      <div className="calv-week-id">{wk.label}</div>
                      <div className="calv-week-dates">{wk.dates}</div>
                    </div>
                    <div className="calv-week-slots">
                      {availableCamps.length === 0 ? (
                        <div className="calv-slot calv-slot-empty">No camps available</div>
                      ) : availableCamps.map(camp => {
                        const isAssigned = calAssignments[wid] === camp.id;
                        const col2 = campColorMap[camp.id];
                        return (
                          <button
                            key={camp.id}
                            className={`calv-slot ${isAssigned ? "calv-slot-active" : ""}`}
                            style={isAssigned ? { background: col2.bg, borderColor: col2.border, color: col2.text } : {}}
                            onClick={(e) => { e.stopPropagation(); onAssign(wid, camp.id); }}
                          >
                            <span className="calv-slot-emoji">{CAT_EMOJI[camp.category]}</span>
                            <div className="calv-slot-info">
                              <div className="calv-slot-name">{camp.name}</div>
                              <div className="calv-slot-price">${camp.price}/wk</div>
                            </div>
                            {isAssigned && <span className="calv-slot-check">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div className="calv-week-meta">
                      {isUserWeek && !assignedCamp && <div className="calv-week-flag">your week</div>}
                      {assignedCamp && <div className="calv-week-cost" style={{ color: col?.text }}>${assignedCamp.price}</div>}
                      <div className="calv-drill-hint">→</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── DAY VIEW ──
  if (calView === "day" && selectedWeek) {
    const wk = weekMap[selectedWeek];
    const days = getWeekDays(wk.dates);
    const assignedCamp = calAssignments[selectedWeek] ? MOCK_CAMPS.find(c => c.id === calAssignments[selectedWeek]) : null;
    const availableCamps = camps.filter(c => c.weeks.includes(selectedWeek));

    return (
      <div className="calv-content">
        <div className="calv-view-label">
          <button className="calv-breadcrumb" onClick={goBackToWeek}>← All weeks</button>
          <span className="calv-view-current">{wk.label} · {wk.dates}</span>
          <span className="calv-view-hint">Click a day for hourly detail</span>
        </div>

        {assignedCamp && (
          <div className="calv-day-assigned" style={{ borderColor: campColorMap[assignedCamp.id]?.border }}>
            <span className="calv-slot-emoji">{CAT_EMOJI[assignedCamp.category]}</span>
            <div>
              <strong>{assignedCamp.name}</strong> — {assignedCamp.program}
              <div className="calv-day-assigned-meta">{assignedCamp.hours} · ${assignedCamp.price}/wk</div>
            </div>
          </div>
        )}

        <div className="calv-day-grid">
          {days.map((day, i) => (
            <button
              key={i}
              className="calv-day-card"
              onClick={() => drillToHour(day)}
            >
              <div className="calv-day-name">{day.label}</div>
              <div className="calv-day-date">{day.date}</div>
              {assignedCamp && (
                <div className="calv-day-camp" style={{ background: campColorMap[assignedCamp.id]?.bg, color: campColorMap[assignedCamp.id]?.text }}>
                  {assignedCamp.name}
                  <span className="calv-day-camp-hours">{assignedCamp.hours}</span>
                </div>
              )}
              {!assignedCamp && availableCamps.length > 0 && (
                <div className="calv-day-avail">{availableCamps.length} camp{availableCamps.length !== 1 ? "s" : ""} available</div>
              )}
              <div className="calv-drill-hint">→</div>
            </button>
          ))}
        </div>

        {!assignedCamp && availableCamps.length > 0 && (
          <div className="calv-day-assign-section">
            <div className="calv-sidebar-title">Assign a camp to this week</div>
            <div className="calv-week-slots">
              {availableCamps.map(camp => {
                const col2 = campColorMap[camp.id];
                return (
                  <button key={camp.id} className="calv-slot" onClick={() => onAssign(selectedWeek, camp.id)}>
                    <span className="calv-slot-emoji">{CAT_EMOJI[camp.category]}</span>
                    <div className="calv-slot-info">
                      <div className="calv-slot-name">{camp.name}</div>
                      <div className="calv-slot-price">${camp.price}/wk</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── HOUR VIEW ──
  if (calView === "hour" && selectedWeek && selectedDay) {
    const wk = weekMap[selectedWeek];
    const assignedCamp = calAssignments[selectedWeek] ? MOCK_CAMPS.find(c => c.id === calAssignments[selectedWeek]) : null;
    const hours = [];
    for (let h = 7; h <= 18; h++) {
      const hour12 = h > 12 ? h - 12 : h;
      const ampm = h >= 12 ? "PM" : "AM";
      hours.push({ hour: h, label: `${hour12}:00 ${ampm}` });
    }

    const campHours = assignedCamp ? getHourBlocks(assignedCamp.hours) : [];
    const campHourSet = new Set(campHours.map(b => b.hour));
    const col = assignedCamp ? campColorMap[assignedCamp.id] : null;

    return (
      <div className="calv-content">
        <div className="calv-view-label">
          <button className="calv-breadcrumb" onClick={goBackToDay}>← {wk.label}</button>
          <span className="calv-view-current">{selectedDay.label}, {selectedDay.date}</span>
        </div>

        <div className="calv-hour-grid">
          {hours.map(({ hour, label }) => {
            const isCamp = campHourSet.has(hour);
            return (
              <div key={hour} className={`calv-hour-row${isCamp ? " calv-hour-active" : ""}`}>
                <div className="calv-hour-label">{label}</div>
                <div className="calv-hour-block" style={isCamp && col ? { background: col.bg, borderColor: col.border, color: col.text } : {}}>
                  {isCamp && assignedCamp ? (
                    <div className="calv-hour-camp">
                      <span>{CAT_EMOJI[assignedCamp.category]} {assignedCamp.name}</span>
                      {hour === campHours[0]?.hour && (
                        <span className="calv-hour-detail">{assignedCamp.program}</span>
                      )}
                    </div>
                  ) : (
                    <div className="calv-hour-free">Available</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
