# 精品线路照片替换方案

> 基于 `route-photo-mapping-report.md` 与本地照片库扫描生成
> 扫描目录：`images/网页使用照片集/`、`images/`、`NZ-Travel-photos/`、`gallery/`（manifest）、`optimized-images/`
> 说明：`assets/images/` 与 `photos/` 目录为空或不存在；本方案仅作匹配建议，**未修改任何代码或图片**。

---

## 照片库概况（按地点）

| 地点 | 可用照片数 | 主要来源 | 覆盖评价 |
|------|-----------|----------|----------|
| Christchurch | 26 | site/christchurch1–5、gallery/christchurch | ✅ 充足 |
| Akaroa | 9 | gallery/akaroa、photography-showcase/themes/akaroa、featured-11 | ✅ 充足 |
| Kaikoura | 49 | site/kaikoura1–10、kajkoura-whale-watch、coastal 主题 | ✅ 充足 |
| Lake Tekapo | 13 | tekapo-stargazing、featured-01/08/12、lakes 主题、xiaohongshu | ✅ 充足 |
| Mt Cook | 37 | hero.jpg、mt-cook1、hooker-valley、mountains 主题、xiaohongshu | ✅ 充足 |
| Wanaka | 3 | gallery/wanaka、featured-03 | ⚠️ 偏少 |
| Queenstown | 3 | gallery/queenstown、featured-05、lakes-06 | ⚠️ 偏少 |
| Arrowtown | 0 | — | ❌ 无匹配 |
| Milford Sound | 3 | gallery/milford-sound、featured-04/09、fjord 主题 | ⚠️ 偏少 |
| Dunedin | 0 | — | ❌ 无匹配 |
| Hanmer Springs | 3 | gallery/hanmer-springs（仅 1 张） | ⚠️ 偏少 |
| Castle Hill | 0 | — | ❌ 无匹配 |
| West Coast | 3 | gallery/west-coast、coastal-04（缺细分景点） | ⚠️ 偏少 |
| Oamaru | 3 | gallery/oamaru（仅 1 张） | ⚠️ 偏少 |
| Moeraki | 0 | —（页面占位，无文件） | ❌ 无匹配 |

---

## 1. 每条线路需要的照片

### 一日游

#### 一日游页面 Hero

| 位置 | 主题地点 | 推荐照片 | 备选 | 状态 |
|------|----------|----------|------|------|
| Hero主图 | Christchurch + 南岛全景 | `images/网页使用照片集/photography-showcase/hero.jpg` (库克山全景，全站最高分) | `images/网页使用照片集/site/christchurch5.jpg` · `images/网页使用照片集/site/tekapo-stargazing.JPG` | 📋 可匹配 |

#### 阿卡罗阿法国小镇一日游

| 位置 | 主题地点 | 推荐照片 | 备选 | 状态 |
|------|----------|----------|------|------|
| 封面图 | Akaroa | `images/网页使用照片集/photography-showcase/featured/featured-11.jpg` (阿卡罗阿港湾高分精选) | `images/网页使用照片集/gallery/akaroa/seed-1.jpg` | 📋 可匹配 |
| 摄影作品1 | Akaroa | `images/网页使用照片集/photography-showcase/themes/akaroa/akaroa-01.jpg` | — | 📋 可匹配 |
| 摄影作品2 | Akaroa | `images/网页使用照片集/photography-showcase/themes/akaroa/akaroa-02.jpg` | — | 📋 可匹配 |
| 摄影作品3 | Akaroa | `images/网页使用照片集/photography-showcase/themes/akaroa/akaroa-03.jpg` | — | 📋 可匹配 |

#### 凯库拉观鲸一日游

