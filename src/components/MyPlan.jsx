export default function MyPlan({ camps, totalCost, togglePlan, onCompareClick }) {
  const weeksPlanned = new Set(camps.flatMap((c) => c.weeks)).size;

  return (
    <aside className="my-plan">
      <div className="plan-header">
        <h3 className="plan-title">My Plan</h3>
        <span className="plan-count">{camps.length} camps</span>
      </div>

      {camps.length === 0 ? (
        <div className="plan-empty">
          <div className="plan-empty-icon">📋</div>
          <p>Add camps to start building your summer</p>
        </div>
      ) : (
        <>
          <div className="plan-items">
            {camps.map((camp) => (
              <div key={camp.id} className="plan-item">
                <div className="plan-item-info">
                  <div className="plan-item-name">{camp.name}</div>
                  <div className="plan-item-program">{camp.program}</div>
                  <div className="plan-item-price">${camp.price}/wk</div>
                </div>
                <button
                  className="plan-remove"
                  onClick={() => togglePlan(camp.id)}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="plan-totals">
            <div className="plan-total-row">
              <span>Total</span>
              <span className="plan-total-cost">${totalCost}</span>
            </div>
            <div className="plan-total-row sub">
              <span>Per week avg</span>
              <span>${Math.round(totalCost / camps.length)}</span>
            </div>
          </div>

          <button className="book-btn" onClick={onCompareClick}>
            ⊞ Compare & Plan →
          </button>
          <button className="share-btn">Share Plan</button>
        </>
      )}

      <div className="plan-tip">
        <span>💡</span>
        <span>Most Austin families book 4–6 weeks per child</span>
      </div>
    </aside>
  );
}
