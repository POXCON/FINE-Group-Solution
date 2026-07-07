// ============================================================================
// Container App（プレースホルダ）
// 公開イメージ aci-helloworld を外部 Ingress(port 80) で公開。
// minReplicas=0（scale-to-zero）で無料/最安。実イメージ差し替えは Issue #75。
// ============================================================================
@description('リージョン')
param location string

@description('共通タグ')
param tags object

@description('Container Apps Environment のリソース ID')
param environmentId string

@description('Container App 名')
param containerAppName string = 'ca-fine-grp-api'

@description('プレースホルダ公開イメージ')
param containerImage string = 'mcr.microsoft.com/azuredocs/aci-helloworld'

@description('コンテナが待ち受けるポート')
param targetPort int = 80

resource containerApp 'Microsoft.App/containerApps@2026-01-01' = {
  name: containerAppName
  location: location
  tags: tags
  properties: {
    environmentId: environmentId
    configuration: {
      activeRevisionsMode: 'Single'
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