| 位置 | 主题地点 | 推荐照片 | 备选 | 状态 |
|------|----------|----------|------|------|
| 封面图 | Kaikoura | `images/网页使用照片集/site/kaikoura6.jpg` (观鲸主题，已在8日游使用) | `images/网页使用照片集/photography-showcase/featured/featured-10.jpg` | 📋 可匹配 |
| 摄影作品1 | Kaikoura | `images/网页使用照片集/site/kajkoura-whale-watch.jpg` (文件名直指观鲸) | — | 📋 可匹配 |
| 摄影作品2 | Kaikoura | `images/网页使用照片集/photography-showcase/themes/coastal/coastal-02.jpg` (凯库拉海岸) | `images/网页使用照片集/site/kaikoura2.jpg` | 📋 可匹配 |
| 摄影作品3 | Kaikoura | `images/网页使用照片集/site/kaikoura4.jpg` | `images/网页使用照片集/site/kaikoura8.jpg` | 📋 可匹配 |

#### 汉默温泉一日游

| 位置 | 主题地点 | 推荐照片 | 备选 | 状态 |
|------|----------|----------|------|------|
| 封面图 | Hanmer Springs | `images/网页使用照片集/gallery/hanmer-springs/seed-1.jpg` (库内唯一汉默照片) | — | 📋 可匹配 |
| 摄影作品1 | Hanmer Springs | — | 无第二张汉默/温泉题材照片，需新拍或从 inbox 补充 | ❌ 缺图 |
| 摄影作品2 | Hanmer Springs | — | 缺森林步道题材 | ❌ 缺图 |
| 摄影作品3 | Hanmer Springs | — | 缺露天温泉细节 | ❌ 缺图 |

#### 城堡山亚瑟山口一日游

| 位置 | 主题地点 | 推荐照片 | 备选 | 状态 |
|------|----------|----------|------|------|
| 封面图 | Castle Hill | — | 库内无 Castle Hill / Arthur's Pass 命名照片；hooker-valley 属于库克山 | ❌ 缺图 |
| 摄影作品1 | Castle Hill | — | 缺巨石奇景 | ❌ 缺图 |
| 摄影作品2 | Castle Hill | — | 缺高山公路 | ❌ 缺图 |
| 摄影作品3 | Castle Hill | — | 缺徒步轻探险 | ❌ 缺图 |

### 三日游

#### 三日游页面 Hero

| 位置 | 主题地点 | 推荐照片 | 备选 | 状态 |
|------|----------|----------|------|------|
| Hero主图 | Lake Tekapo + Mt Cook | `images/网页使用照片集/site/tekapo-stargazing.JPG` (星空+特卡波，契合三日游主题) | `images/网页使用照片集/photography-showcase/featured/featured-01.jpg` | 📋 可匹配 |

#### 东海岸观鲸温泉三日漫旅行

| 位置 | 主题地点 | 推荐照片 | 备选 | 状态 |
|------|----------|----------|------|------|
| 封面图 | Kaikoura | `images/网页使用照片集/photography-showcase/featured/featured-10.jpg` | — | 📋 可匹配 |
| 摄影作品1 (Day1) | Kaikoura | `images/网页使用照片集/site/kaikoura6.jpg` | — | 📋 可匹配 |
| 摄影作品2 (Day1) | Kaikoura | `images/网页使用照片集/photography-showcase/themes/coastal/coastal-03.jpg` | — | 📋 可匹配 |
| 摄影作品3 (Day1) | Kaikoura | `images/网页使用照片集/site/kaikoura7.jpg` | — | 📋 可匹配 |
| 摄影作品4 (Day2) | Kaikoura | `images/网页使用照片集/site/kajkoura-whale-watch.jpg` | — | 📋 可匹配 |
| 摄影作品5 (Day2) | Hanmer Springs | `images/网页使用照片集/gallery/hanmer-springs/seed-1.jpg` | — | 📋 可匹配 |
| 摄影作品6 (Day2) | Hanmer Springs | — | 缺温泉/森林第二视角 | ❌ 缺图 |
| 摄影作品7 (Day3) | Hanmer Springs | — | 缺晨间森林步道 | ❌ 缺图 |
| 摄影作品8 (Day3) | Christchurch | `images/网页使用照片集/site/christchurch3.jpg` (返程基督城) | — | 📋 可匹配 |
| 摄影作品9 (Day3) | Christchurch | `images/网页使用照片集/gallery/christchurch/seed-2.jpg` | — | 📋 可匹配 |

#### 雪山星空三日漫旅行

