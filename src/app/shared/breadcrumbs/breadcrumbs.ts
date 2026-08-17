import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-breadcrumbs',
  standalone: false,
  templateUrl: './breadcrumbs.html',
  styleUrl: './breadcrumbs.css',
})
export class Breadcrumbs implements OnInit {
  tituloPagina: string = 'Dashboard';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.actualizarTitulo();
    this.router.events.pipe(filter((evento) => evento instanceof NavigationEnd)).subscribe(() => {
      this.actualizarTitulo();
    });
  }

  private actualizarTitulo(): void {
    let ruta = this.router.routerState.root;
    while (ruta.firstChild) {
      ruta = ruta.firstChild;
    }
    this.tituloPagina = ruta.snapshot.data['title'] || 'Inicio';
  }
}
