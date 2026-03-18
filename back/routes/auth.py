from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from models.user import User
from extensions import db
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

# 🔐 LOGIN
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(force=True, silent=True)

    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email et mot de passe requis'}), 400

    user = User.query.filter_by(email=data['email']).first()

    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Identifiants incorrects'}), 401

    if not user.is_active:
        return jsonify({'error': 'Compte désactivé'}), 403

    user.last_login = datetime.utcnow()
    db.session.commit()

    access_token  = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'must_change_password': user.should_change_password(),  # ✅ LOGIQUE
        'user': user.to_dict()
    }), 200


# 🔄 REFRESH TOKEN
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify({'access_token': access_token}), 200


# 👤 PROFIL
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404

    # 🔐 BLOQUER SI PASSWORD NON CHANGÉ
    if user.should_change_password():
        return jsonify({'error': 'Changement de mot de passe requis'}), 403

    return jsonify(user.to_dict()), 200


# 🔑 CHANGE PASSWORD
@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    data = request.get_json(force=True, silent=True)

    if not data or not data.get('old_password') or not data.get('new_password'):
        return jsonify({'error': 'Données manquantes'}), 400

    if not user.check_password(data.get('old_password')):
        return jsonify({'error': 'Ancien mot de passe incorrect'}), 400

    user.set_password(data['new_password'])
    user.must_change_password = False  # ✅ reset
    db.session.commit()

    return jsonify({'message': 'Mot de passe modifié'}), 200
@auth_bp.route('/resolve-organism', methods=['GET'])
def resolve_organism():
    """Retourne le nom de l'organisme associé à un email — pour l'UI login."""
    email = request.args.get('email', '').strip()
    if not email:
        return jsonify({'organism': None}), 200

    user = User.query.filter_by(email=email).first()
    if not user or not user.organism:
        return jsonify({'organism': None}), 200

    return jsonify({'organism': user.organism.nom}), 200