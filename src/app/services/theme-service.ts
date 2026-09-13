import { Injectable, computed, signal } from '@angular/core';

export type Modo = 'light' | 'dark';
export type Acento = 'indigo' | 'red' | 'green' | 'pink' | 'amber' | 'teal' | 'mono';

export interface OpcionAcento {
  id: Acento;
  nombre: string;
  /** Color representativo para el selector (muestra en claro). */
  muestra: string;
}

const KEY_MODO = 'mp-theme';
const KEY_ACENTO = 'mp-accent';

export const ACENTOS: OpcionAcento[] = [
  { id: 'indigo', nombre: 'Índigo', muestra: '#4f46e5' },
  { id: 'red', nombre: 'Rojo', muestra: '#e11d48' },
  { id: 'green', nombre: 'Verde', muestra: '#059669' },
  { id: 'pink', nombre: 'Rosado', muestra: '#db2777' },
  { id: 'amber', nombre: 'Ámbar', muestra: '#d97706' },
  { id: 'teal', nombre: 'Turquesa', muestra: '#0d9488' },
  { id: 'mono', nombre: 'Blanco y negro', muestra: '#3f3f46' },
];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly modo = signal<Modo>(this.leerModoInicial());
  readonly acento = signal<Acento>(this.leerAcentoInicial());

  readonly esOscuro = computed(() => this.modo() === 'dark');
  readonly acentos = ACENTOS;

  constructor() {
    this.aplicarModo(this.modo());
    this.aplicarAcento(this.acento());
  }

  alternarModo(): void {
    this.establecerModo(this.modo() === 'dark' ? 'light' : 'dark');
  }

  establecerModo(modo: Modo): void {
    this.modo.set(modo);
    this.aplicarModo(modo);
    this.guardar(KEY_MODO, modo);
  }

  establecerAcento(acento: Acento): void {
    this.acento.set(acento);
    this.aplicarAcento(acento);
    this.guardar(KEY_ACENTO, acento);
  }

  // -- interno --------------------------------------------------------------

  private aplicarModo(modo: Modo): void {
    document.documentElement.setAttribute('data-bs-theme', modo);
  }

  private aplicarAcento(acento: Acento): void {
    document.documentElement.setAttribute('data-mp-accent', acento);
  }

  private guardar(clave: string, valor: string): void {
    try {
      localStorage.setItem(clave, valor);
    } catch {
      /* almacenamiento no disponible */
    }
  }

  private leerModoInicial(): Modo {
    try {
      const g = localStorage.getItem(KEY_MODO);
      if (g === 'light' || g === 'dark') return g;
    } catch {
      /* ignora */
    }
    const prefiereOscuro =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefiereOscuro ? 'dark' : 'light';
  }

  private leerAcentoInicial(): Acento {
    try {
      const g = localStorage.getItem(KEY_ACENTO) as Acento | null;
      if (g && ACENTOS.some((a) => a.id === g)) return g;
    } catch {
      /* ignora */
    }
    return 'indigo';
  }
}
