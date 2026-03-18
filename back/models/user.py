from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'

    id            = db.Column(db.Integer, primary_key=True)
    email         = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(512), nullable=False)
    nom           = db.Column(db.String(100), nullable=False)
    prenom        = db.Column(db.String(100), nullable=False)
    role          = db.Column(db.String(50), nullable=False)
    processus_pilote = db.Column(db.String(255), nullable=True)  
    telephone     = db.Column(db.String(20))
    is_active     = db.Column(db.Boolean, default=True)
    must_change_password = db.Column(db.Boolean, default=False)

    organism_id   = db.Column(db.Integer, db.ForeignKey('organisms.id'), nullable=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at    = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login    = db.Column(db.DateTime)

    organism      = db.relationship('Organism', back_populates='users')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    # ✅ LOGIQUE MÉTIER
    def should_change_password(self):
        if self.role == 'super_admin':
            return False
        return self.must_change_password

    def to_dict(self):
        return {
            'id':          self.id,
            'email':       self.email,
            'nom':         self.nom,
            'prenom':      self.prenom,
            'role':        self.role,
            'processus_pilote': self.processus_pilote, 
            'telephone':   self.telephone,
            'is_active':   self.is_active,
            'must_change_password': self.should_change_password(),
            'organism_id': self.organism_id,
            'organism':    self.organism.nom if self.organism else None,
            'created_at':  self.created_at.isoformat() if self.created_at else None,
            'last_login':  self.last_login.isoformat() if self.last_login else None
        }