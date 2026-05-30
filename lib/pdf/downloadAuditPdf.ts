import { moraAuthHeaders } from "@/lib/auth/client-headers";

export async function downloadAuditPdf(auditId: string, filename?: string): Promise<void> {
  const headers = await moraAuthHeaders();
  const res = await fetch(`/api/pdf?id=${encodeURIComponent(auditId)}`, { headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.message === "string"
        ? body.message
        : "No se pudo exportar el PDF. Intentá de nuevo.";
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? `Auditoria_Mora_${auditId}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
