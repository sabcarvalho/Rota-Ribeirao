import time
import requests
from ddgs import DDGS


class SearchPlacesOverpass():
    def __init__(self, type_search):
        self.type_search = type_search
        if type_search == "bar":
            self.amenity = "bar|pub|nightclub"
        elif type_search == "restaurante":
            self.amenity = "restaurant|ice_cream"
        elif type_search == "cafe":
            self.amenity = "cafe"
        elif type_search == "mercado":
            self.amenity = "marketplace"
        else:
            raise Exception("Tipo nao encontrado. Tipos esperados: bar, restaurante, cafe e mercado")
        
        self.heuristic_rules = {
            "família": {
                "amenity": ["ice_cream", "toy_library", "theme_park"],
                "leisure": ["park", "playground", "water_park"],
                "cuisine": ["pizza", "ice_cream", "burger", "buffet"]
            },
            "comemoração": {
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
    def classify_by_tags(self, tags: dict) -> list:
        occasions = set()
        
        amenity = tags.get("amenity", "").lower()
        leisure = tags.get("leisure", "").lower()
        cuisine = tags.get("cuisine", "").lower()
        tourism = tags.get("tourism", "").lower()

        for occasion, rules in self.heuristic_rules.items():
            if amenity in rules.get("amenity", []):
                occasions.add(occasion)
            if leisure in rules.get("leisure", []):
                occasions.add(occasion)
            if tourism in rules.get("tourism", []):
                occasions.add(occasion)
                
            for c in rules.get("cuisine", []):
                if c in cuisine:
                    occasions.add(occasion)

        #se não cair em nada:
        if not occasions:
            if amenity in ["restaurant", "food_court"]:
                #restaurantes geralmente servem para família e amigos
                occasions.update(["família", "amigos"])
            elif amenity in ["bar", "pub"]:
                #bares servem para amigos e encontros
                occasions.update(["amigos", "encontro"])
            else:
                #se nao tiver nenhuma tag util
                occasions.add("amigos")

        return ",".join(occasions)
    
    def search(self):
        query = f'[out:json];(nwr["amenity"~"{self.amenity}"](around:5000,-21.1767,-47.8208););out center;'
        headers = {
            "User-Agent": "RotaRibeiraoBot/1.0 (sabrinascarvalho@usp.br)"
        }

        r = requests.post(
            "https://overpass-api.de/api/interpreter",
            data={'data': query}, 
            headers=headers
        )

        print(f"Status Code: {r.status_code}")

        if r.status_code == 200:
            dados = r.json()
            resultados = dados.get('elements', [])
            
            for resultado in resultados:
                descricao = f"Um excelente local da categoria {self.type_search} em Ribeirão Preto! "
                tags = resultado.get('tags', {})
                ocasioes = self.classify_by_tags(tags)
                nome = tags.get('name', 'Sem nome')
                cuisine = tags.get("cuisine")
                website = tags.get("website")
                wheelchair = tags.get("wheelchair")
                phone = tags.get("phone")

                if cuisine:
                    descricao += f"Especialidade: {cuisine}. "
                if wheelchair:
                    descricao += "Com acessibilidade. "
                if phone:
                    descricao += f"Telefone: {phone}. "
                if website:
                    descricao += f"Site: {website}. "

                if resultado.get('lat'):
                    lat = resultado.get('lat')
                    lon = resultado.get('lon')
                else:
                    lat = resultado.get("center", {}).get("lat", "")
                    lon = resultado.get("center", {}).get("lon","")

                
                url_nominatim = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
                time.sleep(2)

                r_geo = requests.get(url_nominatim, headers=headers)

                if r_geo.status_code == 200:
                    endereco_completo = r_geo.json().get('address', {})
                    rua = endereco_completo.get('road', 'Rua não encontrada')
                    num_rua = endereco_completo.get('house_number', 'N/A')
                    bairro = endereco_completo.get('suburb', 'Bairro não encontrado')

                    rua_formatada = rua.replace(" ","+")

                    url_viacep = f"https://viacep.com.br/ws/SP/Ribeirao%20Preto/{rua_formatada}/json/"

                    r_viacep = requests.get(url_viacep)

                    if r_viacep.status_code == 200:
                        dados = r_viacep.json()
                        if len(dados) > 0:
                            cep = dados[0].get("cep", "")
                        else:
                            cep = dados.get("cep", "")
                    else:
                        print("Não foi possivel encontrar o cep")
                        cep = ""
                
                else:
                    print("Não foi possivel achar o endereco")
                    continue
                nome_formatado = nome.replace(" ","+")
                resultados = DDGS().images(keywords=f"{nome_formatado}+ribeirao+preto+{self.type_search}", type_image="photo", max_results=1, safesearch="on", size="Large")
                 
                url_imagem = resultados[0].get("image")
                print(url_imagem)


                
                break
                
        else:
            print("Erro:")
            print(r.text[:500])


restaurantes = SearchPlacesOverpass("restaurante")
