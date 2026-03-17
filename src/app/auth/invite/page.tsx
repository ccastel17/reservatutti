import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function InvitePage({ searchParams }: Props) {
  const sp = await searchParams;
  const token = sp.token ?? "";

  if (!token) {
    redirect("/");
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/auth/invite?token=${token}`)}`);
  }

  const admin = getSupabaseAdmin();

  const { data: invite, error: inviteError } = await admin
    .from("school_invites")
    .select("id, school_id, email, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (inviteError || !invite) {
    redirect(`/auth/login?next=${encodeURIComponent("/")}`);
  }

  if (invite.used_at) {
    redirect("/");
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    redirect("/");
  }

  const userEmail = (user.email ?? "").toLowerCase();
  if (userEmail && invite.email && invite.email.toLowerCase() !== userEmail) {
    redirect("/");
  }

  await admin
    .from("school_members")
    .insert({ school_id: invite.school_id, user_id: user.id, role: "owner" })
    .select("id")
    .maybeSingle();

  await admin
    .from("school_invites")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invite.id);

  const { data: school } = await admin
    .from("schools")
    .select("slug")
    .eq("id", invite.school_id)
    .maybeSingle();

  const slug = school?.slug;
  if (!slug) redirect("/");

  redirect(`/${slug}/admin?ok=${encodeURIComponent("Acceso concedido.")}`);
}
