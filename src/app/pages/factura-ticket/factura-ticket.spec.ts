import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturaTicket } from './factura-ticket';

describe('FacturaTicket', () => {
  let component: FacturaTicket;
  let fixture: ComponentFixture<FacturaTicket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FacturaTicket],
    }).compileComponents();

    fixture = TestBed.createComponent(FacturaTicket);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
