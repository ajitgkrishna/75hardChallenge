import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackerComponent } from './tracker.component';
import { ProgressService } from '../services/progress.service';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';

describe('TrackerComponent', () => {
    let component: TrackerComponent;
    let fixture: ComponentFixture<TrackerComponent>;
    let progressService: ProgressService;
    let authService: AuthService;

    const mockProgress = [
        {
            weekNumber: 1,
            days: [
                { day: 1, diet: false, workoutOutside: false, workoutAnywhere: false, water: false, reading: false, progressPic: false }
            ]
        }
    ];

    beforeEach(async () => {
        const progressServiceSpy = {
            getProgress: vi.fn().mockReturnValue(of(mockProgress)),
            getStartDate: vi.fn().mockReturnValue(of(new Date('2024-01-01'))),
            getChallengeStatus: vi.fn().mockReturnValue(of(true)),
            resetProgress: vi.fn().mockReturnValue(of(void 0)),
            startChallenge: vi.fn().mockReturnValue(of(void 0))
        };

        const authServiceSpy = {
            currentUser$: of('Ajith'),
            logout: vi.fn()
        };

        await TestBed.configureTestingModule({
            imports: [TrackerComponent],
            providers: [
                { provide: ProgressService, useValue: progressServiceSpy },
                { provide: AuthService, useValue: authServiceSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TrackerComponent);
        component = fixture.componentInstance;
        progressService = TestBed.inject(ProgressService);
        authService = TestBed.inject(AuthService);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should load progress, start date, and challenge status on init', () => {
            fixture.detectChanges(); // Triggers ngOnInit

            expect(progressService.getProgress).toHaveBeenCalled();
            expect(progressService.getStartDate).toHaveBeenCalled();
            expect(progressService.getChallengeStatus).toHaveBeenCalled();
            expect(component.progress$).toBeDefined();
            expect(component.startDate$).toBeDefined();
            expect(component.challengeStarted$).toBeDefined();
        });

        it('should set currentUser$ from AuthService', () => {
            fixture.detectChanges();

            component.currentUser$.subscribe(user => {
                expect(user).toBe('Ajith');
            });
        });
    });

    describe('reset', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should show confirmation dialog', () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

            component.reset();

            expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to reset all progress?');
            confirmSpy.mockRestore();
        });

        it('should call resetProgress when confirmed', () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

            component.reset();

            expect(progressService.resetProgress).toHaveBeenCalled();
            confirmSpy.mockRestore();
        });

        it('should not call resetProgress when cancelled', () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
            vi.clearAllMocks();

            component.reset();

            expect(progressService.resetProgress).not.toHaveBeenCalled();
            confirmSpy.mockRestore();
        });

        it('should refresh progress, start date, and challenge status after reset', () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
            vi.clearAllMocks();

            component.reset();

            // Should be called after reset
            expect(progressService.getProgress).toHaveBeenCalled();
            expect(progressService.getStartDate).toHaveBeenCalled();
            expect(progressService.getChallengeStatus).toHaveBeenCalled();
            confirmSpy.mockRestore();
        });
    });

    describe('startChallenge', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should show confirmation dialog', () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

            component.startChallenge();

            expect(confirmSpy).toHaveBeenCalledWith('Are you ready to start your 75 Hard journey? Once started, you can track your daily progress!');
            confirmSpy.mockRestore();
        });

        it('should call startChallenge when confirmed', () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

            component.startChallenge();

            expect(progressService.startChallenge).toHaveBeenCalled();
            confirmSpy.mockRestore();
        });

        it('should not call startChallenge when cancelled', () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
            vi.clearAllMocks();

            component.startChallenge();

            expect(progressService.startChallenge).not.toHaveBeenCalled();
            confirmSpy.mockRestore();
        });

        it('should refresh progress, start date, and challenge status after starting', () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
            vi.clearAllMocks();

            component.startChallenge();

            expect(progressService.getProgress).toHaveBeenCalled();
            expect(progressService.getStartDate).toHaveBeenCalled();
            expect(progressService.getChallengeStatus).toHaveBeenCalled();
            confirmSpy.mockRestore();
        });
    });

    describe('logout', () => {
        it('should call AuthService.logout', () => {
            fixture.detectChanges();

            component.logout();

            expect(authService.logout).toHaveBeenCalled();
        });
    });
});
