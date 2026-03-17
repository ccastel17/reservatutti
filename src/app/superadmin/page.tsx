import { requireSuperAdminAccess } from "@/lib/tenant/requireSuperAdminAccess";
import { CopyToClipboardOnLoad } from "@/components/admin/CopyToClipboardOnLoad";
import { createSchool } from "./actions";

type Props = {
  searchParams: Promise<{ ok?: string; err?: string; invite?: string }>;
};

export default async function SuperAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  await requireSuperAdminAccess({ nextPath: "/superadmin" });

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Super Admin</p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight text-sea">Escuelas</h1>
      <p className="mt-1 text-sm text-muted">Crea una escuela y genera el enlace de acceso para su admin.</p>

      {sp.ok ? (
        <div className="mt-4 rounded-xl border border-brand/30 bg-brand-50 p-3 text-sm text-brand-700">{sp.ok}</div>
      ) : null}
      {sp.err ? (
        <div className="mt-4 rounded-xl border border-coral/30 bg-coral/10 p-3 text-sm text-coral">{sp.err}</div>
      ) : null}

      {sp.invite ? (
        <div className="mt-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-sm font-semibold text-sea">Enlace de acceso</p>
          <p className="mt-1 break-all text-xs text-muted">{sp.invite}</p>
          <CopyToClipboardOnLoad text={sp.invite} />
          <p className="mt-2 text-xs text-muted">Copiado al portapapeles si tu navegador lo permite.</p>
        </div>
      ) : null}

      <form action={createSchool} className="mt-6 space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-sea">Nombre</label>
          <input
            name="name"
            className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea placeholder:text-muted outline-none focus:border-brand"
            placeholder="Ej. Garbí Náutic"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-sea">Slug</label>
          <input
            name="slug"
            className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea placeholder:text-muted outline-none focus:border-brand"
            placeholder="ej. garbi"
            required
          />
          <p className="mt-2 text-xs text-muted">Se usa en la URL pública y del panel.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-sea">Zona horaria</label>
          <input
            name="timezone"
            defaultValue="Europe/Madrid"
            className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea placeholder:text-muted outline-none focus:border-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-sea">Email admin</label>
          <input
            name="adminEmail"
            type="email"
            className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-sea placeholder:text-muted outline-none focus:border-brand"
            placeholder="admin@escuela.com"
            required
          />
        </div>

        <button className="w-full rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white shadow-sm">
          Crear escuela
        </button>
      </form>
    </main>
  );
}
