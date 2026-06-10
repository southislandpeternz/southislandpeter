# Kaikoura Day Tour — Gallery Rebuild Report

**Date:** 2026-06-10  
**Action:** Scanned `Photo Library/Kaikoura-Day-Tour/`, removed stale manifest entries, regenerated `gallery/kaikoura-day-tour.json` (`--from-disk`).

## Summary

| Metric | Before | After |
| --- | ---: | ---: |
| Manifest images | 18 | **15** |
| Missing on disk | 3 | **0** |
| Black / broken cards | 0 | **0** |
| Hero primary | `kaikoura-coastal-seals-mountains-01.jpg` | `kaikoura-coastal-peninsula-landscape-01.jpg` |

## Removed from manifest (no longer on disk)

| Filename | Former section | Status |
| --- | --- | --- |
| `kaikoura-coastal-seals-mountains-01.jpg` | Hero / 海岸风光 | **Removed** — file deleted |
| `wildlife-fur-seals-peninsula-01.jpg` | 野生动物 | **Removed** — file deleted |
| `wildlife-seal-colony-walk-01.jpg` | 野生动物 | **Removed** — file deleted |

## Current gallery (all verified)

| Section | Image filename | Status |
| --- | --- | --- |
| Hero Banner | `kaikoura-coastal-peninsula-landscape-01.jpg` | OK |
| 海岸风光 | `kaikoura-coastal-scenery-coast-01.jpg` | OK |
| 海岸风光 | `kaikoura-coastal-peninsula-landscape-01.jpg` | OK |
| 海岸风光 | `kaikoura-coastal-scenery-guests-01.jpg` | OK |
| 海岸风光 | `kaikoura-coastal-rod-father-bay-01.jpg` | OK |
| 观鲸系列 | `whale-watching-sperm-whale-01.jpg` | OK |
| 观鲸系列 | `whale-watching-aerial-01.jpg` | OK |
| 海钓体验 | `fishing-boat-docked-01.jpg` | OK |
| 海钓体验 | `fishing-prep-boarding-01.jpg` | OK |
| 海钓体验 | `fishing-trip-at-sea-01.jpg` | OK |
| 海鲜大餐 | `seafood-bbq-lobster-half-01.jpg` | OK |
| 海鲜大餐 | `seafood-bbq-lobster-chips-01.jpg` | OK |
| 海鲜大餐 | `seafood-bbq-lobster-closeup-01.jpg` | OK |
| 客人体验 | `guest-experience-lobster-feast-01.jpg` | OK |
| 客人体验 | `guest-experience-dining-02.jpg` | OK |
| 野生动物 | `wildlife-fur-seal-coast-01.jpg` | OK |

## Verification

- Every manifest `path` resolves to an existing file on disk
- PIL decode + brightness check passed (no black cards)
- Page uses full-size gallery images (no separate thumbnail files); none missing
- `kaikoura-day-tour.html` unchanged — images load via `kaikoura-day-tour.js` + manifest JSON

## Files changed

- `gallery/kaikoura-day-tour.json` — regenerated (v2-disk, 15 images)
- `scripts/build-kaikoura-day-tour-gallery.mjs` — added `--from-disk` mode and hero fallback picks
- Deleted library files (if tracked in git): 3 wildlife/coastal JPGs listed above

*Layout, CSS, and page text not modified.*
