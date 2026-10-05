import { links } from '@/router/links'

// Footer content: columns of links, with optional nested `children` (rendered with › / ››).
// Item: { title, to?, external?, doc?, enabled?, countCategory?, countLabel?, note?, children? }
//  - `to`: absolute path (router-link) or https:// URL (external link); no `to` = plain label
//  - `enabled: false` hides the item (page not built yet)
//  - `countCategory`: Commons category whose member count is fetched live (see AppFooter.vue)
//  - `note`: static text shown when no live count is available

const COMMONS = 'https://commons.wikimedia.org/wiki/'
const META = 'https://meta.wikimedia.org/wiki/'

// Same labels as the top bar, one source of truth
const fromLinks = (to) => links.find((l) => l.to === to)

export const footerGroups = [
  {
    title: 'Foundational tools',
    items: [
      { title: 'UNILEX', to: 'https://github.com/unicode-org/unilex' },
      { title: 'Small Wikis Lexicons', to: '/incubators' },
      {
        title: 'Lingua Libre recording app',
        to: 'https://lingualibre.org/app',
        children: [{ title: 'Source', to: 'https://gitlab.wikimedia.org/lingua-libre/' }],
      },
      { title: 'Dragons Bot', to: 'https://github.com/hugolpz/Dragons_Bot/' },
      { title: 'Lingua Libre Bot', to: 'https://github.com/lingua-libre/Lingua-Libre-Bot/' },
      {
        title: 'Userscripts',
        children: [
          { title: 'RoR.js (Rename or Replace)', to: `${META}User:Yug/RenameOrReplace` },
          { title: 'Swadesh augmenter', to: `${META}User:Yug/Lingualibre_list_augmenter` },
        ],
      },
      { title: 'Rapid Dictionary', to: '/dictionary', doc: `${COMMONS}Commons:Lingua_Libre/Dictionary` },
    ],
  },
  {
    title: 'Explore Lingua Libre',
    items: [
      { title: 'Recording app', to: 'https://lingualibre.org' },
      { title: 'Commons:Lingua Libre', to: `${COMMONS}Commons:Lingua_Libre` },
      { title: 'Chatroom', to: `${COMMONS}Commons_talk:Lingua_Libre` },
      {
        title: 'Lists',
        to: `${COMMONS}Commons:Lingua_Libre/List`,
        countCategory: 'Category:Lingua_Libre_lists_by_language',
        countLabel: 'languages',
        note: '+5,500',
        children: [
          { title: 'Lists by language', to: `${COMMONS}Category:Lingua_Libre_lists_by_language`, countCategory: 'Category:Lingua_Libre_lists_by_language' },
          { title: 'Lists by quality', to: `${COMMONS}Category:Lingua_Libre_lists_by_quality`, countCategory: 'Category:Lingua_Libre_lists_by_quality' },
          { title: 'Lists of most requested by language', to: `${COMMONS}Category:Lingua_Libre_list/Method:refreshed`, countCategory: 'Category:Lingua_Libre_list/Method:refreshed' },
          { title: 'Exclusion lists', to: `${COMMONS}Category:Lingua_Libre_exclusion_lists`, countCategory: 'Category:Lingua_Libre_exclusion_lists' },
        ],
      },
    ],
  },
  {
    title: 'Analyse Lingua Libre',
    items: [
      fromLinks('/gallery'),
      fromLinks('/languages'),
      fromLinks('/recordists'),
      fromLinks('/supports'),
      fromLinks('/logs'),
      {
        title: 'Transparency',
        to: '/transparency',
        children: [
          { title: 'Lingua Libre past missions', to: `${META}Lingua_Libre/Supports` },
          { title: 'Lingua Libre past budgets', to: '/transparency/lingualibre' },
          { title: 'WMFR spendings', to: '/transparency/wmfr' },
        ],
      },
    ].filter(Boolean),
  },
  {
    title: 'About',
    items: [
      { title: 'About Lingua Libre', to: `${META}Lingua_Libre` },
      { title: 'About Lingua Deck', to: 'https://github.com/hugolpz/lingua-deck' },
      // Digest is not built yet: flip `enabled` when the page exists
      { title: 'Changelog', to: '/changelog' },
      { title: 'Digest', to: '/digest', enabled: false },
      {
        title: 'About author',
        children: [
          { title: 'GitHub', to: 'https://github.com/hugolpz' },
          { title: 'Gitlab', to: 'https://gitlab.wikimedia.org/users/yug/contributed' },
          { title: 'Meta', to: `${META}User:Yug` },
          { title: 'Toolhub+', to: 'https://toolhub-evolved.toolforge.org/people/yug-d746' },
        ],
      },
    ],
  },
]
