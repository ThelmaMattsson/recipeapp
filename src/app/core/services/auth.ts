import { Injectable, inject, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;
  readonly user = signal<User | null>(null);
  readonly isLoggedIn = signal(false);

  constructor() {
    // Get current session when app starts
    this.supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Could not get session: ', error.message);
        return;
      }
      const currentUser = data.session?.user ?? null;

      this.user.set(currentUser);
      this.isLoggedIn.set(!!currentUser);
    });

    //Keep status updated on login and logout
    this.supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;

      this.user.set(currentUser);
      this.isLoggedIn.set(!!currentUser);
    });
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.withTimeout(this.supabase.auth.signUp({ email, password }));

    if (error) {
      throw error;
    }

    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.withTimeout(
      this.supabase.auth.signInWithPassword({ email, password }),
    );

    if (error) {
      throw error;
    }

    return data;
  }

  async signOut() {
    const { error } = await this.withTimeout(this.supabase.auth.signOut());

    if (error) {
      throw error;
    }
  }

  async getUser() {
    const { data, error } = await this.withTimeout(this.supabase.auth.getUser());

    if (error) {
      throw error;
    }

    return data.user;
  }

  private async withTimeout<T>(promise: Promise<T>): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () =>
              reject(
                new Error('Anropet tog för lång tid. Kontrollera anslutningen och försök igen.'),
              ),
            15000,
          );
        }),
      ]);
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }
}
