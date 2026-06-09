# 网站改进计划

> 分析日期：2026-06-09  
> 范围：`index.html` · `destinations.html` · `two-day-tours.html` · `winter-tour.html` · `south-island-13-day.html`  
> **约束：不修改线路文案内容；本文档仅为结构分析与改进建议，不涉及代码改动。**

---

## 一、总览对比

| 页面 | 现有图片区 | 占位/缺图 | 无图结构区块 | 客户评价区 | 团队介绍区 | 浮动 WhatsApp |
|------|-----------|----------|-------------|-----------|-----------|--------------|
| `index.html` | 丰富（Hero / Peter / 线路 / 摄影 / 评价） | 1 处回退占位 | 3 处纯文字 | ✅ 有 `#reviews` | ✅ 有 `#peter` | ✅ |
| `destinations.html` | 21 景点图位 | **15 占位** + 1 误配 | 4 条线路头 + CTA | ❌ 无 | ⚠️ 仅分散「Peter 说」 | ✅ |
| `two-day-tours.html` | 22 图位（Hero+封面+缩略图） | **22 全部占位** | CTA 尾段 | ❌ 无 | ❌ 无 | ✅ |
| `winter-tour.html` | 轮播 4 张 + 页脚 QR | 每日 9 天无图位 | 概览 / 9×day-card | ❌ 无 | ❌ 无 | ✅ |
| `south-island-13-day.html` | Hero 1 张 | **13 天无图位** | 概览 / 13×timeline / 定价 | ❌ 无 | ❌ 无 | ❌ **缺失** |

**结论：** 首页信息架构最完整；线路详情页普遍缺少「评价 / 团队 / 行程配图」三大信任模块；`south-island-13-day.html` 联系入口最弱（无浮动按钮、无完整联系页脚）。

---

## 二、逐页分析

### 1. `index.html`（首页）

#### 1.1 页面结构

| 区块 | ID / 类名 | 当前图片状态 |
|------|----------|-------------|
| Hero 主视觉 | `#hero` | ✅ `hero-cover.jpg` |
| 认识 Peter | `#peter` | ✅ Peter 肖像 · 证书 · 奔驰车 |
| 精品线路推荐 | `#routes` | ✅ 6 张线路卡片封面 |
| 摄影旅拍 | `#gallery` | ✅ JS 动态加载 masonry |
| 客人评价 | `#reviews` | ✅ JS 动态加载预览 |
| 联系 Peter | `#contact` | ✅ 微信 + WhatsApp QR |
| 浮动联系 | `.float-contact` | ✅ WhatsApp + 微信 |

#### 1.2 没有图片区的位置

以下区块**有内容但 HTML 中无配图槽位**（非占位图问题，是结构层面缺图）：

| 位置 | 说明 | 视觉影响 |
|------|------|---------|
| `.hero-highlights` | 服务亮点仅用 emoji 图标 | 中等——可考虑小图或实景缩略 |
| `.home-trust-list` | 6 条信任要点纯文字列表 | 低——可改为「图标+短图」混排 |
| `.home-about-grid` | 「关于 Peter / 关于天天旅行社」双栏纯文字 | 中等——文字块旁无 inline 图 |
| `.plan-quote` | 页脚 Peter 引言 blockquote | 低——可加 Peter 侧脸或小图 |
| 证书图 `#certImage` | 有图位，但 `onerror` 回退至 `slot-placeholder.svg` | 高——证书加载失败时显占位 |

#### 1.3 建议增加图片展示区域

| 优先级 | 建议位置 | 建议内容 | 复用参考 |
|--------|---------|---------|---------|
| P2 | `#routes` 区块上方 | 南岛路线示意地图（基督城→凯库拉→特卡波→皇后镇） | 可新建静态 SVG/地图图 |
| P2 | `.home-about-grid` 各栏 | Peter 带团现场照 / 奔驰车内视角 | `site/Peter.jpg` · 带团图库 |
| P3 | `#routes` 卡片 hover | 第二条线路预览图（可选） | 现有 `site/routes/` |
| P3 | Hero 与 `#peter` 之间 | 横向「精选 4 景」窄条轮播 | 复用 `#gallery` 数据源 |

