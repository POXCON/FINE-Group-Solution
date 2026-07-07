# FINE Group Solution — Azure 基盤 IaC（DEV 検証 / 無料枠）

AWS → Azure 移行の一環として、**個人テナントの検証用（DEV）** の Azure 基盤を
**Bicep** でスキャフォールドする。無料枠 / 最安構成のみを対象とし、課金の出る SKU・
Front Door・VNet・Private Endpoint は含めない（本番 PRD 構成は別 Issue #68）。

参照 Issue: **#70**（親 Epic #63 / 統括 #62）

---

## プロビジョニング内容（DEV・無料/最安）

| # | リソース | 名前 | リージョン | 備考 |
|---|----------|------|-----------|------|
| 1 | Resource Group | `rg-fine-verify-dev` | japaneast | 全リソースの入れ物 |
| 2 | Log Analytics ワークスペース | `log-fine-verify-dev` | japaneast | PerGB2018・保持 30 日 |
| 3 | Container Apps Environment | `cae-fine-verify-dev` | japaneast | Consumption |
| 4 | Container App | `ca-fine-api` | japaneast | プレースホルダ公開イメージ・外部 Ingress(80)・**minReplicas=0** |
| 5 | Static Web App | `swa-fine-web` | **eastasia** | **Free SKU**（japaneast 非対応のため eastasia） |

- Container App の実イメージは `mcr.microsoft.com/azuredocs/aci-helloworld`（プレースホルダ）。
  実イメージ差し替えは別 Issue **#75**。
- 全リソース共通タグ: `Project=FINE-Group-Solution` / `Environment=verify-dev` /
  `System=platform` / `ManagedBy=bicep`。

### 無料枠 / コストの注意
- **Container App**: `minReplicas=0`（scale-to-zero）のため、無アクセス時は課金対象の
  レプリカが 0 になる。Consumption プランは月あたりの無料枠（リクエスト / vCPU 秒 /
  メモリ GiB 秒）内であれば実質無償。
- **Static Web App**: Free SKU は無料。
- **Log Analytics**: 取り込みに従量課金が発生し得るが、DEV の低ログ量かつ 5GB/月の
  無料枠内で実質無償。保持日数は最小の 30 日。
- **課金の出る SKU は使用しない**。Front Door / VNet / Private Endpoint / NAT なし。

---

## 前提

- Azure CLI（`az`）と Bicep（`az bicep`）が導入済み。
- 対象サブスクリプションへ `az login` 済み。
- 以下のリソースプロバイダが `Registered` であること（未登録なら登録する）:
  - `Microsoft.App` / `Microsoft.OperationalInsights` / `Microsoft.Web`

```bash
# サブスクリプション選択
az account set --subscription <SUBSCRIPTION_ID>

# プロバイダ登録（未登録の場合のみ / 数分かかる）
az provider register -n Microsoft.App --wait
az provider register -n Microsoft.OperationalInsights --wait
az provider register -n Microsoft.Web --wait
```

> 秘密情報（サブスクリプション ID・キー等）は本 README には記載しない。
> 実行時に環境変数 / CLI 引数で渡すこと。

---

## ファイル構成

```
Common/infra/azure/
├── main.bicep                        # サブスクリプションスコープ: RG 作成＋モジュール呼び出し
├── modules/
│   ├── log-analytics.bicep           # Log Analytics ワークスペース
│   ├── container-apps-env.bicep      # Container Apps Environment
│   ├── container-app.bicep           # Container App（プレースホルダ / scale-to-zero）
│   └── static-web-app.bicep          # Static Web App（Free）
└── README.md                         # 本書
```

### パラメータ（`main.bicep`）
| 名前 | 既定値 | 説明 |
|------|--------|------|
| `environmentName` | `verify-dev` | 環境名（タグに使用） |
| `location` | `japaneast` | 主要リソースのリージョン |
| `staticWebAppLocation` | `eastasia` | Static Web App 用リージョン |
| `resourceGroupName` | `rg-fine-verify-dev` | Resource Group 名 |

---

## デプロイ手順

サブスクリプションスコープのデプロイのため、`az deployment sub create` を使用する。

```bash
az account set --subscription <SUBSCRIPTION_ID>

# 検証（任意・推奨）
az deployment sub what-if \
  --location japaneast \
  --template-file Common/infra/azure/main.bicep

# デプロイ
az deployment sub create \
  --name fine-azure-verify-dev \
  --location japaneast \
  --template-file Common/infra/azure/main.bicep
```

### 出力（outputs）
- `apiIngressFqdn` — Container App（API）の外部 Ingress FQDN
- `staticWebAppDefaultHostname` — Static Web App の defaultHostname
- `resourceGroupNameOut` — 作成した Resource Group 名

出力の取得例:
```bash
az deployment sub show \
  --name fine-azure-verify-dev \
  --query properties.outputs -o json
```

