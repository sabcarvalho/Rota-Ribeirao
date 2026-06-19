from models import db, Lugar
from sqlalchemy.orm import sessionmaker

def seed_lugares():
    Session = sessionmaker(autocommit=False,autoflush=False,bind=db)
    session = Session()
    try:
        lugares = [
            Lugar(
                nome="Theatro Pedro II",
                rua="Rua Álvares Cabral",
                numero_rua="370",
                bairro="Centro",
                cep="14010-080",
                categoria="Teatro",
                tags="familia,encontro,amigos",
                preco=0,
                nota=4.8,
                descricao="Um dos maiores teatros de ópera do Brasil.",
                tipo="fixo",
                image_url="https://abrale.org.br/wp-content/uploads/2024/06/theatro_pedro_ii_laranja_-_fernando_gonzaga.jpg"
            ),
            Lugar(
                nome="Palacete 1922",
                rua="R. Álvares Cabral",
                numero_rua="716",
                bairro="Centro",
                cep="14010-080",
                categoria="Restaurante",
                tags="familia,encontro,amigos,comemoracao",
                preco=3,
                nota=4.7,
                descricao="O Palacete 1922 foi a residência do engenheiro Jorge Lobato Marcondes Machado e de sua esposa, Anna, filha do fazendeiro Joaquim da Cunha Diniz Junqueira. De estilo neocolonial, o Palacete representa a identidade da arquitetura brasileira numa época em que Ribeirão Preto chegou a ser a maior exportadora de café no mundo.",
                tipo="fixo",
                image_url="https://media.revide.com.br/upload/ckeditor/2023/03/02/palacete.jpg"
            )
        ]

        session.add_all(lugares)
        session.commit()

        print("Seed executado com sucesso!")

    except Exception as e:
        session.rollback()
        print(f"Erro: {e}")

    finally:
        session.close()

if __name__ == "__main__":
    seed_lugares()