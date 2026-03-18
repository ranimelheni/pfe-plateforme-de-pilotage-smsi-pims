from extensions import db
from datetime import datetime

class Organism(db.Model):
    __tablename__ = 'organisms'

    id            = db.Column(db.Integer, primary_key=True)
    nom           = db.Column(db.String(255), nullable=False)
    secteur       = db.Column(db.String(100))
    # public | prive | associatif | collectivite
    type_org      = db.Column(db.String(100))
    # entreprise | administration | hopital | collectivite | association
    siret         = db.Column(db.String(20))
    adresse       = db.Column(db.Text)
    ville         = db.Column(db.String(100))
    pays          = db.Column(db.String(100), default='France')
    email_contact = db.Column(db.String(255))
    telephone     = db.Column(db.String(20))
    site_web      = db.Column(db.String(255))
    taille        = db.Column(db.String(50))
    # tpe | pme | eti | ge | administration
    description   = db.Column(db.Text)
    logo_url      = db.Column(db.String(500))
    is_active     = db.Column(db.Boolean, default=True)
    date_audit    = db.Column(db.Date)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at    = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    audit_type = db.Column(db.String(20))
    users         = db.relationship('User', back_populates='organism', lazy='dynamic')

    def to_dict(self):
        return {
            'id':            self.id,
            'nom':           self.nom,
            'secteur':       self.secteur,
            'type_org':      self.type_org,
            'audit_type':    self.audit_type,
            'siret':         self.siret,
            'adresse':       self.adresse,
            'ville':         self.ville,
            'pays':          self.pays,
            'email_contact': self.email_contact,
            'telephone':     self.telephone,
            'site_web':      self.site_web,
            'taille':        self.taille,
            'description':   self.description,
            'is_active':     self.is_active,
            'date_audit':    self.date_audit.isoformat() if self.date_audit else None,
            'nb_acteurs':    self.users.count(),
            'created_at':    self.created_at.isoformat() if self.created_at else None
        }