| 位置 | 主题地点 | 推荐照片 | 备选 | 状态 |
|------|----------|----------|------|------|
| 封面图 | Lake Tekapo | `images/网页使用照片集/photography-showcase/featured/featured-01.jpg` (特卡波星空) | — | 📋 可匹配 |
| 摄影作品1 (Day1 Tekapo) | Lake Tekapo | `images/网页使用照片集/site/tekapo-stargazing.JPG` | — | 📋 可匹配 |
| 摄影作品2 | Lake Tekapo | `images/网页使用照片集/photography-showcase/featured/featured-08.jpg` | — | 📋 可匹配 |
| 摄影作品3 | Lake Tekapo | `images/网页使用照片集/photography-showcase/themes/lakes/lakes-01.jpg` | — | 📋 可匹配 |
| 摄影作品4 | Lake Tekapo | `images/网页使用照片集/xiaohongshu-showcase/tekapo-stars-1.jpg` | — | 📋 可匹配 |
| 摄影作品5 (Day2 Cook) | Mt Cook | `images/网页使用照片集/photography-showcase/featured/featured-07.jpg` | — | 📋 可匹配 |
| 摄影作品6 | Mt Cook | `images/网页使用照片集/site/mt-cook1.JPG` | — | 📋 可匹配 |
| 摄影作品7 | Mt Cook | `images/网页使用照片集/site/hooker-valley-track.JPG` | — | 📋 可匹配 |
| 摄影作品8 | Mt Cook | `images/网页使用照片集/photography-showcase/themes/mountains/mountains-01.jpg` | — | 📋 可匹配 |
| 摄影作品9 | Mt Cook | `images/网页使用照片集/xiaohongshu-showcase/mount-cook-4.jpg` | — | 📋 可匹配 |
| 摄影作品10 | Mt Cook | `images/网页使用照片集/site/tasman-glacier-track.JPG` | — | 📋 可匹配 |
| 摄影作品11 (Day3 返程) | Lake Tekapo | `images/网页使用照片集/xiaohongshu-showcase/lake-pukaki-4.jpg` (普卡基湖返程) | — | 📋 可匹配 |
| 摄影作品12 | Christchurch | `images/网页使用照片集/site/christchurch4.jpg` | — | 📋 可匹配 |
| 摄影作品13 | Christchurch | `images/网页使用照片集/gallery/christchurch/seed-1.jpg` | — | 📋 可匹配 |
| 摄影作品14 | Christchurch | `images/网页使用照片集/site/christchurch2.jpg` | — | 📋 可匹配 |

#### 西海岸冰川三日漫旅行

| 位置 | 主题地点 | 推荐照片 | 备选 | 状态 |
|------|----------|----------|------|------|
| 封面图 | West Coast | `images/网页使用照片集/photography-showcase/themes/coastal/coastal-04.jpg` (西海岸冰川海岸) | `images/网页使用照片集/gallery/west-coast/seed-1.jpg` | 📋 可匹配 |
| 摄影作品1 城堡山 | Castle Hill | — | 无城堡山照片 | ❌ 缺图 |
| 摄影作品2 霍基蒂卡 | West Coast | `images/网页使用照片集/gallery/west-coast/seed-1.jpg` (勉强代西海岸) | — | 📋 可匹配 |
| 摄影作品3 千层岩 | West Coast | — | 无 Punakaiki 千层岩照片 | ❌ 缺图 |
| 摄影作品4 约瑟夫冰川 | West Coast | `images/网页使用照片集/photography-showcase/themes/coastal/coastal-04.jpg` | — | 📋 可匹配 |
| 摄影作品5 福克斯冰川 | West Coast | — | 无 Fox/Franz 冰川特写 | ❌ 缺图 |
| 摄影作品6 马瑟森湖 | West Coast | — | 无 Lake Matheson 照片 | ❌ 缺图 |

#### 古城企鹅三日漫旅行

