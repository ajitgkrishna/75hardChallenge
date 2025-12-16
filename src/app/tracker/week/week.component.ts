import { Component, Input, inject, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeekProgress, DailyProgress } from '../../models/progress.model';
import { ProgressService } from '../../services/progress.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-week',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './week.component.html',
  styleUrls: ['./week.component.css']
})
export class WeekComponent implements OnInit, OnDestroy, OnChanges {
  @Input({ required: true }) week!: WeekProgress;
  @Input() challengeStarted: boolean = false;

  private progressService = inject(ProgressService);
  private cdr = inject(ChangeDetectorRef);
  private sub!: Subscription;
  currentDay: number = -1;

  tasks = [
    { key: 'diet', label: 'Follow Your Diet' },
    { key: 'workoutOutside', label: '45 Min Workout (Outside)' },
    { key: 'workoutAnywhere', label: '45 Min Workout (Anywhere)' },
    { key: 'water', label: 'Drink 4 Liters Water' },
    { key: 'progressPic', label: 'Progress Pic' },
    { key: 'reading', label: '10 Min of Reading' }
  ];

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  private pendingUploadDay: number | null = null;

  savingState: { [key: string]: boolean } = {};

  ngOnInit() {
    console.log('WeekComponent Init - Week:', this.week);
    this.sub = this.progressService.getCurrentDay().subscribe(day => {
      console.log('WeekComponent - Calculated Current Day:', day);
      this.currentDay = day;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Detect when week input changes (e.g., after reset)
    if (changes['week'] && !changes['week'].firstChange) {
      console.log('Week data changed, triggering change detection');
      this.cdr.detectChanges();
    }
  }

  getDayStatus(day: DailyProgress, key: string): boolean {
    // @ts-ignore
    return day[key];
  }

  isDayEditable(day: number): boolean {
    return this.challengeStarted && day === this.currentDay;
  }

  getDayClass(day: number): string {
    if (day < this.currentDay) return 'day-past';
    if (day === this.currentDay) return 'day-current';
    return 'day-future';
  }

  isSaving(day: number, key: string): boolean {
    return this.savingState[`${day}-${key}`] || false;
  }

  handleTaskClick(day: number, key: string, event: Event): void {
    // Prevent editing if challenge hasn't started
    if (!this.challengeStarted) {
      return;
    }

    // Only allow editing the current day
    if (day !== this.currentDay) {
      return;
    }

    if (key === 'progressPic') {
      const currentStatus = this.getDayStatus(this.week.days.find(d => d.day === day)!, key);
      if (currentStatus) {
        this.toggleStatus(day, key, false);
      } else {
        this.pendingUploadDay = day;
        this.fileInput.nativeElement.click();
      }
      return;
    }

    const currentStatus = this.getDayStatus(this.week.days.find(d => d.day === day)!, key);
    this.toggleStatus(day, key, !currentStatus);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file && this.pendingUploadDay) {
      const day = this.pendingUploadDay;
      const key = 'progressPic';
      this.savingState[`${day}-${key}`] = true;
      this.cdr.markForCheck();

      this.progressService.uploadProgressPic(day, file).subscribe({
        next: () => {
          this.progressService.updateProgress(day, 'progressPic', true).subscribe({
            next: () => {
              // @ts-ignore
              this.week.days.find(d => d.day === day)['progressPic'] = true;
              this.savingState[`${day}-${key}`] = false;
              this.cdr.markForCheck();
            },
            error: (err) => {
              console.error('Failed to update progress pic status', err);
              this.savingState[`${day}-${key}`] = false;
              this.cdr.markForCheck();
            }
          });
        },
        error: (err) => {
          console.error(err);
          alert('Upload failed');
          this.savingState[`${day}-${key}`] = false;
          this.cdr.markForCheck();
        }
      });
    }
    input.value = '';
    this.pendingUploadDay = null;
  }

  toggleStatus(day: number, key: string, status: boolean): void {
    // 1. Optimistic Update: Set value immediately
    // @ts-ignore
    this.week.days.find(d => d.day === day)[key] = status;

    // We don't necessarily need 'saving' spinner if it's instant, 
    // but we can keep it for feedback if desired. 
    // Given the user wants "visible X", let's show X immediately.
    // We can show spinner *over* current state or just in corner?
    // Let's use savingState just to prevent double-clicks, but not hide the X?
    // Current template: *ngIf="isSaving"... else show X or Input
    // We should probably show the X even if saving if status is true.

    this.savingState[`${day}-${key}`] = true;
    this.cdr.markForCheck();

    this.progressService.updateProgress(day, key as keyof DailyProgress, status).subscribe({
      next: () => {
        // Success confirm (value is already set)
        this.savingState[`${day}-${key}`] = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Update failed, reverting', err);
        // Revert on failure
        // @ts-ignore
        this.week.days.find(d => d.day === day)[key] = !status;
        this.savingState[`${day}-${key}`] = false;
        this.cdr.markForCheck();

        // Optional: Show toast
        // alert('Failed to save progress'); 
      }
    });
  }
}
