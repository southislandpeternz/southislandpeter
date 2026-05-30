(function () {
  "use strict";

  const siteHeader = document.getElementById("siteHeader");
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  const floatWechat = document.getElementById("floatWechat");
  const wechatModal = document.getElementById("wechatModal");

  const track = document.getElementById("carouselTrack");
  const slides = track ? [...track.querySelectorAll(".tour-carousel-slide")] : [];
  const caption = document.getElementById("carouselCaption");
  const dotsWrap = document.getElementById("carouselDots");
  const prevBtn = document.getElementById("carouselPrev");
  const nextBtn = document.getElementById("carouselNext");

  let current = 0;
  let autoplayTimer = null;

  function initHeader() {
    const onScroll = () => {
      siteHeader?.classList.toggle("is-scrolled", window.scrollY > 32);
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

  function initReveal() {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -32px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  }

  function initWechat() {
    function open() {
      wechatModal.hidden = false;
      document.body.style.overflow = "hidden";
    }
    function close() {
      wechatModal.hidden = true;
      document.body.style.overflow = "";
    }
    floatWechat?.addEventListener("click", open);
    wechatModal?.querySelectorAll("[data-wechat-close]").forEach((el) => {
      el.addEventListener("click", close);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && wechatModal && !wechatModal.hidden) close();
    });
  }

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "carousel-dot" + (i === 0 ? " is-active" : "");
      btn.setAttribute("aria-label", `第 ${i + 1} 张`);
      btn.addEventListener("click", () => goTo(i, true));
      dotsWrap.appendChild(btn);
    });
  }

  function goTo(index, pauseAutoplay) {
    if (!slides.length) return;
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === current);
    });
    dotsWrap?.querySelectorAll(".carousel-dot").forEach((dot, i) => {
      dot.classList.toggle("is-active", i === current);
    });
    if (caption && slides[current]) {
      caption.textContent = slides[current].dataset.label || "";
    }
    if (pauseAutoplay) resetAutoplay();
  }

  function resetAutoplay() {
    clearInterval(autoplayTimer);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    autoplayTimer = setInterval(() => goTo(current + 1, false), 5500);
  }

  function initCarousel() {
    if (!slides.length) return;
    buildDots();
    prevBtn?.addEventListener("click", () => goTo(current - 1, true));
    nextBtn?.addEventListener("click", () => goTo(current + 1, true));
    resetAutoplay();
  }

  initHeader();
  initReveal();
  initWechat();
  initCarousel();
})();
