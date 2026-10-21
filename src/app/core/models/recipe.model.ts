export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export interface Recipe {
  id: string;
  userId: string | null;
  title: string;
  description: string;
  imageUrl?: string;

  cookingTime: number;
  servings: string;

  category: string;
  tags: string[];

  ingredients: Ingredient[];
  instructions: string[];

  createdAt: string;
}
