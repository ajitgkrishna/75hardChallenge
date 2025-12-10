import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card-wrapper">
        <header class="header">
          <h1>
            <span class="hard-text">#75HARD</span>
            <span class="checklist-text">Login</span>
          </h1>
        </header>

        <div class="week-card login-card">
          <div class="week-header">
            <h2>User Login</h2>
            <div class="days-header">
              <!-- Decorative circles mimicking the week view -->
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
          </div>
          
          <div class="tasks-list">
            <div class="form-group">
              <label for="username">Username</label>
              <input 
                type="text" 
                id="username" 
                [(ngModel)]="username" 
                placeholder="Enter your name"
                autofocus>
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input 
                type="password" 
                id="password" 
                [(ngModel)]="password" 
                (keyup.enter)="login()"
                placeholder="Enter your password">
            </div>

            <button (click)="login()" [disabled]="!username || !password" class="login-btn">
              Start Challenge
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background-image: url('/assets/bg-brushes.png');
      background-size: 100% auto;
      background-position: top center;
      background-repeat: no-repeat;
      font-family: 'Montserrat', sans-serif;
    }

    .login-card-wrapper {
      width: 100%;
      max-width: 400px;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    h1 {
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: baseline;
      gap: 10px;
      line-height: 1.2;
    }

    .hard-text {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: 2.5rem;
      color: #00897B;
      letter-spacing: 2px;
    }

    .checklist-text {
      font-family: 'Satisfy', cursive;
      font-weight: 400;
      font-size: 3.5rem;
      color: #004D40;
      transform: rotate(-5deg);
    }

    /* Week Card Style Matching */
    .week-card {
      background: transparent;
      font-family: 'Montserrat', sans-serif;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .week-header {
      background-color: #B2DFDB; /* Light Teal matches image */
      padding: 12px 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 0;
    }

    .week-header h2 {
      color: #37474F;
      font-size: 1.3rem;
      font-weight: 700;
      margin: 0;
      text-transform: capitalize;
      letter-spacing: 0.5px;
    }

    .days-header {
      display: flex;
      gap: 5px;
    }

    .dot {
      width: 8px;
      height: 8px;
      background-color: #00695C;
      border-radius: 50%;
      opacity: 0.5;
    }

    .tasks-list {
      background: rgba(255, 255, 255, 0.95);
      padding: 25px;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #546E7A;
      font-weight: 600;
      font-size: 0.95rem;
    }

    input {
      width: 100%;
      padding: 12px;
      border: 1px solid #CFD8DC;
      background-color: #F5F7F8;
      border-radius: 0; /* Boxy input to match theme */
      font-size: 1rem;
      font-family: 'Montserrat', sans-serif;
      outline: none;
      transition: all 0.2s;
      box-sizing: border-box;
      color: #37474F;
    }

    input:focus {
      border-color: #00897B;
      background-color: #fff;
      box-shadow: 0 0 0 2px rgba(0, 137, 123, 0.1);
    }

    .login-btn {
      width: 100%;
      padding: 15px;
      background-color: #00897B;
      color: white;
      border: none;
      border-radius: 25px; /* Pill shape for button remains distinctive or could be square */
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 10px;
    }

    .login-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 137, 123, 0.3);
    }

    .login-btn:disabled {
      background-color: #B0BEC5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  private authService = inject(AuthService);

  login() {
    if (this.username.trim() && this.password.trim()) {
      this.authService.login(this.username, this.password);
    }
  }
}
