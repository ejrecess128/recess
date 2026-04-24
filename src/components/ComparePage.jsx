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

export default function ComparePage({ planIds, filters, onBack, onTogglePlan, cartIds, toggleCart }) {
  const [view, setView] = useState("compare");
  const [calAssignments, setCalAssignments] = useState({});
  const [exportMsg, setExportMsg] = useState(null);

  const camps = MOCK_CAMPS.filter(c => planIds.includes(c.id));
  const cartCamps = MOCK_CAMPS.filter(c => cartIds.includes(c.id));
  const cartTotal = cartCamps.reduce((sum, c) => sum + c.price, 0);

  function assignWeek(weekId, campId) {
    setCalAssignments(prev => {
      const next = { ...prev };
      if (next[weekId] === campId) delete next[weekId];
      else next[weekId] = campId;
      return next;
    });
  }

  function handleExport(type) {
    const labels = {
      pdf: "Generating PDF…", link: "Link copied to clipboard!",
      email: "Plan emailed to you!", gcal: "Opening Google Calendar…",
    };
    setExportMsg(labels[type]);
    setTimeout(() => setExportMsg(null), 3000);
  }

  return (
    <div className="compare-page">
      {/* Top bar */}
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

      {/* Main layout: content left, cart right */}
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
            <CalendarView
              camps={camps}
              filters={filters}
              calAssignments={calAssignments}
              onAssign={assignWeek}
              onExport={handleExport}
            />
          )}
        </div>

        {/* Persistent cart sidebar */}
        <aside className="cp-cart">
          <div className="cp-cart-header">
            <span className="cp-cart-title">Your cart</span>
            <span className="cp-cart-count">{cartCamps.length}</span>
          </div>

          {cartCamps.length === 0 ? (
            <div className="cp-cart-empty">
              <p>No camps in cart yet.</p>
              <p className="cp-cart-hint">Add camps from the feed to see your total here.</p>
            </div>
          ) : (
            <>
              <div className="cp-cart-items">
                {cartCamps.map(camp => (
                  <div key={camp.id} className="cp-cart-item">
                    <div className="cp-cart-item-info">
                      <span className="cp-cart-item-name">{camp.name}</span>
                      <span className="cp-cart-item-detail">{camp.program}</span>
                    </div>
                    <div className="cp-cart-item-right">
                      <span className="cp-cart-item-price">${camp.price}/wk</span>
                      <button className="cp-cart-item-remove" onClick={() => toggleCart(camp.id)} title="Remove">×</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cp-cart-totals">
                <div className="cp-cart-total-row">
                  <span>Weekly total</span>
                  <span className="cp-cart-total-amount">${cartTotal}</span>
                </div>
                <div className="cp-cart-total-row cp-cart-total-sub">
                  <span>{filters.weeks.length || 1} week{(filters.weeks.length || 1) !== 1 ? "s" : ""} planned</span>
                  <span>${cartTotal * (filters.weeks.length || 1)}</span>
                </div>
              </div>

              <button className="cp-cart-checkout">Proceed to booking</button>
            </>
          )}

          <div className="cp-cart-tip">
            <span>💡</span>
            <span>You can always change this plan later.</span>
          </div>
        </aside>
      </div>
    </div>
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
   CALENDAR VIEW
═══════════════════════════════════════════ */
const CAMP_COLORS = [
  { bg: "#E6F4F5", border: "#068D9D", text: "#056B76" },
  { bg: "#EFF6FF", border: "#003DA5", text: "#002D7A" },
  { bg: "#FFF0EB", border: "#E05A2B", text: "#B8421A" },
  { bg: "#F5F3FF", border: "#7C3AED", text: "#5B21B6" },
];

function CalendarView({ camps, filters, calAssignments, onAssign, onExport }) {
  const weekMap = Object.fromEntries(SUMMER_WEEKS.map(w => [w.id, w]));
  const campColorMap = Object.fromEntries(camps.map((c, i) => [c.id, CAMP_COLORS[i % CAMP_COLORS.length]]));

  return (
    <div className="calv-content">
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
                      <div className="calv-slot calv-slot-empty">No camps available</div>
                    ) : availableCamps.map(camp => {
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
                    })}
                  </div>
                  {isUserWeek && !assignedCamp && <div className="calv-week-flag">your week</div>}
                  {assignedCamp && <div className="calv-week-cost" style={{ color: col?.text }}>${assignedCamp.price}</div>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
