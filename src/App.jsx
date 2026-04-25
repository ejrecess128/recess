import { useState } from "react";
import Onboarding from "./components/Onboarding";
import FilterPanel from "./components/FilterPanel";
import ComparisonGrid from "./components/ComparisonGrid";
import Header from "./components/Header";
import ComparePage from "./components/ComparePage";
import { MOCK_CAMPS } from "./data/camps";
import "./index.css";

function scoreCamp(camp, child, sharedFilters) {
  let score = 0;
  let reasons = [];
  const ageMatch = child.age >= camp.ageMin && child.age <= camp.ageMax;
  if (ageMatch) { score += 30; reasons.push("Age match"); }
  const budgetMatch = camp.price <= sharedFilters.budget;
  if (budgetMatch) { score += 20; reasons.push("Within budget"); }
  const weekMatch = sharedFilters.weeks.length === 0 || sharedFilters.weeks.some((w) => camp.weeks.includes(w));
  if (weekMatch && sharedFilters.weeks.length > 0) { score += 25; reasons.push("Available your weeks"); }
  if (sharedFilters.weeks.length === 0) score += 15;
  const catMatch = child.interests.length === 0 || child.interests.includes(camp.category);
  if (catMatch && child.interests.length > 0) { score += 20; reasons.push("Matches interests"); }
  if (child.interests.length === 0) score += 10;
  const dayMatch = sharedFilters.dayType === "any" || camp.type.toLowerCase().includes(sharedFilters.dayType);
  if (dayMatch && sharedFilters.dayType !== "any") { score += 5; reasons.push("Day type match"); }
  if (sharedFilters.dayType === "any") score += 3;
  if (camp.spotsRemaining / camp.totalSpots > 0.5) score += 5;
  return { score, reasons };
}

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [children, setChildren] = useState([]);
  const [sharedFilters, setSharedFilters] = useState({ budget: 400, weeks: [], dayType: "any" });
  const [activeChildId, setActiveChildId] = useState(null);

  // Per-child cart & compare: arrays of { childId, campId }
  const [cartItems, setCartItems] = useState([]);
  const [compareItems, setCompareItems] = useState([]);
  const [view, setView] = useState("feed");

  const handleOnboardingComplete = (data) => {
    setChildren(data.children);
    setSharedFilters({
      budget: data.budget,
      weeks: data.weeks,
      dayType: data.dayType,
      zipCode: data.zipCode,
      commuteTime: data.commuteTime,
    });
    setActiveChildId(data.children[0].id);
    setOnboarded(true);
  };

  if (!onboarded) {
    return (
      <div className="app">
        <Header compareCount={0} onCompareClick={() => {}} onLogoClick={() => {}} showingCompare={false} minimal />
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  const activeChild = children.find(c => c.id === activeChildId) || children[0];

  // Build filters object compatible with existing FilterPanel/ComparisonGrid
  const filters = {
    childName: activeChild.name,
    childAge: activeChild.age,
    categories: activeChild.interests,
    ...sharedFilters,
  };

  const scoredCamps = MOCK_CAMPS.map((camp) => ({
    ...camp,
    ...scoreCamp(camp, activeChild, sharedFilters),
  })).sort((a, b) => b.score - a.score);

  const maxScore = Math.max(...scoredCamps.map((c) => c.score));

  // Cart/compare helpers — scoped to active child
  const activeCartIds = cartItems.filter(i => i.childId === activeChildId).map(i => i.campId);
  const activeCompareIds = compareItems.filter(i => i.childId === activeChildId).map(i => i.campId);
  const allCompareIds = [...new Set(compareItems.map(i => i.campId))];
  const allCartIds = [...new Set(cartItems.map(i => i.campId))];

  const toggleCart = (campId) => {
    setCartItems(prev => {
      const exists = prev.find(i => i.childId === activeChildId && i.campId === campId);
      if (exists) return prev.filter(i => !(i.childId === activeChildId && i.campId === campId));
      return [...prev, { childId: activeChildId, campId }];
    });
  };

  const toggleCompare = (campId) => {
    setCompareItems(prev => {
      const exists = prev.find(i => i.childId === activeChildId && i.campId === campId);
      if (exists) return prev.filter(i => !(i.childId === activeChildId && i.campId === campId));
      return [...prev, { childId: activeChildId, campId }];
    });
  };

  const totalCompareCount = compareItems.length;
  const totalCartCount = cartItems.length;

  // For filter panel — wrap setSharedFilters to also update child-specific fields
  const setFilters = (updater) => {
    if (typeof updater === "function") {
      setSharedFilters(prev => {
        const next = updater({ ...prev, childAge: activeChild.age, childName: activeChild.name, categories: activeChild.interests });
        const { childAge, childName, categories, ...shared } = next;
        // Update child-specific fields
        if (childAge !== activeChild.age || childName !== activeChild.name || categories !== activeChild.interests) {
          setChildren(prev => prev.map(c =>
            c.id === activeChildId
              ? { ...c, age: childAge, name: childName, interests: categories }
              : c
          ));
        }
        return shared;
      });
    } else {
      const { childAge, childName, categories, ...shared } = updater;
      setChildren(prev => prev.map(c =>
        c.id === activeChildId
          ? { ...c, age: childAge, name: childName, interests: categories }
          : c
      ));
      setSharedFilters(shared);
    }
  };

  if (view === "compare") {
    return (
      <div className="app">
        <Header
          compareCount={totalCompareCount}
          onCompareClick={() => setView("compare")}
          onLogoClick={() => setView("feed")}
          showingCompare={true}
          childName={children.length === 1 ? activeChild.name : `${children.length} kids`}
        />
        <ComparePage
          planIds={allCompareIds}
          filters={filters}
          onBack={() => setView("feed")}
          onTogglePlan={toggleCompare}
          cartIds={allCartIds}
          toggleCart={toggleCart}
          children={children}
          cartItems={cartItems}
          compareItems={compareItems}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        compareCount={totalCompareCount}
        cartCount={totalCartCount}
        onCompareClick={() => setView("compare")}
        onLogoClick={() => setView("feed")}
        showingCompare={false}
        childName={children.length === 1 ? activeChild.name : `${children.length} kids`}
      />
      <div className="app-body two-col">
        <FilterPanel filters={filters} setFilters={setFilters} />
        <div className="main-content">
          {/* Child tabs */}
          {children.length > 1 && (
            <div className="child-tabs">
              {children.map(child => (
                <button
                  key={child.id}
                  className={`child-tab${child.id === activeChildId ? " active" : ""}`}
                  onClick={() => setActiveChildId(child.id)}
                >
                  <span className="child-tab-dot" style={{ background: child.color }} />
                  <span className="child-tab-name">{child.name}</span>
                  <span className="child-tab-age">{child.age}</span>
                </button>
              ))}
            </div>
          )}
          <ComparisonGrid
            camps={scoredCamps}
            maxScore={maxScore}
            filters={filters}
            planIds={activeCompareIds}
            togglePlan={toggleCompare}
            cartIds={activeCartIds}
            toggleCart={toggleCart}
            activeChild={activeChild}
          />
        </div>
      </div>
    </div>
  );
}
