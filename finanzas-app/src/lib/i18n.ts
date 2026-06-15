export type Lang = "es" | "en";

const translations = {
  es: {
    nav_dashboard:    "Inicio",
    nav_search:       "Buscar",
    nav_transactions: "Transacciones",
    nav_accounts:     "Cuentas",
    nav_budgets:      "Presupuestos",
    nav_goals:        "Metas",
    nav_reports:      "Reportes",
    nav_export:       "Exportar",
    nav_history:      "Historial",
    nav_debts:        "Deudas",
    nav_profile:      "Perfil",
    nav_settings:     "Configuración",

    dash_greeting:     "Hola",
    dash_subtitle:     "Aquí está tu resumen financiero",
    dash_total_balance: "Balance Total",
    dash_total_income:  "Ingresos Totales",
    dash_total_expense: "Gastos Totales",
    dash_recent:       "Transacciones Recientes",
    dash_see_all:      "Ver todas",
    dash_no_txs:       "Sin transacciones aún",
    dash_add_one:      "Añade tu primera transacción",

    search_placeholder: "Buscar transacciones...",
    logout:             "Cerrar sesión",
    quick_action:       "Acción rápida",
    income:             "Ingreso",
    expense:            "Gasto",
    description:        "Descripción",
    amount:             "Monto",
    category:           "Categoría",
    quick_add_tx:       "Agregar transacción",

    tx_title:    "Transacciones",
    tx_subtitle: "Gestiona tus ingresos y gastos",
    tx_new:      "Nueva transacción",

    acc_title:    "Cuentas",
    acc_subtitle: "Gestiona tus cuentas bancarias",
    acc_new:      "Nueva cuenta",

    bud_title:     "Presupuestos",
    bud_subtitle:  "Controla tus límites de gasto",
    bud_new:       "Nuevo presupuesto",
    bud_total:     "Total presupuestado",
    bud_spent:     "Gastado",
    bud_available: "Disponible",

    goal_title:    "Metas",
    goal_subtitle: "Sigue el progreso de tus objetivos",
    goal_new:      "Nueva meta",

    his_title:    "Historial",
    his_subtitle: "Registro de actividad",
  },
  en: {
    nav_dashboard:    "Dashboard",
    nav_search:       "Search",
    nav_transactions: "Transactions",
    nav_accounts:     "Accounts",
    nav_budgets:      "Budgets",
    nav_goals:        "Goals",
    nav_reports:      "Reports",
    nav_export:       "Export",
    nav_history:      "History",
    nav_debts:        "Debts",
    nav_profile:      "Profile",
    nav_settings:     "Settings",

    dash_greeting:      "Hello",
    dash_subtitle:      "Here's your financial summary",
    dash_total_balance: "Total Balance",
    dash_total_income:  "Total Income",
    dash_total_expense: "Total Expenses",
    dash_recent:        "Recent Transactions",
    dash_see_all:       "See all",
    dash_no_txs:        "No transactions yet",
    dash_add_one:       "Add your first transaction",

    search_placeholder: "Search transactions...",
    logout:             "Log out",
    quick_action:       "Quick action",
    income:             "Income",
    expense:            "Expense",
    description:        "Description",
    amount:             "Amount",
    category:           "Category",
    quick_add_tx:       "Add transaction",

    tx_title:    "Transactions",
    tx_subtitle: "Manage your income and expenses",
    tx_new:      "New transaction",

    acc_title:    "Accounts",
    acc_subtitle: "Manage your bank accounts",
    acc_new:      "New account",

    bud_title:     "Budgets",
    bud_subtitle:  "Control your spending limits",
    bud_new:       "New budget",
    bud_total:     "Total budgeted",
    bud_spent:     "Spent",
    bud_available: "Available",

    goal_title:    "Goals",
    goal_subtitle: "Track your objective progress",
    goal_new:      "New goal",

    his_title:    "History",
    his_subtitle: "Activity log",
  },
} as const;

export type TKey = keyof typeof translations.es;

export function getT(lang: Lang): (key: TKey) => string {
  return (key: TKey) => (translations[lang][key] as string) ?? key;
}

export function makeFormatter(currency: string): (n: number) => string {
  return (n: number) =>
    new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(n);
}
