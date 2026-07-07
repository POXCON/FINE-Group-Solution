// ============================================================================
// Azure Container Registry（Basic・最安）
// backend の実イメージ格納先。ローカル Docker でビルドし push する運用。
// 当サブスクリプションは ACR Tasks（クラウドビルド）不可のため build はローカル。
// pull はマネージド ID が使えない場合に備え admin ユーザーを有効化する。
// 管理者資格情報（ユーザー名/パスワード）は Azure が自動発行し、Bicep ソースには
// 一切含めない（Container App 側で secret として CLI 注入する）。
// ============================================================================
@description('リージョン')
param location string

@description('共通タグ')
param tags object

@description('ACR 名（英数のみ・グローバル一意）')
param registryName string = 'acrfinegrpdev'

resource registry 'Microsoft.ContainerRegistry/registries@2025-04-01' = {
  name: registryName
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
    publicNetworkAccess: 'Enabled'
  }
}

@description('ACR のリソース名')
output registryName string = registry.name

@description('ACR のログインサーバ（例 acrfinegrpdev.azurecr.io）')
output loginServer string = registry.properties.loginServer
