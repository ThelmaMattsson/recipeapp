export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;

  cookingTime: number;
  servings: number;

  category: string;
  tags: string[];

  ingredients: Ingredient[];
  instructions: string[];

  createdAt: string;
}
