import json

from ..app import create_app
from ..app.database import db
from ..app.models import User, Book

class TestAPI:
    def setup_method(self):
        # Создаём приложение Flask
        self.app = create_app()
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@db/book_exchange_test'
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        self.client = self.app.test_client()
        # Инициализируем базу данных
        with self.app.app_context():
            db.create_all()

    def teardown_method(self):
        # Очищаем базу данных после каждого теста
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_register_user(self):
        # Тест регистрации нового пользователя
        response = self.client.post('/api/register', json={
            'username': 'testuser1',
            'email': 'test1@example.com',
            'phone': '123456789',
            'password': 'password123'
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data['message'] == 'Пользователь зарегистрирован'
        with self.app.app_context():
            user = User.query.filter_by(username='testuser1').first()
            assert user is not None
            assert not user.is_admin

    def test_login_user(self):
        # Сначала регистрируем пользователя
        self.client.post('/api/register', json={
            'username': 'testuser2',
            'email': 'test2@example.com',
            'phone': '987654321',
            'password': 'password123'
        })
        # Тест логина
        response = self.client.post('/api/login', json={
            'username': 'testuser2',
            'password': 'password123'
        })
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'access_token' in data

    def test_create_book(self):
        # Регистрируем и авторизуем пользователя
        self.client.post('/api/register', json={
            'username': 'testuser3',
            'email': 'test3@example.com',
            'phone': '555555555',
            'password': 'password123'
        })
        login_response = self.client.post('/api/login', json={
            'username': 'testuser3',
            'password': 'password123'
        })
        token = json.loads(login_response.data)['access_token']

        # Тест добавления книги
        response = self.client.post('/api/books', json={
            'title': 'Test Book',
            'description': 'A test book'
        }, headers={'Authorization': f'Bearer {token}'})
        assert response.status_code == 201
        data = response.get_json()
        assert data['message'] == 'Книга добавлена'
        with self.app.app_context():
            book = Book.query.filter_by(title='Test Book').first()
            assert book is not None
            assert book.is_available

    def test_get_books(self):
        # Регистрируем пользователя и добавляем книгу
        self.client.post('/api/register', json={
            'username': 'testuser4',
            'email': 'test4@example.com',
            'phone': '444444444',
            'password': 'password123'
        })
        login_response = self.client.post('/api/login', json={
            'username': 'testuser4',
            'password': 'password123'
        })
        token = json.loads(login_response.data)['access_token']
        self.client.post('/api/books', json={
            'title': 'Another Test Book',
            'description': 'Another test'
        }, headers={'Authorization': f'Bearer {token}'})

        # Тест получения списка книг
        response = self.client.get('/api/books')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) > 0
        assert any(book['title'] == 'Another Test Book' for book in data)