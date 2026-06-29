import { auth } from "../auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isProtected  = nextUrl.pathname.startsWith("/dashboard") ||
                       nextUrl.pathname.startsWith("/transacciones") ||
                       nextUrl.pathname.startsWith("/cuentas") ||
                       nextUrl.pathname.startsWith("/presupuestos") ||
                       nextUrl.pathname.startsWith("/metas") ||
                       nextUrl.pathname.startsWith("/reportes") ||
                       nextUrl.pathname.startsWith("/exportar") ||
                       nextUrl.pathname.startsWith("/historial") ||
                       nextUrl.pathname.startsWith("/deudas") ||
                       nextUrl.pathname.startsWith("/perfil") ||
                       nextUrl.pathname.startsWith("/configuracion") ||
                       nextUrl.pathname.startsWith("/buscar") ||
                       nextUrl.pathname.startsWith("/sugerencias") ||
                       isAdminRoute;

  if (!session && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user     = session?.user as any;
  const role     = user?.role;
  const isActive = user?.isActive;

  if (session && isActive === false) {
    return NextResponse.redirect(new URL("/login?error=suspended", req.url));
  }

  if (isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
};
