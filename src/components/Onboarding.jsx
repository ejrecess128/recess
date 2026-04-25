import { useState } from "react";
import { CAMP_CATEGORIES, SUMMER_WEEKS } from "../data/camps";

const INTERESTS = [
  { key: CAMP_CATEGORIES.SPORTS, label: "Sports & Athletics", icon: "⚽", examples: "Soccer, Swimming, Basketball, Tennis" },
  { key: CAMP_CATEGORIES.ARTS, label: "Creative Arts", icon: "🎨", examples: "Painting, Theater, Music, Dance" },
  { key: CAMP_CATEGORIES.STEM, label: "STEM & Technology", icon: "🤖", examples: "Coding, Robotics, Science, Engineering" },
  { key: CAMP_CATEGORIES.OUTDOOR, label: "Outdoor & Adventure", icon: "🌲", examples: "Nature, Camping, Hiking" },
  { key: CAMP_CATEGORIES.PERFORMING, label: "Performing Arts", icon: "🎭", examples: "Acting, Dance, Music Performance" },
];

const WEEK_GROUPS = [
  { label: "June", weeks: ["w1", "w2", "w3", "w4"] },
  { label: "July", weeks: ["w5", "w6", "w7", "w8"] },
  { label: "August", weeks: ["w9", "w10"] },
];

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
              <p className="ob-hint">Most Austin families book 4-6 weeks of camp</p>
              <div className="ob-calendar">
                {WEEK_GROUPS.map((group) => (
                  <div key={group.label} className="ob-cal-month">
                    <div className="ob-cal-month-label">{group.label}</div>
                    <div className="ob-cal-weeks">
                      {group.weeks.map((wid) => {
                        const wk = SUMMER_WEEKS.find((w) => w.id === wid);
                        const selected = weeks.includes(wid);
                        return (
                          <button
                            key={wid}
                            className={`ob-cal-week ${selected ? "selected" : ""}`}
                            onClick={() => toggleWeek(wid)}
                          >
                            <span className="ob-cal-week-num">{wk.label.replace("Week ", "W")}</span>
                            <span className="ob-cal-week-dates">{wk.dates}</span>
                            {selected && <span className="ob-cal-check">&#10003;</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
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
