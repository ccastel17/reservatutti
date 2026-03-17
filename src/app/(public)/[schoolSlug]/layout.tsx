import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSchoolBySlug } from "@/lib/data/schools";

export default async function PublicSchoolLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const school = await getSchoolBySlug(schoolSlug);

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const canSeeAdminLink = await (async () => {
    if (!user || !school) return false;

    const { data, error } = await supabase
      .from("school_members")
      .select("id")
      .eq("school_id", school.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return false;
    return Boolean(data);
  })();

  return (
    <div>
      {canSeeAdminLink ? (
        <div className="mx-auto flex w-full max-w-md justify-end px-4 pt-4">
          <Link
            href={`/${schoolSlug}/admin`}
            className="text-sm font-semibold text-muted hover:text-sea"
          >
            Volver al panel
          </Link>
        </div>
      ) : null}
      {children}
    </div>
  );
}
