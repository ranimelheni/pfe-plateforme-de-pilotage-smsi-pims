from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.organism import Organism
from models.fiche_processus import FicheProcessus
from extensions import db
from datetime import datetime

fiches_bp = Blueprint('fiches', __name__)

def get_current_user():
    return User.query.get(int(get_jwt_identity()))

def check_read_access(user, fiche):
    if user.role == 'super_admin':                                    return True
    if user.role == 'rssi'   and user.organism_id == fiche.organism_id: return True
    if user.role == 'dpo'    and user.organism_id == fiche.organism_id: return True
    if user.role == 'admin_organism' and user.organism_id == fiche.organism_id: return True
    if user.role == 'pilote_processus' and fiche.pilote_id == user.id: return True
    return False

def check_write_access(user, fiche):
    """Pilote uniquement, fiche en brouillon."""
    if user.role == 'pilote_processus':
        return fiche.pilote_id == user.id and fiche.statut == 'brouillon'
    return False

# ── GET MINE ──────────────────────────────────────────────────────────────────
@fiches_bp.route('/mine', methods=['GET'])
@jwt_required()
def get_my_fiche():
    user = get_current_user()

    if user.role not in ['pilote_processus', 'dpo', 'rssi']:
        return jsonify({'error': 'Accès non autorisé'}), 403

    if user.role == 'pilote_processus':
        fiche = FicheProcessus.query.filter_by(
            organism_id=user.organism_id,
            pilote_id=user.id
        ).first()
        if not fiche:
            # Récupérer audit_type depuis l'organisme
            org   = Organism.query.get(user.organism_id)
            fiche = FicheProcessus(
                organism_id = user.organism_id,
                pilote_id   = user.id,
                audit_type  = org.audit_type if org else 'iso27001',
                intitule    = user.processus_pilote or 'Nouveau processus',
                finalite    = '',
                statut      = 'brouillon'
            )
            db.session.add(fiche)
            db.session.commit()
        return jsonify(fiche.to_dict()), 200

    # DPO : fiches soumis_dpo de son organisme
    if user.role == 'dpo':
        fiches = FicheProcessus.query.filter_by(
            organism_id=user.organism_id,
            statut='soumis_dpo'
        ).all()
        return jsonify([f.to_dict() for f in fiches]), 200

    # RSSI : fiches soumis_rssi ou complete_dpo de son organisme
    if user.role == 'rssi':
        fiches = FicheProcessus.query.filter(
            FicheProcessus.organism_id == user.organism_id,
            FicheProcessus.statut.in_(['soumis_rssi', 'complete_dpo'])
        ).all()
        return jsonify([f.to_dict() for f in fiches]), 200

# ── GET ALL organisme ─────────────────────────────────────────────────────────
@fiches_bp.route('/organism/<int:organism_id>', methods=['GET'])
@jwt_required()
def get_fiches(organism_id):
    user = get_current_user()

    if user.role == 'super_admin':
        pass
    elif user.organism_id == organism_id and user.role in ['rssi', 'admin_organism', 'dpo']:
        pass
    elif user.role == 'pilote_processus' and user.organism_id == organism_id:
        fiches = FicheProcessus.query.filter_by(organism_id=organism_id, pilote_id=user.id).all()
        return jsonify([f.to_dict() for f in fiches]), 200
    else:
        return jsonify({'error': 'Accès non autorisé'}), 403

    fiches = FicheProcessus.query.filter_by(organism_id=organism_id).all()
    return jsonify([f.to_dict() for f in fiches]), 200

# ── GET ONE ───────────────────────────────────────────────────────────────────
@fiches_bp.route('/<int:fiche_id>', methods=['GET'])
@jwt_required()
def get_fiche(fiche_id):
    user  = get_current_user()
    fiche = FicheProcessus.query.get_or_404(fiche_id)
    if not check_read_access(user, fiche):
        return jsonify({'error': 'Accès non autorisé'}), 403
    return jsonify(fiche.to_dict()), 200

