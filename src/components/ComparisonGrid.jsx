import { SUMMER_WEEKS } from "../data/camps";

const CAT_COLORS = {
  "Creative Arts": "#f97316",
  "Sports & Athletics": "#22c55e",
  "STEM & Technology": "#3b82f6",
  "Outdoor & Adventure": "#84cc16",
  "Performing Arts": "#a855f7",
};

function MatchBadge({ score, maxScore, reasons }) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const isBest = pct >= 90;
  const isGood = pct >= 65;

  if (isBest) return (
    <div className="match-badge best">
      <span>⭐ Best Match</span>
    </div>
  );
  if (isGood) return (
    <div className="match-badge good">
      <span>✓ Good Match</span>
    </div>
  );
  return (
    <div className="match-badge partial">
      <span>Partial Match</span>
    </div>
  );
}

function AvailBar({ remaining, total }) {
  const pct = (remaining / total) * 100;
  const urgent = pct <= 25;
  const low = pct <= 50;
  return (
    <div className="avail-wrap">
      <div className="avail-bar">
        <div
          className={`avail-fill ${urgent ? "urgent" : low ? "low" : "ok"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`avail-text ${urgent ? "urgent" : ""}`}>
        {urgent ? `⚡ Only ${remaining} spots left!` : `${remaining} of ${total} spots`}
      </span>
    </div>
  );
}

function WeekDots({ campWeeks, selectedWeeks }) {
  return (
    <div className="week-dots">
      {SUMMER_WEEKS.map((wk) => {
        const available = campWeeks.includes(wk.id);
        const selected = selectedWeeks.includes(wk.id) && available;
        return (
          <div
            key={wk.id}
            className={`week-dot ${available ? "avail" : "na"} ${selected ? "sel" : ""}`}
            title={`${wk.label}: ${wk.dates} — ${available ? "Available" : "Not offered"}`}
          />
        );
      })}
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <span className="star-rating">
      {"★".repeat(Math.round(rating))}
      {"☆".repeat(5 - Math.round(rating))}
      <span className="rating-num"> {rating}</span>
    </span>
  );
}

export default function ComparisonGrid({ camps, maxScore, filters, planIds, togglePlan }) {
  const topScore = maxScore;

  return (
    <div className="grid-wrap">
      <div className="grid-header-row">
        <h2 className="grid-title">
          {camps.length} camps found
          {filters.weeks.length > 0 && (
            <span className="grid-subtitle"> · {filters.weeks.length} week{filters.weeks.length > 1 ? "s" : ""} selected</span>
          )}
        </h2>
        <p className="grid-hint">Sorted by best match for your criteria</p>
      </div>

      <div className="comparison-table">
        {/* Column headers */}
        <div className="col-headers">
          <div className="col-h camp-col">Camp & Program</div>
          <div className="col-h">Price / wk</div>
          <div className="col-h">Ages</div>
          <div className="col-h">Hours</div>
          <div className="col-h">Availability</div>
          <div className="col-h">Your Weeks</div>
          <div className="col-h">Match</div>
          <div className="col-h">Plan</div>
        </div>

        {/* Camp rows */}
        {camps.map((camp, idx) => {
          const pct = topScore > 0 ? (camp.score / topScore) * 100 : 0;
          const isBest = pct >= 90;
          const isGood = pct >= 65;
          const inPlan = planIds.includes(camp.id);
          const catColor = CAT_COLORS[camp.category] || "#94a3b8";
          const availableMyWeeks = filters.weeks.filter((w) => camp.weeks.includes(w));

          return (
            <div
              key={camp.id}
              className={`camp-row ${isBest ? "row-best" : isGood ? "row-good" : ""} ${inPlan ? "row-inplan" : ""}`}
            >
              {isBest && <div className="best-indicator" />}

              {/* Camp info */}
              <div className="cell camp-col">
                <div className="camp-rank">#{idx + 1}</div>
                <div className="camp-info">
                  <div className="camp-cat-tag" style={{ background: catColor + "22", color: catColor }}>
                    {camp.category}
                  </div>
                  <div className="camp-name">{camp.name}</div>
                  <div className="camp-program">{camp.program}</div>
                  <div className="camp-provider">{camp.provider}</div>
                  <StarRating rating={camp.rating} />
                  <span className="review-count"> ({camp.reviews})</span>
                  <div className="camp-location">📍 {camp.location} · {camp.distance} mi</div>
                  <div className="camp-highlights">
                    {camp.highlights.map((h) => (
                      <span key={h} className="highlight-tag">{h}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="cell price-cell">
                <span className={`price-val ${camp.price > filters.budget ? "over-budget" : ""}`}>
                  ${camp.price}
                </span>
                {camp.price > filters.budget && (
                  <span className="over-tag">over budget</span>
                )}
              </div>

              {/* Ages */}
              <div className="cell">
                <span className={`ages-val ${filters.childAge >= camp.ageMin && filters.childAge <= camp.ageMax ? "age-match" : "age-miss"}`}>
                  {camp.ageMin}–{camp.ageMax}
                </span>
              </div>

              {/* Hours */}
              <div className="cell">
                <span className="hours-val">{camp.type}</span>
                <span className="hours-time">{camp.hours}</span>
              </div>

              {/* Availability */}
              <div className="cell">
                <AvailBar remaining={camp.spotsRemaining} total={camp.totalSpots} />
              </div>

              {/* Week dots */}
              <div className="cell weeks-cell">
                <WeekDots campWeeks={camp.weeks} selectedWeeks={filters.weeks} />
                {filters.weeks.length > 0 && (
                  <span className="weeks-match-txt">
                    {availableMyWeeks.length}/{filters.weeks.length} of your weeks
                  </span>
                )}
              </div>

              {/* Match */}
              <div className="cell match-cell">
                <MatchBadge score={camp.score} maxScore={topScore} reasons={camp.reasons} />
                <div className="match-score-bar">
                  <div className="match-score-fill" style={{ width: `${pct}%` }} />
                </div>
                {camp.reasons.length > 0 && (
                  <div className="match-reasons">
                    {camp.reasons.map((r) => (
                      <span key={r} className="reason-tag">✓ {r}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Add to plan */}
              <div className="cell plan-cell">
                <button
                  className={`add-btn ${inPlan ? "added" : ""}`}
                  onClick={() => togglePlan(camp.id)}
                >
                  {inPlan ? "✓ In Plan" : "+ Add"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
