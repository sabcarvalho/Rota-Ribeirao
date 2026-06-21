import time
import requests
from ddgs import DDGS
import logging
from app.main import PLACES_SERVICE_URL

#log da procura: terminal da api 
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')


class SearchPlacesOverpass:
    def __init__(self, categoria_schema, admin_token):
        self.api_url = PLACES_SERVICE_URL
        self.admin_token = admin_token
        self.img_default = ""
        self.categoria_schema = categoria_schema
        
        #mapeamento das tags do OverPass e setup de imagens padroes caso nao encontre imagens para os lugares
        if categoria_schema == "bar":
            self.amenity = "bar|pub|nightclub"
            self.img_default = "https://images.unsplash.com/photo-1597290282695-edc43d0e7129?q=80&w=1175&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        elif categoria_schema == "restaurante":
            self.amenity = "restaurant|ice_cream"
            self.img_default = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        elif categoria_schema == "cafe":
            self.amenity = "cafe"
            self.img_default = "https://images.unsplash.com/photo-1521017432531-fbd92d768814?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        elif categoria_schema == "mercado":
            self.amenity = "marketplace"
            self.img_default = "https://images.unsplash.com/photo-1501523460185-2aa5d2a0f981?q=80&w=1531&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        else:
            raise ValueError("Tipo nao encontrado. Tipos esperados: bar, restaurante, cafe e mercado")
        
        #mapeamento das possiveis tags do OverPass para a atribuicao de uma tag (ocasiao) correta
        self.heuristic_rules = {
            "familia": {
                "amenity": ["ice_cream", "toy_library", "theme_park"],
                "leisure": ["park", "playground", "water_park"],
                "cuisine": ["pizza", "ice_cream", "burger", "buffet"]
            },
            "comemoracao": {
                "amenity": ["nightclub", "events_venue", "casino"],
                "cuisine": ["steakhouse", "japanese", "seafood", "fine_dining"]
            },
            "amigos": {
                "amenity": ["bar", "pub", "nightclub", "biergarten", "fast_food"],
                "leisure": ["sports_centre", "bowling_alley", "stadium"],
                "cuisine": ["burger", "pizza", "barbecue", "snack"]
            },
            "encontro": {
                "amenity": ["cafe", "theatre", "cinema", "arts_centre"],
                "tourism": ["museum", "gallery", "viewpoint"],
                "cuisine": ["italian", "bistro", "sushi", "japanese", "fondue", "coffee_shop"]
            }
        }

    def classify_by_tags(self, tags: dict) -> str:
        occasions = set()
        
        amenity = tags.get("amenity", "").lower()
        leisure = tags.get("leisure", "").lower()
        cuisine = tags.get("cuisine", "").lower()
        tourism = tags.get("tourism", "").lower()

        for occasion, rules in self.heuristic_rules.items(): 
            #procurando pelas tags retornadas para ver o encaixe nas ocasioes (familia, comemoracao, amigos e encontro)
            if amenity in rules.get("amenity", []): occasions.add(occasion)
            if leisure in rules.get("leisure", []): occasions.add(occasion)
            if tourism in rules.get("tourism", []): occasions.add(occasion)
                
            for c in rules.get("cuisine", []):
                if c in cuisine:
                    occasions.add(occasion)

        #se nao encontrou nada nas tags, definir tags genericas
        if not occasions:
            if amenity in ["restaurant", "food_court"]:
                occasions.update(["familia", "amigos"])
            elif amenity in ["bar", "pub"]:
                occasions.update(["amigos", "encontro"])
            else:
                occasions.add("amigos")

        return ",".join(occasions)

    def _buscar_endereco(self, lat: float, lon: float, headers: dict) -> dict:
        endereco = {
            "rua": "Rua não encontrada",
            "numero": "N/A",
            "bairro": "Bairro não encontrado",
            "cep": "00000-000"
        }
        
        #procurando informacoes de rua, numero, bairro e cep pelo Nominatim
        url_nominatim = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
        time.sleep(2) #dando timeout para nao ser bloqueado pela api do nominatim
        
        try:
            r_geo = requests.get(url_nominatim, headers=headers)
            if r_geo.status_code == 200:
                dados_geo = r_geo.json().get('address', {})
                endereco["rua"] = dados_geo.get('road', 'Rua não encontrada')
                endereco["numero"] = dados_geo.get('house_number', 'N/A')
                endereco["bairro"] = dados_geo.get('suburb', 'Bairro não encontrado')
                
                #buscando o cep da rua encontrada
                rua_formatada = endereco["rua"].replace(" ", "+")
                url_viacep = f"https://viacep.com.br/ws/SP/Ribeirao%20Preto/{rua_formatada}/json/"
                r_viacep = requests.get(url_viacep)
                
                if r_viacep.status_code == 200:
                    dados_cep = r_viacep.json()
                    if isinstance(dados_cep, list) and len(dados_cep) > 0:
                        endereco["cep"] = dados_cep[0].get("cep", "00000-000")
                    elif isinstance(dados_cep, dict) and not dados_cep.get("erro"):
                        endereco["cep"] = dados_cep.get("cep", "00000-000")
        except Exception as e:
            logging.error(f"Erro ao buscar endereço: {e}")
            
        return endereco

    def _buscar_imagem(self, nome: str) -> str: 
        nome_formatado = nome.replace(" ", "+")
        query = f"{nome_formatado}+ribeirao+preto+{self.categoria_schema}+fachada+estabelecimento"
        
        try:  #procurando imagens no motor de busca DuckDuckGo
            resultados = list(DDGS().images(
                query=query, 
                region="br-br",
                type_image="photo", 
                max_results=1, 
                safesearch="on", 
                size="Large"
            ))
            if resultados:
                return resultados[0].get("image", self.img_default)
        except Exception as e:
            logging.warning(f"Não foi possível obter imagem para {nome}: {e}")

        return self.img_default
    
    def enviar_para_api(self, lugar_data: dict):
        headers = {#header de autenticacao
            "Authorization": f"{self.admin_token}",
            "Content-Type": "application/json"
        }
        
        try:
            resposta = requests.post(f"{self.api_url}/places", json=lugar_data, headers=headers)
            if resposta.status_code == 201: #codigo de criacao -> deu tudo certo
                logging.info(f"{lugar_data['name']} salvo com sucesso no banco!")
            else:
                logging.error(f"Erro ao salvar {lugar_data['name']}: {resposta.status_code} - {resposta.text}")
        except Exception as e:
            logging.error(f"Erro de conexão com a API: {e}")

    def search(self):
        #pesquisando lugares, dada o tipo (com os amenities) e as coordenadas no centro de ribeirao
        query = f'[out:json];(nwr["amenity"~"{self.amenity}"](around:5000,-21.1767,-47.8208););out center;'
        headers_overpass = { #como a api eh publica, eh preciso identificacao para nao ser bloqueado
            "User-Agent": "RotaRibeiraoBot/1.0 (sabrinascarvalho@usp.br)"
        }
        
        logging.info(f"Iniciando busca por {self.categoria_schema} em Ribeirão Preto...")
        
        try:
            r = requests.post(
                "https://overpass-api.de/api/interpreter",
                data={'data': query}, 
                headers=headers_overpass
            )
            
            if r.status_code != 200:
                logging.error(f"Erro na API Overpass. Status: {r.status_code}")
                return
                
            resultados = r.json().get('elements', [])
            logging.info(f"Encontrados {len(resultados)} possíveis locais.")
            
            for resultado in resultados:
                tags = resultado.get('tags', {})
                nome = tags.get('name')
                #se o local nao tem nome, passa pro proximo
                if not nome:
                    continue

                #descricao generica 
                descricao = f"Um excelente local da categoria {self.categoria_schema} em Ribeirão Preto! "
                ocasioes = self.classify_by_tags(tags) #busca pelas tags dadas as categorias vindas da api
                
                #acrescentando na descricao detalhes vindos da api
                cuisine = tags.get("cuisine")
                if cuisine: descricao += f"Especialidade: {cuisine}. "
                if tags.get("wheelchair") in ["yes", "limited"]: descricao += "Com acessibilidade. "
                if tags.get("phone"): descricao += f"Telefone: {tags.get('phone')}. "
                if tags.get("website"): descricao += f"Site: {tags.get('website')}. "

                #coordenadas do local
                lat = resultado.get('lat') or resultado.get("center", {}).get("lat", "")
                lon = resultado.get('lon') or resultado.get("center", {}).get("lon", "")

                if not lat or not lon: #apenas locais com coordenadas
                    continue
                
                endereco = self._buscar_endereco(lat, lon, headers_overpass)
                
                imagem = self._buscar_imagem(nome)

                payload = {
                    "name": nome,
                    "street": endereco["rua"],
                    "number": endereco["numero"],
                    "district": endereco["bairro"],
                    "cep": endereco["cep"],
                    "category": self.categoria_schema,
                    "occasion": ocasioes,
                    "priceLevel": 1, #padrao para lugares novos
                    "rating": 0.0,   #sem avaliações no inicio
                    "description": descricao.strip(),
                    "type": "fixo",
                    "image": imagem,
                    "status": "pendente",
                }

                self.enviar_para_api(payload)
                
        except requests.exceptions.RequestException as e:
            logging.error(f"Erro de conexão geral: {e}")

if __name__ == "__main__":
    TOKEN_ADMIN = ""
    
    robo = SearchPlacesOverpass(
        categoria_schema="cafe", 
        admin_token=TOKEN_ADMIN
    )
    
    robo.search()