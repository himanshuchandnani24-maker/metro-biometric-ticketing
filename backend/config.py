import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '161006')
    DB_NAME = os.getenv('DB_NAME', 'biometric_metro')
    SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret')
