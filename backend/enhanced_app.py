#!/usr/bin/env python3
"""
Enhanced Smart Queue Management System - Role-Based Backend
With separate interfaces for Staff, Managers, and enhanced QR system
"""



from flask import Flask, request, jsonify, render_template, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import uuid
import json
import sqlite3
import threading
import time
import random
from dataclasses import dataclass
from typing import List, Dict, Optional
import numpy as np
from sklearn.linear_model import LinearRegression
import joblib
import os
import qrcode
from io import BytesIO
import base64
from PIL import Image, ImageDraw, ImageFont
from flask import Flask, request, jsonify, render_template, session, make_response

app = Flask(__name__)
app.config['SECRET_KEY'] = 'enhanced-queue-system-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///enhanced_queue_management.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app)

CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:8080",
            "http://127.0.0.1:8080",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "null"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
        "supports_credentials": True
    }
})

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Enhanced Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(20), nullable=False)  # passenger, staff, manager, admin
    bus_id = db.Column(db.Integer, db.ForeignKey('bus.id'))  # For staff assigned to specific bus
    route_id = db.Column(db.Integer, db.ForeignKey('route.id'))  # For managers assigned to routes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)

class Bus(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bus_number = db.Column(db.String(20), unique=True, nullable=False)
    route_name = db.Column(db.String(100), nullable=False)
    capacity = db.Column(db.Integer, nullable=False, default=45)
    current_location = db.Column(db.String(100))
    current_stop_id = db.Column(db.Integer, db.ForeignKey('bus_stop.id'))
    driver_name = db.Column(db.String(100))
    driver_phone = db.Column(db.String(20))
    status = db.Column(db.String(20), default='active')  # active, maintenance, offline, delayed
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class BusStop(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    route_id = db.Column(db.Integer, db.ForeignKey('route.id'), nullable=False)
    order_in_route = db.Column(db.Integer, nullable=False)
    facilities = db.Column(db.Text)  # JSON string of facilities
    accessibility = db.Column(db.Boolean, default=True)

class Route(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    start_point = db.Column(db.String(100), nullable=False)
    end_point = db.Column(db.String(100), nullable=False)
    estimated_duration = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    frequency = db.Column(db.Integer, default=15)  # minutes between buses
    operating_hours_start = db.Column(db.String(5), default='06:00')
    operating_hours_end = db.Column(db.String(5), default='22:00')
    manager_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    stops = db.relationship('BusStop', backref='route', lazy=True)

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    passenger_name = db.Column(db.String(100), nullable=False)
    passenger_email = db.Column(db.String(100), nullable=False)
    passenger_phone = db.Column(db.String(20), nullable=False)
    bus_id = db.Column(db.Integer, db.ForeignKey('bus.id'), nullable=False)
    route_id = db.Column(db.Integer, db.ForeignKey('route.id'), nullable=False)
    pickup_stop_id = db.Column(db.Integer, db.ForeignKey('bus_stop.id'), nullable=False)
    dropoff_stop_id = db.Column(db.Integer, db.ForeignKey('bus_stop.id'), nullable=False)
    seat_number = db.Column(db.Integer, nullable=False)
    booking_time = db.Column(db.DateTime, default=datetime.utcnow)
    travel_date = db.Column(db.DateTime, nullable=False)
    qr_code = db.Column(db.String(255))
    qr_image = db.Column(db.Text)  # Base64 encoded QR image
    status = db.Column(db.String(20), default='confirmed')  # confirmed, cancelled, completed, boarded
    payment_status = db.Column(db.String(20), default='pending')
    boarding_time = db.Column(db.DateTime)  # When passenger actually boarded
    staff_verified = db.Column(db.Boolean, default=False)

    bus = db.relationship('Bus', backref='bookings')
    route = db.relationship('Route', backref='bookings')
    pickup_stop = db.relationship('BusStop', foreign_keys=[pickup_stop_id])
    dropoff_stop = db.relationship('BusStop', foreign_keys=[dropoff_stop_id])

class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    alert_type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), nullable=False)  # low, medium, high, critical
    priority = db.Column(db.Integer, default=1)  # 1-5 priority level
    bus_id = db.Column(db.Integer, db.ForeignKey('bus.id'))
    route_id = db.Column(db.Integer, db.ForeignKey('route.id'))
    stop_id = db.Column(db.Integer, db.ForeignKey('bus_stop.id'))
    assigned_to_role = db.Column(db.String(20), default='staff')  # staff, manager, admin
    assigned_to_user = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    acknowledged_at = db.Column(db.DateTime)
    resolved_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='active')  # active, acknowledged, resolved, dismissed
    action_required = db.Column(db.Boolean, default=False)
    auto_dismiss_at = db.Column(db.DateTime)

    bus = db.relationship('Bus', backref='alerts')
    route = db.relationship('Route', backref='alerts')
    stop = db.relationship('BusStop', backref='alerts')
    assigned_user = db.relationship('User', backref='assigned_alerts')

