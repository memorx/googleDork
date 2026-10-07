// Playbooks OSINT: guías metodológicas paso a paso. Los pasos referencian
// recetas, dorks o motores existentes del catálogo cuando aplica.

export interface PlaybookStep {
  title: string
  description: string
  recipeId?: string
  dorkId?: string
  engineId?: string
}

export interface Playbook {
  id: string
  name: string
  description: string
  icon?: string
  steps: PlaybookStep[]
}

export const playbooks: Playbook[] = [
  {
    id: 'recon-dominio',
    name: 'Recon de dominio completo',
    description:
      'Metodología pasiva para mapear un dominio propio: subdominios, historial, servicios y filtraciones, sin tocar el objetivo.',
    icon: '🎯',
    steps: [
      {
        title: 'Enumerar subdominios por certificados',
        description:
          'Los registros de Certificate Transparency son públicos y revelan subdominios incluso no enlazados. Cambiá ejemplo.com por tu dominio.',
        recipeId: 'subdominios-crtsh',
      },
      {
        title: 'Mapear el sitio principal en Google',
        description:
          'Con site: acotás todos los resultados al dominio y descubrís qué tiene indexado el buscador.',
        dorkId: 'site',
      },
      {
        title: 'Revisar el historial en la Wayback Machine',
        description:
          'Los snapshots históricos muestran endpoints retirados, documentos eliminados y tecnologías antiguas.',
        recipeId: 'historial-wayback',
      },
      {
        title: 'Localizar portales de correo y accesos',
        description:
          'Webmails y portales de login expuestos son los puntos de entrada habituales del phishing con credenciales.',
        recipeId: 'webmails-empresa',
      },
      {
        title: 'Inventariar servicios expuestos',
        description:
          'En Shodan, hostname:tudominio.com lista puertos, banners y servicios que responden por el dominio.',
        engineId: 'shodan',
      },
      {
        title: 'Buscar código y secretos filtrados',
        description:
          'Revisá si hay archivos .env o credenciales del dominio publicados en repositorios de GitHub.',
        recipeId: 'secretos-github',
      },
      {
        title: 'Documentar y exportar el kit',
        description:
          'Usá el panel "Recon de objetivo" para generar todas las queries y exportar el kit de auditoría en Markdown.',
      },
    ],
  },
  {
    id: 'auditoria-empresa',
    name: 'Auditoría de una empresa',
    description:
      'Recorrido por la superficie expuesta de una organización: nube, código, errores y paneles. Siempre con autorización escrita.',
    icon: '🏢',
    steps: [
      {
        title: 'Definir alcance y dominios autorizados',
        description:
          'Anotá los dominios y razones sociales incluidos en la autorización. Todo lo demás queda fuera de alcance.',
      },
      {
        title: 'Revisar robots.txt y sitemaps indexados',
        description:
          'Los robots.txt y sitemap.xml de los dominios en alcance revelan rutas que la organización prefiere ocultar o publicar.',
        dorkId: 'sec-robots',
      },
      {
        title: 'Buscar buckets y almacenamiento en la nube',
        description:
          'Los buckets S3 públicos con el nombre de la empresa suelen contener respaldos y documentos internos.',
        recipeId: 'buckets-s3-empresa',
      },
      {
        title: 'Detectar repositorios .git expuestos',
        description:
          'Un .git servido por HTTP entrega el código fuente completo con su historial de commits.',
        recipeId: 'git-expuestos',
      },
      {
        title: 'Encontrar errores SQL visibles',
        description:
          'Las apps que imprimen errores de base de datos confirman entrada sin sanitizar: posible inyección SQL.',
        recipeId: 'errores-sql-php',
      },
      {
        title: 'Verificar dashboards sin autenticación',
        description:
          'Grafana, Kibana y Prometheus sin login exponen la infraestructura interna y métricas de negocio.',
        recipeId: 'grafana-sin-login',
      },
      {
        title: 'Relevar servicios y bases de datos',
        description:
          'Cerrá el relevamiento buscando servicios de la organización en Shodan: puertos, productos y versiones.',
        engineId: 'shodan',
      },
    ],
  },
  {
    id: 'osint-persona',
    name: 'OSINT de persona',
    description:
      'Huella digital pública de una persona (por ejemplo, vos mismo): perfiles, documentos y correos expuestos. Solo con fines legítimos.',
    icon: '👤',
    steps: [
      {
        title: 'Buscar el nombre exacto entre comillas',
        description:
          'La búsqueda de frase exacta con el nombre y apellido es la base: filtra coincidencias parciales.',
        dorkId: 'exact-phrase',
      },
      {
        title: 'Localizar perfiles de LinkedIn',
        description:
          'Los perfiles públicos de LinkedIn revelan empleador, puesto y trayectoria laboral.',
        dorkId: 'site-linkedin',
      },
      {
        title: 'Revisar redes sociales y menciones',
        description:
          'Buscá el nombre o alias dentro de X/Twitter para encontrar cuentas y conversaciones públicas.',
        dorkId: 'site-twitter',
      },
      {
        title: 'Encontrar CVs y documentos públicos',
        description:
          'Los currículums en PDF indexados contienen teléfono, correo y a veces dirección.',
        recipeId: 'cvs-desarrolladores',
      },
      {
        title: 'Detectar correos electrónicos expuestos',
        description:
          'Las direcciones de correo publicadas en páginas son el vector principal de phishing dirigido.',
        dorkId: 'email-gmail',
      },
      {
        title: 'Verificar credenciales filtradas',
        description:
          'Comprobá si el correo aparece en combos de filtraciones conocidas; complementalo con haveibeenpwned.com.',
        dorkId: 'cred-txt-emailpass',
      },
    ],
  },
  {
    id: 'caza-secretos',
    name: 'Caza de secretos filtrados',
    description:
      'Búsqueda sistemática de credenciales, tokens y claves publicadas por error, priorizando fuentes pasivas.',
    icon: '🔑',
    steps: [
      {
        title: 'Archivos .env en GitHub',
        description:
          'Los .env con DB_PASSWORD son la filtración más común: credenciales de base de datos en texto plano.',
        recipeId: 'secretos-github',
      },
      {
        title: 'Tokens de Slack commiteados',
        description:
          'El prefijo xoxb- identifica tokens de bot de Slack: con uno válido se controla el bot del workspace.',
        recipeId: 'tokens-slack-github',
      },
      {
        title: 'Claves live de Stripe en páginas',
        description:
          'Las sk_live jamás deberían aparecer en una página indexada: permiten operar la cuenta de cobros.',
        dorkId: 'token-stripe-live',
      },
      {
        title: 'Repositorios .git accesibles vía web',
        description:
          'Un .git expuesto permite reconstruir el código completo y buscar secretos en todo el historial.',
        dorkId: 'ghdb-git-config',
      },
      {
        title: 'Credenciales en archivos CSV',
        description:
          'Exports de usuarios con columnas username,password: filtraciones listas para credential stuffing.',
        dorkId: 'cred-csv-userpass',
      },
      {
        title: 'Claves privadas RSA publicadas',
        description:
          'Bloques BEGIN RSA PRIVATE KEY pegados en páginas o pastebins indexados comprometen servidores y firmas.',
        dorkId: 'token-rsa-intext',
      },
      {
        title: 'Reportar de forma responsable',
        description:
          'Si encontrás secretos ajenos válidos, notificá al propietario por canales privados. Nunca los uses ni los difundas.',
      },
    ],
  },
]

export function getPlaybooks(): Playbook[] {
  return playbooks
}

export function getPlaybookById(playbookId: string): Playbook | undefined {
  return playbooks.find((playbook) => playbook.id === playbookId)
}
