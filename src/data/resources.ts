// Recursos OSINT curados: referencias externas para aprender y profundizar.

export interface OsintResource {
  id: string
  name: string
  url: string
  description: string
  category: string
}

export const resources: OsintResource[] = [
  {
    id: 'ghdb',
    name: 'Google Hacking Database (GHDB)',
    url: 'https://www.exploit-db.com/google-hacking-database',
    description: 'La base oficial de dorks mantenida por OffSec: miles de queries categorizadas.',
    category: 'Bases de dorks',
  },
  {
    id: 'osint-framework',
    name: 'OSINT Framework',
    url: 'https://osintframework.com/',
    description: 'Árbol interactivo de herramientas OSINT clasificadas por tipo de dato objetivo.',
    category: 'Frameworks',
  },
  {
    id: 'bellingcat-toolkit',
    name: 'Bellingcat Online Investigations Toolkit',
    url: 'https://docs.google.com/spreadsheets/d/18rtqh8EG2q1xBo2cLNyhIDuK9jrPGwYr9DI2UncoqJQ',
    description: 'Planilla curada por Bellingcat con cientos de herramientas de investigación abierta.',
    category: 'Frameworks',
  },
  {
    id: 'shodan-docs',
    name: 'Documentación de Shodan',
    url: 'https://help.shodan.io/',
    description: 'Guías oficiales de filtros y de la API del motor de búsqueda de dispositivos.',
    category: 'Documentación',
  },
  {
    id: 'google-operators',
    name: 'Operadores de búsqueda de Google',
    url: 'https://support.google.com/websearch/answer/2466433',
    description: 'Referencia oficial de Google sobre los operadores de búsqueda avanzada.',
    category: 'Documentación',
  },
  {
    id: 'wayback-machine',
    name: 'Wayback Machine',
    url: 'https://web.archive.org/',
    description: 'Archivo histórico de la web: snapshots de páginas y documentos eliminados.',
    category: 'Archivo',
  },
  {
    id: 'crtsh',
    name: 'crt.sh',
    url: 'https://crt.sh/',
    description: 'Búsqueda en registros de Certificate Transparency para enumerar subdominios.',
    category: 'Certificados',
  },
  {
    id: 'haveibeenpwned',
    name: 'Have I Been Pwned',
    url: 'https://haveibeenpwned.com/',
    description: 'Verifica si un correo o teléfono aparece en filtraciones de datos conocidas.',
    category: 'Brechas',
  },
  {
    id: 'mitre-recon',
    name: 'MITRE ATT&CK: Reconnaissance',
    url: 'https://attack.mitre.org/tactics/TA0043/',
    description: 'Taxonomía de las técnicas de reconocimiento usadas por adversarios reales.',
    category: 'Metodología',
  },
  {
    id: 'urlscan',
    name: 'urlscan.io',
    url: 'https://urlscan.io/',
    description: 'Escaneo y análisis de sitios web: capturas, requests y tecnologías detectadas.',
    category: 'Análisis web',
  },
]

export function getResources(): OsintResource[] {
  return resources
}