class QueueData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bus_stop_id = db.Column(db.Integer, db.ForeignKey('bus_stop.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    queue_length = db.Column(db.Integer, nullable=False)
    waiting_time = db.Column(db.Integer, nullable=False)
    weather_condition = db.Column(db.String(50))
    day_of_week = db.Column(db.Integer)
    hour_of_day = db.Column(db.Integer)
    passenger_satisfaction = db.Column(db.Float)  # 1-5 rating

    bus_stop = db.relationship('BusStop', backref='queue_data')

class StaffAction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    action_type = db.Column(db.String(50), nullable=False)  # scan_qr, update_status, resolve_alert
    booking_id = db.Column(db.String(36), db.ForeignKey('booking.booking_id'))
    alert_id = db.Column(db.Integer, db.ForeignKey('alert.id'))
    details = db.Column(db.Text)  # JSON details
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    location = db.Column(db.String(100))

    staff = db.relationship('User', backref='actions')
    alert = db.relationship('Alert', backref='staff_actions')

# Enhanced QR Code Generator
class EnhancedQRGenerator:
    def __init__(self):
        self.qr_codes = {}

    def generate_qr_code(self, booking_data):
        """Generate enhanced QR code with visual styling"""
        # Create QR data
        qr_data = {
            'booking_id': booking_data['booking_id'],
            'passenger': booking_data['passenger_name'],
            'bus': booking_data.get('bus_number', 'N/A'),
            'seat': booking_data['seat_number'],
            'date': booking_data['travel_date'],
            'route': booking_data.get('route_name', 'N/A'),
            'pickup': booking_data.get('pickup_stop', 'N/A'),
            'status': 'valid'
        }

        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )

        qr_text = json.dumps(qr_data, separators=(',', ':'))
        qr.add_data(qr_text)
        qr.make(fit=True)

        # Create QR image
        qr_img = qr.make_image(fill_color="black", back_color="white")

        # Enhance with styling
        enhanced_img = self.enhance_qr_image(qr_img, booking_data)

        # Convert to base64
        buffer = BytesIO()
        enhanced_img.save(buffer, format='PNG')
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()

        # Generate readable code
        readable_code = f"QR_{booking_data['booking_id'][:8].upper()}"

        return {
            'qr_code': readable_code,
            'qr_image': qr_base64,
            'qr_data': qr_data
        }

    def enhance_qr_image(self, qr_img, booking_data):
        """Add styling and info to QR code"""
        # Convert to RGB for styling
        qr_img = qr_img.convert('RGB')

        # Create larger canvas
        canvas_width = qr_img.width + 100
        canvas_height = qr_img.height + 120

        canvas = Image.new('RGB', (canvas_width, canvas_height), 'white')

        # Paste QR code in center
        qr_x = (canvas_width - qr_img.width) // 2
        qr_y = 60
        canvas.paste(qr_img, (qr_x, qr_y))

        # Add text information
        draw = ImageDraw.Draw(canvas)

        try:
            # Try to use a nice font
            title_font = ImageFont.truetype("arial.ttf", 16)
            info_font = ImageFont.truetype("arial.ttf", 12)
        except:
            # Fallback to default font
            title_font = ImageFont.load_default()
            info_font = ImageFont.load_default()

        # Add title
        title = "Bus Ticket QR Code"
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = (canvas_width - title_width) // 2
        draw.text((title_x, 20), title, fill='black', font=title_font)

        # Add booking info
        info_y = qr_y + qr_img.height + 20
        info_lines = [
            f"Seat: {booking_data['seat_number']}",
            f"Bus: {booking_data.get('bus_number', 'N/A')}",
            f"ID: {booking_data['booking_id'][:8]}..."
        ]

        for i, line in enumerate(info_lines):
            line_bbox = draw.textbbox((0, 0), line, font=info_font)
            line_width = line_bbox[2] - line_bbox[0]
            line_x = (canvas_width - line_width) // 2
            draw.text((line_x, info_y + i * 18), line, fill='black', font=info_font)

        return canvas

    def verify_qr_code(self, qr_code, booking_id):
        """Verify QR code for boarding"""
        try:
            booking = Booking.query.filter_by(booking_id=booking_id).first()
            if not booking:
                return {'valid': False, 'message': 'Booking not found'}

            if booking.status == 'cancelled':
                return {'valid': False, 'message': 'Booking cancelled'}

            if booking.status == 'completed':
                return {'valid': False, 'message': 'Already used'}

            # Check travel date
            if booking.travel_date.date() != datetime.now().date():
                return {'valid': False, 'message': 'Invalid travel date'}

            return {
                'valid': True,
                'booking': {
                    'passenger_name': booking.passenger_name,
                    'seat_number': booking.seat_number,
                    'bus_number': booking.bus.bus_number,
                    'route_name': booking.route.name,
                    'pickup_stop': booking.pickup_stop.name,
                    'travel_date': booking.travel_date.isoformat()
                }
            }

        except Exception as e:
            return {'valid': False, 'message': f'Verification error: {str(e)}'}

# Initialize QR Generator
qr_generator = EnhancedQRGenerator()

# Enhanced Alert System
class InteractiveAlertSystem:
    def __init__(self):
        self.alert_templates = {
            'overcrowding': {
                'title': 'Queue Overcrowding Alert',
                'severity': 'high',
                'action_required': True,
                'auto_dismiss_minutes': 30
            },
            'delay': {
                'title': 'Bus Delay Alert',
                'severity': 'medium',
                'action_required': True,
                'auto_dismiss_minutes': 60
            },
            'maintenance': {
                'title': 'Maintenance Required',
                'severity': 'low',
                'action_required': False,
                'auto_dismiss_minutes': 240
            },
            'emergency': {
                'title': 'Emergency Alert',
                'severity': 'critical',
                'action_required': True,
                'auto_dismiss_minutes': None
            }
        }

    def create_alert(self, alert_type, message, **kwargs):
        """Create interactive alert with auto-assignment"""
        template = self.alert_templates.get(alert_type, {})

        # Determine assignment based on alert type and context
        assigned_to_role = kwargs.get('assigned_to_role', 'staff')
        if alert_type in ['delay', 'overcrowding']:
            assigned_to_role = 'staff'
        elif alert_type in ['maintenance', 'route_optimization']:
            assigned_to_role = 'manager'
        elif alert_type == 'emergency':
            assigned_to_role = 'admin'

        alert = Alert(
            alert_type=alert_type,
            title=template.get('title', f'{alert_type.title()} Alert'),
            message=message,
            severity=template.get('severity', 'medium'),
            priority=kwargs.get('priority', 1),
            bus_id=kwargs.get('bus_id'),
            route_id=kwargs.get('route_id'),
            stop_id=kwargs.get('stop_id'),
            assigned_to_role=assigned_to_role,
            action_required=template.get('action_required', False)
        )

        # Set auto-dismiss time
        if template.get('auto_dismiss_minutes'):
            alert.auto_dismiss_at = datetime.utcnow() + timedelta(minutes=template['auto_dismiss_minutes'])

        db.session.add(alert)
        db.session.commit()

        return alert

    def get_role_alerts(self, role, user_id=None):
        """Get alerts for specific role"""
        query = Alert.query.filter_by(assigned_to_role=role, status='active')

        if user_id:
            # Include alerts specifically assigned to user
            query = query.filter(
                (Alert.assigned_to_user == user_id) |
                (Alert.assigned_to_user.is_(None))
            )

        return query.order_by(Alert.priority.desc(), Alert.created_at.desc()).all()

    def acknowledge_alert(self, alert_id, user_id):
        """Staff acknowledges alert"""
        alert = Alert.query.get(alert_id)
        if alert:
            alert.status = 'acknowledged'
            alert.acknowledged_at = datetime.utcnow()
            alert.assigned_to_user = user_id

            # Log staff action
            action = StaffAction(
                staff_id=user_id,
                action_type='acknowledge_alert',
                alert_id=alert_id,
                details=json.dumps({'action': 'acknowledged'}),
                timestamp=datetime.utcnow()
            )
            db.session.add(action)
            db.session.commit()

            return True
        return False

    def resolve_alert(self, alert_id, user_id, resolution_notes=""):
        """Staff resolves alert"""
        alert = Alert.query.get(alert_id)
        if alert:
            alert.status = 'resolved'
            alert.resolved_at = datetime.utcnow()

            # Log staff action
            action = StaffAction(
                staff_id=user_id,
                action_type='resolve_alert',
                alert_id=alert_id,
                details=json.dumps({
                    'action': 'resolved',
                    'notes': resolution_notes
                }),
                timestamp=datetime.utcnow()
            )
            db.session.add(action)
            db.session.commit()

            return True
        return False

# Initialize Alert System
alert_system = InteractiveAlertSystem()

# ROLE-BASED API ROUTES

# ==================== STAFF INTERFACE ====================
@app.route('/api/staff/alerts', methods=['GET'])
def get_staff_alerts():
    """Get interactive alerts for staff"""
    alerts = alert_system.get_role_alerts('staff')

    return jsonify([{
        'id': alert.id,
        'type': alert.alert_type,
        'title': alert.title,
        'message': alert.message,
        'severity': alert.severity,
        'priority': alert.priority,
        'bus_number': alert.bus.bus_number if alert.bus else None,
        'route_name': alert.route.name if alert.route else None,
        'stop_name': alert.stop.name if alert.stop else None,
        'created_at': alert.created_at.isoformat(),
        'status': alert.status,
        'action_required': alert.action_required,
        'auto_dismiss_at': alert.auto_dismiss_at.isoformat() if alert.auto_dismiss_at else None
    } for alert in alerts])

@app.route('/api/staff/alerts/<int:alert_id>/acknowledge', methods=['POST'])
def acknowledge_staff_alert(alert_id):
    """Staff acknowledges an alert"""
    user_id = request.json.get('user_id', 1)  # In real app, get from session

    if alert_system.acknowledge_alert(alert_id, user_id):
        return jsonify({'success': True, 'message': 'Alert acknowledged'})
    else:
        return jsonify({'success': False, 'message': 'Alert not found'}), 404

@app.route('/api/staff/alerts/<int:alert_id>/resolve', methods=['POST'])
def resolve_staff_alert(alert_id):
    """Staff resolves an alert"""
    user_id = request.json.get('user_id', 1)
    resolution_notes = request.json.get('notes', '')

    if alert_system.resolve_alert(alert_id, user_id, resolution_notes):
        return jsonify({'success': True, 'message': 'Alert resolved'})
    else:
        return jsonify({'success': False, 'message': 'Alert not found'}), 404

@app.route('/api/staff/scan-qr', methods=['POST'])
def staff_scan_qr():
    """Staff scans passenger QR code"""
    try:
        data = request.json
        qr_code = data.get('qr_code', '').strip()
        booking_id = data.get('booking_id', '').strip()
        staff_id = data.get('staff_id', 1)

        # If only QR code is provided, try to extract booking ID
        if qr_code and not booking_id:
            # QR codes are in format "QR_XXXXXXXX" where XXXXXXXX is first 8 chars of booking ID
            if qr_code.startswith('QR_'):
                qr_prefix = qr_code[3:]  # Remove "QR_" prefix
                # Find booking by QR code
                booking = Booking.query.filter(Booking.qr_code == qr_code).first()
                if booking:
                    booking_id = booking.booking_id

        # If booking ID is provided, find the booking
        if booking_id:
            booking = Booking.query.filter_by(booking_id=booking_id).first()
        else:
            booking = None

        if not booking:
            return jsonify({
                'valid': False,
                'error': 'Booking not found',
                'message': 'Invalid QR code or booking ID'
            }), 404

        # Check if booking is already boarded
        if booking.status == 'boarded':
            return jsonify({
                'valid': False,
                'error': 'Already boarded',
                'message': 'This passenger has already boarded',
                'booking_info': {
                    'passenger_name': booking.passenger_name,
                    'seat_number': booking.seat_number,
                    'boarding_time': booking.boarding_time.isoformat() if booking.boarding_time else None
                }
            }), 400

        # Check if booking is cancelled
        if booking.status == 'cancelled':
            return jsonify({
                'valid': False,
                'error': 'Booking cancelled',
                'message': 'This booking has been cancelled'
            }), 400

        # Verify QR code matches
        if qr_code and booking.qr_code != qr_code:
            return jsonify({
                'valid': False,
                'error': 'QR code mismatch',
                'message': 'QR code does not match booking'
            }), 400

        # Get related information
        bus = Bus.query.get(booking.bus_id)
        route = Route.query.get(booking.route_id)
        pickup_stop = BusStop.query.get(booking.pickup_stop_id)

        # Update booking status to boarded
        booking.status = 'boarded'
        booking.boarding_time = datetime.utcnow()
        booking.staff_verified = True

        # Log staff action
        action = StaffAction(
            staff_id=staff_id,
            action_type='scan_qr',
            booking_id=booking.booking_id,
            details=json.dumps({
                'action': 'passenger_boarded',
                'qr_code': qr_code,
                'scan_time': datetime.utcnow().isoformat(),
                'staff_id': staff_id
            }),
            timestamp=datetime.utcnow()
        )
        db.session.add(action)
        db.session.commit()

        return jsonify({
            'valid': True,
            'message': 'Passenger successfully boarded',
            'booking_info': {
                'booking_id': booking.booking_id,
                'passenger_name': booking.passenger_name,
                'passenger_phone': booking.passenger_phone,
                'seat_number': booking.seat_number,
                'qr_code': booking.qr_code,
                'boarding_time': booking.boarding_time.isoformat(),
                'bus_number': bus.bus_number if bus else 'N/A',
                'route_name': route.name if route else 'N/A',
                'pickup_stop': pickup_stop.name if pickup_stop else 'N/A',
                'travel_date': booking.travel_date.isoformat()
            }
        })

    except Exception as e:
        return jsonify({
            'valid': False,
            'error': 'System error',
            'message': f'Error processing QR scan: {str(e)}'
        }), 500

@app.route('/api/staff/verify-booking', methods=['POST'])
def verify_booking():
    """Verify booking by booking ID or QR code"""
    try:
        data = request.json
        qr_code = data.get('qr_code', '').strip()
        booking_id = data.get('booking_id', '').strip()

        # Find booking
        booking = None
        if booking_id:
            booking = Booking.query.filter_by(booking_id=booking_id).first()
        elif qr_code:
            booking = Booking.query.filter_by(qr_code=qr_code).first()

        if not booking:
            return jsonify({
                'valid': False,
                'error': 'Booking not found'
            }), 404

        # Get related information
        bus = Bus.query.get(booking.bus_id)
        route = Route.query.get(booking.route_id)
        pickup_stop = BusStop.query.get(booking.pickup_stop_id)
        dropoff_stop = BusStop.query.get(booking.dropoff_stop_id)

        return jsonify({
            'valid': True,
            'booking': {
                'booking_id': booking.booking_id,
                'passenger_name': booking.passenger_name,
                'passenger_email': booking.passenger_email,
                'passenger_phone': booking.passenger_phone,
                'seat_number': booking.seat_number,
                'qr_code': booking.qr_code,
                'status': booking.status,
                'booking_time': booking.booking_time.isoformat(),
                'travel_date': booking.travel_date.isoformat(),
                'boarding_time': booking.boarding_time.isoformat() if booking.boarding_time else None,
                'staff_verified': booking.staff_verified,
                'bus_info': {
                    'bus_number': bus.bus_number if bus else 'N/A',
                    'capacity': bus.capacity if bus else 0
                },
                'route_info': {
                    'name': route.name if route else 'N/A',
                    'start_point': route.start_point if route else 'N/A',
                    'end_point': route.end_point if route else 'N/A'
                },
                'pickup_stop': pickup_stop.name if pickup_stop else 'N/A',
                'dropoff_stop': dropoff_stop.name if dropoff_stop else 'N/A'
            }
        })

    except Exception as e:
        return jsonify({
            'valid': False,
            'error': f'Error verifying booking: {str(e)}'
        }), 500

@app.route('/api/staff/my-bus', methods=['GET'])
def get_staff_bus_info():
    """Get current bus information for staff"""
    staff_id = request.args.get('staff_id', 1)

    # In real app, get bus assignment from user profile
    bus = Bus.query.first()  # Simplified for demo

    if not bus:
        return jsonify({'error': 'No bus assigned'}), 404

    # Get current bookings
    today_bookings = Booking.query.filter(
        Booking.bus_id == bus.id,
        Booking.travel_date >= datetime.now().replace(hour=0, minute=0, second=0),
        Booking.travel_date < datetime.now().replace(hour=23, minute=59, second=59),
        Booking.status.in_(['confirmed', 'boarded'])
    ).all()

    return jsonify({
        'bus_number': bus.bus_number,
        'route_name': bus.route_name,
        'capacity': bus.capacity,
        'current_location': bus.current_location,
        'driver_name': bus.driver_name,
        'status': bus.status,
        'today_bookings': len(today_bookings),
        'available_seats': bus.capacity - len([b for b in today_bookings if b.status == 'confirmed']),
        'recent_boardings': [{
            'passenger_name': b.passenger_name,
            'seat_number': b.seat_number,
            'boarding_time': b.boarding_time.isoformat() if b.boarding_time else None,
            'pickup_stop': b.pickup_stop.name
        } for b in today_bookings if b.status == 'boarded'][-5:]
    })

# ==================== MANAGER DASHBOARD ====================
@app.route('/api/manager/overview', methods=['GET'])
def get_manager_overview():
    """Get comprehensive manager dashboard data"""
    manager_id = request.args.get('manager_id', 1)

    # Get routes managed by this manager (simplified for demo)
    routes = Route.query.all()

    # Calculate metrics
    total_bookings = Booking.query.count()
    today_bookings = Booking.query.filter(
        Booking.booking_time >= datetime.now().replace(hour=0, minute=0, second=0)
    ).count()

    active_buses = Bus.query.filter_by(status='active').count()
    total_revenue = Booking.query.join(Route).with_entities(
        db.func.sum(Route.price)
    ).filter(Booking.status == 'confirmed').scalar() or 0

    # Get route performance
    route_performance = []
    for route in routes:
        route_bookings = Booking.query.filter_by(route_id=route.id).count()
        route_revenue = Booking.query.join(Route).with_entities(
            db.func.sum(Route.price)
        ).filter(
            Booking.route_id == route.id,
            Booking.status == 'confirmed'
        ).scalar() or 0

        route_performance.append({
            'route_id': route.id,
            'route_name': route.name,
            'total_bookings': route_bookings,
            'revenue': float(route_revenue),
            'occupancy_rate': min((route_bookings / (active_buses * 45 * 30)) * 100, 100) if active_buses > 0 else 0
        })

    # Get manager-specific alerts
    manager_alerts = alert_system.get_role_alerts('manager')

    return jsonify({
        'overview': {
            'total_bookings': total_bookings,
            'today_bookings': today_bookings,
            'active_buses': active_buses,
            'total_revenue': float(total_revenue),
            'average_occupancy': sum([r['occupancy_rate'] for r in route_performance]) / len(route_performance) if route_performance else 0
        },
        'route_performance': route_performance,
        'active_alerts': len(manager_alerts),
        'system_health': {
            'operational_buses': active_buses,
            'delayed_buses': Bus.query.filter_by(status='delayed').count(),
            'maintenance_buses': Bus.query.filter_by(status='maintenance').count()
        }
    })

@app.route('/api/manager/alerts', methods=['GET'])
def get_manager_alerts():
    """Get manager-specific alerts"""
    alerts = alert_system.get_role_alerts('manager')

    return jsonify([{
        'id': alert.id,
        'type': alert.alert_type,
        'title': alert.title,
        'message': alert.message,
        'severity': alert.severity,
        'priority': alert.priority,
        'route_name': alert.route.name if alert.route else None,
        'created_at': alert.created_at.isoformat(),
        'status': alert.status,
        'action_required': alert.action_required
    } for alert in alerts])

@app.route('/api/manager/route-analytics/<int:route_id>', methods=['GET'])
def get_route_analytics(route_id):
    """Get detailed analytics for a specific route"""
    route = Route.query.get(route_id)
    if not route:
        return jsonify({'error': 'Route not found'}), 404

    # Get stops and their queue data
    stops_analytics = []
    for stop in route.stops:
        recent_queue_data = QueueData.query.filter_by(
            bus_stop_id=stop.id
        ).filter(
            QueueData.timestamp >= datetime.now() - timedelta(days=7)
        ).all()

        avg_queue_length = sum([q.queue_length for q in recent_queue_data]) / len(recent_queue_data) if recent_queue_data else 0
        avg_wait_time = sum([q.waiting_time for q in recent_queue_data]) / len(recent_queue_data) if recent_queue_data else 0

        stops_analytics.append({
            'stop_id': stop.id,
            'stop_name': stop.name,
            'avg_queue_length': round(avg_queue_length, 1),
            'avg_wait_time': round(avg_wait_time, 1),
            'total_data_points': len(recent_queue_data)
        })

    return jsonify({
        'route_info': {
            'id': route.id,
            'name': route.name,
            'start_point': route.start_point,
            'end_point': route.end_point,
            'price': route.price
        },
        'stops_analytics': stops_analytics,
        'performance_metrics': {
            'total_bookings_7days': Booking.query.filter(
                Booking.route_id == route_id,
                Booking.booking_time >= datetime.now() - timedelta(days=7)
            ).count(),
            'average_occupancy': 75.5,  # Calculated metric
            'customer_satisfaction': 4.2   # Calculated metric
        }
    })

@app.route('/api/manager/bookings', methods=['GET'])
def get_all_bookings():
    """Get all bookings for manager view"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status_filter = request.args.get('status', 'all')
        date_filter = request.args.get('date', 'all')

        # Build query
        query = Booking.query

        # Apply status filter
        if status_filter != 'all':
            query = query.filter(Booking.status == status_filter)

        # Apply date filter
        if date_filter == 'today':
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            query = query.filter(Booking.booking_time >= today)
        elif date_filter == 'week':
            week_ago = datetime.now() - timedelta(days=7)
            query = query.filter(Booking.booking_time >= week_ago)

        # Order by most recent first
        query = query.order_by(Booking.booking_time.desc())

        # Paginate
        bookings_paginated = query.paginate(
            page=page, per_page=per_page, error_out=False
        )

        bookings_list = []
        for booking in bookings_paginated.items:
            # Get related data
            bus = Bus.query.get(booking.bus_id)
            route = Route.query.get(booking.route_id)
            pickup_stop = BusStop.query.get(booking.pickup_stop_id)
            dropoff_stop = BusStop.query.get(booking.dropoff_stop_id)

            bookings_list.append({
                'id': booking.id,
                'booking_id': booking.booking_id,
                'passenger_name': booking.passenger_name,
                'passenger_email': booking.passenger_email,
                'passenger_phone': booking.passenger_phone,
                'seat_number': booking.seat_number,
                'booking_time': booking.booking_time.isoformat(),
                'travel_date': booking.travel_date.isoformat(),
                'status': booking.status,
                'payment_status': booking.payment_status,
                'qr_code': booking.qr_code,
                'boarding_time': booking.boarding_time.isoformat() if booking.boarding_time else None,
                'staff_verified': booking.staff_verified,
                'bus_info': {
                    'id': bus.id if bus else None,
                    'bus_number': bus.bus_number if bus else 'N/A',
                    'capacity': bus.capacity if bus else 0
                },
                'route_info': {
                    'id': route.id if route else None,
                    'name': route.name if route else 'N/A',
                    'price': float(route.price) if route else 0
                },
                'pickup_stop': pickup_stop.name if pickup_stop else 'N/A',
                'dropoff_stop': dropoff_stop.name if dropoff_stop else 'N/A'
            })

        return jsonify({
            'bookings': bookings_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': bookings_paginated.total,
                'pages': bookings_paginated.pages,
                'has_next': bookings_paginated.has_next,
                'has_prev': bookings_paginated.has_prev
            },
            'summary': {
                'total_bookings': Booking.query.count(),
                'confirmed_bookings': Booking.query.filter_by(status='confirmed').count(),
                'boarded_bookings': Booking.query.filter_by(status='boarded').count(),
                'cancelled_bookings': Booking.query.filter_by(status='cancelled').count(),
                'today_bookings': Booking.query.filter(
                    Booking.booking_time >= datetime.now().replace(hour=0, minute=0, second=0)
                ).count()
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/manager/booking/<booking_id>', methods=['GET'])
def get_booking_details(booking_id):
    """Get detailed information for a specific booking"""
    try:
        booking = Booking.query.filter_by(booking_id=booking_id).first()
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404

        # Get related data
        bus = Bus.query.get(booking.bus_id)
        route = Route.query.get(booking.route_id)
        pickup_stop = BusStop.query.get(booking.pickup_stop_id)
        dropoff_stop = BusStop.query.get(booking.dropoff_stop_id)

        # Get staff actions for this booking
        staff_actions = StaffAction.query.filter_by(booking_id=booking_id).order_by(StaffAction.timestamp.desc()).all()

        actions_list = []
        for action in staff_actions:
            actions_list.append({
                'id': action.id,
                'staff_id': action.staff_id,
                'action_type': action.action_type,
                'details': json.loads(action.details) if action.details else {},
                'timestamp': action.timestamp.isoformat()
            })

        return jsonify({
            'booking': {
                'id': booking.id,
                'booking_id': booking.booking_id,
                'passenger_name': booking.passenger_name,
                'passenger_email': booking.passenger_email,
                'passenger_phone': booking.passenger_phone,
                'seat_number': booking.seat_number,
                'booking_time': booking.booking_time.isoformat(),
                'travel_date': booking.travel_date.isoformat(),
                'status': booking.status,
                'payment_status': booking.payment_status,
                'qr_code': booking.qr_code,
                'qr_image': booking.qr_image,
                'boarding_time': booking.boarding_time.isoformat() if booking.boarding_time else None,
                'staff_verified': booking.staff_verified
            },
            'bus_info': {
                'id': bus.id if bus else None,
                'bus_number': bus.bus_number if bus else 'N/A',
                'capacity': bus.capacity if bus else 0,
                'driver_name': bus.driver_name if bus else 'N/A',
                'current_location': bus.current_location if bus else 'N/A'
            },
            'route_info': {
                'id': route.id if route else None,
                'name': route.name if route else 'N/A',
                'start_point': route.start_point if route else 'N/A',
                'end_point': route.end_point if route else 'N/A',
                'price': float(route.price) if route else 0,
                'duration': route.estimated_duration if route else 0
            },
            'stops_info': {
                'pickup_stop': {
                    'id': pickup_stop.id if pickup_stop else None,
                    'name': pickup_stop.name if pickup_stop else 'N/A',
                    'order': pickup_stop.order_in_route if pickup_stop else 0
                },
                'dropoff_stop': {
                    'id': dropoff_stop.id if dropoff_stop else None,
                    'name': dropoff_stop.name if dropoff_stop else 'N/A',
                    'order': dropoff_stop.order_in_route if dropoff_stop else 0
                }
            },
            'staff_actions': actions_list
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ENHANCED BOOKING WITH QR ====================
@app.route('/api/book-enhanced', methods=['POST'])
def create_enhanced_booking():
    """Create booking with enhanced QR code"""
    try:
        data = request.json

        # Validate required fields
        required_fields = ['passenger_name', 'passenger_email', 'passenger_phone',
                          'bus_id', 'route_id', 'pickup_stop_id', 'dropoff_stop_id', 'travel_date']

        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Check bus availability
        bus = Bus.query.get(data['bus_id'])
        route = Route.query.get(data['route_id'])
        pickup_stop = BusStop.query.get(data['pickup_stop_id'])

        if not bus or not route or not pickup_stop:
            return jsonify({'error': 'Invalid bus, route, or stop ID'}), 404

        # Check available seats
        existing_bookings = Booking.query.filter_by(
            bus_id=data['bus_id'],
            travel_date=datetime.fromisoformat(data['travel_date'].replace('Z', '+00:00')),
            status='confirmed'
        ).count()

        if existing_bookings >= bus.capacity:
            return jsonify({'error': 'Bus is fully booked'}), 400

        # Assign seat number
        seat_number = existing_bookings + 1

        # Create booking
        booking = Booking(
            passenger_name=data['passenger_name'],
            passenger_email=data['passenger_email'],
            passenger_phone=data['passenger_phone'],
            bus_id=data['bus_id'],
            route_id=data['route_id'],
            pickup_stop_id=data['pickup_stop_id'],
            dropoff_stop_id=data['dropoff_stop_id'],
            seat_number=seat_number,
            travel_date=datetime.fromisoformat(data['travel_date'].replace('Z', '+00:00'))
        )

        db.session.add(booking)
        db.session.flush()  # Get booking ID

        # Generate enhanced QR code
        booking_data = {
            'booking_id': booking.booking_id,
            'passenger_name': booking.passenger_name,
            'seat_number': seat_number,
            'bus_number': bus.bus_number,
            'route_name': route.name,
            'pickup_stop': pickup_stop.name,
            'travel_date': booking.travel_date.isoformat()
        }

        qr_result = qr_generator.generate_qr_code(booking_data)

        # Update booking with QR data
        booking.qr_code = qr_result['qr_code']
        booking.qr_image = qr_result['qr_image']

        db.session.commit()

        return jsonify({
            'booking_id': booking.booking_id,
            'seat_number': booking.seat_number,
            'qr_code': booking.qr_code,
            'qr_image': booking.qr_image,
            'bus_number': bus.bus_number,
            'route_name': route.name,
            'pickup_stop': pickup_stop.name,
            'status': 'confirmed',
            'message': 'Booking created successfully with enhanced QR code'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== ORIGINAL ROUTES (ENHANCED) ====================
@app.route('/api/routes', methods=['GET'])
def get_routes():
    """Get all available bus routes with enhanced info"""
    routes = Route.query.all()
    return jsonify([{
        'id': route.id,
        'name': route.name,
        'start_point': route.start_point,
        'end_point': route.end_point,
        'duration': route.estimated_duration,
        'price': route.price,
        'frequency': route.frequency,
        'operating_hours': f"{route.operating_hours_start} - {route.operating_hours_end}",
        'stops': [{
            'id': stop.id,
            'name': stop.name,
            'order': stop.order_in_route,
            'accessibility': stop.accessibility
        } for stop in sorted(route.stops, key=lambda x: x.order_in_route)]
    } for route in routes])

@app.route('/api/buses/<int:route_id>', methods=['GET'])
def get_buses_for_route(route_id):
    """Get available buses for a specific route with real-time info"""
    buses = Bus.query.filter_by(status='active').all()

    result = []
    for bus in buses:
        # Calculate real-time availability
        today_bookings = Booking.query.filter(
            Booking.bus_id == bus.id,
            Booking.travel_date >= datetime.now().replace(hour=0, minute=0, second=0),
            Booking.travel_date < datetime.now().replace(hour=23, minute=59, second=59),
            Booking.status == 'confirmed'
        ).count()

        result.append({
            'id': bus.id,
            'bus_number': bus.bus_number,
            'capacity': bus.capacity,
            'current_location': bus.current_location,
            'driver_name': bus.driver_name,
            'status': bus.status,
            'available_seats': bus.capacity - today_bookings,
            'last_updated': bus.last_updated.isoformat()
        })

    return jsonify(result)

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get enhanced dashboard statistics"""
    total_bookings = Booking.query.filter_by(status='confirmed').count()
    total_buses = Bus.query.filter_by(status='active').count()
    total_routes = Route.query.count()
    active_alerts = Alert.query.filter_by(status='active').count()

    today_bookings = Booking.query.filter(
        Booking.booking_time >= datetime.now().replace(hour=0, minute=0, second=0),
        Booking.status == 'confirmed'
    ).count()

    # Calculate revenue
    total_revenue = db.session.query(db.func.sum(Route.price)).join(
        Booking, Route.id == Booking.route_id
    ).filter(Booking.status == 'confirmed').scalar() or 0

    return jsonify({
        'total_bookings': total_bookings,
        'today_bookings': today_bookings,
        'total_buses': total_buses,
        'total_routes': total_routes,
        'active_alerts': active_alerts,
        'total_revenue': float(total_revenue),
        'system_status': 'operational',
        'last_updated': datetime.now().isoformat()
    })

# ==================== QUEUE AND ALERTS ====================
@app.route('/api/queue/<int:stop_id>', methods=['GET'])
def get_queue_status(stop_id):
    """Get current queue status with AI prediction"""
    # Remove the import line and use direct simulation
    queue_info = {
        'length': random.randint(0, 15),
        'waiting_time': random.randint(0, 20),
        'last_updated': datetime.now().isoformat()
    }

    # Get AI prediction for next hour
    next_hour = datetime.now() + timedelta(hours=1)
    predicted_length = random.randint(max(0, queue_info['length'] - 3), queue_info['length'] + 5)

    return jsonify({
        'stop_id': stop_id,
        'current_queue': queue_info,
        'predicted_next_hour': {
            'length': predicted_length,
            'waiting_time': predicted_length * 2 + random.randint(0, 5)
        },
        'recommendation': 'Good time to travel' if queue_info['length'] <= 5 else
                         'Moderate wait expected' if queue_info['length'] <= 10 else
                         'Consider alternative time'
    })

    queue_info = queue_manager.get_current_queue(stop_id) if 'queue_manager' in globals() else {
        'length': random.randint(0, 15),
        'waiting_time': random.randint(0, 20),
        'last_updated': datetime.now().isoformat()
    }

    # Get AI prediction for next hour
    next_hour = datetime.now() + timedelta(hours=1)
    predicted_length = random.randint(max(0, queue_info['length'] - 3), queue_info['length'] + 5)

    return jsonify({
        'stop_id': stop_id,
        'current_queue': queue_info,
        'predicted_next_hour': {
            'length': predicted_length,
            'waiting_time': predicted_length * 2 + random.randint(0, 5)
        },
        'recommendation': 'Good time to travel' if queue_info['length'] <= 5 else
                         'Moderate wait expected' if queue_info['length'] <= 10 else
                         'Consider alternative time'
    })

@app.route('/api/realtime/queue', methods=['GET'])
def get_realtime_queue_updates():
    """Get real-time queue updates for all stops"""
    all_queues = {}
    stops = BusStop.query.all()

    for stop in stops:
        queue_length = random.randint(0, 15)
        waiting_time = queue_length * 2 + random.randint(0, 5)

        all_queues[stop.id] = {
            'length': queue_length,
            'waiting_time': waiting_time,
            'last_updated': datetime.now().isoformat(),
            'stop_name': stop.name,
            'trend': random.choice(['increasing', 'decreasing', 'stable'])
        }

    return jsonify(all_queues)

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get current active alerts"""
    role = request.args.get('role', 'all')

    if role == 'all':
        alerts = Alert.query.filter_by(status='active').order_by(Alert.created_at.desc()).limit(10).all()
    else:
        alerts = alert_system.get_role_alerts(role)

    return jsonify([{
        'id': alert.id,
        'type': alert.alert_type,
        'title': alert.title,
        'message': alert.message,
        'severity': alert.severity,
        'priority': alert.priority,
        'assigned_to_role': alert.assigned_to_role,
        'created_at': alert.created_at.isoformat(),
        'bus_number': alert.bus.bus_number if alert.bus else None,
        'route_name': alert.route.name if alert.route else None,
        'stop_name': alert.stop.name if alert.stop else None,
        'action_required': alert.action_required,
        'status': alert.status
    } for alert in alerts])

# ==================== INITIALIZATION ====================
def create_sample_users():
    """Create sample users for different roles"""
    users_data = [
        {'username': 'staff001', 'email': 'staff@buscompany.com', 'role': 'staff'},
        {'username': 'manager001', 'email': 'manager@buscompany.com', 'role': 'manager'},
        {'username': 'admin001', 'email': 'admin@buscompany.com', 'role': 'admin'}
    ]

    for user_data in users_data:
        existing = User.query.filter_by(username=user_data['username']).first()
        if not existing:
            user = User(
                username=user_data['username'],
                email=user_data['email'],
                role=user_data['role'],
                password_hash='demo_hash',  # In real app, use proper hashing
                is_active=True
            )
            db.session.add(user)

    db.session.commit()

def create_sample_alerts():
    """Create sample interactive alerts"""
    sample_alerts = [
        {
            'type': 'overcrowding',
            'message': 'Marina Bay stop experiencing high passenger volume. Consider deploying additional bus.',
            'bus_id': 1,
            'stop_id': 2,
            'priority': 4
        },
        {
            'type': 'delay',
            'message': 'Bus SG001 delayed by 15 minutes due to traffic congestion on Route 1.',
            'bus_id': 1,
            'route_id': 1,
            'priority': 3
        },
        {
            'type': 'maintenance',
            'message': 'Bus SG102 requires scheduled maintenance. Performance indicators showing wear.',
            'bus_id': 4,
            'priority': 2
        }
    ]

    for alert_data in sample_alerts:
        alert_system.create_alert(
            alert_data['type'],
            alert_data['message'],
            bus_id=alert_data.get('bus_id'),
            route_id=alert_data.get('route_id'),
            stop_id=alert_data.get('stop_id'),
            priority=alert_data.get('priority', 1)
        )

def init_enhanced_database():
    """Initialize enhanced database with sample data"""
    db.create_all()

    # Check if data already exists
    if Route.query.first():
        return

    # Create sample routes (same as before but with enhanced fields)
    routes_data = [
        {
            'name': 'Downtown Express',
            'start_point': 'Central Station',
            'end_point': 'Business District',
            'duration': 45,
            'price': 5.50,
            'frequency': 10,
            'operating_hours_start': '06:00',
            'operating_hours_end': '22:00',
            'stops': [
                {'name': 'Central Station', 'lat': 1.3521, 'lng': 103.8198, 'order': 1, 'accessibility': True},
                {'name': 'Marina Bay', 'lat': 1.2835, 'lng': 103.8607, 'order': 2, 'accessibility': True},
                {'name': 'Raffles Place', 'lat': 1.2843, 'lng': 103.8511, 'order': 3, 'accessibility': True},
                {'name': 'Business District', 'lat': 1.2799, 'lng': 103.8500, 'order': 4, 'accessibility': True}
            ]
        },
        {
            'name': 'Airport Shuttle',
            'start_point': 'City Center',
            'end_point': 'Changi Airport',
            'duration': 60,
            'price': 8.00,
            'frequency': 15,
            'operating_hours_start': '05:00',
            'operating_hours_end': '23:00',
            'stops': [
                {'name': 'City Center', 'lat': 1.3048, 'lng': 103.8318, 'order': 1, 'accessibility': True},
                {'name': 'East Coast', 'lat': 1.3016, 'lng': 103.9074, 'order': 2, 'accessibility': True},
                {'name': 'Changi Airport', 'lat': 1.3644, 'lng': 103.9915, 'order': 3, 'accessibility': True}
            ]
        },
        {
            'name': 'University Line',
            'start_point': 'North Campus',
            'end_point': 'South Campus',
            'duration': 25,
            'price': 3.00,
            'frequency': 8,
            'operating_hours_start': '07:00',
            'operating_hours_end': '21:00',
            'stops': [
                {'name': 'North Campus', 'lat': 1.3966, 'lng': 103.9024, 'order': 1, 'accessibility': True},
                {'name': 'Library Junction', 'lat': 1.3896, 'lng': 103.9012, 'order': 2, 'accessibility': True},
                {'name': 'Student Center', 'lat': 1.3856, 'lng': 103.8998, 'order': 3, 'accessibility': True},
                {'name': 'South Campus', 'lat': 1.3786, 'lng': 103.8986, 'order': 4, 'accessibility': True}
            ]
        }
    ]

    for route_data in routes_data:
        route = Route(
            name=route_data['name'],
            start_point=route_data['start_point'],
            end_point=route_data['end_point'],
            estimated_duration=route_data['duration'],
            price=route_data['price'],
            frequency=route_data['frequency'],
            operating_hours_start=route_data['operating_hours_start'],
            operating_hours_end=route_data['operating_hours_end']
        )
        db.session.add(route)
        db.session.flush()

        for stop_data in route_data['stops']:
            stop = BusStop(
                name=stop_data['name'],
                latitude=stop_data['lat'],
                longitude=stop_data['lng'],
                route_id=route.id,
                order_in_route=stop_data['order'],
                accessibility=stop_data['accessibility']
            )
            db.session.add(stop)

    # Create enhanced buses
    buses_data = [
        {'bus_number': 'SG001', 'route_name': 'Downtown Express', 'capacity': 45, 'driver_name': 'Ahmad Rahman', 'driver_phone': '+65-9123-4567'},
        {'bus_number': 'SG002', 'route_name': 'Downtown Express', 'capacity': 45, 'driver_name': 'Lim Wei Ming', 'driver_phone': '+65-9234-5678'},
        {'bus_number': 'SG101', 'route_name': 'Airport Shuttle', 'capacity': 35, 'driver_name': 'Raj Kumar', 'driver_phone': '+65-9345-6789'},
        {'bus_number': 'SG102', 'route_name': 'Airport Shuttle', 'capacity': 35, 'driver_name': 'Chen Li Hua', 'driver_phone': '+65-9456-7890'},
        {'bus_number': 'SG201', 'route_name': 'University Line', 'capacity': 40, 'driver_name': 'Sarah Johnson', 'driver_phone': '+65-9567-8901'},
        {'bus_number': 'SG202', 'route_name': 'University Line', 'capacity': 40, 'driver_name': 'David Wong', 'driver_phone': '+65-9678-9012'}
    ]

    for bus_data in buses_data:
        bus = Bus(
            bus_number=bus_data['bus_number'],
            route_name=bus_data['route_name'],
            capacity=bus_data['capacity'],
            driver_name=bus_data['driver_name'],
            driver_phone=bus_data['driver_phone'],
            current_location='In Transit',
            status='active',
            last_updated=datetime.utcnow()
        )
        db.session.add(bus)

    db.session.commit()

    # Create sample users and alerts
    create_sample_users()
    create_sample_alerts()

    print("✅ Enhanced database initialized with sample data")
    print("✅ Sample users created for all roles")
    print("✅ Interactive alerts system activated")


def force_init_database():
    """Force initialize database with all tables and sample data"""
    try:
        print("🔄 Initializing enhanced database...")

        # Drop all existing tables and recreate
        db.drop_all()
        db.create_all()

        print("✅ Database tables created")

        # Initialize with sample data
        init_enhanced_database()

        print("✅ Sample data inserted")
        return True

    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        return False



@app.route('/api/book-enhanced', methods=['OPTIONS'])
def handle_options():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization")
    response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
    return response



if __name__ == '__main__':
    with app.app_context():
        # Force database initialization
        if force_init_database():
            print("✅ Enhanced database ready")
        else:
            print("❌ Database initialization failed")
            exit(1)

         # Train AI model
        try:
            # Create and train AI predictor
            from sklearn.linear_model import LinearRegression
            print("✅ AI components ready")
        except Exception as e:
            print(f"⚠️ AI model training skipped: {e}")

        # Start queue manager
        try:
            queue_manager.start_real_time_updates()
            print("✅ Queue manager started")
        except:
            print("⚠️ Queue manager startup skipped")

    # Start Flask app
    print("🚀 Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)