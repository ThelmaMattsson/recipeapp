import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-dropdown-menu',
  imports: [],
  templateUrl: './dropdown-menu.html',
  styleUrl: './dropdown-menu.scss',
})
export class DropdownMenu {
  isDropdownOpen = signal(false);

  toggleDropdown() {
    this.isDropdownOpen.update((isOpen) => !isOpen);
  }

  closeDropdown() {
    this.isDropdownOpen.set(false);
  }
}
