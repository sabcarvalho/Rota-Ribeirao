from app.models import db
from sqlalchemy.orm import sessionmaker, Session
from app.models import Usuario
from fastapi import Depends, HTTPException
from jose import jwt, JWTError
from app.main import SECRET_KEY, ALGORITHM, oauth2_schema

#funcao que gerencia as sessions ao banco de dados, garantindo o fechamento ao termino das rotas
def get_session():
    Session = sessionmaker(bind=db)
    session = Session()
    try:
        yield session
    finally:
        session.close()

#verificacao do token jwt de acesso enviado na requisicao
def verificar_token(token: str = Depends(oauth2_schema), session: Session = Depends(get_session)):
    try:
        dict_info = jwt.decode(token, SECRET_KEY, ALGORITHM)
        id_usuario = dict_info.get("sub") #id eh mapeado na chave sub

        usuario = session.query(Usuario).filter(Usuario.id == id_usuario).first()
        if not usuario or not usuario.ativo:
            raise HTTPException(status_code=401, detail={"code": "INVALID_ACCESS", "message": "Usuario inválido"})
        return usuario
    except JWTError:
        raise HTTPException(status_code=401, detail={"code": "TOKEN_EXPIRED", "message": "Acesso Negado, verifique a validade do token"})

#verificacao do token de refresh, nesse caso necessaria pois o refresh token é enviado no corpo da requisicao e nao segue o oauth2_schema
def verificar_refresh_token(token: str, session: Session = Depends(get_session)):
    try:
        dict_info = jwt.decode(token, SECRET_KEY, ALGORITHM)
        id_usuario = dict_info.get("sub")
        
        usuario = session.query(Usuario).filter(Usuario.id == id_usuario).first()
        if not usuario or not usuario.ativo:
            raise HTTPException(status_code=401, detail={"code": "INVALID_ACCESS", "message": "Usuario inválido"})
            
        return usuario
    except JWTError:
        raise HTTPException(status_code=401, detail={"code": "TOKEN_EXPIRED", "message": "Acesso Negado, verifique a validade do token"})