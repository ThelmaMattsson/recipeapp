import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesktopNav } from './desktop-nav';

describe('DesktopNav', () => {
  let component: DesktopNav;
  let fixture: ComponentFixture<DesktopNav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesktopNav]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesktopNav);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
