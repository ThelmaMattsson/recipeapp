import { Injectable, inject } from '@angular/core';
import { Profile } from '../models/profile.model';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly supabase = inject(SupabaseService).client;

  async getMyProfile(): Promise<Profile | null> {
    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    if (userError) {
      throw userError;
    }

    if (!userData.user) {
      return null;
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as Profile | null;
  }

  async getProfilesByIds(ids: string[]): Promise<Pick<Profile, 'id' | 'username'>[]> {
    if (ids.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, username')
      .in('id', ids);

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async updateMyProfile(
    updates: Pick<Profile, 'username' | 'display_name' | 'bio' | 'avatar_url'>,
  ): Promise<void> {
    const { data: userData, error: userError } = await this.supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!userData.user) {
      throw new Error('You need to be logged in to edit profile.');
    }

    const { error } = await this.supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userData.user.id);

    if (error) {
      throw error;
    }
  }
}
