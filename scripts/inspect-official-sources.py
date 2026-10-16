import json, urllib.request
from html.parser import HTMLParser
from pathlib import Path
class Links(HTMLParser):
    def __init__(self): super().__init__(); self.links=[]; self.current=None
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag in ('a','option'):
            self.current={'tag':tag,'url':a.get('href',a.get('value','')),'text':''}; self.links.append(self.current)
    def handle_data(self,data):
        if self.current: self.current['text']+=data
    def handle_endtag(self,tag):
        if tag in ('a','option'): self.current=None
urls={'exteriores':'https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/recomendaciones-de-viaje.aspx','sanidad':'https://www.sanidad.gob.es/profesionales/saludPaises.do?metodo=verPaises'}
Path('artifacts').mkdir(exist_ok=True)
for name,url in urls.items():
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'ViajaFacil source-link verification; https://github.com/juangarce34-blip/Viajaf-cil-'})
        with urllib.request.urlopen(req,timeout=30) as response: html=response.read().decode('utf-8',errors='replace')
        parser=Links(); parser.feed(html)
        Path('artifacts/'+name+'-links.json').write_text(json.dumps(parser.links,ensure_ascii=False,indent=2))
        Path('artifacts/'+name+'.html').write_text(html)
        print(name,len(parser.links))
        print(json.dumps([x for x in parser.links if ('trc=' in x['url'] or 'pais=' in x['url'] or x['tag']=='option')],ensure_ascii=False))
    except Exception as e: print(name,str(e))
