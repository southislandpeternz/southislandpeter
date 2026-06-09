# 本地预览环境检查报告

> 检查时间：2026-06-09  
> **未修改任何网站代码或网页内容**

---

## 1. 问题原因

`localhost:8080` 此前显示**照片库目录**，是因为 `python3 -m http.server 8080` 从错误目录启动：

| 项目 | 值 |
|------|-----|
| **错误启动目录** | `/Users/yueshe/Documents/小红书AI/NZ-Travel-photos` |
| **原进程 PID** | `42556`（已停止） |
| **现象** | 浏览器打开 `http://localhost:8080/` 列出照片文件夹，而非旅行社网站首页 |

---

## 2. 网站项目根目录

| 项目 | 路径 |
|------|------|
| **正确网站根目录** | `/Users/yueshe/Documents/小红书AI` |
| **Git 仓库** | 是（天天旅行社静态站点项目根） |

---

## 3. 关键页面文件位置

| 文件 | 绝对路径 |
|------|---------|
| `index.html` | `/Users/yueshe/Documents/小红书AI/index.html` |
| `about-peter.html` | `/Users/yueshe/Documents/小红书AI/about-peter.html` |
| `south-island-13-day.html` | `/Users/yueshe/Documents/小红书AI/south-island-13-day.html` |

以上文件均位于**网站项目根目录**（非 `NZ-Travel-photos` 子目录）。

---

## 4. 已执行操作

1. ✅ 停止错误目录上的 http.server（PID `42556`）
2. ✅ 进入正确目录：`/Users/yueshe/Documents/小红书AI`
3. ✅ 重新启动：`python3 -m http.server 8080`
4. ✅ 验证：`http://127.0.0.1:8080/index.html` 返回 **HTTP 200**，内容为天天旅行社首页 HTML

| 项目 | 当前状态 |
|------|---------|
| **新进程 PID** | `44217` |
| **监听端口** | `8080` |
| **工作目录 cwd** | `/Users/yueshe/Documents/小红书AI` |

---

## 5. 正确预览网址

在浏览器中打开：

### 首页与 Stage 1 重点页

- http://127.0.0.1:8080/index.html
- http://127.0.0.1:8080/about-peter.html
- http://127.0.0.1:8080/south-island-13-day.html

（`localhost` 与 `127.0.0.1` 等价，亦可使用：）

- http://localhost:8080/index.html
- http://localhost:8080/about-peter.html
- http://localhost:8080/south-island-13-day.html

### 其他常用页面

- http://127.0.0.1:8080/routes.html — 精品线路索引
- http://127.0.0.1:8080/destinations.html — 南岛故事地图
- http://127.0.0.1:8080/two-day-tours.html — 两日游
- http://127.0.0.1:8080/winter-tour.html — 8 日游
- http://127.0.0.1:8080/customer-reviews.html — 客人评价
- http://127.0.0.1:8080/gallery/index.html — 摄影旅拍

### 根路径说明

- http://127.0.0.1:8080/ → 自动显示 `index.html`（网站首页）
- 勿在 `NZ-Travel-photos` 目录下启动 8080，否则会再次看到照片库列表

---

## 6. 如何自行重启（备忘）

```bash
# 停止占用 8080 的进程（如有）
lsof -ti :8080 | xargs kill

# 在网站根目录启动
cd "/Users/yueshe/Documents/小红书AI"
python3 -m http.server 8080
```

---

## 7. 备注

- 项目内另有端口 **8765** 的历史 server（cwd 已为正确目录），与本次 **8080** 无关。
- 评价、摄影等 JS 模块需通过 HTTP 访问；`file://` 直接打开 HTML 可能导致数据加载失败。
