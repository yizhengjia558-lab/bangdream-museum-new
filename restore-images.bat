@echo off
chcp 65001 >nul
title BanG Dream! - 恢复原始图片分辨率
cd /d "%~dp0"

echo.
echo  ========================================
echo   从 Bestdori 重新下载原图（覆盖压缩版）
echo  ========================================
echo.
echo   压缩前的本地备份不存在，将从官方源重新拉取。
echo   约 3700 张图，可能需要 1~3 小时，请勿关闭窗口。
echo.

where python >nul 2>&1
if errorlevel 1 (
  echo [错误] 未安装 Python
  pause
  exit /b 1
)

python -c "import httpx; import bestdori" 2>nul
if errorlevel 1 (
  echo 安装依赖...
  pip install -r requirements.txt
)

if not exist "web\public\assets" (
  cmd /c mklink /J "web\public\assets" "Bandori" >nul 2>&1
)

echo [1/2] 重新下载原图...
python collect_bandori.py --force
if errorlevel 1 (
  echo [错误] 下载失败
  pause
  exit /b 1
)

if exist "compress_manifest.json" del "compress_manifest.json"

echo.
echo [2/2] 重建网站...
cd web
call npm run build:static
if errorlevel 1 (
  echo [错误] 构建失败
  pause
  exit /b 1
)

echo.
echo  ========================================
echo   完成！本地预览:
echo   cd web ^&^& npm run preview
echo   或运行 start-website.bat
echo.
echo   若要更新 GitHub 网站，请 git add / commit / push
echo   注意: 原图约 1.8GB，GitHub Pages 上限 1GB
echo  ========================================
echo.
pause