| 位置 | 主题地点 | 推荐照片 | 备选 | 状态 |
|------|----------|----------|------|------|
| 封面图 | Oamaru | `images/网页使用照片集/gallery/oamaru/seed-1.jpg` (白石古城) | — | 📋 可匹配 |
| 摄影作品1 奥马鲁 | Oamaru | `images/网页使用照片集/gallery/oamaru/seed-1.jpg` | — | 📋 可匹配 |
| 摄影作品2 摩拉基大圆石 | Moeraki | — | gallery/moeraki-boulders 页面存在但无图片文件 | ❌ 缺图 |
| 摄影作品3 但尼丁 | Dunedin | — | 库内零但尼丁照片 | ❌ 缺图 |
| 摄影作品4 拉纳克城堡 | Dunedin | — | 库内零拉纳克城堡照片 | ❌ 缺图 |
| 摄影作品5 蓝企鹅归巢 | Oamaru | — | 库内零企鹅/野生动物照片 | ❌ 缺图 |

### 八日游

#### 南岛8日经典慢旅行（9天8晚）

| 位置 | 主题地点 | 推荐照片 | 备选 | 状态 |
|------|----------|----------|------|------|
| 轮播图·凯库拉观鲸 | Kaikoura | kaikoura6.jpg | — | ✅ 已配置 |
| 轮播图·特卡波星空 | Lake Tekapo | `images/网页使用照片集/site/tekapo-stargazing.JPG` (推荐替换占位图) | `images/网页使用照片集/photography-showcase/featured/featured-01.jpg` | 📋 可匹配 |
| 轮播图·库克山 | Mt Cook | `images/网页使用照片集/photography-showcase/hero.jpg` (全站最高分库克山) | `images/网页使用照片集/photography-showcase/featured/featured-07.jpg` | 📋 可匹配 |
| 轮播图·皇后镇 | Queenstown | `images/网页使用照片集/photography-showcase/featured/featured-05.jpg` (应替换当前误用的 kaikoura3.jpg) | `images/网页使用照片集/gallery/queenstown/seed-1.jpg` | 📋 可匹配 |

### 十二至十三日游

#### 南岛慢旅行13天12晚

| 位置 | 主题地点 | 推荐照片 | 备选 | 状态 |
|------|----------|----------|------|------|
| Hero主图 | 南岛环线综合 | `images/网页使用照片集/photography-showcase/featured/featured-04.jpg` (米尔福德峡湾旗舰感) | `images/网页使用照片集/photography-showcase/hero.jpg` · `images/网页使用照片集/site/christchurch4.jpg` | 📋 可匹配 |

---

## 2. Hero / 封面最佳推荐

宽屏 Hero 与线路封面优先选用：**横向构图、主体清晰、地点可识别、摄影评分高**。

| 用途 | 推荐首选 | 路径 | 理由 |
|------|----------|------|------|
| 精品线路索引 Hero | `christchurch4.jpg` | `images/网页使用照片集/site/christchurch4.jpg` | ✅ 已用；基督城天际/花园城市 |
| 一日游页面 Hero | `hero.jpg` | `images/网页使用照片集/photography-showcase/hero.jpg` | 库克山全景，showcase 最高分 |
| 三日游页面 Hero | `tekapo-stargazing.JPG` | `images/网页使用照片集/site/tekapo-stargazing.JPG` | 星空+特卡波，契合雪山星空主题 |
| 阿卡罗阿一日游封面 | `featured-11.jpg` | `images/网页使用照片集/photography-showcase/featured/featured-11.jpg` | 阿卡罗阿港湾精选 |
| 凯库拉一日游封面 | `featured-10.jpg` | `images/网页使用照片集/photography-showcase/featured/featured-10.jpg` | 观鲸主题明确 |
| 汉默温泉一日游封面 | `hanmer seed-1` | `images/网页使用照片集/gallery/hanmer-springs/seed-1.jpg` | 库内唯一汉默图 |
| 城堡山一日游封面 | `—` | `—` | ❌ 需新拍 Castle Hill 巨石 |
| 东海岸三日游封面 | `featured-10.jpg` | `images/网页使用照片集/photography-showcase/featured/featured-10.jpg` | 凯库拉观鲸 |
| 雪山星空三日游封面 | `featured-01.jpg` | `images/网页使用照片集/photography-showcase/featured/featured-01.jpg` | 特卡波星空 |
| 西海岸冰川三日封面 | `coastal-04.jpg` | `images/网页使用照片集/photography-showcase/themes/coastal/coastal-04.jpg` | 西海岸冰川海岸 |
| 古城企鹅三日封面 | `oamaru seed-1` | `images/网页使用照片集/gallery/oamaru/seed-1.jpg` | 白石古城 |
| 8日游·特卡波轮播 | `tekapo-stargazing.JPG` | `images/网页使用照片集/site/tekapo-stargazing.JPG` | 替换占位图 |
| 8日游·库克山轮播 | `hero.jpg` | `images/网页使用照片集/photography-showcase/hero.jpg` | 最高分库克山 |
| 8日游·皇后镇轮播 | `featured-05.jpg` | `images/网页使用照片集/photography-showcase/featured/featured-05.jpg` | 替换误用 kaikoura3 |
| 13日游 Hero | `featured-04.jpg` | `images/网页使用照片集/photography-showcase/featured/featured-04.jpg` | 米尔福德峡湾旗舰感 |

