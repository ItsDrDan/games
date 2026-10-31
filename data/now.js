/* "Where we actually are" overrides, so the hub matches real class pace even when the
   syllabus calendar is behind. Update by telling Claude, e.g. "3A: next skill check is #10 on acids".
   week   = the class week this applies to
   lecture = what's being taught now; ch = matching hub chapter id(s)
   check  = the next skill check: number, topic, and chapters for its plan
   next   = id of the next exam (used when the syllabus has no calendar)
   done   = recent things already finished (shown as a small note) */
window.HUB_NOW = {
 "3A": {
  updated: "2026-10-31",
  week: 13,
  lecture: {text: "Starting Ch 11: Stoichiometry", ch: "11"},
  check: {n: 9, topic: "Ideal gas law, molarity, and a simple stoichiometry problem or two", ch: ["8", "9", "11"]},
  done: "Exam #2 is done, and Skill Check #8 covered chemical reactions."
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
