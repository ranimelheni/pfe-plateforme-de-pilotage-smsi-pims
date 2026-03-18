import { TestBed } from '@angular/core/testing';

import { FicheProcessusService } from './fiche-processus.service';

describe('FicheProcessusService', () => {
  let service: FicheProcessusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FicheProcessusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
