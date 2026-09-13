import { NgModule, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { Nopagefound } from './pages/nopagefound/nopagefound';
import { Breadcrumbs } from './shared/breadcrumbs/breadcrumbs';
import { Sidebar } from './shared/sidebar/sidebar';
import { Header } from './shared/header/header';
import { FacturaTicket } from './pages/factura-ticket/factura-ticket';
import { authInterceptor } from './interceptors/auth-interceptor';
import { Pages } from './pages/pages';
import { ServiceWorkerModule } from '@angular/service-worker';

@NgModule({
  declarations: [
    App,
    Login,
    Register,
    Nopagefound,
    Breadcrumbs,
    Sidebar,
    Header,
    FacturaTicket,
    Pages,
  ],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, FormsModule, 
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: !isDevMode(),
        // Register the ServiceWorker as soon as the application is stable
        // or after 30 seconds (whichever comes first).
        registrationStrategy: 'registerWhenStable:30000'
      })
    ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
  bootstrap: [App],
})
export class AppModule {}
