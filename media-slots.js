/**
 * 全站统一媒体位系统
 * 替换图片：只改 <img src="...">，版式不变。
 * 占位图：images/网页使用照片集/site/slot-placeholder.svg
 * 类型：hero | peter | guest | mercedes | scenery | review | photo | video | avatar
 */
(function (global) {
  var PLACEHOLDER = "images/网页使用照片集/site/slot-placeholder.svg";

  var SLOT_LABELS = {
    hero: "Hero主图",
    peter: "Peter带团照片",
    guest: "客人合影",
    mercedes: "奔驰商务车",
    scenery: "景点风光",
    review: "客人评价截图",
    photo: "摄影作品",
    video: "视频封面",
    avatar: "客人头像"
  };

  function isPlaceholderSrc(src) {
    if (!src) return true;
    return /slot-placeholder\.svg|\/placeholder\.svg/i.test(src);
  }

  function markFilledSlots(root) {
    (root || document).querySelectorAll(".media-slot").forEach(function (slot) {
      var img = slot.querySelector("img");
      if (img && !isPlaceholderSrc(img.getAttribute("src") || img.src)) {
        slot.classList.add("media-slot--filled");
      }
    });
  }

  function createSlot(type, opts) {
    opts = opts || {};
    var fig = document.createElement("figure");
    fig.className = "media-slot media-slot--" + type + (opts.extraClass ? " " + opts.extraClass : "");
    var img = document.createElement("img");
    img.src = opts.src || PLACEHOLDER;
    img.alt = opts.alt || SLOT_LABELS[type] || "";
    img.loading = opts.loading || "lazy";
    if (opts.width) img.width = opts.width;
    if (opts.height) img.height = opts.height;
    var label = document.createElement("figcaption");
    label.className = "media-slot-label";
    label.textContent = opts.label || SLOT_LABELS[type] || type;
    fig.appendChild(img);
    fig.appendChild(label);
    if (opts.caption) {
      var cap = document.createElement("figcaption");
      cap.className = "media-slot-caption";
      cap.textContent = opts.caption;
      fig.appendChild(cap);
    }
    return fig;
  }

  /** 为空容器批量生成瀑布流媒体位（相册 / 评价墙） */
  function fillWall(containerId, type, count, captionPrefix) {
    var wall = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!wall || wall.children.length) return;
    var label = SLOT_LABELS[type] || type;
    for (var i = 0; i < count; i++) {
      wall.appendChild(
        createSlot(type, {
          alt: label + " " + (i + 1),
          caption: captionPrefix ? captionPrefix + " " + (i + 1) : ""
        })
      );
    }
    markFilledSlots(wall);
  }

  function initAutoWalls() {
    document.querySelectorAll("[data-media-wall]").forEach(function (wall) {
      if (wall.children.length) return;
      var type = wall.getAttribute("data-media-wall") || "photo";
      var count = parseInt(wall.getAttribute("data-media-count") || "12", 10);
      var prefix = wall.getAttribute("data-media-caption") || "";
      fillWall(wall, type, count, prefix);
    });
  }

  global.MediaSlots = {
    PLACEHOLDER: PLACEHOLDER,
    SLOT_LABELS: SLOT_LABELS,
    isPlaceholderSrc: isPlaceholderSrc,
    createSlot: createSlot,
    fillWall: fillWall,
    markFilledSlots: markFilledSlots
  };

  function boot() {
    markFilledSlots();
    initAutoWalls();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