### 動作確認
```bash
# API（helloworld ページ）へアクセス
curl -I https://<apiIngressFqdn>

# SWA の defaultHostname を確認（初期状態は待機ページ）
curl -I https://<staticWebAppDefaultHostname>
```

---

## 破棄手順（クリーンアップ）

Resource Group ごと削除すれば全リソースが消える。

```bash
az group delete --name rg-fine-verify-dev --yes --no-wait
```

> Static Web App は eastasia だが同一 RG 内に作成されるため、RG 削除で一括破棄される。

---

## タグの確認

Azure ポータルの Resource Group 一覧 / 各リソースの「タグ」で以下を確認できる:

`Project=FINE-Group-Solution` / `Environment=verify-dev` / `System=platform` / `ManagedBy=bicep`

---

## フロント2アプリの SWA 配信(同一オリジン・パス分割 / #76)

移行済みの2フロント(Common ポータル / Invoice-Search)を、既存 `swa-fine-web`(Free)へ
**同一オリジン・パス分割**で配信する。

```
https://<swa-defaultHostname>/                 → Common ポータル(base "/")
https://<swa-defaultHostname>/invoice-search/  → Invoice-Search(base "/invoice-search/")
```

### 構成ファイル

| ファイル | 役割 |
|----------|------|
| `staticwebapp.config.json` | SWA のルーティング(下記)。配信ディレクトリ直下に配置される。 |
| `deploy-swa.sh` | ビルド→統合→`swa deploy` を一括実行するスクリプト。 |
| `swa-dist/`(gitignore) | 統合された配信ディレクトリ(派生物・非コミット)。 |

### staticwebapp.config.json の要点

- `/invoice-search/assets/*` と拡張子付きファイル(`*.{js,css,ico,png,…}`)は
  **rewrite せず実体ファイルを配信**(ルール評価は最初の一致で停止するため、
  後続の catch-all より先に置く。これが無いと JS/CSS が index.html に化けてアプリが壊れる)。
- `/invoice-search/*`(上記以外)は `/invoice-search/index.html` へ **rewrite**
  → Invoice-Search のクライアントルーティング(`/search` `/consistency-check`)を維持。
- ルートは `navigationFallback` で `/index.html` へフォールバック。
  `exclude` に `/invoice-search/*`・`/assets/*`・静的アセット拡張子を指定し、
  サブアプリとアセットを巻き込まない。
- **API(`/api/*`)について**: Free SWA は Container Apps バックエンドへの
  リンク(プロキシ)不可。フロントは API FQDN を**直接**呼ぶ(=クロスオリジン)。
  そのため **CORS 対応は #75 で backend(Container App)側に実装予定**。
  本 Issue #76 時点では API はプレースホルダのため、Invoice-Search の検索実行は
  失敗して良い(ログイン/ロールガード/画面遷移の実証が目的)。

### デプロイ手順

前提: `az login` 済み・対象サブスクリプション選択済み。

```bash
az account set --subscription <SUBSCRIPTION_ID>

# ビルド→統合→デプロイを一括実行(既定値=検証環境)
Common/infra/azure/deploy-swa.sh
```

スクリプトは以下を行う:

1. 各 frontend の `.env.production`(非秘密の `VITE_AZURE_*` / API FQDN)を生成。
2. `Common/frontend`(base `/`)と `Invoice-Search/frontend`(base `/invoice-search/`)をビルド。
3. `swa-dist/` へ統合(ルート=ポータル / `invoice-search/`=検索アプリ / `staticwebapp.config.json`)。
4. デプロイトークンを `az staticwebapp secrets list` で取得し、
   `npx @azure/static-web-apps-cli deploy` で `production` へデプロイ。

手動で行う場合の要点:

```bash
TOKEN=$(az staticwebapp secrets list --name swa-fine-web \
  --resource-group rg-fine-verify-dev --query "properties.apiKey" -o tsv)
npx -y @azure/static-web-apps-cli deploy Common/infra/azure/swa-dist \
  --deployment-token "$TOKEN" --env production
```

### Entra リダイレクト URI の追加(初回のみ)

SWA の `defaultHostname` を取得し、そのオリジンをアプリ登録の **SPA redirectUris** に追加する
(既存の localhost は残す)。ポータルは `redirectUri = window.location.origin`、
Invoice-Search は `origin + /invoice-search/` を使うため **両方**を登録する。

```bash
HOSTNAME=$(az staticwebapp show --name swa-fine-web \
  --resource-group rg-fine-verify-dev --query "defaultHostname" -o tsv)
OBJECT_ID=$(az ad app show --id 76537176-b582-4055-8b3e-cf89e84e1c08 --query id -o tsv)

# spa.redirectUris は既存分も含めた完全な配列で PATCH する(置換されるため)
az rest --method PATCH \
  --url "https://graph.microsoft.com/v1.0/applications/${OBJECT_ID}" \
  --headers "Content-Type=application/json" \
  --body '{"spa":{"redirectUris":[
    "http://localhost:4280/","http://localhost:5173/",
    "https://'"${HOSTNAME}"'/","https://'"${HOSTNAME}"'/invoice-search/"
  ]}}'
```

