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
  templateUrl: './tracker.component.html',
  styleUrls: ['./tracker.component.css']
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
