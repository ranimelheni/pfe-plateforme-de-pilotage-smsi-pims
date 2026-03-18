import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!:   FormGroup;
  loading       = false;
  error         = '';
  showPassword  = false;
  loginType:    'admin' | 'actor' = 'admin';
  organismLabel = '';

  norms = [
    'ISO 27001 — Sécurité de l\'information',
    'ISO 27701 — Protection de la vie privée',
    'RGPD — Conformité réglementaire',
    'ISO 27005 / EBIOS RM — Gestion des risques'
  ];

  constructor(
    private fb:     FormBuilder,
    private auth:   AuthService,
    private http:   HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.auth.redirectAfterLogin(this.auth.getCurrentUser());
    }
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false]
    });
  }

  get email()    { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  setLoginType(type: 'admin' | 'actor'): void {
    this.loginType     = type;
    this.organismLabel = '';
    this.error         = '';
    this.loginForm.reset();
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }

  onEmailBlur(): void {
    if (this.loginType !== 'actor') return;
    const emailVal = this.email?.value;
    if (!emailVal || this.email?.invalid) return;

    this.http.get<{ organism: string }>(
      `http://localhost:5000/api/auth/resolve-organism?email=${emailVal}`
    ).subscribe({
      next:  (res) => { this.organismLabel = res.organism || ''; },
      error: ()    => { this.organismLabel = ''; }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.loading = true;
    this.error   = '';

    this.auth.login(this.loginForm.value.email, this.loginForm.value.password)
      .subscribe({
        next: (res) => {
          this.loading = false;

          if (this.loginType === 'admin' && res.user?.role !== 'super_admin') {
            this.error = 'Ce compte n\'est pas un administrateur système.';
            this.auth.logout();
            return;
          }
          if (this.loginType === 'actor' && res.user?.role === 'super_admin') {
            this.error = 'Utilisez l\'onglet Administrateur pour ce compte.';
            this.auth.logout();
            return;
          }

          // Lire le user depuis localStorage (déjà fusionné avec must_change_password)
          const storedUser = this.auth.getCurrentUser();
          this.auth.redirectAfterLogin(storedUser);
        },
        error: (err) => {
          this.loading = false;
          this.error   = err.error?.error || 'Identifiants incorrects';
        }
      });
  }
}