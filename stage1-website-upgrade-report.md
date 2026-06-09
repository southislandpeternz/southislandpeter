# Stage 1 网站信任模块升级报告

> 执行时间：2026-06-09  
> 依据：`website-improvement-plan.md` 阶段 2–3（信任模块 + 联系转化）  
> 约束：不删除现有内容 · 不修改线路文案 · 保持现有视觉风格

---

## 一、执行摘要

| 项目 | 结果 |
|------|------|
| 新增团队介绍页 | **1**（`about-peter.html`） |
| 线路页团队介绍条 | **4** 页各 1 处 |
| 客户评价专区 | **5** 页（含新团队页） |
| WhatsApp 入口增强 | **全目标页** + 首页 2 处 |
| 13 日游浮动联系 | ✅ 已补全（原先缺失） |
| 完整联系页脚（QR） | **3** 页新增（destinations / two-day / 13-day） |

---

## 二、新增页面

| 页面 | 路径 | 说明 |
|------|------|------|
| **认识 Peter 与团队** | `about-peter.html` | 独立团队介绍页：Hero · 信任列表 · Peter/证书/奔驰 · 关于文案 · 6 条评价预览 · 完整联系区 · 浮动 WhatsApp/微信 |

首页 `#peter` 区块 **保留不变**；导航「关于 Peter」现指向新页面，首页内锚点 `#peter` 仍可直接访问。

---

## 三、修改的文件

### HTML（6 个）

| 文件 | 变更内容 |
|------|---------|
| `about-peter.html` | **新建** — 完整团队介绍 + 评价 + 联系 |
| `index.html` | 导航链至 `about-peter.html`；精品线路 CTA 与评价区增加 WhatsApp |
| `destinations.html` | 团队条 · 评价专区 · CTA WhatsApp · 完整联系页脚 · lightbox · `reviews.js` |
| `two-day-tours.html` | 团队条 · 评价专区 · 3 条线路 WhatsApp 询价 · 尾段联系页脚 · lightbox · `reviews.js` |
| `winter-tour.html` | 团队条 · 评价专区 · 预约 CTA WhatsApp · lightbox · `reviews.js` |
| `south-island-13-day.html` | 团队条 · Hero WhatsApp · 评价专区 · **浮动联系** · 完整联系页脚 · 微信弹窗 · lightbox · `reviews.js` |

### CSS / JS（3 个）

| 文件 | 变更内容 |
|------|---------|
| `styles.css` | 新增 `.page-team-strip` · `.page-reviews-section` · `.page-contact-footer` · `.header-wa-btn` · `.btn--wa`；优化 `.home-routes-cta` 布局 |
| `reviews.js` | 新增 `loadPagePreviews()`，支持 `[data-reviews-preview]` 多容器 + `data-reviews-limit` / `data-reviews-offset` |
| `winter-tour.js` | 微信弹窗支持 `[data-wechat-trigger]`（联系页脚按钮） |

---

## 四、各页新增模块明细

### 团队介绍

| 页面 | 位置 | 形式 |
|------|------|------|
| `about-peter.html` | 全页 | 完整版（同首页 `#peter` 内容 + 扩展） |
| `destinations.html` | `#team`，故事导航下方 | 精简条：Peter 肖像 + 文案 + 链至 about-peter |
| `two-day-tours.html` | `#team`，Hero 下方 | 精简条（两日游定制文案） |
| `winter-tour.html` | `#team`，轮播下方 | 精简条（9天8晚带队文案） |
| `south-island-13-day.html` | `#team`，Hero 下方 | 精简条（13天旗舰文案） |

### 客户评价专区

| 页面 | 容器 ID / 属性 | 展示条数 |
|------|---------------|---------|
| `about-peter.html` | `#pageFeaturedReviews` · offset 0 | 6 |
| `destinations.html` | `data-reviews-offset="0"` | 3 |
| `two-day-tours.html` | `data-reviews-offset="3"` | 3 |
| `winter-tour.html` | `#tour-reviews` · offset 6 | 3 |
| `south-island-13-day.html` | `#route-reviews` · offset 9 | 3 |

评价卡片样式复用首页 `.home-reviews-preview-grid` + `.rev-center-card`；数据源：`reviews/featured-manifest.json`。

### WhatsApp 联系按钮

| 层级 | 页面 |
|------|------|
| 浮动按钮 `.float-contact` | 全部目标页（**13-day 本次新增**） |
| 页脚「打开 WhatsApp」+ QR | destinations · two-day · winter（原有）· 13-day（新增）· about-peter |
| 团队条主按钮 | 4 条线路页 + about-peter |
| 转化 CTA | destinations 故事 CTA · two-day 3×线路 + 尾段 · winter 预约区 · 13-day Hero + 定价区 · index 线路/评价区 |
| Header 图标（仅 about-peter） | `.header-wa-btn` 桌面端快捷入口 |

统一链接：`https://wa.me/6421976868`

---

## 五、未改动 / 保留项

- 所有线路 **Day 卡片文案、行程描述、价格说明** 均未修改  
- 首页 `#peter` · `#reviews` · `#gallery` · `#contact` 原有区块完整保留  
- 现有图片与占位图状态不变（图片填充属计划阶段 1 填图，本次未执行）  
- `day-tours.html` · `three-day-tours.html` · `routes.html` 等未纳入本次范围（可后续统一导航）

---

## 六、如何预览效果

### 方法 1：本地静态服务器（推荐）

在项目根目录执行：

```bash
cd "/Users/yueshe/Documents/小红书AI"
python3 -m http.server 8080
```

浏览器打开：

| 页面 | URL |
|------|-----|
| 首页 | http://localhost:8080/index.html |
| **团队介绍（新）** | http://localhost:8080/about-peter.html |
| 南岛故事 | http://localhost:8080/destinations.html |
| 两日游 | http://localhost:8080/two-day-tours.html |
| 8 日游 | http://localhost:8080/winter-tour.html |
| 13 日游 | http://localhost:8080/south-island-13-day.html |
| 全部评价 | http://localhost:8080/customer-reviews.html |

### 方法 2：直接打开 HTML 文件

双击 `index.html` 或 `about-peter.html` 可在浏览器中查看布局；**评价 JS 需 HTTP 服务**（`fetch` 加载 `reviews/featured-manifest.json`），`file://` 协议下评价区可能显示「加载失败」。

### 预览检查清单

- [ ] 导航「关于 Peter」进入 `about-peter.html`
- [ ] 各线路页 Hero 下方可见 Peter 团队条
- [ ] 评价区显示 3–6 张卡片（需本地服务器）
- [ ] 右下角浮动 WhatsApp / 微信（13-day 重点验证）
- [ ] 页脚微信 + WhatsApp 二维码与按钮可点击
- [ ] 点击评价截图可灯箱放大

---

## 七、后续建议（Stage 2）

按 `website-improvement-plan.md` 下一阶段：

1. 填充 `two-day-tours.html` / `destinations.html` 占位图  
2. 为 8 日 / 13 日每日行程增加配图槽  
3. 统一 `day-tours.html` · `three-day-tours.html` · `routes.html` 导航与信任模块  
