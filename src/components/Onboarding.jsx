import { useState } from "react";
import { CAMP_CATEGORIES, SUMMER_WEEKS } from "../data/camps";

const INTERESTS = [
  { key: CAMP_CATEGORIES.SPORTS, label: "Sports & Athletics", icon: "⚽", examples: "Soccer, Swimming, Basketball, Tennis" },
  { key: CAMP_CATEGORIES.ARTS, label: "Creative Arts", icon: "🎨", examples: "Painting, Theater, Music, Dance" },
  { key: CAMP_CATEGORIES.STEM, label: "STEM & Technology", icon: "🤖", examples: "Coding, Robotics, Science, Engineering" },
  { key: CAMP_CATEGORIES.OUTDOOR, label: "Outdoor & Adventure", icon: "🌲", examples: "Nature, Camping, Hiking" },
  { key: CAMP_CATEGORIES.PERFORMING, label: "Performing Arts", icon: "🎭", examples: "Acting, Dance, Music Performance" },
  { key: "Multi-Activity", label: "Multi-Activity", icon: "🌈", examples: "Mixed programs, variety camps, rotating activities" },
];

const WEEK_GROUPS = [
  { label: "June", weeks: ["w1", "w2", "w3", "w4"] },
  { label: "July", weeks: ["w5", "w6", "w7", "w8"] },
  { label: "August", weeks: ["w9", "w10"] },
];

