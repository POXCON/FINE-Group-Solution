export const en = {
  translation: {
    appName: "FINE Group Solution",

    brand: {
      suite: "FINE Group Solution",
      signedIn: "Signed in",
    },

    common: {
      loading: "Loading...",
      light: "Light",
      dark: "Dark",
      logout: "Log out",
    },

    auth: {
      loginTitle: "Sign in",
      loginSubtitle: "Enter your store account to continue.",
      heroLead:
        "A single entry point to every FINE Group app. Sign in to access the tools available to your role.",
      email: "Email address",
      password: "Password",
      rememberMe: "Remember my sign-in",
      signIn: "Sign in",
      signingIn: "Signing in...",
      invalidCredentials: "Invalid email or password.",
      mockModeNotice:
        "Cognito is not configured. Using mock authentication for local development.",
    },

    portal: {
      title: "Apps",
      subtitle: "Choose an app to continue.",
      adminSection: "Administrator tools",
      userSection: "Everyday tools",
      comingSoon: "Coming soon",
      open: "Open",
      cards: {
        salesReview: {
          title: "Sales review",
          description: "Review store sales figures and trends.",
        },
        taxExport: {
          title: "Tax accountant export",
          description: "Export documents for your tax accountant.",
        },
        invoiceSearch: {
          title: "Invoice number search",
          description:
            "Look up qualified-invoice issuer registration numbers and verify consistency.",
        },
        salesExpenseInput: {
          title: "Sales & expense input",
          description: "Record daily sales and expenses.",
        },
        inventory: {
          title: "Inventory management",
          description: "Track stock levels and inventory.",
        },
      },
    },

    errors: {
      unexpected: "An unexpected error occurred.",
    },
  },
};

export type TranslationResource = typeof en.translation;