#### 1.4 建议增加客户评价区域

首页 **已有完整 `#reviews` 模块**（`reviews.js` 驱动 `#homeFeaturedReviews`）。建议增强而非新建：

| 建议 | 位置 | 说明 |
|------|------|------|
| 按线路分类预览 | `#reviews` 标题下 | 增加 Tab：「8日游 · 13日游 · 观鲸 · 定制」筛选预览 |
| 评价与线路联动 | `#routes` 各卡片底部 | 每条线路下 1 条精选短评 + 链至 `customer-reviews.html` |
| 数字信任条 | `#reviews` 顶部 | 「30+ 五星 · Google · 微信截图」数字徽章（文案已有，可视觉强化） |

#### 1.5 建议增加团队介绍区域

首页 **已有 `#peter` 完整团队模块**。建议微调：

| 建议 | 位置 | 说明 |
|------|------|------|
| 带团场景图集 | `.home-trust-visual` 第四格 | 增加「Peter 与客人合影」或「沿途摄影」 |
| 资质扩展 | 证书旁 | 增加驾驶资质 / 保险 / 奔驰车辆登记（如有素材） |
| 视频入口 | `#peter` 底部 | 「认识 Peter · 1 分钟」短视频封面（可选） |

#### 1.6 建议增加 WhatsApp 联系按钮位置

| 现状 | 建议补充 |
|------|---------|
| ✅ Header 电话 + `#contact` 按钮 + 页脚 QR + 浮动 `.float-contact` | |
| P2 | `#routes` 区块末尾 CTA 旁增加 `wa.me` 按钮（与「查看全部精品线路」并列） |
| P2 | `#reviews` 区块底部 | 「WhatsApp 咨询过往客人同款行程」 |
| P3 | Header `.btn-cta` 旁 | 移动端增加小号 WhatsApp 图标链（海外访客更直观） |

---

### 2. `destinations.html`（南岛故事地图）

#### 2.1 页面结构

| 区块 | 图片状态 |
|------|---------|
| Hero | ✅ `mt-cook1.JPG` |
| 北线 5 景点 | 1 实图 + **4 占位** |
| 东线 6 景点 | 3 实图 + **3 占位** |
| 中线 5 景点 | **4 占位** + 1 误配（皇后镇用了 `kaikoura3.jpg`） |
| 西线 5 景点 | 1 实图 + **4 占位** |
| 底部 CTA | ❌ 无图片区 |
| 页脚 | ❌ 仅版权链接，无 QR |

#### 2.2 没有图片区的位置

**A. 已有图位但缺图（15 处占位 + 1 处误配）**

| 线路 | 景点 | 状态 |
|------|------|------|
| 北线 | 阿卡罗阿 · 汉默温泉 · 皮克顿 · 马尔borough酒庄 | 占位 |
| 东线 | 提马鲁 · 普卡基湖 · Twizel | 占位 |
| 中线 | 瓦纳卡 · 克伦威尔 · 箭镇 · 格林诺奇 | 占位 |
| 中线 | 皇后镇 | ⚠️ 误用凯库拉图 |
| 西线 | 弗朗兹约瑟夫 · 霍基蒂卡 · Punakaiki · 格雷茅斯 | 占位 |

**B. 结构上完全没有图片区**

| 位置 | 说明 |
|------|------|
| `.story-nav` | 四条线路锚点导航，纯文字 |
| 各 `.story-route-head` | Route 01–04 标题区，无线路横幅图 |
| `.story-cta` | 「听过了故事，想亲自走一趟？」纯文字 CTA |
| 页脚 `.footer` | 无联系 QR / 无 Peter 头像 |

