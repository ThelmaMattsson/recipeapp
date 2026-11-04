import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class SavedRecipesService {
  private readonly supabase = inject(SupabaseService).client;

  async getSavedRecipeIds(): Promise<string[]> {
    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) return [];

    const { data, error } = await this.supabase
      .from('saved_recipes')
      .select('recipe_id')
      .eq('user_id', userData.user.id);

    if (error) throw error;

    return data.map((row) => row.recipe_id);
  }

  async saveRecipe(recipeId: string): Promise<void> {
    const { data: userData, error: userError } = await this.supabase.auth.getUser();

    if (userError) throw userError;
    if (!userData.user) {
      throw new Error('You need to be logged in to save a recipe.');
    }

    const { error } = await this.supabase
      .from('saved_recipes')
      .insert({ user_id: userData.user.id, recipe_id: recipeId });

    if (error) throw error;
  }

  async unsaveRecipe(recipeId: string): Promise<void> {
    const { data: userData, error: userError } = await this.supabase.auth.getUser();

    if (userError) throw userError;
    if (!userData.user) {
      throw new Error('You need to be logged in to remove saved recipe.');
    }

    const { error } = await this.supabase
      .from('saved_recipes')
      .delete()
      .eq('user_id', userData.user.id)
      .eq('recipe_id', recipeId);

    if (error) throw error;
  }
}