// Build actual calendar dates for summer 2025
const SUMMER_CALENDAR = [
  {
    month: "June", year: 2025,
    // June 2025 starts on Sunday (day 0)
    startDay: 0, // 0=Sun
    totalDays: 30,
    weeks: [
      { id: "w1", startDate: 9, endDate: 13 },
      { id: "w2", startDate: 16, endDate: 20 },
      { id: "w3", startDate: 23, endDate: 27 },
      { id: "w4", startDate: 30, endDate: 30 }, // crosses into July
    ],
  },
  {
    month: "July", year: 2025,
    startDay: 2, // Tuesday
    totalDays: 31,
    weeks: [
      { id: "w4", startDate: 1, endDate: 4 }, // continued from June
      { id: "w5", startDate: 7, endDate: 11 },
      { id: "w6", startDate: 14, endDate: 18 },
      { id: "w7", startDate: 21, endDate: 25 },
      { id: "w8", startDate: 28, endDate: 31 },
    ],
  },
  {
    month: "August", year: 2025,
    startDay: 5, // Friday
    totalDays: 31,
    weeks: [
      { id: "w8", startDate: 1, endDate: 1 }, // continued from July
      { id: "w9", startDate: 4, endDate: 8 },
      { id: "w10", startDate: 11, endDate: 15 },
    ],
  },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function WeekCalendar({ weeks, toggleWeek }) {
  // Map each day to which camp week it belongs to
  function getWeekId(monthData, day) {
    for (const w of monthData.weeks) {
      if (day >= w.startDate && day <= w.endDate) return w.id;
    }
    return null;
  }

  return (
    <div className="wcal">
      {SUMMER_CALENDAR.map((m) => {
        // Build grid cells: leading empties + actual days
        const cells = [];
        for (let i = 0; i < m.startDay; i++) {
          cells.push({ type: "empty", key: `e${i}` });
        }
        for (let d = 1; d <= m.totalDays; d++) {
          const weekId = getWeekId(m, d);
          cells.push({ type: "day", day: d, weekId, key: `d${d}` });
        }

        // Find which week IDs appear in this month (deduplicated)
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
                    <button
                      key={wid}
                      className={`wcal-week-toggle${selected ? " selected" : ""}`}
                      onClick={() => toggleWeek(wid)}
                    >
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
              {DAY_LABELS.map(d => (
                <div key={d} className="wcal-dayhead">{d}</div>
              ))}
              {cells.map(cell => {
                if (cell.type === "empty") {
                  return <div key={cell.key} className="wcal-cell wcal-cell--empty" />;
                }
                const isInWeek = cell.weekId !== null;
                const isSelected = cell.weekId && weeks.includes(cell.weekId);
                const isWeekend = false; // all camp days are weekdays
                const dayOfWeek = (m.startDay + cell.day - 1) % 7;
                const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;

                return (
                  <div
                    key={cell.key}
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

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);

  // Step 1 state
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState(8);
  const [zipCode, setZipCode] = useState("");
  const [commuteTime, setCommuteTime] = useState(30);
  const [interests, setInterests] = useState([]);

  // Step 2 state
  const [weeks, setWeeks] = useState([]);
  const [dayType, setDayType] = useState("any");
  const [budget, setBudget] = useState(400);

  const toggleInterest = (key) => {
    setInterests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleWeek = (wid) => {
    setWeeks((prev) =>
      prev.includes(wid) ? prev.filter((w) => w !== wid) : [...prev, wid]
    );
  };

  const handleFinish = () => {
    onComplete({
      childName: childName || "Your child",
      childAge,
      zipCode,
      commuteTime,
      categories: interests,
      weeks,
      dayType,
      budget,
    });
  };

  const canAdvance = step === 1 ? childAge > 0 : true;

  return (
    <div className="onboarding">
      <div className="ob-container">
        {/* Progress */}
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
              <h1 className="ob-title">Tell us about your camper</h1>
              <p className="ob-subtitle">
                We'll use this to find camps that are the perfect fit. Takes about a minute.
              </p>
            </div>

            <div className="ob-fields">
              <div className="ob-field">
                <label className="ob-label">Child's name</label>
                <input
                  className="ob-input"
                  type="text"
                  placeholder="e.g. Emma"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                />
              </div>

              <div className="ob-field">
                <label className="ob-label">Age</label>
                <div className="ob-age-row">
                  <div className="ob-age-display">
                    <span className="ob-age-number">{childAge}</span>
                    <span className="ob-age-unit">years old</span>
                  </div>
                  <input
                    className="ob-slider"
                    type="range"
                    min={4}
                    max={16}
                    value={childAge}
                    onChange={(e) => setChildAge(Number(e.target.value))}
                  />
                  <div className="ob-slider-labels">
                    <span>4</span>
                    <span>16</span>
                  </div>
                </div>
              </div>

              <div className="ob-field">
                <label className="ob-label">Zip code</label>
                <input
                  className="ob-input ob-input-short"
                  type="text"
                  placeholder="e.g. 78704"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  maxLength={5}
                />
              </div>

              <div className="ob-field">
                <label className="ob-label">How far are you willing to commute?</label>
                <select
                  className="ob-input ob-input-short"
                  value={commuteTime}
                  onChange={(e) => setCommuteTime(Number(e.target.value))}
                >
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

            <div className="ob-section">
              <label className="ob-label">What are they into?</label>
              <p className="ob-hint">Select all that interest them — you can always change this later</p>
              <div className="ob-interest-grid">
                {INTERESTS.map((item) => (
                  <button
                    key={item.key}
                    className={`ob-interest-card ${interests.includes(item.key) ? "selected" : ""}`}
                    onClick={() => toggleInterest(item.key)}
                  >
                    <span className="ob-interest-icon">{item.icon}</span>
                    <span className="ob-interest-name">{item.label}</span>
                    <span className="ob-interest-examples">{item.examples}</span>
                    {interests.includes(item.key) && (
                      <span className="ob-interest-check">&#10003;</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="ob-actions">
              <button className="ob-btn-primary" onClick={() => setStep(2)} disabled={!canAdvance}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="ob-step">
            <div className="ob-header">
              <h1 className="ob-title">Build your summer schedule</h1>
              <p className="ob-subtitle">
                Select the weeks you need camp coverage and set your budget.
                {childName && <> We'll find the best options for {childName}.</>}
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
                  {[
                    { value: "any", label: "Any" },
                    { value: "full", label: "Full day" },
                    { value: "half", label: "Half day" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      className={`ob-day-chip ${dayType === opt.value ? "selected" : ""}`}
                      onClick={() => setDayType(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ob-field" style={{ flex: 1 }}>
                <label className="ob-label">Weekly budget</label>
                <div className="ob-budget-display">${budget}<span className="ob-budget-unit">/week</span></div>
                <input
                  className="ob-slider"
                  type="range"
                  min={150}
                  max={600}
                  step={25}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                />
                <div className="ob-slider-labels">
                  <span>$150</span>
                  <span>$600</span>
                </div>
              </div>
            </div>

            {/* Live summary */}
            <div className="ob-summary-card">
              <div className="ob-summary-title">Your plan so far</div>
              <div className="ob-summary-grid">
                <div className="ob-summary-item">
                  <span className="ob-summary-val">{childName || "Your child"}</span>
                  <span className="ob-summary-key">Camper</span>
                </div>
                <div className="ob-summary-item">
                  <span className="ob-summary-val">{childAge} yrs</span>
                  <span className="ob-summary-key">Age</span>
                </div>
                <div className="ob-summary-item">
                  <span className="ob-summary-val">{weeks.length} weeks</span>
                  <span className="ob-summary-key">Coverage</span>
                </div>
                <div className="ob-summary-item">
                  <span className="ob-summary-val">${budget * (weeks.length || 1)}</span>
                  <span className="ob-summary-key">Est. total</span>
                </div>
              </div>
            </div>

            <div className="ob-actions">
              <button className="ob-btn-secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="ob-btn-primary" onClick={handleFinish}>
                Find camps for {childName || "my child"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
