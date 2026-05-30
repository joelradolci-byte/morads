export type HallazgoComparable = {
  id_rastreo?: string;
  titulo?: string;
};

export function idHallazgo(item: HallazgoComparable): string {
  return item.id_rastreo || item.titulo || "";
}

export function diffHallazgos<T extends HallazgoComparable>(listaA: T[], listaB: T[]) {
  const aplicadas = listaA.filter(
    (a) => !listaB.some((b) => idHallazgo(b) === idHallazgo(a))
  );
  const persistentes = listaA.filter((a) =>
    listaB.some((b) => idHallazgo(b) === idHallazgo(a))
  );
  const nuevas = listaB.filter(
    (b) => !listaA.some((a) => idHallazgo(a) === idHallazgo(b))
  );
  return { aplicadas, persistentes, nuevas };
}
