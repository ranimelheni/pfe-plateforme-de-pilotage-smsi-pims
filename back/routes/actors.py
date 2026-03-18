from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.organism import Organism
from app import db
import secrets
import string

actors_bp = Blueprint('actors', __name__)

ROLES_ALLOWED = [
    'admin_organism', 'rssi', 'dpo', 'iso',
    'auditeur_interne', 'auditeur_externe',
    'pilote_processus', 'proprietaire_risque',
    'proprietaire_actif', 'responsable_conformite',
    'soc', 'responsable_qualite', 'utilisateur_metier',
    'direction', 'comite_securite'
]

ROLES_LABELS = {
    'admin_organism':       'Administrateur organisme',
    'rssi':                 'RSSI',
    'dpo':                  'DPO / Délégué protection données',
    'iso':                  'ISO / Responsable SI',
    'auditeur_interne':     'Auditeur interne',
    'auditeur_externe':     'Auditeur externe',
    'pilote_processus':     'Pilote de processus',
    'proprietaire_risque':  'Propriétaire des risques',
    'proprietaire_actif':   'Propriétaire des actifs',
    'responsable_conformite': 'Responsable conformité',
    'soc':                  'SOC / Équipe sécurité',
    'responsable_qualite':  'Responsable qualité',
    'utilisateur_metier':   'Utilisateur métier',
    'direction':            'Direction / DSI',
    'comite_securite':      'Comité sécurité'
}

def generate_temp_password():
    chars = string.ascii_letters + string.digits + '!@#$'
    return ''.join(secrets.choice(chars) for _ in range(12))

@actors_bp.route('', methods=['GET'])
@jwt_required()
def get_actors():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if user.role == 'super_admin':
        org_id = request.args.get('organism_id')
        if org_id:
            actors = User.query.filter_by(organism_id=int(org_id)).all()
        else:
            actors = User.query.filter(User.role != 'super_admin').all()
    else:
        actors = User.query.filter_by(organism_id=user.organism_id).all()

    return jsonify([a.to_dict() for a in actors]), 200

@actors_bp.route('/roles', methods=['GET'])
@jwt_required()
def get_roles():
    roles = [{'value': k, 'label': v} for k, v in ROLES_LABELS.items()]
    return jsonify(roles), 200

@actors_bp.route('', methods=['POST'])
@jwt_required()
def create_actor():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if user.role not in ['super_admin', 'admin_organism']:
        return jsonify({'error': 'Accès non autorisé'}), 403

    data = request.get_json()

    required = ['email', 'nom', 'prenom', 'role', 'organism_id']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} est requis'}), 400

    if data['role'] not in ROLES_ALLOWED:
        return jsonify({'error': 'Rôle invalide'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email déjà utilisé'}), 409

    organism = Organism.query.get(data['organism_id'])
    if not organism:
        return jsonify({'error': 'Organisme non trouvé'}), 404
    if data['role'] == 'pilote_processus' and not data.get('processus_pilote'):
        return jsonify({'error': 'Le processus piloté est requis pour ce rôle'}), 400

    temp_password = generate_temp_password()

    actor = User(
        email       = data['email'],
        nom         = data['nom'],
        prenom      = data['prenom'],
        role        = data['role'],
        telephone   = data.get('telephone'),
        organism_id = data['organism_id'],
        is_active   = True,
        must_change_password = True , 
        processus_pilote     = data.get('processus_pilote')

    )
    actor.set_password(temp_password)
    db.session.add(actor)
    db.session.commit()

    result = actor.to_dict()
    result['temp_password'] = temp_password
    return jsonify(result), 201

@actors_bp.route('/<int:actor_id>', methods=['PUT'])
@jwt_required()
def update_actor(actor_id):
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if user.role not in ['super_admin', 'admin_organism']:
        return jsonify({'error': 'Accès non autorisé'}), 403

    actor = User.query.get_or_404(actor_id)
    data = request.get_json()

    for field in ['nom', 'prenom', 'telephone', 'role', 'is_active','processus_pilote']:
        if field in data:
            setattr(actor, field, data[field])

    db.session.commit()
    return jsonify(actor.to_dict()), 200

@actors_bp.route('/<int:actor_id>', methods=['DELETE'])
@jwt_required()
def delete_actor(actor_id):
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if user.role not in ['super_admin', 'admin_organism']:
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    actor = User.query.get_or_404(actor_id)
    actor.is_active = False
    db.session.commit()
    return jsonify({'message': 'Acteur désactivé'}), 200

@actors_bp.route('/<int:actor_id>/reset-password', methods=['POST'])
@jwt_required()
def reset_password(actor_id):
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if user.role not in ['super_admin', 'admin_organism']:
        return jsonify({'error': 'Accès non autorisé'}), 403

    actor = User.query.get_or_404(actor_id)
    temp_password = generate_temp_password()
    actor.set_password(temp_password)
    actor.must_change_password = True   # ← AJOUT : reforce le changement
    db.session.commit()
    return jsonify({'temp_password': temp_password}), 200