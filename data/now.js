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
  /* Daily 5 on the Canvas home page: 2 simple stoichiometry, 1 simple reaction, 1 simple molarity, 1 gas law */
  daily: {
   title: "Stoichiometry, reactions, molarity & gas laws",
   note: "2 quick stoichiometry questions, 1 chemical reaction, 1 molarity and 1 gas law question. About 5 minutes.",
   /* older daily.js reads focus/review; newer daily.js uses mix */
   focus: {ch: "11", n: 2, skills: ["stoichiometry.learn-molmol", "stoichiometry.learn-gmol", "stoichiometry.learn-gg"]},
   review: ["10", "9", "8"],
   mix: [
    {ch: "11", n: 2, skills: ["stoichiometry.learn-molmol", "stoichiometry.learn-gmol", "stoichiometry.learn-gg"]},
    {ch: "10", n: 1, skills: ["reactions.combination", "reactions.decomposition", "reactions.single-displacement", "reactions.double-displacement", "reactions.combustion"]},
    {ch: "9", n: 1, gen: "molarity"},
    {ch: "8", n: 1, skills: ["gaslaws.boyle", "gaslaws.charles-gay-lussac", "gaslaws.combined", "gaslaws.ideal"]}
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
   note: "5 quick questions on light and photons, the Bohr model, and quantum numbers. About 5 minutes.",
   focus: {ch: "6", n: 5, skills: ["quantum.light", "quantum.bohr", "quantum.numbers"]},
   mix: [{ch: "6", n: 5, skills: ["quantum.light", "quantum.bohr", "quantum.numbers"]}]
  }
 }
};
