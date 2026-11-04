import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../core/services/profile';
import { Profile as UserProfile } from '../../core/models/profile.model';
import { MyRecipes } from './my-recipes/my-recipes';
import { SavedRecipes } from './saved-recipes/saved-recipes';
import { DropdownMenu } from '../../shared/components/dropdown-menu/dropdown-menu';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, FormsModule, MyRecipes, SavedRecipes, DropdownMenu],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);

  profile = signal<UserProfile | null>(null);
  isEditing = signal(false);
  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  activeTab = signal<'my' | 'saved'>('my');

  username = '';
  displayName = '';
  bio = '';

  async ngOnInit(): Promise<void> {
    try {
      const profile = await this.profileService.getMyProfile();
      this.profile.set(profile);

      if (profile) {
        this.username = profile.username ?? '';
        this.displayName = profile.display_name ?? '';
        this.bio = profile.bio ?? '';
      }
    } catch (error: unknown) {
      console.error('Could not get profile: ', error);
      this.errorMessage.set('Could not get profile. Try again');
    } finally {
      this.isLoading.set(false);
    }
  }

  startEditing(): void {
    const profile = this.profile();

    this.username = profile?.username ?? '';
    this.displayName = profile?.display_name ?? '';
    this.bio = profile?.bio ?? '';

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.errorMessage.set('');
  }

  async saveProfile(): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await this.profileService.updateMyProfile({
        username: this.username.trim() || null,
        display_name: this.displayName.trim() || null,
        bio: this.bio.trim() || null,
        avatar_url: this.profile()?.avatar_url ?? null,
      });

      const updatedProfile = await this.profileService.getMyProfile();
      this.profile.set(updatedProfile);
      this.isEditing.set(false);
      this.successMessage.set('Profile has been updated!');
    } catch (error: unknown) {
      console.error('Could not update profile: ', error);

      this.errorMessage.set(
        error instanceof Error && error.message.includes('duplicate key')
          ? 'User name is already used.'
          : 'Could not save profile. Verify inputs and try again.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  async logOut(): Promise<void> {
    try {
      await this.authService.signOut();
      await this.router.navigate(['/auth']);
    } catch (error: unknown) {
      console.error('Could not log out:', error);
      this.errorMessage.set('Could not log out. Try again,');
    }
  }
}
