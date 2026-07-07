// ============================================================================
// Container App（Invoice-Search backend / scale-to-zero）
// ACR(acrfinegrpdev) の実イメージを外部 Ingress(port 8000) で公開。
// minReplicas=0（scale-to-zero）で無料/最安。
// ACR pull は管理者資格情報を利用。ユーザー名/パスワードはデプロイ時に
// listCredentials() で解決し、Container App の secret に保持する
// （Log Analytics sharedKey と同様、Bicep ソース/ git には一切出さない）。
// アプリ固有 env（AZURE_*/CORS_ORIGINS 等の非秘密、および PM 注入の秘密）は
// 破壊的上書きを避けるため Bicep では管理せず、デプロイ後に CLI で設定する。
// ============================================================================
@description('リージョン')
param location string

@description('共通タグ')
param tags object

@description('Container Apps Environment のリソース ID')
param environmentId string

@description('Container App 名')
param containerAppName string = 'ca-fine-grp-api'

@description('実イメージ（ACR）')
param containerImage string = 'acrfinegrpdev.azurecr.io/invoice-search-backend:latest'

@description('コンテナが待ち受けるポート')
param targetPort int = 8000

@description('ACR 名（同一 RG 内。admin 資格情報で pull）')
param acrName string = 'acrfinegrpdev'

// 既存 ACR を参照し、admin 資格情報を解決（秘密は output しない）
resource acr 'Microsoft.ContainerRegistry/registries@2025-04-01' existing = {
  name: acrName
}

var acrLoginServer = acr.properties.loginServer

resource containerApp 'Microsoft.App/containerApps@2026-01-01' = {
  name: containerAppName
  location: location
  tags: tags
  properties: {
    environmentId: environmentId
    configuration: {
      activeRevisionsMode: 'Single'
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
      ]
      registries: [
        {
          server: acrLoginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      ingress: {
        external: true
        targetPort: targetPort
        transport: 'auto'
        allowInsecure: false
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
    }
    template: {
      containers: [
        {
          name: 'api'
          image: containerImage
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
      }
    }
  }
}

@description('外部 Ingress FQDN')
output ingressFqdn string = containerApp.properties.configuration.ingress.fqdn

@description('Container App 名')
output containerAppName string = containerApp.name
