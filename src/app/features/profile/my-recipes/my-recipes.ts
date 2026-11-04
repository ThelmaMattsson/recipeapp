import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeService } from '../../../core/services/recipe';
import { AuthService } from '../../../core/services/auth';
import { Recipe } from '../../../core/models/recipe.model';

@Component({
  selector: 'app-my-recipes',
  imports: [RouterLink],
  templateUrl: './my-recipes.html',
  styleUrl: './my-recipes.scss',
})
export class MyRecipes implements OnInit {
  private readonly recipeService = inject(RecipeService);
  private readonly authService = inject(AuthService);

  myRecipes = signal<Recipe[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

  async ngOnInit(): Promise<void> {
    try {
      const user = await this.authService.getUser();

      if (!user) {
        this.myRecipes.set([]);
        return;
      }

      this.recipeService.getRecipes().subscribe({
        next: (recipes) => {
          this.myRecipes.set(recipes.filter((recipe) => recipe.userId === user.id));
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          console.error('Could not get my recipes:', error);
          this.errorMessage.set('Could not load your recipes. Try again.');
          this.isLoading.set(false);
        },
      });
    } catch (error: unknown) {
      console.error('Could not get my recipes: ', error);
      this.errorMessage.set('Could not load your recipes. Try again.');
      this.isLoading.set(false);
    }
  }
}
