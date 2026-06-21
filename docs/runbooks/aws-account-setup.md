# AWS アカウント初期整備ガイド（はじめての方向け・ゼロから）

> **対象**: AWS をはじめて使う方。**この 1 枚で「デプロイを始められる状態」までを作ります。**
> 所要時間: 約 60–90 分（カード・電話認証の待ち時間含む）。OS は **Windows 11 / PowerShell** を前提に記載。
> 次の手順: 本ガイド完了後に [aws-deployment.md](aws-deployment.md) へ進みます。最上位ルールは [`/CLAUDE.md`](../../CLAUDE.md)。

---

## このガイドのゴール（チェックリスト）

- [ ] AWS アカウントを作成した
- [ ] ルートユーザーに **MFA（多要素認証）** を設定した
- [ ] **予算アラート（Budgets）** を設定した（使いすぎ防止）
- [ ] 日常作業用の **管理者ユーザー**（IAM Identity Center）を作成した
- [ ] PC に **AWS CLI / Node.js / Python / CDK** を入れた
- [ ] `aws sts get-caller-identity` で疎通確認できた

---

## 用語ミニ辞典（最初に 1 分だけ）

| 用語 | かんたん説明 |
|---|---|
| **リージョン** | データセンターのある地域。本プロジェクトは **東京（ap-northeast-1）** を使う。 |
| **ルートユーザー** | アカウント作成時のメールで入る「最強の管理者」。**普段は使わない**。 |
| **IAM ユーザー / IAM Identity Center** | 日常作業用のログイン。権限を絞って使う。 |
| **MFA** | パスワード＋スマホ等の二段階認証。乗っ取り防止に必須。 |
| **Budgets（予算）** | 月いくら使ったら通知する、という見張り番。 |
| **CLI** | PC のターミナルから AWS を操作する道具（`aws` コマンド）。 |
| **CDK** | コードでインフラを作る道具。手作業より安全で再現可能。 |

> **お金の不安について**: 本構成は低コスト設計（アイドル時はほぼ課金されない）です。さらに下記の **予算アラート** を必ず設定するので、使いすぎは事前に検知できます。まずは安心して進めてください。

---

## STEP 1. アカウントを作成する

1. ブラウザで **https://aws.amazon.com/jp/** を開き、右上の **「アカウントを作成」** をクリック。
2. 次を入力:
   - **ルートユーザーのメールアドレス**（会社の管理用メール推奨）
   - **AWS アカウント名**（例: `FINE-Group`）
3. メールに届く **確認コード** を入力。
4. **ルートユーザーのパスワード** を設定（長く複雑に）。
5. 連絡先情報（**ビジネス** を選択推奨）、住所・電話番号を入力。
6. **支払い情報（クレジットカード）** を登録。※本人確認のため一時的に少額の与信確認が走ることがあります。
7. **電話番号の認証**（SMS か音声）。画面の PIN を入力。
8. **サポートプラン** は一番安い **「ベーシック（無料）」** を選択。
9. 「サインアップ完了」→ 数分でアカウント有効化。

> ✅ 完了の目安: **https://console.aws.amazon.com/** にルートユーザーのメールでサインインできる。

---

## STEP 2. ルートユーザーを守る（MFA 設定）

> ルートユーザーが乗っ取られると全消し・高額請求のリスク。**必ず MFA を付けます。**

1. コンソール右上のアカウント名 → **「セキュリティ認証情報」** を開く。
2. **「多要素認証 (MFA)」** → **「MFA デバイスの割り当て」**。
3. スマホに **認証アプリ**（Google Authenticator / Microsoft Authenticator 等）を入れ、**「認証アプリ (Authenticator app)」** を選択。
4. 表示 QR をアプリで読み取り、表示される **6 桁コードを 2 回連続** で入力して登録。
5. 以後ルートのサインインで 6 桁コードが必要になることを確認。

> ✅ 完了の目安: セキュリティ認証情報に MFA デバイスが「割り当て済み」と表示。

---

## STEP 3. 予算アラートを設定する（使いすぎ防止・最重要）

> **このステップは飛ばさないでください。** 想定外課金の最初の防波堤です。

### 3-1. 請求データへのアクセスを有効化
1. アカウント名 → **「アカウント」** → **「IAM ユーザーおよびロールによる請求情報へのアクセス」** を **有効化** して保存。

### 3-2. 予算（Budgets）を作成
1. コンソール検索バーに **「Budgets」** と入力 → **AWS Budgets** を開く。
2. **「予算を作成」** → テンプレート **「月次コスト予算 (Monthly cost budget)」**。
3. 予算額: 例 **20 USD/月**（本番運用が小さいうちは十分）。
4. アラートのしきい値: **実績 80%** と **予測 100%** で通知。
5. 通知先メールを入力 → 作成。

