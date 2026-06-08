/**
 * 客户评价中心 — reviews/featured-manifest.json
 */
(function () {
  "use strict";

  const MANIFEST = "reviews/featured-manifest.json";

  function normalizePath(p) {
    const clean = String(p).replace(/\\/g, "/");
    try {
      return encodeURI(decodeURI(clean));
    } catch {
      return encodeURI(clean);
    }
  }

  function platformLabel(cls) {
    return (
      {
        google: "Google Review",
        wechat: "微信好评",
        tripadvisor: "Tripadvisor",
        feedback: "客户反馈",
        guest: "客户合影"
      }[cls] || "评价"
    );
  }

  function sourceClass(cls) {
    const map = { feedback: "xhs", guest: "moments" };
    return `rev-source rev-source--${map[cls] || cls}`;
  }

  function mediaSlots(item) {
    const m = item.media || {};
    const primary = item.image || item.thumb;
    const cls = item.platformClass || "feedback";
    const slots = [];

    if (m.wechat) slots.push({ type: "wechat", src: m.wechat, label: "微信好评" });
    if (m.google) slots.push({ type: "google", src: m.google, label: "Google Review" });
    if (m.feedback) slots.push({ type: "feedback", src: m.feedback, label: "客户反馈" });
    if (m.guestPhoto) slots.push({ type: "guest", src: m.guestPhoto, label: "客户合影" });

    if (!slots.length && primary) {
      slots.push({ type: cls === "feedback" ? "feedback" : cls, src: primary, label: platformLabel(cls) });
    }
    return slots;
  }

  function starsHtml() {
    return '<span class="rev-stars" aria-label="五星好评">⭐⭐⭐⭐⭐</span>';
  }

  function mediaGalleryHtml(item, compact) {
    const slots = mediaSlots(item);
    if (!slots.length) return "";
    const cls = compact ? " rev-media-gallery--compact" : "";
    return `<div class="rev-media-gallery${cls}" role="group" aria-label="评价截图">
      ${slots
        .map(
          (slot) => `
        <figure class="rev-media-slot rev-media-slot--${slot.type}">
          <img src="${normalizePath(slot.src)}" alt="${item.guestLabel} · ${slot.label}" loading="lazy" decoding="async" data-full="${normalizePath(slot.src)}">
          <figcaption class="${sourceClass(slot.type)}">${slot.label}</figcaption>
        </figure>`
        )
        .join("")}
    </div>`;
  }

  function reviewCardHtml(item, options) {
    const compact = options?.compact;
    const highlight = options?.highlight;
    const text = item.displayText || "";
    const cls = [
      "rev-center-card",
      compact ? "rev-center-card--compact" : "",
      highlight ? "rev-center-card--highlight" : ""
    ]
      .filter(Boolean)
      .join(" ");

    return `<article class="${cls}" data-rank="${item.rank || ""}">
      <div class="rev-center-card__body">
        ${starsHtml()}
        <div class="rev-center-card__meta">
          <strong class="rev-guest-name">${item.guestLabel || "新西兰客人"}</strong>
          <span class="rev-guest-meta">${item.titleZh || ""}</span>
        </div>
        <blockquote class="rev-center-card__quote">「${text}」</blockquote>
      </div>
      ${mediaGalleryHtml(item, compact)}
    </article>`;
  }

  function renderCards(container, items, options) {
    if (!container) return;
    container.innerHTML = items.map((item) => reviewCardHtml(item, options)).join("");
    container.setAttribute("aria-busy", "false");
    bindCardLightbox(container);
  }

  let lbPaths = [];
  let lbIndex = 0;
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightboxImg");

  function openLightbox(paths, index) {
    if (!lb || !lbImg || !paths.length) return;
    lbPaths = paths;
    lbIndex = index;
    lbImg.src = lbPaths[lbIndex];
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lb) return;
    lb.hidden = true;
    document.body.style.overflow = "";
  }

  function stepLightbox(delta) {
    if (!lbPaths.length) return;
    lbIndex = (lbIndex + delta + lbPaths.length) % lbPaths.length;
    if (lbImg) lbImg.src = lbPaths[lbIndex];
  }

  function initLightbox() {
    if (!lb || lb.dataset.revBound) return;
    lb.dataset.revBound = "1";
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

  function bindCardLightbox(container) {
    container.querySelectorAll(".rev-center-card").forEach((card) => {
      const imgs = [...card.querySelectorAll(".rev-media-gallery img")];
      const paths = imgs.map((img) => img.dataset.full || img.src);
      imgs.forEach((img, idx) => {
        img.style.cursor = "zoom-in";
        img.addEventListener("click", () => openLightbox(paths, idx));
      });
    });
  }

  async function fetchManifest() {
    const res = await fetch(MANIFEST, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  }

  async function loadHomePreview() {
    const grid = document.getElementById("homeFeaturedReviews");
    if (!grid) return;
    try {
      const data = await fetchManifest();
      renderCards(grid, (data.images || []).slice(0, 6), { compact: true });
    } catch (err) {
      grid.innerHTML = `<p class="gallery-empty">评价加载失败，请稍后刷新。</p>`;
      console.warn("reviews preview", err);
    }
  }

  async function loadFullPage() {
    const featured = document.getElementById("crFeaturedGrid");
    const all = document.getElementById("crAllGrid");
    const stat = document.getElementById("crReviewCount");
    try {
      const data = await fetchManifest();
      const items = data.images || [];
      if (stat) stat.textContent = String(items.length);
      if (featured) renderCards(featured, items.slice(0, 6), { highlight: true });
      if (all) renderCards(all, items, { compact: false });
    } catch (err) {
      const msg = `<p class="gallery-empty">评价加载失败，请稍后刷新。</p>`;
      if (all) all.innerHTML = msg;
      if (featured) featured.innerHTML = msg;
      console.warn("reviews page", err);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initLightbox();
    loadHomePreview();
    if (document.body.classList.contains("page-customer-reviews")) loadFullPage();
  });
})();
