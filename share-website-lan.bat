@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title BanG Dream! - 局域网分享
cd /d "%~dp0web"

where node >nul 2>&1
if errorlevel 1 (
  echo [错误] 未安装 Node.js，请先安装: https://nodejs.org/
  pause
  exit /b 1
)

echo.
echo  ========================================
echo   BanG Dream! - 局域网分享模式
echo  ========================================
echo.

if not exist "node_modules" (
  echo [1/4] 安装依赖...
  call npm install
  if errorlevel 1 goto :fail
) else (
  echo [1/4] 依赖已就绪
)

if not exist "public\assets" (
  echo [2/4] 链接图片资源...
  cmd /c mklink /J "public\assets" "..\Bandori" >nul 2>&1
) else (
  echo [2/4] 图片资源已就绪
)

echo [3/4] 构建静态网页...
call npm run build:static
if errorlevel 1 goto :fail

echo [4/4] 获取本机局域网 IP...
set "LAN_IP="
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.254\.' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1 -ExpandProperty IPAddress; if ($ip) { Write-Output $ip }"`) do set "LAN_IP=%%i"

echo.
echo  ========================================
echo   分享说明
echo  ========================================
echo.
echo   本机访问:   http://localhost:3000
if defined LAN_IP (
  echo   局域网访问: http://!LAN_IP!:3000
  echo.
  echo   请将「局域网访问」地址发给同一 WiFi / 同一网络下的朋友。
  echo   对方用手机或电脑浏览器打开即可。
) else (
  echo   未能自动检测局域网 IP，请在本机运行 ipconfig 查看 IPv4 地址。
  echo   分享格式: http://你的IP:3000
)
echo.
echo   注意:
echo   - 需保持此窗口开启，关闭即停止网站
echo   - 若他人无法打开，请在 Windows 防火墙中允许 Node.js / 端口 3000
echo   - 仅同一局域网可访问；公网分享请运行 share-website-public.bat
echo.
echo  ========================================
echo.

if defined LAN_IP (
  start "" "http://!LAN_IP!:3000"
) else (
  start "" "http://localhost:3000"
)

npx --yes serve out -l tcp://0.0.0.0:3000
goto :end

:fail
echo.
echo  启动失败，请将上方错误信息发给开发者
pause
exit /b 1

:end
pause
