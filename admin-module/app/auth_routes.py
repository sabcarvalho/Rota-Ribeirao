from fastapi import APIRouter, Depends, HTTPException, Body
from app.models import Usuario
from sqlalchemy.orm import Session
from app.dependencies import get_session, verificar_token, verificar_refresh_token
from app.main import brcypt_context,SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.schemas import UsuarioSchema, LoginSchema, RefreshTokenSchema
from jose import jwt
from datetime import datetime, timedelta, timezone
from fastapi.security import OAuth2PasswordRequestForm

auth_router = APIRouter(
    prefix="/auth",
    tags=["autenticacao"]
)
def criar_token(usuario, duracao_token = timedelta(minutes = ACCESS_TOKEN_EXPIRE_MINUTES)):
    data_expiracao = datetime.now(timezone.utc) + duracao_token
    dict_info = {
        "sub": str(usuario.id),
        "isAdmin":str(usuario.admin),
        "name":str(usuario.nome), 
        "email":str(usuario.email), 
        "exp": data_expiracao,
    }
    return jwt.encode(dict_info, SECRET_KEY, ALGORITHM)

def autenticar_usuario(email, senha, session):
    usuario = session.query(Usuario).filter(Usuario.email == email).first()
    if not usuario or not brcypt_context.verify(senha, usuario.senha):
        return False
    else:
        return usuario

@auth_router.post("/register")
async def criar_conta(usuario_schema: UsuarioSchema, session: Session = Depends(get_session)):
    usuario = session.query(Usuario).filter(Usuario.email == usuario_schema.email).first()

    if usuario:
        raise HTTPException(status_code=400, detail="E-mail do usuario ja cadastrado")
    else:
        senha_criptografada = brcypt_context.hash(usuario_schema.password)
        novo_usuario = Usuario(
            nome=usuario_schema.name,
            email=usuario_schema.email,
            senha=senha_criptografada,
            ativo=usuario_schema.active,
            admin=False
        )
        session.add(novo_usuario)
        session.commit()
        access_token = criar_token(novo_usuario)
        refresh_token = criar_token(novo_usuario, duracao_token= timedelta(days=7))
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "user":{
                "id": novo_usuario.id,
                "name": novo_usuario.nome,
                "email": novo_usuario.email,
                "isAdmin": novo_usuario.admin,
            }
            }

@auth_router.post("/login")
async def login(login_schema: LoginSchema, session: Session = Depends(get_session)):
    usuario = autenticar_usuario(login_schema.email, login_schema.password, session)
    if not usuario:
        raise HTTPException(status_code=400, detail="Usuario nao encontrado ou credenciais invalidas")
    else:
        access_token = criar_token(usuario)
        refresh_token = criar_token(usuario, duracao_token= timedelta(days=7))
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer"
            }

@auth_router.post("/login-form")
async def login_form(dados_formulario: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    usuario = autenticar_usuario(dados_formulario.username, dados_formulario.password, session)
    if not usuario:
        raise HTTPException(status_code=400, detail="Usuario nao encontrado ou credenciais invalidas")
    else:
        access_token = criar_token(usuario)
        return {
            "access_token": access_token,
            "token_type": "Bearer"
            }


@auth_router.post("/refresh")
async def use_refresh_token(r_token_schema: RefreshTokenSchema, session: Session = Depends(get_session)):
    usuario = verificar_refresh_token(r_token_schema.refresh_token, session)
    access_token = criar_token(usuario)
    return {
            "access_token": access_token,
            "token_type": "Bearer"
            }

@auth_router.post("/give_admin/{email}")
async def give_admin(email: str, admin: Usuario = Depends(verificar_token), session: Session = Depends(get_session)):
    if admin.admin:
        usuario = session.query(Usuario).filter(Usuario.email == email).first()
        if usuario:
            usuario.admin = True
            session.commit()
            return {
                    "detail": f"Usuario {usuario.id} tornado admin com sucesso"
            }
        else:
            raise HTTPException(status_code=400, detail="Usuario nao encontrado")
    else:
        raise HTTPException(status_code=403,detail="Apenas administradores" )