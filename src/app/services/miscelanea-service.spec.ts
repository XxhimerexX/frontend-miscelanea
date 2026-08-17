import { TestBed } from '@angular/core/testing';

import { MiscelaneaService } from './miscelanea-service';

describe('MiscelaneaService', () => {
  let service: MiscelaneaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MiscelaneaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
