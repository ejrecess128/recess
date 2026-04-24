import { useState } from "react";
import { MOCK_CAMPS, SUMMER_WEEKS } from "../data/camps";

const CAT_COLORS = {
  "Creative Arts":      { bg: "#FFF0EB", text: "#E05A2B" },
  "Sports & Athletics": { bg: "#E6F4F5", text: "#068D9D" },
  "STEM & Technology":  { bg: "#EFF6FF", text: "#2563EB" },
  "Outdoor & Adventure":{ bg: "#F0FDF4", text: "#15803D" },
  "Performing Arts":    { bg: "#F5F3FF", text: "#7C3AED" },
};

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

const CRITERIA = [
  { key: "price",    label: "Price / wk",    render: (c) => `$${c.price}`,
    check: (c, f) => c.price <= f.budget },
  { key: "age",      label: "Age range",     render: (c) => `${c.ageMin}–${c.ageMax}`,
    check: (c, f) => f.childAge >= c.ageMin && f.childAge <= c.ageMax },
  { key: "type",     label: "Day type",      render: (c) => c.type,
    check: (c, f) => f.dayType === "any" || c.type.toLowerCase().includes(f.dayType) },
  { key: "weeks",    label: "Your weeks",
    render: (c, f) => {
      if (f.weeks.length === 0) return "Any";
      const n = f.weeks.filter(w => c.weeks.includes(w)).length;
      return `${n}/${f.weeks.length} weeks`;
    },
    check: (c, f) => f.weeks.length === 0 || f.weeks.some(w => c.weeks.includes(w)) },
  { key: "avail",    label: "Availability",  render: (c) => `${c.spotsRemaining} spots`,
    check: (c) => c.spotsRemaining > 0 },
  { key: "rating",   label: "Rating",        render: (c) => `★ ${c.rating}`,
    check: (c) => c.rating >= 4.7 },
  { key: "distance", label: "Distance",      render: (c) => `${c.distance} mi`,
    check: (c) => c.distance <= 4 },
  { key: "location", label: "Location",      render: (c) => c.location,
    check: () => true },
  { key: "hours",    label: "Hours",         render: (c) => c.hours,
    check: () => true },
];

