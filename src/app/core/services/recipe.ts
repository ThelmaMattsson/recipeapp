import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Recipe } from '../../core/models/recipe.model';
import { SupabaseService } from './supabase.service';
import { UntypedFormGroup } from '@angular/forms';

interface SupabaseRecipeRow {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  cooking_time: number | null;
  servings: string | null;
  category: string | null;
  created_at: string;
  recipe_ingredients: {
    name: string;
    amount: string | null;
    unit: string | null;
    position: number;
  }[];
  recipe_instructions: {
    instruction: string;
    position: number;
  }[];
  recipe_tags: {
    tag: string;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private supabase = inject(SupabaseService);

  private readonly recipeSelect = `
    *,
    recipe_ingredients (
      name,
      amount,
      unit,
      position
    ),
    recipe_instructions (
      instruction,
      position
    ),
    recipe_tags (
      tag
    )
  `;

  getRecipes(): Observable<Recipe[]> {
    return from(
      this.supabase.client
        .from('recipes')
        .select(this.recipeSelect)
        .order('created_at', { ascending: false }),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        return ((data ?? []) as unknown as SupabaseRecipeRow[]).map((row) => this.mapRecipe(row));
      }),
    );
  }

  getRecipeById(id: string): Observable<Recipe | undefined> {
    return from(
      this.supabase.client.from('recipes').select(this.recipeSelect).eq('id', id).maybeSingle(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        if (!data) {
          return undefined;
        }

        return this.mapRecipe(data as unknown as SupabaseRecipeRow);
      }),
    );
  }

  async createRecipe(recipe: Omit<Recipe, 'id' | 'createdAt'>): Promise<string> {
    const supabase = this.supabase.client;

    //Check that user is logged in
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;

    const user = userData.user;

    if (!user) {
      throw new Error('You need to be signed in to create a recipe.');
    }

    //2. Save recipe information
    const { data: savedRecipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        user_id: user.id,
        title: recipe.title,
        description: recipe.description || null,
        image_url: recipe.imageUrl || null,
        cooking_time: recipe.cookingTime || null,
        servings: recipe.servings || null,
        category: recipe.category || null,
      })
      .select('id')
      .single();

    if (recipeError) throw recipeError;

    const recipeId = savedRecipe.id;

    try {
      //3. Save ingredients}
      if (recipe.ingredients.length > 0) {
        const { error } = await supabase.from('recipe_ingredients').insert(
          recipe.ingredients.map((ingredient, index) => ({
            recipe_id: recipeId,
            name: ingredient.name,
            amount: ingredient.amount || null,
            unit: ingredient.unit || null,
            position: index,
          })),
        );
        if (error) throw error;
      }

      //4. Save instructions
      if (recipe.instructions.length > 0) {
        const { error } = await supabase.from('recipe_instructions').insert(
          recipe.instructions.map((instruction, index) => ({
            recipe_id: recipeId,
            instruction,
            position: index,
          })),
        );

        if (error) throw error;
      }

      //5. Save tags
      const tags = [
        ...new Set(recipe.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)),
      ];

      if (tags.length > 0) {
        const { error } = await supabase.from('recipe_tags').insert(
          tags.map((tag) => ({
            recipe_id: recipeId,
            tag,
          })),
        );

        if (error) throw error;
      }
      return recipeId;
    } catch (error) {
      //Remove recipe if any of the other saves fails
      //ON DELETE CASCADE also deletes related rows
      const { error: deleteError } = await supabase.from('recipes').delete().eq('id', recipeId);

      if (deleteError) {
        console.error('Coulnd not remove the full recipe: ', deleteError);
      }

      throw error;
    }
  }

  async updateRecipe(id: string, recipe: Omit<Recipe, 'id' | 'createdAt'>): Promise<void> {
    const supabase = this.supabase.client;

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;

    if (!userData.user) {
      throw new Error('You need to be logged in to edit a recipe.');
    }

    const { error: recipeError } = await supabase
      .from('recipes')
      .update({
        title: recipe.title,
        description: recipe.description || null,
        image_url: recipe.imageUrl || null,
        cooking_time: recipe.cookingTime || null,
        servings: recipe.servings || null,
        category: recipe.category || null,
      })
      .eq('id', id);

    if (recipeError) throw recipeError;

    //Replace old ingredients with new ones
    const { error: ingredientDeleteError } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', id);

    if (ingredientDeleteError) throw ingredientDeleteError;

    const ingredients = recipe.ingredients.map((ingredient, index) => ({
      recipe_id: id,
      name: ingredient.name,
      amount: ingredient.amount || null,
      unit: ingredient.unit || null,
      position: index,
    }));

    if (ingredients.length > 0) {
      const { error } = await supabase.from('recipe_ingredients').insert(ingredients);

      if (error) throw error;
    }

    //replace old instructions with new
    const { error: instructionDeleteError } = await supabase
      .from('recipe_instructions')
      .delete()
      .eq('recipe_id', id);

    if (instructionDeleteError) throw instructionDeleteError;

    const instructions = recipe.instructions.map((instruction, index) => ({
      recipe_id: id,
      instruction,
      position: index,
    }));

    if (instructions.length > 0) {
      const { error } = await supabase.from('recipe_instructions').insert(instructions);

      if (error) throw error;
    }

    //Replace old tags with new
    const { error: tagDeleteError } = await supabase
      .from('recipe_tags')
      .delete()
      .eq('recipe_id', id);

    if (tagDeleteError) throw tagDeleteError;

    const tags = [...new Set(recipe.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0))];

    if (tags.length > 0) {
      const { error } = await supabase.from('recipe_tags').insert(
        tags.map((tag) => ({
          recipe_id: id,
          tag,
        })),
      );

      if (error) throw error;
    }
  }

  async deleteRecipe(id: string): Promise<void> {
    const supabase = this.supabase.client;

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;

    if (!userData.user) {
      throw new Error('You need to be logged in to delete a recipe.');
    }

    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)
      .eq('user_id', userData.user.id)
      .select('id')
      .single();

    if (error) {
      throw new Error('Could not delete recipe. You can only delete your own recipes.');
    }
  }

  async uploadRecipeImage(file: File): Promise<string> {
    const supabase = this.supabase.client;

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;

    const user = userData.user;

    if (!user) {
      throw new Error('You need to be logged in to upload a picture.');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Chose a valid image file.');
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('recipe-images').getPublicUrl(filePath);

    return data.publicUrl;
  }

  private mapRecipe(row: SupabaseRecipeRow): Recipe {
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? '',
      imageUrl: row.image_url ?? undefined,
      cookingTime: row.cooking_time ?? 0,
      servings: row.servings ?? '',
      category: row.category ?? '',
      tags: (row.recipe_tags ?? []).map((item) => item.tag),
      ingredients: [...(row.recipe_ingredients ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          name: item.name,
          amount: item.amount ?? '',
          unit: item.unit ?? '',
        })),
      instructions: [...(row.recipe_instructions ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((item) => item.instruction),
      createdAt: row.created_at,
    };
  }
}
