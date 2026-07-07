// ============================================================================
// Container Apps Environment（Consumption ワークロードプロファイル）
// Log Analytics へログを送信。customerId / sharedKey はモジュール内で解決し、
// 秘密情報を output へ露出させない。
// ============================================================================
@description('リージョン')
param location string

@description('共通タグ')
param tags object

@description('ログ送信先 Log Analytics ワークスペース名（同一 RG 内）')
param logAnalyticsWorkspaceName string

@description('Container Apps Environment 名')
param environmentName string = 'cae-fine-verify-dev'

// 既存ワークスペースを参照して customerId / sharedKey を取得（秘密は output しない）
resource workspace 'Microsoft.OperationalInsights/workspaces@2025-07-01' existing = {
  name: logAnalyticsWorkspaceName
}

resource environment 'Microsoft.App/managedEnvironments@2026-01-01' = {
  name: environmentName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: workspace.properties.customerId
        sharedKey: workspace.listKeys().primarySharedKey
      }
    }
    zoneRedundant: false
  }
}

@description('Container Apps Environment のリソース ID')
output environmentId string = environment.id

@description('Container Apps Environment 名')
output environmentName string = environment.name
