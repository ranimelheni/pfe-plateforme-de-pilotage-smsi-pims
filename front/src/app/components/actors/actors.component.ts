import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ActorService } from '../../services/actor.service';
import { OrganismService } from '../../services/organism.service';
import { User, Role, Organism } from '../../models/models';

@Component({
  selector: 'app-actors',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatePipe],
  templateUrl: './actors.component.html',
  styleUrls: ['./actors.component.scss']
})
export class ActorsComponent implements OnInit {
  actors:   User[]     = [];
  filtered: User[]     = [];
  roles:    Role[]     = [];
  organism: Organism | null = null;
  orgId!:   number;

  loading    = false;
  showModal  = false;
  showDelete = false;
  showReset  = false;
  editMode   = false;
  submitting = false;
  error      = '';
  success    = '';
  searchTerm = '';
  filterRole = '';
  selectedActor: User | null = null;
  tempPassword  = '';

  form!: FormGroup;

  ROLE_COLORS: Record<string, string> = {
    rssi:                   'blue',
    dpo:                    'purple',
    iso:                    'teal',
    auditeur_interne:       'amber',
    auditeur_externe:       'amber',
    pilote_processus:       'green',
    proprietaire_risque:    'coral',
    proprietaire_actif:     'coral',
    responsable_conformite: 'teal',
    soc:                    'red',
    responsable_qualite:    'green',
    utilisateur_metier:     'gray',
    direction:              'blue',
    comite_securite:        'purple',
    admin_organism:         'blue'
  };

  constructor(
    private fb: FormBuilder,
    private actorService: ActorService,
    private orgService: OrganismService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.orgId = +this.route.snapshot.params['id'];
    this.initForm();
    this.loadOrganism();
    this.loadRoles();
    this.load();
  }

  initForm(): void {
    this.form = this.fb.group({
      prenom:    ['', Validators.required],
      nom:       ['', Validators.required],
      email:     ['', [Validators.required, Validators.email]],
      role:      ['', Validators.required],
      telephone: [''],
      processus_pilote: ['']

    });
      this.form.get('role')?.valueChanges.subscribe(role => {
    const ctrl = this.form.get('processus_pilote');
    if (role === 'pilote_processus') {
      ctrl?.setValidators(Validators.required);
    } else {
      ctrl?.clearValidators();
      ctrl?.setValue('');
    }
    ctrl?.updateValueAndValidity();
  });
  }
  
  loadOrganism(): void { this.orgService.getById(this.orgId).subscribe(o => this.organism = o); }
  loadRoles():    void { this.actorService.getRoles().subscribe(r => this.roles = r); }

  load(): void {
    this.loading = true;
    this.actorService.getAll(this.orgId).subscribe({
      next: (data) => { this.actors = data; this.filtered = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  search(): void {
    let list = this.actors;
    if (this.filterRole) list = list.filter(a => a.role === this.filterRole);
    if (this.searchTerm) {
      const t = this.searchTerm.toLowerCase();
      list = list.filter(a =>
        a.nom.toLowerCase().includes(t) ||
        a.prenom.toLowerCase().includes(t) ||
        a.email.toLowerCase().includes(t)
      );
    }
    this.filtered = list;
  }

  openCreate(): void {
    this.editMode = false; this.form.reset();
    this.showModal = true; this.error = ''; this.tempPassword = '';
  }

  openEdit(actor: User, e: Event): void {
    e.stopPropagation();
    this.editMode = true; this.selectedActor = actor;
    this.form.patchValue(actor);
    this.showModal = true; this.error = '';
  }

  openDelete(actor: User, e: Event): void {
    e.stopPropagation();
    this.selectedActor = actor; this.showDelete = true;
  }

  closeModal(): void {
    this.showModal = false; this.showDelete = false;
    this.showReset = false; this.error = ''; this.tempPassword = '';
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true; this.error = '';

    const payload = { ...this.form.value, organism_id: this.orgId };
    const action  = this.editMode
      ? this.actorService.update(this.selectedActor!.id, this.form.value)
      : this.actorService.create(payload);

    action.subscribe({
      next: (res: any) => {
        this.submitting = false;
        if (!this.editMode && res.temp_password) {
          this.tempPassword  = res.temp_password;
          this.editMode      = true;
          this.selectedActor = res;
          this.load(); return;
        }
        this.closeModal(); this.load();
        this.success = this.editMode ? 'Acteur modifié' : 'Acteur créé';
        setTimeout(() => this.success = '', 3500);
      },
      error: (err: any) => {
        this.submitting = false;
        this.error = err.error?.error || 'Une erreur est survenue';
      }
    });
  }

  confirmDelete(): void {
    if (!this.selectedActor) return;
    this.actorService.delete(this.selectedActor.id).subscribe({
      next: () => {
        this.closeModal(); this.load();
        this.success = 'Acteur désactivé';
        setTimeout(() => this.success = '', 3500);
      }
    });
  }

  resetPassword(actor: User, e: Event): void {
    e.stopPropagation();
    this.selectedActor = actor; this.showReset = true;
  }

  confirmReset(): void {
    this.actorService.resetPassword(this.selectedActor!.id).subscribe({
      next: (res) => {
        this.tempPassword = res.temp_password;
        this.showReset    = false;
        this.showModal    = true;
        this.editMode     = true;
      }
    });
  }

  getRoleLabel(value: string): string { return this.roles.find(r => r.value === value)?.label || value; }
  getRoleColor(role: string):  string { return this.ROLE_COLORS[role] || 'gray'; }
  getInitials(actor: User):    string { return (actor.prenom[0] + actor.nom[0]).toUpperCase(); }
  goBack(): void { this.router.navigate(['/dashboard/organisms']); }

  get activeCount(): number { return this.actors.filter(a => a.is_active).length; }
  get uniqueRoles(): number { return new Set(this.actors.map(a => a.role)).size; }
}