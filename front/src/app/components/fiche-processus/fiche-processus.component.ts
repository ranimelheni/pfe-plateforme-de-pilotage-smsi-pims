import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { FicheProcessusService } from '../../services/fiche-processus.service';

type SectionId = 's1'|'s2'|'s3'|'s4'|'s5'|'s6'|'s7'|'s8'|'s9'|'s10'|'s11'|'s12';

@Component({
  selector: 'app-fiche-processus',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './fiche-processus.component.html',
  styleUrls: ['./fiche-processus.component.scss']
})
export class FicheProcessusComponent implements OnInit {
  currentUser: any  = null;
  ficheId: number | null = null;
  auditType: string = 'iso27001';
  activeSection: SectionId = 's1';
  loading   = false;
  saving    = false;
  success   = '';
  error     = '';
  canSubmit = false;

  saved: Record<SectionId, boolean> = {
    s1:false, s2:false, s3:false, s4:false,  s5:false,  s6:false,
    s7:false, s8:false, s9:false, s10:false, s11:false, s12:false
  };

  sections = [
    { id: 's1',  num: '01', label: 'Identification' },
    { id: 's2',  num: '02', label: 'Finalité et bénéficiaires' },
    { id: 's3',  num: '03', label: 'Déclencheurs' },
    { id: 's4',  num: '04', label: 'Entrées / Sorties' },
    { id: 's5',  num: '05', label: 'Informations documentées' },
    { id: 's6',  num: '06', label: 'Contraintes' },
    { id: 's7',  num: '07', label: 'Personnel et ressources' },
    { id: 's8',  num: '08', label: 'Objectifs et KPI' },
    { id: 's9',  num: '09', label: 'Surveillance' },
    { id: 's10', num: '10', label: 'Interactions' },
    { id: 's11', num: '11', label: 'Risques' },
    { id: 's12', num: '12', label: 'Opportunités' }
  ];

  // ── Formulaires ───────────────────────────────────────────────────────────
  f1!:  FormGroup;
  f2!:  FormGroup;
  f3!:  FormGroup;
  f4!:  FormGroup;
  f5!:  FormGroup;
  f6!:  FormGroup;
  f7!:  FormGroup;
  f8!:  FormGroup;
  f9!:  FormGroup;
  f10!: FormGroup;
  f11!: FormGroup;
  f12!: FormGroup;