# ── PUT : mise à jour fiche par le pilote ────────────────────────────────────
@fiches_bp.route('/<int:fiche_id>', methods=['PUT'])
@jwt_required()
def update_fiche(fiche_id):
    user  = get_current_user()
    fiche = FicheProcessus.query.get_or_404(fiche_id)

    if not check_write_access(user, fiche):
        return jsonify({'error': 'Modification non autorisée — fiche non en brouillon ou accès refusé'}), 403

    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({'error': 'Données manquantes'}), 400

    CHAMPS_TEXTE = [
        'intitule', 'code', 'type_processus', 'domaine', 'activites', 'version',
        'finalite', 'contraintes_internes', 'contraintes_temporelles',
        'contraintes_techniques', 'risque_dominant'
    ]
    CHAMPS_JSON = [
        'beneficiaires', 'declencheurs',
        'elements_entree', 'elements_sortie_intentionnels',
        'elements_sortie_non_intentionnels', 'informations_documentees',
        'contraintes_reglementaires', 'acteurs', 'ressources',
        'objectifs_kpi', 'moyens_surveillance', 'moyens_mesure',
        'interactions', 'risques', 'opportunites'
    ]

    for f in CHAMPS_TEXTE:
        if f in data: setattr(fiche, f, data[f])
    for f in CHAMPS_JSON:
        if f in data: setattr(fiche, f, data[f])
    if 'note_max'   in data: fiche.note_max   = data['note_max']
    if 'pilote_id'  in data: fiche.pilote_id  = data['pilote_id']

    fiche.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(fiche.to_dict()), 200

# ── PUT DPO : compléter la section DPO ───────────────────────────────────────
@fiches_bp.route('/<int:fiche_id>/dpo', methods=['PUT'])
@jwt_required()
def update_dpo(fiche_id):
    user  = get_current_user()
    fiche = FicheProcessus.query.get_or_404(fiche_id)

    if user.role != 'dpo' or user.organism_id != fiche.organism_id:
        return jsonify({'error': 'Réservé au DPO de l\'organisme'}), 403
    if fiche.statut != 'soumis_dpo':
        return jsonify({'error': 'La fiche n\'est pas en attente DPO'}), 400

    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({'error': 'Données manquantes'}), 400

    fiche.data_dpo   = data.get('data_dpo', {})
    fiche.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(fiche.to_dict()), 200

# ── PUT STATUT : transitions workflow ────────────────────────────────────────
@fiches_bp.route('/<int:fiche_id>/statut', methods=['PUT'])
@jwt_required()
def update_statut(fiche_id):
    user  = get_current_user()
    fiche = FicheProcessus.query.get_or_404(fiche_id)

    data   = request.get_json(force=True, silent=True) or {}
    statut = data.get('statut')

    # ── Pilote soumet ──────────────────────────────────────────────────────
    if user.role == 'pilote_processus':
        if fiche.pilote_id != user.id:
            return jsonify({'error': 'Accès non autorisé'}), 403
        if fiche.statut != 'brouillon':
            return jsonify({'error': 'Seule une fiche brouillon peut être soumise'}), 400
        if not fiche.intitule or not fiche.finalite:
            return jsonify({'error': 'Intitulé et finalité requis avant soumission'}), 400

        # Selon audit_type : iso27001 → RSSI / iso27701 → DPO d'abord
        if fiche.audit_type == 'iso27701':
            fiche.statut = 'soumis_dpo'
        else:
            fiche.statut = 'soumis_rssi'

        fiche.soumis_at  = datetime.utcnow()
        fiche.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'message': f'Fiche soumise — statut : {fiche.statut}', 'statut': fiche.statut}), 200

    # ── DPO soumet après complétion ────────────────────────────────────────
    if user.role == 'dpo':
        if user.organism_id != fiche.organism_id:
            return jsonify({'error': 'Accès non autorisé'}), 403
        if fiche.statut != 'soumis_dpo':
            return jsonify({'error': 'La fiche n\'est pas en attente DPO'}), 400
        if not fiche.data_dpo:
            return jsonify({'error': 'La section DPO doit être complétée avant soumission'}), 400

        fiche.statut     = 'complete_dpo'
        fiche.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'message': 'Section DPO complétée — en attente RSSI', 'statut': fiche.statut}), 200

    # ── RSSI valide ou rejette ─────────────────────────────────────────────
    if user.role == 'rssi':
        if user.organism_id != fiche.organism_id:
            return jsonify({'error': 'Accès non autorisé'}), 403
        if fiche.statut not in ['soumis_rssi', 'complete_dpo']:
            return jsonify({'error': 'La fiche n\'est pas en attente de validation RSSI'}), 400
        if statut not in ['valide', 'rejete']:
            return jsonify({'error': 'RSSI peut uniquement valider ou rejeter'}), 400

        fiche.statut    = statut
        fiche.valide_by = user.id
        fiche.valide_at = datetime.utcnow()
        if statut == 'rejete':
            fiche.commentaire_rejet = data.get('commentaire', '')
        fiche.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'message': f'Fiche {statut}', 'statut': statut}), 200

    return jsonify({'error': 'Action non autorisée'}), 403