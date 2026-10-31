#!/usr/bin/env python3
"""Build data/transcripts.json from caption files you already have (e.g. Descript or
YouTube Studio exports named by video title), matching each file to its YouTube video.

    python3 tools/build_transcripts.py "~/Desktop/YouTube Production/Subtitles " videos.tsv

videos.tsv is the channel's video list, one "VIDEO_ID<TAB>Title" per line. Make it with:
    yt-dlp --flat-playlist --print "%(id)s	%(title)s" https://www.youtube.com/@itsdrdan/videos > videos.tsv
Videos already listed in data/hub.js are matched too. Files that can't be matched are
listed in tools/unmatched_captions.txt; add a line "VIDEO_ID<TAB>file name" to
tools/caption_overrides.tsv to pair them by hand.
"""
import difflib, json, re, sys, time, unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
from update_youtube import parse_captions, segment  # noqa: E402

SKIP = re.compile(r"screenshot|welcome video|welcome to chem|mini.?lectures? and how|trailer", re.I)

def key(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\.(vtt|srt)$", "", s)
    s = re.sub(r"\b(copy|itsdrdan|chemistry|chem|the|and|a|an|of|to|for|in|with|how|what|is)\b", " ", s)
    return " ".join(re.sub(r"[^a-z0-9]+", " ", s).split())

def hub_videos():
    js = (ROOT / "data" / "hub.js").read_text(encoding="utf-8")
    data = json.loads(js[js.index("{"): js.rindex("}") + 1])
    return {v["id"]: v["title"] for v in data["videos"]}

def main():
    caps = Path(sys.argv[1]).expanduser()
    catalog = hub_videos()
    if len(sys.argv) > 2:
        for line in Path(sys.argv[2]).expanduser().read_text(encoding="utf-8").splitlines():
            if "\t" in line:
                vid, title = line.split("\t", 1)
                catalog[vid.strip()] = title.strip()
    overrides = {}
    ov = HERE / "caption_overrides.tsv"
    if ov.exists():
        for line in ov.read_text(encoding="utf-8").splitlines():
            if "\t" in line and not line.startswith("#"):
                vid, name = line.split("\t", 1)
                overrides[name.strip()] = vid.strip()
    keys = {vid: key(t) for vid, t in catalog.items()}
    files = sorted(p for p in caps.iterdir() if p.suffix.lower() in (".vtt", ".srt"))
    # prefer .vtt when both exist
    names = {}
    for p in files:
        names.setdefault(p.stem, p) if p.suffix.lower() == ".srt" else names.__setitem__(p.stem, p)
    segments, titles, matched, unmatched, skipped = [], {}, [], [], []
    # score every file against every video, then pair greedily best-first (one file per video)
    cands, chosen = [], {}
    for stem, p in sorted(names.items()):
        if SKIP.search(stem) and p.name not in overrides:
            skipped.append(p.name); continue
        if p.name in overrides:
            chosen[p.name] = overrides[p.name]; continue
        k = key(stem)
        for v, vk in keys.items():
            cands.append((difflib.SequenceMatcher(None, k, vk).ratio(), p.name, v))
    used = set(chosen.values())
    for score, name, v in sorted(cands, reverse=True):
        if score < 0.8: break
        if name in chosen or v in used: continue
        chosen[name] = v; used.add(v)
    for stem, p in sorted(names.items()):
        if p.name in skipped: continue
        vid = chosen.get(p.name)
        if not vid:
            unmatched.append(p.name); continue
        matched.append((p.name, vid, catalog.get(vid, "")))
        titles[vid] = catalog.get(vid) or stem
        for s, text in segment(parse_captions(p.read_text(encoding="utf-8", errors="ignore"))):
            segments.append([vid, s, text])
    out = {"updated": time.strftime("%Y-%m-%d"), "titles": titles, "segments": segments}
    (ROOT / "data" / "transcripts.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (HERE / "unmatched_captions.txt").write_text("\n".join(unmatched) + "\n", encoding="utf-8")
    print(f"matched {len(matched)} files -> {len(segments)} snippets; unmatched {len(unmatched)}; skipped {len(skipped)} (welcome/admin)")
    for n, v, t in matched:
        print(f"  ✓ {n}  →  {v}  {t}")
    for n in unmatched:
        print(f"  ✗ {n}")

if __name__ == "__main__":
    main()
