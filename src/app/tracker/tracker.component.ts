import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProgressService } from '../services/progress.service';
import { AuthService } from '../services/auth.service';
import { WeekComponent } from './week/week.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-tracker',
  standalone: true,
  imports: [CommonModule, WeekComponent, RouterLink],
  template: `
    <div class="tracker-container">
      <div class="decorative-x left">
        <!-- Optional decorative elements -->
      </div>
      <div class="decorative-x right">
        <span>x</span><span>x</span><span>x</span><span>x</span><span>x</span>
      </div>

      <header class="header">
        <div class="greeting" *ngIf="currentUser$ | async as user">
          Welcome, {{ user }}!
        </div>
        <h1>
          <span class="hard-text">#75HARD</span>
          <span class="checklist-text">Checklist</span>
        </h1>
        <div class="start-date" *ngIf="startDate$ | async as date">
          Start Date: {{ date | date:'mediumDate' }}
        </div>
      </header>
      
      <div class="actions">
        <a routerLink="/gallery" class="gallery-btn">View Gallery</a>
        <button (click)="reset()" class="reset-btn">Reset Progress</button>
        <button (click)="logout()" class="logout-btn">Logout</button>
      </div>
      
      <div class="weeks-grid">
        <app-week 
          *ngFor="let week of progress$ | async" 
          [week]="week">
        </app-week>
      </div>
    </div>
  `,
  styles: [`
    .tracker-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px 60px;
      font-family: 'Montserrat', sans-serif;
      color: #455A64;
      background-image: url('/assets/bg-brushes.png');
      background-size: 100% auto;
      background-position: top center;
      background-repeat: no-repeat;
      position: relative;
      min-height: 100vh;
    }
    
    .header {
      text-align: center;
      margin-bottom: 50px;
      position: relative;
      z-index: 2;
    }

    .greeting {
      font-size: 1.5rem;
      font-weight: 600;
      color: #00695C;
      margin-bottom: 1rem;
      font-family: 'Satisfy', cursive;
    }
    
    h1 {
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: baseline;
      gap: 15px;
      line-height: 1.2;
    }
    
    .hard-text {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: 3.5rem;
      color: #00897B; /* Teal */
      letter-spacing: 3px;
    }
    
    .checklist-text {
      font-family: 'Satisfy', cursive;
      font-weight: 400;
      font-size: 5rem;
      color: #004D40; /* Dark Teal */
      transform: rotate(-5deg);
    }

    .start-date {
      font-size: 1.2rem;
      color: #546E7A;
      margin-top: 20px;
      font-weight: 500;
      letter-spacing: 1px;
    }
    
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 15px;
      margin-bottom: 30px;
      position: relative;
      z-index: 2;
    }

    button, a {
      padding: 10px 25px;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .reset-btn {
      background-color: #FF7043;
      color: white;
      box-shadow: 0 2px 5px rgba(255, 112, 67, 0.4);
    }

    .gallery-btn {
      background-color: #26A69A;
      color: white;
      box-shadow: 0 2px 5px rgba(38, 166, 154, 0.4);
    }

    .logout-btn {
      background-color: #78909C;
      color: white;
      box-shadow: 0 2px 5px rgba(120, 144, 156, 0.4);
    }

    button:hover, a:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .weeks-grid {
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
      position: relative;
      z-index: 2;
    }

    .decorative-x.right {
      position: absolute;
      top: 200px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      color: #006064;
      font-family: 'Coming Soon', cursive; /* Fallback or specific font */
      font-size: 2rem;
      font-weight: bold;
      opacity: 0.8;
      pointer-events: none;
    }
  `]
})
export class TrackerComponent implements OnInit {
  private progressService = inject(ProgressService);
  private authService = inject(AuthService);

  progress$!: Observable<any>;
  startDate$!: Observable<Date>;
  currentUser$ = this.authService.currentUser$;

  ngOnInit() {
    // Force refresh on init
    this.progress$ = this.progressService.getProgress();
    this.startDate$ = this.progressService.getStartDate();
  }

  reset() {
    console.log('Reset button clicked');
    if (confirm('Are you sure you want to reset all progress?')) {
      console.log('Reset confirmed');
      this.progressService.resetProgress().subscribe(() => {
        console.log('Reset observable completed');
        // Force refresh of observables after reset is complete
        this.progress$ = this.progressService.getProgress();
        this.startDate$ = this.progressService.getStartDate();
      });
    } else {
      console.log('Reset cancelled');
    }
  }

  logout() {
    this.authService.logout();
  }
}
