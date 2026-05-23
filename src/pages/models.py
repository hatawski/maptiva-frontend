from ....Backend import db
from datetime import datetime

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80))
    student_id = db.Column(db.String(20), unique=True)
    email = db.Column(db.String(120), unique=True)
    password = db.Column(db.String(120))
    qr_code = db.Column(db.String(120), nullable=True)

class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True)
    password = db.Column(db.String(120))

class PC(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pc_name = db.Column(db.String(50), unique=True)
    status = db.Column(db.String(50), default="available")
    assigned_to = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=True)

class Reservation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'))
    pc_id = db.Column(db.Integer, db.ForeignKey('pc.id'))
    checked_in_at = db.Column(db.DateTime, default=datetime.utcnow)
    checked_out_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), default="reserved")
