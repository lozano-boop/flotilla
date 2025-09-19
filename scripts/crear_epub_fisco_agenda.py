#!/usr/bin/env python3
"""
Script para convertir Fisco Agenda 2025 PDF a formato EPUB
Extrae el contenido y lo estructura en capítulos organizados

Autor: Sistema CFDI
Fecha: 2024
"""

import os
import re
import subprocess
from pathlib import Path
from ebooklib import epub
import argparse

def extraer_texto_pdf(pdf_path: Path, output_txt: Path):
    """Extrae texto completo del PDF usando pdftotext"""
    try:
        cmd = ['pdftotext', str(pdf_path), str(output_txt)]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"[OK] Texto extraído del PDF: {output_txt}")
            return True
        else:
            print(f"[ERROR] Error al extraer texto: {result.stderr}")
            return False
    except Exception as e:
        print(f"[ERROR] Error ejecutando pdftotext: {e}")
        return False

def limpiar_texto(texto):
    """Limpia el texto extraído del PDF"""
    # Remover warnings de sintaxis
    texto = re.sub(r'Syntax Warning:.*?\n', '', texto)
    
    # Normalizar espacios en blanco
    texto = re.sub(r'\n\s*\n', '\n\n', texto)
    texto = re.sub(r' +', ' ', texto)
    
    # Remover caracteres de control
    texto = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', texto)
    
    return texto.strip()

def dividir_en_capitulos(texto):
    """Divide el texto en capítulos basado en patrones comunes"""
    capitulos = []
    
    # Patrones para identificar nuevos capítulos/secciones
    patrones_capitulo = [
        r'^TITULO\s+[IVX]+',
        r'^CAPITULO\s+[IVX]+',
        r'^SECCION\s+[IVX]+',
        r'^LEY\s+DEL?\s+',
        r'^CODIGO\s+',
        r'^REGLAMENTO\s+',
        r'^\d+\.\s+[A-Z][A-Z\s]+$'
    ]
    
    lineas = texto.split('\n')
    capitulo_actual = []
    titulo_actual = "Introducción"
    
    for linea in lineas:
        linea = linea.strip()
        if not linea:
            continue
            
        # Verificar si es inicio de nuevo capítulo
        es_nuevo_capitulo = False
        for patron in patrones_capitulo:
            if re.match(patron, linea, re.IGNORECASE):
                es_nuevo_capitulo = True
                break
        
        if es_nuevo_capitulo and capitulo_actual:
            # Guardar capítulo anterior
            contenido = '\n'.join(capitulo_actual)
            if len(contenido.strip()) > 100:  # Solo capítulos con contenido significativo
                capitulos.append({
                    'titulo': titulo_actual,
                    'contenido': contenido
                })
            
            # Iniciar nuevo capítulo
            titulo_actual = linea[:100]  # Limitar longitud del título
            capitulo_actual = [linea]
        else:
            capitulo_actual.append(linea)
    
    # Agregar último capítulo
    if capitulo_actual:
        contenido = '\n'.join(capitulo_actual)
        if len(contenido.strip()) > 100:
            capitulos.append({
                'titulo': titulo_actual,
                'contenido': contenido
            })
    
    return capitulos

