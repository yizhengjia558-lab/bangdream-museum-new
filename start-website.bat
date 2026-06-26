@echo off
chcp 65001 >nul
title BanG Dream! - 打开网站
cd /d "%~dp0web"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo  [错误] 未安装 Node.js
  echo  请前往 https://nodejs.org/ 下载安装后重试
  echo.
  pause
  exit /b 1
)

echo.
echo  ========================================
echo   BanG Dream! Girls Band Party!
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
  if errorlevel 1 (
    echo 警告: 资源链接失败，请确认 Bandori 文件夹存在
  )
) else (
  echo [2/4] 图片资源已就绪
)

echo [3/4] 构建静态网页...
call npm run build:static
if errorlevel 1 goto :fail

echo.
echo [4/4] 启动服务器并打开浏览器...
echo.
echo   本机地址: http://localhost:3000
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.254\.' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1 -ExpandProperty IPAddress; if ($ip) { Write-Output $ip }"`) do (
  echo   局域网分享: http://%%i:3000  ^(同一 WiFi 下的其他设备^)
)
echo   如需详细分享说明，请运行 share-website-lan.bat
echo   关闭此窗口 = 停止网站
echo.

start "" "http://localhost:3000"
npx --yes serve out -l tcp://0.0.0.0:3000
goto :end

:fail
echo.
echo  配置失败，请将上方错误信息发给开发者
pause
exit /b 1

:end
pause
