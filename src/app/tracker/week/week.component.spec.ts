import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeekComponent } from './week.component';
import { ProgressService } from '../../services/progress.service';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';

describe('WeekComponent', () => {
    let component: WeekComponent;
    let fixture: ComponentFixture<WeekComponent>;
    let progressService: ProgressService;

    const mockWeek = {
        weekNumber: 1,
        days: [
            { day: 1, diet: false, workoutOutside: false, workoutAnywhere: false, water: false, reading: false, progressPic: false },
            { day: 2, diet: true, workoutOutside: false, workoutAnywhere: false, water: false, reading: false, progressPic: false },
            { day: 3, diet: false, workoutOutside: true, workoutAnywhere: false, water: false, reading: false, progressPic: false }
        ]
    };

    beforeEach(async () => {
        const progressServiceSpy = {
            getCurrentDay: vi.fn().mockReturnValue(of(2)),
            updateProgress: vi.fn().mockReturnValue(of(void 0)),
            uploadProgressPic: vi.fn().mockReturnValue(of(void 0))
        };

        await TestBed.configureTestingModule({
            imports: [WeekComponent],
            providers: [
                { provide: ProgressService, useValue: progressServiceSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(WeekComponent);
        component = fixture.componentInstance;
        component.week = mockWeek;
        progressService = TestBed.inject(ProgressService);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should subscribe to current day', () => {
            fixture.detectChanges();

            expect(progressService.getCurrentDay).toHaveBeenCalled();
            expect(component.currentDay).toBe(2);
        });
    });

    describe('getDayStatus', () => {
        it('should return correct status for a task', () => {
            const day = mockWeek.days[1]; // day 2 with diet: true
            const status = component.getDayStatus(day, 'diet');

            expect(status).toBe(true);
        });

        it('should return false for uncompleted task', () => {
            const day = mockWeek.days[0]; // day 1 with diet: false
            const status = component.getDayStatus(day, 'diet');

            expect(status).toBe(false);
        });
    });

    describe('isSaving', () => {
        it('should return false when not saving', () => {
            expect(component.isSaving(1, 'diet')).toBe(false);
        });

        it('should return true when saving', () => {
            component.savingState['1-diet'] = true;
            expect(component.isSaving(1, 'diet')).toBe(true);
        });
    });

    describe('handleTaskClick', () => {
        beforeEach(() => {
            fixture.detectChanges(); // Sets currentDay to 2
        });

        it('should not allow editing future days', () => {
            component.handleTaskClick(3, 'diet', new Event('click'));

            expect(progressService.updateProgress).not.toHaveBeenCalled();
        });

        it('should allow editing current day', () => {
            component.handleTaskClick(2, 'diet', new Event('click'));

            expect(progressService.updateProgress).toHaveBeenCalled();
        });

        it('should allow editing past days', () => {
            component.handleTaskClick(1, 'diet', new Event('click'));

            expect(progressService.updateProgress).toHaveBeenCalled();
        });

        it('should toggle task status', () => {
            const day = mockWeek.days[0]; // day 1, diet: false

            component.handleTaskClick(1, 'diet', new Event('click'));

            expect(progressService.updateProgress).toHaveBeenCalledWith(1, 'diet', true);
        });

        it('should not trigger update when already saving', () => {
            component.savingState['2-diet'] = true;

            component.handleTaskClick(2, 'diet', new Event('click'));

            expect(progressService.updateProgress).not.toHaveBeenCalled();
        });
    });

    describe('toggleStatus', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should optimistically update the UI', () => {
            const day = mockWeek.days[0]; // day 1, diet: false

            component.toggleStatus(1, 'diet', true);

            expect(day.diet).toBe(true);
        });

        it('should set saving state', () => {
            component.toggleStatus(1, 'diet', true);

            expect(component.savingState['1-diet']).toBe(true);
        });

        it('should call progress service', () => {
            component.toggleStatus(1, 'diet', true);

            expect(progressService.updateProgress).toHaveBeenCalledWith(1, 'diet', true);
        });

        it('should clear saving state on success', async () => {
            component.toggleStatus(1, 'diet', true);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(component.savingState['1-diet']).toBe(false);
        });

        it('should revert changes on error', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            progressService.updateProgress = vi.fn().mockReturnValue(throwError(() => new Error('API Error')));

            const day = mockWeek.days[0];
            component.toggleStatus(1, 'diet', true);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(day.diet).toBe(false); // Reverted
            expect(component.savingState['1-diet']).toBe(false);
            consoleSpy.mockRestore();
        });
    });

    describe('progress pic upload', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should trigger file input for progress pic', () => {
            const mockFileInput = {
                nativeElement: {
                    click: vi.fn()
                }
            };
            component.fileInput = mockFileInput as any;

            component.handleTaskClick(2, 'progressPic', new Event('click'));

            expect(mockFileInput.nativeElement.click).toHaveBeenCalled();
        });

        it('should upload file when selected', () => {
            const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            const mockEvent = {
                target: {
                    files: [mockFile]
                }
            } as any;

            // Trigger file selection by clicking progress pic first
            component.handleTaskClick(2, 'progressPic', new Event('click'));
            component.onFileSelected(mockEvent);

            expect(progressService.uploadProgressPic).toHaveBeenCalledWith(2, mockFile);
        });

        it('should update progress after successful upload', async () => {
            const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            const mockEvent = {
                target: {
                    files: [mockFile],
                    value: 'test.jpg'
                }
            } as any;

            // Trigger file selection by clicking progress pic first
            component.handleTaskClick(2, 'progressPic', new Event('click'));
            component.onFileSelected(mockEvent);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(progressService.updateProgress).toHaveBeenCalledWith(2, 'progressPic', true);
        });

        it('should clear file input after upload', () => {
            const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            const mockEvent = {
                target: {
                    files: [mockFile],
                    value: 'test.jpg'
                }
            } as any;

            // Trigger file selection by clicking progress pic first
            component.handleTaskClick(2, 'progressPic', new Event('click'));
            component.onFileSelected(mockEvent);

            expect(mockEvent.target.value).toBe('');
        });
    });
});
