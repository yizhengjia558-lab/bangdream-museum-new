@echo off
chcp 65001 >nul
title BanG Dream! - 公网临时分享
cd /d "%~dp0web"

where node >nul 2>&1
if errorlevel 1 (
  echo [错误] 未安装 Node.js
  pause
  exit /b 1
)

echo.
echo  ========================================
echo   BanG Dream! - 公网临时链接（Tunnel）
echo  ========================================
echo.
echo   此模式会生成一个临时公网链接，任何人可访问。
echo   首次使用可能需要下载 tunnel 工具，请稍候。
echo.

if not exist "out\index.html" (
  echo 正在构建网站...
  call npm run build:static
  if errorlevel 1 (
    echo 构建失败
    pause
    exit /b 1
  )
)

echo 正在启动本地服务器（后台）...
start "BanG Dream Server" /MIN cmd /c "cd /d "%~dp0web" && npx --yes serve out -l tcp://0.0.0.0:3000"

echo 等待服务器就绪...
timeout /t 3 /nobreak >nul

echo.
echo 正在创建公网隧道，请稍候...
echo 下方会出现类似 https://xxxx.loca.lt 的链接 — 复制发给他人即可。
echo.
echo  注意: 首次打开 loca.lt 链接时，可能需要在页面输入本机 IP 确认。
echo  关闭此窗口后，公网链接将失效。
echo.
echo  ========================================
echo.

npx --yes localtunnel --port 3000

echo.
echo 隧道已关闭。
pause
