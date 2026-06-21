import type { TranslationResource } from "./en";

export const ja: { translation: TranslationResource } = {
  translation: {
    appName: "インボイス検索アプリ",

    brand: {
      suite: "FINE Group Solution",
      menu: "メニュー",
      signedIn: "サインイン中",
    },

    common: {
      search: "検索",
      reset: "リセット",
      download: "ダウンロード",
      cancel: "キャンセル",
      confirm: "確認",
      save: "保存",
      delete: "削除",
      loading: "読み込み中...",
      yes: "はい",
      no: "いいえ",
      close: "閉じる",
      light: "ライト",
      dark: "ダーク",
      language: "言語",
      logout: "ログアウト",
    },

    nav: {
      dashboard: "ダッシュボード",
      search: "インボイス検索",
      consistencyCheck: "整合性チェック",
    },

    dashboard: {
      greeting: "インボイス検索アプリへようこそ！",
      goTo: "移動",
    },

    search: {
      title: "インボイス番号検索",
      placeholder: "インボイス番号（13桁、先頭のTは省略可）",
      addRow: "行を追加",
      removeRow: "行を削除",
      pasteHint: "改行またはカンマ区切りで複数件を貼り付けできます",
      invalidFormat: "形式が無効です。13桁の数字（先頭Tは任意）で入力してください。",
      noValidInput: "有効なインボイス番号を1件以上入力してください。",
      searchError: "インボイス番号の検索に失敗しました。",
      noDataToDownload: "ダウンロード可能なデータがありません。",
      column: {
        invoiceNumber: "インボイス番号",
        companyName: "会社名",
        address: "住所",
        tradeName: "屋号",
        invoiceCheck: "登録状況",
        actions: "操作",
      },
      registered: "登録済み",
      notRegistered: "未登録",
      unknown: "不明",
      emptyState: "検索結果がありません。上部でインボイス番号を検索してください。",
      resultsTitle: "検索結果",
      resultCount: "{{count}}件",
    },

    consistencyCheck: {
      title: "整合性チェック",
      uploadCardTitle: "CSVアップロード",
      uploadFile: "CSVファイルをアップロード",
      uploadHint: "ここにCSVファイルをドラッグ&ドロップ、またはクリックして選択",
      selectedFile: "選択されたファイル：",
      noFileSelected: "ファイル未選択",
      check: "検証",
      fileNotSelected: "ファイルを選択してください。",
      fileReadError: "ファイルの読み込みに失敗しました。",
      searchError: "インボイス番号の検索に失敗しました。",
      rowInvalid: "行{{row}}：インボイス番号が無効です：{{value}}",
      consistent: "整合性あり",
      merge: "マージ",
      mergeConfirmTitle: "マージの確認",
      mergeConfirmBody: "選択したデータを公表APIの結果とマージしますか？",
      emptyState: "CSVファイルをアップロードして整合性をチェックしてください。",
    },

    auth: {
      loginTitle: "ログイン",
      loginSubtitle: "店舗アカウントでサインインしてください。",
      heroLead:
        "適格請求書発行事業者の登録番号を素早く照会し、自社データとの整合性を確認できます。正確で監査にも対応した業務ツールです。",
      email: "メールアドレス",
      password: "パスワード",
      signIn: "ログイン",
      signingIn: "ログイン中...",
      invalidCredentials: "メールアドレスまたはパスワードが正しくありません。",
      mockModeNotice: "Cognito が未設定のため、開発用モック認証を使用しています。",
      required: "この項目は必須です。",
      invalidEmail: "有効なメールアドレスを入力してください。",
      passwordTooShort: "パスワードは8文字以上で入力してください。",
    },

    errors: {
      unexpected: "予期しないエラーが発生しました。",
      network: "ネットワークエラーが発生しました。もう一度お試しください。",
    },
  },
};
