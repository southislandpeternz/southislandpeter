/**
 * Loads gallery/kaikoura-day-tour.json and injects Photo Library images only.
 * Usage: data-kaikoura-gallery="hero|cover|thumbs|section" + data-kaikoura-category slug/id
 */
(function () {
  "use strict";

  const MANIFEST_URL = "gallery/kaikoura-day-tour.json";
  let manifestPromise = null;

  function siteRootPrefix() {
    const segments = window.location.pathname.split("/").filter(Boolean);
    if (segments.length && /\.html?$/i.test(segments[segments.length - 1])) {
      segments.pop();
    }
    return segments.length ? "../".repeat(segments.length) : "";
  }

  function resolveManifestUrl() {
    return siteRootPrefix() + MANIFEST_URL;
  }

  function loadManifest() {
    if (!manifestPromise) {
      manifestPromise = fetch(resolveManifestUrl())
        .then((r) => {
          if (!r.ok) throw new Error("manifest fetch failed");
          return r.json();
        })
        .catch((err) => {
          console.warn("[kaikoura-day-tour]", err);
          return null;
        });
    }
    return manifestPromise;
  }

  function imgUrl(image) {
    if (!image) return "";
    return siteRootPrefix() + image.url;
  }

  function categoryImages(manifest, slugOrId) {
    return manifest.categories?.find((c) => c.slug === slugOrId || c.id === slugOrId)?.images || [];
  }

  function findCategory(manifest, el) {
    const slug = el.getAttribute("data-kaikoura-category");
    const id = el.getAttribute("data-kaikoura-category-id");
    if (!manifest?.categories) return null;
    return manifest.categories.find(
      (c) => c.slug === slug || c.id === id || c.id === slug
    );
  }

  function setFigureImg(figure, image, { cover } = {}) {
    if (!figure || !image) return;
    const img = figure.querySelector("img");
    if (!img) return;
    img.src = imgUrl(image);
    img.alt = image.alt;
    img.loading = cover ? "eager" : "lazy";
    if (cover) img.fetchPriority = "high";
    figure.classList.add("media-slot--filled");
  }

  function fillHero(manifest, el) {
    const hero =
      manifest.heroPrimary ||
      manifest.categories?.find((c) => c.id === "01-Coastal-Scenery")?.images?.[0];
    if (!hero) return;
    const banner = el.closest(".tt-banner") || el;
    const figure = el.matches("figure") ? el : el.querySelector("figure") || banner.querySelector("figure");
    setFigureImg(figure, hero, { cover: true });
    if (banner.classList.contains("tt-banner") && !banner.querySelector(".tt-banner-bg")) {
      banner.classList.add("tt-banner--has-bg");
    }
  }

  function fillCover(manifest, el) {
    const hero = manifest.heroPrimary;
    const figure = el.querySelector("figure") || el;
    setFigureImg(figure, hero, { cover: false });
  }

  function fillCardThumbs(manifest, el) {
    const picks = (el.getAttribute("data-kaikoura-picks") || "01-Seal-Colony,02-Whale-Watching,04-Lobster-Experience")
      .split(",")
      .map((s) => s.trim());
    const figures = el.querySelectorAll("figure");
    figures.forEach((figure, i) => {
      const images = categoryImages(manifest, picks[i] || picks[picks.length - 1]);
      setFigureImg(figure, images[0]);
    });
  }

  function fillSlot(manifest, el) {
    const catId = el.getAttribute("data-kaikoura-category-id") || el.getAttribute("data-kaikoura-category");
    const index = Number(el.getAttribute("data-kaikoura-index") || "0");
    const images = categoryImages(manifest, catId);
    const figure = el.matches("figure") ? el : el.querySelector("figure") || el;
    setFigureImg(figure, images[index]);
  }

  function fillThumbs(manifest, el) {
    const cat = findCategory(manifest, el);
    const images = cat?.images?.length
      ? cat.images
      : manifest.categories?.find((c) => c.id === "02-Whale-Watching")?.images || [];
    const figures = el.querySelectorAll("figure");
    figures.forEach((figure, i) => {
      setFigureImg(figure, images[i] || images[i % images.length]);
    });
  }

  function fillSection(manifest, el) {
    const cat = findCategory(manifest, el);
    if (!cat?.images?.length) {
      el.hidden = true;
      return;
    }
    const grid = el.querySelector("[data-kaikoura-grid]") || el;
    grid.innerHTML = cat.images
      .map(
        (img) => `
        <figure class="media-slot media-slot--photo akaroa-gallery-item">
          <img src="${imgUrl(img)}" alt="${img.alt.replace(/"/g, "&quot;")}" loading="lazy" width="1024" height="768">
          <figcaption class="akaroa-gallery-caption">
            <span class="akaroa-gallery-caption-en">${img.titleEn}</span>
            <span class="akaroa-gallery-caption-zh">${img.titleZh}</span>
          </figcaption>
        </figure>`
      )
      .join("");
  }

  function fillMeta(manifest) {
    const hero = manifest.heroPrimary;
    if (!hero) return;
    const titleEl = document.querySelector("[data-kaikoura-meta='title']");
    const metaDesc = document.querySelector("meta[name='description'][data-kaikoura-meta='description']");
    if (titleEl && !titleEl.dataset.filled) {
      titleEl.textContent = `${manifest.tourZh} · ${hero.titleZh}`;
      titleEl.dataset.filled = "1";
    }
    if (metaDesc && !metaDesc.dataset.filled) {
      metaDesc.setAttribute(
        "content",
        `${hero.titleEn}. ${hero.seoKeywords.slice(0, 6).join(", ")}.`
      );
      metaDesc.dataset.filled = "1";
    }
  }

  async function init() {
    const nodes = document.querySelectorAll("[data-kaikoura-gallery]");
    const slots = document.querySelectorAll("[data-kaikoura-slot]");
    if (!nodes.length && !slots.length) return;

    const manifest = await loadManifest();
    if (!manifest) return;

    nodes.forEach((el) => {
      const role = el.getAttribute("data-kaikoura-gallery");
      switch (role) {
        case "hero":
          fillHero(manifest, el);
          break;
        case "cover":
          fillCover(manifest, el);
          break;
        case "thumbs":
          fillThumbs(manifest, el);
          break;
        case "card-thumbs":
          fillCardThumbs(manifest, el);
          break;
        case "slot":
          fillSlot(manifest, el);
          break;
        case "section":
          fillSection(manifest, el);
          break;
        case "meta":
          fillMeta(manifest);
          break;
        default:
          break;
      }
    });

    slots.forEach((el) => fillSlot(manifest, el));

    document.dispatchEvent(new CustomEvent("kaikoura-gallery-ready", { detail: manifest }));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
