@echo off

setlocal enabledelayedexpansion

chcp 65001 >nul

title BanG Dream! - 阿里云 OSS 部署（国内访问）

cd /d "%~dp0"



where node >nul 2>&1

if errorlevel 1 (

  echo [错误] 未安装 Node.js

  pause

  exit /b 1

)



where python >nul 2>&1

if errorlevel 1 (

  echo [错误] 未安装 Python

  pause

  exit /b 1

)



if not exist ".aliyun.env" (

  echo.

  echo  [首次使用] 请先配置阿里云密钥:

  echo.

  echo  1. 复制 .aliyun.env.example 为 .aliyun.env

  echo  2. 填写 AccessKey 和 Bucket 名称

  echo.

  echo  在阿里云控制台创建 Bucket 步骤:

  echo  - 打开 https://oss.console.aliyun.com/

  echo  - 创建 Bucket，地域选「华东1（杭州）」等国内节点

  echo  - 读写权限: 公共读（或私有，脚本会尝试设置策略）

  echo  - 存储类型: 标准存储

  echo  - Bucket 名称填入 .aliyun.env 的 ALIYUN_OSS_BUCKET

  echo.

  if exist ".aliyun.env.example" copy /Y ".aliyun.env.example" ".aliyun.env" >nul

  echo  已生成 .aliyun.env，请编辑后重新运行本脚本。

  notepad ".aliyun.env"

  pause

  exit /b 1

)



echo.

echo  ========================================

echo   BanG Dream! - 阿里云 OSS 国内部署

echo  ========================================

echo.

echo   适合国内用户快速访问，无需 VPN

echo   站点约 1.9GB，首次上传需 20~60 分钟

echo.



if not exist "web\public\assets" (

  echo 链接图片资源...

  cmd /c mklink /J "web\public\assets" "Bandori" >nul 2>&1

)



echo [1/3] 安装上传依赖...

pip install oss2 -q

if errorlevel 1 (

  echo [错误] pip install oss2 失败

  pause

  exit /b 1

)



echo.

echo [2/3] 构建静态网站...

cd web

call npm run build:static

if errorlevel 1 (

  cd ..

  pause

  exit /b 1

)

cd ..



echo.

echo [3/3] 上传到阿里云 OSS...

python scripts\deploy-aliyun-oss.py

if errorlevel 1 (

  echo.

  echo  上传失败。常见原因:

  echo  - .aliyun.env 密钥或 Bucket 名称错误

  echo  - Bucket 尚未在 OSS 控制台创建

  echo  - 当前账号无 OSS 权限

  pause

  exit /b 1

)



echo.

echo  ========================================

echo   部署完成！

echo.

echo   在 OSS 控制台确认已开启「静态页面」:

echo   Bucket -^> 基础设置 -^> 静态页面

echo   默认首页: index.html

echo.

echo   可选加速: 绑定 CDN 域名（需备案）

echo   https://cdn.console.aliyun.com/

echo  ========================================

echo.

pause

