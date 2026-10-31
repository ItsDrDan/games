#!/usr/bin/env python3
"""Pull Dr. Dan's current course calendars from FCC's public Simple Syllabus library
and save them to data/syllabus.json for the study hub ("This week in CHEM 3A", exam weeks).

Runs automatically every week from GitHub Actions (.github/workflows/syllabus.yml),
or by hand:  python3 tools/update_syllabus.py
Only public syllabi are read; nothing needs a login.
"""
import json, re, sys, time, urllib.request
from html.parser import HTMLParser
from pathlib import Path

BASE = "https://fresnocitycollege.simplesyllabus.com"
INSTRUCTOR = "Kwasniewski"
COURSES = ["3A", "1A", "1B", "3B"]
OUT = Path(__file__).resolve().parent.parent / "data" / "syllabus.json"
TERM_ORDER = {"SP": 1, "SU": 2, "FA": 3}


def get_json(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "itsdrdan-study-hub/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def term_key(name):  # "2026FA" -> (2026, 3)
    m = re.match(r"(\d{4})([A-Z]{2})", name or "")
    return (int(m.group(1)), TERM_ORDER.get(m.group(2), 0)) if m else (0, 0)


class TableText(HTMLParser):
    """Collect the rows/cells of every <table> as plain text (line breaks kept as ' | ')."""
    def __init__(self):
        super().__init__(); self.tables = []; self.row = None; self.cell = None
    def handle_starttag(self, tag, attrs):
        if tag == "table": self.tables.append([])
        elif tag == "tr" and self.tables: self.row = []; self.tables[-1].append(self.row)
        elif tag in ("td", "th") and self.row is not None: self.cell = []; self.row.append(self.cell)
        elif tag == "br" and self.cell is not None: self.cell.append("\n")
    def handle_endtag(self, tag):
        if tag == "p" and self.cell is not None: self.cell.append("\n")
        if tag in ("td", "th"): self.cell = None
    def handle_data(self, data):
        if self.cell is not None: self.cell.append(data)
    def rows(self):
        out = []
        for t in self.tables:
            for r in t:
                cells = [" | ".join(s.strip() for s in "".join(c).replace("\xa0", " ").split("\n") if s.strip()) for c in r]
                out.append(cells)
        return out


def strip_html(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h or "")).strip()


def parse_calendar(components):
    for c in components:
        h = c.get("html") or ""
        if "<table" in h.lower() and re.search(r"lecture\s+topics", h, re.I):
            p = TableText(); p.feed(h); rows = p.rows()
            weeks = []
            for cells in rows:
                if not cells or not re.match(r"\s*\d+", cells[0]):
                    continue
                first = cells[0].split(" | ")
                wk = int(re.match(r"\s*(\d+)", first[0]).group(1))
                date = " ".join(first[1:]).strip()
                lecture = cells[1] if len(cells) > 1 else ""
                rest = cells[2:]
                lab = rest[0] if len(rest) > 0 else ""
                quiz = rest[1] if len(rest) > 1 else ""
                text = " | ".join(cells[1:])
                events = []
                for m in re.finditer(r"\bExam\s*#?\s*(\d)", text, re.I): events.append({"type": "exam", "id": m.group(1)})
                if re.search(r"\bfinal exam\b", text, re.I) and not re.search(r"mock final", text, re.I): events.append({"type": "exam", "id": "final"})
                for m in re.finditer(r"(?<!Mastery )Skill Check\s*#?\s*(\d+)\s*:?\s*\|?\s*([^|]*)", text, re.I):
                    topic = m.group(2).strip()
                    events.append({"type": "check", "id": m.group(1), "topic": "" if re.match(r"tbd", topic, re.I) else topic})
                if re.search(r"Mastery Skill Check", text, re.I): events.append({"type": "mastery"})
                if re.search(r"Lab Practical", text, re.I): events.append({"type": "practical"})
                weeks.append({"week": wk, "date": date, "lecture": lecture, "lab": lab, "quiz": quiz, "events": events})
            if weeks:
                return weeks
    return []


def main():
    found = {}
    for page in range(5):
        res = get_json(f"/api2/doc-library-search?search={INSTRUCTOR}&page={page}")
        items = res.get("items") or []
        for it in items:
            m = re.search(r"CHEM\s*(3A|1A|1B|3B)\b", it.get("title", ""), re.I)
            if not m or it.get("visibility") != "general_public": continue
            cid = m.group(1).upper()
            if cid not in found or term_key(it["term_name"]) > term_key(found[cid]["term_name"]):
                found[cid] = it
        if len(items) < 50: break
    data = {"updated": time.strftime("%Y-%m-%d"), "source": BASE + "/en-US/syllabus-library", "courses": {}}
    for cid, it in sorted(found.items()):
        full = get_json(f"/api2/doc-full-page-get?code={it['code']}")
        comps = full["items"][0]["doc_data"]["components"]
        alltext = " ".join(strip_html(c.get("html")) for c in comps)
        start = re.search(r"Start Date:\s*([\d/]+)", alltext)
        end = re.search(r"End Date:\s*([\d/]+)", alltext)
        weeks = parse_calendar(comps)
        data["courses"][cid] = {"term": it["term_name"], "title": it.get("sub_title", ""), "section": it.get("title", ""),
                                 "url": f"{BASE}/en-US/doc/{it['code']}", "start": start.group(1) if start else None,
                                 "end": end.group(1) if end else None, "weeks": weeks}
        print(f"CHEM {cid} {it['term_name']}: {len(weeks)} calendar weeks")
    if not data["courses"]:
        sys.exit("No public syllabi found; leaving the old file alone.")
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    if {k: v for k, v in old.items() if k != "updated"} == {k: v for k, v in data.items() if k != "updated"}:
        print("No changes."); return
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print("Wrote", OUT)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # show the reason as a GitHub annotation
        body = ""
        if hasattr(e, "read"):
            try: body = e.read()[:300].decode("utf-8", "ignore")
            except Exception: pass
        print(f"::error::{type(e).__name__}: {e} {body}".replace("\n", " "))
        sys.exit(1)
