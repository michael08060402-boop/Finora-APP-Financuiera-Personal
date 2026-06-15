# Finora — Control Financiero Personal

Aplicación web de finanzas personales construida con Next.js. Permite gestionar transacciones, cuentas, presupuestos, metas de ahorro, deudas y exportar reportes.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | [Next.js 16.2.9](https://nextjs.org) — App Router + Turbopack |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS v4 |
| Base de datos | PostgreSQL vía [Supabase](https://supabase.com) |
| ORM | [Prisma v5](https://www.prisma.io) |
| Autenticación | [NextAuth v5 beta](https://authjs.dev) — Credentials + Google OAuth |
| Animaciones | [Framer Motion v12](https://www.framer.com/motion) |
| Íconos | [Lucide React](https://lucide.dev) |
| Gráficas | [Recharts v3](https://recharts.org) |
| PDF Export | [jsPDF v4](https://github.com/parallax/jsPDF) |
| CSV Import | [PapaParse v5](https://www.papaparse.com) |
| Utilidades | clsx, bcryptjs |

---

## Funcionalidades

- **Dashboard** — balance total, ingresos/gastos, score financiero, transacciones recientes
- **Transacciones** — CRUD completo con categorías, filtros y búsqueda
- **Cuentas** — Efectivo, Yape, Plin, Bancaria, Crédito, Ahorros
- **Presupuestos** — límites mensuales por categoría con alertas visuales
- **Metas** — objetivos de ahorro con barra de progreso
- **Deudas** — seguimiento de deudas con estado y pagos parciales
- **Reportes** — gráficas de evolución e ingresos vs gastos
- **Exportar** — PDF y CSV con filtros de fecha
- **Historial** — log de actividad del usuario
- **Búsqueda global** — Ctrl+K para buscar en todo el sistema
- **Configuración** — moneda (PEN/USD/EUR), idioma (ES/EN), notificaciones
- **Autenticación** — registro con email+contraseña y login con Google

---

## Inicio rápido

```bash
cd "C:\Users\Asus\OneDrive\Escritorio\Finanzas_Personales_APP\finanzas-app"
npm run dev
```

Abrir en el navegador: [http://localhost:3000](http://localhost:3000)

---

## Variables de entorno

El archivo `.env.local` debe contener:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Base de datos

```bash
# Aplicar migraciones
npx prisma migrate dev

# Abrir Prisma Studio (visualizador)
npx prisma studio
```

---

## Estructura del proyecto

```
src/
├── app/                  # Rutas y páginas (App Router)
│   ├── api/              # Endpoints REST
│   ├── dashboard/
│   ├── transacciones/
│   ├── cuentas/
│   ├── presupuestos/
│   ├── metas/
│   ├── deudas/
│   ├── reportes/
│   ├── exportar/
│   ├── historial/
│   ├── perfil/
│   └── configuracion/
├── components/           # Componentes React reutilizables
└── lib/                  # Prisma client, utilidades, i18n
prisma/
└── schema.prisma         # Modelos de base de datos
auth.ts                   # Configuración de NextAuth
```
