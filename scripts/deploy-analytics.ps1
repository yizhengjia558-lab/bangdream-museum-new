# 部署 BanG Dream Museum 访客统计 Worker
# 用法: 在项目根目录运行  .\scripts\deploy-analytics.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$WorkerDir = Join-Path $Root "web\analytics-worker"
$ConfigPath = Join-Path $WorkerDir "wrangler.toml"
$VisitorApiJson = Join-Path $Root "web\public\visitor-api.json"

Write-Host ""
Write-Host "=== BanG Dream Museum 访客统计部署 ===" -ForegroundColor Cyan
Write-Host ""

Push-Location $WorkerDir
try {
    Write-Host "检查 Cloudflare 登录状态..." -ForegroundColor Yellow
    $whoami = npx wrangler whoami 2>&1 | Out-String
    if ($whoami -match "not authenticated") {
        Write-Host "请先完成 Cloudflare 登录（将打开浏览器）..." -ForegroundColor Yellow
        npx wrangler login
    }

    $toml = Get-Content $ConfigPath -Raw
    if ($toml -match 'id = "REPLACE_WITH_YOUR_KV_NAMESPACE_ID"') {
        Write-Host "创建 KV 命名空间 STATS..." -ForegroundColor Yellow
        $kvOut = npx wrangler kv namespace create STATS 2>&1 | Out-String
        Write-Host $kvOut

        if ($kvOut -match '"id"\s*:\s*"([^"]+)"') {
            $kvId = $Matches[1]
        } elseif ($kvOut -match 'id = "([a-f0-9]+)"') {
            $kvId = $Matches[1]
        } else {
            throw "无法解析 KV namespace id，请手动填入 wrangler.toml"
        }

        $toml = $toml -replace 'REPLACE_WITH_YOUR_KV_NAMESPACE_ID', $kvId
        Set-Content -Path $ConfigPath -Value $toml -NoNewline
        Write-Host "已写入 KV id: $kvId" -ForegroundColor Green
    }

    Write-Host "部署 Worker..." -ForegroundColor Yellow
    $deployOut = npx wrangler deploy 2>&1 | Out-String
    Write-Host $deployOut

    if ($deployOut -match "register a workers.dev subdomain") {
        $onboardUrl = "https://dash.cloudflare.com/?to=/:account/workers/onboarding"
        if ($deployOut -match 'https://dash\.cloudflare\.com/[^\s]+workers/onboarding') {
            $onboardUrl = $Matches[0]
        }
        Write-Host ""
        Write-Host "需要先在 Cloudflare 注册 workers.dev 子域名（仅需一次）:" -ForegroundColor Yellow
        Write-Host "  $onboardUrl" -ForegroundColor Cyan
        Start-Process $onboardUrl
        Write-Host ""
        Write-Host "注册完成后，请再次运行 scripts\deploy-analytics.bat" -ForegroundColor Yellow
        exit 1
    }

    if ($LASTEXITCODE -ne 0 -and $deployOut -notmatch 'https://[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev') {
        throw "Worker 部署失败"
    }

    $workerUrl = $null
    if ($deployOut -match 'https://[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev') {
        $workerUrl = $Matches[0]
    } elseif ($deployOut -match 'https://bangdream-museum-analytics\.[^\s]+\.workers\.dev') {
        $workerUrl = $Matches[0]
    } else {
        $workerUrl = "https://bangdream-museum-analytics.workers.dev"
        Write-Host "未能自动解析 Worker URL，使用默认: $workerUrl" -ForegroundColor Yellow
    }

    $json = @{ api = $workerUrl } | ConvertTo-Json -Compress
    Set-Content -Path $VisitorApiJson -Value $json -Encoding utf8
    Write-Host ""
    Write-Host "已写入 web/public/visitor-api.json" -ForegroundColor Green
    Write-Host "Worker 地址: $workerUrl" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步:" -ForegroundColor Cyan
    Write-Host "  1. 提交并 push visitor-api.json 与 wrangler.toml 到 GitHub"
    Write-Host "  2. GitHub Actions 会自动重新部署网站"
    Write-Host "  3. 页脚与顶栏将显示访客数量，/stats/ 可查看详情"
    Write-Host ""
    Write-Host "（可选）在 GitHub 仓库 Settings -> Variables 设置 VISITOR_API_URL = $workerUrl"
    Write-Host ""
}
finally {
    Pop-Location
}
