import logging
from flask import request, jsonify
from .models import Book, User, Review, Deal
from .database import db
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token
from flasgger import swag_from
from datetime import datetime

logging.basicConfig(
    level=logging.DEBUG,  # Уровень логов (DEBUG для максимальной детализации)
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),  # Вывод логов в консоль (stdout)
        logging.FileHandler('app.log')  # Сохранение логов в файл
    ]
)
logger = logging.getLogger(__name__)


def init_routes(app):
    # === AUTHENTICATION ===

    @app.route('/api/register', methods=['POST'])
    @swag_from({
        'tags': ['Authentication'],
        'summary': 'Регистрация нового пользователя',
        'parameters': [
            {
                'name': 'body',
                'in': 'body',
                'required': True,
                'schema': {
                    'type': 'object',
                    'properties': {
                        'username': {'type': 'string'},
                        'email': {'type': 'string'},
                        'phone': {'type': 'string'},
                        'password': {'type': 'string'}
                    },
                    'required': ['username', 'password']
                }
            }
        ],
        'responses': {
            '201': {'description': 'Пользователь зарегистрирован'},
            '400': {'description': 'Пользователь уже существует'}
        }
    })
    def register():
        data = request.get_json()
        if User.query.filter_by(username=data.get('username')).first():
            return jsonify({'message': 'Пользователь уже существует'}), 400

        user = User(
            username=data.get('username'),
            email=data.get('email'),
            phone=data.get('phone'),
            is_admin=False  # Роль админа по умолчанию False
        )
        user.set_password(data.get('password'))
        db.session.add(user)
        db.session.commit()
        return jsonify({'message': 'Пользователь зарегистрирован'}), 201

    @app.route('/api/login', methods=['POST'])
    @swag_from({
        'tags': ['Authentication'],
        'summary': 'Авторизация пользователя',
        'parameters': [
            {
                'name': 'body',
                'in': 'body',
                'required': True,
                'schema': {
                    'type': 'object',
                    'properties': {
                        'username': {'type': 'string'},
                        'password': {'type': 'string'}
                    },
                    'required': ['username', 'password']
                }
            }
        ],
        'responses': {
            '200': {'description': 'Успешная авторизация, возвращает токен'},
            '401': {'description': 'Неверные учетные данные'}
        }
    })
    def login():
        data = request.get_json()
        user = User.query.filter_by(username=data.get('username')).first()
        if not user or not user.check_password(data.get('password')):
            return jsonify({'message': 'Неверные учетные данные'}), 401

        access_token = create_access_token(identity=str(user.id))
        return jsonify({'access_token': access_token}), 200

    # === BOOKS ===

    @app.route('/api/books', methods=['GET'])
    @swag_from({
        'tags': ['Books'],
        'summary': 'Получить список всех доступных книг',
        'parameters': [
            {
                'name': 'title',
                'in': 'query',
                'type': 'string',
                'required': False,
                'description': 'Фильтр по названию книги'
            },
            {
                'name': 'is_available',
                'in': 'query',
                'type': 'boolean',
                'required': False,
                'description': 'Фильтр по доступности книги'
            }
        ],
        'responses': {
            '200': {'description': 'Список книг'}
        }
    })
    def get_books():
        title_filter = request.args.get('title', '')
        is_available = request.args.get('is_available', type=bool)

        query = Book.query
        if title_filter:
            query = query.filter(Book.title.ilike(f'%{title_filter}%'))
        if is_available is not None:
            query = query.filter(Book.is_available == is_available)

        books = query.all()
        return jsonify([
            {
                'id': book.book_id,
                'title': book.title,
                'description': book.description,
                'is_available': book.is_available,
                'user_id': book.user_id
            } for book in books
        ])

    @app.route('/api/books', methods=['POST'])
    @jwt_required()
    @swag_from({
        'tags': ['Books'],
        'summary': 'Добавить новую книгу',
        'security': [{'Bearer': []}],
        'parameters': [
            {
                'name': 'body',
                'in': 'body',
                'required': True,
                'schema': {
                    'type': 'object',
                    'properties': {
                        'title': {'type': 'string'},
                        'description': {'type': 'string'}
                    },
                    'required': ['title']
                }
            }
        ],
        'responses': {
            '201': {'description': 'Книга добавлена'},
            '401': {'description': 'Требуется авторизация'}
        }
    })
    def create_book():
        user_id = get_jwt_identity()
        data = request.get_json()
        new_book = Book(
            title=data.get('title'),
            description=data.get('description'),
            user_id=user_id,
            is_available=True
        )
        db.session.add(new_book)
        db.session.commit()
        return jsonify({'message': 'Книга добавлена'}), 201

    @app.route('/api/books/<int:book_id>', methods=['GET'])
    @swag_from({
        'tags': ['Books'],
        'summary': 'Получить информацию о книге по ID',
        'parameters': [
            {
                'name': 'book_id',
                'in': 'path',
                'type': 'integer',
                'required': True
            }
        ],
        'responses': {
            '200': {'description': 'Информация о книге'},
            '404': {'description': 'Книга не найдена'}
        }
    })
    def get_book(book_id):
        book = Book.query.get_or_404(book_id)
        return jsonify({
            'id': book.book_id,
            'title': book.title,
            'description': book.description,
            'is_available': book.is_available,
            'user_id': book.user_id
        })

    @app.route('/api/books/<int:book_id>', methods=['PUT'])
    @jwt_required()
    @swag_from({
        'tags': ['Books'],
        'summary': 'Обновить информацию о книге',
        'security': [{'Bearer': []}],
        'parameters': [
            {
                'name': 'book_id',
                'in': 'path',
                'type': 'integer',
                'required': True
            },
            {
                'name': 'body',
                'in': 'body',
                'required': True,
                'schema': {
                    'type': 'object',
                    'properties': {
                        'title': {'type': 'string'},
                        'description': {'type': 'string'},
                        'is_available': {'type': 'boolean'}
                    }
                }
            }
        ],
        'responses': {
            '200': {'description': 'Книга обновлена'},
            '404': {'description': 'Книга не найдена'}
        }
    })
    def update_book(book_id):
        user_id = get_jwt_identity()
        book = Book.query.get_or_404(book_id)
        if book.user_id != user_id:
            return jsonify({'message': 'Доступ запрещен'}), 403

        data = request.get_json()
        book.title = data.get('title', book.title)
        book.description = data.get('description', book.description)
        book.is_available = data.get('is_available', book.is_available)
        db.session.commit()
        return jsonify({'message': 'Книга обновлена'})

    @app.route('/api/books/<int:book_id>', methods=['DELETE'])
    @jwt_required()
    @swag_from({
        'tags': ['Books'],
        'summary': 'Удалить книгу',
        'security': [{'Bearer': []}],
        'parameters': [
            {
                'name': 'book_id',
                'in': 'path',
                'type': 'integer',
                'required': True
            }
        ],
        'responses': {
            '200': {'description': 'Книга удалена'},
            '404': {'description': 'Книга не найдена'}
        }
    })
    def delete_book(book_id):
        user_id = get_jwt_identity()
        book = Book.query.get_or_404(book_id)
        if book.user_id != user_id:
            return jsonify({'message': 'Доступ запрещен'}), 403

        db.session.delete(book)
        db.session.commit()
        return jsonify({'message': 'Книга удалена'})

    # === REVIEWS ===

    @app.route('/api/reviews', methods=['POST'])
    @jwt_required()
    @swag_from({
        'tags': ['Reviews'],
        'summary': 'Добавить отзыв на книгу',
        'security': [{'Bearer': []}],
        'parameters': [
            {
                'name': 'body',
                'in': 'body',
                'required': True,
                'schema': {
                    'type': 'object',
                    'properties': {
                        'book_id': {'type': 'integer'},
                        'review_text': {'type': 'string'}
                    },
                    'required': ['book_id', 'review_text']
                }
            }
        ],
        'responses': {
            '201': {'description': 'Отзыв добавлен'}
        }
    })
    def create_review():
        user_id = get_jwt_identity()
        data = request.get_json()
        new_review = Review(
            user_id=user_id,
            book_id=data.get('book_id'),
            review_text=data.get('review_text')
        )
        db.session.add(new_review)
        db.session.commit()
        return jsonify({'message': 'Отзыв добавлен'}), 201

    @app.route('/api/books/<int:book_id>/reviews', methods=['GET'])
    @swag_from({
        'tags': ['Reviews'],
        'summary': 'Получить отзывы о книге',
        'parameters': [
            {
                'name': 'book_id',
                'in': 'path',
                'type': 'integer',
                'required': True
            }
        ],
        'responses': {
            '200': {'description': 'Список отзывов'}
        }
    })
    def get_reviews(book_id):
        reviews = Review.query.filter_by(book_id=book_id).all()
        return jsonify([
            {
                'review_id': review.review_id,
                'user_id': review.user_id,
                'book_id': review.book_id,
                'review_text': review.review_text
            } for review in reviews
        ])

    # === DEALS ===

    @app.route('/api/deals', methods=['POST'])
    @jwt_required()
    @swag_from({
        'tags': ['Deals'],
        'summary': 'Создать запрос на обмен',
        'security': [{'Bearer': []}],
        'parameters': [
            {
                'name': 'body',
                'in': 'body',
                'required': True,
                'schema': {
                    'type': 'object',
                    'properties': {
                        'recipient_id': {'type': 'integer'},
                        'recipient_book_id': {'type': 'integer'},
                        'place': {'type': 'string'}
                    },
                    'required': ['recipient_id', 'recipient_book_id']
                }
            }
        ],
        'responses': {
            '201': {'description': 'Запрос на обмен создан'}
        }
    })
    def create_deal():
        user_id = get_jwt_identity()
        data = request.get_json()
        new_deal = Deal(
            sender_id=user_id,
            recipient_id=data.get('recipient_id'),
            recipient_book_id=data.get('recipient_book_id'),
            time=datetime.utcnow(),
            place=data.get('place'),
            status='Created'
        )
        db.session.add(new_deal)
        db.session.commit()
        return jsonify({'message': 'Запрос на обмен создан'}), 201

    @app.route('/api/deals/<int:deal_id>/accept', methods=['PUT'])
    @jwt_required()
    @swag_from({
        'tags': ['Deals'],
        'summary': 'Принять запрос на обмен',
        'security': [{'Bearer': []}],
        'parameters': [
            {
                'name': 'deal_id',
                'in': 'path',
                'type': 'integer',
                'required': True
            },
            {
                'name': 'body',
                'in': 'body',
                'required': True,
                'schema': {
                    'type': 'object',
                    'properties': {
                        'sender_book_id': {'type': 'int'},
                        'gift_flag': {'type': 'boolean'}
                    }
                }
            }
        ],
        'responses': {
            '200': {'description': 'Запрос принят'},
            '403': {'description': 'Доступ запрещен'}
        }
    })
    def accept_deal(deal_id):
        user_id = get_jwt_identity()
        deal = Deal.query.get_or_404(deal_id)
        if int(deal.recipient_id) != int(user_id):
            return jsonify({'message': 'Доступ запрещен'}), 403

        data = request.get_json()
        deal.sender_book_id = data.get('sender_book_id')
        deal.gift_flag = data.get('gift_flag')
        deal.status = 'Agreed'
        db.session.commit()
        return jsonify({'message': 'Запрос принят'})

    @app.route('/api/deals/<int:deal_id>/complete', methods=['PUT'])
    @jwt_required()
    @swag_from({
        'tags': ['Deals'],
        'summary': 'Завершить обмен',
        'security': [{'Bearer': []}],
        'parameters': [
            {
                'name': 'deal_id',
                'in': 'path',
                'type': 'integer',
                'required': True
            }
        ],
        'responses': {
            '200': {'description': 'Обмен завершен'},
            '403': {'description': 'Доступ запрещен'}
        }
    })
    def complete_deal(deal_id):
        user_id = get_jwt_identity()
        deal = Deal.query.get_or_404(deal_id)
        if deal.sender_id != user_id and deal.recipient_id != user_id:
            return jsonify({'message': 'Доступ запрещен'}), 403

        deal.status = 'Completed'
        # Обновляем доступность книг
        if deal.sender_book_id:
            sender_book = Book.query.get(deal.sender_book_id)
            sender_book.is_available = False
        recipient_book = Book.query.get(deal.recipient_book_id)
        recipient_book.is_available = False
        db.session.commit()
        return jsonify({'message': 'Обмен завершен'})

    @app.route('/api/deals/<int:deal_id>', methods=['DELETE'])
    @jwt_required()
    @swag_from({
        'tags': ['Deals'],
        'summary': 'Отменить сделку',
        'security': [{'Bearer': []}],
        'parameters': [
            {
                'name': 'deal_id',
                'in': 'path',
                'type': 'integer',
                'required': True
            }
        ],
        'responses': {
            '200': {'description': 'Сделка отменена'},
            '403': {'description': 'Доступ запрещен'},
            '404': {'description': 'Сделка не найдена'}
        }
    })
    def cancel_deal(deal_id):
        user_id = get_jwt_identity()
        deal = Deal.query.get_or_404(deal_id)
        if deal.sender_id != int(user_id) and deal.recipient_id != int(user_id):
            return jsonify({'message': 'Доступ запрещен'}), 403
        if deal.status != 'Created':
            return jsonify({'message': 'Можно отменить только сделку в статусе Created'}), 400

        db.session.delete(deal)
        db.session.commit()
        return jsonify({'message': 'Сделка отменена'})

    @app.route('/api/deals', methods=['GET'])
    @jwt_required()
    @swag_from({
        'tags': ['Deals'],
        'summary': 'Получить сделки пользователя',
        'security': [{'Bearer': []}],
        'parameters': [
            {
                'name': 'user_id',
                'in': 'query',
                'type': 'integer',
                'required': True,
                'description': 'ID пользователя для фильтрации сделок'
            }
        ],
        'responses': {
            '200': {'description': 'Список сделок'},
            '403': {'description': 'Доступ запрещен'}
        }
    })
    def get_user_deals():
        user_id = get_jwt_identity()
        requested_user_id = request.args.get('user_id', type=int)
        if int(user_id) != requested_user_id:
            return jsonify({'message': 'Доступ запрещен'}), 403

        deals = Deal.query.filter(
            (Deal.sender_id == requested_user_id) | (Deal.recipient_id == requested_user_id)).all()
        return jsonify([
            {
                'deal_id': deal.deal_id,
                'sender_id': deal.sender_id,
                'recipient_id': deal.recipient_id,
                'recipient_book_id': deal.recipient_book_id,
                'sender_book_id': deal.sender_book_id,
                'place': deal.place,
                'status': deal.status,
                'gift_flag': deal.gift_flag,
                'sender_contact': User.query.get(deal.sender_id).email or User.query.get(
                    deal.sender_id).phone if deal.status == 'Agreed' else None,
                'recipient_contact': User.query.get(deal.recipient_id).email or User.query.get(
                    deal.recipient_id).phone if deal.status == 'Agreed' else None
            } for deal in deals
        ])

    # === ADMIN ===

    @app.route('/api/admin/stats', methods=['GET'])
    @jwt_required()
    @swag_from({
        'tags': ['Admin'],
        'summary': 'Получить статистику (для админов)',
        'security': [{'Bearer': []}],
        'responses': {
            '200': {'description': 'Статистика'},
            '403': {'description': 'Доступ запрещен'}
        }
    })
    def admin_stats():
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user.is_admin:
            return jsonify({'message': 'Доступ запрещен'}), 403

        total_books = Book.query.count()
        total_deals = Deal.query.count()
        completed_deals = Deal.query.filter_by(status='Completed').count()

        return jsonify({
            'total_books': total_books,
            'total_deals': total_deals,
            'completed_deals': completed_deals
        })

    @app.route('/api/admin/promote/<int:user_id>', methods=['PUT'])
    @jwt_required()
    @swag_from({
        'tags': ['Admin'],
        'summary': 'Назначить роль админа пользователю',
        'security': [{'Bearer': []}],
        'parameters': [
            {
                'name': 'user_id',
                'in': 'path',
                'type': 'integer',
                'required': True,
                'description': 'ID пользователя'
            }
        ],
        'responses': {
            '200': {'description': 'Роль админа назначена'},
            '403': {'description': 'Доступ запрещен'}
        }
    })
    def promote_user(user_id):
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user or not current_user.is_admin:
            return jsonify({'message': 'Доступ запрещен'}), 403

        user = User.query.get_or_404(user_id)
        user.is_admin = True
        db.session.commit()
        return jsonify({'message': 'Роль админа назначена'})
