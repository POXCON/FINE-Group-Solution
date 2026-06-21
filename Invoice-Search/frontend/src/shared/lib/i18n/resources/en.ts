export const en = {
  translation: {
    appName: "Invoice Search App",

    brand: {
      suite: "FINE Group Solution",
      menu: "Menu",
      signedIn: "Signed in",
    },

    common: {
      search: "Search",
      reset: "Reset",
      download: "Download",
      cancel: "Cancel",
      confirm: "Confirm",
      save: "Save",
      delete: "Delete",
      loading: "Loading...",
      yes: "Yes",
      no: "No",
      close: "Close",
      light: "Light",
      dark: "Dark",
      language: "Language",
      logout: "Log out",
    },

    nav: {
      dashboard: "Dashboard",
      search: "Invoice Search",
      consistencyCheck: "Consistency Check",
    },

    dashboard: {
      greeting: "Welcome to Invoice Search App!",
      goTo: "Go to",
    },

    search: {
      title: "Invoice Number Search",
      placeholder: "Invoice number (13 digits, leading T optional)",
      addRow: "Add row",
      removeRow: "Remove row",
      pasteHint: "Paste multiple numbers separated by newline or comma",
      invalidFormat: "Invalid format. Expected 13 digits, optional leading T.",
      noValidInput: "Please enter at least one valid invoice number.",
      searchError: "Failed to search invoice numbers.",
      noDataToDownload: "There is no data to download.",
      column: {
        invoiceNumber: "Invoice Number",
        companyName: "Company Name",
        address: "Address",
        tradeName: "Trade Name",
        invoiceCheck: "Registration Status",
        actions: "Actions",
      },
      registered: "Registered",
      notRegistered: "Not Registered",
      unknown: "Unknown",
      emptyState: "No results yet. Search for invoice numbers above.",
      resultsTitle: "Search Results",
      resultCount: "{{count}} records",
    },

    consistencyCheck: {
      title: "Consistency Check",
      uploadCardTitle: "Upload CSV",
      uploadFile: "Upload CSV file",
      uploadHint: "Drag & drop a CSV file here, or click to select",
      selectedFile: "Selected file:",
      noFileSelected: "No file selected",
      check: "Check",
      fileNotSelected: "Please select a file.",
      fileReadError: "Failed to read file.",
      searchError: "Failed to search invoice numbers.",
      rowInvalid: "Row {{row}}: invalid invoice number: {{value}}",
      consistent: "Consistent",
      merge: "Merge",
      mergeConfirmTitle: "Confirm merge",
      mergeConfirmBody: "Do you want to merge the selected data with the public API result?",
      emptyState: "Upload a CSV file to check consistency.",
    },

    auth: {
      loginTitle: "Sign in",
      loginSubtitle: "Enter your store account to continue.",
      heroLead:
        "Look up qualified-invoice issuer registration numbers and verify them against your records — fast, accurate, and audit-ready.",
      email: "Email address",
      password: "Password",
      signIn: "Sign in",
      signingIn: "Signing in...",
      invalidCredentials: "Invalid email or password.",
      mockModeNotice: "Cognito is not configured. Using mock authentication for local development.",
      required: "This field is required.",
      invalidEmail: "Please enter a valid email address.",
      passwordTooShort: "Password must be at least 8 characters.",
    },

    errors: {
      unexpected: "An unexpected error occurred.",
      network: "Network error. Please try again.",
    },
  },
};

export type TranslationResource = typeof en.translation;
