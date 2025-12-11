import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProgressService } from './progress.service';
import { environment } from '../../environments/environment';

describe('ProgressService', () => {
    let service: ProgressService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ProgressService,
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });

        service = TestBed.inject(ProgressService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getProgress', () => {
        it('should fetch and transform progress from API', (done) => {
            const mockApiResponse = [
                {
                    WeekNumber: 1,
                    Days: [
                        {
                            Day: 1,
                            Diet: true,
                            WorkoutOutside: false,
                            WorkoutAnywhere: true,
                            Water: false,
                            Reading: true,
                            ProgressPic: false,
                            PhotoUrl: null
                        }
                    ]
                }
            ];

            service.getProgress().subscribe(progress => {
                expect(progress.length).toBe(1);
                expect(progress[0].weekNumber).toBe(1);
                expect(progress[0].days.length).toBe(1);
                expect(progress[0].days[0].diet).toBe(true);
                expect(progress[0].days[0].workoutOutside).toBe(false);
                done();
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/GetProgress`);
            expect(req.request.method).toBe('GET');
            req.flush(mockApiResponse);
        });

        it('should handle API errors and return empty array', (done) => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            service.getProgress().subscribe(progress => {
                expect(progress).toEqual([]);
                expect(consoleSpy).toHaveBeenCalled();
                consoleSpy.mockRestore();
                done();
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/GetProgress`);
            req.error(new ProgressEvent('Network error'));
        });

        it('should handle camelCase API response', (done) => {
            const mockApiResponse = [
                {
                    weekNumber: 2,
                    days: [
                        {
                            day: 8,
                            diet: false,
                            workoutOutside: true,
                            workoutAnywhere: false,
                            water: true,
                            reading: false,
                            progressPic: true,
                            photoUrl: 'http://example.com/pic.jpg'
                        }
                    ]
                }
            ];

            service.getProgress().subscribe(progress => {
                expect(progress[0].weekNumber).toBe(2);
                expect(progress[0].days[0].day).toBe(8);
                expect(progress[0].days[0].photoUrl).toBe('http://example.com/pic.jpg');
                done();
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/GetProgress`);
            req.flush(mockApiResponse);
        });
    });

    describe('getStartDate', () => {
        it('should fetch start date from API', (done) => {
            const mockDate = '2024-01-01T00:00:00Z';

            service.getStartDate().subscribe(date => {
                expect(date).toBeInstanceOf(Date);
                expect(date.toISOString()).toContain('2024-01-01');
                done();
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/GetStartDate`);
            expect(req.request.method).toBe('GET');
            req.flush({ startDate: mockDate });
        });

        it('should cache start date and not make multiple requests', (done) => {
            const mockDate = '2024-01-01T00:00:00Z';

            service.getStartDate().subscribe(() => {
                service.getStartDate().subscribe(() => {
                    done();
                });
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/GetStartDate`);
            req.flush({ startDate: mockDate });
            // Should only be one request due to caching
        });

        it('should handle missing start date and return current date', (done) => {
            service.getStartDate().subscribe(date => {
                expect(date).toBeInstanceOf(Date);
                done();
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/GetStartDate`);
            req.flush({});
        });

        it('should handle API errors and return current date', (done) => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            service.getStartDate().subscribe(date => {
                expect(date).toBeInstanceOf(Date);
                consoleSpy.mockRestore();
                done();
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/GetStartDate`);
            req.error(new ProgressEvent('Network error'));
        });
    });

    describe('getCurrentDay', () => {
        it('should calculate current day based on start date', (done) => {
            const today = new Date();
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - 5); // 5 days ago

            service.getCurrentDay().subscribe(day => {
                expect(day).toBe(6); // Day 6 (5 days + 1)
                done();
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/GetStartDate`);
            req.flush({ startDate: startDate.toISOString() });
        });
    });

    describe('updateProgress', () => {
        it('should send update request with correct payload', (done) => {
            service.updateProgress(5, 'diet', true).subscribe(() => {
                done();
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/UpdateProgress`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({
                Day: 5,
                Task: 'Diet',
                Status: true
            });
            req.flush(null);
        });

        it('should map camelCase task names to PascalCase', (done) => {
            service.updateProgress(3, 'workoutOutside', false).subscribe(() => {
                done();
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/UpdateProgress`);
            expect(req.request.body.Task).toBe('WorkoutOutside');
            req.flush(null);
        });
    });

    describe('resetProgress', () => {
        it('should send reset request', (done) => {
            service.resetProgress().subscribe(() => {
                done();
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/ResetProgress`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({});
            req.flush(null);
        });
    });

    describe('uploadProgressPic', () => {
        it('should upload file with FormData', (done) => {
            const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            service.uploadProgressPic(7, mockFile).subscribe(() => {
                done();
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/UploadProgressPic`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toBeInstanceOf(FormData);

            const formData = req.request.body as FormData;
            expect(formData.get('day')).toBe('7');
            expect(formData.get('file')).toBe(mockFile);

            req.flush(null);
        });
    });

    describe('getGalleryImages', () => {
        it('should fetch and transform gallery images', (done) => {
            const mockImages = [
                {
                    Day: 1,
                    Url: 'http://example.com/pic1.jpg',
                    Date: '2024-01-01T00:00:00Z'
                },
                {
                    Day: 5,
                    Url: 'http://example.com/pic2.jpg',
                    Date: '2024-01-05T00:00:00Z'
                }
            ];

            service.getGalleryImages().subscribe(images => {
                expect(images.length).toBe(2);
                expect(images[0].day).toBe(1);
                expect(images[0].url).toBe('http://example.com/pic1.jpg');
                expect(images[0].date).toBeInstanceOf(Date);
                done();
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/GetGallery`);
            expect(req.request.method).toBe('GET');
            req.flush(mockImages);
        });

        it('should handle camelCase response', (done) => {
            const mockImages = [
                {
                    day: 3,
                    url: 'http://example.com/pic3.jpg',
                    date: '2024-01-03T00:00:00Z'
                }
            ];

            service.getGalleryImages().subscribe(images => {
                expect(images[0].day).toBe(3);
                expect(images[0].url).toBe('http://example.com/pic3.jpg');
                done();
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/GetGallery`);
            req.flush(mockImages);
        });

        it('should return empty array for invalid response', (done) => {
            service.getGalleryImages().subscribe(images => {
                expect(images).toEqual([]);
                done();
            });

            const req = httpMock.expectOne(`${environment.apiUrl}/GetGallery`);
            req.flush(null);
        });
    });
});
