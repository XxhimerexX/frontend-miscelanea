import { Component, OnInit, signal } from '@angular/core';
import { PwaUpdateService } from './services/pwa-update-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('miscelanea-pos');

  constructor(private pwaUpdateService: PwaUpdateService) {}

  ngOnInit(): void {
    this.pwaUpdateService.iniciar();
  }
}
