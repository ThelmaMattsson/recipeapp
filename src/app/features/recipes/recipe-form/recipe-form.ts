import { signal, inject, Component, createNgModule } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RecipeService } from '../../../core/services/recipe';
import { Recipe } from '../../../core/models/recipe.model';
import { AuthService } from '../../../core/services/auth';
import { Breadcrumb } from '../../../shared/components/breadcrumb/breadcrumb';
import { DropdownMenu } from '../../../shared/components/dropdown-menu/dropdown-menu';

type RecipeFormValue = {
  title: string;
  description: string;
  cookingTime: number;
  servings: string;
  category: string;
  tags: string[];
  ingredients: {
    name: string;
    amount: string;
    unit: string;
  }[];
  instructions: string[];
};

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [ReactiveFormsModule, Breadcrumb, DropdownMenu],
  templateUrl: './recipe-form.html',
  styleUrl: './recipe-form.scss',
})
export class RecipeForm {
  recipeForm;
  selectedImage?: File;
  imagePreview = signal<string | null>(null);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  isEditMode = signal(false);
  isSaving = signal(false);
  errorMessage = signal('');
  recipeId: string | null = null;
  existingImageUrl: string | undefined;
  isDeleting = signal(false);

  constructor(private fb: FormBuilder) {
    this.recipeForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      cookingTime: [0, Validators.min(1)],
      servings: ['', Validators.min(1)],
      category: [''],
      tags: this.fb.array([]),
      ingredients: this.fb.array([]),
      instructions: this.fb.array([]),
    });
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.recipeId = id;
      this.isEditMode.set(true);
      this.loadRecipe(id);
    }
  }
  private recipeService = inject(RecipeService);
  private authService = inject(AuthService);

  private loadRecipe(id: string): void {
    this.recipeService.getRecipeById(id).subscribe(async (recipe) => {
      if (!recipe) {
        this.router.navigate(['/recipes']);
        return;
      }

      const user = await this.authService.getUser();

      if (!user || recipe.userId !== user.id) {
        this.router.navigate(['/recipes']);
        return;
      }

      this.existingImageUrl = recipe.imageUrl;

      this.recipeForm.patchValue({
        title: recipe.title,
        description: recipe.description,
        cookingTime: recipe.cookingTime,
        servings: recipe.servings,
        category: recipe.category,
      });

      this.loadTags(recipe.tags);
      this.loadIngredients(recipe.ingredients);
      this.loadInstructions(recipe.instructions);
    });
  }

  private loadTags(tags: string[]): void {
    this.tags.clear();

    tags.forEach((tag) => {
      this.tags.push(this.fb.control(tag, Validators.required));
    });
  }

  private loadIngredients(ingredients: Recipe['ingredients']): void {
    this.ingredients.clear();

    ingredients.forEach((ingredient) => {
      this.ingredients.push(
        this.fb.group({
          name: [ingredient.name, Validators.required],
          amount: [ingredient.amount, Validators.required],
          unit: [ingredient.unit, Validators.required],
        }),
      );
    });
  }

  private loadInstructions(instructions: string[]): void {
    this.instructions.clear();

    instructions.forEach((instruction) => {
      this.instructions.push(this.fb.control(instruction, Validators.required));
    });
  }

  get tags(): FormArray {
    return this.recipeForm.get('tags') as FormArray;
  }

  get ingredients(): FormArray {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  get instructions(): FormArray {
    return this.recipeForm.get('instructions') as FormArray;
  }

  addTag(): void {
    this.tags.push(this.fb.control('', Validators.required));
  }

  removeTag(index: number): void {
    this.tags.removeAt(index);
  }

  addIngredient(): void {
    this.ingredients.push(
      this.fb.group({
        name: ['', Validators.required],
        amount: ['', Validators.required],
        unit: ['', Validators.required],
      }),
    );
  }

  removeIngredient(index: number): void {
    this.ingredients.removeAt(index);
  }

  addInstruction(): void {
    this.instructions.push(this.fb.control('', Validators.required));
  }

  removeInstruction(index: number): void {
    this.instructions.removeAt(index);
  }

  async submit(): Promise<void> {
    if (this.recipeForm.invalid) {
      this.recipeForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    try {
      const formValue = this.recipeForm.getRawValue() as RecipeFormValue;
      let imageUrl = this.existingImageUrl;
      if (this.selectedImage) {
        imageUrl = await this.recipeService.uploadRecipeImage(this.selectedImage);
      }

      const recipeData = {
        title: formValue.title.trim(),
        description: formValue.description.trim(),
        cookingTime: Number(formValue.cookingTime),
        servings: String(formValue.servings),
        category: formValue.category.trim(),
        imageUrl,
        tags: formValue.tags,
        ingredients: formValue.ingredients.map((ingredient) => ({
          name: ingredient.name.trim(),
          amount: ingredient.amount.trim(),
          unit: ingredient.unit.trim(),
        })),
        instructions: formValue.instructions.map((instruction) => instruction.trim()),
      };

      let recipeId: string;

      if (this.isEditMode() && this.recipeId) {
        await this.recipeService.updateRecipe(this.recipeId, recipeData);

        recipeId = this.recipeId;
      } else {
        recipeId = await this.recipeService.createRecipe(recipeData);
      }

      await this.router.navigate(['/recipes', recipeId]);
    } catch (error: unknown) {
      console.error('Could not save recipe: ', error);

      this.errorMessage.set(
        error instanceof Error ? error.message : 'Kunde inte spare receotet. Försök igen.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(['/']);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      return;
    }

    this.selectedImage = file;

    const reader = new FileReader();

    reader.onload = () => {
      this.imagePreview.set(reader.result as string);
    };

    reader.readAsDataURL(file);
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
