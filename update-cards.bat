@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title BanG Dream! - 同步新卡面
cd /d "%~dp0"

where python >nul 2>&1
if errorlevel 1 (
  echo [错误] 未安装 Python
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo [错误] 未安装 Node.js
  pause
  exit /b 1
)

echo.
echo  ========================================
echo   同步新卡面（Bestdori 游戏资源镜像）
echo  ========================================
echo.
echo   Bushiroad 官网无公开 API，本脚本从 Bestdori
echo   拉取日服更新后的新卡面（与游戏内资源一致）
echo.

python sync_cards.py
if errorlevel 1 (
  echo.
  echo [错误] 同步失败
  pause
  exit /b 1
)

echo.
set /p PUSH=是否推送到 GitHub 并自动部署？(y/N): 
if /i not "%PUSH%"=="y" (
  echo 已完成本地同步。稍后可手动 git add / commit / push
  pause
  exit /b 0
)

git add Bandori web/src/data/site-data.json sync_last_run.json
git diff --cached --quiet
if errorlevel 1 (
  git -c user.name="yizhengjia558-lab" -c user.email="yizhengjia558-lab@users.noreply.github.com" commit -m "Auto-sync: update cards from Bestdori"
  git push origin main
  if errorlevel 1 (
    echo [错误] 推送失败，请手动 git push
    pause
    exit /b 1
  )
  echo.
  echo  已推送！请到 GitHub Actions 等待部署完成。
) else (
  echo  没有新卡面，无需推送。
)

echo.
pause
endlocal
