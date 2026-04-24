import { useState } from "react";
import Onboarding from "./components/Onboarding";
import FilterPanel from "./components/FilterPanel";
import ComparisonGrid from "./components/ComparisonGrid";
import Header from "./components/Header";
import ComparePage from "./components/ComparePage";
import { MOCK_CAMPS } from "./data/camps";
import "./index.css";

const DEFAULT_FILTERS = {
  childName: "",
  childAge: 8,
  budget: 400,
  weeks: [],
  categories: [],
  dayType: "any",
};

function scoreCamp(camp, filters) {
  let score = 0;
  let reasons = [];
  const ageMatch = filters.childAge >= camp.ageMin && filters.childAge <= camp.ageMax;
  if (ageMatch) { score += 30; reasons.push("Age match"); }
  const budgetMatch = camp.price <= filters.budget;
  if (budgetMatch) { score += 20; reasons.push("Within budget"); }
  const weekMatch = filters.weeks.length === 0 || filters.weeks.some((w) => camp.weeks.includes(w));
  if (weekMatch && filters.weeks.length > 0) { score += 25; reasons.push("Available your weeks"); }
  if (filters.weeks.length === 0) score += 15;
  const catMatch = filters.categories.length === 0 || filters.categories.includes(camp.category);
  if (catMatch && filters.categories.length > 0) { score += 20; reasons.push("Matches interests"); }
  if (filters.categories.length === 0) score += 10;
  const dayMatch = filters.dayType === "any" || camp.type.toLowerCase().includes(filters.dayType);
  if (dayMatch && filters.dayType !== "any") { score += 5; reasons.push("Day type match"); }
  if (filters.dayType === "any") score += 3;
  const availPct = camp.spotsRemaining / camp.totalSpots;
  if (availPct > 0.5) score += 5;
  return { score, reasons };
}

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [planIds, setPlanIds] = useState([]);
  const [cartIds, setCartIds] = useState([]);
  const [view, setView] = useState("feed");

  const handleOnboardingComplete = (data) => {
    setFilters({
      childName: data.childName,
      childAge: data.childAge,
      budget: data.budget,
      weeks: data.weeks,
      categories: data.categories,
      dayType: data.dayType,
    });
    setOnboarded(true);
  };

  if (!onboarded) {
    return (
      <div className="app">
        <Header
          compareCount={0}
          onCompareClick={() => {}}
          onLogoClick={() => {}}
          showingCompare={false}
          minimal
        />
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  const scoredCamps = MOCK_CAMPS.map((camp) => ({
    ...camp,
    ...scoreCamp(camp, filters),
  })).sort((a, b) => b.score - a.score);

  const maxScore = Math.max(...scoredCamps.map((c) => c.score));

  const togglePlan = (id) => {
    setPlanIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleCart = (id) => {
    setCartIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (view === "compare") {
    return (
      <div className="app">
        <Header
          compareCount={planIds.length}
          onCompareClick={() => setView("compare")}
          onLogoClick={() => setView("feed")}
          showingCompare={true}
          childName={filters.childName}
        />
        <ComparePage
          planIds={planIds}
          filters={filters}
          onBack={() => setView("feed")}
          onTogglePlan={togglePlan}
          cartIds={cartIds}
          toggleCart={toggleCart}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        compareCount={planIds.length}
        cartCount={cartIds.length}
        onCompareClick={() => setView("compare")}
        onLogoClick={() => setView("feed")}
        showingCompare={false}
        childName={filters.childName}
      />
      <div className="app-body two-col">
        <FilterPanel filters={filters} setFilters={setFilters} />
        <div className="main-content">
          <ComparisonGrid
            camps={scoredCamps}
            maxScore={maxScore}
            filters={filters}
            planIds={planIds}
            togglePlan={togglePlan}
            cartIds={cartIds}
            toggleCart={toggleCart}
          />
        </div>
      </div>
    </div>
  );
}
