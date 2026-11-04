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
  /* Daily 5 on the Canvas home page: 2 simple mass-to-mass stoichiometry questions + 3 final-exam review questions from Ch 1-10 */
  daily: {
   title: "Mass-to-mass stoichiometry + final exam review",
   note: "2 quick stoichiometry questions (grams → moles → grams) and 3 review questions from Ch 1–10 to get ready for the final. About 5 minutes.",
   focus: {ch: "11", n: 2, skills: ["stoichiometry.learn-gg"]},
   review: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
  }
 },
 "1A": {
  updated: "2026-10-31",
  week: 13,
  lecture: {text: "Ch 6: Electronic Structure (quantum chemistry)", ch: "6"},
  check: {n: 10, topic: "Quantum chemistry", ch: ["6"]},
  next: "3",
  done: "Exam #2 is done, and Skill Check #9 covered gases."
 }
};
