import { TestBed } from '@angular/core/testing';
import { ChangePasswordGuard } from './change-password.guard';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

describe('ChangePasswordGuard', () => {
  let guard: ChangePasswordGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChangePasswordGuard,
        { provide: AuthService, useValue: { mustChangePassword: () => false } },
        { provide: Router, useValue: { navigate: () => {} } }
      ]
    });

    guard = TestBed.inject(ChangePasswordGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});