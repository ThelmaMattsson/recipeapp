import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isRegisterMode = signal(false);
  email = signal('');
  password = signal('');
  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);

  async submit(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.isLoading.set(true);

    try {
      if (this.isRegisterMode()) {
        const data = await this.authService.signUp(this.email(), this.password());

        if (!data.session) {
          this.successMessage.set(
            'Kontot är skapat! Kontrollera din e-post för att bekräfta kontot.',
          );
        } else {
          this.successMessage.set('Du är registrerad och inloggad!');
        }
      } else {
        await this.authService.signIn(this.email(), this.password());

        await this.router.navigate(['/']);
      }
    } catch (error: unknown) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Något gick fel. Försök igen.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleMode(): void {
    this.isRegisterMode.update((value) => !value);
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
