(function () {
  "use strict";

  /* ====================================================================
     档期管理：未来只需修改下面的数组 / 区间即可自动更新页面颜色。
     日期格式统一为 YYYY-MM-DD（注意月份和日期都要补零，例如 8 月写 08）。
     ==================================================================== */

  // 已确认预订（红色 = 已满）
  var bookedDates = [
    // "2026-08-05",
    // "2026-08-06",
    // "2026-08-07"
  ];

  // 客户咨询中（黄色）
  var enquiryDates = [
    // "2026-09-12",
    // "2026-09-13"
  ];

  // 休假区间（灰色，含起止两天）
  var holidayRanges = [
    { start: "2026-11-20", end: "2027-01-10" }
  ];

  // 需要展示的月份： [年, 月(1-12)]
  var calendarMonths = [
    [2026, 8],
    [2026, 9],
    [2026, 10],
    [2026, 11],
    [2027, 1],
    [2027, 2],
    [2027, 3],
    [2027, 4],
    [2027, 5],
    [2027, 6]
  ];

  /* ==================== 以下为渲染逻辑，一般无需修改 ==================== */

  var WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var STATUS_TEXT = {
    open: "可预订",
    enquiry: "咨询中",
    booked: "已满",
    holiday: "休假中"
  };

  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function dateKey(y, m, d) {
    return y + "-" + pad(m) + "-" + pad(d);
  }

  function inHoliday(key) {
    // YYYY-MM-DD 补零后可直接按字符串比较（等价于按日期比较）
    return holidayRanges.some(function (r) {
      return key >= r.start && key <= r.end;
    });
  }

  function statusFor(key) {
    if (inHoliday(key)) return "holiday";
    if (bookedDates.indexOf(key) !== -1) return "booked";
    if (enquiryDates.indexOf(key) !== -1) return "enquiry";
    return "open";
  }

  function buildMonth(year, month) {
    var wrap = document.createElement("article");
    wrap.className = "cal-month";

    var title = document.createElement("h3");
    title.className = "cal-month-title";
    title.textContent = year + " 年 " + month + " 月";
    wrap.appendChild(title);

    var head = document.createElement("div");
    head.className = "cal-weekdays";
    WEEKDAYS.forEach(function (w) {
      var c = document.createElement("span");
      c.textContent = w;
      head.appendChild(c);
    });
    wrap.appendChild(head);

    var grid = document.createElement("div");
    grid.className = "cal-days";

    var firstDow = (new Date(year, month - 1, 1).getDay() + 6) % 7; // 周一 = 0
    var daysInMonth = new Date(year, month, 0).getDate();

    for (var i = 0; i < firstDow; i++) {
      var empty = document.createElement("span");
      empty.className = "cal-day cal-day--empty";
      empty.setAttribute("aria-hidden", "true");
      grid.appendChild(empty);
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var key = dateKey(year, month, d);
      var st = statusFor(key);
      var cell = document.createElement("span");
      cell.className = "cal-day cal-day--" + st;
      cell.textContent = d;
      cell.setAttribute("title", key + " · " + STATUS_TEXT[st]);
      cell.setAttribute("aria-label", key + " " + STATUS_TEXT[st]);
      grid.appendChild(cell);
    }

    wrap.appendChild(grid);
    return wrap;
  }

  function render() {
    var root = document.getElementById("calendarRoot");
    if (!root) return;
    root.innerHTML = "";
    calendarMonths.forEach(function (m) {
      root.appendChild(buildMonth(m[0], m[1]));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
