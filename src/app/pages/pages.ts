import { Component, OnInit } from '@angular/core';
import { LayoutService } from '../services/layout-service';
import { BrandingService } from '../services/branding-service';
import { EmpresaService } from '../services/empresa-service';

@Component({
  selector: 'app-pages',
  standalone: false,
  templateUrl: './pages.html',
  styleUrl: './pages.css',
})
export class Pages implements OnInit {
  constructor(
    public layout: LayoutService,
    private branding: BrandingService,
    private empresaService: EmpresaService
  ) {}

  ngOnInit(): void {
    this.branding.aplicar();
    // Si el administrador cambia el nombre/logo de la empresa mientras está
    // adentro (pestaña "Mi empresa"), se refleja sin tener que recargar.
    this.empresaService.brandingActualizada$.subscribe(() => this.branding.aplicar());
  }
}