#### 2.3 建议增加图片展示区域

| 优先级 | 建议位置 | 建议内容 |
|--------|---------|---------|
| **P0** | 15 处 `.story-spot-photo` | 按景点填入 `site/routes/` 或 Desktop 库对应照片（不改文案） |
| **P0** | `#queenstown` | 替换为皇后镇实图（如 `featured-05-queenstown.jpg`） |
| P1 | 各 `#north-route` 等 section 头部 | 增加 `.story-route-banner` 宽幅线路主题图（4 张） |
| P1 | `.story-nav` 下方 | 南岛四线彩色示意地图 |
| P2 | `.story-cta` | 背景图或左侧 Peter 带团图 + 右侧 CTA |
| P2 | 每条线路末尾 | 3 张「Peter 实拍精选」横向条（与故事主题呼应） |

#### 2.4 建议增加客户评价区域

**当前：无。** 建议在 `#west-route` 与 `.story-cta` 之间新增：

```
<section class="section section-alt" id="story-reviews">
  · 标题：「走过这些路的客人怎么说」
  · 3–6 条与北/东/中/西线相关的评价预览
  · 链至 customer-reviews.html
</section>
```

| 评价主题示例 | 对应故事线 |
|-------------|-----------|
| 凯库拉观鲸 / 龙虾 | 北线 |
| 特卡波星空 / 库克山 | 东线 |
| 箭镇 / 皇后镇慢生活 | 中线 |
| 西海岸 / 峡湾 | 西线 |

#### 2.5 建议增加团队介绍区域

**当前：** Peter 声音分散在 21 个 `blockquote.peter-says`，无统一团队模块。

建议在 Hero 下方或 `.story-nav` 前增加紧凑版：

| 元素 | 说明 |
|------|------|
| Peter 肖像 + 一句话 | 「十多年南岛生活，这些故事来自真实带团」 |
| 3 图标 | 正规注册 · 奔驰商务 · 4–8 人小团 |
| 链至 | `index.html#peter` |

#### 2.6 建议增加 WhatsApp 联系按钮位置

| 现状 | 建议 |
|------|------|
| ✅ 浮动 `.float-contact` | |
| ❌ Header 仅「立即咨询」→ 首页 contact | P1：Header 增加直接 `wa.me` 图标 |
| ❌ `.story-cta` 无 WhatsApp | **P0**：CTA 按钮组增加「WhatsApp 聊行程」 |
| ❌ 页脚无 QR | P1：复用 `index.html#contact` 的 QR 双卡布局 |
| P2 | 每个 `#story-spot` 底部 | 轻量「想去这里？WhatsApp Peter」链（可选，避免过密） |

---

### 3. `two-day-tours.html`（两日游）

#### 3.1 页面结构

| 区块 | 图位数量 | 状态 |
|------|---------|------|
| Hero `.tt-banner` | 1 | 占位 |
| 阿卡罗阿线路 | 1 封面 + 6 缩略图 | 全部占位 |
| 凯库拉线路 | 1 封面 + 6 缩略图 | 全部占位 |
| 汉默温泉线路 | 1 封面 + 6 缩略图 | 全部占位 |
| 「更长的假期？」CTA | 0 | 纯文字 |
| 页脚 | 0 | 纯文字 |

**合计：22 处占位图，0 实图。**

#### 3.2 没有图片区的位置

**A. 有图位但未填图：** 全部 22 处（见上表）。

**B. 结构上无图片区：**

| 位置 | 说明 |
|------|------|
| `.section-head` | 「精选两日游线路」标题区 |
| `.route-pricing` | 尾段推广三日游/深度线 |
| 页脚 | 无 QR · 无 Peter 介绍 |
| 全页 | 无独立摄影作品集区块 |
| 全页 | 无行程地图/路线示意 |

#### 3.3 建议增加图片展示区域

