import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrganismService } from '../../services/organism.service';
import { Organism, SECTEURS, TYPES_ORG, TAILLES } from '../../models/models';

@Component({
  selector: 'app-organisms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './organisms.component.html',
  styleUrls: ['./organisms.component.scss']
})
export class OrganismsComponent implements OnInit {
  organisms: Organism[] = [];
  filtered:  Organism[] = [];
  loading    = false;
  showModal  = false;
  showDelete = false;
  editMode   = false;
  submitting = false;
  error      = '';
  success    = '';
  searchTerm = '';
  selectedOrg: Organism | null = null;

  secteurs = SECTEURS;
  typesOrg = TYPES_ORG;
  tailles  = TAILLES;

  form!: FormGroup;
auditTypes = [
  { value: 'smsi', label: 'SMSI (ISO 27001)' },
  { value: 'pims', label: 'PIMS (ISO 27701)' },
  { value: 'smsi_pims', label: 'SMSI + PIMS' }
];
  constructor(
    private fb: FormBuilder,
    private orgService: OrganismService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.load();
  }

  initForm(): void {
    this.form = this.fb.group({
      nom:           ['', [Validators.required, Validators.minLength(2)]],
      type_org:      ['', Validators.required],
      secteur:       ['', Validators.required],
      taille:        [''],
      siret:         [''],
      adresse:       [''],
      ville:         [''],
      pays:          ['France'],
      email_contact: ['', Validators.email],
      telephone:     [''],
      site_web:      [''],
      description:   [''],
      audit_type:    ['', Validators.required], 
      date_audit:    ['']
    });
  }

  load(): void {
    this.loading = true;
    this.orgService.getAll().subscribe({
      next: (data) => { this.organisms = data; this.filtered = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  search(): void {
    const t = this.searchTerm.toLowerCase();
    this.filtered = this.organisms.filter(o =>
      o.nom.toLowerCase().includes(t) ||
      (o.ville || '').toLowerCase().includes(t) ||
      (o.secteur || '').toLowerCase().includes(t)
    );
  }

  openCreate(): void {
    this.editMode = false;
    this.form.reset({ pays: 'France' });
    this.showModal = true;
    this.error = '';
  }

  openEdit(org: Organism, e: Event): void {
    e.stopPropagation();
    this.editMode = true; this.selectedOrg = org;
    this.form.patchValue(org);
    this.showModal = true; this.error = '';
  }

  openDelete(org: Organism, e: Event): void {
    e.stopPropagation();
    this.selectedOrg = org;
    this.showDelete = true;
  }

  closeModal(): void {
    this.showModal = false; this.showDelete = false; this.error = '';
  }

  goToActors(org: Organism): void {
    this.router.navigate(['/dashboard/organisms', org.id, 'actors']);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true; this.error = '';

    const action = this.editMode
      ? this.orgService.update(this.selectedOrg!.id, this.form.value)
      : this.orgService.create(this.form.value);

    action.subscribe({
      next: () => {
        this.submitting = false;
        this.closeModal(); this.load();
        this.success = this.editMode ? 'Organisme modifié avec succès' : 'Organisme créé avec succès';
        setTimeout(() => this.success = '', 3500);
      },
      error: (err) => { this.submitting = false; this.error = err.error?.error || 'Une erreur est survenue'; }
    });
  }

  confirmDelete(): void {
    if (!this.selectedOrg) return;
    this.orgService.delete(this.selectedOrg.id).subscribe({
      next: () => {
        this.closeModal(); this.load();
        this.success = 'Organisme désactivé';
        setTimeout(() => this.success = '', 3500);
      }
    });
  }

  getTypeLabel(value: string):    string { return this.typesOrg.find(t => t.value === value)?.label || value; }
  getSecteurLabel(value: string): string { return this.secteurs.find(s => s.value === value)?.label || value; }
  getTailleLabel(value: string):  string { return this.tailles.find(t => t.value === value)?.label || value; }

  get activeCount():   number { return this.organisms.filter(o => o.is_active).length; }
  get inactiveCount(): number { return this.organisms.filter(o => !o.is_active).length; }
}