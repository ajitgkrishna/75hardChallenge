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
    // Force refresh on init
    this.loadProgress();
    this.startDate$ = this.progressService.getStartDate();
    this.challengeStarted$ = this.progressService.getChallengeStatus();

    // Auto-refresh every 30 seconds for cross-device sync
    this.pollingSubscription = interval(30000).subscribe(() => {
      // Only poll if page is visible (user is actively viewing)
      if (document.visibilityState === 'visible') {
        console.log('Auto-refreshing progress...');
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
        // Force refresh of observables after starting challenge
        this.loadProgress();
        this.startDate$ = this.progressService.getStartDate();
        this.challengeStarted$ = this.progressService.getChallengeStatus();
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
        // Load fresh progress through getProgress() to ensure proper filtering
        this.loadProgress();
        // Also refresh other observables
        this.startDate$ = this.progressService.getStartDate();
        this.challengeStarted$ = this.progressService.getChallengeStatus();
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