| 优先级 | 建议 | 图片来源建议 |
|--------|------|-------------|
| **P0** | Hero → 班克斯半岛或凯库拉海岸精选 | `site/routes/akaroa-cover.jpg` 或 `kaikoura-whale-08.jpg` |
| **P0** | 3 条线路封面 + 18 张 Day 缩略图 | 复用 `day-tours.html` 已配置的 `site/routes/` 同名资源 |
| P1 | Hero 下方 | 横向「含住宿 · 奔驰商务 · 1 晚」三格实景条 |
| P1 | 每条 `tt-card` 与 `tt-days` 之间 | 可选 1 张宽幅「当日高光」图 |
| P2 | `#tour-overview` 式路线条 | 基督城 ↔ 阿卡罗阿 / 凯库拉 / 汉默 示意（新建区块） |

#### 3.4 建议增加客户评价区域

**当前：无。** 建议在三条 `tt-card` 之后、`.route-pricing` 之前：

```
<section class="section section-alt">
  · 标题：「两日游客人真实反馈」
  · 3 卡：阿卡罗阿慢生活 / 凯库拉观鲸 / 汉默温泉度假
  · 每卡 1 条评价摘要 + 五星
  · CTA → customer-reviews.html
</section>
```

可复用首页 `#homeFeaturedReviews` 的 JS 组件（实现时再接入，本文档不改代码）。

#### 3.5 建议增加团队介绍区域

**当前：无。** 建议在 Hero 与线路列表之间插入精简条：

| 元素 | 内容 |
|------|------|
| 左 | Peter 头像 + 「Peter 亲自规划两日游住宿与节奏」 |
| 右 | 奔驰车缩略图 + 「含舒适住宿 · 不赶路」 |
| 链至 | `index.html#peter` |

#### 3.6 建议增加 WhatsApp 联系按钮位置

| 现状 | 建议 |
|------|------|
| ✅ 浮动 `.float-contact` | |
| ❌ 每条线路 `.tt-card-actions` 仅「获取报价」→ 首页 | **P0**：并列增加「WhatsApp 询价」 |
| ❌ `.route-pricing` 无 WhatsApp | P1：与「三日游线路」按钮并列 |
| ❌ 页脚无 QR | P1：增加 `winter-tour.html` 式 `#tour-contact` 联系区块 |
| P2 | Hero `.tt-banner-inner` | 副标题下增加 WhatsApp 文字链 |

---

### 4. `winter-tour.html`（南岛经典 9 天 8 晚）

#### 4.1 页面结构

| 区块 | 图片状态 |
|------|---------|
| 顶部轮播 `.tour-carousel` | ✅ 4 张（凯库拉 · 特卡波 · 库克山 · 皇后镇） |
| 行程概览 `#tour-overview` | ❌ 纯文字 + 路线文字链 |
| 每日行程 `#tour-days` | ❌ 9 个 `.day-card`，**均无 `<img>` 结构** |
| 预约 CTA | ❌ 纯文字按钮 |
| 页脚 `#tour-contact` | ✅ 电话 · 邮件 · 微信 + WhatsApp QR |
| 浮动联系 | ✅ |

#### 4.2 没有图片区的位置

**A. 轮播未覆盖但行程提及的目的地**

| 目的地 | 在行程中出现 | 轮播中 |
|--------|------------|--------|
| 瓦纳卡 | Day 5–6 | ❌ 无 |
| 米尔福德峡湾 | Day 8 全日 | ❌ 无 |
| 基督城 | Day 1 | ❌ 无 |
| 箭镇 | Day 7 | ❌ 无 |

**B. 结构上完全没有图片区（9+ 处）**

| 位置 | 数量 | 说明 |
|------|------|------|
| `.day-card` × 9 | 9 | 每日行程卡片仅文字 + meta，无摄影缩略图 |
| `.tour-overview-grid` | 4 统计格 | 数字统计，无视觉 |
| `.tour-route` | 1 | 文字箭头路线，无地图图 |
| `.tour-book-cta` | 1 | 纯文字 CTA |
| 全页 | — | 无独立「本线路摄影精选」区块 |
| 全页 | — | 无 Peter / 团队模块 |

