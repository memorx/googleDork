export interface Dork {
  id: string
  operator: string
  description: string
  example: string
  usage: string
  category: string
}

export interface Category {
  id: string
  name: string
  description: string
}

export const categories: Category[] = [
  {
    id: 'basic',
    name: 'Búsqueda básica',
    description: 'Operadores fundamentales para refinar cualquier búsqueda en Google.',
  },
  {
    id: 'site-url',
    name: 'Sitio y URL',
    description: 'Restringe resultados a dominios, URLs o partes específicas de una dirección.',
  },
  {
    id: 'title-text',
    name: 'Título y texto',
    description: 'Busca dentro del título de la página o en el cuerpo del contenido.',
  },
  {
    id: 'files',
    name: 'Archivos',
    description: 'Encuentra archivos de un tipo específico expuestos en la web.',
  },
  {
    id: 'info',
    name: 'Información',
    description: 'Obtén definiciones, información de contacto, caché o páginas relacionadas.',
  },
  {
    id: 'local',
    name: 'Local y mapas',
    description: 'Busca negocios, mapas, películas, libros y otros contenidos locales.',
  },
  {
    id: 'social',
    name: 'Redes sociales',
    description: 'Filtra contenido de foros, blogs y redes sociales.',
  },
  {
    id: 'advanced',
    name: 'Avanzados',
    description: 'Operadores menos conocidos o combinaciones de precisión.',
  },
  {
    id: 'security',
    name: 'Seguridad / Google Hacking',
    description: 'Dorks comunes para auditoría de seguridad y pruebas de penetración autorizadas.',
  },
]

