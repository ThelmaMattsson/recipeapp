import { Component, signal } from '@angular/core';
import { RecipeCard } from '../../shared/components/recipe-card/recipe-card';
import { RecipeService } from '../../core/services/recipe';
import { Recipe } from '../../core/models/recipe.model';
import { ProfileService } from '../../core/services/profile';
import { Profile } from '../../core/models/profile.model';

@Component({
  selector: 'app-home',
  imports: [RecipeCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  recipes = signal<Recipe[]>([]);
  profiles = signal<Partial<Record<string, Pick<Profile, 'id' | 'username'>>>>({});
  errorMessage = signal('');

  constructor(
    private recipeService: RecipeService,
    private profileService: ProfileService,
  ) {
    this.recipeService.getRecipes().subscribe({
      next: (recipes) => {
        this.recipes.set(recipes);

        const ownerIds = [
          ...new Set(
            recipes
              .map((recipe) => recipe.userId)
              .filter((userId): userId is string => userId !== null),
          ),
        ];
        this.profileService
          .getProfilesByIds(ownerIds)
          .then((profiles) => {
            this.profiles.set(
              Object.fromEntries(profiles.map((profile) => [profile.id, profile])),
            );
          })
          .catch((error: unknown) => {
            console.error('Could not load recipe owner profiles:', error);
            this.errorMessage.set('Could not load recipe owner usernames.');
          });
      },
      error: (error: unknown) => {
        console.error('Could not load recipes:', error);
        this.errorMessage.set('Could not load recipes. Try again later.');
      },
    });
  }
}
