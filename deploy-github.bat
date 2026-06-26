@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title BanG Dream! - GitHub Pages 长期公网部署
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
  echo [错误] 未安装 Git，请从 https://git-scm.com 下载安装
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
echo   BanG Dream! - GitHub Pages 部署
echo  ========================================
echo.
echo   地址格式: https://你的用户名.github.io/仓库名/
echo   注意: 图片约 900MB，首次推送较慢
echo.

if not exist "web\public\assets" (
  echo 链接图片资源...
  cmd /c mklink /J "web\public\assets" "Bandori" >nul 2>&1
)

set /p REPO_NAME=请输入 GitHub 仓库名（如 bangdream-museum）: 
if "%REPO_NAME%"=="" (
  echo [错误] 仓库名不能为空
  pause
  exit /b 1
)

set /p GITHUB_USER=请输入你的 GitHub 用户名: 
if "%GITHUB_USER%"=="" (
  echo [错误] 用户名不能为空
  pause
  exit /b 1
)

REM 检查 Git 身份（空字符串也算未配置）
set "GIT_NAME_OK="
set "GIT_EMAIL_OK="
for /f "delims=" %%i in ('git config user.name 2^>nul') do set "GIT_NAME_OK=%%i"
for /f "delims=" %%i in ('git config user.email 2^>nul') do set "GIT_EMAIL_OK=%%i"

if not defined GIT_NAME_OK (
  echo.
  echo [提示] 需要设置 Git 提交者信息（本仓库保存一次即可）
  set /p GIT_NAME=请输入你的名字（可与 GitHub 用户名相同）: 
  if "!GIT_NAME!"=="" set "GIT_NAME=%GITHUB_USER%"
  git config user.name "!GIT_NAME!"
)

if not defined GIT_EMAIL_OK (
  set /p GIT_EMAIL=请输入你的邮箱（GitHub Settings - Emails 里查看）: 
  if "!GIT_EMAIL!"=="" (
    echo [错误] 邮箱不能为空
    pause
    exit /b 1
  )
  git config user.email "!GIT_EMAIL!"
)

echo.
echo [1/4] 初始化 Git 仓库...
if not exist ".git" git init
git branch -M main 2>nul

echo.
echo [2/4] 提交代码（首次可能较慢，请耐心等待）...
git add .
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "BanG Dream museum site with GitHub Pages"
  if errorlevel 1 (
    echo.
    echo [错误] 提交失败，请手动运行:
    echo   git config user.name "Yizhengjia558-lab"
    echo   git config user.email "你的邮箱"
    echo   git commit -m "BanG Dream museum site with GitHub Pages"
    pause
    exit /b 1
  )
) else (
  git rev-parse HEAD >nul 2>&1
  if errorlevel 1 (
    echo [错误] 没有可提交的文件，也没有历史提交
    pause
    exit /b 1
  )
  echo 没有新的更改，使用已有提交
)

git rev-parse HEAD >nul 2>&1
if errorlevel 1 (
  echo [错误] 本地仍无提交记录，无法推送
  pause
  exit /b 1
)

echo.
echo [3/4] 设置远程仓库...
git remote get-url origin >nul 2>&1
if errorlevel 1 (
  git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git
) else (
  git remote set-url origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git
)

echo.
echo 请确认 GitHub 上已创建空仓库: https://github.com/%GITHUB_USER%/%REPO_NAME%
echo.
pause

echo [4/4] 推送到 GitHub...
git push -u origin main
if errorlevel 1 (
  echo.
  echo  推送失败。常见原因:
  echo  - 仓库尚未在 GitHub 上创建
  echo  - 未登录 GitHub（浏览器授权或 GitHub Desktop）
  echo  - 网络问题
  pause
  exit /b 1
)

echo.
echo  ========================================
echo   推送成功！
echo   网站地址: https://%GITHUB_USER%.github.io/%REPO_NAME%/
echo   请到 Actions 页等待 Deploy GitHub Pages 完成
echo  ========================================
echo.
pause
endlocal
