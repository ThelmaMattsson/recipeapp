import { Component, Input } from '@angular/core';
import { Recipe } from '../../../core/models/recipe.model';
import { RouterLink } from '@angular/router';
import { ProfileService } from '../../../core/services/profile';
import { Profile as UserProfile } from '../../../core/models/profile.model';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recipe-card.html',
  styleUrl: './recipe-card.scss',
})
export class RecipeCard {
  @Input({ required: true }) recipe!: Recipe;
  @Input() profile: UserProfile | Pick<UserProfile, 'id' | 'username'> | null = null;
}
