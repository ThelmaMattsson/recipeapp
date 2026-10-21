import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { of, switchMap } from 'rxjs';

import { Recipe } from '../../../core/models/recipe.model';
import { RecipeService } from '../../../core/services/recipe';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.scss',
})
export class RecipeDetail implements OnInit {
  recipe = signal<Recipe | undefined>(undefined);
  recipeId = signal<string | null>(null);
  showIngredients = signal<boolean>(true);
  showInstructions = signal<boolean>(false);
  isDeleting = signal(false);
  errorMessage = signal('');

  constructor(
    private route: ActivatedRoute,
    private recipeService: RecipeService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const recipeId = params.get('id');
          this.recipeId.set(recipeId);
          this.recipe.set(undefined);

          console.log('ID från URL:', recipeId);

          return recipeId ? this.recipeService.getRecipeById(recipeId) : of(undefined);
        }),
      )
      .subscribe({
        next: (recipe) => {
          console.log('Hittat recept:', recipe);
          this.recipe.set(recipe);
        },
        error: (error) => {
          console.error('Kunde inte hämta recept:', error);
        },
      });
  }

  instructionsClicked(event: MouseEvent): void {
    this.showInstructions.set(true);
    this.showIngredients.set(false);
  }

  ingredientsClicked(event: MouseEvent): void {
    this.showInstructions.set(false);
    this.showIngredients.set(true);
  }

  async deleteRecipe(id: string): Promise<void> {
    const confirmed = confirm(
      'Are you sure you want to delete this recipe? You can´t undo this action.',
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');

    try {
      await this.recipeService.deleteRecipe(id);

      await this.router.navigate(['/recipes']);
    } catch (error: unknown) {
      console.error('Could not delete recipe: ', error);

      this.errorMessage.set(
        error instanceof Error ? error.message : 'Could not delete recipe, try again.',
      );
    } finally {
      this.isDeleting.set(false);
    }
  }
}
