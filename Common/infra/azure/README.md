# FINE Group Solution — Azure 基盤 IaC（DEV 検証 / 無料枠）

AWS → Azure 移行の一環として、**個人テナントの検証用（DEV）** の Azure 基盤を
**Bicep** でスキャフォールドする。無料枠 / 最安構成のみを対象とし、課金の出る SKU・
Front Door・VNet・Private Endpoint は含めない（本番 PRD 構成は別 Issue #68）。

参照 Issue: **#70**（親 Epic #63 / 統括 #62）

> **命名統一（#90）**: 全リソースを **fine-grp 命名**へ統一し、RG を **`rg-fine-grp-dev`** へ
> 再プロビジョンした（RG はリネーム不可のため新規作成）。旧 `rg-fine-verify-dev` は
> PM が新環境の疎通確認・NTA 秘密注入の完了後に削除する。

---

## プロビジョニング内容（DEV・無料/最安）

| # | リソース | 名前 | リージョン | 備考 |
|---|----------|------|-----------|------|
| 1 | Resource Group | `rg-fine-grp-dev` | japaneast | 全リソースの入れ物 |
| 2 | Log Analytics ワークスペース | `log-fine-grp-dev` | japaneast | PerGB2018・保持 30 日 |
| 3 | Container Apps Environment | `cae-fine-grp-dev` | japaneast | Consumption |
| 4 | Container Registry (ACR) | `acrfinegrpdev` | japaneast | **Basic**・admin 有効・実イメージ格納先 |
| 5 | Container App | `ca-fine-grp-api` | japaneast | 実イメージ（ACR）・外部 Ingress(8000)・**minReplicas=0** |
| 6 | Static Web App | `swa-fine-grp-web` | **eastasia** | **Free SKU**（japaneast 非対応のため eastasia） |

- Container App は Bicep ではプレースホルダ公開イメージ（`aci-helloworld` / port 80）で作成し、
  デプロイ後に CLI で **ACR の実イメージ（port 8000）** へ差し替える（秘密のレジストリ資格情報を
  git へ出さないため）。実イメージのビルド・push 手順は本書「backend のコンテナ化」節を参照。
- **ACR Tasks（クラウドビルド）は当サブスクリプションで不許可**のため、backend イメージは
  **ローカル Docker でビルド → ACR へ push → `az containerapp update --image`** で反映する。

> **Container Apps Environment のクォータ（重要）**: 1 サブスクリプションにつき **1 リージョン 1 環境**
> まで。旧 `cae-fine-verify-dev` が存在する間は新 `cae-fine-grp-dev` を同一 Japan East に作成できない。
> 再プロビジョンの際は旧環境の削除（またはクォータ引き上げ）が前提となる。
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
│   ├── container-registry.bicep      # Azure Container Registry（Basic / 実イメージ格納先）
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
| `resourceGroupName` | `rg-fine-grp-dev` | Resource Group 名 |

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
  --name fine-azure-grp-dev \
  --location japaneast \
  --template-file Common/infra/azure/main.bicep
```

### 出力（outputs）
- `apiIngressFqdn` — Container App（API）の外部 Ingress FQDN
- `staticWebAppDefaultHostname` — Static Web App の defaultHostname
- `acrLoginServer` — ACR のログインサーバ（例 `acrfinegrpdev.azurecr.io`）
- `acrName` — ACR 名
- `resourceGroupNameOut` — 作成した Resource Group 名

出力の取得例:
```bash
az deployment sub show \
  --name fine-azure-grp-dev \
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
az group delete --name rg-fine-grp-dev --yes --no-wait
```

> Static Web App は eastasia だが同一 RG 内に作成されるため、RG 削除で一括破棄される。
> ACR も同一 RG 内のため一括で消える。

---

## タグの確認

Azure ポータルの Resource Group 一覧 / 各リソースの「タグ」で以下を確認できる:

`Project=FINE-Group-Solution` / `Environment=verify-dev` / `System=platform` / `ManagedBy=bicep`

---

## フロント2アプリの SWA 配信(同一オリジン・パス分割 / #76)

移行済みの2フロント(Common ポータル / Invoice-Search)を、`swa-fine-grp-web`(Free)へ
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
TOKEN=$(az staticwebapp secrets list --name swa-fine-grp-web \
  --resource-group rg-fine-grp-dev --query "properties.apiKey" -o tsv)
npx -y @azure/static-web-apps-cli deploy Common/infra/azure/swa-dist \
  --deployment-token "$TOKEN" --env production
```

### Entra リダイレクト URI の追加(初回のみ)

SWA の `defaultHostname` を取得し、そのオリジンをアプリ登録の **SPA redirectUris** に追加する
(既存の localhost は残す)。ポータルは `redirectUri = window.location.origin`、
Invoice-Search は `origin + /invoice-search/` を使うため **両方**を登録する。

```bash
HOSTNAME=$(az staticwebapp show --name swa-fine-grp-web \
  --resource-group rg-fine-grp-dev --query "defaultHostname" -o tsv)
OBJECT_ID=$(az ad app show --id 76537176-b582-4055-8b3e-cf89e84e1c08 --query id -o tsv)

# spa.redirectUris は既存分も含めた完全な配列で PATCH する(置換されるため)。
# 末尾スラッシュ有無の両方＋ /invoice-search/ を登録する。
az rest --method PATCH \
  --url "https://graph.microsoft.com/v1.0/applications/${OBJECT_ID}" \
  --headers "Content-Type=application/json" \
  --body '{"spa":{"redirectUris":[
    "http://localhost:4280/","http://localhost:5173/",
    "https://'"${HOSTNAME}"'/","https://'"${HOSTNAME}"'",
    "https://'"${HOSTNAME}"'/invoice-search/"
  ]}}'
```

