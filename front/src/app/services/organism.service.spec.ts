import { TestBed } from '@angular/core/testing';

import { OrganismService } from './organism.service';

describe('OrganismService', () => {
  let service: OrganismService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrganismService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
