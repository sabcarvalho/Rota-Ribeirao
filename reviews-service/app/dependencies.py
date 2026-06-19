from app.models import db
from sqlalchemy.orm import sessionmaker, Session
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
oauth2_schema = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_session():
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def verificar_token(token: str = Depends(oauth2_schema)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if not payload.get("sub"):
            raise HTTPException(status_code=401, detail="Token JWT não contém identificação de usuário")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Acesso Negado, verifique a validade do token")