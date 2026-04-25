import { useState } from "react";
import { CAMP_CATEGORIES, SUMMER_WEEKS } from "../data/camps";

const CHILD_COLORS = ["#003DA5", "#068D9D", "#E05A2B", "#7C3AED"];

const INTERESTS = [
  { key: CAMP_CATEGORIES.SPORTS, label: "Sports & Athletics", icon: "⚽", examples: "Soccer, Swimming, Basketball, Tennis" },
  { key: CAMP_CATEGORIES.ARTS, label: "Creative Arts", icon: "🎨", examples: "Painting, Theater, Music, Dance" },
  { key: CAMP_CATEGORIES.STEM, label: "STEM & Technology", icon: "🤖", examples: "Coding, Robotics, Science, Engineering" },
  { key: CAMP_CATEGORIES.OUTDOOR, label: "Outdoor & Adventure", icon: "🌲", examples: "Nature, Camping, Hiking" },
  { key: CAMP_CATEGORIES.PERFORMING, label: "Performing Arts", icon: "🎭", examples: "Acting, Dance, Music Performance" },
  { key: "Multi-Activity", label: "Multi-Activity", icon: "🌈", examples: "Mixed programs, variety camps, rotating activities" },
];

// Build actual calendar dates for summer 2025
const SUMMER_CALENDAR = [
  {
    month: "June", year: 2025, startDay: 0, totalDays: 30,
    weeks: [
      { id: "w1", startDate: 9, endDate: 13 },
      { id: "w2", startDate: 16, endDate: 20 },
      { id: "w3", startDate: 23, endDate: 27 },
      { id: "w4", startDate: 30, endDate: 30 },
    ],
  },
  {
    month: "July", year: 2025, startDay: 2, totalDays: 31,
    weeks: [
      { id: "w4", startDate: 1, endDate: 4 },
      { id: "w5", startDate: 7, endDate: 11 },
      { id: "w6", startDate: 14, endDate: 18 },
      { id: "w7", startDate: 21, endDate: 25 },
      { id: "w8", startDate: 28, endDate: 31 },
    ],
  },
  {
    month: "August", year: 2025, startDay: 5, totalDays: 31,
    weeks: [
      { id: "w8", startDate: 1, endDate: 1 },
      { id: "w9", startDate: 4, endDate: 8 },
      { id: "w10", startDate: 11, endDate: 15 },
    ],
  },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function WeekCalendar({ weeks, toggleWeek }) {
  function getWeekId(monthData, day) {
    for (const w of monthData.weeks) {
      if (day >= w.startDate && day <= w.endDate) return w.id;
    }
    return null;
  }

  return (
    <div className="wcal">
      {SUMMER_CALENDAR.map((m) => {
        const cells = [];
        for (let i = 0; i < m.startDay; i++) cells.push({ type: "empty", key: `e${i}` });
        for (let d = 1; d <= m.totalDays; d++) {
          cells.push({ type: "day", day: d, weekId: getWeekId(m, d), key: `d${d}` });
        }
        const monthWeekIds = [...new Set(m.weeks.map(w => w.id))];

        return (
          <div key={m.month} className="wcal-month">
            <div className="wcal-month-head">
              <span className="wcal-month-name">{m.month} {m.year}</span>
              <div className="wcal-month-actions">
                {monthWeekIds.map(wid => {
                  const wk = SUMMER_WEEKS.find(w => w.id === wid);
                  const selected = weeks.includes(wid);
                  return (
                    <button key={wid} className={`wcal-week-toggle${selected ? " selected" : ""}`} onClick={() => toggleWeek(wid)}>
                      <span className={`wcal-checkbox${selected ? " checked" : ""}`}>
                        {selected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </span>
                      {wk?.label.replace("Week ", "W")}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="wcal-grid">
              {DAY_LABELS.map(d => <div key={d} className="wcal-dayhead">{d}</div>)}
              {cells.map(cell => {
                if (cell.type === "empty") return <div key={cell.key} className="wcal-cell wcal-cell--empty" />;
                const isInWeek = cell.weekId !== null;
                const isSelected = cell.weekId && weeks.includes(cell.weekId);
                const dayOfWeek = (m.startDay + cell.day - 1) % 7;
                const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
                return (
                  <div key={cell.key}
                    className={`wcal-cell${isInWeek ? " wcal-cell--camp" : ""}${isSelected ? " wcal-cell--selected" : ""}${isWeekendDay ? " wcal-cell--weekend" : ""}`}
                    onClick={cell.weekId ? () => toggleWeek(cell.weekId) : undefined}
                    style={cell.weekId ? { cursor: "pointer" } : undefined}
                  >
                    <span className="wcal-day">{cell.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function makeChild(index) {
  return { id: Date.now() + index, name: "", age: 8, interests: [], color: CHILD_COLORS[index % CHILD_COLORS.length] };
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);

  // Step 1: children + household
  const [children, setChildren] = useState([makeChild(0)]);
  const [zipCode, setZipCode] = useState("");
  const [commuteTime, setCommuteTime] = useState(30);

  // Step 2: schedule + budget (shared across children)
  const [weeks, setWeeks] = useState([]);
  const [dayType, setDayType] = useState("any");
  const [budget, setBudget] = useState(400);

  const updateChild = (id, field, value) => {
    setChildren(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const toggleChildInterest = (id, key) => {
    setChildren(prev => prev.map(c => {
      if (c.id !== id) return c;
      const interests = c.interests.includes(key)
        ? c.interests.filter(k => k !== key)
        : [...c.interests, key];
      return { ...c, interests };
    }));
  };

  const addChild = () => {
    if (children.length < 4) {
      setChildren(prev => [...prev, makeChild(prev.length)]);
    }
  };

  const removeChild = (id) => {
    if (children.length > 1) {
      setChildren(prev => prev.filter(c => c.id !== id));
    }
  };

  const toggleWeek = (wid) => {
    setWeeks(prev => prev.includes(wid) ? prev.filter(w => w !== wid) : [...prev, wid]);
  };

  const handleFinish = () => {
    onComplete({
      children: children.map((c, i) => ({
        id: c.id,
        name: c.name || `Child ${i + 1}`,
        age: c.age,
        interests: c.interests,
        color: c.color,
      })),
      zipCode,
      commuteTime,
      weeks,
      dayType,
      budget,
    });
  };

  return (
    <div className="onboarding">
      <div className="ob-container">
        <div className="ob-progress">
          <div className="ob-progress-bar">
            <div className="ob-progress-fill" style={{ width: step === 1 ? "50%" : "100%" }} />
          </div>
          <div className="ob-steps">
            <span className={`ob-step-label ${step >= 1 ? "active" : ""}`}>Family setup</span>
            <span className={`ob-step-label ${step >= 2 ? "active" : ""}`}>Schedule & budget</span>
          </div>
        </div>

        {step === 1 && (
          <div className="ob-step">
            <div className="ob-header">
              <h1 className="ob-title">Tell us about your campers</h1>
              <p className="ob-subtitle">
                We'll use this to find camps that are the perfect fit for each child.
              </p>
            </div>

            {/* Children cards */}
            <div className="ob-children">
              {children.map((child, idx) => (
                <div key={child.id} className="ob-child-card" style={{ borderColor: child.color }}>
                  <div className="ob-child-card-head">
                    <div className="ob-child-dot" style={{ background: child.color }} />
                    <span className="ob-child-label">{child.name || `Child ${idx + 1}`}</span>
                    {children.length > 1 && (
                      <button className="ob-child-remove" onClick={() => removeChild(child.id)}>×</button>
                    )}
                  </div>

                  <div className="ob-child-fields">
                    <div className="ob-child-row">
                      <div className="ob-field" style={{ flex: 1 }}>
                        <label className="ob-label">Name</label>
                        <input
                          className="ob-input"
                          type="text"
                          placeholder={`e.g. ${idx === 0 ? "Emma" : idx === 1 ? "Lucas" : "Sofia"}`}
                          value={child.name}
                          onChange={(e) => updateChild(child.id, "name", e.target.value)}
                        />
                      </div>
                      <div className="ob-field" style={{ width: 120 }}>
                        <label className="ob-label">Age</label>
                        <div className="ob-child-age">
                          <span className="ob-child-age-num" style={{ color: child.color }}>{child.age}</span>
                          <input
                            className="ob-slider"
                            type="range" min={4} max={16}
                            value={child.age}
                            onChange={(e) => updateChild(child.id, "age", Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="ob-field">
                      <label className="ob-label">Interests</label>
                      <div className="ob-interest-grid ob-interest-grid--compact">
                        {INTERESTS.map((item) => (
                          <button
                            key={item.key}
                            className={`ob-interest-chip${child.interests.includes(item.key) ? " selected" : ""}`}
                            onClick={() => toggleChildInterest(child.id, item.key)}
                            style={child.interests.includes(item.key) ? { borderColor: child.color, background: `${child.color}0A` } : {}}
                          >
                            <span className="ob-interest-chip-icon">{item.icon}</span>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {children.length < 4 && (
                <button className="ob-add-child" onClick={addChild}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  Add another child
                </button>
              )}
            </div>

            <div className="ob-fields" style={{ marginTop: 24 }}>
              <div className="ob-child-row">
                <div className="ob-field" style={{ flex: 1 }}>
                  <label className="ob-label">Zip code</label>
                  <input
                    className="ob-input ob-input-short"
                    type="text" placeholder="e.g. 78704"
                    value={zipCode} onChange={(e) => setZipCode(e.target.value)} maxLength={5}
                  />
                </div>
                <div className="ob-field" style={{ flex: 1 }}>
                  <label className="ob-label">Max commute</label>
                  <select className="ob-input ob-input-short" value={commuteTime} onChange={(e) => setCommuteTime(Number(e.target.value))}>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={75}>1 hr 15 min</option>
                    <option value={90}>1 hr 30 min</option>
                    <option value={105}>1 hr 45 min</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="ob-actions">
              <button className="ob-btn-primary" onClick={() => setStep(2)}>Continue</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="ob-step">
            <div className="ob-header">
              <h1 className="ob-title">Build your summer schedule</h1>
              <p className="ob-subtitle">
                Select the weeks you need camp coverage and set your budget.
              </p>
            </div>

            <div className="ob-section">
              <label className="ob-label">Which weeks do you need?</label>
              <p className="ob-hint">Most Austin families book 4-6 weeks of camp. Click weeks to select them.</p>
              <WeekCalendar weeks={weeks} toggleWeek={toggleWeek} />
              {weeks.length > 0 && (
                <div className="ob-weeks-summary">
                  {weeks.length} week{weeks.length !== 1 ? "s" : ""} selected
                </div>
              )}
            </div>

            <div className="ob-row-fields">
              <div className="ob-field" style={{ flex: 1 }}>
                <label className="ob-label">Day preference</label>
                <div className="ob-day-group">
                  {[{ value: "any", label: "Any" }, { value: "full", label: "Full day" }, { value: "half", label: "Half day" }].map((opt) => (
                    <button key={opt.value} className={`ob-day-chip ${dayType === opt.value ? "selected" : ""}`} onClick={() => setDayType(opt.value)}>{opt.label}</button>
                  ))}
                </div>
              </div>
              <div className="ob-field" style={{ flex: 1 }}>
                <label className="ob-label">Weekly budget (per child)</label>
                <div className="ob-budget-display">${budget}<span className="ob-budget-unit">/week</span></div>
                <input className="ob-slider" type="range" min={150} max={600} step={25} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
                <div className="ob-slider-labels"><span>$150</span><span>$600</span></div>
              </div>
            </div>

            {/* Summary */}
            <div className="ob-summary-card">
              <div className="ob-summary-title">Your plan so far</div>
              <div className="ob-summary-family">
                {children.map((c, i) => (
                  <div key={c.id} className="ob-summary-child">
                    <div className="ob-child-dot" style={{ background: c.color }} />
                    <span className="ob-summary-child-name">{c.name || `Child ${i + 1}`}</span>
                    <span className="ob-summary-child-age">{c.age} yrs</span>
                  </div>
                ))}
              </div>
              <div className="ob-summary-grid">
                <div className="ob-summary-item">
                  <span className="ob-summary-val">{children.length}</span>
                  <span className="ob-summary-key">{children.length === 1 ? "Child" : "Children"}</span>
                </div>
                <div className="ob-summary-item">
                  <span className="ob-summary-val">{weeks.length} weeks</span>
                  <span className="ob-summary-key">Coverage</span>
                </div>
                <div className="ob-summary-item">
                  <span className="ob-summary-val">${budget * children.length * (weeks.length || 1)}</span>
                  <span className="ob-summary-key">Est. total</span>
                </div>
              </div>
            </div>

            <div className="ob-actions">
              <button className="ob-btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button className="ob-btn-primary" onClick={handleFinish}>
                Find camps{children.length > 1 ? ` for ${children.length} kids` : children[0].name ? ` for ${children[0].name}` : ""}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
