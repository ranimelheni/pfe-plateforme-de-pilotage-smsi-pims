from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import db, jwt

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    CORS(app, origins=["http://localhost:4200"], supports_credentials=True)

    # ── Blueprints ────────────────────────────────────────────────────────────
    from routes.auth import auth_bp
    from routes.organisms import organisms_bp
    from routes.actors import actors_bp

    app.register_blueprint(auth_bp,      url_prefix='/api/auth')
    app.register_blueprint(organisms_bp, url_prefix='/api/organisms')
    app.register_blueprint(actors_bp,    url_prefix='/api/actors')

    # Enregistrer fiches seulement si la table existe
    try:
        from routes.fiches_processus import fiches_bp
        app.register_blueprint(fiches_bp, url_prefix='/api/fiches')
    except Exception as e:
        print(f'⚠️  fiches_bp non chargé : {e}')

    # ── Debug route ───────────────────────────────────────────────────────────
    @app.route('/debug/db', methods=['GET'])
    def debug_db():
        from sqlalchemy import text
        try:
            row = db.session.execute(text("""
                SELECT
                    current_database() AS base,
                    inet_server_port()  AS port,
                    current_user        AS usr,
                    (SELECT COUNT(*) FROM organisms) AS nb_org,
                    (SELECT COUNT(*) FROM users)     AS nb_users
            """)).fetchone()
            orgs = db.session.execute(text(
                "SELECT id, nom FROM organisms ORDER BY id"
            )).fetchall()
            return {
                'base':      row[0], 'port': row[1], 'user': row[2],
                'nb_org':    row[3], 'nb_users': row[4],
                'organisms': [{'id': o[0], 'nom': o[1]} for o in orgs]
            }
        except Exception as e:
            return {'error': str(e)}, 500

    # ── Initialisation admin ──────────────────────────────────────────────────
    with app.app_context():
        try:
            from models.user import User
            from models.organism import Organism
            if not User.query.filter_by(email='admin@organisation.fr').first():
                admin = User(
                    email='admin@organisation.fr',
                    nom='Administrateur',
                    prenom='Système',
                    role='super_admin',
                    is_active=True
                )
                admin.set_password('Admin@2026')
                db.session.add(admin)
                db.session.commit()
                print('✅ Admin créé : admin@organisation.fr / Admin@2026')
        except Exception as e:
            print(f'⚠️  Init admin ignorée : {e}')

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)