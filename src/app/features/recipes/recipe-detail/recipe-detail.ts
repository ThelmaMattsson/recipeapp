import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { Recipe } from '../../../core/models/recipe.model';
import { RecipeService } from '../../../core/services/recipe';
import { SavedRecipesService } from '../../../core/services/saved-recipes';
import { Breadcrumb } from '../../../shared/components/breadcrumb/breadcrumb';
import { DropdownMenu } from '../../../shared/components/dropdown-menu/dropdown-menu';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [RouterLink, Breadcrumb, DropdownMenu],
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
  private authService = inject(AuthService);
  private savedRecipesService = inject(SavedRecipesService);
  isSaved = signal(false);
  isSaving = signal(false);

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
          void this.checkIfSaved(recipe?.id);
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

  canManageRecipe = computed(() => {
    const recipe = this.recipe();
    const user = this.authService.user();

    return !!user && !!recipe && recipe.userId === user.id;
  });

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

  async checkIfSaved(recipeId: string | undefined): Promise<void> {
    this.isSaved.set(false);

    if (!recipeId || !this.authService.isLoggedIn()) {
      return;
    }

    try {
      const savedIds = await this.savedRecipesService.getSavedRecipeIds();
      this.isSaved.set(savedIds.includes(recipeId));
    } catch (error) {
      console.error('Could not check saved recipe: ', error);
    }
  }

  async toggleSaved(): Promise<void> {
    const recipeId = this.recipeId();

    if (!recipeId || this.isSaving()) {
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.errorMessage.set('You need to be logged in to save recipe.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    try {
      if (this.isSaved()) {
        await this.savedRecipesService.unsaveRecipe(recipeId);
        this.isSaved.set(false);
      } else {
        await this.savedRecipesService.saveRecipe(recipeId);
        this.isSaved.set(true);
      }
    } catch (error) {
      console.error('Could not change saved recipe: ', error);
      this.errorMessage.set('Could not save recipe. Try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
