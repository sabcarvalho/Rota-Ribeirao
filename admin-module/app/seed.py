from app.models import db, Usuario
from app.main import brcypt_context
from sqlalchemy.orm import sessionmaker

def seed_users():
    Session = sessionmaker(autocommit=False,autoflush=False,bind=db)
    session = Session()
    try:
        senha_criptografada = brcypt_context.hash("123456")
        usuario = Usuario(nome="admin",
                          email="admin@rota.com",
                          senha=senha_criptografada,
                          ativo=True,
                          admin=True)

        session.add(usuario)
        session.commit()

        print("Seed executado com sucesso!")

    except Exception as e:
        session.rollback()
        print(f"Erro: {e}")

    finally:
        session.close()

if __name__ == "__main__":
    seed_users()