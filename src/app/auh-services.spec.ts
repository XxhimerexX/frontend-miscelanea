import { TestBed } from '@angular/core/testing';

import { AuhServices } from './auh-services';

describe('AuhServices', () => {
  let service: AuhServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuhServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
