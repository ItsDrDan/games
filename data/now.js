/* "Where we actually are" overrides, so the hub matches real class pace even when the
   syllabus calendar is behind. Update by telling Claude, e.g. "3A: next skill check is #10 on acids".
   week   = the class week this applies to
   lecture = what's being taught now; ch = matching hub chapter id(s)
   check  = the next skill check: number, topic, and chapters for its plan
   next   = id of the next exam (used when the syllabus has no calendar)
   done   = recent things already finished (shown as a small note)
   daily  = optional Daily 5 plan for the Canvas card (#/daily/<course>?ch=now): focus chapter + how many + which skills, and review chapters */
window.HUB_NOW = {
 "3A": {
  updated: "2026-11-04",
  week: 13,
  lecture: {text: "Starting Ch 11: Stoichiometry", ch: "11"},
  check: {n: 9, topic: "Ideal gas law, molarity, and a simple stoichiometry problem or two", ch: ["8", "9", "11"]},
  done: "Exam #2 is done, and Skill Check #8 covered chemical reactions.",
  /* Daily 5 on the Canvas home page: 2 easy → 2 medium → 1 hard, always in that order.
     1 easy  = one-step Ch 1–10 final review (no calculator)
     2 easy  = a one-step stoichiometry building block (mole ratio, reaction type, simple mole idea)
     3 medium = one conversion with a calculator (mol → mol from an equation, or g ↔ mol)
     4 medium = Ch 7–9 review calculation (molarity, a gas law, or specific heat)
     5 hard  = full mass-to-mass stoichiometry (g A → mol A → mol B → g B) */
  daily: {
   title: "Stoichiometry + final review",
   note: "rotate",   /* "rotate" = a new growth/learning message or quote each day (list in daily.js) */
   /* older daily.js reads focus/review; newer daily.js uses mix */
   focus: {ch: "11", n: 2, skills: ["stoichiometry.learn-molmol", "stoichiometry.learn-gmol", "stoichiometry.learn-gg"]},
   review: ["10", "9", "8"],
   mix: [
    {level: "easy", n: 1, pool: [
     {ch: "1", skills: ["sigfig.count", "metric.symboltoprefix", "metric.prefixtosymbol"]},
     {ch: "1", skills: ["finalexam.3a.matter", "finalexam.3a.measure"], diff: [1], calc: false},
     {ch: "2", skills: ["finalexam.3a.atoms"], diff: [1], calc: false},
     {ch: "3", skills: ["finalexam.3a.electrons"], diff: [1], calc: false},
     {ch: "4", skills: ["finalexam.3a.naming"], diff: [1], calc: false},
     {ch: "6", skills: ["finalexam.3a.bonding"], diff: [1], calc: false},
     {ch: "7", skills: ["finalexam.3a.energy"], diff: [1], calc: false},
     {ch: "9", skills: ["finalexam.3a.solutions"], diff: [1], calc: false}
    ]},
    {level: "easy", n: 1, pool: [
     {ch: "11", skills: ["stoichiometry.learn-ratio"]},
     {ch: "10", rx: "type", skills: ["reactions.combination", "reactions.decomposition", "reactions.single-displacement", "reactions.double-displacement", "reactions.combustion"]},
     {ch: "5", skills: ["moles.molar"], match: "molar mass of|atoms are in one"},
     {ch: "5", skills: ["finalexam.3a.moles"], diff: [1]}
    ]},
    {level: "medium", n: 1, pool: [
     {ch: "11", skills: ["stoichiometry.learn-molmol", "stoichiometry.learn-gmol"]},
     {ch: "5", skills: ["moles.molar"], match: "has a mass of|contains [0-9.]+ mol|You have [0-9.]+ mol"}
    ]},
    {level: "medium", n: 1, pool: [
     {ch: "9", gen: "molarity"},
     {ch: "8", skills: ["gaslaws.boyle", "gaslaws.charles-gay-lussac", "gaslaws.combined", "gaslaws.ideal"]},
     {ch: "7", skills: ["thermochemistry.specific-heat"]}
    ]},
    {level: "hard", n: 1, ch: "11", skills: ["stoichiometry.learn-gg"]}
   ]
  }
 },
 "1A": {
  updated: "2026-11-04",
  week: 13,
  lecture: {text: "Ch 6: Basic quantum theory (light, Bohr model, quantum numbers)", ch: "6"},
  check: {n: 10, topic: "Quantum chemistry", ch: ["6"]},
  next: "3",
  done: "Exam #2 is done, and Skill Check #9 covered gases.",
  /* Daily 5 on the Canvas home page: basic quantum theory only (no electron configurations or periodic trends yet) */
  daily: {
   title: "Basic quantum theory",
   note: "rotate",
   focus: {ch: "6", n: 5, skills: ["quantum.light", "quantum.bohr", "quantum.numbers"]},
   mix: [{ch: "6", n: 5, skills: ["quantum.light", "quantum.bohr", "quantum.numbers"]}]
  }
 }
};
