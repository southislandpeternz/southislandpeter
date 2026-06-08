(function () {
  "use strict";

  const EMPTY_HINT =
    "暂无摄影旅拍作品。请运行 node scripts/build-photography-showcase.mjs 从 Website-Photos 生成。";

  let manifestCache = null;
  let showcaseCache = null;
  let lightboxPaths = [];
  let lightboxIndex = 0;

  function normalizePath(p) {
    const clean = String(p).replace(/\\/g, "/");
    try {
      return encodeURI(decodeURI(clean));
    } catch {
      return encodeURI(clean);
    }
  }

  function manifestUrl() {
    if (document.getElementById("regionGalleryMasonry")) {
      return normalizePath("../../gallery/manifest.json");
    }
    if (document.getElementById("galleryHubGrid")) {
      return normalizePath("manifest.json");
    }
    return null;
  }

  function showcaseUrl() {
    if (document.body.classList.contains("page-photo-showcase")) {
      return normalizePath("photography-showcase.json");
    }
    if (document.getElementById("homePhotoFeatured")) {
      return normalizePath("gallery/photography-showcase.json");
    }
    return null;
  }

  function hubBase() {
    if (document.getElementById("regionGalleryMasonry")) return "../../";
    if (document.getElementById("galleryHubGrid")) return "../";
    return "";
  }

  function showEmpty(container, message) {
    if (!container) return;
    container.setAttribute("aria-busy", "false");
    container.innerHTML = `<p class="gallery-empty">${message}</p>`;
  }

  async function loadManifest() {
    if (manifestCache) return manifestCache;
    const url = manifestUrl();
    if (!url) return null;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      manifestCache = await res.json();
      return manifestCache;
    } catch {
      return null;
    }
  }

  async function loadShowcase() {
    if (showcaseCache) return showcaseCache;
    const url = showcaseUrl();
    if (!url) return null;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      showcaseCache = await res.json();
      return showcaseCache;
    } catch {
      return null;
    }
  }

  function regionCardHtml(region, base, linkPrefix) {
    const href = `${linkPrefix}${region.slug}/index.html`;
    const img = normalizePath(`${base}${region.coverUrl}`);
    return `<a href="${href}" class="gallery-region-card reveal">
      <figure class="gallery-region-card__img">
        <img src="${img}" alt="${region.name}" loading="lazy" decoding="async">
        <figcaption class="gallery-region-card__label">${region.name}</figcaption>
      </figure>
    </a>`;
  }

  function renderRegionGrid(container, regions, base, linkPrefix) {
    if (!container) return;
    const withPhotos = regions.filter((r) => r.imageCount > 0);
    if (!withPhotos.length) {
      showEmpty(container, EMPTY_HINT);
      return;
    }
    container.innerHTML = withPhotos.map((r) => regionCardHtml(r, base, linkPrefix)).join("");
    container.setAttribute("aria-busy", "false");
  }

  function openLightbox(index) {
    const lb = document.getElementById("lightbox");
    const lbImg = document.getElementById("lightboxImg");
    if (!lb || !lbImg || !lightboxPaths.length) return;
    lightboxIndex = index;
    lbImg.src = lightboxPaths[lightboxIndex];
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    const lb = document.getElementById("lightbox");
    if (!lb) return;
    lb.hidden = true;
    document.body.style.overflow = "";
  }

  function stepLightbox(delta) {
    if (!lightboxPaths.length) return;
    lightboxIndex = (lightboxIndex + delta + lightboxPaths.length) % lightboxPaths.length;
    const lbImg = document.getElementById("lightboxImg");
    if (lbImg) lbImg.src = lightboxPaths[lightboxIndex];
  }

  function initLightboxControls() {
    const lb = document.getElementById("lightbox");
    if (!lb || lb.dataset.galleryBound) return;
    lb.dataset.galleryBound = "1";
    lb.querySelector(".lightbox-close")?.addEventListener("click", closeLightbox);
    lb.querySelector(".lightbox-prev")?.addEventListener("click", () => stepLightbox(-1));
    lb.querySelector(".lightbox-next")?.addEventListener("click", () => stepLightbox(1));
    lb.addEventListener("click", (e) => {
      if (e.target === lb) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    });
  }

  function bindMasonryLightbox(grid, paths) {
    const imgs = grid.querySelectorAll(".photo-masonry-item img, .home-gallery-item img");
    imgs.forEach((img, index) => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => {
        lightboxPaths = paths;
        openLightbox(index);
      });
    });
  }

  function masonryItemHtml(img, idx, eager) {
    const thumb = normalizePath(img.thumbUrl || img.full);
    const full = normalizePath(img.full || img.thumbUrl);
    const tall = img.aspect && img.aspect < 0.95 ? " photo-masonry-item--tall" : "";
    const wide = img.aspect && img.aspect >= 1.45 ? " photo-masonry-item--wide" : "";
    return `<figure class="photo-masonry-item${tall}${wide}" data-index="${idx}">
      <img src="${thumb}" data-full-src="${full}" alt="${img.alt || ""}" loading="${eager ? "eager" : "lazy"}" decoding="async"${eager ? ' fetchpriority="high"' : ""}>
    </figure>`;
  }

  function renderPhotoMasonry(container, images, options) {
    if (!container) return [];
    const limit = options?.limit;
    const slice = limit ? images.slice(0, limit) : images;
    const paths = slice.map((img) => normalizePath(img.full || img.thumbUrl));
    container.innerHTML = slice.map((img, i) => masonryItemHtml(img, i, i < 3)).join("");
    container.setAttribute("aria-busy", "false");
    bindMasonryLightbox(container, paths);
    return paths;
  }

  function renderPhotoHero(container, hero, compact) {
    if (!container || !hero) return;
    const src = normalizePath(compact ? hero.thumbUrl || hero.full : hero.full);
    container.innerHTML = `
      <figure class="photo-hero-figure">
        <img src="${src}" alt="${hero.alt || hero.label || "Peter 南岛旅拍"}" loading="eager" fetchpriority="high" decoding="async">
        <figcaption class="photo-hero-caption">
          <span class="photo-hero-label">${hero.label || ""}</span>
          <span class="photo-hero-label-en">${hero.labelEn || ""}</span>
        </figcaption>
      </figure>`;
    container.setAttribute("aria-busy", "false");
    const img = container.querySelector("img");
    img?.addEventListener("click", () => {
      lightboxPaths = [normalizePath(hero.full)];
      openLightbox(0);
    });
  }

  function renderThemeSections(container, themes) {
    if (!container || !themes?.length) return;
    container.innerHTML = "";
    themes
      .filter((theme) => theme.images?.length)
      .forEach((theme) => {
        const block = document.createElement("section");
        block.className = "photo-theme-block reveal";
        block.id = `theme-${theme.id}`;
        block.innerHTML = `
          <header class="photo-theme-head">
            <h3>${theme.titleZh}</h3>
            <p>${theme.titleEn}</p>
          </header>
          <div class="photo-masonry photo-masonry--theme"></div>`;
        const grid = block.querySelector(".photo-masonry");
        renderPhotoMasonry(grid, theme.images || []);
        container.appendChild(block);
      });
    container.setAttribute("aria-busy", "false");
  }

  async function initRegionPage() {
    const grid = document.getElementById("regionGalleryMasonry");
    if (!grid) return;
    const slug = grid.dataset.galleryRegion;
    const manifest = await loadManifest();
    const images = manifest?.regions?.find((r) => r.slug === slug)?.images;
    if (!images?.length) {
      showEmpty(
        grid,
        `暂无 ${slug} 摄影作品。请将照片放入 images/网页使用照片集/gallery/${slug}/，然后运行 node scripts/generate-gallery.mjs。`
      );
      return;
    }
    grid.classList.add("photo-masonry");
    renderPhotoMasonry(
      grid,
      images.map((img) => ({
        full: img.full,
        thumbUrl: img.thumbUrl,
        alt: img.alt || ""
      }))
    );
  }

  async function initHub() {
    const grid = document.getElementById("galleryHubGrid");
    if (!grid) return;
    const manifest = await loadManifest();
    if (!manifest?.regions?.length) {
      showEmpty(grid, "摄影相册尚未生成。");
      return;
    }
    renderRegionGrid(grid, manifest.regions, "../", "");
  }

  async function initPhotoShowcasePage() {
    const heroEl = document.getElementById("photoShowcaseHero");
    const featuredEl = document.getElementById("photoFeaturedGrid");
    const themesEl = document.getElementById("photoThemeSections");
    if (!heroEl && !featuredEl) return;

    const data = await loadShowcase();
    if (!data) {
      showEmpty(featuredEl || heroEl, EMPTY_HINT);
      return;
    }
    if (heroEl) renderPhotoHero(heroEl, data.hero, false);
    if (featuredEl) renderPhotoMasonry(featuredEl, data.featured || []);
    if (themesEl) renderThemeSections(themesEl, data.themes || []);
  }

  async function initHomePhotoShowcase() {
    const featuredEl = document.getElementById("homePhotoFeatured");
    if (!featuredEl) return;

    const data = await loadShowcase();
    if (!data) {
      showEmpty(featuredEl, EMPTY_HINT);
      return;
    }
    renderPhotoMasonry(featuredEl, data.featured || [], { limit: 6 });
  }

  async function boot() {
    initLightboxControls();
    await Promise.all([initHomePhotoShowcase(), initPhotoShowcasePage(), initHub(), initRegionPage()]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
