// ============================================================================
// Static Web App（Free SKU）
// フロント配信用。japaneast 非対応のため eastasia を使用。
// リポジトリ連携は別 Issue のデプロイ設定で行う（ここでは空の枠のみ作成）。
// ============================================================================
@description('リージョン（Static Web Apps 対応リージョン。既定 eastasia）')
param location string

@description('共通タグ')
param tags object

@description('Static Web App 名')
param staticWebAppName string = 'swa-fine-grp-web'

resource staticWebApp 'Microsoft.Web/staticSites@2024-11-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    // CI/CD 連携は別途設定するため、ここではビルドプロパティを持たない空枠を作成
    allowConfigFileUpdates: true
    stagingEnvironmentPolicy: 'Enabled'
  }
}

@description('Static Web App の defaultHostname')
output defaultHostname string = staticWebApp.properties.defaultHostname

@description('Static Web App 名')
output staticWebAppName string = staticWebApp.name
