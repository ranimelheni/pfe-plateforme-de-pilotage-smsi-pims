import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {
  form: FormGroup;
  loading = false;
  error   = '';

  constructor(
    private fb:     FormBuilder,
    private auth:   AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      old_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm:      ['', Validators.required]
    }, { validators: this.passwordsMatch });
  }

  passwordsMatch(g: FormGroup) {
    return g.get('new_password')?.value === g.get('confirm')?.value
      ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error   = '';

    this.auth.changePassword(
      this.form.value.old_password,
      this.form.value.new_password
    ).subscribe({
      next: () => {
        this.loading = false;
        // Mettre à jour le user en local
        const user = this.auth.getCurrentUser();
        user.must_change_password = false;
        localStorage.setItem('user', JSON.stringify(user));
        // Rediriger vers son espace
        this.auth.redirectAfterLogin(user);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Erreur lors du changement';
      }
    });
  }
}