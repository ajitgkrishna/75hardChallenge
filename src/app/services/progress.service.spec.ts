import { TestBed } from '@angular/core/testing';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
    let service: ProgressService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ProgressService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize with 11 weeks of empty progress', () => {
        service.getProgress().subscribe(progress => {
            expect(progress.length).toBe(11);
            expect(progress[0].days.length).toBe(7);
            expect(progress[0].days[0].diet).toBe(false);
        });
    });

    it('should update progress', () => {
        service.updateProgress(1, 'diet', true);
        service.getProgress().subscribe(progress => {
            expect(progress[0].days[0].diet).toBe(true);
        });
    });

    it('should reset progress', () => {
        // First update some progress
        service.updateProgress(1, 'diet', true);
        service.updateProgress(2, 'water', true);

        // Reset
        service.resetProgress();

        // Verify it's reset
        service.getProgress().subscribe(p2 => {
            expect(p2[0].days[0].diet).toBe(false);
            expect(p2[0].days[1].water).toBe(false);
        });
    });
});
