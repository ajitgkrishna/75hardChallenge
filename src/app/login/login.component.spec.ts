import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let authService: AuthService;

    beforeEach(async () => {
        const authServiceSpy = {
            login: vi.fn()
        };

        await TestBed.configureTestingModule({
            imports: [LoginComponent, FormsModule],
            providers: [
                { provide: AuthService, useValue: authServiceSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        authService = TestBed.inject(AuthService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with empty username and password', () => {
        expect(component.username).toBe('');
        expect(component.password).toBe('');
    });

    it('should call AuthService.login with username and password', () => {
        component.username = 'Ajith';
        component.password = 'test123';

        component.login();

        expect(authService.login).toHaveBeenCalledWith('Ajith', 'test123');
    });

    it('should not call AuthService.login when username is empty', () => {
        component.username = '';
        component.password = 'test123';

        component.login();

        expect(authService.login).not.toHaveBeenCalled();
    });

    it('should not call AuthService.login when password is empty', () => {
        component.username = 'Ajith';
        component.password = '';

        component.login();

        expect(authService.login).not.toHaveBeenCalled();
    });

    it('should not call AuthService.login when both fields are empty', () => {
        component.username = '';
        component.password = '';

        component.login();

        expect(authService.login).not.toHaveBeenCalled();
    });

    it('should trim whitespace and validate', () => {
        component.username = '   ';
        component.password = '   ';

        component.login();

        expect(authService.login).not.toHaveBeenCalled();
    });

    it('should call login when both fields have valid values after trimming', () => {
        component.username = '  Ajith  ';
        component.password = '  test123  ';

        component.login();

        expect(authService.login).toHaveBeenCalledWith('  Ajith  ', '  test123  ');
    });
});