### Showcase 评分 Top 5（全库 Hero 候选）

- **全局最高分 Hero** — `images/网页使用照片集/photography-showcase/hero.jpg` — 新西兰南岛 · 库克山 · mount cook blue lake new zealand 06（score 1700）
- **Featured #07** — `images/网页使用照片集/photography-showcase/featured/featured-07.jpg` — 新西兰南岛 · 库克山 · mount cook blue lake new zealand 07（score 1660）
- **Featured #03** — `images/网页使用照片集/photography-showcase/featured/featured-03.jpg` — 新西兰南岛 · 箭镇 · wanaka blue lake new zealand 03（score 1602）
- **Featured #06** — `images/网页使用照片集/photography-showcase/featured/featured-06.jpg` — 新西兰南岛 · 凯库拉 · akaroa blue lake new zealand 02（score 1524）
- **Featured #12** — `images/网页使用照片集/photography-showcase/featured/featured-12.jpg` — 新西兰南岛 · 普卡基湖 · lake tekapo blue lake new zealand 01（score 1311）

---

## 3. 摄影展示位推荐（缩略图 / 三图组）

摄影展示位适合：**细节丰富、竖横均可、与当日行程地点一致、三张互不重复**。

**Kaikoura 观鲸组**
- `kajkoura-whale-watch.jpg`
- `kaikoura6.jpg`
- `coastal-02.jpg`
- `coastal-03.jpg`
- `kaikoura2.jpg`

**Akaroa 港湾组**
- `akaroa-01.jpg`
- `akaroa-02.jpg`
- `akaroa-03.jpg`
- `featured-11.jpg`

**Lake Tekapo 星空组**
- `tekapo-stargazing.JPG`
- `featured-01.jpg`
- `featured-08.jpg`
- `lakes-01.jpg`
- `tekapo-stars-1.jpg`

**Mt Cook 雪山组**
- `hero.jpg`
- `featured-07.jpg`
- `mt-cook1.JPG`
- `hooker-valley-track.JPG`
- `mount-cook-4.jpg`
- `tasman-glacier-track.JPG`

**Queenstown 湖景组**
- `featured-05.jpg`
- `queenstown/seed-1.jpg`
- `lakes-06.jpg`

**Wanaka 湖景组**
- `wanaka/seed-1.JPG`
- `featured-03.jpg`

**Milford 峡湾组**
- `featured-04.jpg`
- `featured-09.jpg`
- `fjord-01.jpg`
- `milford-sound/seed-1.JPG`

**Christchurch 城市组**
- `christchurch1.jpg`
- `christchurch2.jpg`
- `christchurch3.jpg`
- `gallery/christchurch/seed-1.jpg`

---

## 4. 仍缺照片的位置

共 **17** 个图位在现有库中**无法找到地点匹配的真实照片**（另有 2 处已配置但地点有误需修正）。

### 按缺口严重程度

