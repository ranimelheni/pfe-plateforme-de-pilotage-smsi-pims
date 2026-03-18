from extensions import db
from datetime import datetime

class FicheProcessus(db.Model):
    __tablename__ = 'fiches_processus'

    id              = db.Column(db.Integer, primary_key=True)
    organism_id     = db.Column(db.Integer, db.ForeignKey('organisms.id'), nullable=False)
    audit_type      = db.Column(db.String(20))  # iso27001 | iso27701

    # Section 1
    intitule        = db.Column(db.String(255), nullable=False)
    code            = db.Column(db.String(50))
    type_processus  = db.Column(db.String(30))
    domaine         = db.Column(db.String(100))
    activites       = db.Column(db.Text)
    version         = db.Column(db.String(10), default='v1.0')

    # Section 2
    finalite        = db.Column(db.Text, nullable=False)
    beneficiaires   = db.Column(db.JSON)

    # Section 3
    declencheurs    = db.Column(db.JSON)

    # Section 4
    elements_entree                   = db.Column(db.JSON)
    elements_sortie_intentionnels     = db.Column(db.JSON)
    elements_sortie_non_intentionnels = db.Column(db.JSON)

    # Section 5
    informations_documentees = db.Column(db.JSON)

    # Section 6
    contraintes_reglementaires = db.Column(db.JSON)
    contraintes_internes       = db.Column(db.Text)
    contraintes_temporelles    = db.Column(db.Text)
    contraintes_techniques     = db.Column(db.Text)

    # Section 7
    pilote_id  = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    acteurs    = db.Column(db.JSON)
    ressources = db.Column(db.JSON)

    # Section 8
    objectifs_kpi = db.Column(db.JSON)

    # Section 9
    moyens_surveillance = db.Column(db.JSON)
    moyens_mesure       = db.Column(db.JSON)

    # Section 10
    interactions = db.Column(db.JSON)

    # Section 11
    risques         = db.Column(db.JSON)
    note_max        = db.Column(db.Integer)
    risque_dominant = db.Column(db.String(50))

    # Section 12
    opportunites = db.Column(db.JSON)

    # Section DPO (iso27701 uniquement)
    data_dpo = db.Column(db.JSON)

    # Workflow
    statut             = db.Column(db.String(30), default='brouillon')
    # brouillon | soumis_rssi | soumis_dpo | complete_dpo | valide | rejete
    soumis_at          = db.Column(db.DateTime)
    valide_by          = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    valide_at          = db.Column(db.DateTime)
    commentaire_rejet  = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organism   = db.relationship('Organism', backref='fiches_processus')
    pilote     = db.relationship('User', foreign_keys=[pilote_id])
    validateur = db.relationship('User', foreign_keys=[valide_by])

    def to_dict(self) -> dict:
        return {
            'id':              self.id,
            'organism_id':     self.organism_id,
            'audit_type':      self.audit_type,
            'intitule':        self.intitule,
            'code':            self.code,
            'type_processus':  self.type_processus,
            'domaine':         self.domaine,
            'activites':       self.activites,
            'version':         self.version,
            'finalite':        self.finalite,
            'beneficiaires':   self.beneficiaires   or [],
            'declencheurs':    self.declencheurs     or [],
            'elements_entree':                   self.elements_entree                   or [],
            'elements_sortie_intentionnels':     self.elements_sortie_intentionnels     or [],
            'elements_sortie_non_intentionnels': self.elements_sortie_non_intentionnels or [],
            'informations_documentees':          self.informations_documentees          or [],
            'contraintes_reglementaires': self.contraintes_reglementaires or [],
            'contraintes_internes':       self.contraintes_internes,
            'contraintes_temporelles':    self.contraintes_temporelles,
            'contraintes_techniques':     self.contraintes_techniques,
            'pilote_id':   self.pilote_id,
            'pilote_nom':  f"{self.pilote.prenom} {self.pilote.nom}" if self.pilote else None,
            'acteurs':     self.acteurs     or [],
            'ressources':  self.ressources  or [],
            'objectifs_kpi':       self.objectifs_kpi       or [],
            'moyens_surveillance': self.moyens_surveillance  or [],
            'moyens_mesure':       self.moyens_mesure        or [],
            'interactions':        self.interactions         or [],
            'risques':             self.risques              or [],
            'note_max':            self.note_max,
            'risque_dominant':     self.risque_dominant,
            'opportunites':        self.opportunites         or [],
            'data_dpo':            self.data_dpo             or {},
            'statut':              self.statut,
            'soumis_at':           self.soumis_at.isoformat()  if self.soumis_at  else None,
            'valide_by':           self.valide_by,
            'valide_at':           self.valide_at.isoformat()  if self.valide_at  else None,
            'commentaire_rejet':   self.commentaire_rejet,
            'created_at':          self.created_at.isoformat() if self.created_at else None,
            'updated_at':          self.updated_at.isoformat() if self.updated_at else None,
        }