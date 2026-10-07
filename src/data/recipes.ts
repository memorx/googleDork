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
  {
    id: 'git-expuestos',
    name: 'Repositorios .git expuestos',
    description: 'Encuentra sitios que sirven su directorio .git por HTTP, filtrando el código fuente completo.',
    steps: [
      'inurl:"/.git/config" busca el archivo de configuración del repositorio en la URL.',
      '"repositoryformatversion" es una cadena que solo aparece en .git/config reales: elimina falsos positivos.',
      'Un .git accesible permite reconstruir el código fuente y su historial completo con herramientas como git-dumper.',
    ],
    query: 'inurl:"/.git/config" "repositoryformatversion"',
    engine: 'google',
    sensitive: true,
  },
  {
    id: 'grafana-sin-login',
    name: 'Dashboards Grafana sin login',
    description: 'Localiza instancias de Grafana cuyo panel de login quedó indexado por Google.',
    steps: [
      'intitle:"Grafana" coincide con el título de la página de acceso de Grafana.',
      'inurl:/login confirma que la URL es la pantalla de autenticación.',
      'Versiones antiguas de Grafana tienen CVEs de bypass; en auditoría propia, verificá que exija credenciales.',
    ],
    query: 'intitle:"Grafana" inurl:/login',
    engine: 'google',
    sensitive: true,
  },
  {
    id: 'buckets-s3-empresa',
    name: 'Buckets S3 abiertos de una empresa',
    description: 'Busca buckets de Amazon S3 indexados que mencionan el nombre de una organización.',
    steps: [
      'site:s3.amazonaws.com limita los resultados a URLs de buckets S3.',
      '"ejemplo" se reemplaza por el nombre de la empresa auditada.',
      'Los buckets públicos suelen contener respaldos, exports de bases de datos y documentos internos.',
    ],
    query: 'site:s3.amazonaws.com "ejemplo"',
    engine: 'google',
    sensitive: true,
  },
  {
    id: 'docker-api-abierta',
    name: 'APIs de Docker sin TLS',
    description: 'Detecta daemons de Docker con la API remota expuesta en el puerto 2375 sin cifrado ni autenticación.',
    steps: [
      'port:2375 es el puerto estándar de la API de Docker sin TLS.',
      'product:"Docker" confirma que el banner corresponde al daemon de Docker.',
      'Una API abierta permite crear contenedores privilegiados y tomar el host: reportalo de inmediato.',
    ],
    query: 'port:2375 product:"Docker"',
    engine: 'shodan',
    sensitive: true,
  },
  {
    id: 'errores-sql-php',
    name: 'Apps PHP con errores SQL visibles',
    description: 'Encuentra aplicaciones PHP que imprimen errores de MySQL en la respuesta, señal de posible inyección SQL.',
    steps: [
      'intext:"You have an error in your SQL syntax" es el mensaje exacto que imprime MySQL.',
      'inurl:.php?id= acota a páginas con parámetros GET, el punto típico de inyección.',
      'Un error visible confirma que la entrada del usuario llega sin sanitizar a la consulta.',
    ],
    query: 'intext:"You have an error in your SQL syntax" inurl:.php?id=',
    engine: 'google',
    sensitive: true,
  },
  {
    id: 'camaras-hikvision',
    name: 'Cámaras Hikvision con panel accesible',
    description: 'Localiza cámaras y grabadores Hikvision cuya pantalla de login quedó indexada por Google.',
    steps: [
      'inurl:"/doc/page/login.asp" es la ruta estándar de autenticación de Hikvision.',
      'intext:"Hikvision" confirma que el panel pertenece a un dispositivo de esa marca.',
      'Los firmwares antiguos tienen CVEs de bypass de autenticación: en auditoría propia, verificá la versión.',
    ],
    query: 'inurl:"/doc/page/login.asp" intext:"Hikvision"',
    engine: 'google',
    sensitive: true,
  },
  {
    id: 'tokens-slack-github',
    name: 'Tokens de Slack filtrados en GitHub',
    description: 'Encuentra tokens de bots de Slack commiteados por error en repositorios públicos.',
    steps: [
      '"xoxb-" es el prefijo inequívoco de los tokens de bot de Slack.',
      'extension:env acota la búsqueda a archivos de variables de entorno, donde suelen vivir.',
      'Un token válido permite leer y publicar en el workspace: si es tuyo, revocálo de inmediato en api.slack.com.',
    ],
    query: '"xoxb-" extension:env',
    engine: 'github',
    sensitive: true,
  },
  {
    id: 'vpn-openvpn-configs',
    name: 'VPNs OpenVPN con configs públicas',
    description: 'Busca archivos de configuración .ovpn servidos abiertamente, con certificados y a veces claves.',
    steps: [
      'filetype:ovpn restringe los resultados a perfiles de cliente OpenVPN.',
      '"client" y "dev tun" son directivas presentes en todo perfil .ovpn real: eliminan falsos positivos.',
      'Un perfil expuesto puede incluir el certificado CA, el cert del cliente y su clave privada embebida.',
    ],
    query: 'filetype:ovpn "client" "dev tun"',
    engine: 'google',
    sensitive: true,
  },
  {
    id: 'elasticsearch-abiertos',
    name: 'Elasticsearches abiertos con Shodan',
    description: 'Detecta clusters Elasticsearch con la API HTTP expuesta en redes mexicanas.',
    steps: [
      'product:Elastic identifica el banner del servicio Elasticsearch.',
      'port:9200 es el puerto estándar de su API HTTP.',
      'country:MX limita los resultados a México. Si el cluster responde sin credenciales, sus índices son legibles.',
    ],
    query: 'product:Elastic port:9200 country:MX',
    engine: 'shodan',
    sensitive: true,
  },
  {
    id: 'redis-sin-password',
    name: 'Redis sin contraseña con Shodan',
    description: 'Enumera servidores Redis accesibles desde Internet en el país indicado.',
    steps: [
      'product:Redis filtra por el banner del servidor Redis.',
      'port:6379 confirma el puerto estándar del servicio.',
      'country:MX acota a México. Redis históricamente se despliega sin autenticación: verificá los tuyos.',
    ],
    query: 'product:Redis port:6379 country:MX',
    engine: 'shodan',
    sensitive: true,
  },
  {
    id: 'webmails-empresa',
    name: 'Webmails expuestos de una empresa',
    description: 'Busca portales de webmail (Roundcube, OWA, Zimbra) publicados bajo el dominio de una organización.',
    steps: [
      'site:ejemplo.com restringe la búsqueda al dominio auditado (reemplazalo por el tuyo).',
      'Los intitle:/inurl: entre paréntesis cubren Roundcube, Outlook Web App y Zimbra en una sola consulta.',
      'Un webmail expuesto es el punto de entrada habitual del phishing con credenciales: debería estar tras MFA o VPN.',
    ],
    query: 'site:ejemplo.com (intitle:"Roundcube Webmail" OR inurl:/owa/ OR intitle:"Zimbra Web Client Sign In")',
    engine: 'google',
    sensitive: true,
  },
]

export function getRecipes(): Recipe[] {
  return recipes
}

export function getRecipeById(recipeId: string): Recipe | undefined {
  return recipes.find((recipe) => recipe.id === recipeId)
}
