# BanG Dream! GBP — Live Stage Archive

## 信息架构 (IA)

```
/                          Home — 全屏视觉、乐队墙、角色轮播
/bands                     Bands — 7 乐队总览
/bands/[slug]              Band Detail — 乐队主题、成员、代表曲、卡面画廊
/characters/[id]           Character — 立绘、资料、代表卡、完整卡册
```

## 页面布局

### Home
- Hero：渐变标题 + 频谱动画 + Three.js 粒子
- Character Carousel：12 位角色自动轮播
- Band Grid：7 乐队卡片入口
- Stats Strip：数据概览

### Band Detail
- 主题渐变背景 + 粒子 + 鼠标光晕
- 乐队介绍 / 关键词
- Members Grid（5 列）
- Signature Songs
- Card Collection（Masonry + Load More + Lightbox）

### Character Detail
- 立绘浮现动画 + 光晕
- Profile 面板
- Featured Cards（4-5★）
- Full Card Archive

## 视觉规范

| Token | Value |
|-------|-------|
| Background | `#050508` |
| Glass | `rgba(255,255,255,0.06)` + blur 24px |
| Display Font | Syne |
| Body Font | Noto Sans JP |
| Motion Easing | `cubic-bezier(0.22, 1, 0.36, 1)` |

### 乐队主题色
见 `src/lib/themes.ts`

## 组件清单

| 组件 | 职责 |
|------|------|
| `SiteHeader` | 玻璃态导航 |
| `SmoothScroll` | Lenis 平滑滚动 |
| `ParticleField` | Three.js 粒子背景 |
| `MouseGlow` | 鼠标跟随光效 |
| `SpectrumBars` | GSAP 频谱动画 |
| `CharacterCarousel` | 首页角色轮播 |
| `BandCard` | 乐队卡片 |
| `MemberCard` | 成员卡片 |
| `CharacterHero` | 角色立绘 Hero |
| `CardGallery` | Masonry + Flip + Lightbox |

## 目录结构

```
web/
├── public/assets/          → symlink ../Bandori
├── scripts/build-data.mjs  → 生成 site-data.json
├── src/
│   ├── app/                → Next.js App Router 页面
│   ├── components/         → UI 组件
│   ├── data/site-data.json → 角色/卡牌索引
│   └── lib/                → themes, data, utils
└── package.json
```

## 在浏览器中打开（推荐）

### 第一次使用
1. 确保已安装 [Node.js](https://nodejs.org/)
2. 在终端运行一次：`cd web && npm install`
3. **双击项目根目录的 `start-website.bat`**

脚本会自动构建静态网页并打开浏览器（http://localhost:3000）。

### 之后每次打开
双击 **`open-website.bat`** 即可（无需重新构建，秒开）。

### 构建产物
静态网页生成在 `web/out/` 文件夹，可用任意浏览器通过本地服务器访问。
不能直接双击 `index.html` 打开（浏览器安全限制），必须通过上述 bat 脚本或本地服务器。

## 开发模式（可选）

```bash
cd web
npm install
npm run dev
```

访问 http://localhost:3000
