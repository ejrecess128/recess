function StarRating({ rating, reviews }) {
  const full = Math.round(rating);
  return (
    <div className="card-rating">
      <span className="card-stars">
        {"★".repeat(full)}{"☆".repeat(5 - full)}
      </span>
      <span className="card-rating-num">{rating}</span>
      <span className="card-review-count">({reviews})</span>
    </div>
  );
}

function AvailBadge({ remaining, total }) {
  const pct = (remaining / total) * 100;
  if (pct <= 25) return <span className="card-avail urgent">Only {remaining} spots left</span>;
  if (pct <= 50) return <span className="card-avail low">{remaining} spots left</span>;
  return null;
}

function MatchBadge({ score, maxScore }) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  if (pct >= 90) return <span className="card-match best">Best Match</span>;
  if (pct >= 65) return <span className="card-match good">Good Match</span>;
  return null;
}

export default function ComparisonGrid({ camps, maxScore, filters, planIds, togglePlan, cartIds, toggleCart }) {
  return (
    <div className="card-grid">
      {camps.map((camp) => {
        const pct = maxScore > 0 ? (camp.score / maxScore) * 100 : 0;
        const inPlan = planIds.includes(camp.id);
        const inCart = cartIds.includes(camp.id);
        const ageMatch = filters.childAge >= camp.ageMin && filters.childAge <= camp.ageMax;

        return (
          <div key={camp.id} className={`camp-card ${inCart ? "in-cart" : ""}`}>
            {/* Image */}
            <div className="card-img-wrap">
              <img
                src={camp.image}
                alt={camp.name}
                className="card-img"
                loading="lazy"
              />
              <MatchBadge score={camp.score} maxScore={maxScore} />
              <AvailBadge remaining={camp.spotsRemaining} total={camp.totalSpots} />
            </div>

            {/* Body */}
            <div className="card-body">
              <div className="card-provider">{camp.provider}</div>
              <h3 className="card-title">{camp.name}</h3>
              <p className="card-program">{camp.program}</p>

              <StarRating rating={camp.rating} reviews={camp.reviews} />

              <div className="card-meta">
                <span className="card-meta-item">Ages {camp.ageMin}–{camp.ageMax}</span>
                <span className="card-meta-sep" />
                <span className="card-meta-item">{camp.type}</span>
                <span className="card-meta-sep" />
                <span className="card-meta-item">{camp.hours}</span>
              </div>

              <div className="card-tags">
                {camp.highlights.map((h) => (
                  <span key={h} className="card-tag">{h}</span>
                ))}
                {ageMatch && <span className="card-tag match">Age match</span>}
              </div>

              <div className="card-footer">
                <div className="card-price">
                  <span className="card-price-val">${camp.price}</span>
                  <span className="card-price-unit">/week</span>
                  {camp.price > filters.budget && <span className="card-over">over budget</span>}
                </div>
                <div className="card-actions">
                  <button
                    className={`card-btn card-btn-cart ${inCart ? "active" : ""}`}
                    onClick={() => toggleCart(camp.id)}
                  >
                    {inCart ? "✓ In cart" : "Add to cart"}
                  </button>
                  <button
                    className={`card-btn card-btn-compare ${inPlan ? "active" : ""}`}
                    onClick={() => togglePlan(camp.id)}
                    title="Add to comparison"
                  >
                    {inPlan ? "✓" : "⊞"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