> `swa-fine-grp-web` の `defaultHostname` は SWA 作成後に確定する(fine-grp 命名は
> 付与できず、ランダムな `*.azurestaticapps.net` になる)。上記コマンドで取得して置換する。

### 動作確認

```bash
BASE=https://<swa-fine-grp-web の defaultHostname>
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

## Invoice-Search backend のコンテナ化＋ Container App デプロイ(#75 / #90)

プレースホルダ(`aci-helloworld`)だった `ca-fine-grp-api` を、移行済み FastAPI backend の
**実イメージ**へ差し替える。当サブスクリプションは **ACR Tasks(クラウドビルド)不許可**のため、
**ローカル Docker でビルド → `acrfinegrpdev` へ push → `az containerapp update --image`** で反映する。

### コンテナ構成

| ファイル | 役割 |
|----------|------|
| `Invoice-Search/backend/Dockerfile` | `python:3.12-slim` / requirements インストール / **非 root**(uid 10001) / `uvicorn app.main:app` を **8000** で起動。 |
| `Invoice-Search/backend/.dockerignore` | tests・キャッシュ・`.env*`(秘密)等を除外。 |

- FastAPI 側は `CORSMiddleware` を `settings.cors_origins`(= `CORS_ORIGINS` をカンマ分割)で
  構成済み。`Authorization`/`Content-Type` を許可、`allow_credentials=true`。
- 認証は `AUTH_DISABLED=false` で Entra JWT 検証を有効化(トークン無し→401、
  ロール不足→403)。

### デプロイ手順

前提: `az login` 済み・対象サブスクリプション選択済み。

```bash
az account set --subscription <SUBSCRIPTION_ID>
ACR=acrfinegrpdev
RG=rg-fine-grp-dev
APP=ca-fine-grp-api
TAG=$(git rev-parse --short HEAD)

# 1) ローカルビルド → ACR push(ACR Tasks は使わない)
az acr login --name "$ACR"
docker build -t "$ACR.azurecr.io/invoice-search-backend:$TAG" Invoice-Search/backend
docker push "$ACR.azurecr.io/invoice-search-backend:$TAG"

# 2) ACR pull 用の管理者資格情報を Container App の secret として登録(git へは出さない)
ACR_USER=$(az acr credential show -n "$ACR" --query username -o tsv)
ACR_PASS=$(az acr credential show -n "$ACR" --query "passwords[0].value" -o tsv)
az containerapp registry set \
  --name "$APP" --resource-group "$RG" \
  --server "$ACR.azurecr.io" --username "$ACR_USER" --password "$ACR_PASS"

# 3) 実イメージへ差し替え＋ ingress を 8000 へ
az containerapp update --name "$APP" --resource-group "$RG" \
  --image "$ACR.azurecr.io/invoice-search-backend:$TAG"
az containerapp ingress update --name "$APP" --resource-group "$RG" \
  --type external --target-port 8000
```

差し替え後、非秘密の環境変数を設定する(**秘密は含めない**):

```bash
az containerapp update \
  --name ca-fine-grp-api --resource-group rg-fine-grp-dev \
  --set-env-vars \
    AZURE_TENANT_ID=555dafe8-9dde-4f98-ac9b-904e08b28c58 \
    "AZURE_API_AUDIENCE=api://76537176-b582-4055-8b3e-cf89e84e1c08" \
    REQUIRED_APP_ROLE=admin \
    AUTH_DISABLED=false \
    "CORS_ORIGINS=https://<swa-fine-grp-web の defaultHostname>"
```

- `INVOICE_APP_ID` / `INVOICE_API_URL` は**秘密扱い**のため、ここでは設定しない
  (国税庁 API の App ID は PM が別途 secret として注入する)。
- `minReplicas=0`(scale-to-zero)を維持する。`update` では触らない。

### コスト影響

- ACR は Bicep で **同一 RG に Basic** を作成する。保管容量に応じた軽微な従量課金(概ね月 $5 前後)。
- **RG(`rg-fine-grp-dev`)を削除すれば ACR も含め一括で消える**。
- Container App 本体は `minReplicas=0` のため無アクセス時は実質無償のまま。

### 動作確認

```bash
FQDN=$(az containerapp show --name ca-fine-grp-api \
  --resource-group rg-fine-grp-dev \
  --query properties.configuration.ingress.fqdn -o tsv)

# ルート(ヘルス)。初回はコールドスタートで数秒。
curl -i "https://$FQDN/"

# 認証: トークン無しで保護エンドポイントは 401
curl -i -X POST "https://$FQDN/api/invoice-search" \
  -H "Content-Type: application/json" \
  -d '{"invoiceNum":["T1234567890123"]}'

# CORS: 許可オリジンのプリフライトに Access-Control-Allow-Origin が付く
curl -i -X OPTIONS "https://$FQDN/api/invoice-search" \
  -H "Origin: https://<swa-fine-grp-web の defaultHostname>" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

> 実際の番号検索(NTA API)成功確認は、PM が `INVOICE_APP_ID`/`INVOICE_API_URL` を
> secret 注入した後に行う。
