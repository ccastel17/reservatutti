import Link from "next/link";
import Image from "next/image";
import { requireAdminSchoolAccess } from "@/lib/tenant/requireAdminSchoolAccess";
import { AdminTopTabs } from "@/components/admin/AdminTopTabs";

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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-4">
          <Link href={`/${schoolSlug}/admin`} className="shrink-0">
            <Image
              src="/logo_2.png"
              alt="Reservatutti"
              width={170}
              height={44}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <AdminTopTabs schoolSlug={schoolSlug} />
        </div>
      </header>

      {children}
    </div>
  );
}
