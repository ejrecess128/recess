import { MOCK_CAMPS } from "./data/camps";

/**
 * Analyze selections across children and return insights:
 * - conflicts: schedule/location conflicts between children
 * - shared: camps both children could attend together
 * - optimizations: cost savings and logistic improvements
 */
export function analyzeFamily({ children, cartItems, compareItems, sharedFilters }) {
  if (children.length < 2) return { conflicts: [], shared: [], optimizations: [] };

  const allItems = [...cartItems, ...compareItems];
  const conflicts = [];
  const shared = [];
  const optimizations = [];

  // Build per-child camp selections (deduped)
  const childSelections = {};
  for (const child of children) {
    const campIds = [...new Set(
      allItems.filter(i => i.childId === child.id).map(i => i.campId)
    )];
    childSelections[child.id] = campIds.map(id => MOCK_CAMPS.find(c => c.id === id)).filter(Boolean);
  }

  // ── CONFLICT DETECTION ──
  // Check each pair of children for overlapping weeks at different locations
  for (let i = 0; i < children.length; i++) {
    for (let j = i + 1; j < children.length; j++) {
      const c1 = children[i];
      const c2 = children[j];
      const camps1 = childSelections[c1.id] || [];
      const camps2 = childSelections[c2.id] || [];

      for (const camp1 of camps1) {
        for (const camp2 of camps2) {
          if (camp1.id === camp2.id) continue;

          // Find overlapping weeks
          const sharedWeeks = camp1.weeks.filter(w => camp2.weeks.includes(w));
          const selectedOverlap = sharedWeeks.filter(w =>
            !sharedFilters.weeks?.length || sharedFilters.weeks.includes(w)
          );

          if (selectedOverlap.length === 0) continue;

          // Different locations = pickup conflict
          if (camp1.location !== camp2.location) {
            // Check if times overlap
            const overlap = timesOverlap(camp1.hours, camp2.hours);
            if (overlap) {
              conflicts.push({
                type: "pickup",
                children: [c1, c2],
                camps: [camp1, camp2],
                weeks: selectedOverlap,
                message: `${c1.name}'s ${camp1.name} and ${c2.name}'s ${camp2.name} overlap in ${camp1.location} vs ${camp2.location}`,
              });
            }
          }

          // Same time, same location = potential dropoff efficiency (optimization, not conflict)
          if (camp1.location === camp2.location && camp1.id !== camp2.id) {
            optimizations.push({
              type: "same_location",
              children: [c1, c2],
              camps: [camp1, camp2],
              weeks: selectedOverlap,
              message: `${c1.name} and ${c2.name} are both in ${camp1.location} — one dropoff`,
            });
          }
        }
      }
    }
  }

  // ── SHARED CAMP SUGGESTIONS ──
  // Find camps where all/multiple children's ages fit
  for (const camp of MOCK_CAMPS) {
    const fittingChildren = children.filter(c =>
      c.age >= camp.ageMin && c.age <= camp.ageMax
    );

    if (fittingChildren.length >= 2) {
      // Check if any of the fitting children share interests
      const interestMatch = fittingChildren.some(c =>
        c.interests.length === 0 || c.interests.includes(camp.category)
      );

      // Check if camp isn't already selected for all fitting children
      const alreadyForAll = fittingChildren.every(c =>
        allItems.some(i => i.childId === c.id && i.campId === camp.id)
      );

      if (!alreadyForAll) {
        shared.push({
          camp,
          children: fittingChildren,
          interestMatch,
          message: `${fittingChildren.map(c => c.name).join(" & ")} could both attend`,
        });
      }
    }
  }

  // Sort shared: interest matches first, then by number of fitting children
  shared.sort((a, b) => {
    if (a.interestMatch !== b.interestMatch) return b.interestMatch - a.interestMatch;
    return b.children.length - a.children.length;
  });

  // ── SCHEDULE OPTIMIZATIONS ──
  // Check if putting children at the same camp saves a commute
  for (let i = 0; i < children.length; i++) {
    for (let j = i + 1; j < children.length; j++) {
      const c1 = children[i];
      const c2 = children[j];
      const camps1 = childSelections[c1.id] || [];
      const camps2 = childSelections[c2.id] || [];

      // Same camp selected for both = sibling discount / one commute
      for (const camp1 of camps1) {
        if (camps2.some(c => c.id === camp1.id)) {
          optimizations.push({
            type: "same_camp",
            children: [c1, c2],
            camps: [camp1],
            message: `${c1.name} and ${c2.name} are both at ${camp1.name} — one trip`,
          });
        }
      }
    }
  }

  // Budget insight
  const totalWeekly = Object.values(childSelections)
    .flat()
    .reduce((sum, c) => sum + c.price, 0);
  const budgetPerChild = sharedFilters.budget || 400;
  const totalBudget = budgetPerChild * children.length;

  if (totalWeekly > totalBudget) {
    optimizations.push({
      type: "over_budget",
      message: `You're $${totalWeekly - totalBudget}/wk over your $${budgetPerChild}/child budget`,
      amount: totalWeekly - totalBudget,
    });
  } else if (totalWeekly > 0 && totalWeekly <= totalBudget * 0.7) {
    optimizations.push({
      type: "under_budget",
      message: `You're $${totalBudget - totalWeekly}/wk under budget — room to add more`,
      amount: totalBudget - totalWeekly,
    });
  }

  // Deduplicate
  const seenConflicts = new Set();
  const uniqueConflicts = conflicts.filter(c => {
    const key = c.camps.map(x => x.id).sort().join("-") + c.children.map(x => x.id).sort().join("-");
    if (seenConflicts.has(key)) return false;
    seenConflicts.add(key);
    return true;
  });

  const seenOpts = new Set();
  const uniqueOpts = optimizations.filter(o => {
    const key = o.type + (o.camps?.map(x => x.id).sort().join("-") || "") + (o.children?.map(x => x.id).sort().join("-") || "");
    if (seenOpts.has(key)) return false;
    seenOpts.add(key);
    return true;
  });

  return { conflicts: uniqueConflicts, shared: shared.slice(0, 5), optimizations: uniqueOpts };
}

function timesOverlap(hours1, hours2) {
  const parse = (str) => {
    const m = str.match(/(\d+)(?::(\d+))?\s*(AM|PM)/gi);
    if (!m || m.length < 2) return null;
    const toH = (s) => {
      const mm = s.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);
      let h = Number(mm[1]);
      if (mm[3].toUpperCase() === "PM" && h !== 12) h += 12;
      if (mm[3].toUpperCase() === "AM" && h === 12) h = 0;
      return h;
    };
    return { start: toH(m[0]), end: toH(m[1]) };
  };
  const t1 = parse(hours1);
  const t2 = parse(hours2);
  if (!t1 || !t2) return true; // assume overlap if can't parse
  return t1.start < t2.end && t2.start < t1.end;
}
