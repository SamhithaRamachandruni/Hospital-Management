import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  template: `
    <div class="main-container">
      <app-navbar *ngIf="showNavbar"></app-navbar>
      <div class="content-wrapper" [class.no-navbar]="!showNavbar">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .main-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .content-wrapper {
      flex: 1;
      padding: 20px 0;
    }

    .content-wrapper.no-navbar {
      padding: 0;
    }
  `]
})
export class AppComponent implements OnInit {
  showNavbar = true;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe(event => {
        const authPages = ['/login', '/register'];
        this.showNavbar = !authPages.includes(event.url);
      });
  }
}