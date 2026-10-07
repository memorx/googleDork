export interface Recipe {
  id: string
  name: string
  description: string
  /** Explicación paso a paso de qué hace cada parte del query */
  steps: string[]
  /** Query final listo para copiar o probar */
  query: string
  engine: string
  /** Recetas con dorks sensibles (auditoría): muestran aviso ético */
  sensitive?: boolean
}

export const recipes: Recipe[] = [
  {
    id: 'camaras-axis-mx',
    name: 'Cámaras Axis abiertas en México',
    description: 'Localiza cámaras IP Axis con stream MJPEG accesible, limitadas a dominios de México.',
    steps: [
      'inurl:axis-cgi/mjpg busca URLs que exponen el endpoint de video MJPEG de las cámaras Axis.',
      'site:mx restringe los resultados a dominios .mx.',
      'La combinación devuelve cámaras cuyo feed de video quedó publicado sin autenticación.',
    ],
    query: 'inurl:axis-cgi/mjpg site:mx',
    engine: 'google',
    sensitive: true,
  },
  {
    id: 'cvs-desarrolladores',
    name: 'Currículums de desarrolladores',
    description: 'Encuentra CVs en PDF de personas que trabajan con tecnologías front-end.',
    steps: [
      'filetype:pdf limita los resultados a documentos PDF.',
      '"curriculum" exige la palabra exacta en el documento.',
      '(react OR typescript) filtra por las tecnologías buscadas.',
    ],
    query: 'filetype:pdf "curriculum" (react OR typescript)',
    engine: 'google',
  },
  {
    id: 'secretos-github',
    name: 'Secretos en GitHub',
    description: 'Detecta archivos .env con contraseñas de base de datos publicados por error.',
    steps: [
      'filename:.env restringe la búsqueda a archivos de variables de entorno.',
      'DB_PASSWORD exige que el archivo contenga la variable de contraseña de la base de datos.',
      'Los resultados son repositorios que filtraron credenciales en texto plano.',
    ],
    query: 'filename:.env DB_PASSWORD',
    engine: 'github',
    sensitive: true,
  },
  {
    id: 'phpmyadmin-expuesto',
    name: 'Panel phpMyAdmin expuesto',
    description: 'Encuentra interfaces de phpMyAdmin accesibles públicamente en la web.',
    steps: [
      'inurl:phpmyadmin busca la ruta típica de instalación de phpMyAdmin.',
      'intitle:phpMyAdmin confirma que la página es el panel de login real.',
      'El resultado son paneles de administración de bases de datos MySQL expuestos.',
    ],
    query: 'inurl:phpmyadmin intitle:phpMyAdmin',
    engine: 'google',
    sensitive: true,
  },
  {
    id: 'backups-index-of',
    name: 'Respaldos en directorios abiertos',
    description: 'Localiza listados de directorios que exponen archivos de respaldo.',
    steps: [
      'intitle:"index of" encuentra directorios con autoindex habilitado.',
      '(backup OR respaldo) filtra por nombres de archivo de respaldo.',
      '(ext:zip OR ext:sql) limita a comprimidos y volcados de base de datos.',
    ],
    query: 'intitle:"index of" (backup OR respaldo) (ext:zip OR ext:sql)',
    engine: 'google',
    sensitive: true,
  },
  {
    id: 'subdominios-crtsh',
    name: 'Subdominios de un dominio vía certificados',
    description: 'Enumera subdominios de un dominio usando los registros públicos de Certificate Transparency.',
    steps: [
      'El comodín %. indica a crt.sh que busque cualquier subdominio.',
      'Los certificados TLS emitidos son públicos y revelan subdominios, incluso los no enlazados.',
      'Cambiá ejemplo.com por el dominio propio que querés auditar.',
    ],
    query: '%.ejemplo.com',
    engine: 'crtsh',
  },
  {
    id: 'mongodb-sin-auth',
    name: 'MongoDB accesibles en México',
    description: 'Detecta instancias MongoDB expuestas a Internet en redes mexicanas.',
    steps: [
      'product:MongoDB filtra por el banner del servicio MongoDB.',
      'port:27017 confirma el puerto estándar del motor.',
      'country:MX limita los resultados a México. Muchas instancias no tienen autenticación habilitada.',
    ],
    query: 'product:MongoDB port:27017 country:MX',
    engine: 'shodan',
    sensitive: true,
  },
  {
    id: 'rdp-expuestos',
    name: 'Escritorios remotos RDP expuestos',
    description: 'Encuentra máquinas Windows con Escritorio Remoto abierto a Internet.',
    steps: [
      'port:3389 es el puerto estándar de RDP.',
      'country:MX restringe los resultados a México.',
      'has_screenshot:true muestra solo los hosts de los que Shodan tiene captura de la pantalla de login.',
    ],
    query: 'port:3389 country:MX has_screenshot:true',
    engine: 'shodan',
    sensitive: true,
  },
  {
    id: 'bots-maliciosos-greynoise',
    name: 'Escáneres maliciosos activos hoy',
    description: 'Lista las IPs clasificadas como maliciosas que GreyNoise vio activas en las últimas 24 horas.',
    steps: [
      'classification:malicious filtra las IPs con comportamiento malicioso confirmado.',
      'last_seen:1d limita a la actividad observada en el último día.',
      'Útil para alimentar listas de bloqueo de un firewall propio.',
    ],
    query: 'classification:malicious last_seen:1d',
    engine: 'greynoise',
  },
  {
    id: 'historial-wayback',
    name: 'Historial completo de un sitio',
    description: 'Explora todas las URLs que la Wayback Machine archivó de un dominio.',
    steps: [
      'El comodín /* pide todas las rutas capturadas del dominio.',
      'Permite descubrir endpoints olvidados, documentos retirados y páginas eliminadas.',
      'Cambiá ejemplo.com por el dominio que querés investigar.',
    ],
    query: 'ejemplo.com/*',
    engine: 'wayback',
  },
  {
    id: 'vecinos-analytics',
    name: 'Sitios que comparten un ID de Analytics',
    description: 'Encuentra todos los sitios que usan el mismo ID de Google Analytics: suelen ser del mismo propietario.',
    steps: [
      'PublicWWW busca el fragmento exacto dentro del código fuente HTML de los sitios.',
      'El ID UA- de Analytics vincula dominios operados por la misma persona u organización.',
      'Reemplazá UA-12345678-1 por el ID encontrado en el sitio que investigás.',
    ],
    query: '"UA-12345678-1"',
    engine: 'publicwww',
  },
  {
    id: 'paneles-router-netlas',
    name: 'Paneles de router expuestos',
    description: 'Localiza interfaces web de routers accesibles desde Internet en México.',
    steps: [
      'http.title:"RouterOS" busca el título de la interfaz web de routers MikroTik.',
      'country:MX restringe los resultados a hosts geolocalizados en México.',
      'Los paneles de router expuestos son un vector de ataque frecuente contra redes propias.',
    ],
    query: 'http.title:"RouterOS" country:MX',
    engine: 'netlas',
    sensitive: true,
  },
]

export function getRecipes(): Recipe[] {
  return recipes
}

export function getRecipeById(recipeId: string): Recipe | undefined {
  return recipes.find((recipe) => recipe.id === recipeId)
}
