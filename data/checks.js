/* Skill Check study pages: check.html?id=<id> (made to iframe into a Canvas assignment).
   Each entry: what's on the skill check, a short study plan, the games to play, and a Daily 5 mix
   (same format as data/now.js daily.mix; gen:'molarity' / gen:'noblegas' make fresh questions).
   Nothing here is copied from a real skill check: practice only. Add a new one by telling Claude. */
window.HUB_CHECKS = {
 "3A-10": {
  course: "3A", n: 10,
  title: "Gases, Molarity & Stoichiometry",
  points: 30, allowed: "Formula sheet + Exam Yellow Sheet",
  topics: [
   {q: "#1", t: "Boyle’s Law (P₁V₁ = P₂V₂)", pts: 5},
   {q: "#2", t: "Molarity (grams → moles → M)", pts: 5},
   {q: "#3", t: "Ideal Gas Law: find moles, then molar mass to name the noble gas", pts: 8},
   {q: "#4", t: "Mass-to-mass stoichiometry", pts: 6},
   {q: "#5", t: "Mass-to-mass stoichiometry (balance it first)", pts: 6}
  ],
  plan: [
   {day: "Day 1", t: "Gas laws", items: ["Boyle’s Law: write P₁, V₁, P₂, V₂ before you solve", "PV = nRT: °C → K, then n = PV ÷ RT", "Molar mass = grams ÷ moles → find the noble gas on your yellow sheet"], game: "gaslaws"},
   {day: "Day 2", t: "Molarity", items: ["Molar mass from the periodic table", "grams → moles, mL → L", "M = mol ÷ L"], game: "moles"},
   {day: "Day 3", t: "Stoichiometry", items: ["Balance the equation first", "grams A → mol A → mol B → grams B", "Do 10–20 mass-to-mass problems"], game: "stoichiometry"},
   {day: "Every day", t: "Daily 5", items: ["Five quick questions mixed from all three topics", "Keep your streak going until skill check day"]}
  ],
  games: [
   {id: "gaslaws", focus: "Focus on Boyle’s Law and the Ideal Gas Law."},
   {id: "moles", focus: "Molar mass and grams ↔ moles (you need both for molarity)."},
   {id: "stoichiometry", focus: "Focus on the mass-to-mass problems."}
  ],
  mistakes: ["Using °C instead of K in PV = nRT", "Forgetting to change mL to L", "Skipping the mole ratio (or using 1:1 when it isn’t)", "Not balancing before stoichiometry", "Rounding too early"],
  daily: {
   title: "Skill Check #10 prep",
   note: "1 Boyle’s Law, 1 name-that-noble-gas, 1 molarity and 2 mass-to-mass stoichiometry questions. About 5 minutes.",
   mix: [
    {ch: "8", n: 1, skills: ["gaslaws.boyle"]},
    {ch: "8", n: 1, gen: "noblegas"},
    {ch: "9", n: 1, gen: "molarity"},
    {ch: "11", n: 2, skills: ["stoichiometry.learn-gg", "stoichiometry.mass"]}
   ]
  }
 }
};
