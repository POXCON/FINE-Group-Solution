// ============================================================================
// Log Analytics ワークスペース（PerGB2018・最小構成）
// Container Apps Environment のログ集約先として利用
// ============================================================================
@description('リージョン')
param location string

@description('共通タグ')
param tags object

@description('ワークスペース名')
param workspaceName string = 'log-fine-grp-dev'

@description('データ保持日数（無料枠を考慮し最小の 30 日）')
@minValue(30)
@maxValue(730)
param retentionInDays int = 30

resource workspace 'Microsoft.OperationalInsights/workspaces@2025-07-01' = {
  name: workspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: retentionInDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

@description('ワークスペースのリソース名')
output workspaceName string = workspace.name

@description('ワークスペースのリソース ID')
output workspaceId string = workspace.id
