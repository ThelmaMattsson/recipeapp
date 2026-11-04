import { ImplicitReceiver } from '@angular/compiler';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeService } from '../../../core/services/recipe';
import { SavedRecipesService } from '../../../core/services/saved-recipes';
import { Recipe } from '../../../core/models/recipe.model';

@Component({
  selector: 'app-saved-recipes',
  imports: [RouterLink],
  templateUrl: './saved-recipes.html',
  styleUrl: './saved-recipes.scss',
})
export class SavedRecipes implements OnInit {
  private readonly recipeService = inject(RecipeService);
  private readonly savedRecipesService = inject(SavedRecipesService);

  savedRecipes = signal<Recipe[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

  async ngOnInit(): Promise<void> {
    try {
      const savedIds = await this.savedRecipesService.getSavedRecipeIds();

      this.recipeService.getRecipes().subscribe({
        next: (recipes) => {
          this.savedRecipes.set(recipes.filter((recipe) => savedIds.includes(recipe.id)));
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error(error);
          this.errorMessage.set('Could not load saved recipes.');
          this.isLoading.set(false);
        },
      });
    } catch (error) {
      console.error(error);
      this.errorMessage.set('Could not load saved recipes.');
      this.isLoading.set(false);
    }
  }
}
