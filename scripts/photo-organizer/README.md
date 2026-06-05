# AI Photo Organizer

自动整理 `NZ-Travel-photos/inbox` 中的照片到地区或主题文件夹。

## 三个素材库（互不合并）

| 目录 | 用途 |
|------|------|
| `NZ-Travel-photos/` | 原始素材库（本工具操作此目录） |
| `images/网页使用照片集/` | 网站发布用图（需手动挑选复制） |
| `images/` | 小红书营销素材 |

## 目录结构

```
NZ-Travel-photos/
  inbox/          ← 放入待整理照片
  unsorted/       ← 无法确定的照片
  akaroa/
  christchurch/
  kaikoura/
  mount-cook/
  queenstown/
  wanaka/
  lake-tekapo/
  milford-sound/
  车图集/
  客人合影/
  美食/
  星空/
  酒店民宿/
  _reports/       ← 分类报告 (JSON + Markdown)
```

## 安装依赖

```bash
python3 -m venv .venv-photo-organizer
source .venv-photo-organizer/bin/activate
pip install -r scripts/photo-organizer/requirements.txt
```

## 使用方法

```bash
# 1. 初始化文件夹
python3 scripts/photo-organizer/organize.py --init-dirs

# 2. 将照片放入 NZ-Travel-photos/inbox/

# 3. 预览（不移动文件）
python3 scripts/photo-organizer/organize.py --dry-run

# 4. 正式整理
python3 scripts/photo-organizer/organize.py

# 5. 视频整理（.mov / .mp4 / .m4v，关键帧 + 视觉识别）
bash scripts/organize-videos.sh
bash scripts/organize-videos.sh --sources inbox --dry-run
```

## 视频识别

支持 `.mov` `.mp4` `.m4v`：

1. 从每个视频均匀提取 5 个关键帧（imageio + ffmpeg）
2. 用与照片相同的视觉模型分析各帧
3. 取各分类最高分作为视频分类结果
4. 复制到对应文件夹，原视频保留
5. 报告：`_reports/video-report.md`

可识别分类：Christchurch、Lake Tekapo、Mount Cook、Kaikoura、Milford Sound、客人合影、奔驰商务车、美食、酒店民宿、星空。

## 分类优先级

1. **文件名** — 关键词匹配（如 `kaikoura`, `tekapo`, `奔驰`, `星空`）
2. **EXIF GPS** — 根据南岛地区坐标围栏判断
3. **AI 图像识别**
   - 若设置 `OPENAI_API_KEY`：使用 OpenAI Vision（模型默认 `gpt-4o-mini`，可用 `OPENAI_VISION_MODEL` 覆盖）
   - 否则：本地启发式分析（星空/美食/车辆/合影/部分风景）

置信度低于 **0.55** 或多个候选接近时 → 移入 `unsorted/`。

## 报告

每次运行后在 `NZ-Travel-photos/_reports/` 生成：

- `organize-YYYYMMDD-HHMMSS.json`
- `organize-YYYYMMDD-HHMMSS.md`

## 可选：启用 OpenAI Vision

```bash
export OPENAI_API_KEY="sk-..."
export OPENAI_VISION_MODEL="gpt-4o-mini"   # 可选
python3 scripts/photo-organizer/organize.py
```

## 备注

- 支持 JPG / PNG / WEBP / HEIC 等常见格式
- GPS 读取顺序：Pillow EXIF → exiftool → macOS mdls
- 不会修改或合并 `images/网页使用照片集` 与 `images/` 营销库
