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

## 项目结构

```
Bandori/          图片与 JSON 数据（约 1.8GB）
web/              Next.js 前端
collect_bandori.py  从 Bestdori 拉取资源
fix_all_standing.py 升级立绘分辨率
```
