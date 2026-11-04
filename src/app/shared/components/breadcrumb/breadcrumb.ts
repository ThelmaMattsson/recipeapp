import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-breadcrumb',
  imports: [],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
})
export class Breadcrumb {
  constructor(
    private location: Location,
    private router: Router,
  ) {}

  goBack() {
    if (history.state?.navigationId > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/items']);
    }
  }
}
