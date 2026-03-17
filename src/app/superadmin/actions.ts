"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdminAccess } from "@/lib/tenant/requireSuperAdminAccess";

const Schema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(40),
  timezone: z.string().min(2).max(64).optional().default("Europe/Madrid"),
  adminEmail: z.string().email(),
});

const GenerateInviteSchema = z.object({
  schoolId: z.string().uuid(),
  adminEmail: z.string().email(),
});

export async function createSchool(formData: FormData) {
  const parsed = Schema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    timezone: formData.get("timezone") ?? undefined,
    adminEmail: formData.get("adminEmail"),
  });

  if (!parsed.success) {
    redirect(`/superadmin?err=${encodeURIComponent("Revisa los datos.")}`);
  }

  await requireSuperAdminAccess({ nextPath: "/superadmin" });

  const supabase = getSupabaseAdmin();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const token = crypto.randomUUID().replace(/-/g, "");

  const { data: school, error } = await supabase
    .from("schools")
    .insert({
      name: parsed.data.name.trim(),
      slug: parsed.data.slug.trim().toLowerCase(),
      timezone: parsed.data.timezone,
    })
    .select("id, slug")
    .single();

  if (error || !school) {
    redirect(`/superadmin?err=${encodeURIComponent("No se pudo crear la escuela.")}`);
  }

  const { error: inviteError } = await supabase.from("school_invites").insert({
    school_id: school.id,
    email: parsed.data.adminEmail.trim().toLowerCase(),
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (inviteError) {
    redirect(`/superadmin?err=${encodeURIComponent("No se pudo crear la invitación.")}`);
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const inviteUrl = new URL(`/auth/invite?token=${encodeURIComponent(token)}`, baseUrl).toString();

  redirect(`/superadmin?ok=${encodeURIComponent("Escuela creada.")}&invite=${encodeURIComponent(inviteUrl)}`);
}

export async function generateSchoolInvite(formData: FormData) {
  const parsed = GenerateInviteSchema.safeParse({
    schoolId: formData.get("schoolId"),
    adminEmail: formData.get("adminEmail"),
  });

  if (!parsed.success) {
    redirect(`/superadmin?err=${encodeURIComponent("Revisa los datos.")}`);
  }

  await requireSuperAdminAccess({ nextPath: "/superadmin" });

  const supabase = getSupabaseAdmin();

  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("id")
    .eq("id", parsed.data.schoolId)
    .maybeSingle();

  if (schoolError || !school) {
    redirect(`/superadmin?err=${encodeURIComponent("No se pudo encontrar la escuela.")}`);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const token = crypto.randomUUID().replace(/-/g, "");

  const { error: inviteError } = await supabase.from("school_invites").insert({
    school_id: parsed.data.schoolId,
    email: parsed.data.adminEmail.trim().toLowerCase(),
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (inviteError) {
    redirect(`/superadmin?err=${encodeURIComponent("No se pudo crear la invitación.")}`);
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const inviteUrl = new URL(`/auth/invite?token=${encodeURIComponent(token)}`, baseUrl).toString();

  redirect(`/superadmin?ok=${encodeURIComponent("Invitación creada.")}&invite=${encodeURIComponent(inviteUrl)}`);
}
