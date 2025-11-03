"""
MySQL 기반 인증 서비스 (Flask 예시)
Flask를 선택할 경우 참고용
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import uuid

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql+pymysql://{os.getenv('MYSQL_USER')}:{os.getenv('MYSQL_PASSWORD')}"
    f"@{os.getenv('MYSQL_HOST')}:{os.getenv('MYSQL_PORT')}/{os.getenv('MYSQL_DATABASE')}"
)
db = SQLAlchemy(app)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(255), primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('user', 'premium', 'admin'), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }

class MySQLAuthService:
    """인증 서비스"""
    
    @staticmethod
    def authenticate(email: str, password: str) -> str | None:
        """사용자 인증"""
        user = User.query.filter_by(email=email, is_active=True).first()
        if user and check_password_hash(user.password_hash, password):
            user.last_login_at = datetime.utcnow()
            db.session.commit()
            return user.id
        return None
    
    @staticmethod
    def get_user_by_id(user_id: str) -> User | None:
        """사용자 조회"""
        return User.query.filter_by(id=user_id, is_active=True).first()
    
    @staticmethod
    def create_user(email: str, name: str, password: str, role: str = 'user') -> str:
        """사용자 생성"""
        if User.query.filter_by(email=email).first():
            raise ValueError('이미 사용 중인 이메일입니다.')
        
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            name=name,
            password_hash=generate_password_hash(password),
            role=role
        )
        db.session.add(user)
        db.session.commit()
        return user.id

