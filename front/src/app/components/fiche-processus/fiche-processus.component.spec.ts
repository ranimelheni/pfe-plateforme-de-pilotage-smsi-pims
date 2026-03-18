import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FicheProcessusComponent } from './fiche-processus.component';

describe('FicheProcessusComponent', () => {
  let component: FicheProcessusComponent;
  let fixture: ComponentFixture<FicheProcessusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FicheProcessusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FicheProcessusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
