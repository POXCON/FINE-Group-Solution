// DEV 検証環境（無料枠）用パラメータ
// 使用例:
//   az deployment sub create --location japaneast \
//     --template-file Common/infra/azure/main.bicep \
//     --parameters Common/infra/azure/main.bicepparam
using './main.bicep'

param environmentName = 'verify-dev'
param location = 'japaneast'
param staticWebAppLocation = 'eastasia'
param resourceGroupName = 'rg-fine-grp-dev'
