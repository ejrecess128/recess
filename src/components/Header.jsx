export default function Header({ compareCount = 0, onCompareClick, onLogoClick, showingCompare }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand" style={{ cursor: "pointer" }} onClick={onLogoClick}>
          <span className="brand-logo">recess</span>
          <span className="brand-divider" />
          <span className="brand-tool">Camp Planner</span>
        </div>
        <div className="header-tagline">Find the perfect camp · Build your summer</div>
        <button
          className={`compare-nav-btn ${showingCompare ? "compare-nav-btn-active" : ""}`}
          onClick={onCompareClick}
        >
          {showingCompare ? "← Back to feed" : (
            <>
              ⊞ Compare & Plan
              {compareCount > 0 && (
                <span className="compare-nav-badge">{compareCount}</span>
              )}
            </>
          )}
        </button>
      </div>
    </header>
  );
}
