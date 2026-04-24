import { SUMMER_WEEKS } from "../data/camps";

const CAT_COLORS = {
  "Creative Arts": { bg: "#FFF0EB", text: "#E05A2B" },
  "Sports & Athletics": { bg: "#E6F4F5", text: "#068D9D" },
  "STEM & Technology": { bg: "#EFF6FF", text: "#2563EB" },
  "Outdoor & Adventure": { bg: "#F0FDF4", text: "#15803D" },
  "Performing Arts": { bg: "#F5F3FF", text: "#7C3AED" },
};

const CAT_EMOJI = {
  "Creative Arts": "🎨",
  "Sports & Athletics": "⚽",
  "STEM & Technology": "🤖",
  "Outdoor & Adventure": "🌲",
  "Performing Arts": "🎭",
};

function MatchBadge({ score, maxScore }) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  if (pct >= 90) return <div className="match-badge best">Best Match</div>;
  if (pct >= 65) return <div className="match-badge good">Good Match</div>;
  return <div className="match-badge partial">Partial Match</div>;
}

function AvailBar({ remaining, total }) {
  const pct = (remaining / total) * 100;
  const urgent = pct <= 25;
  const low = pct <= 50;
  return (
    <div className="avail-wrap">
      <div className="avail-bar">
        <div className={`avail-fill ${urgent ? "urgent" : low ? "low" : "ok"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`avail-text ${urgent ? "urgent" : ""}`}>
        {urgent ? `Only ${remaining} spots left` : `${remaining} of ${total} spots`}
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
  const full = Math.round(rating);
  return (
    <span className="star-rating">
      {"★".repeat(full)}{"☆".repeat(5 - full)}
      <span className="rating-num"> {rating}</span>
    </span>
  );
}

export default function ComparisonGrid({ camps, maxScore, filters, planIds, togglePlan, cartIds, toggleCart }) {
  return (
    <div className="grid-wrap">
      <div className="comparison-table">
        <div className="col-headers">
          <div className="col-h camp-col">Camp & Program</div>
          <div className="col-h">Price/wk</div>
          <div className="col-h">Ages</div>
          <div className="col-h">Schedule</div>
          <div className="col-h">Availability</div>
          <div className="col-h">Your Weeks</div>
          <div className="col-h">Match</div>
          <div className="col-h"></div>
        </div>

        {camps.map((camp, idx) => {
          const pct = maxScore > 0 ? (camp.score / maxScore) * 100 : 0;
          const isBest = pct >= 90;
          const isGood = pct >= 65;
          const inPlan = planIds.includes(camp.id);
          const inCart = cartIds.includes(camp.id);
          const colors = CAT_COLORS[camp.category] || { bg: "#f0f0f0", text: "#666" };
          const availableMyWeeks = filters.weeks.filter((w) => camp.weeks.includes(w));

          return (
            <div
              key={camp.id}
              className={`camp-row ${isBest ? "row-best" : isGood ? "row-good" : ""} ${inCart ? "row-incart" : ""}`}
            >
              {isBest && <div className="best-indicator" />}

              <div className="camp-col-cell">
                {camp.image ? (
                  <img
                    src={camp.image}
                    alt={camp.name}
                    className="camp-img"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div className="camp-img-placeholder" style={{ display: camp.image ? 'none' : 'flex' }}>
                  {CAT_EMOJI[camp.category]}
                </div>
                <div className="camp-info">
                  <div className="camp-cat-tag" style={{ background: colors.bg, color: colors.text }}>
                    {camp.category}
                  </div>
                  <div className="camp-name">{camp.name}</div>
                  <div className="camp-program">{camp.program}</div>
                  <div className="camp-provider">{camp.provider}</div>
                  <div>
                    <StarRating rating={camp.rating} />
                    <span className="review-count"> ({camp.reviews})</span>
                  </div>
                  <div className="camp-location">{camp.location} · {camp.distance} mi</div>
                  <div className="camp-highlights">
                    {camp.highlights.map((h) => (
                      <span key={h} className="highlight-tag">{h}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="cell">
                <span className={`price-val ${camp.price > filters.budget ? "over-budget" : ""}`}>
                  ${camp.price}
                </span>
                {camp.price > filters.budget && <span className="over-tag">over budget</span>}
              </div>

              <div className="cell">
                <span className={`ages-val ${filters.childAge >= camp.ageMin && filters.childAge <= camp.ageMax ? "age-match" : "age-miss"}`}>
                  {camp.ageMin}–{camp.ageMax}
                </span>
              </div>

              <div className="cell">
                <span className="hours-val">{camp.type}</span>
                <span className="hours-time">{camp.hours}</span>
              </div>

              <div className="cell">
                <AvailBar remaining={camp.spotsRemaining} total={camp.totalSpots} />
              </div>

              <div className="cell weeks-cell">
                <WeekDots campWeeks={camp.weeks} selectedWeeks={filters.weeks} />
                {filters.weeks.length > 0 && (
                  <span className="weeks-match-txt">{availableMyWeeks.length}/{filters.weeks.length} of your weeks</span>
                )}
              </div>

              <div className="cell match-cell">
                <MatchBadge score={camp.score} maxScore={maxScore} />
                <div className="match-score-bar">
                  <div className="match-score-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="match-reasons">
                  {camp.reasons.map((r) => (
                    <span key={r} className="reason-tag">✓ {r}</span>
                  ))}
                </div>
              </div>

              <div className="cell actions-cell">
                <button
                  className={`action-btn cart-btn ${inCart ? "active" : ""}`}
                  onClick={() => toggleCart(camp.id)}
                >
                  {inCart ? "✓ In cart" : "Add to cart"}
                </button>
                <button
                  className={`action-btn compare-btn ${inPlan ? "active" : ""}`}
                  onClick={() => togglePlan(camp.id)}
                >
                  {inPlan ? "✓ Comparing" : "Compare"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
