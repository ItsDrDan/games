# Dr. Dan’s Chemistry Study Hub

Live at **https://itsdrdan.github.io/games/**

One place for Fresno City College chemistry students to find what to study for **CHEM 3A, 1A, 1B, and 3B**:
pick a course → pick a chapter → get the textbook reading, Dr. Dan’s video lessons, and the games that practice it.
Or search any topic (“limiting reactant”, “buffers”, “3A chapter 8”).

## Files

| File | What it is |
|---|---|
| `index.html` | The hub itself (no build step). |
| `data/hub.js` | **The course map.** Courses → chapters → concepts, reading links, games, videos. Edit this by hand. |
| `data/youtube.json` | *(optional, generated)* every video on the channel, its playlists, and chapter markers. |
| `data/transcripts.json` | *(optional, generated)* searchable caption snippets, so students can find the exact moment you explain something. |
| `tools/update_youtube.py` | Builds the two generated files from the YouTube channel. |

## Common edits (all in `data/hub.js`)

- **Add a new game to a chapter:** add the game to the `games` list (`id` = repo name), then put that id in the chapter’s `"games": [...]`.
  New repos that have GitHub Pages and a `meta.json` also appear on **All games** automatically, even before you add them to a chapter.
- **Add a video to a chapter:** add it to `videos` (`id` = the part after `watch?v=`), then put the id in the chapter’s `"videos": [...]`.
  Add `"moments": [[seconds, "label"], ...]` to give it jump-to buttons.
- **Link a whole playlist to a chapter:** put the playlist id in the chapter’s `"playlists": [...]`. Once `youtube.json` exists, every video in that playlist shows up on the chapter automatically.
- **CHEM 3B textbook:** when the LibreTexts book is published, set `book.url` for course `3B` and add a `read` block (`url` + `sections`) to each unit.
- **Hide a repo from the catalog:** add its name to `hide`.

## Updating transcript search from your saved captions (what we use now)

Your Descript caption files live in `~/Desktop/YouTube Production/Subtitles `. To rebuild after adding new ones:

1. Export the video list from YouTube Studio (Analytics → Advanced mode → Content → download) and turn it into
   `tools/channel_videos.tsv` (`VIDEO_ID<TAB>Title<TAB>seconds`), or just ask Claude to do it.
2. `python3 tools/build_transcripts.py "~/Desktop/YouTube Production/Subtitles " tools/channel_videos.tsv`

Files are matched to videos by title and by length. Hand pairings live in `tools/caption_overrides.tsv`.

## Alternative: pulling everything straight from YouTube

YouTube blocks most cloud servers, so run this on your own computer from the repo folder:

```bash
pip3 install --upgrade yt-dlp
python3 tools/update_youtube.py --limit 5     # quick test with the 5 newest videos
python3 tools/update_youtube.py               # whole channel (re-runs only fetch new videos)
```

Then commit the `data/` folder. The hub picks it up on the next page load:
video chapter markers become “key moments,” playlist videos attach to their chapters, and search gains a
**“Said in Dr. Dan’s videos”** section that jumps straight to the timestamp.

Tip: chapter markers come from timestamps in each video’s description (`0:00 Intro`, `5:17 Combined gas law`, …),
so adding those in YouTube Studio makes the “key moments” richer.