| 严重程度 | 线路/位置 | 缺失题材 |
|----------|-----------|----------|
| 🔴 高 | 汉默温泉一日游 · 摄影作品1 | 无第二张汉默/温泉题材照片，需新拍或从 inbox 补充 |
| 🟡 中 | 汉默温泉一日游 · 摄影作品2 | 缺森林步道题材 |
| 🟡 中 | 汉默温泉一日游 · 摄影作品3 | 缺露天温泉细节 |
| 🔴 高 | 城堡山亚瑟山口一日游 · 封面图 | 库内无 Castle Hill / Arthur's Pass 命名照片；hooker-valley 属于库克山 |
| 🟡 中 | 城堡山亚瑟山口一日游 · 摄影作品1 | 缺巨石奇景 |
| 🟡 中 | 城堡山亚瑟山口一日游 · 摄影作品2 | 缺高山公路 |
| 🟡 中 | 城堡山亚瑟山口一日游 · 摄影作品3 | 缺徒步轻探险 |
| 🟡 中 | 东海岸观鲸温泉三日漫旅行 · 摄影作品6 (Day2) | 缺温泉/森林第二视角 |
| 🟡 中 | 东海岸观鲸温泉三日漫旅行 · 摄影作品7 (Day3) | 缺晨间森林步道 |
| 🔴 高 | 西海岸冰川三日漫旅行 · 摄影作品1 城堡山 | 无城堡山照片 |
| 🔴 高 | 西海岸冰川三日漫旅行 · 摄影作品3 千层岩 | 无 Punakaiki 千层岩照片 |
| 🔴 高 | 西海岸冰川三日漫旅行 · 摄影作品5 福克斯冰川 | 无 Fox/Franz 冰川特写 |
| 🔴 高 | 西海岸冰川三日漫旅行 · 摄影作品6 马瑟森湖 | 无 Lake Matheson 照片 |
| 🔴 高 | 古城企鹅三日漫旅行 · 摄影作品2 摩拉基大圆石 | gallery/moeraki-boulders 页面存在但无图片文件 |
| 🔴 高 | 古城企鹅三日漫旅行 · 摄影作品3 但尼丁 | 库内零但尼丁照片 |
| 🔴 高 | 古城企鹅三日漫旅行 · 摄影作品4 拉纳克城堡 | 库内零拉纳克城堡照片 |
| 🔴 高 | 古城企鹅三日漫旅行 · 摄影作品5 蓝企鹅归巢 | 库内零企鹅/野生动物照片 |
| 🟡 中 | 南岛8日经典慢旅行（9天8晚） · 轮播图·皇后镇 | 已配置 kaikoura3.jpg 但 alt 为皇后镇，建议换 featured-05 |

### 需优先补拍 / 入库的地点

1. **Castle Hill / Arthur's Pass** — 城堡山一日游、西海岸三日（城堡山位）完全无图
2. **Dunedin / Larnach Castle** — 古城企鹅三日 2 个图位
3. **Moeraki Boulders** — 古城企鹅三日 1 个图位
4. **蓝企鹅归巢** — 古城企鹅三日 1 个图位
5. **Hanmer Springs** — 仅 1 张，汉默一日游需补 3 张、东海岸三日需补 2 张
6. **West Coast 细分** — Punakaiki 千层岩、Franz/Fox 冰川、Lake Matheson 各缺 1 张
7. **Arrowtown** — 8日游 Day7 提及箭镇，库内无独立照片（featured-03 实为 Wanaka）

### 统计汇总

| 指标 | 数量 |
|------|------|
| Routes 图位总数 | 62 |
| 现有库可直接匹配 | 42 |
| 已配置（含 1 处误配） | 2 |
| 库内无匹配、需补图 | 17 |

---

## 5. 实施建议（不改代码，仅操作指引）

1. **优先复制到 `images/网页使用照片集/site/`** — Routes 页面当前引用 site 路径；可从 showcase/gallery 复制并重命名（如 `tekapo-hero.jpg`）。
2. **8日游皇后镇轮播** — 将 `kaikoura3.jpg` 换为 `featured-05.jpg` 或 `gallery/queenstown/seed-1.jpg`。
3. **补图顺序** — Castle Hill → Dunedin/Moeraki/Penguins → Hanmer 扩充 → West Coast 细分。
4. **NZ-Travel-photos/inbox** — 未分类新片可先入 inbox，按地点归类后再纳入上述方案。
