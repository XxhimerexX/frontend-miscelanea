import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nopagefound } from './nopagefound';

describe('Nopagefound', () => {
  let component: Nopagefound;
  let fixture: ComponentFixture<Nopagefound>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Nopagefound],
    }).compileComponents();

    fixture = TestBed.createComponent(Nopagefound);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
