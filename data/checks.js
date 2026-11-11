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
    {ch: "11", n: 2, skills: ["stoichiometry.learn-gg"]}
   ]
  }
 },
 "1A-10": {
  course: "1A", n: 10,
  title: "Quantum Chemistry",
  points: 30, allowed: "Formula sheet + periodic table",
  topics: [
   {q: "#1", t: "Photons: frequency, energy per photon, kJ/mol", pts: 5},
   {q: "#2", t: "Photoelectric effect: KE of the electron, and does it eject?", pts: 4},
   {q: "#3", t: "de Broglie wavelength of an electron (in Å)", pts: 4},
   {q: "#4", t: "Photoelectric effect concept (multiple choice)", pts: 2},
   {q: "#5", t: "Orbital boxes: write n, l, mₗ, mₛ for a marked electron", pts: 3},
   {q: "#6", t: "Allowed or forbidden quantum numbers", pts: 4},
   {q: "#7", t: "Counting orbitals and electrons from n and l", pts: 3},
   {q: "#8", t: "Complete electron configurations (ions and exceptions too)", pts: 5}
  ],
  plan: [
   {day: "Day 1", t: "Light & photons", items: ["c = λν and E = hν = hc/λ (nm → m first)", "kJ/mol: multiply by 6.022 × 10²³, then ÷ 1000", "Photoelectric: KE = E(photon) − ϕ; no electrons if E < ϕ", "de Broglie: λ = h ÷ mv (mass in kg)"], game: "quantumchemistry"},
   {day: "Day 2", t: "Quantum numbers", items: ["l goes 0 to n − 1; mₗ goes −l to +l; mₛ is only ±½", "Orbitals in a shell = n², electrons = 2n²", "Orbital boxes: mₗ runs −l (left) to +l (right)"], game: "quantumchemistry"},
   {day: "Day 3", t: "Electron configurations", items: ["Fill in order: 1s 2s 2p 3s 3p 4s 3d 4p…", "Cations lose 4s electrons before 3d", "Know the exceptions: Cr, Cu (and Mo, Ag)"], game: "quantumchemistry"},
   {day: "Every day", t: "Daily 5", items: ["Five quick questions on light, quantum numbers and configurations", "Keep your streak going until skill check day"]}
  ],
  games: [
   {id: "quantumchemistry", focus: "Pick CHEM 1A, then do Light & Photons, Quantum Numbers and Electron Configurations."},
   {id: "algebratrainer", focus: "Warm up on rearranging E = hc/λ and λ = h/mv, and scientific notation."}
  ],
  mistakes: ["Forgetting nm → m (or Å → m)", "Mixing J per photon with kJ per mole", "Using grams instead of kg in λ = h/mv", "l equal to n, or mₛ that isn’t ±½", "Removing 3d electrons before 4s in cations"],
  daily: {
   title: "Skill Check #10 prep",
   note: "2 light and photon, 2 quantum number and 1 electron configuration question. About 5 minutes.",
   mix: [
    {ch: "6", n: 2, skills: ["quantum.light"]},
    {ch: "6", n: 2, skills: ["quantum.numbers", "quantum.orbitals"]},
    {ch: "6", n: 1, skills: ["quantum.config"]}
   ]
  }
 },
 "1A-11": {
  course: "1A", n: 11,
  title: "Periodic Trends & Chemical Bonding",
  points: 30, allowed: "Periodic table (provided)",
  topics: [
   {q: "#1", t: "Successive ionization energies: find the 3rd-period element + noble gas configuration", pts: 4},
   {q: "#2", t: "Periodic trends: rank atomic radius, first IE, isoelectronic ions; metallic character", pts: 4},
   {q: "#3", t: "Orbital diagram (1s–4p) for a transition-metal ion: unpaired e⁻, para- or diamagnetic", pts: 5},
   {q: "#4", t: "Lewis structures: multiple bonds, octet exceptions, a condensed formula", pts: 8},
   {q: "#5", t: "Resonance structures and formal charge", pts: 5},
   {q: "#6", t: "Bond type from ΔEN (nonpolar, polar, ionic) + dipole arrow", pts: 4}
  ],
  plan: [
   {day: "Day 1", t: "Periodic trends", items: ["Radius: bigger down a group, smaller across a period", "IE and electronegativity: the opposite (up and to the right)", "Same number of electrons: more protons = smaller ion", "Successive IE: the big jump comes right after the last valence electron"], game: "quantumchemistry"},
   {day: "Day 2", t: "Ions & orbital diagrams", items: ["Transition-metal cations lose 4s electrons before 3d", "Hund’s rule: one arrow in each box before pairing", "Any unpaired electron = paramagnetic; all paired = diamagnetic"], game: "quantumchemistry"},
   {day: "Day 3", t: "Lewis structures & octet exceptions", items: ["Count valence electrons first (add for −, subtract for +)", "Least electronegative atom in the middle; H is never central", "B is happy with 6 e⁻; S, P, Xe can go over 8", "C(O) in a condensed formula means C=O"], game: "lewisstructures"},
   {day: "Day 4", t: "Formal charge, resonance & polarity", items: ["FC = valence e⁻ − (lone-pair e⁻ + bonds)", "Resonance: same atoms, move only electrons; the real bonds are identical", "ΔEN: under 0.4 nonpolar, 0.4–2.0 polar, over 2.0 ionic", "Dipole arrow points to the more electronegative atom"], game: "lewisstructures"},
   {day: "Every day", t: "Daily 5", items: ["Five quick questions on trends, configurations, Lewis structures and polarity", "Keep your streak going until skill check day"]}
  ],
  games: [
   {id: "quantumchemistry", focus: "Pick CHEM 1A, then do Periodic Trends and Electron Configurations (orbital diagrams and ions)."},
   {id: "lewisstructures", focus: "Build Lewis structures (octet exceptions too), then practice bond polarity. Skip VSEPR shapes for now."}
  ],
  mistakes: ["Ranking radius backwards (it gets smaller across a period)", "Removing 3d electrons before 4s in transition-metal ions", "Miscounting valence electrons for ions", "Forcing an octet on boron, or not expanding S, P and Xe", "Formal charges that don’t add up to the ion’s charge", "Dipole arrow pointing at the less electronegative atom"],
  daily: {
   title: "Skill Check #11 prep",
   note: "2 periodic trend, 1 electron configuration, 1 Lewis structure and 1 bond polarity question. About 5 minutes.",
   mix: [
    {ch: "6", n: 2, skills: ["quantum.trends"]},
    {ch: "6", n: 1, skills: ["quantum.config"]},
    {ch: "7", n: 1, skills: ["lewisstructures.valence-electrons", "lewisstructures.octet-exception"]},
    {ch: "7", n: 1, skills: ["lewisstructures.bond-category", "lewisstructures.bond-delta-en"]}
   ]
  }
 }
};