#### 4.3 建议增加图片展示区域

| 优先级 | 建议位置 | 建议内容 |
|--------|---------|---------|
| P1 | 轮播 | 增至 6–8 张：补瓦纳卡 · 米尔福德 · 基督城（不改轮播逻辑，仅增 slide） |
| **P0** | 每个 `.day-card` 内 | 在 `.day-card-desc` 下增加 `.day-card-photo`（1 张代表图 × 9 天） |
| P1 | `#tour-overview` 下方 | 南岛路线地图或 `tour-route` 可视化配图 |
| P2 | `#tour-days` 之前 | 「沿途摄影精选」6 图 masonry（复用 `site/routes/snow-*` 等同源图） |
| P2 | Day 8 米尔福德 | 可单独加宽图位（全日亮点） |

**Day 1–9 配图主题建议（仅换图，不改行程文案）：**

| Day | 建议主题图 |
|-----|-----------|
| 1 | 基督城雅芳河 / 植物园 |
| 2 | 凯库拉观鲸 |
| 3 | 特卡波星空 |
| 4 | 库克山 / 普卡基湖 |
| 5 | 瓦纳卡孤树 |
| 6 | 皇后镇湖景 |
| 7 | 箭镇 / 温泉 |
| 8 | 米尔福德峡湾 |
| 9 | 皇后镇送机 / 湖景告别 |

#### 4.4 建议增加客户评价区域

**当前：无。** 建议在 `#tour-days` 与 `#tour-contact` 之间：

```
<section class="section section-alt" id="tour-reviews">
  · 标题：「9 天 8 晚经典线 · 客人怎么说」
  · 2–4 条与凯库拉/特卡波/皇后镇/峡湾相关的评价
  · 可选：Google Review 徽章
  · CTA → customer-reviews.html
</section>
```

#### 4.5 建议增加团队介绍区域

**当前：无。** 建议在 `#tour-overview` 与 `#tour-days` 之间：

| 模块 | 内容 |
|------|------|
| 左栏 | Peter 肖像 + 简短带团说明 |
| 右栏 | 奔驰 V-Class · 4–8 人 · 冬季路况经验 |
| 底链 | `index.html#peter` · 「认识您的向导」 |

#### 4.6 建议增加 WhatsApp 联系按钮位置

| 现状 | 建议 |
|------|------|
| ✅ 浮动按钮 | |
| ✅ `#tour-contact` QR + 「打开 WhatsApp」 | |
| ❌ `.tour-book-cta` | **P0**：「预约本行程」旁增加 WhatsApp 主按钮 |
| ❌ 每个 `.day-card` | P2：Day 8 峡湾卡片内增加「咨询峡湾团期」WA 链 |
| P1 | Header `.btn-cta` | 当前链 `#tour-contact`，可改为双入口（咨询 / WhatsApp） |
| P2 | 轮播 overlay | 标题区增加小号 WhatsApp 链（海外流量） |

---

### 5. `south-island-13-day.html`（南岛慢旅行 13 天 12 晚）

#### 5.1 页面结构

| 区块 | 图片状态 |
|------|---------|
| Hero `.route-cover` | ✅ `featured-04-milford.jpg` |
| 每日行程 `#route-days` | ❌ 13 个 `.flagship-day-card`，**均无图片结构** |
| 价格咨询 `#route-pricing` | ❌ 纯文字 + 按钮 |
| 页脚 | ❌ 仅版权，**无联系 QR** |
| 浮动联系 | ❌ **整页缺失** |

#### 5.2 没有图片区的位置

**A. 有 Hero，其余全无图**

