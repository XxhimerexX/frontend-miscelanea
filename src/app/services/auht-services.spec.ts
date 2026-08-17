import { TestBed } from '@angular/core/testing';

import { AuhtServices } from './auht-services';

describe('AuhtServices', () => {
  let service: AuhtServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuhtServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
