import { Component, signal } from '@angular/core';
import { RecipeCard } from '../../shared/components/recipe-card/recipe-card';
import { RecipeService } from '../../core/services/recipe';
import { Recipe } from '../../core/models/recipe.model';

@Component({
  selector: 'app-home',
  imports: [RecipeCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  recipes = signal<Recipe[]>([]);

  constructor(private recipeService: RecipeService) {
    this.recipeService.getRecipes().subscribe((recipes) => {
      this.recipes.set(recipes);
    });
  }
}
