# 精品线路图片替换执行日志

> 执行时间：2026-06-09  
> 依据：`final-photo-assignment-report.md`  
> 未修改任何 JS / 构建脚本逻辑；仅更新 HTML 图片引用并新增 `site/routes/` 图片副本。

---

## 执行摘要

| 项目 | 数量 |
|------|------|
| **网页 `<img>` 引用替换** | **59** |
| **新增/复制至 `site/routes/` 文件** | **57** |
| **修改的 HTML 页面** | **4** |
| **替换后仍用占位图的线路页图位** | **0** |
| **复制失败 / 源文件缺失** | **0** |

---

## 备份说明

| 类型 | 路径 |
|------|------|
| HTML 替换前备份 | `_backups/routes-photo-replace-20260609-100243/` |
| 新图片目录（副本，未删原图） | `images/网页使用照片集/site/routes/` |
| 执行清单 JSON | `_reports/routes-photo-replace-manifest.json` |

- Desktop 主库 `NZ-Travel-photos ` **未删除、未移动**任何文件  
- 项目内原有 `kaikoura3.jpg`、`hero.jpg`、`featured-*.jpg` 等 **均保留**  
- `slot-placeholder.svg` **保留**，其他页面仍可使用

---

## 修改的页面

| 页面 | 替换数 | 说明 |
|------|--------|------|
| `day-tours.html` | 17 | 页面 Hero + 4 条一日游（封面×4 + 摄影×12） |
| `three-day-tours.html` | 39 | 页面 Hero + 4 条三日游全部图位 |
| `winter-tour.html` | 3 | 特卡波/库克山轮播占位 + **皇后镇误配修正** |
| `south-island-13-day.html` | 1 | Hero 主图 |

**合计：59 处图片引用更新**

---

## 1. Hero 位置替换

| 页面 | 图位 | 新图片 |
|------|------|--------|
| `day-tours.html` | 页面 Hero | `site/routes/hero-mount-cook.jpg`（源：showcase hero 库克山） |
| `three-day-tours.html` | 页面 Hero | `site/routes/three-day-hero.jpg`（源：Web-Optimized Lake-Tekapo-01） |
| `winter-tour.html` | 轮播·特卡波星空 | `site/routes/tekapo-stargazing.jpg` |
| `winter-tour.html` | 轮播·库克山 | `site/routes/hero-mount-cook.jpg` |
| `south-island-13-day.html` | Hero 主图 | `site/routes/featured-04-milford.jpg`（米尔福德峡湾） |

---

## 2. 摄影展示 / 封面图替换

### 一日游（`day-tours.html`）

| 线路 | 封面 | 摄影作品 1–3 |
|------|------|-------------|
| 阿卡罗阿法国小镇 | `akaroa-cover.jpg` | `akaroa-01.jpg` · `akaroa-02.jpg` · `akaroa-03.jpg` |
| 凯库拉观鲸 | `kaikoura-whale-08.jpg` | `kaikoura-01.jpg` · `kaikoura-02.jpg` · `kaikoura-03.jpg` |
| 汉默温泉 | `hanmer-cover.jpg` | `hanmer-01.jpg` · `hanmer-02.jpg` · `hanmer-03.jpg` |
| 城堡山亚瑟山口 | `castle-hill-cover.jpg` | `castle-hill-01.jpg` · `castle-hill-02.jpg` · `castle-hill-03.jpg` |

### 三日游（`three-day-tours.html`）

| 线路 | 封面 | 摄影展示位 |
|------|------|-----------|
| 东海岸观鲸温泉 | `kaikoura-whale-08.jpg` | `ec-d1-1`～`ec-d3-3`（9 张，按 Day1–3） |
| 雪山星空 | `snow-cover.jpg` | `snow-t1`～`snow-t4` · `snow-c1`～`snow-c6` · `snow-r1`～`snow-r4`（14 张） |
| 西海岸冰川 | `wc-cover.jpg` | `wc-1`～`wc-6`（城堡山/霍基蒂卡/西海岸等） |
| 古城企鹅 | `pg-cover.jpg` | `pg-1`～`pg-5`（奥马鲁/摩拉基/但尼丁/企鹅） |

---

## 3. 每日行程对应照片

三日游页面按 **Day 标签** 分配摄影缩略图（见上表 `ec-d*` / `snow-*` / `wc-*` / `pg-*`）。

八日游、十三日游 HTML **无独立「每日行程配图」图位**（行程为文字卡片 / 时间轴），故：

- **八日游**：仅轮播 4 张（凯库拉已配置 + 本次补特卡波/库克山/修正皇后镇）
- **十三日游**：仅 Hero 1 张；13 日每日行程无 `<img>` 槽位

---

## 4. 皇后镇误配修正

| 项目 | 替换前 | 替换后 |
|------|--------|--------|
| `winter-tour.html` 轮播「皇后镇」 | `site/kaikoura3.jpg`（凯库拉图） | `site/routes/featured-05-queenstown.jpg`（皇后镇瓦卡蒂普湖） |

原文件 `images/网页使用照片集/site/kaikoura3.jpg` **未删除**，仍可用于其他页面。

---

## 5. 图片源目录

新文件主要来自：

- `Desktop/NZ-Travel-photos /Web-Optimized/` — Hero / 封面
- `Desktop/NZ-Travel-photos /Website-Photos/` — 摄影展示
- `Desktop/NZ-Travel-photos /Hanmer-Springs/`、`Oamaru/`、`Dunedin/`、`Moeraki-Boulders/` 等 — 汉默/南岛东海岸
- 项目已有 showcase / site 文件 — 复制为 `routes/` 下统一命名副本

完整映射见：`_reports/routes-photo-replace-manifest.json`

---

## 6. 仍缺图的位置

### 本次目标线路页（一日游 / 三日游 / 八日游 / 十三日）

| 状态 | 说明 |
|------|------|
| ✅ **无占位图** | 上述 4 个 HTML 中 `slot-placeholder.svg` 引用已为 **0** |

### 页面结构限制（非缺图，是无图位）

| 页面 | 说明 |
|------|------|
| `winter-tour.html` | 每日行程 `day-card` 区块无图片槽，无法在不改结构的情况下配图 |
| `south-island-13-day.html` | 仅 Hero 有图；13 日时间轴无 `<img>` 槽位 |

### 未纳入本次范围的页面（仍为占位图）

| 页面 | 占位图数量 | 说明 |
|------|-----------|------|
| `two-day-tours.html` | 22 | 两日游，不在 final-photo-assignment 范围 |
| `destinations.html` | 15 | 目的地故事页 |
| `availability.html` | 1 | 档期页 Hero |
| `index.html` | 1 | 证书图 `onerror` 回退占位（非线路图） |

**routes.html** 索引页本身无线路卡片配图，无需替换。

---

## 7. 验证

```
day-tours.html          → slot-placeholder: 0
three-day-tours.html    → slot-placeholder: 0
winter-tour.html        → slot-placeholder: 0
south-island-13-day.html → slot-placeholder: 0
```

`media-slots.js` 会在页面加载时为非占位图自动添加 `media-slot--filled` 类，无需改动脚本。

---

## 8. 回滚方法

如需恢复替换前 HTML：

```bash
cp _backups/routes-photo-replace-20260609-100243/*.html .
```

`site/routes/` 内新图片可保留或手动删除，不影响原图与 Desktop 库。