export default function ComparePage({ planIds, filters, onBack, onTogglePlan }) {
  const [view, setView] = useState("compare"); // "compare" | "calendar"
  const [calAssignments, setCalAssignments] = useState({}); // weekId -> campId
  const [exportMsg, setExportMsg] = useState(null);

  const camps = MOCK_CAMPS.filter(c => planIds.includes(c.id));

  // ── calendar helpers ──
  function assignWeek(weekId, campId) {
    setCalAssignments(prev => {
      const next = { ...prev };
      if (next[weekId] === campId) { delete next[weekId]; }
      else { next[weekId] = campId; }
      return next;
    });
  }

  const totalCost = Object.entries(calAssignments).reduce((sum, [, cid]) => {
    const camp = MOCK_CAMPS.find(c => c.id === cid);
    return sum + (camp ? camp.price : 0);
  }, 0);

  // ── export ──
  function handleExport(type) {
    const labels = {
      pdf:   "Generating PDF…",
      link:  "Link copied to clipboard!",
      email: "Plan emailed to you!",
      gcal:  "Opening Google Calendar…",
    };
    setExportMsg(labels[type]);
    setTimeout(() => setExportMsg(null), 3000);
  }

  return (
    <div className="compare-page">
      {/* ── page header ── */}
      <div className="cp-page-header">
        <div className="cp-page-header-left">
          <button className="cp-back-btn" onClick={onBack}>← Back to camps</button>
          <h1 className="cp-page-title">
            Compare camps
            <span className="cp-camp-count">{camps.length} selected</span>
          </h1>
        </div>

        <div className="cp-view-toggle">
          <button
            className={`cp-toggle-btn ${view === "compare" ? "active" : ""}`}
            onClick={() => setView("compare")}
          >
            ⊞ Comparison
          </button>
          <button
            className={`cp-toggle-btn ${view === "calendar" ? "active" : ""}`}
            onClick={() => setView("calendar")}
          >
            📅 Calendar
          </button>
        </div>

        <div className="cp-export-group">
          <button className="cp-export-btn" onClick={() => handleExport("link")}>Share link</button>
          <button className="cp-export-btn" onClick={() => handleExport("pdf")}>Export PDF</button>
        </div>
      </div>

      {exportMsg && <div className="cp-toast">{exportMsg}</div>}

      {camps.length === 0 ? (
        <div className="cp-empty-state">
          <div className="cp-empty-icon">📋</div>
          <h2>No camps selected yet</h2>
          <p>Head back to the feed and add camps using the "+ Add" button to compare them here.</p>
          <button className="cp-back-btn-lg" onClick={onBack}>Browse camps</button>
        </div>
      ) : view === "compare" ? (
        <CompareView camps={camps} filters={filters} onTogglePlan={onTogglePlan} planIds={planIds} />
      ) : (
        <CalendarView
          camps={camps}
          filters={filters}
          calAssignments={calAssignments}
          onAssign={assignWeek}
          totalCost={totalCost}
          onExport={handleExport}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   COMPARISON VIEW
═══════════════════════════════════════════ */
function CompareView({ camps, filters, onTogglePlan, planIds }) {
  return (
    <div className="cv-wrap">
      {/* left criteria column + scrollable camp columns */}
      <div className="cv-table">

        {/* sticky left column: criteria labels */}
        <div className="cv-col cv-col-labels">
          <div className="cv-header-cell cv-label-header">Your filters</div>
          {CRITERIA.map(cr => (
            <div key={cr.key} className="cv-cell cv-label-cell">
              {cr.label}
            </div>
          ))}
          <div className="cv-cell cv-label-cell cv-label-action">Actions</div>
        </div>

        {/* one column per camp */}
        {camps.map((camp, idx) => {
          const colors = CAT_COLORS[camp.category] || { bg: "#f0f0f0", text: "#666" };
          const inPlan = planIds.includes(camp.id);
          return (
            <div key={camp.id} className={`cv-col cv-col-camp ${idx === 0 ? "cv-col-first" : ""}`}>
              {/* camp header card */}
              <div className="cv-header-cell cv-camp-header">
                <div className="cv-camp-emoji-wrap" style={{ background: colors.bg }}>
                  <span className="cv-camp-emoji">{CAT_EMOJI[camp.category]}</span>
                </div>
                <div className="cv-camp-tag" style={{ background: colors.bg, color: colors.text }}>
                  {camp.category}
                </div>
                <div className="cv-camp-name">{camp.name}</div>
                <div className="cv-camp-program">{camp.program}</div>
                <div className="cv-camp-provider">{camp.provider}</div>
                {camp.image && (
                  <img
                    src={camp.image}
                    alt={camp.name}
                    className="cv-camp-img"
                    onError={e => { e.target.style.display = "none"; }}
                  />
                )}
              </div>

              {/* criteria cells */}
              {CRITERIA.map(cr => {
                const passes = cr.check(camp, filters);
                return (
                  <div key={cr.key} className={`cv-cell cv-data-cell ${passes ? "cv-pass" : "cv-fail"}`}>
                    <span className={`cv-check-icon ${passes ? "pass" : "fail"}`}>
                      {passes ? "✓" : "✗"}
                    </span>
                    <span className="cv-data-val">{cr.render(camp, filters)}</span>
                  </div>
                );
              })}

              {/* action row */}
              <div className="cv-cell cv-action-cell">
                <button
                  className={`add-btn ${inPlan ? "added" : ""}`}
                  onClick={() => onTogglePlan(camp.id)}
                >
                  {inPlan ? "✓ In plan" : "+ Add to plan"}
                </button>
                {camp.highlights.map(h => (
                  <span key={h} className="highlight-tag" style={{ marginTop: 4 }}>{h}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CALENDAR VIEW
═══════════════════════════════════════════ */
const CAMP_COLORS = [
  { bg: "#E6F4F5", border: "#068D9D", text: "#056B76" },
  { bg: "#EFF6FF", border: "#003DA5", text: "#002D7A" },
  { bg: "#FFF0EB", border: "#E05A2B", text: "#B8421A" },
  { bg: "#F5F3FF", border: "#7C3AED", text: "#5B21B6" },
];

function CalendarView({ camps, filters, calAssignments, onAssign, totalCost, onExport }) {
  const weekMap = Object.fromEntries(SUMMER_WEEKS.map(w => [w.id, w]));
  const campColorMap = Object.fromEntries(camps.map((c, i) => [c.id, CAMP_COLORS[i % CAMP_COLORS.length]]));

  return (
    <div className="calv-wrap">
      {/* left: filter summary */}
      <div className="calv-sidebar">
        <div className="calv-sidebar-section">
          <div className="calv-sidebar-title">Your criteria</div>
          <div className="calv-sidebar-row"><span>Age</span><strong>{filters.childAge} yrs</strong></div>
          <div className="calv-sidebar-row"><span>Budget</span><strong>${filters.budget}/wk</strong></div>
          <div className="calv-sidebar-row"><span>Day type</span><strong>{filters.dayType === "any" ? "Any" : filters.dayType}</strong></div>
          {filters.weeks.length > 0 && (
            <div className="calv-sidebar-row"><span>Weeks</span><strong>{filters.weeks.length} selected</strong></div>
          )}
        </div>

        <div className="calv-sidebar-section">
          <div className="calv-sidebar-title">Camps</div>
          {camps.map((c, i) => {
            const col = campColorMap[c.id];
            const weeksBooked = Object.entries(calAssignments).filter(([, cid]) => cid === c.id).length;
            return (
              <div key={c.id} className="calv-camp-legend">
                <div className="calv-legend-dot" style={{ background: col.border }} />
                <div>
                  <div className="calv-legend-name">{c.name}</div>
                  <div className="calv-legend-meta">${c.price}/wk · {weeksBooked} week{weeksBooked !== 1 ? "s" : ""} planned</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="calv-sidebar-section calv-totals">
          <div className="calv-total-row">
            <span>Total planned</span>
            <span className="calv-total-cost">${totalCost.toLocaleString()}</span>
          </div>
          <div className="calv-total-row calv-total-sub">
            <span>Weeks scheduled</span>
            <span>{Object.keys(calAssignments).length}</span>
          </div>
        </div>

        <div className="calv-export-section">
          <button className="book-btn" onClick={() => onExport("gcal")}>Add to Google Calendar</button>
          <button className="share-btn" onClick={() => onExport("link")}>Share with co-parent</button>
          <button className="share-btn" onClick={() => onExport("pdf")}>Export as PDF</button>
        </div>

        <div className="plan-tip">
          <span>💡</span>
          <span>Most Austin families book 4–6 weeks per child. Click any week to assign a camp.</span>
        </div>
      </div>

      {/* right: calendar grid */}
      <div className="calv-grid">
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
                  <div key={wid} className={`calv-week-row ${isUserWeek ? "calv-week-selected" : ""}`}>
                    <div className="calv-week-label">
                      <div className="calv-week-id">{wk.label}</div>
                      <div className="calv-week-dates">{wk.dates}</div>
                    </div>

                    <div className="calv-week-slots">
                      {availableCamps.length === 0 ? (
                        <div className="calv-slot calv-slot-empty">No camps available this week</div>
                      ) : (
                        availableCamps.map(camp => {
                          const isAssigned = calAssignments[wid] === camp.id;
                          const col2 = campColorMap[camp.id];
                          return (
                            <button
                              key={camp.id}
                              className={`calv-slot ${isAssigned ? "calv-slot-active" : ""}`}
                              style={isAssigned ? { background: col2.bg, borderColor: col2.border, color: col2.text } : {}}
                              onClick={() => onAssign(wid, camp.id)}
                            >
                              <span className="calv-slot-emoji">{CAT_EMOJI[camp.category]}</span>
                              <div className="calv-slot-info">
                                <div className="calv-slot-name">{camp.name}</div>
                                <div className="calv-slot-price">${camp.price}/wk</div>
                              </div>
                              {isAssigned && <span className="calv-slot-check">✓</span>}
                            </button>
                          );
                        })
                      )}
                    </div>

                    {isUserWeek && !assignedCamp && (
                      <div className="calv-week-flag">📌 your week</div>
                    )}
                    {assignedCamp && (
                      <div className="calv-week-cost" style={{ color: col?.text }}>
                        ${assignedCamp.price}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
