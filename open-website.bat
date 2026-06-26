@echo off
chcp 65001 >nul
title BanG Dream! - 快速打开
cd /d "%~dp0web"

where node >nul 2>&1
if errorlevel 1 (
  echo [错误] 未检测到 Node.js，请先安装: https://nodejs.org/
  pause
  exit /b 1
)

if not exist "out\index.html" (
  echo 首次使用，正在构建网站...
  call "%~dp0start-website.bat"
  exit /b
)

echo [1/2] 更新构建...
call npm run build:static
if errorlevel 1 (
  echo 构建失败，请检查上方错误信息
  pause
  exit /b 1
)

echo.
echo [2/2] 启动网站...
echo  本机: http://localhost:3000
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.254\.' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1 -ExpandProperty IPAddress; if ($ip) { Write-Output $ip }"`) do (
  echo  局域网: http://%%i:3000
)
echo  关闭此窗口即可停止
echo.

start "" "http://localhost:3000"
npx --yes serve out -l tcp://0.0.0.0:3000
