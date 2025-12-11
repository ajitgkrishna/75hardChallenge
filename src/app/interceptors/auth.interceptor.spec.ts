import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
    let httpMock: HttpTestingController;
    let httpClient: HttpClient;
    let router: Router;

    beforeEach(() => {
        const routerSpy = {
            navigate: vi.fn()
        };

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
                { provide: Router, useValue: routerSpy }
            ]
        });

        httpMock = TestBed.inject(HttpTestingController);
        httpClient = TestBed.inject(HttpClient);
        router = TestBed.inject(Router);

        localStorage.clear();
    });

    afterEach(() => {
        httpMock.verify();
        localStorage.clear();
    });

    it('should add Authorization header when token exists', () => {
        localStorage.setItem('authToken', 'test-token-123');

        httpClient.get('/api/test').subscribe();

        const req = httpMock.expectOne('/api/test');
        expect(req.request.headers.has('Authorization')).toBe(true);
        expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');
        req.flush({});
    });

    it('should not add Authorization header when token does not exist', () => {
        localStorage.removeItem('authToken');

        httpClient.get('/api/test').subscribe();

        const req = httpMock.expectOne('/api/test');
        expect(req.request.headers.has('Authorization')).toBe(false);
        req.flush({});
    });

    it('should handle 401 errors by clearing storage and redirecting', () => {
        localStorage.setItem('authToken', 'expired-token');
        localStorage.setItem('currentUser', 'TestUser');

        httpClient.get('/api/test').subscribe({
            next: () => {
                throw new Error('should have errored');
            },
            error: (error) => {
                expect(error.status).toBe(401);
            }
        });

        const req = httpMock.expectOne('/api/test');
        req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

        expect(localStorage.getItem('authToken')).toBeNull();
        expect(localStorage.getItem('currentUser')).toBeNull();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should pass through other HTTP errors without clearing storage', () => {
        localStorage.setItem('authToken', 'valid-token');
        localStorage.setItem('currentUser', 'TestUser');

        httpClient.get('/api/test').subscribe({
            next: () => {
                throw new Error('should have errored');
            },
            error: (error) => {
                expect(error.status).toBe(500);
            }
        });

        const req = httpMock.expectOne('/api/test');
        req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

        expect(localStorage.getItem('authToken')).toBe('valid-token');
        expect(localStorage.getItem('currentUser')).toBe('TestUser');
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should handle 404 errors without clearing storage', () => {
        localStorage.setItem('authToken', 'valid-token');

        httpClient.get('/api/notfound').subscribe({
            next: () => {
                throw new Error('should have errored');
            },
            error: (error) => {
                expect(error.status).toBe(404);
            }
        });

        const req = httpMock.expectOne('/api/notfound');
        req.flush('Not Found', { status: 404, statusText: 'Not Found' });

        expect(localStorage.getItem('authToken')).toBe('valid-token');
    });

    it('should add token to multiple concurrent requests', () => {
        localStorage.setItem('authToken', 'test-token');

        httpClient.get('/api/test1').subscribe();
        httpClient.get('/api/test2').subscribe();

        const req1 = httpMock.expectOne('/api/test1');
        const req2 = httpMock.expectOne('/api/test2');

        expect(req1.request.headers.get('Authorization')).toBe('Bearer test-token');
        expect(req2.request.headers.get('Authorization')).toBe('Bearer test-token');

        req1.flush({});
        req2.flush({});
    });
});
