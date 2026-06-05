(function () {
  "use strict";

  const WEB_PHOTOS_ROOT = "images/网页使用照片集/gallery";
  const EMPTY_HINT =
    "暂无摄影旅拍作品。请将照片放入 images/网页使用照片集/gallery/ 对应地区文件夹，然后运行 node scripts/generate-gallery.mjs。";

  let manifestCache = null;
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
    if (document.getElementById("homeGalleryRegions")) {
      return normalizePath("gallery/manifest.json");
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

  function regionCardHtml(region, base, linkPrefix) {
    const href = `${linkPrefix}${region.slug}/index.html`;
    const img = normalizePath(`${base}${region.coverUrl}`);
    return `<a href="${href}" class="gallery-region-card reveal">
      <figure class="gallery-region-card__img">
        <img src="${img}" alt="" loading="lazy" decoding="async">
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
    const imgs = grid.querySelectorAll(".home-gallery-item img");
    imgs.forEach((img, index) => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => {
        lightboxPaths = paths;
        openLightbox(index);
      });
    });
  }

  function renderMasonry(container, images, options) {
    if (!container) return;
    const editorial = options?.editorial;
    container.innerHTML = "";
    if (editorial) {
      container.classList.add("home-gallery-masonry--editorial");
    }
    const paths = [];
    images.forEach((img, i) => {
      const full = normalizePath(img.full || img.thumbUrl || "");
      const thumb = normalizePath(img.thumbUrl || img.thumb || img.full || "");
      paths.push(full);
      const figure = document.createElement("figure");
      const layout = img.layout || "standard";
      figure.className = editorial
        ? `home-gallery-item home-gallery-item--${layout}`
        : "home-gallery-item";
      const el = document.createElement("img");
      el.src = thumb;
      el.dataset.fullSrc = full;
      el.alt = img.alt || "";
      el.loading = i < 4 ? "eager" : "lazy";
      el.decoding = "async";
      if (i < 4) el.fetchPriority = "high";
      figure.appendChild(el);
      container.appendChild(figure);
    });
    container.setAttribute("aria-busy", "false");
    bindMasonryLightbox(container, paths);
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
    renderMasonry(grid, images);
  }

  async function initHub() {
    const grid = document.getElementById("galleryHubGrid");
    const manifest = await loadManifest();
    if (!manifest?.regions?.length) {
      showEmpty(
        grid,
        "摄影相册尚未生成。请将照片放入 images/网页使用照片集/gallery/ 后运行 node scripts/generate-gallery.mjs。"
      );
      return;
    }
    renderRegionGrid(grid, manifest.regions, "../", "");
  }

  async function initHome() {
    const grid = document.getElementById("homeGalleryRegions");
    const manifest = await loadManifest();
    if (!manifest?.regions?.length) {
      showEmpty(grid, EMPTY_HINT);
      return;
    }
    renderRegionGrid(grid, manifest.regions, "", "gallery/");
  }

  async function loadShowcaseManifest() {
    try {
      const res = await fetch(normalizePath("gallery/xhs-showcase.json"), { cache: "no-store" });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async function initHomeShowcase() {
    const grid = document.getElementById("homeGalleryShowcase");
    if (!grid) return;
    const manifest = await loadShowcaseManifest();
    const images = manifest?.images;
    if (!images?.length) {
      showEmpty(
        grid,
        "精选旅拍作品尚未生成。请运行 node scripts/generate-xhs-showcase.mjs。"
      );
      return;
    }
    renderMasonry(
      grid,
      images.map((img) => ({
        full: img.full,
        thumbUrl: img.thumbUrl,
        alt: img.alt || "",
        layout: img.layout || "standard",
        score: img.score
      })),
      { editorial: true }
    );
  }

  async function boot() {
    initLightboxControls();
    await Promise.all([initHome(), initHomeShowcase(), initHub(), initRegionPage()]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
