from datetime import date, datetime
from decimal import Decimal

from flask import Flask, jsonify
from flask.json.provider import DefaultJSONProvider
from flask_cors import CORS  # type: ignore
from config import Config

# Import blueprints
from routes.auth_routes import auth_bp
from routes.wallet_routes import wallet_bp
from routes.trip_routes import trip_bp
from routes.admin_routes import admin_bp
from routes.fingerprint_routes import fingerprint_bp


class ApiJSONProvider(DefaultJSONProvider):
    """Serialize MySQL datetime/Decimal values so history and admin APIs work from the frontend."""

    def default(self, o):
        if isinstance(o, datetime):
            return o.isoformat()
        if isinstance(o, date):
            return o.isoformat()
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.json = ApiJSONProvider(app)

    CORS(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(wallet_bp)
    app.register_blueprint(trip_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(fingerprint_bp)
    
    @app.route('/', methods=['GET'])
    def index():
        return jsonify({"message": "Biometric Metro Ticketing API is running"}), 200
        
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
