import { Routes } from '@angular/router';
import { Auth } from './features/auth/auth';
import { Home } from './features/home/home';
import { RecipeList } from './shared/components/recipe-list/recipe-list';
import { RecipeDetail } from './features/recipes/recipe-detail/recipe-detail';
import { RecipeForm } from './features/recipes/recipe-form/recipe-form';
import { Collections } from './features/collections/collections';
import { Profile } from './features/profile/profile';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'recipes',
    component: RecipeList,
  },
  {
    path: 'recipes/new',
    component: RecipeForm,
  },
  {
    path: 'recipes/:id',
    component: RecipeDetail,
  },
  {
    path: 'recipes/:id/edit',
    component: RecipeForm,
  },
  {
    path: 'collections',
    component: Collections,
  },
  {
    path: 'profile',
    component: Profile,
  },
  {
    path: 'auth',
    component: Auth,
  },
];
