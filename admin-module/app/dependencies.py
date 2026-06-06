from app.models import db
from sqlalchemy.orm import sessionmaker, Session
from app.models import Usuario
from fastapi import Depends, HTTPException
from jose import jwt, JWTError
from app.main import SECRET_KEY, ALGORITHM, oauth2_schema

def get_session():
    Session = sessionmaker(bind=db)
    session = Session()
    try:
        yield session
    finally:
        session.close()

def verificar_token(token: str = Depends(oauth2_schema), session: Session = Depends(get_session)):
    try:
        dict_info = jwt.decode(token, SECRET_KEY, ALGORITHM)
        id_usuario = dict_info.get("sub")
        usuario = session.query(Usuario).filter(Usuario.id == id_usuario).first()
        if not usuario:
            raise HTTPException(status_code=401, detail="Acesso Invalido")
        return usuario
    except JWTError:
        raise HTTPException(status_code=401, detail="Acesso Negado, verifique a validade do token")
