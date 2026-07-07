# Azure アカウント初期整備ガイド（はじめての方向け・ゼロから）

> **対象**: Azure をはじめて使う方。**この 1 枚で「デプロイを始められる状態」までを作ります。**
> 所要時間: 約 30–45 分（メール確認・アプリ登録の操作含む）。OS は **Windows 11 / PowerShell** を前提に記載。
> 次の手順: 本ガイド完了後に [azure-deployment.md](azure-deployment.md) へ進みます。最上位ルールは [`/CLAUDE.md`](../../CLAUDE.md)。

---

## このガイドのゴール（チェックリスト）

- [ ] Azure サブスクリプションを作成した（**無料枠で月額 0–3 USD の低コスト運用**）
- [ ] **Azure CLI（`az` コマンド）** を PC に入れた
- [ ] **azd（Azure Developer CLI）** を PC に入れた
- [ ] **Azure Entra ID アプリ登録**の概要を理解した（詳細は本ガイド）
- [ ] **Bicep・Docker** が PC で動作することを確認した
- [ ] `az login` で疎通確認できた

---

## 用語ミニ辞典（最初に 1 分だけ）

| 用語 | かんたん説明 |
|---|---|
| **サブスクリプション** | Azure のリソース（VM・DB・Web アプリ等）の単位。プロジェクト毎に 1 つ。 |
| **リソースグループ** | 関連リソースをまとめるフォルダ。本プロジェクトでは `rg-fine-grp-dev`。 |
| **Entra ID（旧 Azure AD）** | ユーザー認証・アクセス制御。FINE グループの店舗ユーザーはここで管理。 |
| **AppRoles** | Entra ID 内で、ユーザーに `admin`/`store`/`manager` 等のロール を割り当てる仕組み。 |
| **Static Web Apps** | React SPA を簡単にホストする Azure サービス。ほぼ無料。 |
| **Container Apps** | Docker コンテナ（FastAPI など）を動かす Azure サービス。scale-to-zero 対応。 |
| **Bicep** | Azure リソースをコードで定義する言語。デプロイ時に自動生成。 |
| **Azure CLI** | PC のターミナルから Azure を操作する道具（`az` コマンド）。 |

> **コスト安心について**: 本構成は低コスト設計（DEV環境はほぼ無料枠）です。詳しくは [`/CLAUDE.md` §3](../../CLAUDE.md) 参照。

---

## STEP 1. Azure サブスクリプションを作成する

> **注意**: 既に Azure アカウント（Microsoft 365 / Office 365 / Hotmail など）がある場合、そのアカウントでログインすると自動的にサブスクリプションが関連付けられる場合があります。まずは [Azure Portal](https://portal.azure.com/) にアクセスして確認してください。

### 1-1. アカウントを用意する

1. ブラウザで **https://azure.microsoft.com/ja-jp/** を開く。
2. 右上の **「サインアップ」** をクリック。
3. 次を入力:
   - **Microsoft アカウント** 新規作成 または 既存 Hotmail/Microsoft アカウント
   - **住所・電話番号**（ビジネス用途推奨）
   - **支払い情報（クレジットカード）**（本人確認のため一時的に少額の与信確認が走ります）
4. **メール確認**（送信されたコードを入力）

### 1-2. 無料枠の確認

1. サインイン後、[Azure Portal](https://portal.azure.com/) を開く。
2. 左上メニュー → **「コスト管理 + 課金」** → **「アクティブな予算」** を確認。
3. **無料クレジット（$200 / 12 ヶ月）** の表示があれば、新規登録特典が有効。

> 本プロジェクトの月額予想: **0–3 USD**。無料クレジットで十分カバーされます。

---

## STEP 2. Azure CLI と azd をインストールする

### 2-1. Azure CLI（`az` コマンド）

**Windows PowerShell（管理者）で以下を実行**:

```powershell
# Chocolatey 経由でインストール（推奨）
choco install azure-cli

# または：MSI インストーラを直接ダウンロード
# https://aka.ms/installazurecliwindows からダウンロード・実行
```

インストール後、PowerShell を再起動して確認:
```powershell
az --version
```

OK 想定出力例: `azure-cli 2.60.0`

### 2-2. Azure Developer CLI（`azd` コマンド）

```powershell
# Windows Package Manager 経由
winget install Microsoft.AzureCLI

# または：公式ドキュメントの手順に従う
# https://aka.ms/azure-dev/install-azd
```

確認:
```powershell
azd version
```

OK 想定出力例: `Azure Developer CLI version 1.x.x`

---

## STEP 3. Docker Desktop をインストールする

（本手順は詳細な [docker-desktop-setup.md](docker-desktop-setup.md) を参照。簡潔版）

```powershell
# Windows Package Manager 経由
winget install Docker.DockerDesktop

# または：https://www.docker.com/products/docker-desktop から直接ダウンロード
```

インストール後、Docker Desktop を起動。PowerShell で確認:
```powershell
docker --version
```

OK 想定出力例: `Docker version 26.x.x`

---

## STEP 4. Azure CLI にログインする

```powershell
az login
```

ブラウザが自動で開き、Microsoft アカウントでサインイン。
ターミナルに JSON が表示されれば成功。テナント ID・サブスクリプション ID をメモしておきます（後で使用）。

---

## STEP 5. Entra ID アプリ登録（概要）

> **詳細な設定は別ドキュメント**で取り扱います。ここでは概要のみ。

### 5-1. アプリ登録へのアクセス

1. [Azure Portal](https://portal.azure.com/) にログイン。
2. 検索バーに **「アプリ登録」** と入力 → **「アプリ登録」** を選択。
3. 上部の **「+ 新規登録」** をクリック。

### 5-2. 基本設定

| 項目 | 値 |
|------|-----|
| **名前** | `fine-grp-web` （例） |
| **サポートされているアカウントの種類** | 「この組織ディレクトリ内のアカウントのみ」 |
| **リダイレクト URI** | `Single Page Application (SPA)` を選択 → `http://localhost:5173/auth/callback` (開発用) |

### 5-3. クライアント ID を記録

1. 登録済みアプリ → **「概要」** を開く。
2. **「アプリケーション (クライアント) ID」** をコピー → 後で環境変数として使用（`VITE_AZURE_CLIENT_ID` など）。

---

## STEP 6. 次のステップ

OK 完了の目安:
- `az login` で認証完了
- `docker --version` でバージョン表示
- `azd version` でバージョン表示
- Entra ID アプリ登録完了・クライアント ID メモ済み

次は [azure-deployment.md](azure-deployment.md) で、実際のデプロイ手順に進みます。

---

## トラブルシュート

### Q. `az login` がうまくいかない

**A:** 
1. Azure CLI が正しくインストールされているか再確認: `az --version`
2. ブラウザが自動で開かない場合、手動でターミナルのリンクを開く
3. 複数のテナントがある場合、`az account set --subscription <ID>` でサブスクリプションを指定

### Q. Docker が起動しない

**A:**
1. Docker Desktop が Windows で実行中か確認（タスクバー左下のアイコン）
2. WSL2（Windows Subsystem for Linux）が有効か確認: `wsl --list --verbose`
3. Hyper-V が有効か確認（コントロールパネル → プログラム → Windows の機能の有効化または無効化）

詳細は [docker-desktop-setup.md](docker-desktop-setup.md) のトラブルシューティングを参照。

---

**次の手順**: 本ガイド完了後、[azure-deployment.md](azure-deployment.md) に進んでください。
