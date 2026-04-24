export default function Header({ compareCount = 0, onCompareClick, onLogoClick, showingCompare, minimal, childName }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand" style={{ cursor: minimal ? "default" : "pointer" }} onClick={minimal ? undefined : onLogoClick}>
          <span className="brand-logo">recess</span>
          <span className="brand-divider" />
          <span className="brand-tool">Camp Planner</span>
        </div>
        {!minimal && (
          <>
            <div className="header-tagline">
              {childName ? `Planning for ${childName}` : "Find & book camps your kids will love"}
            </div>
            <button
              className={`compare-nav-btn ${showingCompare ? "compare-nav-btn-active" : ""}`}
              onClick={showingCompare ? onLogoClick : onCompareClick}
            >
              {showingCompare ? "← Back to camps" : (
                <>
                  Compare & Plan
                  {compareCount > 0 && (
                    <span className="compare-nav-badge">{compareCount}</span>
                  )}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </header>
  );
}
