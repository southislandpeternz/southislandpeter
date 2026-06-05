(function () {
  "use strict";

  const masonry = document.getElementById("masonry");
  const galleryStatus = document.getElementById("galleryStatus");
  const galleryEmpty = document.getElementById("galleryEmpty");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const siteHeader = document.getElementById("siteHeader");
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  const searchOpen = document.getElementById("searchOpen");
  const searchPanel = document.getElementById("searchPanel");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  const wechatModal = document.getElementById("wechatModal");
  const floatWechat = document.getElementById("floatWechat");
  const heroRoute = document.getElementById("heroRoute");
  const heroRouteCard = document.getElementById("heroRouteCard");
  const heroRouteBrand = document.getElementById("heroRouteBrand");

  let galleryPaths = [];
  let lightboxIndex = 0;

  const SEARCH_INDEX = [
    { title: "首页", href: "#hero", keywords: "首页 home 天天旅行社" },
    { title: "关于 Peter", href: "#peter", keywords: "Peter 向导 导游 本地 奔驰 商务车 司导 天天旅行社" },
    { title: "精选南岛旅行路线", href: "#routes", keywords: "精品线路 一日游 三日游 八日游 环岛" },
    { title: "摄影旅拍作品展示", href: "#gallery", keywords: "摄影 旅拍 相册 照片 图库 gallery" },
    { title: "南岛摄影相册", href: "gallery/index.html", keywords: "摄影 gallery 相册 地区 Akaroa Kaikoura Queenstown" },
    { title: "客人好评墙", href: "#reviews", keywords: "好评 评价 微信 小红书 Google 朋友圈 客人 反馈" },
    { title: "凯库拉观鲸", href: "destinations.html#kaikoura", keywords: "凯库拉 观鲸 海豚 whale 南岛故事" },
    { title: "特卡波星空", href: "destinations.html#tekapo", keywords: "特卡波 星空 银河 tekapo 南岛故事" },
    { title: "库克山", href: "destinations.html#mt-cook", keywords: "库克山 雪山 冰川 mount cook 南岛故事" },
    { title: "皇后镇", href: "destinations.html#queenstown", keywords: "皇后镇 queenstown 冒险 南岛故事" },
    { title: "米尔福德峡湾", href: "destinations.html", keywords: "米尔福德 峡湾 milford fjord 南岛故事" },
    { title: "南岛经典9天8晚", href: "winter-tour.html", keywords: "经典 9天 8晚 凯库拉 特卡波 库克山 瓦纳卡 皇后镇" },
    { title: "精品线路", href: "routes.html", keywords: "精品线路 路线 产品 经典 慢旅行" },
    { title: "南岛慢旅行13天12晚", href: "south-island-13-day.html", keywords: "旗舰 精品路线 13天 12晚 慢旅行 奔驰 商务车 Peter" },
    { title: "客人评价", href: "testimonials.html", keywords: "好评 评价 反馈 客户" },
    { title: "咨询预订", href: "#contact", keywords: "咨询 预订 联系 电话 微信 whatsapp" }
  ];

  const NAV_SECTIONS = [
    "contact",
    "reviews",
    "gallery",
    "routes",
    "peter",
    "hero"
  ];

  const HERO_ROUTE_STOPS = [
    "📍 Christchurch 基督城",
    "📍 Kaikōura 凯库拉",
    "📍 Hanmer Springs 汉默温泉",
    "📍 Akaroa 阿卡罗阿",
    "📍 Lake Tekapo 特卡波湖",
    "📍 Aoraki / Mt Cook 库克山",
    "📍 Oamaru 奥马鲁",
    "📍 Dunedin 但尼丁",
    "📍 Te Anau 蒂阿瑙",
    "📍 Milford Sound 米尔福德峡湾",
    "📍 Te Anau 蒂阿瑙",
    "📍 Wānaka 瓦纳卡",
    "📍 Queenstown 皇后镇"
  ];

  function normalizePath(path) {
    return encodeURI(path.replace(/\\/g, "/"));
  }

  function probeImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ ok: true, src: normalizePath(src) });
      img.onerror = () => resolve({ ok: false });
      img.src = normalizePath(src);
    });
  }

  const REVIEWS_ROOT = "images/网页使用照片集";
  const REVIEWS_DIR = "images/网页使用照片集/reviews";
  const HOME_REVIEWS_LIMIT = 12;
  const REVIEWS_EMPTY_HINT =
    "暂无客人评价图片。请将评价截图放入 images/网页使用照片集/reviews/ 后运行 node scripts/generate-reviews-manifest.mjs。";
  const REVIEW_FILE_RE = /^(review|reviews).+\.(jpe?g|png|webp)$/i;

  function isReviewImageName(name) {
    const base = name.replace(/^.*\//, "");
    if (!base || base === "thumbs" || base.startsWith("thumbs/")) return false;
    return REVIEW_FILE_RE.test(base);
  }

  function reviewAssetPath(...parts) {
    return normalizePath([REVIEWS_ROOT, ...parts].join("/"));
  }

  async function fromReviewsManifest() {
    try {
      const res = await fetch(reviewAssetPath("manifest.json"), { cache: "no-store" });
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data.images)) return [];
      return data.images
        .filter((item) => item && typeof item.file === "string" && isReviewImageName(item.file))
        .map((item) => ({
          full: normalizePath(item.full || `${REVIEWS_DIR}/${item.file}`),
          thumb: normalizePath(
            item.thumbUrl || `${REVIEWS_DIR}/${item.thumb || `thumbs/${item.file}`}`
          ),
          mtime: typeof item.mtime === "number" ? item.mtime : 0,
          platforms: Array.isArray(item.platforms) ? item.platforms : [],
          platform: item.platform || "",
          alt: item.alt || "客人好评截图"
        }))
        .sort((a, b) => b.mtime - a.mtime);
    } catch {
      return [];
    }
  }

  function pickHomeReviews(entries, limit) {
    const picked = [];
    const used = new Set();
    const buckets = { wechat: [], xhs: [], google: [] };

    entries.forEach((entry) => {
      const tags = entry.platforms?.length
        ? entry.platforms
        : [entry.platform || "wechat"];
      tags.forEach((tag) => {
        if (buckets[tag] && !buckets[tag].includes(entry)) {
          buckets[tag].push(entry);
        }
      });
    });

    const order = ["wechat", "xhs", "google"];
    while (picked.length < limit) {
      let added = false;
      for (const tag of order) {
        const next = buckets[tag].find((entry) => !used.has(entry.full));
        if (!next) continue;
        used.add(next.full);
        picked.push(next);
        added = true;
        if (picked.length >= limit) break;
      }
      if (!added) break;
    }

    for (const entry of entries) {
      if (picked.length >= limit) break;
      if (used.has(entry.full)) continue;
      used.add(entry.full);
      picked.push(entry);
    }

    return picked.slice(0, limit);
  }

  async function verifyReviewEntry(entry) {
    const thumbOk = await probeImage(entry.thumb);
    if (thumbOk.ok) {
      return {
        full: entry.full,
        thumb: thumbOk.src,
        mtime: entry.mtime || 0,
        alt: entry.alt || "客人好评截图"
      };
    }
    const fullOk = await probeImage(entry.full);
    if (fullOk.ok) {
      return {
        full: fullOk.src,
        thumb: fullOk.src,
        mtime: entry.mtime || 0,
        alt: entry.alt || "客人好评截图"
      };
    }
    return null;
  }

  function renderHomeReviews(entries) {
    const grid = document.getElementById("homeReviewsMasonry");
    if (!grid) return;
    grid.innerHTML = "";
    grid.setAttribute("aria-busy", "false");
    if (!entries.length) {
      grid.innerHTML = `<p class="gallery-empty">${REVIEWS_EMPTY_HINT}</p>`;
      return;
    }
    entries.forEach((entry, i) => {
      const figure = document.createElement("figure");
      figure.className = "home-gallery-item";
      const img = document.createElement("img");
      img.src = entry.thumb;
      img.dataset.fullSrc = entry.full;
      img.alt = entry.alt || "客人好评截图";
      img.loading = i < 4 ? "eager" : "lazy";
      img.decoding = "async";
      if (i < 4) img.fetchPriority = "high";
      figure.appendChild(img);
      grid.appendChild(figure);
    });
  }

  async function loadHomeReviews() {
    const grid = document.getElementById("homeReviewsMasonry");
    if (!grid) return;

    const manifest = await fromReviewsManifest();
    const verified = [];
    const list = [...manifest];
    for (let i = 0; i < list.length; i += 8) {
      const chunk = list.slice(i, i + 8);
      const results = await Promise.all(chunk.map((entry) => verifyReviewEntry(entry)));
      results.forEach((r) => {
        if (r) verified.push(r);
      });
    }

    verified.sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
    renderHomeReviews(pickHomeReviews(verified, HOME_REVIEWS_LIMIT));
  }

  function renderGallery(paths) {
    if (!masonry) return;
    masonry.innerHTML = "";
    paths.forEach((src, i) => {
      const item = document.createElement("figure");
      item.className = "masonry-item";
      item.style.animationDelay = `${Math.min(i * 0.04, 0.8)}s`;
      const img = document.createElement("img");
      img.src = src;
      img.alt = "新西兰南岛 · 新西兰天天旅行社";
      img.loading = "lazy";
      img.decoding = "async";
      item.appendChild(img);
      item.addEventListener("click", () => openLightbox(i));
      masonry.appendChild(item);
    });
  }

  function openLightbox(index) {
    lightboxIndex = index;
    lightboxImg.src = galleryPaths[lightboxIndex];
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }

  function stepLightbox(delta) {
    if (!galleryPaths.length) return;
    lightboxIndex =
      (lightboxIndex + delta + galleryPaths.length) % galleryPaths.length;
    lightboxImg.src = galleryPaths[lightboxIndex];
  }

  function initHomeMasonryLightbox() {
    if (!lightbox || !lightboxImg) return;
    document.querySelectorAll(".home-gallery-masonry").forEach((grid) => {
      const imgs = grid.querySelectorAll(".home-gallery-item img");
      if (!imgs.length) return;
      const paths = Array.from(
        imgs,
        (img) => img.dataset.fullSrc || img.currentSrc || img.src
      );
      imgs.forEach((img, index) => {
        img.style.cursor = "zoom-in";
        img.addEventListener("click", () => {
          galleryPaths = paths;
          openLightbox(index);
        });
      });
    });
  }

  function initLightbox() {
    if (!lightbox) return;
    lightbox.querySelector(".lightbox-close")?.addEventListener("click", closeLightbox);
    lightbox.querySelector(".lightbox-prev")?.addEventListener("click", () => stepLightbox(-1));
    lightbox.querySelector(".lightbox-next")?.addEventListener("click", () => stepLightbox(1));
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (lightbox.hidden) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    });
  }

  function openWechatModal() {
    if (!wechatModal) return;
    wechatModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeWechatModal() {
    if (!wechatModal) return;
    wechatModal.hidden = true;
    if (searchPanel?.hidden !== false && lightbox?.hidden !== false) {
      document.body.style.overflow = "";
    }
  }

  function initWechat() {
    floatWechat?.addEventListener("click", openWechatModal);
    document.querySelectorAll("[data-wechat-trigger]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        openWechatModal();
      });
    });
    wechatModal?.querySelectorAll("[data-wechat-close]").forEach((el) => {
      el.addEventListener("click", closeWechatModal);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && wechatModal && !wechatModal.hidden) {
        closeWechatModal();
      }
    });
  }

  function initHeader() {
    const onScroll = () => {
      siteHeader?.classList.toggle("is-scrolled", window.scrollY > 32);
      updateActiveNav();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    navToggle?.addEventListener("click", () => {
      const open = mainNav.classList.toggle("is-open");
      navToggle.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    });

    mainNav?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("is-open");
        navToggle?.classList.remove("is-open");
        navToggle?.setAttribute("aria-expanded", "false");
      });
    });
  }

  function updateActiveNav() {
    const offset = 140;
    let current = "hero";

    NAV_SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el && window.scrollY + offset >= el.offsetTop) current = id;
    });

    mainNav?.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href")?.slice(1) || "";
      const active = href === current;
      a.classList.toggle("is-active", active);
    });
  }

  function initReveal() {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  }

  function initLoader() {
    window.addEventListener("load", () => document.body.classList.remove("is-loading"));
    setTimeout(() => document.body.classList.remove("is-loading"), 2200);
  }

  function initHeroRoute() {
    if (!heroRoute || !heroRouteCard || !heroRouteBrand) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      heroRouteCard.classList.remove("is-visible");
      heroRouteBrand.classList.add("is-visible");
      return;
    }

    const duration = 15000;
    const travelDuration = 13000;
    const stopVisibleMs = 800;
    const stopStep = travelDuration / HERO_ROUTE_STOPS.length;
    let start = performance.now();
    let lastStop = -1;
    let showingFinal = false;
    let rafId = 0;

    const render = (now) => {
      const elapsed = (now - start) % duration;
      const isFinal = elapsed >= travelDuration;

      if (isFinal) {
        if (!showingFinal) {
          heroRouteCard.classList.remove("is-visible");
          heroRouteBrand.classList.add("is-visible");
          showingFinal = true;
        }
      } else {
        const stopIndex = Math.min(
          HERO_ROUTE_STOPS.length - 1,
          Math.floor(elapsed / stopStep)
        );
        const localTime = elapsed - stopIndex * stopStep;

        if (showingFinal) {
          heroRouteBrand.classList.remove("is-visible");
          showingFinal = false;
        }

        if (stopIndex !== lastStop) {
          heroRouteCard.textContent = HERO_ROUTE_STOPS[stopIndex];
          lastStop = stopIndex;
        }

        heroRouteCard.classList.toggle("is-visible", localTime <= stopVisibleMs);
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
        return;
      }
      start = performance.now();
      lastStop = -1;
      showingFinal = false;
      rafId = requestAnimationFrame(render);
    });
  }

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const id = anchor.getAttribute("href");
        if (!id || id === "#") return;
        if (anchor.hasAttribute("data-wechat-trigger")) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function openSearch() {
    searchPanel.hidden = false;
    document.body.style.overflow = "hidden";
    searchInput?.focus();
    runSearch("");
  }

  function closeSearch() {
    searchPanel.hidden = true;
    if (wechatModal?.hidden !== false && lightbox?.hidden !== false) {
      document.body.style.overflow = "";
    }
    if (searchInput) searchInput.value = "";
  }

  function runSearch(query) {
    if (!searchResults) return;
    const q = query.trim().toLowerCase();
    const matches = q
      ? SEARCH_INDEX.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.keywords.toLowerCase().includes(q)
        )
      : SEARCH_INDEX;

    searchResults.innerHTML = "";
    if (!matches.length) {
      searchResults.innerHTML = '<li class="empty">未找到相关内容</li>';
      return;
    }

    const seen = new Set();
    matches.forEach((item) => {
      const key = item.href + item.title;
      if (seen.has(key)) return;
      seen.add(key);
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.title;
      a.addEventListener("click", () => closeSearch());
      li.appendChild(a);
      searchResults.appendChild(li);
    });
  }

  function initSearch() {
    searchOpen?.addEventListener("click", openSearch);
    searchPanel?.querySelectorAll("[data-search-close]").forEach((el) => {
      el.addEventListener("click", closeSearch);
    });
    searchInput?.addEventListener("input", (e) => runSearch(e.target.value));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !searchPanel.hidden) closeSearch();
    });
  }

  async function boot() {
    initHeader();
    initReveal();
    initLoader();
    initHeroRoute();
    initSmoothAnchors();
    initLightbox();
    initSearch();
    initWechat();
    await loadHomeReviews();
    initHomeMasonryLightbox();
  }

  boot();
})();
