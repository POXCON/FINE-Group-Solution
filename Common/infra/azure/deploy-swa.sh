#!/usr/bin/env bash
#
# deploy-swa.sh — 移行済みフロント2アプリ(Common ポータル / Invoice-Search)を
# 単一の Azure Static Web App(swa-fine-web / Free)へ「同一オリジン・パス分割」で配信する。
#
#   ルート "/"              → Common ポータル
#   サブパス "/invoice-search/" → Invoice-Search
#
# 前提:
#   - az CLI ログイン済み(共有)/ npm / npx が使用可能
#   - VITE_AZURE_* は非秘密(パブリック SPA クライアント)。API FQDN も非秘密。
#   - デプロイトークンは実行時に az から取得し、引数として渡す(コミットしない)。
#
# 使い方:
#   ./deploy-swa.sh
#
# 環境変数で上書き可能(既定値は検証環境 rg-fine-verify-dev / swa-fine-web):
#   RESOURCE_GROUP, SWA_NAME, API_BASE_URL,
#   VITE_AZURE_TENANT_ID, VITE_AZURE_CLIENT_ID, VITE_AZURE_AUTHORITY, VITE_AZURE_API_SCOPE
#
set -euo pipefail

# --- リポジトリルート(このスクリプトから2つ上)---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# --- 設定(非秘密 ID のみ。上書き可)---
RESOURCE_GROUP="${RESOURCE_GROUP:-rg-fine-verify-dev}"
SWA_NAME="${SWA_NAME:-swa-fine-web}"
API_BASE_URL="${API_BASE_URL:-https://ca-fine-api.happyhill-20261f59.japaneast.azurecontainerapps.io}"
VITE_AZURE_TENANT_ID="${VITE_AZURE_TENANT_ID:-555dafe8-9dde-4f98-ac9b-904e08b28c58}"
VITE_AZURE_CLIENT_ID="${VITE_AZURE_CLIENT_ID:-76537176-b582-4055-8b3e-cf89e84e1c08}"
VITE_AZURE_AUTHORITY="${VITE_AZURE_AUTHORITY:-https://login.microsoftonline.com/555dafe8-9dde-4f98-ac9b-904e08b28c58}"
VITE_AZURE_API_SCOPE="${VITE_AZURE_API_SCOPE:-api://76537176-b582-4055-8b3e-cf89e84e1c08/access_as_user}"

PORTAL_DIR="${REPO_ROOT}/Common/frontend"
INVOICE_DIR="${REPO_ROOT}/Invoice-Search/frontend"
DIST_DIR="${SCRIPT_DIR}/swa-dist"

echo "==> 1/4 ビルド用 .env.production を生成(非秘密・gitignore 済み)"
cat > "${PORTAL_DIR}/.env.production" <<EOF
# 自動生成(deploy-swa.sh)。手で編集しないこと。非秘密の Entra SPA 値のみ。
# ポータルは配信ルート "/"。Invoice-Search は同一オリジン /invoice-search/ のため
# VITE_INVOICE_SEARCH_URL は未設定(相対 "/invoice-search/" にフォールバック)。
VITE_AZURE_TENANT_ID=${VITE_AZURE_TENANT_ID}
VITE_AZURE_CLIENT_ID=${VITE_AZURE_CLIENT_ID}
VITE_AZURE_AUTHORITY=${VITE_AZURE_AUTHORITY}
VITE_AZURE_API_SCOPE=${VITE_AZURE_API_SCOPE}
EOF

cat > "${INVOICE_DIR}/.env.production" <<EOF
# 自動生成(deploy-swa.sh)。手で編集しないこと。非秘密の Entra SPA 値のみ。
# API は Container App FQDN を直接呼ぶ(Free SWA は Container Apps へプロキシ不可)。
# 従ってブラウザからのクロスオリジン呼び出しとなり、CORS 対応は #75 で backend 側に実装。
VITE_API_BASE_URL=${API_BASE_URL}
VITE_AZURE_TENANT_ID=${VITE_AZURE_TENANT_ID}
VITE_AZURE_CLIENT_ID=${VITE_AZURE_CLIENT_ID}
VITE_AZURE_AUTHORITY=${VITE_AZURE_AUTHORITY}
VITE_AZURE_API_SCOPE=${VITE_AZURE_API_SCOPE}
EOF

echo "==> 2/4 2アプリをビルド"
( cd "${PORTAL_DIR}" && npm run build )       # base "/"
( cd "${INVOICE_DIR}" && npm run build )      # base "/invoice-search/"(vite.config.ts で設定済み)

echo "==> 3/4 単一配信ディレクトリへ統合: ${DIST_DIR}"
rm -rf "${DIST_DIR}"
mkdir -p "${DIST_DIR}"
cp -r "${PORTAL_DIR}/dist/." "${DIST_DIR}/"
mkdir -p "${DIST_DIR}/invoice-search"
cp -r "${INVOICE_DIR}/dist/." "${DIST_DIR}/invoice-search/"
cp "${SCRIPT_DIR}/staticwebapp.config.json" "${DIST_DIR}/staticwebapp.config.json"

echo "==> 4/4 SWA へデプロイ(production)"
TOKEN="$(az staticwebapp secrets list --name "${SWA_NAME}" --resource-group "${RESOURCE_GROUP}" --query 'properties.apiKey' -o tsv)"
npx -y @azure/static-web-apps-cli deploy "${DIST_DIR}" --deployment-token "${TOKEN}" --env production

HOSTNAME="$(az staticwebapp show --name "${SWA_NAME}" --resource-group "${RESOURCE_GROUP}" --query 'defaultHostname' -o tsv)"
echo ""
echo "デプロイ完了:"
echo "  ポータル       : https://${HOSTNAME}/"
echo "  Invoice-Search : https://${HOSTNAME}/invoice-search/"
echo ""
echo "初回のみ: 上記オリジンを Entra アプリ登録の SPA redirectUris へ追加すること。"
echo "  https://${HOSTNAME}/                 (ポータル: redirectUri = window.location.origin)"
echo "  https://${HOSTNAME}/invoice-search/  (Invoice-Search: redirectUri = origin + /invoice-search/)"
echo "  手順は README.md の「Entra リダイレクト URI の追加」を参照。"
