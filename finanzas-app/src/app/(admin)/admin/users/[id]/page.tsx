import AdminUserDetailClient from "@/components/AdminUserDetailClient";

export const metadata = { title: "Detalle de usuario — Admin Finora" };

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminUserDetailClient userId={id} />;
}
