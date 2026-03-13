import { ImageResponse } from "next/og";
import { getPublicTripDetailBySlugAndId } from "@/lib/data/publicTrips";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type Props = {
  params: Promise<{ schoolSlug: string; eventId: string }>;
};

export default async function OpenGraphImage({ params }: Props) {
  const { schoolSlug, eventId } = await params;

  const detail = await getPublicTripDetailBySlugAndId({ schoolSlug, tripId: eventId });

  const title = detail?.trip.title ?? "Salida";
  const when = detail
    ? new Date(detail.trip.starts_at).toLocaleString("es-ES", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const oneLine = (detail?.trip.description ?? "")
    .split("\n")
    .map((s) => s.trim())
    .find(Boolean);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#f8fafc",
          color: "#0f172a",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: 2, color: "#475569" }}>
            RESERVATUTTI
          </div>
          <div style={{ marginTop: 18, fontSize: 64, fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
          <div style={{ marginTop: 22, fontSize: 34, fontWeight: 700, color: "#0f172a" }}>{when}</div>
          {oneLine ? (
            <div style={{ marginTop: 18, fontSize: 26, lineHeight: 1.2, color: "#334155" }}>
              {oneLine.length > 140 ? `${oneLine.slice(0, 140)}…` : oneLine}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 22, color: "#64748b" }}>{schoolSlug}</div>
          <div
            style={{
              height: 14,
              width: 240,
              borderRadius: 999,
              background: "#0f172a",
            }}
          />
        </div>
      </div>
    ),
    {
      width: size.width,
      height: size.height,
    }
  );
}
