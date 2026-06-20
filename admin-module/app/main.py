from fastapi import FastAPI
from passlib.context import CryptContext
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
import os
from pathlib import Path

app = FastAPI()

#definicao do caminho das variaveis de ambiente quando se roda localmente
env_path = Path(__file__).resolve().parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv() #quando rodado em docker, vem automaticamente pelo .env da pasta raiz

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES= int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

FRONTEND_ORIGIN = os.getenv("FRONT_END_URL", "http://localhost:3000")
PLACES_SERVICE_URL = os.getenv("PLACES_SERVICE_URL")

#configurando o CORS para apenas aceitar o frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#definindo as variaveis de criptografia e verificacao do token
brcypt_context = CryptContext(schemes = ["argon2"], deprecated = "auto")
oauth2_schema = OAuth2PasswordBearer(tokenUrl="auth/login-form")


from app.auth_routes import auth_router
from app.favorites_routes import favorites_router

#inclui-se dois tipos de rota (auth e places)
app.include_router(auth_router) #autenticacao
app.include_router(favorites_router) #obtencao de favoritos e robo do webscrapping
