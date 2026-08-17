import { AfterViewInit, Component } from '@angular/core';

declare var window: any;

@Component({
  selector: 'app-pages',
  standalone: false,
  templateUrl: './pages.html',
  styleUrl: './pages.css',
})
export class Pages implements AfterViewInit {
  // El toggle de "minimizar sidebar", tooltips, popovers, etc. se inicializan
  // en custom.js dentro de un $(document).ready() que corre al cargar el
  // index.html inicial, antes de que exista este layout (solo se crea tras
  // el login). Por eso se reinvoca aquí, cuando header y sidebar ya están
  // en el DOM. customInitFunction() es seguro de llamar más de una vez.
  ngAfterViewInit(): void {
    window.customInitFunction();
  }
}
