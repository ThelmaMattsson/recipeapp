import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async logOut(): Promise<void> {
    try {
      await this.authService.signOut();
      await this.router.navigate(['/auth']);
    } catch (error: unknown) {
      console.error('Kunde inte logga ut:', error);
    }
  }
}
