function StarRating({ rating, reviews }) {
  return (
    <div className="card-rating">
      <span className="card-stars-filled">★ {rating}</span>
      <span className="card-review-count">({reviews} reviews)</span>
    </div>
  );
}

function AvailBadge({ remaining, total }) {
  const pct = (remaining / total) * 100;
  if (pct <= 25) return <span className="card-badge card-badge--urgent">Only {remaining} spots left</span>;
  if (pct <= 50) return <span className="card-badge card-badge--low">{remaining} spots left</span>;
  return null;
}

function MatchBadge({ score, maxScore }) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  if (pct >= 90) return <span className="card-badge card-badge--best">Best Match</span>;
  if (pct >= 65) return <span className="card-badge card-badge--good">Good Match</span>;
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
          <article key={camp.id} className={`camp-card${inCart ? " camp-card--carted" : ""}`}>
            <div className="card-img-wrap">
              <img src={camp.image} alt={camp.name} className="card-img" loading="lazy" />
              <div className="card-img-badges">
                <MatchBadge score={camp.score} maxScore={maxScore} />
                <AvailBadge remaining={camp.spotsRemaining} total={camp.totalSpots} />
              </div>
              <button
                className={`card-compare-btn${inPlan ? " active" : ""}`}
                onClick={() => togglePlan(camp.id)}
              >
                {inPlan ? "✓ Comparing" : "Compare"}
              </button>
            </div>

            <div className="card-body">
              <div className="card-top">
                <span className="card-provider">{camp.provider}</span>
                <span className="card-location">{camp.location}</span>
              </div>
              <h3 className="card-title">{camp.name}</h3>
              <p className="card-program">{camp.program}</p>

              <StarRating rating={camp.rating} reviews={camp.reviews} />

              <div className="card-details">
                <span>Ages {camp.ageMin}–{camp.ageMax}</span>
                <span>{camp.type}</span>
                <span>{camp.hours}</span>
              </div>

              <div className="card-tags">
                {camp.highlights.map((h) => (
                  <span key={h} className="card-tag">{h}</span>
                ))}
                {ageMatch && <span className="card-tag card-tag--match">Age match</span>}
              </div>

              <div className="card-footer">
                <div className="card-price">
                  <span className="card-price-amount">${camp.price}</span>
                  <span className="card-price-period">/week</span>
                  {camp.price > filters.budget && <span className="card-price-over">over budget</span>}
                </div>
                <button
                  className={`card-cart-btn${inCart ? " card-cart-btn--active" : ""}`}
                  onClick={() => toggleCart(camp.id)}
                >
                  {inCart ? "✓ In cart" : "Add to cart"}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
