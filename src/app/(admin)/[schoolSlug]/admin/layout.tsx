import Link from "next/link";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  await requireAdminSchoolAccess({
    schoolSlug,
    nextPath: `/${schoolSlug}/admin`,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-4">
          <Link href={`/${schoolSlug}/admin`} className="text-sm font-semibold text-slate-900">
            Panel
          </Link>
          <Link href={`/${schoolSlug}`} className="text-sm font-medium text-slate-600">
            Ver público
          </Link>
        </div>
      </header>

      {children}
    </div>
  );
}
