# Queenstown & Milford Sound — Curated Photo Library Report

**Date:** 2026-06-11  
**Status:** Complete — libraries built and verified  
**Scope:** Photo library assets only — no HTML or webpage changes.

---

## Executive Summary

| Destination | Source (Desktop) | Reviewed | Retained | Library | Gallery JSON |
|-------------|------------------|----------|----------|---------|--------------|
| Queenstown Day Tour | `NZ-Travel-photos /mount-cook/Queenstown-day-tour/` | 440 | **41** | `Photo Library/Queenstown-Day-Tour/` | `gallery/queenstown-day-tour.json` |
| Milford Sound Day Tour | `NZ-Travel-photos /miford-sound-day-tour/` | 227 | **41** | `Photo Library/Milford-Sound-Day-Tour/` | `gallery/milford-sound-day-tour.json` |

**Build verification (2026-06-11):** 82/82 source files copied successfully, 0 missing.  
**Rebuild command:** `node scripts/build-queenstown-milford-galleries.mjs --force`

---

## 1. Photo Cleanup

### Queenstown (440 → 41)

| Step | Result |
|------|--------|
| Exact/near duplicates removed (perceptual hash ≤ 6) | 82 files → 358 unique candidates |
| Low-quality small exports excluded (`_4_5005_c` under ~120 KB) | 65 excluded |
| Blurry, indoor-only, or redundant angles removed in visual review | remainder culled |
| **Final curated set** | **41 images** |

### Milford (227 → 41)

| Step | Result |
|------|--------|
| Exact/near duplicates removed (perceptual hash ≤ 6) | 18 files → 209 unique candidates |
| Low-quality exports excluded | 11 excluded |
| Wrong-location shots removed (Queenstown images in Milford folder) | several excluded |
| **Final curated set** | **41 images** |

Source folders on Desktop were **not modified** — copy-only workflow into `Photo Library/`.

---

## 2. Categorization

### Queenstown Day Tour

| Category | Slug | Count |
|----------|------|-------|
| 01-Hero | `hero` | 5 |
| 02-Lake-Wakatipu | `lake-wakatipu` | 10 |
| 03-Skyline-Gondola | `skyline-gondola` | 3 |
| 04-Adventure-Activities | `adventure-activities` | 8 |
| 05-Town-Centre | `town-centre` | 9 |
| 06-Food-Experiences | `food-experiences` | 6 |

### Milford Sound Day Tour

| Category | Slug | Count |
|----------|------|-------|
| 01-Hero | `hero` | 5 |
| 02-Cruise-Experience | `cruise-experience` | 9 |
| 03-Fiord-Scenery | `fiord-scenery` | 8 |
| 04-Waterfalls | `waterfalls` | 9 |
| 05-Scenic-Viewpoints | `scenic-viewpoints` | 7 |
| 06-Wildlife | `wildlife` | 3 |

All six required categories are populated for both destinations.

---

## 3. Hero Image Selection

Hero priority is defined in `scripts/queenstown-milford-assignments.json` → `hero_candidates` (first entry = `heroPrimary` in gallery JSON).

### Queenstown — primary: `queenstown-hero-remarkables-sunset-01.jpg`

1. **remarkables-sunset-01** — Alpenglow on The Remarkables over Lake Wakatipu *(primary banner)*
2. **double-rainbow-02** — Double rainbow from Bob's Peak
3. **lake-panorama-03** — Wide panorama of lake, Remarkables and valley
4. **rainbow-town-04** — Full-arc rainbow over waterfront
5. **golden-peak-05** — Golden-hour peak over Lake Wakatipu

### Milford — primary: `milford-sound-hero-mitre-peak-01.jpg`

1. **mitre-peak-01** — Mitre Peak reflected in calm fiord *(primary banner)*
2. **dramatic-sky-02** — Storm clouds over Mitre Peak with cruise boat
3. **misty-cliffs-03** — Misty cliffs with waterfalls
4. **eglinton-valley-04** — Eglinton Valley autumn (journey hero)
5. **cruise-mitre-peak-05** — Cruise terminal with Mitre Peak

---

## 4. SEO Filenames

Naming convention applied on copy:

| Tour | Pattern | Example |
|------|---------|---------|
| Queenstown | `queenstown-{category}-{descriptor}-NN.jpg` | `queenstown-lake-wakatipu-01.jpg` |
| Milford | `milford-sound-{category}-{descriptor}-NN.jpg` | `milford-sound-cruise-experience-03.jpg` |

Each file includes bilingual metadata in gallery JSON: `titleEn`, `titleZh`, `alt`, `caption`, `seoKeywords`.

**Optimization:** JPEG quality 85, max dimension 1920 px (Pillow via build script).  
**Library sizes:** Queenstown ~7.0 MB · Milford ~7.8 MB.

**Intentional numbering gaps (Milford):**
- Waterfalls: no `-03` (near-duplicate of `-02` removed)
- Scenic Viewpoints: no `-01` (weak/duplicate removed)

---

## 5. Gallery JSON Files

| File | Images | `heroPrimary` | Generated |
|------|--------|---------------|-----------|
| `gallery/queenstown-day-tour.json` | 41 | `queenstown-hero-remarkables-sunset-01.jpg` | 2026-06-11 |
| `gallery/milford-sound-day-tour.json` | 41 | `milford-sound-hero-mitre-peak-01.jpg` | 2026-06-11 |

Each manifest includes:
- `categories[]` with per-section `images`, `primary`, bilingual titles
- `heroImages[]` and `heroCandidates[]` with selection reasons
- `images[]` flat list for page integration
- `libraryRoot` pointing to `Photo Library/{Tour}/`

**Photo indexes (source → SEO filename mapping):**
- `Photo Library/Queenstown-Day-Tour/photo_index.csv`
- `Photo Library/Milford-Sound-Day-Tour/photo_index.csv`
- `reports/2026-06-11-queenstown-day-tour-index.csv`
- `reports/2026-06-11-milford-day-tour-index.csv`

**Assignments source of truth:** `scripts/queenstown-milford-assignments.json`  
**Build script:** `scripts/build-queenstown-milford-galleries.mjs`

---

## 6. Thin Categories & Notes

| Destination | Category | Note |
|-------------|----------|------|
| Queenstown | Skyline Gondola | 3 images — adequate; could add 1–2 gondola-specific shots later |
| Milford | Wildlife | 3 Kea images only — no marine wildlife in source folder |
| Both | Hero | `order` in JSON follows alphabetical filename within folder; `heroPrimary` / `hero_candidates` define display priority |

---

## What Was NOT Changed

- No HTML files modified
- No page layouts changed
- No Queenstown or Milford Sound route page integration
- Desktop source photos untouched

---

## Ready for Next Phase

Libraries and gallery JSON are ready for webpage integration when approved. Suggested next steps:

1. Wire `gallery/queenstown-day-tour.json` and `gallery/milford-sound-day-tour.json` into route pages
2. Use `heroPrimary` paths for cover/banner images
3. Optionally register tours in `gallery/manifest.json` regional hub
