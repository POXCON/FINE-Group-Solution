<#
.SYNOPSIS
  InvoiceSearchAuth スタックの出力（Cognito 設定）を読み取り、
  frontend/.env.production を生成する。フロント本番ビルドの前に実行する。

.PARAMETER ProfileName
  使用する AWS CLI プロファイル名（既定: fine-admin）

.PARAMETER Region
  リージョン（既定: ap-northeast-1）

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/configure-frontend-env.ps1
#>
param(
  [string]$ProfileName = "fine-admin",
  [string]$Region = "ap-northeast-1"
)

$ErrorActionPreference = "Stop"

function Get-Output([string]$Key) {
  return (aws cloudformation describe-stacks `
    --stack-name InvoiceSearchAuth `
    --query "Stacks[0].Outputs[?OutputKey=='$Key'].OutputValue" `
    --output text --profile $ProfileName --region $Region).Trim()
}

$userPoolId = Get-Output "UserPoolId"
$clientId = Get-Output "UserPoolClientId"

if (-not $userPoolId -or -not $clientId) {
  throw "Cognito の出力を取得できませんでした。先に InvoiceSearchAuth をデプロイしてください。"
}

$envPath = Join-Path $PSScriptRoot "..\..\frontend\.env.production"
$content = @"
# 自動生成（configure-frontend-env.ps1）。手で編集しないこと。
# API は CloudFront 同一オリジンの /api/* 経由（VITE_API_BASE_URL は未設定=相対）。
VITE_COGNITO_USER_POOL_ID=$userPoolId
VITE_COGNITO_CLIENT_ID=$clientId
"@

Set-Content -Path $envPath -Value $content -Encoding utf8
Write-Host "Wrote $envPath"
Write-Host "  UserPoolId = $userPoolId"
Write-Host "  ClientId   = $clientId"
