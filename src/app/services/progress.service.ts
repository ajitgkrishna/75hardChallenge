import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, of, shareReplay, catchError, tap } from 'rxjs';
import { DailyProgress, WeekProgress } from '../models/progress.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProgressService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    // Cache start date and challenge status to avoid frequent fetching
    private startDateInfo$: Observable<{ startDate: Date, challengeStarted: boolean }> | null = null;

    getProgress(): Observable<WeekProgress[]> {
        return this.http.get<any[]>(`${this.apiUrl}/GetProgress`).pipe(
            catchError((error) => {
                console.error('Error fetching progress, using default empty grid:', error);
                return of([]);
            }),
            map(backendWeeks => {
                if (!backendWeeks || !Array.isArray(backendWeeks)) return [];

                return backendWeeks
                    .map((bw: any) => {
                        // Handle both PascalCase (C# default) and camelCase (JSON default)
                        const days = bw.Days || bw.days || [];
                        const weekNumber = bw.WeekNumber ?? bw.weekNumber ?? 0;

                        return {
                            weekNumber: weekNumber,
                            days: days.map((bd: any) => ({
                                day: bd.Day ?? bd.day ?? 0,
                                diet: bd.Diet ?? bd.diet ?? false,
                                workoutOutside: bd.WorkoutOutside ?? bd.workoutOutside ?? false,
                                workoutAnywhere: bd.WorkoutAnywhere ?? bd.workoutAnywhere ?? false,
                                water: bd.Water ?? bd.water ?? false,
                                reading: bd.Reading ?? bd.reading ?? false,
                                progressPic: bd.ProgressPic ?? bd.progressPic ?? false,
                                photoUrl: bd.PhotoUrl ?? bd.photoUrl ?? null
                            }))
                        };
                    })
                    .filter((w: any) => w.weekNumber > 0 && w.days && w.days.length > 0)
                    .sort((a: any, b: any) => a.weekNumber - b.weekNumber);
            })
        );
    }

    getStartDateInfo(): Observable<{ startDate: Date, challengeStarted: boolean }> {
        if (!this.startDateInfo$) {
            this.startDateInfo$ = this.http.get<{ startDate: string, challengeStarted: boolean }>(`${this.apiUrl}/GetStartDate`).pipe(
                map(response => {
                    if (!response || !response.startDate) {
                        return { startDate: new Date(), challengeStarted: false };
                    }
                    const parsed = new Date(response.startDate);
                    if (isNaN(parsed.getTime())) {
                        return { startDate: new Date(), challengeStarted: response.challengeStarted || false };
                    }
                    return { startDate: parsed, challengeStarted: response.challengeStarted || false };
                }),
                // Force cache busting on error or retry
                catchError(err => {
                    console.error('Failed to get start date info, defaulting to TODAY and not started', err);
                    return of({ startDate: new Date(), challengeStarted: false });
                }),
                shareReplay(1)
            );
        }
        return this.startDateInfo$;
    }

    getStartDate(): Observable<Date> {
        return this.getStartDateInfo().pipe(map(info => info.startDate));
    }

    getChallengeStatus(): Observable<boolean> {
        return this.getStartDateInfo().pipe(map(info => info.challengeStarted));
    }

    getCurrentDay(): Observable<number> {
        return this.getStartDate().pipe(
            map(startDate => {
                const now = new Date();
                const start = new Date(startDate);
                now.setHours(0, 0, 0, 0);
                start.setHours(0, 0, 0, 0);
                const diffTime = now.getTime() - start.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const day = diffDays + 1;
                return day;
            })
        );
    }

    updateProgress(day: number, task: string, status: boolean): Observable<void> {
        // Map camelCase task name to PascalCase for backend matching if needed
        // But user requested specific body: { Day, Task, Status }
        const taskMap: { [key: string]: string } = {
            'diet': 'Diet',
            'workoutOutside': 'WorkoutOutside',
            'workoutAnywhere': 'WorkoutAnywhere',
            'water': 'Water',
            'reading': 'Reading',
            'progressPic': 'ProgressPic'
        };

        const backendTaskName = taskMap[task] || task;

        const payload = {
            Day: day,
            Task: backendTaskName,
            Status: status
        };

        return this.http.post<void>(`${this.apiUrl}/UpdateProgress`, payload);
    }

    resetProgress(): Observable<any[]> {
        return this.http.post<any[]>(`${this.apiUrl}/ResetProgress`, {}).pipe(
            tap(() => {
                // Clear cache after reset completes
                this.startDateInfo$ = null;
            })
        );
    }

    startChallenge(): Observable<void> {
        const userId = localStorage.getItem('userId');
        return this.http.post<void>(`${this.apiUrl}/StartChallenge?userId=${userId}`, {}).pipe(
            tap(() => {
                // Clear cache after challenge starts
                this.startDateInfo$ = null;
            })
        );
    }

    uploadProgressPic(day: number, file: File): Observable<void> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('day', day.toString());

        return this.http.post<void>(`${this.apiUrl}/UploadProgressPic`, formData);
    }

    getGalleryImages(): Observable<{ day: number, url: string, date: Date }[]> {
        return this.http.get<any[]>(`${this.apiUrl}/GetGallery`).pipe(
            map(images => {
                if (!images || !Array.isArray(images)) return [];
                return images.map(img => ({
                    day: img.Day || img.day,
                    url: img.Url || img.url,
                    date: new Date(img.Date || img.date)
                }));
            })
        );
    }

    // transformToWeeks removed as backend now returns weeks structure
}
