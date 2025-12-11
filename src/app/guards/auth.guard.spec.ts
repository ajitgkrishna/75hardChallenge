import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
    let authService: AuthService;
    let router: Router;

    beforeEach(() => {
        const authServiceSpy = {
            isLoggedIn: vi.fn()
        };

        const routerSpy = {
            createUrlTree: vi.fn()
        };

        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: authServiceSpy },
                { provide: Router, useValue: routerSpy }
            ]
        });

        authService = TestBed.inject(AuthService);
        router = TestBed.inject(Router);
    });

    it('should allow access when user is logged in', () => {
        authService.isLoggedIn = vi.fn().mockReturnValue(true);

        const result = TestBed.runInInjectionContext(() =>
            authGuard({} as any, {} as any)
        );

        expect(result).toBe(true);
        expect(authService.isLoggedIn).toHaveBeenCalled();
    });

    it('should redirect to login when user is not logged in', () => {
        const mockUrlTree = {} as UrlTree;
        authService.isLoggedIn = vi.fn().mockReturnValue(false);
        router.createUrlTree = vi.fn().mockReturnValue(mockUrlTree);

        const result = TestBed.runInInjectionContext(() =>
            authGuard({} as any, {} as any)
        );

        expect(result).toBe(mockUrlTree);
        expect(authService.isLoggedIn).toHaveBeenCalled();
        expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    });

    it('should check authentication status on each call', () => {
        authService.isLoggedIn = vi.fn().mockReturnValue(true);

        TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
        TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

        expect(authService.isLoggedIn).toHaveBeenCalledTimes(2);
    });
});
