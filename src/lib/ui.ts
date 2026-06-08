import type { Locale } from './content';

// Shape: flat key → { en, pt-BR? }. pt-BR is optional; missing entries
// fall back to EN so a missing translation never surfaces as an empty
// string or a raw key.
const strings = {
  'nav.papers': { en: 'Papers', 'pt-BR': 'Artigos' },
  'nav.posts': { en: 'Posts', 'pt-BR': 'Posts' },
  'nav.about': { en: 'About', 'pt-BR': 'Sobre' },
  'nav.cv': { en: 'CV', 'pt-BR': 'CV' },
  'nav.newsletter': { en: 'Newsletter', 'pt-BR': 'Newsletter' },
  'search.placeholder': { en: 'Search\u2026', 'pt-BR': 'Buscar\u2026' },
  'search.label': { en: 'Search posts and papers', 'pt-BR': 'Buscar posts e artigos' },
  'search.empty': { en: 'Type to search\u2026', 'pt-BR': 'Digite para buscar\u2026' },
  'search.no-results': { en: 'No results.', 'pt-BR': 'Nenhum resultado.' },
  'search.loading': { en: 'Loading\u2026', 'pt-BR': 'Carregando\u2026' },
  'search.close': { en: 'Close', 'pt-BR': 'Fechar' },
  'search.filter.all': { en: 'All', 'pt-BR': 'Tudo' },
  'search.filter.papers': { en: 'Papers', 'pt-BR': 'Artigos' },
  'search.filter.posts': { en: 'Posts', 'pt-BR': 'Posts' },
  'site.subtitle': {
    en: 'Computer Science · Papers and Posts',
    'pt-BR': 'Ciência da Computação · Artigos e Posts',
  },
  'listing.papers.title': { en: 'Papers', 'pt-BR': 'Artigos' },
  'listing.papers.description': {
    en: 'Computer-science papers by Eduardo Kohn.',
    'pt-BR': 'Artigos de Ciência da Computação por Eduardo Kohn.',
  },
  'listing.posts.title': { en: 'Posts', 'pt-BR': 'Posts' },
  'listing.posts.description': {
    en: 'Short technical posts by Eduardo Kohn.',
    'pt-BR': 'Posts técnicos curtos por Eduardo Kohn.',
  },
  'listing.tags.title': { en: 'Tags', 'pt-BR': 'Tags' },
  'listing.tags.description': {
    en: 'Browse papers and posts by topic.',
    'pt-BR': 'Navegue artigos e posts por assunto.',
  },
  'home.featured': { en: 'Featured', 'pt-BR': 'Destaque' },
  'home.recent-posts': { en: 'Recent Posts', 'pt-BR': 'Posts Recentes' },
  'home.tags': { en: 'Tags', 'pt-BR': 'Tags' },
  'kind.paper': { en: 'Paper', 'pt-BR': 'Artigo' },
  'kind.post': { en: 'Post', 'pt-BR': 'Post' },
  'footer.rss': { en: 'RSS', 'pt-BR': 'RSS' },
  'footer.newsletter': { en: 'Newsletter', 'pt-BR': 'Newsletter' },
  'footer.github': { en: 'GitHub', 'pt-BR': 'GitHub' },
  'tag.entriesCount': { en: 'entries', 'pt-BR': 'itens' },
  'about.title': { en: 'About', 'pt-BR': 'Sobre' },
  'cv.title': { en: 'Curriculum Vitae', 'pt-BR': 'Currículo' },
  'newsletter.title': { en: 'Newsletter', 'pt-BR': 'Newsletter' },
  'newsletter.lead': {
    en: 'One email when I publish a new paper or post. No spam, unsubscribe anytime.',
    'pt-BR': 'Um email quando eu publicar um artigo ou post novo. Sem spam, cancele quando quiser.',
  },
  'newsletter.email.label': { en: 'Email address', 'pt-BR': 'Endereço de email' },
  'newsletter.email.placeholder': { en: 'you@example.com', 'pt-BR': 'voce@exemplo.com' },
  'newsletter.subscribe': { en: 'Subscribe', 'pt-BR': 'Inscrever-se' },
  'lang.toggle.label.to-en': { en: 'EN — Switch to English', 'pt-BR': 'EN — Alternar para inglês' },
  'lang.toggle.label.to-pt': {
    en: 'PT — Switch to Portuguese (BR)',
    'pt-BR': 'PT — Alternar para português (BR)',
  },
  'viewport.narrow.title': {
    en: 'This paper needs a wider screen',
    'pt-BR': 'Este artigo precisa de uma tela maior',
  },
  'viewport.narrow.body': {
    en: 'Its diagrams and terminal output are built for a display at least 1024px wide. Open it on a larger screen to read comfortably.',
    'pt-BR':
      'Os diagramas e as saídas de terminal são feitos para uma tela de pelo menos 1024px de largura. Abra em um monitor maior para ler com conforto.',
  },
  'viewport.narrow.post.title': {
    en: 'This post needs a wider screen',
    'pt-BR': 'Este post precisa de uma tela maior',
  },
  'viewport.narrow.post.body': {
    en: 'It is formatted for a display at least 1024px wide. Open it on a larger screen to read comfortably.',
    'pt-BR':
      'Ele é formatado para uma tela de pelo menos 1024px de largura. Abra em um monitor maior para ler com conforto.',
  },
} as const;

export type UiKey = keyof typeof strings;

export function t(locale: Locale, key: UiKey): string {
  const entry = strings[key] as Partial<Record<Locale, string>> & { en: string };
  return entry[locale] ?? entry.en;
}