export const dorks: Dork[] = [
  // Búsqueda básica
  {
    id: 'exact-phrase',
    operator: '" "',
    description: 'Busca una frase exacta.',
    example: '"inteligencia artificial"',
    usage: 'Encuentra páginas que contengan exactamente esa frase, en ese orden.',
    category: 'basic',
  },
  {
    id: 'exclude',
    operator: '-',
    description: 'Excluye una palabra o frase.',
    example: 'jaguar -animal',
    usage: 'Elimina resultados relacionados con el término excluido.',
    category: 'basic',
  },
  {
    id: 'or',
    operator: 'OR',
    description: 'Busca una palabra u otra.',
    example: 'python OR javascript',
    usage: 'Devuelve resultados que contengan cualquiera de los términos.',
    category: 'basic',
  },
  {
    id: 'wildcard',
    operator: '*',
    description: 'Comodín para palabras desconocidas.',
    example: '"el mejor * del mundo"',
    usage: 'Reemplaza una o varias palabras dentro de una frase exacta.',
    category: 'basic',
  },
  {
    id: 'range',
    operator: '..',
    description: 'Rango numérico.',
    example: 'laptop $5000..$15000 MXN',
    usage: 'Busca números dentro del rango especificado.',
    category: 'basic',
  },

  // Sitio y URL
  {
    id: 'site',
    operator: 'site:',
    description: 'Restringe la búsqueda a un dominio o sitio.',
    example: 'site:github.com react hooks',
    usage: 'Busca solo dentro del dominio indicado.',
    category: 'site-url',
  },
  {
    id: 'inurl',
    operator: 'inurl:',
    description: 'Busca términos dentro de la URL.',
    example: 'inurl:login.php',
    usage: 'Filtra páginas cuya URL contenga la palabra clave.',
    category: 'site-url',
  },
  {
    id: 'allinurl',
    operator: 'allinurl:',
    description: 'Todas las palabras deben aparecer en la URL.',
    example: 'allinurl:admin panel config',
    usage: 'Similar a inurl: pero exige que todas las palabras estén en la URL.',
    category: 'site-url',
  },
  {
    id: 'ext',
    operator: 'ext:',
    description: 'Alias de filetype:. Busca archivos por extensión.',
    example: 'ext:pdf manual usuario',
    usage: 'Sinónimo de filetype:, útil para encontrar documentos.',
    category: 'site-url',
  },

  // Título y texto
  {
    id: 'intitle',
    operator: 'intitle:',
    description: 'Busca palabras en el título de la página.',
    example: 'intitle:"index of"',
    usage: 'Filtra resultados cuyo tag <title> contenga el término.',
    category: 'title-text',
  },
  {
    id: 'allintitle',
    operator: 'allintitle:',
    description: 'Todas las palabras deben estar en el título.',
    example: 'allintitle:admin login',
    usage: 'Exige que cada palabra aparezca en el título.',
    category: 'title-text',
  },
  {
    id: 'intext',
    operator: 'intext:',
    description: 'Busca palabras dentro del cuerpo de la página.',
    example: 'intext:"password"',
    usage: 'Filtra páginas que contengan el término en su contenido visible.',
    category: 'title-text',
  },
  {
    id: 'allintext',
    operator: 'allintext:',
    description: 'Todas las palabras deben estar en el cuerpo.',
    example: 'allintext:usuario contraseña',
    usage: 'Similar a intext: pero exige todas las palabras en el contenido.',
    category: 'title-text',
  },
  {
    id: 'inanchor',
    operator: 'inanchor:',
    description: 'Busca en el texto de los enlaces (anchor text).',
    example: 'inanchor:descargar',
    usage: 'Encuentra páginas enlazadas con ese texto de ancla.',
    category: 'title-text',
  },
  {
    id: 'allinanchor',
    operator: 'allinanchor:',
    description: 'Todas las palabras en el anchor text.',
    example: 'allinanchor:click here',
    usage: 'Filtra por enlaces cuyo texto contenga todas las palabras.',
    category: 'title-text',
  },

  // Archivos
  {
    id: 'filetype',
    operator: 'filetype:',
    description: 'Busca archivos de un tipo específico.',
    example: 'filetype:pdf "seguridad informática"',
    usage: 'Devuelve archivos con la extensión indicada.',
    category: 'files',
  },
  {
    id: 'filetype-docx',
    operator: 'filetype:docx',
    description: 'Documentos Word.',
    example: 'filetype:docx "confidencial"',
    usage: 'Encuentra documentos Word expuestos públicamente.',
    category: 'files',
  },
  {
    id: 'filetype-xlsx',
    operator: 'filetype:xlsx',
    description: 'Hojas de cálculo Excel.',
    example: 'filetype:xlsx "clientes"',
    usage: 'Busca archivos Excel indexados por Google.',
    category: 'files',
  },
  {
    id: 'filetype-sql',
    operator: 'filetype:sql',
    description: 'Archivos SQL.',
    example: 'filetype:sql "CREATE TABLE users"',
    usage: 'Encuentra dumps o scripts de bases de datos.',
    category: 'files',
  },
  {
    id: 'filetype-env',
    operator: 'filetype:env',
    description: 'Archivos de entorno .env.',
    example: 'filetype:env "DB_PASSWORD"',
    usage: 'Busca archivos de configuración con credenciales.',
    category: 'files',
  },
  {
    id: 'filetype-log',
    operator: 'filetype:log',
    description: 'Archivos de log.',
    example: 'filetype:log "error" "password"',
    usage: 'Encuentra logs expuestos con información sensible.',
    category: 'files',
  },
  {
    id: 'filetype-conf',
    operator: 'filetype:conf',
    description: 'Archivos de configuración.',
    example: 'filetype:conf "password"',
    usage: 'Busca archivos .conf con posibles credenciales.',
    category: 'files',
  },

  // Información
  {
    id: 'cache',
    operator: 'cache:',
    description: 'Muestra la versión en caché de una URL.',
    example: 'cache:example.com',
    usage: 'Accede a una copia almacenada por Google de la página.',
    category: 'info',
  },
  {
    id: 'related',
    operator: 'related:',
    description: 'Encuentra sitios relacionados.',
    example: 'related:github.com',
    usage: 'Muestra sitios similares al dominio indicado.',
    category: 'info',
  },
  {
    id: 'info',
    operator: 'info:',
    description: 'Información sobre un dominio.',
    example: 'info:example.com',
    usage: 'Obtén enlaces y datos sobre el sitio.',
    category: 'info',
  },
  {
    id: 'define',
    operator: 'define:',
    description: 'Definición de una palabra.',
    example: 'define:phishing',
    usage: 'Muestra el significado de un término.',
    category: 'info',
  },
  {
    id: 'stocks',
    operator: 'stocks:',
    description: 'Información bursátil.',
    example: 'stocks:AAPL',
    usage: 'Muestra datos de acciones y cotizaciones.',
    category: 'info',
  },
  {
    id: 'weather',
    operator: 'weather:',
    description: 'Pronóstico del tiempo.',
    example: 'weather:Morelia',
    usage: 'Muestra el clima de la ubicación indicada.',
    category: 'info',
  },
  {
    id: 'phonebook',
    operator: 'phonebook:',
    description: 'Busca números telefónicos (limitado).',
    example: 'phonebook:John Doe New York',
    usage: 'Búsqueda de listados telefónicos históricos.',
    category: 'info',
  },

  // Local y mapas
  {
    id: 'map',
    operator: 'map:',
    description: 'Muestra mapas de una ubicación.',
    example: 'map:Morelia Michoacán',
    usage: 'Abre resultados de mapas para el lugar indicado.',
    category: 'local',
  },
  {
    id: 'movie',
    operator: 'movie:',
    description: 'Información sobre películas.',
    example: 'movie:Inception',
    usage: 'Muestra datos y horarios de películas.',
    category: 'local',
  },
  {
    id: 'book',
    operator: 'book:',
    description: 'Busca libros.',
    example: 'book:1984 George Orwell',
    usage: 'Encuentra información de libros y reseñas.',
    category: 'local',
  },
  {
    id: 'loc',
    operator: 'loc:',
    description: 'Resultados asociados a una ubicación.',
    example: 'restaurantes loc:Morelia',
    usage: 'Fuerza la localización de la búsqueda.',
    category: 'local',
  },
  {
    id: 'location',
    operator: 'location:',
    description: 'Filtra noticias por ubicación.',
    example: 'location:mexico',
    usage: 'Usado principalmente en Google News.',
    category: 'local',
  },

  // Redes sociales
  {
    id: 'site-twitter',
    operator: 'site:twitter.com',
    description: 'Buscar dentro de X/Twitter.',
    example: 'site:twitter.com "hacking"',
    usage: 'Filtra resultados de la red social X.',
    category: 'social',
  },
  {
    id: 'site-linkedin',
    operator: 'site:linkedin.com/in',
    description: 'Buscar perfiles de LinkedIn.',
    example: 'site:linkedin.com/in "developer"',
    usage: 'Encuentra perfiles públicos de LinkedIn.',
    category: 'social',
  },
  {
    id: 'site-github',
    operator: 'site:github.com',
    description: 'Buscar en GitHub.',
    example: 'site:github.com "password" "example"',
    usage: 'Filtra repositorios públicos de GitHub.',
    category: 'social',
  },
  {
    id: 'insubject',
    operator: 'insubject:',
    description: 'Busca palabras en el asunto de grupos de noticias.',
    example: 'insubject:seguridad',
    usage: 'Útil en búsquedas de grupos y foros.',
    category: 'social',
  },
  {
    id: 'inpostauthor',
    operator: 'inpostauthor:',
    description: 'Busca posts por autor.',
    example: 'inpostauthor:"Guillermo"',
    usage: 'Filtra entradas de blogs por nombre de autor.',
    category: 'social',
  },
  {
    id: 'inposttitle',
    operator: 'inposttitle:',
    description: 'Busca posts por título.',
    example: 'inposttitle:"tutorial"',
    usage: 'Filtra entradas de blogs por título.',
    category: 'social',
  },
  {
    id: 'blogurl',
    operator: 'blogurl:',
    description: 'Busca posts de un blog específico.',
    example: 'blogurl:example.blogspot.com',
    usage: 'Encuentra entradas de un blog en particular.',
    category: 'social',
  },

  // Avanzados
  {
    id: 'around',
    operator: 'AROUND(X)',
    description: 'Dos términos cercanos entre sí (máx. X palabras).',
    example: 'python AROUND(3) tutorial',
    usage: 'Encuentra páginas donde los términos aparezcan cerca uno del otro.',
    category: 'advanced',
  },
  {
    id: 'before',
    operator: 'before:',
    description: 'Resultados anteriores a una fecha.',
    example: 'cybersecurity before:2020-01-01',
    usage: 'Filtra resultados publicados antes de la fecha dada.',
    category: 'advanced',
  },
  {
    id: 'after',
    operator: 'after:',
    description: 'Resultados posteriores a una fecha.',
    example: 'cybersecurity after:2024-01-01',
    usage: 'Filtra resultados publicados después de la fecha dada.',
    category: 'advanced',
  },
  {
    id: 'daterange',
    operator: 'daterange:',
    description: 'Rango de fechas en formato Julian.',
    example: 'hacking daterange:2024-01-01..2024-12-31',
    usage: 'Busca resultados dentro del rango de fechas.',
    category: 'advanced',
  },
  {
    id: 'source',
    operator: 'source:',
    description: 'Fuente en Google News.',
    example: 'source:reuters "hacking"',
    usage: 'Filtra noticias por fuente.',
    category: 'advanced',
  },
  {
    id: 'safesearch',
    operator: 'safesearch:',
    description: 'Activa o desactiva SafeSearch.',
    example: 'safesearch:off',
    usage: 'Controla el filtro de contenido explícito.',
    category: 'advanced',
  },
  {
    id: 'imagesize',
    operator: 'imagesize:',
    description: 'Busca imágenes por tamaño.',
    example: 'gatos imagesize:1920x1080',
    usage: 'Filtra imágenes por resolución exacta.',
    category: 'advanced',
  },
  {
    id: 'hashtag',
    operator: '#',
    description: 'Busca hashtags.',
    example: '#hacking',
    usage: 'Encuentra contenido etiquetado con el hashtag.',
    category: 'advanced',
  },
  {
    id: 'id',
    operator: 'id:',
    description: 'Busca información sobre una frase en grupos.',
    example: 'id:"hacking tools"',
    usage: 'Operador histórico para grupos de Google.',
    category: 'advanced',
  },

  // Seguridad / Google Hacking
  {
    id: 'sec-index-of',
    operator: 'intitle:"index of"',
    description: 'Directorios expuestos en servidores web.',
    example: 'intitle:"index of" "config.json"',
    usage: 'Encuentra listados de directorios con archivos sensibles.',
    category: 'security',
  },
  {
    id: 'sec-admin-login',
    operator: 'inurl:admin',
    description: 'Paneles de administración expuestos.',
    example: 'inurl:admin.php OR inurl:admin/login',
    usage: 'Localiza paneles de login administrativos.',
    category: 'security',
  },
  {
    id: 'sec-phpmyadmin',
    operator: 'inurl:phpmyadmin',
    description: 'Instancias de phpMyAdmin.',
    example: 'inurl:phpmyadmin/index.php',
    usage: 'Encuentra interfaces de phpMyAdmin accesibles.',
    category: 'security',
  },
  {
    id: 'sec-webcam',
    operator: 'inurl:"view.shtml"',
    description: 'Cámaras IP sin protección.',
    example: 'inurl:"view.shtml" intitle:"Live View / - AXIS"',
    usage: 'Localiza cámaras web expuestas.',
    category: 'security',
  },
  {
    id: 'sec-env',
    operator: 'filetype:env',
    description: 'Archivos .env con variables sensibles.',
    example: 'filetype:env "DB_PASSWORD"',
    usage: 'Busca archivos de entorno con credenciales.',
    category: 'security',
  },
  {
    id: 'sec-htaccess',
    operator: 'filetype:htpasswd',
    description: 'Archivos de contraseñas de Apache.',
    example: 'filetype:htpasswd htpasswd',
    usage: 'Encuentra archivos htpasswd expuestos.',
    category: 'security',
  },
  {
    id: 'sec-sql-error',
    operator: 'intext:"sql syntax near"',
    description: 'Errores SQL expuestos.',
    example: 'intext:"sql syntax near" "on line"',
    usage: 'Localiza aplicaciones que muestran errores de base de datos.',
    category: 'security',
  },
  {
    id: 'sec-backup',
    operator: 'ext:sql OR ext:bak OR ext:old',
    description: 'Archivos de respaldo expuestos.',
    example: 'site:example.com ext:bak',
    usage: 'Busca backups de archivos o bases de datos.',
    category: 'security',
  },
  {
    id: 'sec-robots',
    operator: 'inurl:robots.txt',
    description: 'Archivos robots.txt.',
    example: 'site:example.com inurl:robots.txt',
    usage: 'Descubre rutas ocultas listadas en robots.txt.',
    category: 'security',
  },
  {
    id: 'sec-sitemap',
    operator: 'inurl:sitemap.xml',
    description: 'Archivos sitemap.',
    example: 'site:example.com inurl:sitemap.xml',
    usage: 'Enumera URLs indexadas en sitemaps.',
    category: 'security',
  },
  {
    id: 'sec-wordpress',
    operator: 'inurl:wp-content',
    description: 'Sitios WordPress.',
    example: 'inurl:wp-content "index of"',
    usage: 'Encuentra directorios de plugins/themes expuestos.',
    category: 'security',
  },
  {
    id: 'sec-cpanel',
    operator: 'inurl:cpanel',
    description: 'cPanel expuesto.',
    example: 'inurl:cpanel "login"',
    usage: 'Localiza logins de cPanel accesibles.',
    category: 'security',
  },
  {
    id: 'sec-jenkins',
    operator: 'intitle:"Dashboard [Jenkins]"',
    description: 'Jenkins expuesto.',
    example: 'intitle:"Dashboard [Jenkins]" "Manage Jenkins"',
    usage: 'Encuentra paneles de Jenkins sin protección.',
    category: 'security',
  },
  {
    id: 'sec-kibana',
    operator: 'intitle:"Kibana"',
    description: 'Kibana expuesto.',
    example: 'intitle:"Kibana" "Management"',
    usage: 'Localiza instancias de Kibana accesibles.',
    category: 'security',
  },
  {
    id: 'sec-aws-keys',
    operator: 'intext:"AKIA"',
    description: 'Claves de acceso de AWS.',
    example: 'intext:"AKIA" "aws_access_key_id"',
    usage: 'Busca claves AKIA expuestas en código o logs.',
    category: 'security',
  },
  {
    id: 'sec-private-key',
    operator: 'intitle:"index of" "private.key"',
    description: 'Claves privadas expuestas.',
    example: 'intitle:"index of" "id_rsa"',
    usage: 'Encuentra claves SSH privadas expuestas.',
    category: 'security',
  },
  {
    id: 'sec-password',
    operator: 'intitle:"index of" "password"',
    description: 'Archivos con contraseñas.',
    example: 'intitle:"index of" "password.txt"',
    usage: 'Busca listados de contraseñas expuestos.',
    category: 'security',
  },
  {
    id: 'sec-api-docs',
    operator: 'inurl:swagger-ui.html',
    description: 'Documentación Swagger expuesta.',
    example: 'inurl:swagger-ui.html "API"',
    usage: 'Localiza interfaces de Swagger accesibles.',
    category: 'security',
  },
]

export function getCategories(): Category[] {
  return categories
}

export function getDorks(): Dork[] {
  return dorks
}

export function getDorksByCategory(categoryId: string): Dork[] {
  return dorks.filter((dork) => dork.category === categoryId)
}

export function searchDorks(query: string, categoryId?: string): Dork[] {
  const lowerQuery = query.toLowerCase()
  return dorks.filter((dork) => {
    const matchesCategory = !categoryId || dork.category === categoryId
    const matchesQuery =
      dork.operator.toLowerCase().includes(lowerQuery) ||
      dork.description.toLowerCase().includes(lowerQuery) ||
      dork.example.toLowerCase().includes(lowerQuery) ||
      dork.usage.toLowerCase().includes(lowerQuery)
    return matchesCategory && matchesQuery
  })
}
