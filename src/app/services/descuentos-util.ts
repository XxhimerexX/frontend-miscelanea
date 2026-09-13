// Espejo de backend/utils/descuentos.js — el POS muestra el precio con oferta,
// pero el precio real de la venta lo recalcula el backend.

function redondear(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export interface ReglaDescuento {
  Id: number;
  TipoDescuento: string; // 'PORCENTAJE' | 'MONTO' | 'PRECIO_FIJO'
  ValorDescuento: number;
  ProductoId: number | null;
  CategoriaId: number | null;
}

function reglaAplica(regla: ReglaDescuento, producto: any): boolean {
  if (regla.ProductoId != null) return Number(regla.ProductoId) === Number(producto.Id);
  if (regla.CategoriaId != null) return Number(regla.CategoriaId) === Number(producto.CategoriaId);
  return false;
}

function mejorPrecioConReglas(precioBase: number, reglas: ReglaDescuento[]): { precio: number; reglaId: number | null } {
  let mejor = precioBase;
  let reglaId: number | null = null;
  for (const r of reglas) {
    const valor = Number(r.ValorDescuento) || 0;
    let p: number;
    switch (String(r.TipoDescuento || '').toUpperCase()) {
      case 'PORCENTAJE': p = precioBase * (1 - valor / 100); break;
      case 'MONTO': p = precioBase - valor; break;
      case 'PRECIO_FIJO': p = valor; break;
      default: continue;
    }
    p = Math.max(0, redondear(p));
    if (p < mejor) { mejor = p; reglaId = r.Id; }
  }
  return { precio: mejor, reglaId };
}

export interface PrecioCalculado {
  precioNormal: number;
  precioFinal: number;
  descuentoUnitario: number;
  reglaId: number | null;
  tieneOferta: boolean;
}

/**
 * Precio unitario de un producto para el POS, considerando ofertas vigentes
 * y (si aplica) el precio mayorista. Gana el menor.
 */
export function precioUnitarioConDescuento(
  producto: any,
  reglas: ReglaDescuento[],
  esMayorista: boolean
): PrecioCalculado {
  const detal = redondear(producto.PrecioVenta);
  const mayorista =
    esMayorista && producto.PrecioVentaMayorista != null ? redondear(producto.PrecioVentaMayorista) : null;

  const precioNormal = mayorista != null ? Math.min(detal, mayorista) : detal;

  const aplicables = (reglas || []).filter((r) => reglaAplica(r, producto));
  const { precio: detalConDescuento, reglaId } = mejorPrecioConReglas(detal, aplicables);

  const precioFinal = Math.min(precioNormal, detalConDescuento);
  const descuentoUnitario = redondear(precioNormal - precioFinal);

  return {
    precioNormal,
    precioFinal,
    descuentoUnitario,
    reglaId: precioFinal < precioNormal ? reglaId : null,
    tieneOferta: precioFinal < precioNormal,
  };
}
