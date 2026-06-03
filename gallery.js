(function () {
  "use strict";

  const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;
  let manifestCache = null;
  let lightboxPaths = [];
  let lightboxIndex = 0;

  function normalizePath(p) {
    return encodeURI(p.replace(/\\/g, "/"));
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

  async function fromRegionListing(slug) {
    const dir = normalizePath(`NZ-Travel-photos/${slug}/`);
    try {
      const res = await fetch(dir, { cache: "no-store" });
      if (!res.ok) return [];
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      return [...doc.querySelectorAll("a[href]")]
        .map((a) => decodeURIComponent(a.getAttribute("href") || ""))
        .filter((name) => IMAGE_EXT.test(name) && !name.includes("thumbs"))
        .sort((a, b) => a.localeCompare(b, "en"))
        .map((file) => ({
          file,
          thumb: `thumbs/${file}`,
          full: `NZ-Travel-photos/${slug}/${file}`,
          thumbUrl: `NZ-Travel-photos/${slug}/thumbs/${file}`
        }));
    } catch {
      return [];
    }
  }

  function regionCardHtml(region, base, linkPrefix) {
    const href = `${linkPrefix}${region.slug}/index.html`;
    const img = normalizePath(`${base}NZ-Travel-photos/${region.slug}/${region.coverThumb}`);
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

  function renderMasonry(container, images) {
    if (!container) return;
    container.innerHTML = "";
    const paths = [];
    images.forEach((img, i) => {
      const full = normalizePath(img.full || img.thumbUrl || "");
      const thumb = normalizePath(img.thumbUrl || img.thumb || img.full || "");
      paths.push(full);
      const figure = document.createElement("figure");
      figure.className = "home-gallery-item";
      const el = document.createElement("img");
      el.src = thumb;
      el.dataset.fullSrc = full;
      el.alt = "";
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
    const base = hubBase();
    const manifest = await loadManifest();
    let images = manifest?.regions?.find((r) => r.slug === slug)?.images;
    if (!images?.length) {
      images = await fromRegionListing(slug);
    }
    if (!images?.length) {
      grid.setAttribute("aria-busy", "false");
      grid.innerHTML = "<p class=\"gallery-empty\">暂无摄影作品，请将照片放入 NZ-Travel-photos/" + slug + "/</p>";
      return;
    }
    renderMasonry(grid, images);
  }

  async function initHub() {
    const grid = document.getElementById("galleryHubGrid");
    const manifest = await loadManifest();
    if (!manifest?.regions?.length) {
      if (grid) {
        grid.setAttribute("aria-busy", "false");
        grid.innerHTML = "<p class=\"gallery-empty\">相册 manifest 未找到，请运行 node scripts/generate-gallery.mjs</p>";
      }
      return;
    }
    renderRegionGrid(grid, manifest.regions, "../", "");
  }

  async function initHome() {
    const grid = document.getElementById("homeGalleryRegions");
    const manifest = await loadManifest();
    if (!manifest?.regions?.length) {
      if (grid) grid.setAttribute("aria-busy", "false");
      return;
    }
    renderRegionGrid(grid, manifest.regions, "", "gallery/");
  }

  async function boot() {
    initLightboxControls();
    await Promise.all([initHome(), initHub(), initRegionPage()]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
