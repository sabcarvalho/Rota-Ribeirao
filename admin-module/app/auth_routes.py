from fastapi import APIRouter, Depends, HTTPException, Body, status
from app.models import Usuario
from sqlalchemy.orm import Session
from app.dependencies import get_session, verificar_token, verificar_refresh_token
from app.main import brcypt_context,SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.schemas import UsuarioSchema, LoginSchema, RefreshTokenSchema
from jose import jwt
from datetime import datetime, timedelta, timezone
from fastapi.security import OAuth2PasswordRequestForm

#todas as rotas desse arquivo terao o /auth
auth_router = APIRouter(
    prefix="/auth",
    tags=["autenticacao"]
)

#funcao de criacao de token jwt
def criar_token(usuario, duracao_token = timedelta(minutes = ACCESS_TOKEN_EXPIRE_MINUTES)):
    data_expiracao = datetime.now(timezone.utc) + duracao_token

    #informacoes q serao enviadas dentro do token
    dict_info = {
        "sub": str(usuario.id),
        "isAdmin":str(usuario.admin),
        "name":str(usuario.nome), 
        "email":str(usuario.email), 
        "exp": data_expiracao,
    }
    #encode do jwt com a chave secreta (variavel de ambiente)
    return jwt.encode(dict_info, SECRET_KEY, ALGORITHM)

def autenticar_usuario(email, senha, session):
    #no login, se recebe o email e senha
    usuario = session.query(Usuario).filter(Usuario.email == email).first() #confere email no banco
    if not usuario or not brcypt_context.verify(senha, usuario.senha): #confere a senha criptografada
        return False
    else:
        return usuario

@auth_router.post("/register", status_code=status.HTTP_201_CREATED)
async def criar_conta(usuario_schema: UsuarioSchema, session: Session = Depends(get_session)):
    """
    Essa é a rota de criação de contas. É necessário o envio do nome, email e senha. Retornam-se os tokens de acesso, refresh e os dados de usuario.

    Se tiver um usuario já cadastrado com esse email, lança-se erro 404
    """
    usuario = session.query(Usuario).filter(Usuario.email == usuario_schema.email).first()

    if usuario:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="E-mail do usuario ja cadastrado"
        )
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
        #cria-se os tokens jwt de acesso e o refresh
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
    """
    Essa é a rota de login. Espera-se a senha e o email. Retornam-se os tokens de acesso e refresh.

    Se o usuário informado não for encontrado, lança-se 404.
    """
    usuario = autenticar_usuario(login_schema.email, login_schema.password, session)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Usuario nao encontrado ou credenciais invalidas"
        )
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
    """
    Essa é a rota de login pelo form na página /docs da API. Retorna-se o token de acesso.

    Se o usuário informado não for encontrado, lança-se 404.
    """
    usuario = autenticar_usuario(dados_formulario.username, dados_formulario.password, session)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Usuario nao encontrado ou credenciais invalidas"
        )
    else:
        access_token = criar_token(usuario)
        return {
            "access_token": access_token,
            "token_type": "Bearer"
            }


@auth_router.post("/refresh")
async def use_refresh_token(r_token_schema: RefreshTokenSchema, session: Session = Depends(get_session)):
    """
    Essa é a rota de atualizaçao do token de acesso, ao acabar a validade deste. Primeiro, se confere se o refresh token enviado é válido.
    """
    usuario = verificar_refresh_token(r_token_schema.refresh_token, session)
    access_token = criar_token(usuario)
    return {
            "access_token": access_token,
            "token_type": "Bearer"
            }

@auth_router.post("/give_admin/{email}")
async def give_admin(email: str, admin: Usuario = Depends(verificar_token), session: Session = Depends(get_session)):
    """
    Essa é a rota de concessão de Administrador a um usuário pré-existente. O dono da requisição deve ser administrador.
    """
    if admin.admin:
        usuario = session.query(Usuario).filter(Usuario.email == email).first()
        if usuario:
            usuario.admin = True
            session.commit()
            return {
                    "detail": f"Usuario {usuario.id} tornado admin com sucesso"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Usuario nao encontrado"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores"
        )