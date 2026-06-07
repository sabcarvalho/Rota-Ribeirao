from app.models import db
from sqlalchemy.orm import sessionmaker
from fastapi import Depends, HTTPException
from jose import jwt, JWTError
from app.main import SECRET_KEY, ALGORITHM, oauth2_schema

def get_session():
    Session = sessionmaker(autocommit=False,autoflush=False,bind=db)
    session = Session()
    try:
        yield session
    finally:
        session.close()

def verificar_token(token: str = Depends(oauth2_schema)):
    try:
        payload = jwt.decode(token, SECRET_KEY,algorithms=[ALGORITHM])
        return payload

    except JWTError:
        raise HTTPException(status_code=401,detail={"code": "TOKEN_EXPIRED", "message": "Acesso Negado, verifique a validade do token"})

def verificar_admin(payload: dict = Depends(verificar_token)):
    if not payload.get("isAdmin", False):
        raise HTTPException(status_code=403,detail="Apenas administradores" )

    return payload