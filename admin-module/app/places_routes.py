from fastapi import APIRouter, Depends, HTTPException, status
from app.models import Favorito, Usuario
from sqlalchemy.orm import Session
from app.dependencies import get_session, verificar_token
from app.main import PLACES_SERVICE_URL
import requests

places_router = APIRouter(
    prefix="/places",
    tags=["lugares"]
)

@places_router.get("/favoritos")
async def get_all_favorits(usuario: Usuario = Depends(verificar_token), session: Session = Depends(get_session)):
    favoritos = session.query(Favorito).filter(Favorito.id_usuario == usuario.id).all()
    resultado = []
    if favoritos:
        for favorito in favoritos:
            resultado.append({
                'id': favorito.id,
                "id_lugar": favorito.id_lugar
            })
    return resultado

@places_router.post("/favoritar/{id_lugar}")
def favorite_place(id_lugar: int, usuario: Usuario = Depends(verificar_token), session: Session = Depends(get_session)):
    response = requests.get(f"{PLACES_SERVICE_URL}search_place/?ids={id_lugar}")
    if response.status_code == 200:
        dados = response.json()
        favorito = Favorito(usuario.id, dados[0]["id"])
        session.add(favorito)
        session.commit()
        return {
            "id": favorito.id,
            "mensagem": "Favorito adicionado com sucesso."
        }
    elif response.status_code == status.HTTP_404_NOT_FOUND:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Lugar não encontrado na base de dados"
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Não foi possível validar o lugar neste momento"
        )
    
@places_router.delete("/delete_favorite/{id_favorito}") 
async def delete_favorite(id_favorito: int, usuario: Usuario = Depends(verificar_token), session: Session = Depends(get_session)):
    favorito = session.query(Favorito).filter(
        Favorito.id == id_favorito, 
        Favorito.id_usuario == usuario.id
    ).first()

    if not favorito:
        raise HTTPException(status_code=404, detail="Favorito não encontrado")

    session.delete(favorito)
    session.commit()
    return {"mensagem": "Favorito removido"}

@places_router.delete("/delete_favorite/place/{id_lugar}")
async def delete_favorite_place(id_lugar: int, usuario: Usuario = Depends(verificar_token), session: Session = Depends(get_session)):
    session.query(Favorito).filter(
        Favorito.id_lugar == id_lugar, 
        Favorito.id_usuario == usuario.id
    ).delete()
    
    session.commit()
    return {"mensagem": "Lugar removido dos favoritos"}

@places_router.delete("/delete_favorite/place/all/{id_lugar}")
async def delete_favorite_place(id_lugar: int, usuario: Usuario = Depends(verificar_token), session: Session = Depends(get_session)):
    if usuario.admin:
        session.query(Favorito).filter(
            Favorito.id_lugar == id_lugar, 
        ).delete()
        session.commit()
        return {"mensagem": "Todos os favoritos em {id_lugar} foram removidos da tabela favoritos"}
    else:
        raise HTTPException(status_code=403,detail="Apenas administradores" )

@places_router.delete("/delete_favorite/user/{id_user}")
async def delete_favorite_user(id_user: int, usuario: Usuario = Depends(verificar_token), session: Session = Depends(get_session)):
    if usuario.id != id_user and not usuario.admin:
        raise HTTPException(status_code=403, detail="Acesso negado")

    session.query(Favorito).filter(Favorito.id_usuario == id_user).delete()
    session.commit()
    return {"mensagem": f"Todos os favoritos do usuário {id_user} foram removidos"}