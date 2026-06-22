# Docker Desktop 導入ガイド（はじめての方向け・Windows）

> **対象**: AWS デプロイ前の準備。Invoice-Search の **バックエンド(FastAPI)を Lambda 用にパッケージング**する際、CDK が Docker を使うため必要です。
> 所要時間: 約 15〜30 分（ダウンロード・再起動含む）。OS は **Windows 11 Pro / PowerShell** を前提に記載。
> 完了後 → [`Invoice-Search/infra/README.md`](../../Invoice-Search/infra/README.md) のデプロイ手順へ。最上位ルールは [`/CLAUDE.md`](../../CLAUDE.md)。

---

## ゴール（チェックリスト）
- [ ] Docker Desktop をインストールした
- [ ] PC を再起動し、Docker Desktop を起動した
- [ ] 画面左下が **緑（Engine running）** になった
- [ ] `docker run hello-world` が成功した

---

## 0. これは何？／お金はかかる？
- **Docker** は「アプリを箱（コンテナ）に詰めて、どの環境でも同じように動かす」道具。今回は **Lambda 用に Python 依存をLinux向けにビルドするためだけ**に使います（普段は意識しません）。
- **ライセンス**: 個人〜**小規模事業者（従業員250人未満 かつ 年間売上1,000万USD未満）は無料**（Docker Personal）。本件は無料対象です。

---

## 1. 事前確認：仮想化が有効か
1. `Ctrl + Shift + Esc` でタスクマネージャー →「パフォーマンス」→「CPU」。
2. 右下の **「仮想化: 有効」** を確認。
   - 「無効」の場合は PC の BIOS/UEFI で **Intel VT-x / AMD-V** を有効化（メーカーごとに手順差あり）。不明な場合はこの時点で相談ください。

---

## 2. インストール
PowerShell を開いて実行（winget が簡単）:
```powershell
winget install -e --id Docker.DockerDesktop
```
> winget が無い／GUI で入れたい場合は https://www.docker.com/products/docker-desktop/ から「Download for Windows」→ インストーラ実行でも可。

インストール途中で **「Use WSL 2 instead of Hyper-V」** が出たら **チェックのまま（推奨）** で進めます。
- WSL2 は Docker が**自動で専用環境を用意**するだけで、**あなたが WSL を操作することはありません**。
- どうしても WSL を使いたくない場合は、Windows 11 Pro なら後述の Hyper-V バックエンドに切替可能（任意）。

---

## 3. 初回起動
1. インストール後、**PC を再起動**（WSL/仮想化機能の有効化を反映）。
2. スタートメニューから **Docker Desktop** を起動。
3. 初回は次が出ることがあります:
   - **サービス規約への同意** → 「Accept」。
   - **WSL2 のインストール/更新を求められたら** 指示に従って完了（自動）。
   - **サインイン画面** → **「Skip」/「Continue without signing in」で OK**（アカウント不要）。
4. しばらく待つと、左下のクジラアイコンと **「Engine running」** が **緑** になります。これで準備完了。

---

## 4. 動作確認（PowerShell）
```powershell
docker --version           # 例: Docker version 27.x.x
docker info                # エラーなく情報が出れば OK
docker run hello-world     # "Hello from Docker!" が出れば成功
```
> `docker run hello-world` は小さなテスト用イメージを取得して実行します。「Hello from Docker!」が表示されれば Docker は正常です。

---

## 5. （任意）設定の調整
Docker Desktop → 右上の歯車（Settings）:
- **General → Start Docker Desktop when you sign in**: デプロイ時だけ使うならオフでも可。
- **Resources → メモリ**: 既定（数 GB）で十分。
- **(任意) Hyper-V バックエンドに切替**: Settings → General の **「Use the WSL 2 based engine」のチェックを外す**（Windows 11 Pro のみ）。WSL を一切使いたくない場合のみ。通常は WSL2 のままで問題ありません。

---

## 6. 完了 → デプロイへ
**「Engine running」（緑）かつ `docker run hello-world` 成功**を確認できたら準備完了です。
→ [`Invoice-Search/infra/README.md`](../../Invoice-Search/infra/README.md) の「デプロイ手順」へ進んでください（SSM パラメータ作成 → `cdk bootstrap` → デプロイ）。

> デプロイ中に Docker が使われるのは主に `cdk deploy InvoiceSearchApi`（Lambda の依存ビルド）です。その間 Docker Desktop は起動したままにしてください。

---

## 7. よくあるつまずき（Troubleshooting）
| 症状 | 対処 |
|---|---|
| `docker : 用語 ... 認識されません` | PowerShell を開き直す／再起動。Docker Desktop が起動しているか確認。 |
| 起動が「Docker Desktop starting…」のまま進まない | 一度終了して再起動。仮想化が有効か（手順1）を再確認。WSL 更新: `wsl --update` を管理者 PowerShell で実行。 |
| `hello-world` で `Cannot connect to the Docker daemon` | Docker Desktop が「Engine running（緑）」になってから再実行。 |
| WSL 関連エラー（`WSL 2 installation is incomplete` 等） | 管理者 PowerShell で `wsl --install` または `wsl --update` → 再起動。 |
| 仮想化が有効にできない | 物理PCの BIOS 設定が必要。機種名を添えてご相談ください。 |
| 会社規模が大きく有料が心配 | 250人未満 かつ 売上1,000万USD未満なら無料。該当しない場合のみ要ライセンス。 |

> 解決しない場合は、表示されているエラー文をそのまま貼ってください。即サポートします。
