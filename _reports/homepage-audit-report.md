# 首页全站检查与优化报告

**生成时间：** 2026-06-05  
**站点：** https://southislandpeter.co.nz  
**约束：** 未修改 `index.html` 首页整体结构与导航菜单

---

## 1. 首页摄影作品展示（24 张精选）

### 删除的图片（12 个文件：6 张原图 + 6 张缩略图）

| 文件 | 原因 |
|------|------|
| `kaikoura-1.jpg` ~ `kaikoura-5.jpg` | 移出精选集，聚焦雪山/湖泊/奔驰/客人合影四大主题 |
| `peter-1.jpg` | 非四大重点主题，替换为更高冲击力风景与客人合影 |

### 新增的图片（12 个文件：6 张原图 + 6 张缩略图）

| 文件 | 类别 | 来源 |
|------|------|------|
| `mount-cook-4.jpg` | 库克山 | IMG_7609.JPG |
| `mount-cook-5.jpg` | 库克山 | IMG_7614.JPG |
| `mount-cook-6.jpg` | 库克山 | IMG_7578.JPG |
| `lake-tekapo-1.jpg` | 特卡波湖 | IMG_8961.JPG |
| `lake-tekapo-2.jpg` | 特卡波湖 | 330.jpg |
| `guests-5.jpg` | 客人合影 | IMG_6496.JPG |

### 保留的图片（18 个文件：9 张原图 + 9 张缩略图，文件名未变）

`mount-cook-1.jpg` · `mount-cook-2.jpg` · `mount-cook-3.jpg`  
`lake-pukaki-1.jpg` · `lake-pukaki-2.jpg` · `lake-pukaki-3.jpg` · `lake-pukaki-4.jpg`  
`vehicle-1.jpg` ~ `vehicle-6.jpg`  
`guests-1.jpg` ~ `guests-4.jpg`  
`tekapo-stars-1.jpg`

### 最终 24 张展示顺序与布局

| # | 文件 | 类别 | 布局 |
|---|------|------|------|
| 1 | mount-cook-1.jpg | 库克山 | hero |
| 2 | lake-tekapo-1.jpg | 特卡波湖 | standard |
| 3 | vehicle-1.jpg | 奔驰商务车 | wide |
| 4 | guests-1.jpg | 客人合影 | standard |
| 5 | mount-cook-2.jpg | 库克山 | standard |
| 6 | lake-tekapo-2.jpg | 特卡波湖 | hero |
| 7 | vehicle-2.jpg | 奔驰商务车 | standard |
| 8 | guests-2.jpg | 客人合影 | wide |
| 9 | mount-cook-3.jpg | 库克山 | standard |
| 10 | lake-pukaki-1.jpg | 普卡基湖 | standard |
| 11 | vehicle-3.jpg | 奔驰商务车 | standard |
| 12 | guests-3.jpg | 客人合影 | standard |
| 13 | mount-cook-4.jpg | 库克山 | standard |
| 14 | lake-pukaki-2.jpg | 普卡基湖 | standard |
| 15 | vehicle-4.jpg | 奔驰商务车 | standard |
| 16 | guests-4.jpg | 客人合影 | standard |
| 17 | mount-cook-5.jpg | 库克山 | standard |
| 18 | lake-pukaki-3.jpg | 普卡基湖 | standard |
| 19 | vehicle-5.jpg | 奔驰商务车 | standard |
| 20 | guests-5.jpg | 客人合影 | standard |
| 21 | mount-cook-6.jpg | 库克山 | standard |
| 22 | lake-pukaki-4.jpg | 普卡基湖 | standard |
| 23 | vehicle-6.jpg | 奔驰商务车 | standard |
| 24 | tekapo-stars-1.jpg | 特卡波星空 | standard |

**类别分布：** 库克山 6 · 普卡基湖 4 · 特卡波湖 2 · 特卡波星空 1 · 奔驰 6 · 客人合影 5

**优化规则已应用：**
- 过滤文字截图 / 聊天截图（`xhs-showcase-score.py`）
- MD5 + 感知哈希去重
- 人物区域哈希避免同一客人连续出现
- 类别交错排序，避免同地点连续
- hero / wide / standard 大小图混排

---

## 2. 客人好评墙

- 自动扫描 `images/网页使用照片集/reviews/` 生成 manifest
- 占位图过滤：`placeholder` / `slot-placeholder` 文件名已排除
- **保留 9 张真实评价截图**（无占位图）：

  1. `reviews-service-service-04.JPG` (Google)
  2. `reviews-service-service-03.JPG` (微信)
  3. `reviews-service-service-02.JPG` (小红书)
  4. `reviews-photo-photo-01.JPG` (小红书)
  5. `reviews-driving-driving-02.JPG` (小红书)
  6. `reviews-driving-driving-01.JPG` (微信)
  7. `review-service-service-01.JPG` (Google)
  8. `review-return-return-01.JPG` (微信)
  9. `review-guide-01.jpg` (小红书)

---

## 3. 手机端与交互

| 检查项 | 状态 |
|--------|------|
| 图片 `object-fit: cover` / `contain`，不变形 | ✅ `styles.css` |
| `max-width: 100%`，不超出屏幕 | ✅ |
| 精选区 12 列 → 6 列 → 2 列响应式网格 | ✅ |
| 好评墙双列瀑布流 | ✅ |
| Lightbox 移动端 `max-width: 96vw` | ✅ |
| 点击放大（`bindMasonryLightbox`） | ✅ 未改动逻辑 |

---

## 4. 图片链接校验

| 范围 | 本地 | 线上（发布前） |
|------|------|----------------|
| 精选 24 张 × 2（原图+缩略图） | 48/48 ✅ | 36/48（12 张新图为 404，待本次 push 后生效） |
| 好评 9 张 × 2 | 18/18 ✅ | 18/18 ✅ |
| **合计** | **66/66 ✅** | **54/66（推送后应为 66/66）** |

---

## 5. GitHub Pages 发布状态

- 首页 https://southislandpeter.co.nz/ → **HTTP 200**（GitHub Pages）
- 当前线上 `last-modified`：2026-06-05（推送前版本）
- 本次 commit 推送后将自动触发 Pages 重新部署

---

## 6. 修改的文件清单

| 文件 | 变更说明 |
|------|----------|
| `gallery.js` | 精选区支持 `layout` 字段与 editorial 混排渲染 |
| `styles.css` | `#homeGalleryShowcase` 编辑式网格 + 移动端响应式 + 好评墙图片样式 |
| `script.js` | 好评墙过滤占位图文件名 |
| `gallery/xhs-showcase.json` | 24 张精选 manifest（含 layout、交错顺序） |
| `images/网页使用照片集/manifest.json` | 好评墙 9 张评价截图 manifest |
| `images/网页使用照片集/xiaohongshu-showcase/*` | 删除 6 组旧图，新增 6 组图片 |
| `scripts/generate-xhs-showcase.mjs` | 四主题配额 + 交错排序 + layout 分配 |
| `scripts/generate-reviews-manifest.mjs` | 占位图过滤 |
| `scripts/verify-site-assets.mjs` | 新增：本地 manifest 资源校验 |
| `_reports/asset-verify.json` | 校验结果 |
| `_reports/homepage-audit-report.md` | 本报告 |

**未修改：** `index.html`（首页结构与导航保持不变）
