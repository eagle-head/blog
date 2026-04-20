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
  'lang.toggle.label.to-en': { en: 'Switch to English', 'pt-BR': 'Alternar para inglês' },
  'lang.toggle.label.to-pt': {
    en: 'Switch to Portuguese (BR)',
    'pt-BR': 'Alternar para português (BR)',
  },
} as const;

export type UiKey = keyof typeof strings;

export function t(locale: Locale, key: UiKey): string {
  const entry = strings[key] as Partial<Record<Locale, string>> & { en: string };
  return entry[locale] ?? entry.en;
}
