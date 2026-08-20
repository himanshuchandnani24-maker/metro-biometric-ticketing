from flask import Blueprint, jsonify
from models.admin_model import get_all_trips, get_total_revenue, get_all_alerts

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/trips', methods=['GET'])
def get_trips():
    trips = get_all_trips()
    return jsonify({"trips": trips}), 200

@admin_bp.route('/admin/revenue', methods=['GET'])
def get_revenue():
    revenue = get_total_revenue()
    return jsonify({"total_revenue": revenue}), 200

@admin_bp.route('/admin/alerts', methods=['GET'])
def get_alerts():
    alerts = get_all_alerts()
    return jsonify({"alerts": alerts}), 200
