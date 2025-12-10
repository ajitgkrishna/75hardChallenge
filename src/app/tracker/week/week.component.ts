import { Component, Input, inject, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeekProgress, DailyProgress } from '../../models/progress.model';
import { ProgressService } from '../../services/progress.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-week',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="week-card">
      <!-- Grid Container for the whole card content to ensure alignment -->
      <div class="week-grid">
        <!-- Header Row -->
        <div class="grid-header-row">
          <div class="week-title">
             Week #{{ week.weekNumber }} 
          </div>
          <div class="day-number" *ngFor="let day of week.days">{{ day.day }}</div>
        </div>

        <!-- Task Rows -->
        <div class="grid-row" *ngFor="let task of tasks; let last = last" [class.last-row]="last">
          <div class="task-label">{{ task.label }}</div>
          
          <div class="checkbox-cell" *ngFor="let day of week.days">
            <div 
              class="custom-checkbox-container" 
              [class.checked]="getDayStatus(day, task.key)"
              [class.disabled]="day.day > currentDay"
              [class.saving]="isSaving(day.day, task.key)"
              (click)="handleTaskClick(day.day, task.key, $event)">
              
              <!-- Hidden native checkbox for accessibility/logic -->
              <input 
                type="checkbox" 
                style="display:none;"
                [checked]="getDayStatus(day, task.key)"
                [disabled]="day.day > currentDay || isSaving(day.day, task.key)">
                
              <!-- Visual X mark - Only show if NOT saving -->
              <span class="x-mark" *ngIf="!isSaving(day.day, task.key) && getDayStatus(day, task.key)">✕</span>
              
              <!-- Spinner -->
              <div class="spinner" *ngIf="isSaving(day.day, task.key)"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Hidden File Input -->
      <input type="file" #fileInput style="display: none" accept="image/*" (change)="onFileSelected($event)">
    </div>
  `,
  styles: [`
    :host {
      display: block;
      margin-bottom: 2rem;
    }

    .week-card {
      background: white;
      /* No shadow or border by default to match clean look, or subtle if needed */
      /* box-shadow: 0 4px 15px rgba(0,0,0,0.05); */
    }

    .week-grid {
      display: grid;
      /* First col auto/1fr, then 7 fixed columns for days */
      grid-template-columns: minmax(200px, 1fr) repeat(7, 45px);
      width: 100%;
    }

    /* --- Header Styles --- */
    .grid-header-row {
      display: contents; /* Allows children to participate in the main grid */
    }

    .week-title {
      background-color: #B2DFDB; /* Light Teal */
      padding: 12px 20px;
      font-weight: 700;
      color: #37474F;
      grid-column: 1; /* First column */
      display: flex;
      align-items: center;
      font-size: 1.1rem;
    }

    .day-number {
      background-color: #B2DFDB; /* Light Teal */
      font-weight: 600;
      color: #37474F;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 0.9rem;
    }

    /* --- Row Styles --- */
    .grid-row {
      display: contents;
    }

    .task-label {
      grid-column: 1; /* Force start of new row */
      padding: 12px 20px;
      color: #546E7A;
      font-size: 0.95rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      background-color: white; /* Ensure white background */
    }

    .checkbox-cell {
      padding: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: white;
    }

    /* Row banding or separators if needed based on image? Image shows pure white. */
    /* If image has alternating colors, add here. Assuming white body based on request. */

    .custom-checkbox-container {
      width: 28px;
      height: 28px;
      background-color: #B2DFDB; /* Light teal placeholder when unchecked */
      /* Or #E0F2F1 specifically for unchecked state in the image? looks pale teal */
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: all 0.2s;
    }

    .custom-checkbox-container:hover {
      opacity: 0.8;
    }

    .custom-checkbox-container.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    /* Checked State - The X Mark */
    .x-mark {
      color: #004D40; /* Darker Teal for better visibility */
      font-family: cursive;
      font-size: 1.8rem; /* Slightly smaller to fit better */
      font-weight: 900;
      line-height: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      /* padding-bottom: 5px; Removed to center perfectly */
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #fff;
      border-top: 2px solid #00897B;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class WeekComponent implements OnInit, OnDestroy {
  @Input({ required: true }) week!: WeekProgress;

  private progressService = inject(ProgressService);
  private cdr = inject(ChangeDetectorRef);
  private sub!: Subscription;
  currentDay: number = -1;

  tasks = [
    { key: 'diet', label: 'Follow Your Diet' },
    { key: 'workoutOutside', label: '45 Min Workout (Outside)' },
    { key: 'workoutAnywhere', label: '45 Min Workout (Anywhere)' },
    { key: 'water', label: 'Drink 1 Gallon Water' },
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

  getDayStatus(day: DailyProgress, key: string): boolean {
    // @ts-ignore
    return day[key];
  }

  isSaving(day: number, key: string): boolean {
    return this.savingState[`${day}-${key}`] || false;
  }

  handleTaskClick(day: number, key: string, event: Event): void {
    if (day > this.currentDay && !this.isSaving(day, key)) {
      // Prevent editing future days
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
