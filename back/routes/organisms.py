from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.organism import Organism
from models.user import User
from app import db

organisms_bp = Blueprint('organisms', __name__)

def require_super_admin():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or user.role != 'super_admin':
        return None, jsonify({'error': 'Accès non autorisé'}), 403
    return user, None, None

@organisms_bp.route('', methods=['GET'])
@jwt_required()
def get_organisms():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if user.role == 'super_admin':
        organisms = Organism.query.order_by(Organism.created_at.desc()).all()
    else:
        organisms = Organism.query.filter_by(id=user.organism_id).all()
    return jsonify([o.to_dict() for o in organisms]), 200

@organisms_bp.route('', methods=['POST'])
@jwt_required()
def create_organism():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if user.role != 'super_admin':
        return jsonify({'error': 'Accès non autorisé'}), 403

    data = request.get_json()
    if not data.get('nom'):
        return jsonify({'error': 'Nom de l\'organisme requis'}), 400

    organism = Organism(
        nom           = data['nom'],
        secteur       = data.get('secteur'),
        type_org      = data.get('type_org'),
        audit_type = data.get('audit_type'),
        siret         = data.get('siret'),
        adresse       = data.get('adresse'),
        ville         = data.get('ville'),
        pays          = data.get('pays', 'France'),
        email_contact = data.get('email_contact'),
        telephone     = data.get('telephone'),
        site_web      = data.get('site_web'),
        taille        = data.get('taille'),
        description   = data.get('description'),
        date_audit    = data.get('date_audit')
    )
    db.session.add(organism)
    db.session.commit()
    return jsonify(organism.to_dict()), 201

@organisms_bp.route('/<int:org_id>', methods=['GET'])
@jwt_required()
def get_organism(org_id):
    organism = Organism.query.get_or_404(org_id)
    return jsonify(organism.to_dict()), 200

@organisms_bp.route('/<int:org_id>', methods=['PUT'])
@jwt_required()
def update_organism(org_id):
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if user.role != 'super_admin':
        return jsonify({'error': 'Accès non autorisé'}), 403

    organism = Organism.query.get_or_404(org_id)
    data = request.get_json()

    for field in ['nom','secteur','type_org','audit_type','siret','adresse','ville',
                  'pays','email_contact','telephone','site_web','taille',
                  'description','is_active','date_audit']:
        if field in data:
            setattr(organism, field, data[field])

    db.session.commit()
    return jsonify(organism.to_dict()), 200

@organisms_bp.route('/<int:org_id>', methods=['DELETE'])
@jwt_required()
def delete_organism(org_id):
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if user.role != 'super_admin':
        return jsonify({'error': 'Accès non autorisé'}), 403

    organism = Organism.query.get_or_404(org_id)
    organism.is_active = False
    db.session.commit()
    return jsonify({'message': 'Organisme désactivé'}), 200

@organisms_bp.route('/<int:org_id>/actors', methods=['GET'])
@jwt_required()
def get_organism_actors(org_id):
    actors = User.query.filter_by(organism_id=org_id).all()
    return jsonify([a.to_dict() for a in actors]), 200