> 検証環境(#76)での実績値: `defaultHostname = nice-water-054d5bc00.7.azurestaticapps.net`

### 動作確認

```bash
BASE=https://nice-water-054d5bc00.7.azurestaticapps.net
curl -I "$BASE/"                                   # ポータル(200 / text/html)
curl -I "$BASE/invoice-search/"                    # 検索アプリ(200 / text/html)
curl -I "$BASE/invoice-search/assets/<hash>.js"    # 200 / text/javascript(HTML に化けないこと)
```

手動ログイン確認(対話):

1. ブラウザで `https://<hostname>/` を開く → 未認証なら `login.microsoftonline.com` へ遷移。
2. `kenta.ishii1996@outlook.jp`(admin ロール割当済み)でサインイン → ポータルへ戻る。
3. 「インボイス番号検索」カード → `/invoice-search/` へ遷移し、SSO でログイン状態が共有される。
4. 検索実行は #75(実 API + CORS)まで失敗して良い。

---

## Invoice-Search backend のコンテナ化＋ Container App デプロイ(#75)

プレースホルダ(`aci-helloworld`)だった `ca-fine-api` を、移行済み FastAPI backend の
**実イメージ**へ差し替える。ローカル Docker は不要で、`az containerapp up --source` の
**クラウドビルド**(ACR タスク)でイメージをビルド・push・デプロイする。

### コンテナ構成

| ファイル | 役割 |
|----------|------|
| `Invoice-Search/backend/Dockerfile` | `python:3.12-slim` / requirements インストール / **非 root**(uid 10001) / `uvicorn app.main:app` を **8000** で起動。Mangum(Lambda shim)は使わない。 |
| `Invoice-Search/backend/.dockerignore` | tests・キャッシュ・`.env*`(秘密)・`lambda_handler.py` 等を除外。 |

- FastAPI 側は `CORSMiddleware` を `settings.cors_origins`(= `CORS_ORIGINS` をカンマ分割)で
  構成済み。`Authorization`/`Content-Type` を許可、`allow_credentials=true`。
- 認証は `AUTH_DISABLED=false` で Entra JWT 検証を有効化(トークン無し→401、
  ロール不足→403)。

### デプロイ手順

前提: `az login` 済み・対象サブスクリプション選択済み。

```bash
az account set --subscription <SUBSCRIPTION_ID>

# クラウドビルド(ACR 自動作成)→ 既存 ca-fine-api の image を差し替え
az containerapp up \
  --name ca-fine-api \
  --resource-group rg-fine-verify-dev \
  --source Invoice-Search/backend \
  --ingress external \
  --target-port 8000
```

`up` 実行後、非秘密の環境変数を設定する(**秘密は含めない**):

```bash
az containerapp update \
  --name ca-fine-api --resource-group rg-fine-verify-dev \
  --set-env-vars \
    AZURE_TENANT_ID=555dafe8-9dde-4f98-ac9b-904e08b28c58 \
    "AZURE_API_AUDIENCE=api://76537176-b582-4055-8b3e-cf89e84e1c08" \
    REQUIRED_APP_ROLE=admin \
    AUTH_DISABLED=false \
    "CORS_ORIGINS=https://nice-water-054d5bc00.7.azurestaticapps.net"
```

- `INVOICE_APP_ID` / `INVOICE_API_URL` は**秘密扱い**のため、ここでは設定しない
  (国税庁 API の App ID は PM が別途 secret として注入する)。
- `minReplicas=0`(scale-to-zero)を維持する。`up`/`update` では触らない。

### コスト影響

- `az containerapp up --source` は **同一 RG に ACR(Basic)を自動作成**し、クラウドで
  イメージをビルドする。ACR Basic は保管容量に応じた軽微な従量課金(概ね月 $5 前後)。
- **RG(`rg-fine-verify-dev`)を削除すれば ACR も含め一括で消える**。
- Container App 本体は `minReplicas=0` のため無アクセス時は実質無償のまま。

### 動作確認

```bash
FQDN=$(az containerapp show --name ca-fine-api \
  --resource-group rg-fine-verify-dev \
  --query properties.configuration.ingress.fqdn -o tsv)

# ルート(ヘルス)。初回はコールドスタートで数秒。
curl -i "https://$FQDN/"

# 認証: トークン無しで保護エンドポイントは 401
curl -i -X POST "https://$FQDN/api/invoice-search" \
  -H "Content-Type: application/json" \
  -d '{"invoiceNum":["T1234567890123"]}'

# CORS: 許可オリジンのプリフライトに Access-Control-Allow-Origin が付く
curl -i -X OPTIONS "https://$FQDN/api/invoice-search" \
  -H "Origin: https://nice-water-054d5bc00.7.azurestaticapps.net" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

> 実際の番号検索(NTA API)成功確認は、PM が `INVOICE_APP_ID`/`INVOICE_API_URL` を
> secret 注入した後に行う。
