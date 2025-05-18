from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from .database import db
from .routes import init_routes
from flask_jwt_extended import JWTManager
from flasgger import Swagger
from flask_cors import CORS

jwt = JWTManager()


def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    CORS(app)

    jwt.init_app(app)

    db.init_app(app)

    # Настройка Swagger
    app.config['SWAGGER'] = {
        'title': 'Book Exchange API',
        'uiversion': 3
    }
    Swagger(app)

    init_routes(app)

    with app.app_context():
        db.create_all()

    return app