| 类型 | 数量 |
|------|------|
| 时间轴每日卡片无图位 | **13 处**（Day 1–13） |
| 无行程概览视觉区 | 1（相比 8 日游缺 `#tour-overview`） |
| 无摄影展示 | 1 |
| 无路线地图 | 1 |

**B. 13 日时间轴缺图明细**

| Day | 主要地点 | 建议图主题 |
|-----|---------|-----------|
| 1 | 基督城 | 雅芳河 / 植物园 |
| 2 | 凯库拉 | 观鲸 |
| 3 | 汉默温泉 | 温泉 |
| 4 | 阿卡罗阿 | 法式港湾 |
| 5 | 特卡波 | 星空 |
| 6 | 库克山 | 雪山 |
| 7 | 奥马鲁 | 大圆石 / 企鹅 |
| 8 | 但尼丁 | 火车站 |
| 9 | 蒂阿瑙 | 湖景 |
| 10 | 米尔福德 | 峡湾 |
| 11 | 瓦纳卡 | 孤树 |
| 12 | 皇后镇 | 湖景 |
| 13 | 皇后镇 | 自由活动 / 送别 |

#### 5.3 建议增加图片展示区域

| 优先级 | 建议位置 | 说明 |
|--------|---------|------|
| **P0** | 13 × `.flagship-day-card` | 每卡增加 `.flagship-day-photo`（右侧或顶部） |
| P1 | Hero 下方 | 新增 `#route-overview`：天数 · 里程 · 小团 · 纯玩（对齐 8 日游） |
| P1 | `#route-days` 前 | 横向「13 日高光轮播」6–8 张 |
| P2 | `#route-days` 后 | 「环岛摄影精选」masonry 12 张 |
| P2 | `#route-pricing` 上 | 路线全图示意（凯库拉→…→皇后镇） |

#### 5.4 建议增加客户评价区域

**当前：无。** 旗舰线路信任需求最高，建议 `#route-days` 与 `#route-pricing` 之间：

```
<section class="section" id="route-reviews">
  · 标题：「13 日慢旅行 · 真实客人反馈」
  · 4–6 条长行程 / 摄影 / 小团相关评价
  · 突出「不赶路」「Peter 带队」关键词
  · CTA → customer-reviews.html
</section>
```

#### 5.5 建议增加团队介绍区域

**当前：无。** 建议在 Hero 内或 `#route-days` 前：

| 模块 | 内容 |
|------|------|
| `.route-cover` 下方条 | Peter + 奔驰 + 「13 天 12 晚 · Peter 全程带队」 |
| 扩展块 | 公司注册 · 南岛深度经验 · 摄影友好行程 |
| 链至 | `index.html#peter` |

#### 5.6 建议增加 WhatsApp 联系按钮位置

| 现状 | 建议 |
|------|------|
| ⚠️ `#route-pricing` 有 WhatsApp 按钮 | 保留 |
| ❌ **无 `.float-contact`** | **P0：整页最高优先级——补浮动 WhatsApp + 微信** |
| ❌ 页脚无 QR | **P0：复用 `winter-tour.html#tour-contact` 完整联系区** |
| ❌ Hero `.route-cover-actions` | P1：「立即咨询」旁增加 WhatsApp 轮廓按钮 |
| P2 | 时间轴 Day 6 / Day 10 | 高光日卡片内嵌「咨询此段」WA 链 |

---

## 三、跨页统一建议（不改线路文案）

### 3.1 图片区优先级矩阵

| 优先级 | 动作 | 涉及页面 |
|--------|------|---------|
| **P0** | 填充已有占位图位 | `two-day-tours`（22）· `destinations`（15） |
| **P0** | 修正皇后镇误配图 | `destinations.html` |
| **P0** | 为每日行程增加图位并配图 | `winter-tour`（9）· `south-island-13-day`（13） |
| **P0** | 补 `south-island-13-day` 浮动 WhatsApp | 旗舰线联系转化 |
| P1 | 各线路页增加评价预览区 | 除首页外 4 页 |
| P1 | 各线路页增加精简 Peter 条 | 除首页外 4 页 |
| P1 | 页脚统一联系 QR 布局 | `two-day-tours` · `destinations` · `13-day` |
| P2 | 轮播/地图/摄影精选扩展 | `winter-tour` · `13-day` · `index` |

