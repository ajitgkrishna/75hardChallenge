import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;
    let router: Router;

    beforeEach(() => {
        const routerSpy = {
            navigate: vi.fn()
        };

        TestBed.configureTestingModule({
            providers: [
                AuthService,
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: Router, useValue: routerSpy }
            ]
        });

        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);
        router = TestBed.inject(Router);

        // Clear localStorage before each test
        localStorage.clear();
    });

    afterEach(() => {
        httpMock.verify();
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('login', () => {
        it('should login successfully and store token, userId, and username', (done) => {
            const username = 'Ajith';
            const password = 'test123';
            const mockResponse = {
                token: 'mock-jwt-token',
                userId: 'user-123'
            };

            service.login(username, password);

            const req = httpMock.expectOne(`${environment.apiUrl}/Login`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ username, password });

            req.flush(mockResponse);

            setTimeout(() => {
                expect(localStorage.getItem('authToken')).toBe('mock-jwt-token');
                expect(localStorage.getItem('userId')).toBe('user-123');
                expect(localStorage.getItem('currentUser')).toBe('Ajith');
                expect(router.navigate).toHaveBeenCalledWith(['/']);
                done();
            }, 100);
        });

        it('should update currentUser$ observable on successful login', (done) => {
            const username = 'Aiswarya';
            const mockResponse = {
                token: 'mock-token',
                userId: 'user-456'
            };

            service.currentUser$.subscribe(user => {
                if (user === 'Aiswarya') {
                    expect(user).toBe('Aiswarya');
                    done();
                }
            });

            service.login(username, 'password');

            const req = httpMock.expectOne(`${environment.apiUrl}/Login`);
            req.flush(mockResponse);
        });

        it('should handle login failure and show alert', (done) => {
            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            service.login('invalid', 'wrong');

            const req = httpMock.expectOne(`${environment.apiUrl}/Login`);
            req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

            setTimeout(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Login failed', expect.any(Object));
                expect(alertSpy).toHaveBeenCalledWith('Login failed. Please check your credentials.');
                expect(localStorage.getItem('authToken')).toBeNull();
                alertSpy.mockRestore();
                consoleSpy.mockRestore();
                done();
            }, 100);
        });
    });

    describe('logout', () => {
        it('should clear localStorage and navigate to login', () => {
            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('currentUser', 'TestUser');

            service.logout();

            expect(localStorage.getItem('authToken')).toBeNull();
            expect(localStorage.getItem('currentUser')).toBeNull();
            expect(router.navigate).toHaveBeenCalledWith(['/login']);
        });

        it('should update currentUser$ to null', (done) => {
            localStorage.setItem('currentUser', 'TestUser');

            service.logout();

            service.currentUser$.subscribe(user => {
                expect(user).toBeNull();
                done();
            });
        });
    });

    describe('isLoggedIn', () => {
        it('should return true when authToken exists', () => {
            localStorage.setItem('authToken', 'test-token');
            expect(service.isLoggedIn()).toBe(true);
        });

        it('should return false when authToken does not exist', () => {
            localStorage.removeItem('authToken');
            expect(service.isLoggedIn()).toBe(false);
        });
    });

    describe('getCurrentUser', () => {
        it('should return current user from subject', () => {
            localStorage.setItem('currentUser', 'TestUser');
            const service2 = new AuthService(TestBed.inject(HttpTestingController) as any, router);
            expect(service2.getCurrentUser()).toBe('TestUser');
        });

        it('should return null when no user is logged in', () => {
            expect(service.getCurrentUser()).toBeNull();
        });
    });
});
