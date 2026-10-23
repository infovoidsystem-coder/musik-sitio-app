# MUSIK — Academia de DJs y Productores

Sitio web responsive de MUSIK con:

- Home institucional y oferta académica.
- Musik Radio con reproductor de SoundCloud.
- Sección de novedades y promociones.
- Musik Club, membresías y agenda de actividades.
- Panel administrativo de demostración.
- Diseño responsive y animaciones con estética DJ.

## Ejecutar localmente

No requiere instalación ni proceso de compilación. Desde esta carpeta ejecutá:

```bash
python -m http.server 4173
```

Después abrí `http://localhost:4173`.

## Publicar con GitHub Pages

1. Creá un repositorio nuevo en GitHub.
2. Subí el contenido completo de esta carpeta a la rama `main`.
3. Entrá en **Settings → Pages**.
4. En **Build and deployment**, elegí **Deploy from a branch**.
5. Seleccioná la rama `main`, carpeta `/ (root)` y guardá.

## Estructura

- `index.html`: página principal.
- `club.html`: sección privada y membresías.
- `admin.html`: panel administrativo demostrativo.
- `assets/`: imágenes y recursos visuales.
- `styles.css`, `club.css`, `admin.css`: estilos.
- `app.js`, `club.js`, `admin.js`: interacciones.

## Importante

El panel administrativo actual usa `localStorage`. Los cambios se guardan solamente en el navegador donde se realizan. Para convertirlo en una aplicación productiva hay que conectar autenticación, base de datos, almacenamiento de imágenes y pagos.

