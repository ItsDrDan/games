#!/usr/bin/env python3
"""Build the hub's YouTube data from Dr. Dan's channel.

Run this on your own computer (YouTube blocks most cloud servers):

    pip3 install --upgrade yt-dlp
    python3 tools/update_youtube.py

It writes two files the hub reads automatically:
  data/youtube.json      every video, its playlists, and its chapter markers ("key moments")
  data/transcripts.json  the captions, cut into ~25-second searchable snippets

Captions are cached in tools/.captions/, so re-running only fetches new videos.
If you'd rather use captions downloaded from YouTube Studio, save each one as
tools/.captions/<VIDEO_ID>.en.vtt (or .srt) and run with --no-download.

Options:
  --channel URL     channel to read (default https://www.youtube.com/@itsdrdan)
  --limit N         only process the newest N videos (good for a first test)
  --no-captions     only refresh the video/playlist list
  --no-download     don't contact YouTube for captions; use what's in tools/.captions/
  --sleep SECONDS   pause between videos (default 1.5) to stay under YouTube's limits
"""
import argparse, html, json, re, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CAPS = ROOT / "tools" / ".captions"
CACHE = CAPS / "_video_info.json"
SEGMENT_SECONDS = 25
SEGMENT_MAX_WORDS = 70


# ---------- caption parsing ----------
TS = re.compile(r"(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{3})")

def to_sec(m):
    h, mnt, s, ms = m.groups()
    return int(h or 0) * 3600 + int(mnt) * 60 + int(s) + int(ms) / 1000

def parse_captions(text):
    """Return [(start_seconds, line_text)] from VTT or SRT, removing the rolling
    duplicates that YouTube's automatic captions repeat from cue to cue."""
    cues, cur = [], None
    for raw in text.replace("\r", "").split("\n"):
        if "-->" in raw:
            m = TS.search(raw)
            cur = [to_sec(m), []] if m else None
            if cur:
                cues.append(cur)
            continue
        if cur is None:
            continue
        l = re.sub(r"<[^>]+>", "", raw)              # inline timing / style tags
        l = html.unescape(l).strip()
        l = re.sub(r"\[(music|applause|laughter)\]", "", l, flags=re.I).strip()
        if l and not l.isdigit():
            cur[1].append(l)
    out, last = [], []
    for start, body in cues:
        for l in body:
            if l in last or (out and out[-1][1] == l):
                continue
            out.append((start, l))
        if body:
            last = body
    return out

def segment(lines):
    """Group caption lines into ~25 s snippets: [[start, text], ...]"""
    segs, cur, cur_start = [], [], None
    for t, l in lines:
        if cur and (t - cur_start >= SEGMENT_SECONDS or sum(len(x.split()) for x in cur) >= SEGMENT_MAX_WORDS):
            segs.append([round(cur_start), " ".join(cur)])
            cur, cur_start = [], None
        if cur_start is None:
            cur_start = t
        cur.append(l)
    if cur:
        segs.append([round(cur_start), " ".join(cur)])
    return [[s, re.sub(r"\s+", " ", x).strip()] for s, x in segs if x.strip()]

def find_caption_file(vid):
    for pat in (f"{vid}.en.vtt", f"{vid}.en-US.vtt", f"{vid}.en-orig.vtt", f"{vid}.vtt", f"{vid}.en.srt", f"{vid}.srt"):
        p = CAPS / pat
        if p.exists():
            return p
    hits = sorted(CAPS.glob(f"{vid}.*.vtt")) + sorted(CAPS.glob(f"{vid}.*.srt"))
    return hits[0] if hits else None


# ---------- YouTube ----------
def ydl(opts=None):
    try:
        import yt_dlp
    except ImportError:
        sys.exit("yt-dlp is not installed. Run:  pip3 install --upgrade yt-dlp")
    base = {"quiet": True, "no_warnings": True, "ignoreerrors": True}
    base.update(opts or {})
    return yt_dlp.YoutubeDL(base)

def flat(url):
    with ydl({"extract_flat": "in_playlist"}) as y:
        info = y.extract_info(url, download=False) or {}
    return [e for e in (info.get("entries") or []) if e]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--channel", default="https://www.youtube.com/@itsdrdan")
    ap.add_argument("--limit", type=int)
    ap.add_argument("--no-captions", action="store_true")
    ap.add_argument("--no-download", action="store_true")
    ap.add_argument("--sleep", type=float, default=1.5)
    a = ap.parse_args()
    CAPS.mkdir(parents=True, exist_ok=True)
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}

    print("Reading the channel's video list…")
    vids = flat(a.channel.rstrip("/") + "/videos")
    if a.limit:
        vids = vids[: a.limit]
    print(f"  {len(vids)} videos")

    print("Reading playlists…")
    playlists, membership = {}, {}
    for p in flat(a.channel.rstrip("/") + "/playlists"):
        pid, title = p.get("id"), p.get("title")
        if not pid:
            continue
        playlists[pid] = title
        for e in flat(f"https://www.youtube.com/playlist?list={pid}"):
            if e.get("id"):
                membership.setdefault(e["id"], []).append(pid)
    print(f"  {len(playlists)} playlists")

    videos, segments, titles = [], [], {}
    for i, v in enumerate(vids, 1):
        vid, title = v.get("id"), v.get("title") or ""
        if not vid:
            continue
        titles[vid] = title
        info = cache.get(vid)
        need_caps = not a.no_captions and not a.no_download and find_caption_file(vid) is None
        if info is None or need_caps:
            print(f"  [{i}/{len(vids)}] {title[:70]}")
            opts = {"skip_download": True, "outtmpl": str(CAPS / "%(id)s.%(ext)s")}
            if need_caps:
                opts.update({"writesubtitles": True, "writeautomaticsub": True,
                             "subtitleslangs": ["en", "en-US", "en-orig"], "subtitlesformat": "vtt"})
            with ydl(opts) as y:
                full = y.extract_info(f"https://www.youtube.com/watch?v={vid}", download=need_caps) or {}
            info = {"duration": full.get("duration"), "upload_date": full.get("upload_date"),
                    "chapters": [[round(c.get("start_time", 0)), c.get("title", "")] for c in (full.get("chapters") or [])]}
            cache[vid] = info
            CACHE.write_text(json.dumps(cache))
            time.sleep(a.sleep)
        videos.append({"id": vid, "title": title, "duration": info.get("duration") or v.get("duration"),
                       "date": info.get("upload_date"), "playlists": membership.get(vid, []),
                       "chapters": info.get("chapters") or []})
        if not a.no_captions:
            f = find_caption_file(vid)
            if f:
                for s, text in segment(parse_captions(f.read_text(encoding="utf-8", errors="ignore"))):
                    segments.append([vid, s, text])

    stamp = time.strftime("%Y-%m-%d")
    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data" / "youtube.json").write_text(json.dumps({"updated": stamp, "playlists": playlists, "videos": videos}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote data/youtube.json ({len(videos)} videos)")
    if not a.no_captions:
        (ROOT / "data" / "transcripts.json").write_text(json.dumps({"updated": stamp, "titles": titles, "segments": segments}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        with_caps = len({s[0] for s in segments})
        print(f"Wrote data/transcripts.json ({len(segments)} snippets from {with_caps} videos)")
    print("Done. Commit the data/ folder to update the hub.")

if __name__ == "__main__":
    main()
