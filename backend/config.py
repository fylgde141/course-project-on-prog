

class Config:

    SQLALCHEMY_DATABASE_URI = 'postgresql://user:password@db:5432/book_exchange'

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = 'super-secret-key'