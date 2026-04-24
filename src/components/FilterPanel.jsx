import { CAMP_CATEGORIES, SUMMER_WEEKS } from "../data/camps";

const CATEGORIES = Object.values(CAMP_CATEGORIES);

const CAT_ICONS = {
  "Creative Arts": "🎨",
  "Sports & Athletics": "⚽",
  "STEM & Technology": "🤖",
  "Outdoor & Adventure": "🌲",
  "Performing Arts": "🎭",
};

const WEEK_GROUPS = [
  { label: "June", weeks: ["w1", "w2", "w3", "w4"] },
  { label: "July", weeks: ["w5", "w6", "w7", "w8"] },
  { label: "August", weeks: ["w9", "w10"] },
];

export default function FilterPanel({ filters, setFilters }) {
  const set = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

  const toggleWeek = (wid) => {
    set(
      "weeks",
      filters.weeks.includes(wid)
        ? filters.weeks.filter((w) => w !== wid)
        : [...filters.weeks, wid]
    );
  };

  const toggleCat = (cat) => {
    set(
      "categories",
      filters.categories.includes(cat)
        ? filters.categories.filter((c) => c !== cat)
        : [...filters.categories, cat]
    );
  };

  return (
    <aside className="filter-panel">
      <div className="filter-section">
        <h3 className="filter-label">Child's Age</h3>
        <div className="age-display">
          <span className="age-number">{filters.childAge}</span>
          <span className="age-unit">yrs</span>
        </div>
        <input
          className="slider"
          type="range"
          min={4}
          max={16}
          value={filters.childAge}
          onChange={(e) => set("childAge", Number(e.target.value))}
        />
        <div className="slider-labels">
          <span>4</span>
          <span>16</span>
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-label">Max Weekly Budget</h3>
        <div className="age-display">
          <span className="age-number">${filters.budget}</span>
        </div>
        <input
          className="slider"
          type="range"
          min={150}
          max={600}
          step={25}
          value={filters.budget}
          onChange={(e) => set("budget", Number(e.target.value))}
        />
        <div className="slider-labels">
          <span>$150</span>
          <span>$600</span>
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-label">Interests</h3>
        <div className="cat-grid">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`cat-chip ${filters.categories.includes(cat) ? "active" : ""}`}
              onClick={() => toggleCat(cat)}
            >
              <span className="cat-icon">{CAT_ICONS[cat]}</span>
              <span className="cat-name">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-label">Camp Schedule</h3>
        {WEEK_GROUPS.map((group) => (
          <div key={group.label} className="week-group">
            <span className="week-month">{group.label}</span>
            <div className="week-chips">
              {group.weeks.map((wid) => {
                const wk = SUMMER_WEEKS.find((w) => w.id === wid);
                return (
                  <button
                    key={wid}
                    className={`week-chip ${filters.weeks.includes(wid) ? "active" : ""}`}
                    onClick={() => toggleWeek(wid)}
                    title={wk?.dates}
                  >
                    {wk?.label.replace("Week ", "W")}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {filters.weeks.length > 0 && (
          <button className="clear-weeks" onClick={() => set("weeks", [])}>
            Clear weeks
          </button>
        )}
      </div>

      <div className="filter-section">
        <h3 className="filter-label">Day Type</h3>
        <div className="day-type-group">
          {["any", "full", "half"].map((opt) => (
            <button
              key={opt}
              className={`day-chip ${filters.dayType === opt ? "active" : ""}`}
              onClick={() => set("dayType", opt)}
            >
              {opt === "any" ? "Any" : opt === "full" ? "Full Day" : "Half Day"}
            </button>
          ))}
        </div>
      </div>

      <button
        className="reset-btn"
        onClick={() =>
          setFilters({
            childAge: 8,
            budget: 400,
            weeks: [],
            categories: [],
            dayType: "any",
          })
        }
      >
        Reset Filters
      </button>
    </aside>
  );
}
