from fastapi import APIRouter, Depends, HTTPException, status
from app.models import Favorito, Usuario
from sqlalchemy.orm import Session
from app.dependencies import get_session, verificar_token
from app.main import PLACES_SERVICE_URL
import requests

#todas as rotas desse arquivo terao o /places
places_router = APIRouter(
    prefix="/places",
    tags=["lugares"]
)

@places_router.get("/favorites")
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
                'id': favorito.id,
                "place_id": favorito.id_lugar
            })
    return resultado

@places_router.post("/add_favorite/{id_lugar}")
def favorite_place(id_lugar: int, usuario: Usuario = Depends(verificar_token), session: Session = Depends(get_session)):
    """
    Essa rota adiciona um favorito na tabela Favorito de um dado usuário logado, recebendo o id do local sendo favoritado.

    Retorna 401 se não logado/token expirado
    """

    #confirma se o local existe na API do Serviço de Lugares
    response = requests.get(f"{PLACES_SERVICE_URL}search_place/?ids={id_lugar}")

    if response.status_code == 200: #se existe
        dados = response.json() 
        buscar_fav = session.query(Favorito).filter(
            Favorito.id_lugar == id_lugar, 
            Favorito.id_usuario == usuario.id
        )
        if buscar_fav:
            return {
                "id": buscar_fav.id,
                "detail": "Favorito já adicionado."
            }
        else:
            favorito = Favorito(usuario.id, dados[0]["id"]) 
            session.add(favorito)
            session.commit()
            return {
                "id": favorito.id,
                "detail": "Favorito adicionado com sucesso."
            }
    elif response.status_code == 404:
        raise HTTPException(status_code=404, detail="Lugar não encontrado na base de dados")
    else:
        raise HTTPException(status_code=404, detail="Não foi possível validar o lugar neste momento")
    
@places_router.delete("/delete_favorite/{id_favorito}") 
async def delete_favorite(id_favorito: int, usuario: Usuario = Depends(verificar_token), session: Session = Depends(get_session)):
    """
    Essa rota deleta um Favorito de um dado usuário logado, referente ao id do Favorito passado.

    Retorna 401 se não logado/token expirado.
    """
    session.query(Favorito).filter(
        Favorito.id == id_favorito
    ).delete()

    session.commit()
    return {"detail": "Favorito removido"}

@places_router.delete("/delete_favorite/place/{id_lugar}")
async def delete_favorite_place(id_lugar: int, usuario: Usuario = Depends(verificar_token), session: Session = Depends(get_session)):
    """
    Essa rota deleta um Favorito de um dado usuário logado, referente ao id do local passado.

    Retorna 401 se não logado/token expirado.
    """
    session.query(Favorito).filter(
        Favorito.id_lugar == id_lugar, 
        Favorito.id_usuario == usuario.id
    ).delete()
    
    session.commit()
    return {"detail": "Lugar removido dos favoritos"}

@places_router.delete("/delete_favorite/place/all/{id_lugar}")
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
            session.rollback()#rollback se algo acontecer
            raise HTTPException(status_code=500, detail=f"Erro interno ao tentar deletar no banco local: {str(e)}")
    else:
        raise HTTPException(status_code=403,detail="Apenas administradores" )

@places_router.delete("/delete_favorite/user/{id_user}")
async def delete_favorite_user(id_user: int, usuario: Usuario = Depends(verificar_token), session: Session = Depends(get_session)):
    """
    Essa rota deleta todos os favoritos vinculados ao id do usuario passado. Apenas realizada por administradores.

    Retorna 401 se não logado/token expirado.
    """
    
    if usuario.id != id_user and not usuario.admin:
        raise HTTPException(status_code=403, detail="Acesso negado")

    try:
        linhas_deletadas = session.query(Favorito).filter(Favorito.id_usuario == id_user).delete()

        session.commit()
        
        return {
            "detail": f"Limpeza concluída. {linhas_deletadas} favoritos removidos.",
            "linhas_afetadas": list, "linhas_afetadas": linhas_deletadas
        }
    except Exception as e:
        session.rollback()#rollback se algo acontecer
        raise HTTPException(status_code=500, detail=f"Erro interno ao tentar deletar no banco local: {str(e)}")