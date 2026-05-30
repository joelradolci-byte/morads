import { moraAuthHeaders } from "@/lib/auth/client-headers";

export async function downloadComparacionPdf(
  idA: string | number,
  idB: string | number,
  filename?: string
): Promise<void> {
  const headers = await moraAuthHeaders();
  const qs = new URLSearchParams({
    idA: String(idA),
    idB: String(idB),
  });
  const res = await fetch(`/api/pdf/comparacion?${qs}`, { headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.message === "string"
        ? body.message
        : "No se pudo exportar el PDF de comparación.";
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? `Comparacion_Mora_${idA}_${idB}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
