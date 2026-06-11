# Queenstown & Milford Sound — Curated Photo Library Report

**Date:** 2026-06-10  
**Scope:** Photo library assets only — no HTML or webpage changes.

---

## Summary

| Destination | Source Folder | Reviewed | Retained | Library Path |
|-------------|---------------|----------|----------|--------------|
| Queenstown Day Tour | `~/Desktop/NZ-Travel-photos /mount-cook/Queenstown-day-tour/` | 440 | **41** | `Photo Library/Queenstown-Day-Tour/` |
| Milford Sound Day Tour | `~/Desktop/NZ-Travel-photos /miford-sound-day-tour/` | 227 | **41** | `Photo Library/Milford-Sound-Day-Tour/` |

Gallery metadata:
- `gallery/queenstown-day-tour.json`
- `gallery/milford-sound-day-tour.json`

Build script: `scripts/build-queenstown-milford-galleries.mjs`  
Assignments: `scripts/queenstown-milford-assignments.json`

---

## Queenstown Day Tour

### Cleanup

| Step | Count |
|------|-------|
| Total in source folder | 440 |
| Exact/near duplicates removed (phash ≤ 6) | 82 → 358 unique |
| Low-quality small exports excluded (< 120 KB `_4_5005_c`) | 65 |
| **Curated after visual review** | **41** |

### Category Breakdown

| Category | Count |
|----------|-------|
| 01-Hero | 5 |
| 02-Lake-Wakatipu | 10 |
| 03-Skyline-Gondola | 3 |
| 04-Adventure-Activities | 8 |
| 05-Town-Centre | 9 |
| 06-Food-Experiences | 6 |

### Hero Image Candidates (priority order)

1. **`queenstown-hero-remarkables-sunset-01.jpg`** — Alpenglow on The Remarkables over Lake Wakatipu *(primary)*
2. **`queenstown-hero-double-rainbow-02.jpg`** — Double rainbow from Bob's Peak
3. **`queenstown-hero-lake-panorama-03.jpg`** — Wide panorama of lake, Remarkables and valley
4. **`queenstown-hero-rainbow-town-04.jpg`** — Full-arc rainbow over waterfront
5. **`queenstown-hero-golden-peak-05.jpg`** — Golden-hour peak over Lake Wakatipu

### Optimization

- Format: JPEG (quality 85)
- Max dimension: 1920 px
- SEO filenames: `queenstown-{category}-{descriptor}-NN.jpg`
- Library size: ~7.0 MB (41 files)

---

## Milford Sound Day Tour

### Cleanup

| Step | Count |
|------|-------|
| Total in source folder | 227 |
| Exact/near duplicates removed (phash ≤ 6) | 18 → 209 unique |
| Low-quality small exports excluded | 11 |
| Wrong-location shots excluded (Queenstown images in Milford folder) | several |
| **Curated after visual review** | **41** |

### Category Breakdown

| Category | Count |
|----------|-------|
| 01-Hero | 5 |
| 02-Cruise-Experience | 9 |
| 03-Fiord-Scenery | 8 |
| 04-Waterfalls | 9 |
| 05-Scenic-Viewpoints | 7 |
| 06-Wildlife | 3 |

### Hero Image Candidates (priority order)

1. **`milford-sound-hero-mitre-peak-01.jpg`** — Mitre Peak reflected in calm fiord *(primary)*
2. **`milford-sound-hero-dramatic-sky-02.jpg`** — Storm clouds over Mitre Peak with cruise boat
3. **`milford-sound-hero-misty-cliffs-03.jpg`** — Misty cliffs with waterfalls
4. **`milford-sound-hero-eglinton-valley-04.jpg`** — Eglinton Valley autumn (journey hero)
5. **`milford-sound-hero-cruise-mitre-peak-05.jpg`** — Cruise terminal with Mitre Peak

### Optimization

- Format: JPEG (quality 85)
- Max dimension: 1920 px
- SEO filenames: `milford-sound-{category}-{descriptor}-NN.jpg`
- Library size: ~7.8 MB (41 files)

---

## Cleanup Report

### Duplicates Removed

- **Queenstown:** 15 duplicate clusters (82 files total removed from dedup pool)
- **Milford:** 7 duplicate clusters (18 files total removed from dedup pool)

### Similar Images Removed

Visual review removed near-duplicates within categories (e.g. multiple similar lake/rainbow shots, repeated cruise angles, redundant waterfall frames).

### Excluded Content

- Blurry or indoor-only shots
- PNG screenshots / low-resolution exports
- Files under quality thresholds
- Milford folder: images clearly from Queenstown or other locations

### Missing / Thin Categories

| Destination | Category | Status |
|-------------|----------|--------|
| Queenstown | Skyline Gondola | 3 images — adequate but could add 1–2 if more gondola-specific shots found |
| Milford | Waterfalls | Numbering skips `-03` (removed as near-duplicate of `-02`) |
| Milford | Scenic Viewpoints | Numbering skips `-01` (removed as weak/duplicate) |
| Milford | Wildlife | 3 Kea images only — no marine wildlife in source folder |

All six required categories are populated for both destinations.

---

## What Was NOT Changed

- No HTML files modified
- No page layouts changed
- No Queenstown or Milford Sound webpage integration
- Original source photos on Desktop remain untouched (copy-only workflow)

---

## Next Steps (awaiting approval)

1. Review hero candidates and category selections
2. Integrate into existing Queenstown / Milford Sound pages when approved
3. Optionally add `site/routes/` cover images from hero selections

To rebuild libraries after assignment edits:

```bash
node scripts/build-queenstown-milford-galleries.mjs --force
```
