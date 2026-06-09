# Reviews 页面审计报告

**生成时间：** 2026-06-08 20:54 UTC  
**审计范围：** `customer-reviews.html` · `reviews/featured-manifest.json` · `images/网页使用照片集/reviews/`

---

## 摘要

| 指标 | 数值 |
|------|------|
| **总评价数** | 30 |
| **修复前重复图片组** | 3 组（6 个 rank 共用 3 张相同截图） |
| **修复后重复图片组** | 0 |
| **缺失图片** | 0 |
| **reviews/ 源文件夹未使用图片（修复前）** | 9 |
| **reviews/ 源文件夹未使用图片（修复后）** | 6 |

---

## 1. 数据源

Reviews 页面通过 `reviews.js` 加载：

- Manifest：`reviews/featured-manifest.json`
- 精选区：`#crFeaturedGrid`（前 6 条）
- 全部评价：`#crAllGrid`（30 条）

每条评价截图路径形如：`images/网页使用照片集/reviews/featured/featured-NN.jpg`

---

## 2. 修复前：重复截图（内容 MD5 相同）

| 重复组 | 涉及 Rank | 说明 |
|--------|-----------|------|
| A | 6, 30 | `featured-06.jpg` 与 `featured-30.jpg` 内容完全相同 |
| B | 14, 28 | `featured-14.jpg` 与 `featured-28.jpg` 内容完全相同 |
| C | 16, 29 | `featured-16.jpg` 与 `featured-29.jpg` 内容完全相同 |

共 **3 组重复**，**3 张**多余重复实例（rank 28、29、30 与更早评价重复）。

---

## 3. 每张评价图片引用次数

Manifest 中各 `featured-NN.jpg` 在单条评价内出现于 `image`、`thumb`、`media.*` 字段；以下为该文件名在全部 30 条评价中的**总引用次数**：

| 引用次数 | 文件数 | 说明 |
|----------|--------|------|
| 1 次 | 30 | 每条评价对应唯一 featured 文件，无跨条目路径重复 |

> 问题不在路径重复，而在 **featured-28/29/30 文件内容与 rank 6/14/16 的截图字节相同**。

---

## 4. 缺失图片

修复前：**0**  
修复后：**0**

全部 30 条 `featured/featured-01.jpg` … `featured-30.jpg` 均存在且可访问。

---

## 5. 已修复项目

使用 `reviews/` 根目录下**未使用**的源截图，**仅替换**重复槽位的图片文件（manifest 路径与页面布局不变）：

| 槽位 | 原问题 | 替换源文件 |
|------|--------|------------|
| `featured-28.jpg`（rank 28） | 与 rank 14 重复 | `review-guide-01.jpg` |
| `featured-29.jpg`（rank 29） | 与 rank 16 重复 | `reviews-service-service-04.JPG` |
| `featured-30.jpg`（rank 30） | 与 rank 6 重复 | `reviews-driving-driving-01.JPG` |

修复后 **30 张 featured 截图 MD5 全部唯一**。

---

## 6. 仍未使用的 reviews/ 源文件（6 张）

这些文件位于 `images/网页使用照片集/reviews/`（非 featured 子目录），可供后续扩充评价库：

- `review-return-return-01.JPG`
- `review-service-service-01.JPG`
- `reviews-driving-driving-02.JPG`
- `reviews-photo-photo-01.JPG`
- `reviews-service-service-02.JPG`
- `reviews-service-service-03.JPG`

---

## 7. 未修改项（按任务要求）

- 首页 `index.html` / `#homeFeaturedReviews`
- Gallery / 摄影模块
- Routes 页面
- `styles.css`
- `reviews.js`（加载逻辑未改）

---

## 8. 本地验证

打开 http://127.0.0.1:8765/customer-reviews.html  
确认 rank 28、29、30 截图已与 rank 6、14、16 不同。
