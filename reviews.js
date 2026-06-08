/**
 * Customer Reviews page — loads reviews/featured-manifest.json
 */
(function () {
  "use strict";

  const MANIFEST = "reviews/featured-manifest.json";

  function platformLabel(cls) {
    return (
      { google: "Google Review", wechat: "微信", tripadvisor: "Tripadvisor", feedback: "客户反馈" }[
        cls
      ] || "评价"
    );
  }

  function sourceClass(cls) {
    return `rev-source rev-source--${cls === "feedback" ? "xhs" : cls}`;
  }

  function renderFeatured(container, items) {
    container.innerHTML = "";
    items.forEach((item) => {
      const article = document.createElement("article");
      article.className = "rev-featured rev-featured--card";
      article.innerHTML = `
        <figure class="rev-featured-shot rev-review-card media-slot media-slot--review media-slot--filled">
          <img src="${item.image}" alt="${item.titleZh} · ${item.guestLabel}" loading="lazy" decoding="async">
          <figcaption class="${sourceClass(item.platformClass)}">${platformLabel(item.platformClass)}</figcaption>
        </figure>
        <div class="rev-featured-body">
          <div class="rev-guest">
            <div>
              <strong class="rev-guest-name">${item.guestLabel}</strong>
              <span class="rev-guest-meta">${item.titleZh}</span>
            </div>
          </div>
          <p class="rev-summary">「${item.displayText}」</p>
        </div>`;
      const img = article.querySelector("img");
      img.addEventListener("click", () => openLightbox(item));
      article.querySelector("figure").addEventListener("click", () => openLightbox(item));
      container.appendChild(article);
    });
  }

  function renderGrid(container, items) {
    container.innerHTML = "";
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "rev-card-grid-item";
      card.innerHTML = `
        <figure class="rev-card-grid-media">
          <img src="${item.image}" alt="${item.titleZh}" loading="lazy">
          <figcaption class="${sourceClass(item.platformClass)}">${platformLabel(item.platformClass)}</figcaption>
        </figure>
        <div class="rev-card-grid-body">
          <p class="rev-card-grid-guest">${item.guestLabel}</p>
          <h3>${item.titleZh}</h3>
          <p class="rev-card-grid-text">${item.displayText}</p>
        </div>`;
      container.appendChild(card);
    });
  }

  let lbItems = [];
  let lbIndex = 0;
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightboxImg");

  function openLightbox(item) {
    if (!lb || !lbImg) return;
    lbItems = [item.image];
    lbIndex = 0;
    lbImg.src = item.image;
    lbImg.alt = item.titleZh;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lb) return;
    lb.hidden = true;
    document.body.style.overflow = "";
  }

  if (lb) {
    lb.querySelector(".lightbox-close")?.addEventListener("click", closeLightbox);
    lb.addEventListener("click", (e) => {
      if (e.target === lb) closeLightbox();
    });
  }

  async function loadFeaturedPreview(container, limit) {
    try {
      const res = await fetch(MANIFEST);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      renderFeatured(container, (data.images || []).slice(0, limit));
    } catch (err) {
      container.innerHTML = `<p class="gallery-empty">评价加载失败</p>`;
      console.warn("featured reviews", err);
    }
  }

  async function loadFullPage() {
    const featured = document.getElementById("crFeaturedGrid");
    const all = document.getElementById("crAllGrid");
    const stat = document.getElementById("crReviewCount");
    try {
      const res = await fetch(MANIFEST);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const items = data.images || [];
      if (stat) stat.textContent = String(items.length);
      if (featured) renderFeatured(featured, items.slice(0, 6));
      if (all) renderGrid(all, items);
    } catch (err) {
      if (all) all.innerHTML = `<p class="gallery-empty">评价加载失败</p>`;
      console.warn("featured reviews", err);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const homePreview = document.getElementById("homeFeaturedReviews");
    if (homePreview) loadFeaturedPreview(homePreview, 3);
    if (document.body.classList.contains("page-customer-reviews")) loadFullPage();
  });
})();