def crear_epub(capitulos, output_path: Path):
    """Crea el archivo EPUB con los capítulos"""
    
    # Crear libro EPUB
    book = epub.EpubBook()
    
    # Metadatos del libro
    book.set_identifier('fisco-agenda-2025')
    book.set_title('Fisco Agenda 2025')
    book.set_language('es')
    book.add_author('C.P. EFRAÍN LECHUGA SANTILLÁN')
    book.add_author('EDICIONES FISCALES ISEF')
    
    # Descripción
    book.set_cover("image.jpg", open('/dev/null', 'rb').read())  # Cover placeholder
    
    # CSS para estilo
    nav_css = epub.EpubItem(
        uid="nav_css",
        file_name="style/nav.css",
        media_type="text/css",
        content="""
        body { font-family: Arial, sans-serif; margin: 2em; }
        h1 { color: #2E4057; border-bottom: 2px solid #2E4057; padding-bottom: 10px; }
        h2 { color: #4A6741; margin-top: 2em; }
        p { text-align: justify; line-height: 1.6; }
        .articulo { background-color: #f5f5f5; padding: 10px; margin: 10px 0; border-left: 4px solid #2E4057; }
        .ley { font-weight: bold; color: #8B0000; }
        """
    )
    book.add_item(nav_css)
    
    # Crear capítulos del EPUB
    epub_chapters = []
    spine = ['nav']
    
    for i, cap in enumerate(capitulos[:50]):  # Limitar a 50 capítulos para evitar archivos muy grandes
        # Limpiar y formatear contenido
        contenido_html = formatear_contenido_html(cap['contenido'])
        
        # Crear capítulo EPUB
        chapter = epub.EpubHtml(
            title=cap['titulo'],
            file_name=f'capitulo_{i+1}.xhtml',
            lang='es'
        )
        
        chapter.content = f"""
        <!DOCTYPE html>
        <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
            <title>{cap['titulo']}</title>
            <link rel="stylesheet" href="style/nav.css" type="text/css"/>
        </head>
        <body>
            <h1>{cap['titulo']}</h1>
            {contenido_html}
        </body>
        </html>
        """
        
        book.add_item(chapter)
        epub_chapters.append(chapter)
        spine.append(chapter)
    
    # Tabla de contenidos
    book.toc = [(epub.Section('Fisco Agenda 2025'), epub_chapters)]
    
    # Navegación
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())
    
    # Spine
    book.spine = spine
    
    # Escribir EPUB
    epub.write_epub(str(output_path), book, {})
    print(f"[OK] EPUB creado: {output_path}")

def formatear_contenido_html(texto):
    """Convierte texto plano a HTML con formato básico"""
    # Escapar caracteres HTML
    texto = texto.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    
    # Convertir párrafos
    paragrafos = texto.split('\n\n')
    html_paragrafos = []
    
    for p in paragrafos:
        p = p.strip()
        if not p:
            continue
            
        # Detectar artículos de ley
        if re.match(r'^ARTICULO\s+\d+', p, re.IGNORECASE):
            html_paragrafos.append(f'<div class="articulo"><p class="ley">{p}</p></div>')
        # Detectar títulos de ley
        elif re.match(r'^LEY\s+', p, re.IGNORECASE) or re.match(r'^CODIGO\s+', p, re.IGNORECASE):
            html_paragrafos.append(f'<h2 class="ley">{p}</h2>')
        # Párrafo normal
        else:
            # Dividir líneas largas en párrafos
            lineas = p.split('\n')
            for linea in lineas:
                if linea.strip():
                    html_paragrafos.append(f'<p>{linea.strip()}</p>')
    
    return '\n'.join(html_paragrafos)

def main():
    parser = argparse.ArgumentParser(description='Convertir Fisco Agenda 2025 PDF a EPUB')
    parser.add_argument('--pdf', required=True, help='Ruta al archivo PDF')
    parser.add_argument('--output-dir', required=True, help='Directorio de salida')
    
    args = parser.parse_args()
    
    pdf_path = Path(args.pdf)
    output_dir = Path(args.output_dir)
    
    if not pdf_path.exists():
        print(f"[ERROR] No se encontró el archivo PDF: {pdf_path}")
        return
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Archivos temporales y de salida
    txt_path = output_dir / "fisco_agenda_temp.txt"
    epub_path = output_dir / "Fisco Agenda 2025.epub"
    
    print(f"[INFO] Iniciando conversión de {pdf_path.name} a EPUB...")
    
    # Paso 1: Extraer texto del PDF
    print("[INFO] Extrayendo texto del PDF...")
    if not extraer_texto_pdf(pdf_path, txt_path):
        return
    
    # Paso 2: Leer y limpiar texto
    print("[INFO] Limpiando texto extraído...")
    with open(txt_path, 'r', encoding='utf-8', errors='ignore') as f:
        texto_crudo = f.read()
    
    texto_limpio = limpiar_texto(texto_crudo)
    
    # Paso 3: Dividir en capítulos
    print("[INFO] Dividiendo contenido en capítulos...")
    capitulos = dividir_en_capitulos(texto_limpio)
    print(f"[INFO] Se identificaron {len(capitulos)} capítulos")
    
    # Paso 4: Crear EPUB
    print("[INFO] Creando archivo EPUB...")
    crear_epub(capitulos, epub_path)
    
    # Limpiar archivo temporal
    txt_path.unlink()
    
    print(f"[OK] Conversión completada: {epub_path}")
    print(f"[INFO] Tamaño del archivo: {epub_path.stat().st_size / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    main()
