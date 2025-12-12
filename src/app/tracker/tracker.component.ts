import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProgressService } from '../services/progress.service';
import { AuthService } from '../services/auth.service';
import { WeekComponent } from './week/week.component';
import { Observable, BehaviorSubject, interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-tracker',
  standalone: true,
  imports: [CommonModule, WeekComponent, RouterLink],
  templateUrl: './tracker.component.html',
  styleUrls: ['./tracker.component.css']
})
export class TrackerComponent implements OnInit, OnDestroy {
  private progressService = inject(ProgressService);
  private authService = inject(AuthService);

  progress$ = new BehaviorSubject<any[]>([]);
  startDate$!: Observable<Date>;
  challengeStarted$!: Observable<boolean>;
  currentUser$ = this.authService.currentUser$;

  private pollingSubscription?: Subscription;

  ngOnInit() {
    // Force refresh start date info to ensure GetStartDate is called
    this.progressService.refreshStartDateInfo();

    // Initialize observables
    this.startDate$ = this.progressService.getStartDate();
    this.challengeStarted$ = this.progressService.getChallengeStatus();

    // Load progress data
    this.loadProgress();

    // Auto-refresh every 30 seconds for cross-device sync
    this.pollingSubscription = interval(30000).subscribe(() => {
      // Only poll if page is visible (user is actively viewing)
      if (document.visibilityState === 'visible') {
        console.log('Auto-refreshing progress...');
        this.progressService.refreshStartDateInfo();
        this.loadProgress();
      }
    });
  }

  ngOnDestroy() {
    // Clean up polling when component is destroyed
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  private loadProgress() {
    this.progressService.getProgress().subscribe(data => {
      console.log('Progress loaded:', data);
      this.progress$.next(data);
    });
  }

  startChallenge() {
    console.log('Start Challenge button clicked');
    if (confirm('Are you ready to start your 75 Hard journey? Once started, you can track your daily progress!')) {
      console.log('Start Challenge confirmed');
      this.progressService.startChallenge().subscribe(() => {
        console.log('Challenge started successfully');
        // Force refresh of start date info to get updated data
        this.progressService.refreshStartDateInfo();
        // Reinitialize observables with fresh data
        this.startDate$ = this.progressService.getStartDate();
        this.challengeStarted$ = this.progressService.getChallengeStatus();
        // Load fresh progress
        this.loadProgress();
      });
    } else {
      console.log('Start Challenge cancelled');
    }
  }

  reset() {
    console.log('Reset button clicked');
    if (confirm('Are you sure you want to reset all progress?')) {
      console.log('Reset confirmed');
      this.progressService.resetProgress().subscribe(() => {
        console.log('Reset completed');
        // Force refresh of start date info to get updated data
        this.progressService.refreshStartDateInfo();
        // Reinitialize observables with fresh data
        this.startDate$ = this.progressService.getStartDate();
        this.challengeStarted$ = this.progressService.getChallengeStatus();
        // Load fresh progress
        this.loadProgress();
      });
    } else {
      console.log('Reset cancelled');
    }
  }

  logout() {
    this.authService.logout();
  }

  trackByWeek(index: number, week: any): number {
    return week.weekNumber;
  }
}
