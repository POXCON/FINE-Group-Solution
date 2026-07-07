// ============================================================================
// FINE Group Solution — Azure 基盤 IaC (DEV 検証 / 無料枠)
// スコープ: サブスクリプション（Resource Group を作成し、各モジュールを呼び出す）
// 参照 Issue: #70 / #90（fine-grp 命名へ統一・rg-fine-grp-dev へ再プロビジョン）
// ============================================================================
targetScope = 'subscription'

@description('環境名（リソース命名・タグに使用）')
param environmentName string = 'verify-dev'

@description('主要リソースのリージョン。Static Web Apps 以外はここを使用')
param location string = 'japaneast'

@description('Static Web Apps 用リージョン（japaneast 非対応のため eastasia を既定）')
param staticWebAppLocation string = 'eastasia'

@description('Resource Group 名')
param resourceGroupName string = 'rg-fine-grp-dev'

// 全リソース共通タグ
var tags = {
  Project: 'FINE-Group-Solution'
  Environment: environmentName
  System: 'platform'
  ManagedBy: 'bicep'
}

// 1) Resource Group
resource rg 'Microsoft.Resources/resourceGroups@2024-11-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// 2) Log Analytics ワークスペース
module logAnalytics 'modules/log-analytics.bicep' = {
  name: 'logAnalytics'
  scope: rg
  params: {
    location: location
    tags: tags
  }
}

// 3) Container Apps Environment（Consumption）
module containerAppsEnv 'modules/container-apps-env.bicep' = {
  name: 'containerAppsEnv'
  scope: rg
  params: {
    location: location
    tags: tags
    logAnalyticsWorkspaceName: logAnalytics.outputs.workspaceName
  }
}

// 4) Azure Container Registry（Basic・実イメージ格納先）
module containerRegistry 'modules/container-registry.bicep' = {
  name: 'containerRegistry'
  scope: rg
  params: {
    location: location
    tags: tags
  }
}

// 5) Container App（ACR 実イメージ / scale-to-zero）
// レジストリ資格情報はモジュール内で listCredentials() により解決し secret 保持
// （git には出さない）。アプリ固有 env は破壊的上書きを避けるためデプロイ後に CLI 設定。
module containerApp 'modules/container-app.bicep' = {
  name: 'containerApp'
  scope: rg
  params: {
    location: location
    tags: tags
    environmentId: containerAppsEnv.outputs.environmentId
    acrName: containerRegistry.outputs.registryName
  }
}

// 6) Static Web App（Free / eastasia）
module staticWebApp 'modules/static-web-app.bicep' = {
  name: 'staticWebApp'
  scope: rg
  params: {
    location: staticWebAppLocation
    tags: tags
  }
}

@description('API (Container App) の外部 Ingress FQDN')
output apiIngressFqdn string = containerApp.outputs.ingressFqdn

@description('ACR のログインサーバ')
output acrLoginServer string = containerRegistry.outputs.loginServer

@description('ACR 名')
output acrName string = containerRegistry.outputs.registryName

@description('Static Web App の defaultHostname')
output staticWebAppDefaultHostname string = staticWebApp.outputs.defaultHostname

@description('作成した Resource Group 名')
output resourceGroupNameOut string = rg.name
