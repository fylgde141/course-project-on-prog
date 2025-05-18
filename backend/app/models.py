from .database import db
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    """
    Модель пользователя
    """
    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(64))
    phone = db.Column(db.String(16))
    password_hash = db.Column(db.String(128), nullable=False)  # Добавляем поле для пароля

    # Отношения
    books = db.relationship('Book', backref='owner', lazy='dynamic')
    reviews = db.relationship('Review', backref='author', lazy='dynamic')
    sent_deals = db.relationship('Deal',
                                 foreign_keys='Deal.sender_id',
                                 backref='sender',
                                 lazy='dynamic')
    received_deals = db.relationship('Deal',
                                     foreign_keys='Deal.recipient_id',
                                     backref='recipient',
                                     lazy='dynamic')

    is_admin = db.Column(db.Boolean, default=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Book(db.Model):
    __tablename__ = 'book'
    book_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    title = db.Column(db.String(32), nullable=False)
    description = db.Column(db.String(128))
    is_available = db.Column(db.Boolean, default=True)

    # Отношения
    reviews = db.relationship('Review', backref='book', lazy='dynamic')
    offered_in_deals = db.relationship('Deal',
                                       foreign_keys='Deal.sender_book_id',
                                       backref='offered_book',
                                       lazy='dynamic')
    requested_in_deals = db.relationship('Deal',
                                         foreign_keys='Deal.recipient_book_id',
                                         backref='requested_book',
                                         lazy='dynamic')


class Review(db.Model):
    __tablename__ = 'review'
    review_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    book_id = db.Column(db.Integer, db.ForeignKey('book.book_id'))
    review_text = db.Column(db.String(512), nullable=False)


class Deal(db.Model):
    """
    Модель сделки
    """
    __tablename__ = 'deal'
    deal_id = db.Column(db.Integer, primary_key=True)

    # Участники
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    recipient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # Книги
    sender_book_id = db.Column(db.Integer, db.ForeignKey('book.book_id'))
    recipient_book_id = db.Column(db.Integer, db.ForeignKey('book.book_id'), nullable=False)

    # Статусы
    gift_flag = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(32), default='Created')  # Created/Agreed/Completed

    # Детали
    time = db.Column(db.DateTime)
    place = db.Column(db.String(128))