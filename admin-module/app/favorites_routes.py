from fastapi import APIRouter, Depends, HTTPException, status
from app.models import Favorito, Usuario
from sqlalchemy.orm import Session
from app.dependencies import get_session, verificar_token
from app.main import PLACES_SERVICE_URL
import requests

#todas as rotas desse arquivo terao o /places
favorites_router = APIRouter(
    prefix="/favorites",
    tags=["favoritos"]
)

@favorites_router.get("")
async def get_all_favorits(usuario: Usuario = Depends(verificar_token), session: Session = Depends(get_session)):
    """
    Essa rota retorna todos os favoritos (id do favorito e id do local) de um dado usuário logado. 

    Retorna 401 se não logado/token expirado
    """
    favoritos = session.query(Favorito).filter(Favorito.id_usuario == usuario.id).all()
    resultado = []
    if favoritos:
        for favorito in favoritos:
            resultado.append({
                "place_id": favorito.id_lugar
            })
    return resultado

@favorites_router.post("/{id_lugar}", status_code=status.HTTP_201_CREATED)
def favorite_place(id_lugar: int, usuario: Usuario = Depends(verificar_token), session: Session = Depends(get_session)):
    """
    Essa rota adiciona um favorito na tabela Favorito de um dado usuário logado, recebendo o id do local sendo favoritado.

    Retorna 401 se não logado/token expirado
    """
    try:
        #confirma se o local existe na API do Serviço de Lugares
        response = requests.get(f"{PLACES_SERVICE_URL}/places?ids={id_lugar}")
    except requests.exceptions.RequestException:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, 
            detail="Não foi possível validar o lugar com o serviço externo neste momento."
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Lugar não encontrado na base de dados."
        )
    elif response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Erro ao validar o lugar."
        )

    #verifica se o usuario ja tinha favoritado o lugar
    buscar_fav = session.query(Favorito).filter(
        Favorito.id_lugar == id_lugar, 
        Favorito.id_usuario == usuario.id
    ).first()
    
    if buscar_fav:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="Favorito já adicionado anteriormente."
        )

    novo_favorito = Favorito(usuario.id, id_lugar) 
    session.add(novo_favorito)
    session.commit()
    return {"detail": "Favorito adicionado com sucesso."}
    

@favorites_router.delete("/{id_lugar}")
async def delete_favorite_place(id_lugar: int, usuario: Usuario = Depends(verificar_token), session: Session = Depends(get_session)):
    """
    Essa rota deleta um Favorito de um dado usuário logado, referente ao id do local passado.

    Retorna 401 se não logado/token expirado.
    """
    favorito = session.query(Favorito).filter(
        Favorito.id_lugar == id_lugar, 
        Favorito.id_usuario == usuario.id
    ).first()

    if not favorito:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Este lugar não está na sua lista de favoritos."
        )

    session.delete(favorito)
    session.commit()
    return {"detail": "Lugar removido dos favoritos"}

@favorites_router.delete("/place/{id_lugar}")
async def delete_favorite_place_all(id_lugar: int, usuario: Usuario = Depends(verificar_token), session: Session = Depends(get_session)):
    """
    Essa rota deleta todos os favoritos vinculados ao id do local passado. Apenas realizada por administradores.

    Retorna 401 se não logado/token expirado.
    """
    if usuario.admin:
        try:
            linhas_deletadas = session.query(Favorito).filter(Favorito.id_lugar == id_lugar).delete()
        
            session.commit()
            
            return {
                "detail": f"Limpeza concluída. {linhas_deletadas} favoritos removidos.",
                "linhas_afetadas": list, "linhas_afetadas": linhas_deletadas
            }
        except Exception as e:
            session.rollback() #rollback se algo acontecer
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=f"Erro interno no banco de dados: {str(e)}"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Apenas administradores podem realizar esta operação"
        )

@favorites_router.delete("/user/{id_user}")
async def delete_favorite_user(id_user: int, usuario: Usuario = Depends(verificar_token), session: Session = Depends(get_session)):
    """
    Essa rota deleta todos os favoritos vinculados ao id do usuario passado. Apenas realizada por administradores.

    Retorna 401 se não logado/token expirado.
    """
    
    if usuario.id != id_user and not usuario.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Você não tem permissão para remover os favoritos de outro usuário"
        )

    try:
        linhas_deletadas = session.query(Favorito).filter(Favorito.id_usuario == id_user).delete()

        session.commit()
        
        return {
            "detail": f"Limpeza concluída. {linhas_deletadas} favoritos removidos.",
            "linhas_afetadas": list, "linhas_afetadas": linhas_deletadas
        }
    except Exception as e:
        session.rollback() #rollback se algo acontecer
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Erro interno no banco de dados: {str(e)}"
        )