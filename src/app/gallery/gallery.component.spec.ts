import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GalleryComponent } from './gallery.component';
import { ProgressService } from '../services/progress.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('GalleryComponent', () => {
    let component: GalleryComponent;
    let fixture: ComponentFixture<GalleryComponent>;
    let progressService: ProgressService;

    const mockImages = [
        { day: 1, url: 'http://example.com/pic1.jpg', date: new Date('2024-01-01') },
        { day: 5, url: 'http://example.com/pic2.jpg', date: new Date('2024-01-05') },
        { day: 10, url: 'http://example.com/pic3.jpg', date: new Date('2024-01-10') }
    ];

    beforeEach(async () => {
        const progressServiceSpy = {
            getGalleryImages: vi.fn().mockReturnValue(of(mockImages))
        };

        await TestBed.configureTestingModule({
            imports: [GalleryComponent],
            providers: [
                { provide: ProgressService, useValue: progressServiceSpy },
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GalleryComponent);
        component = fixture.componentInstance;
        progressService = TestBed.inject(ProgressService);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should load gallery images', () => {
            fixture.detectChanges();

            expect(progressService.getGalleryImages).toHaveBeenCalled();
            expect(component.images$).toBeDefined();
        });

        it('should populate currentImages array', async () => {
            fixture.detectChanges();

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(component.currentImages.length).toBe(3);
            expect(component.currentImages[0].day).toBe(1);
        });
    });

    describe('openImage', () => {
        beforeEach(() => {
            fixture.detectChanges();
            component.currentImages = mockImages;
        });

        it('should set selectedImage', () => {
            component.openImage('http://example.com/pic2.jpg');

            expect(component.selectedImage).toBe('http://example.com/pic2.jpg');
        });

        it('should set currentIndex correctly', () => {
            component.openImage('http://example.com/pic2.jpg');

            expect(component.currentIndex).toBe(1);
        });

        it('should log the opened image URL', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

            component.openImage('http://example.com/pic1.jpg');

            expect(consoleSpy).toHaveBeenCalledWith('Opening image:', 'http://example.com/pic1.jpg');
            consoleSpy.mockRestore();
        });
    });

    describe('closeImage', () => {
        beforeEach(() => {
            fixture.detectChanges();
            component.currentImages = mockImages;
            component.selectedImage = 'http://example.com/pic2.jpg';
            component.currentIndex = 1;
        });

        it('should clear selectedImage', () => {
            component.closeImage();

            expect(component.selectedImage).toBeNull();
        });

        it('should reset currentIndex', () => {
            component.closeImage();

            expect(component.currentIndex).toBe(-1);
        });
    });

    describe('nextImage', () => {
        beforeEach(() => {
            fixture.detectChanges();
            component.currentImages = mockImages;
            component.selectedImage = 'http://example.com/pic1.jpg';
            component.currentIndex = 0;
        });

        it('should navigate to next image', () => {
            component.nextImage();

            expect(component.currentIndex).toBe(1);
            expect(component.selectedImage).toBe('http://example.com/pic2.jpg');
        });

        it('should not navigate beyond last image', () => {
            component.currentIndex = 2;
            component.selectedImage = 'http://example.com/pic3.jpg';

            component.nextImage();

            expect(component.currentIndex).toBe(2);
            expect(component.selectedImage).toBe('http://example.com/pic3.jpg');
        });

        it('should stop event propagation', () => {
            const mockEvent = {
                stopPropagation: vi.fn()
            } as any;

            component.nextImage(mockEvent);

            expect(mockEvent.stopPropagation).toHaveBeenCalled();
        });
    });

    describe('prevImage', () => {
        beforeEach(() => {
            fixture.detectChanges();
            component.currentImages = mockImages;
            component.selectedImage = 'http://example.com/pic2.jpg';
            component.currentIndex = 1;
        });

        it('should navigate to previous image', () => {
            component.prevImage();

            expect(component.currentIndex).toBe(0);
            expect(component.selectedImage).toBe('http://example.com/pic1.jpg');
        });

        it('should not navigate before first image', () => {
            component.currentIndex = 0;
            component.selectedImage = 'http://example.com/pic1.jpg';

            component.prevImage();

            expect(component.currentIndex).toBe(0);
            expect(component.selectedImage).toBe('http://example.com/pic1.jpg');
        });

        it('should stop event propagation', () => {
            const mockEvent = {
                stopPropagation: vi.fn()
            } as any;

            component.prevImage(mockEvent);

            expect(mockEvent.stopPropagation).toHaveBeenCalled();
        });
    });

    describe('hasNext', () => {
        beforeEach(() => {
            component.currentImages = mockImages;
        });

        it('should return true when not at last image', () => {
            component.currentIndex = 0;
            expect(component.hasNext()).toBe(true);
        });

        it('should return false when at last image', () => {
            component.currentIndex = 2;
            expect(component.hasNext()).toBe(false);
        });
    });

    describe('hasPrev', () => {
        beforeEach(() => {
            component.currentImages = mockImages;
        });

        it('should return true when not at first image', () => {
            component.currentIndex = 1;
            expect(component.hasPrev()).toBe(true);
        });

        it('should return false when at first image', () => {
            component.currentIndex = 0;
            expect(component.hasPrev()).toBe(false);
        });
    });

    describe('keyboard navigation', () => {
        beforeEach(() => {
            fixture.detectChanges();
            component.currentImages = mockImages;
            component.selectedImage = 'http://example.com/pic2.jpg';
            component.currentIndex = 1;
        });

        it('should close image on Escape key', () => {
            const event = { key: 'Escape' };

            component.onKeydownHandler(event);

            expect(component.selectedImage).toBeNull();
        });

        it('should navigate to next image on ArrowRight', () => {
            const event = { key: 'ArrowRight' };

            component.onKeydownHandler(event);

            expect(component.currentIndex).toBe(2);
        });

        it('should navigate to previous image on ArrowLeft', () => {
            const event = { key: 'ArrowLeft' };

            component.onKeydownHandler(event);

            expect(component.currentIndex).toBe(0);
        });

        it('should not respond to keyboard when no image is selected', () => {
            component.selectedImage = null;
            component.currentIndex = -1;
            const event = { key: 'ArrowRight' };

            component.onKeydownHandler(event);

            expect(component.currentIndex).toBe(-1);
        });
    });
});
