@echo off
chcp 65001 >nul
title BanG Dream! - Cloudflare 长期部署
cd /d "%~dp0web"

where node >nul 2>&1
if errorlevel 1 (
  echo [错误] 未安装 Node.js
  pause
  exit /b 1
)

echo.
echo  ========================================
echo   BanG Dream! - Cloudflare Pages 部署
echo  ========================================
echo.
echo   首次使用需登录 Cloudflare（免费账号即可）:
echo   浏览器会弹出授权页面，按提示完成登录。
echo.

if not exist "public\assets" (
  echo 链接图片资源...
  cmd /c mklink /J "public\assets" "..\Bandori" >nul 2>&1
)

echo [1/3] 构建静态网站...
call npm run build:static
if errorlevel 1 goto :fail

echo.
echo [2/3] 检查 Cloudflare 登录状态...
call npx --yes wrangler whoami
if errorlevel 1 (
  echo.
  echo 需要登录 Cloudflare，即将打开浏览器...
  call npx --yes wrangler login
  if errorlevel 1 goto :fail
)

echo.
echo [3/3] 上传到 Cloudflare Pages...
call npx --yes wrangler pages deploy out --project-name=bangdream-museum --branch=main
if errorlevel 1 goto :fail

echo.
echo  ========================================
echo   部署成功！
echo   请在上方输出中找到 *.pages.dev 链接
echo   即为长期公网访问地址
echo  ========================================
echo.
pause
goto :end

:fail
echo.
echo  部署失败。常见问题:
echo  - 未登录 Cloudflare: 重新运行并按提示 wrangler login
echo  - 网络问题: 检查代理/VPN
echo  - 体积过大: 先运行 compress_assets.py 压缩图片
pause
exit /b 1

:end