### 3.2 建议复用的现有组件（实现时参考，本文不改代码）

| 组件 | 源页面 / 文件 | 可复用于 |
|------|-------------|---------|
| `#reviews` + `reviews.js` | `index.html` | 全部线路页尾段 |
| `#peter` 精简版 | `index.html` | 线路 Hero 下 |
| `#tour-contact` | `winter-tour.html` | `two-day-tours` · `13-day` · `destinations` |
| `.float-contact` | `index.html` | **`south-island-13-day.html`（缺失）** |
| `.tt-thumbs` / `.day-card-photo` | `day-tours.html` / `three-day-tours.html` | `two-day-tours` · `winter-tour` |
| `.flagship-day-photo` | 新建，结构参考 `.story-spot-photo` | `south-island-13-day.html` |
| 图片资源 | `images/网页使用照片集/site/routes/` | 全站填空 |

### 3.3 WhatsApp 按钮统一策略

| 层级 | 位置 | 适用页面 |
|------|------|---------|
| L1 全局 | 右下角 `.float-contact` | **全部页面**（13 日需补） |
| L2 页脚 | QR 双卡 + 「打开 WhatsApp」 | 线路详情页 |
| L3 转化点 | 每条线路「获取报价 / 预约」旁 | `two-day-tours` · 各 `tt-card` |
| L4 Header | 海外访客可见的 WA 图标 | 可选全站 |

WhatsApp 链接统一：`https://wa.me/6421976868`

---

## 四、缺图与缺模块统计

### 4.1 图片缺口

| 页面 | 占位图 | 结构无图位 | 合计待补 |
|------|--------|-----------|---------|
| `index.html` | 0（1 证书回退） | 3 可选增强 | 低 |
| `destinations.html` | 15 + 1 误配 | 4 线路头 + CTA | **20** |
| `two-day-tours.html` | 22 | 3 区块 | **25** |
| `winter-tour.html` | 0 | 9 day-card + 4 轮播缺口 | **13+** |
| `south-island-13-day.html` | 0 | 13 timeline + 概览 | **14+** |

### 4.2 信任模块缺口

| 模块 | index | destinations | two-day | winter | 13-day |
|------|-------|-------------|---------|--------|--------|
| 客户评价区 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 团队介绍区 | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| 完整联系页脚 | ✅ | ❌ | ❌ | ✅ | ❌ |
| 浮动 WhatsApp | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 五、推荐实施顺序

1. **阶段 1 · 填图（不改文案）**  
   - `two-day-tours.html` 22 处占位 → 复用 `site/routes/`  
   - `destinations.html` 15 占位 + 皇后镇修正  
   - `winter-tour.html` / `13-day` 每日行程加图位并配图  

2. **阶段 2 · 联系转化**  
   - `south-island-13-day.html` 补 `.float-contact` + 页脚 QR  
   - 各线路 CTA 并列 WhatsApp  

3. **阶段 3 · 信任模块**  
   - 四页线路增加评价预览 + Peter 精简条  

4. **阶段 4 · 视觉增强**  
   - 路线地图 · 轮播扩展 · 摄影精选 masonry  

---

## 六、说明

- 本文档仅分析 HTML 结构与内容区块，**不修改任何线路文字、价格、天数描述**。  
- 图片建议优先使用已入库的 `site/routes/` 与 Desktop `NZ-Travel-photos` 库，避免重复拍摄需求。  
- 首页 `index.html` 为全站模板参考；其余页面向首页的 `#peter` · `#reviews` · `#contact` · `.float-contact` 对齐即可形成一致体验。
