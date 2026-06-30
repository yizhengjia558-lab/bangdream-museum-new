# BanG Dream! 角色图鉴 / Digital Museum

BanG Dream! Girls Band Party! 静态角色与卡牌图鉴站点（Next.js 静态导出）。

## 本地运行

```bat
start-website.bat
```

浏览器打开 http://localhost:3000

首次运行若缺少图片，执行：

```bat
pip install -r requirements.txt
python collect_bandori.py
```

## 部署

| 方式 | 脚本 | 说明 |
|------|------|------|
| GitHub Pages | `deploy-github.bat` | 海外访问；仓库需开启 Pages → GitHub Actions |
| 阿里云 OSS | `deploy-aliyun.bat` | 国内访问；复制 `.aliyun.env.example` 为 `.aliyun.env` 并填写密钥 |
| Cloudflare Pages | `deploy-cloudflare.bat` | 需 `wrangler login` |

## GitHub Pages 配置

1. 在 GitHub 创建**空仓库**（不要勾选 README）
2. 运行 `deploy-github.bat`，按提示输入用户名与仓库名
3. 仓库 **Settings → Pages → Source** 选择 **GitHub Actions**
4. 推送后等待 Actions 中 **Deploy GitHub Pages** 完成

网站地址：`https://yizhengjia558-lab.github.io/bangdream-museum-new/`

> 当前仓库：`yizhengjia558-lab/bangdream-museum-new`  
> 图片资源约 1.8GB，GitHub Pages 产物有体积上限；若 Actions 部署失败，请改用阿里云 OSS。

## 卡面自动更新

Bushiroad 官网（bang-dream.com）**没有公开的卡面下载 API**，无法直接「连接官网」。

本项目通过 **[Bestdori](https://bestdori.com/)** 同步游戏内资源——日服出新卡后，Bestdori 通常会在短时间内更新，与本站数据源一致。

| 方式 | 命令 | 说明 |
|------|------|------|
| 本地一键同步 | `update-cards.bat` | 只下载缺失的新卡面，可选自动 push |
| 手动同步 | `python sync_cards.py` | 同上，不推送 |
| GitHub 自动 | Actions → **Sync new cards** | 每天北京时间 20:00 检查；也可手动 Run workflow |

同步完成后 push 到 GitHub，`Deploy GitHub Pages` 会自动重新部署网站。

## 访客统计（可选）

GitHub Pages 是纯静态站点，访客计数通过 **Cloudflare Worker**（免费）实现。

### 一键部署（推荐）

1. 注册 [Cloudflare](https://dash.cloudflare.com/)（免费）
2. 在项目根目录双击运行 **`scripts\deploy-analytics.bat`**
3. 按提示在浏览器完成 Cloudflare 登录
4. 脚本会自动创建 KV、部署 Worker，并写入 `web/public/visitor-api.json`
5. 提交并 push 后，GitHub Actions 会重新部署网站

部署完成后：
- **页脚**显示「累计访问 · 今日访问」
- **顶栏**（桌面端）显示累计访客数，点击可进入统计页
- 访问 **`/stats/`** 查看详细统计

### 手动部署

```bat
cd web\analytics-worker
npx wrangler login
npx wrangler kv namespace create STATS
:: 将输出的 id 填入 wrangler.toml
npm run deploy
```

然后将 Worker 地址写入 `web/public/visitor-api.json`：

```json
{ "api": "https://bangdream-museum-analytics.你的账号.workers.dev" }
```

### GitHub Actions 自动部署 Worker（可选）

在仓库 Settings → Secrets 添加：
- `CLOUDFLARE_API_TOKEN` — [创建 API Token](https://dash.cloudflare.com/profile/api-tokens)（权限：Workers KV + Workers Scripts）
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare 控制台右侧 Account ID

然后在 Actions 中手动运行 **Deploy Analytics Worker** workflow。

### 管理员视图（可选）

在 Cloudflare Worker 环境变量中设置 `STATS_SECRET`，访问 `/stats/` 输入密钥后可查看 30 日趋势与热门页面。

> 若需包含 MyGO / Ave Mujica 等新乐队，需修改 `collect_bandori.py` 中的 `TARGET_BANDS`。

## 项目结构

```
Bandori/          图片与 JSON 数据（约 1.8GB）
web/              Next.js 前端
collect_bandori.py  从 Bestdori 拉取资源
fix_all_standing.py 升级立绘分辨率
```