### 3-3.（任意）無料利用枠アラート
1. **「Billing and Cost Management」** → **「請求設定」** → **「無料利用枠の使用量アラートを受信する」** にチェック。

> ✅ 完了の目安: Budgets に「月次コスト予算」が 1 件でき、通知メールアドレスが登録されている。

---

## STEP 4. 日常作業用の管理者ユーザーを作る（IAM Identity Center 推奨）

> 普段はルートを使わず、ここで作るユーザーで作業します（AWS 推奨）。

1. コンソール検索で **「IAM Identity Center」** を開き、**「有効にする」**。
   - リージョン選択を求められたら **東京（ap-northeast-1）** を選ぶ。
2. 左メニュー **「ユーザー」** → **「ユーザーを追加」**:
   - ユーザー名・メール（自分のメール）を入力して作成。
   - 届いた招待メールから **パスワード設定**＋**MFA 登録**。
3. 左メニュー **「権限セット」** → **「権限セットを作成」**:
   - 定義済み **`AdministratorAccess`** を選択して作成（学習・初期構築用。将来は最小権限へ）。
4. 左メニュー **「AWS アカウント」** → 自分のアカウントを選び **「ユーザーまたはグループを割り当て」** → STEP4-2 のユーザー＋ `AdministratorAccess` 権限セットを割り当て。
5. **アクセスポータル URL**（`https://d-xxxx.awsapps.com/start`）が発行される。これが今後のログイン入口。

> ✅ 完了の目安: アクセスポータル URL から作成ユーザーでサインインし、東京リージョンでコンソールに入れる。

> **代替（最短で進めたい場合）**: IAM Identity Center の代わりに、IAM で「ユーザー」を 1 つ作り `AdministratorAccess` を付与し、**アクセスキー**を発行する方法でも可。ただし長期アクセスキーは漏洩リスクが高いため、本ガイドは **Identity Center（短命トークン）** を推奨します。

---

## STEP 5. PC に道具をインストールする（Windows）

PowerShell を開き、以下を順に確認・導入します。**winget**（Windows 標準のインストーラ）を使うと簡単です。

```powershell
# 1) AWS CLI v2
winget install -e --id Amazon.AWSCLI
aws --version                      # 例: aws-cli/2.x.x ...

# 2) Node.js LTS（CDK / フロントビルド用）
winget install -e --id OpenJS.NodeJS.LTS
node -v ; npm -v

# 3) Python 3.12（バックエンド用。3.12.10 を推奨）
winget install -e --id Python.Python.3.12
python --version

# 4) Git（未導入なら）
winget install -e --id Git.Git

# 5) AWS CDK（グローバル）
npm install -g aws-cdk
cdk --version                      # 例: 2.x.x (build ...)
```

> インストール後はいったん PowerShell を開き直すと PATH が反映されます。

---

## STEP 6. CLI に認証情報を設定して疎通確認

IAM Identity Center を使う場合（推奨）:

```powershell
aws configure sso
# 画面の案内に従い:
#  SSO start URL    : STEP4 のアクセスポータル URL
#  SSO Region       : ap-northeast-1
#  既定 Region      : ap-northeast-1
#  出力形式         : json
#  プロファイル名   : fine-admin   ← 任意

# 以後、作業前に 1 回ログイン（ブラウザが開く）
aws sso login --profile fine-admin

# 疎通確認（アカウント ID などが返れば成功）
aws sts get-caller-identity --profile fine-admin
```

> 期待される出力（例）:
> ```json
> { "UserId": "AROA...:user", "Account": "123456789012", "Arn": "arn:aws:sts::123456789012:assumed-role/..." }
> ```

> **アクセスキー方式の場合**は `aws configure` で Access Key / Secret / Region(`ap-northeast-1`) / 出力(`json`) を入力します。

---

## 完了 🎉

ここまでで **「デプロイを始められる状態」** が整いました。
- アカウント ID（12 桁）をメモしておく（次の手順で使います）。
- 続いて **[aws-deployment.md](aws-deployment.md)** へ進んでください。

---

## よくあるつまずき（Troubleshooting）

| 症状 | 対処 |
|---|---|
| `aws` コマンドが見つからない | PowerShell を開き直す。`winget install Amazon.AWSCLI` を再実行。 |
| `aws sts get-caller-identity` が `Unable to locate credentials` | `aws sso login --profile fine-admin` を実行。プロファイル名の指定漏れに注意。 |
| サインインで MFA を求められ続ける | 端末時刻のズレが原因のことあり。スマホの時刻を自動設定に。 |
| 想定外の課金が心配 | Budgets のしきい値を下げる／Cost Explorer で日次推移を確認。dev 環境は使わない時 `cdk destroy` で消す。 |

> セキュリティ原則（[CLAUDE.md](../../CLAUDE.md) 準拠）: **ルートは常用しない／アクセスキーをコードに書かない／秘密情報は Secrets Manager**。
