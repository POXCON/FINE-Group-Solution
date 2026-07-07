import type { TranslationResource } from "./en";

export const ja: { translation: TranslationResource } = {
  translation: {
    appName: "FINE Group Solution",

    brand: {
      suite: "FINE Group Solution",
      signedIn: "サインイン中",
    },

    common: {
      loading: "読み込み中...",
      light: "ライト",
      dark: "ダーク",
      logout: "ログアウト",
    },

    auth: {
      loginTitle: "ログイン",
      loginSubtitle: "店舗アカウントでサインインしてください。",
      heroLead:
        "FINE グループの各アプリへの単一の入口です。サインインすると、あなたのロールで利用できるツールが表示されます。",
      email: "メールアドレス",
      password: "パスワード",
      rememberMe: "ログイン情報を記憶する",
      signIn: "ログイン",
      signInWithMicrosoft: "Microsoft でサインイン",
      signingIn: "ログイン中...",
      invalidCredentials: "メールアドレスまたはパスワードが正しくありません。",
      mockModeNotice:
        "Microsoft Entra ID が未設定のため、開発用モック認証を使用しています。",
    },

    portal: {
      title: "アプリ",
      subtitle: "利用するアプリを選択してください。",
      adminSection: "管理者機能",
      userSection: "一般ユーザー機能",
      comingSoon: "準備中",
      open: "開く",
      cards: {
        salesReview: {
          title: "売上確認",
          description: "店舗の売上数値と推移を確認します。",
        },
        taxExport: {
          title: "税理士向け資料出力",
          description: "税理士向けの資料を出力します。",
        },
        invoiceSearch: {
          title: "インボイス番号検索",
          description:
            "適格請求書発行事業者の登録番号を照会し、自社データとの整合性を確認します。",
        },
        salesExpenseInput: {
          title: "売上・支出入力",
          description: "日々の売上と支出を入力します。",
        },
        inventory: {
          title: "在庫管理",
          description: "在庫数と棚卸を管理します。",
        },
      },
    },

    errors: {
      unexpected: "予期しないエラーが発生しました。",
    },
  },
};
