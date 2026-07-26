export function mesAnioDe(fecha: Date): { mes: number; anio: number } {
  return { mes: fecha.getMonth() + 1, anio: fecha.getFullYear() };
}

export function mesActual(): { mes: number; anio: number } {
  return mesAnioDe(new Date());
}

export function diasDelMes(mes: number, anio: number): number {
  return new Date(anio, mes, 0).getDate();
}
