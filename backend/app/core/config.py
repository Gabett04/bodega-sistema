import os
import json
from dotenv import load_dotenv

load_dotenv()

class Settings:
    APP_NAME = os.getenv("APP_NAME", "Sistema de Inventario")
    APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    SECRET_KEY = os.getenv("SECRET_KEY", "default-secret")
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./inventario.db")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
    
    try:
        CORS_ORIGINS = json.loads(os.getenv("CORS_ORIGINS", '["http://localhost:5173"]'))
    except:
        CORS_ORIGINS = ["*"]

settings = Settings()