  constructor(
    private fb:      FormBuilder,
    private auth:    AuthService,
    private ficheSvc: FicheProcessusService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.initForms();
    this.loadFiche();
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  initForms(): void {
    this.f1 = this.fb.group({
      intitule:       ['', Validators.required],
      code:           [''],
      type_processus: ['', Validators.required],
      domaine:        [''],
      activites:      [''],
      version:        ['v1.0', Validators.required]
    });

    this.f2 = this.fb.group({
      finalite:      ['', Validators.required],
      beneficiaires: this.fb.array([this.newBeneficiaire()])
    });

    this.f3 = this.fb.group({
      declencheurs: this.fb.array([this.newDeclencheur()])
    });

    this.f4 = this.fb.group({
      elements_entree:                   this.fb.array([this.newElement()]),
      elements_sortie_intentionnels:     this.fb.array([this.newElement()]),
      elements_sortie_non_intentionnels: this.fb.array([this.newElement()])
    });

    this.f5 = this.fb.group({
      informations_documentees: this.fb.array([this.newDocument()])
    });

    this.f6 = this.fb.group({
      contraintes_reglementaires: this.fb.array([this.newContrainte()]),
      contraintes_internes:       [''],
      contraintes_temporelles:    [''],
      contraintes_techniques:     ['']
    });

    this.f7 = this.fb.group({
      acteurs:    this.fb.array([this.newActeur()]),
      ressources: this.fb.array([this.newRessource()])
    });

    this.f8 = this.fb.group({
      objectifs_kpi: this.fb.array([this.newKpi()])
    });

    this.f9 = this.fb.group({
      moyens_surveillance: this.fb.array([this.newSurveillance()]),
      moyens_mesure:       this.fb.array([this.newMesure()])
    });

    this.f10 = this.fb.group({
      interactions: this.fb.array([this.newInteraction()])
    });

    this.f11 = this.fb.group({
      risques:         this.fb.array([this.newRisque()]),
      note_max:        [null],
      risque_dominant: ['']
    });

    this.f12 = this.fb.group({
      opportunites: this.fb.array([this.newOpportunite()])
    });
  }

  // ── Factories ─────────────────────────────────────────────────────────────
  newBeneficiaire(): FormGroup {
    return this.fb.group({ nom: ['', Validators.required], type: ['interne'], attentes: [''] });
  }
  newDeclencheur(): FormGroup {
    return this.fb.group({ description: ['', Validators.required], type: ['evenement'] });
  }
  newElement(): FormGroup {
    return this.fb.group({ description: ['', Validators.required], source: [''], format: [''] });
  }
  newDocument(): FormGroup {
    return this.fb.group({ titre: ['', Validators.required], type: ['procedure'], reference: [''], description: [''] });
  }
  newContrainte(): FormGroup {
    return this.fb.group({ description: ['', Validators.required], source: [''], impact: ['moyen'] });
  }
  newActeur(): FormGroup {
    return this.fb.group({ role: ['', Validators.required], responsabilite: [''], competences: [''] });
  }
  newRessource(): FormGroup {
    return this.fb.group({ nom: ['', Validators.required], type: ['humain'], description: [''] });
  }
  newKpi(): FormGroup {
    return this.fb.group({ intitule: ['', Validators.required], mesure: [''], cible: [''], frequence: ['mensuelle'] });
  }
  newSurveillance(): FormGroup {
    return this.fb.group({ moyen: ['', Validators.required], frequence: ['mensuelle'], responsable: [''] });
  }
  newMesure(): FormGroup {
    return this.fb.group({ indicateur: ['', Validators.required], outil: [''], periodicite: ['mensuelle'] });
  }
  newInteraction(): FormGroup {
    return this.fb.group({ processus: ['', Validators.required], type: ['entrant'], description: [''] });
  }
  newRisque(): FormGroup {
    return this.fb.group({
      description:  ['', Validators.required],
      probabilite:  ['2'],
      impact:       ['2'],
      note:         [{ value: 4, disabled: true }],
      traitement:   ['accepter'],
      mesure:       ['']
    });
  }
  newOpportunite(): FormGroup {
    return this.fb.group({ description: ['', Validators.required], benefice: [''], action: [''] });
  }

  // ── FormArray getters ─────────────────────────────────────────────────────
  get beneficiaires():    FormArray { return this.f2.get('beneficiaires')    as FormArray; }
  get declencheurs():     FormArray { return this.f3.get('declencheurs')     as FormArray; }
  get entreesArr():       FormArray { return this.f4.get('elements_entree')  as FormArray; }
  get sortiesInt():       FormArray { return this.f4.get('elements_sortie_intentionnels')     as FormArray; }
  get sortiesNonInt():    FormArray { return this.f4.get('elements_sortie_non_intentionnels') as FormArray; }
  get infoDocs():         FormArray { return this.f5.get('informations_documentees') as FormArray; }
  get contraintesReg():   FormArray { return this.f6.get('contraintes_reglementaires') as FormArray; }
  get acteurs():          FormArray { return this.f7.get('acteurs')          as FormArray; }
  get ressources():       FormArray { return this.f7.get('ressources')       as FormArray; }
  get kpis():             FormArray { return this.f8.get('objectifs_kpi')    as FormArray; }
  get surveillances():    FormArray { return this.f9.get('moyens_surveillance') as FormArray; }
  get mesures():          FormArray { return this.f9.get('moyens_mesure')    as FormArray; }
  get interactions():     FormArray { return this.f10.get('interactions')    as FormArray; }
  get risques():          FormArray { return this.f11.get('risques')         as FormArray; }
  get opportunites():     FormArray { return this.f12.get('opportunites')    as FormArray; }

  // ── Add ───────────────────────────────────────────────────────────────────
  addBeneficiaire():  void { this.beneficiaires.push(this.newBeneficiaire()); }
  addDeclencheur():   void { this.declencheurs.push(this.newDeclencheur()); }
  addEntree():        void { this.entreesArr.push(this.newElement()); }
  addSortieInt():     void { this.sortiesInt.push(this.newElement()); }
  addSortieNonInt():  void { this.sortiesNonInt.push(this.newElement()); }
  addInfoDoc():       void { this.infoDocs.push(this.newDocument()); }
  addContrainteReg(): void { this.contraintesReg.push(this.newContrainte()); }
  addActeur():        void { this.acteurs.push(this.newActeur()); }
  addRessource():     void { this.ressources.push(this.newRessource()); }
  addKpi():           void { this.kpis.push(this.newKpi()); }
  addSurveillance():  void { this.surveillances.push(this.newSurveillance()); }
  addMesure():        void { this.mesures.push(this.newMesure()); }
  addInteraction():   void { this.interactions.push(this.newInteraction()); }
  addRisque():        void {
    const r = this.newRisque();
    this.risques.push(r);
    this.updateNoteRisque(this.risques.length - 1);
  }
  addOpportunite():   void { this.opportunites.push(this.newOpportunite()); }

  // ── Remove ────────────────────────────────────────────────────────────────
  rm(arr: FormArray, i: number): void { if (arr.length > 1) arr.removeAt(i); }

  // ── Note risque auto ──────────────────────────────────────────────────────
  updateNoteRisque(i: number): void {
    const row   = this.risques.at(i) as FormGroup;
    const prob  = +row.get('probabilite')?.value || 0;
    const imp   = +row.get('impact')?.value      || 0;
    const note  = prob * imp;
    row.get('note')?.setValue(note);

    // Recalculer note_max et risque_dominant
    const notes = this.risques.controls.map(r => +(r.get('note')?.value || 0));
    this.f11.get('note_max')?.setValue(Math.max(...notes));
    const maxIdx = notes.indexOf(Math.max(...notes));
    const desc   = this.risques.at(maxIdx)?.get('description')?.value || '';
    this.f11.get('risque_dominant')?.setValue(desc.substring(0, 50));
  }

  getNoteClass(note: number): string {
    if (note <= 4)  return 'note-low';
    if (note <= 9)  return 'note-med';
    return 'note-high';
  }

  // ── Chargement ────────────────────────────────────────────────────────────
  loadFiche(): void {
    this.loading = true;
    this.ficheSvc.getMine().subscribe({
      next: (data) => {
        this.loading   = false;
        this.ficheId   = data.id;
        this.auditType = data.audit_type || 'iso27001';
        this.patchAll(data);
        this.checkCanSubmit();
      },
      error: () => { this.loading = false; }
    });
  }

  patchAll(d: any): void {
    // S1
    this.f1.patchValue({
      intitule: d.intitule || '', code: d.code || '',
      type_processus: d.type_processus || '', domaine: d.domaine || '',
      activites: d.activites || '', version: d.version || 'v1.0'
    });

    // S2
    this.f2.patchValue({ finalite: d.finalite || '' });
    this.patchArray(this.beneficiaires, d.beneficiaires, this.newBeneficiaire.bind(this));

    // S3
    this.patchArray(this.declencheurs, d.declencheurs, this.newDeclencheur.bind(this));

    // S4
    this.patchArray(this.entreesArr,    d.elements_entree,                   this.newElement.bind(this));
    this.patchArray(this.sortiesInt,    d.elements_sortie_intentionnels,     this.newElement.bind(this));
    this.patchArray(this.sortiesNonInt, d.elements_sortie_non_intentionnels, this.newElement.bind(this));

    // S5
    this.patchArray(this.infoDocs, d.informations_documentees, this.newDocument.bind(this));

    // S6
    this.patchArray(this.contraintesReg, d.contraintes_reglementaires, this.newContrainte.bind(this));
    this.f6.patchValue({
      contraintes_internes:    d.contraintes_internes    || '',
      contraintes_temporelles: d.contraintes_temporelles || '',
      contraintes_techniques:  d.contraintes_techniques  || ''
    });

    // S7
    this.patchArray(this.acteurs,    d.acteurs,    this.newActeur.bind(this));
    this.patchArray(this.ressources, d.ressources, this.newRessource.bind(this));

    // S8
    this.patchArray(this.kpis, d.objectifs_kpi, this.newKpi.bind(this));

    // S9
    this.patchArray(this.surveillances, d.moyens_surveillance, this.newSurveillance.bind(this));
    this.patchArray(this.mesures,       d.moyens_mesure,       this.newMesure.bind(this));

    // S10
    this.patchArray(this.interactions, d.interactions, this.newInteraction.bind(this));

    // S11
    this.patchArray(this.risques, d.risques, this.newRisque.bind(this));
    this.f11.patchValue({ note_max: d.note_max || null, risque_dominant: d.risque_dominant || '' });

    // S12
    this.patchArray(this.opportunites, d.opportunites, this.newOpportunite.bind(this));

    // Marquer sections sauvegardées si données présentes
    if (d.intitule)   this.saved.s1  = true;
    if (d.finalite)   this.saved.s2  = true;
    if (d.declencheurs?.length)              this.saved.s3  = true;
    if (d.elements_entree?.length)           this.saved.s4  = true;
    if (d.informations_documentees?.length)  this.saved.s5  = true;
    if (d.contraintes_internes || d.contraintes_reglementaires?.length) this.saved.s6 = true;
    if (d.acteurs?.length)      this.saved.s7  = true;
    if (d.objectifs_kpi?.length) this.saved.s8 = true;
    if (d.moyens_surveillance?.length) this.saved.s9 = true;
    if (d.interactions?.length) this.saved.s10 = true;
    if (d.risques?.length)      this.saved.s11 = true;
    if (d.opportunites?.length) this.saved.s12 = true;
  }

  patchArray(arr: FormArray, data: any[], factory: () => FormGroup): void {
    if (!data?.length) return;
    arr.clear();
    data.forEach(item => {
      const g = factory();
      g.patchValue(item);
      arr.push(g);
    });
  }

  // ── Sauvegarde par section ────────────────────────────────────────────────
  getFormForSection(id: SectionId): FormGroup {
    const map: Record<SectionId, FormGroup> = {
      s1: this.f1,  s2: this.f2,  s3: this.f3,  s4: this.f4,
      s5: this.f5,  s6: this.f6,  s7: this.f7,  s8: this.f8,
      s9: this.f9,  s10: this.f10, s11: this.f11, s12: this.f12
    };
    return map[id];
  }

  buildPayload(): any {
    return {
      ...this.f1.value,
      ...this.f2.getRawValue(),
      ...this.f3.value,
      elements_entree:                   this.f4.value.elements_entree,
      elements_sortie_intentionnels:     this.f4.value.elements_sortie_intentionnels,
      elements_sortie_non_intentionnels: this.f4.value.elements_sortie_non_intentionnels,
      informations_documentees:          this.f5.value.informations_documentees,
      contraintes_reglementaires:        this.f6.value.contraintes_reglementaires,
      contraintes_internes:              this.f6.value.contraintes_internes,
      contraintes_temporelles:           this.f6.value.contraintes_temporelles,
      contraintes_techniques:            this.f6.value.contraintes_techniques,
      acteurs:                           this.f7.value.acteurs,
      ressources:                        this.f7.value.ressources,
      objectifs_kpi:                     this.f8.value.objectifs_kpi,
      moyens_surveillance:               this.f9.value.moyens_surveillance,
      moyens_mesure:                     this.f9.value.moyens_mesure,
      interactions:                      this.f10.value.interactions,
      risques:                           this.f11.getRawValue().risques,
      note_max:                          this.f11.value.note_max,
      risque_dominant:                   this.f11.value.risque_dominant,
      opportunites:                      this.f12.value.opportunites
    };
  }

  saveSection(): void {
    const form = this.getFormForSection(this.activeSection);
    if (form.invalid) { form.markAllAsTouched(); return; }
    if (!this.ficheId) return;

    this.saving = true;
    this.error  = '';

    this.ficheSvc.update(this.ficheId, this.buildPayload()).subscribe({
      next: () => {
        this.saving                         = false;
        this.saved[this.activeSection]      = true;
        this.success = `Section enregistrée`;
        setTimeout(() => this.success = '', 3000);
        this.checkCanSubmit();

        const idx  = this.sections.findIndex(s => s.id === this.activeSection);
        const next = this.sections[idx + 1];
        if (next) this.activeSection = next.id as SectionId;
      },
      error: (err) => {
        this.saving = false;
        this.error  = err.error?.error || 'Erreur lors de la sauvegarde';
      }
    });
  }

  checkCanSubmit(): void {
    this.canSubmit = Object.values(this.saved).every(Boolean);
  }

  soumettre(): void {
    if (!this.ficheId || !this.canSubmit) return;
    this.ficheSvc.updateStatut(this.ficheId, 'soumis').subscribe({
      next: (res) => {
        this.success = `Fiche soumise — statut : ${res.statut}`;
        setTimeout(() => this.success = '', 4000);
      },
      error: (err) => { this.error = err.error?.error || 'Erreur'; }
    });
  }

  setSection(id: string): void { this.activeSection = id as SectionId; }

  get progressPercent(): number {
    return Math.round((Object.values(this.saved).filter(Boolean).length / 12) * 100);
  }
  isSaved(id: string): boolean {
  return this.saved[id as SectionId] ?? false;
}
}
