@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title 推送到全新 GitHub 仓库
cd /d "%~dp0"

echo.
echo  ========================================
echo   推送到全新 GitHub 仓库
echo  ========================================
echo.
echo  请先在 GitHub 网页创建【空仓库】:
echo    https://github.com/new
echo    - 不要勾选 README / .gitignore / License
echo.
echo  若要用旧仓库名 bangdream-museum，需先删除旧仓库再重建空仓库。
echo.

set /p GITHUB_USER=GitHub 用户名: 
if "%GITHUB_USER%"=="" exit /b 1

set /p REPO_NAME=新仓库名: 
if "%REPO_NAME%"=="" exit /b 1

git remote remove origin 2>nul
git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git

echo.
echo 正在推送（约 1.8GB 图片，首次可能需要 30~60 分钟）...
echo.
git push -u origin main
if errorlevel 1 (
  echo.
  echo 推送失败。请确认:
  echo  1. GitHub 上已创建空仓库 %REPO_NAME%
  echo  2. 已登录 GitHub（Git Credential Manager 或 Personal Access Token）
  echo  3. 网络/代理正常
  pause
  exit /b 1
)

echo.
echo  ========================================
echo   推送成功！
echo.
echo   下一步 - 开启 GitHub Pages:
echo   1. 打开 https://github.com/%GITHUB_USER%/%REPO_NAME%/settings/pages
echo   2. Source 选择 "GitHub Actions"
echo   3. 打开 Actions 等待 Deploy GitHub Pages 完成
echo.
echo   网站: https://%GITHUB_USER%.github.io/%REPO_NAME%/
echo  ========================================
echo.
pause
endlocal
