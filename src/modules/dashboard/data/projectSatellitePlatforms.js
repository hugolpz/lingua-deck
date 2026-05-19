import commonsLogo from '../../assets/Commons-logo.svg';
import metaLogo from '../../assets/Wikimedia_Community_Logo.svg';
import wikipediaLogo from '../../assets/Wikipedia-logo-v2.svg';
import wikidataLogo from '../../assets/Wikidata_Favicon_color.svg'; // Wikidata-logo.svg
import gitlabLogo from '../../assets/GitLab_icon.svg';
import githubLogo from '../../assets/Github-desktop-logo-symbol.svg';
import phabricatorLogo from '../../assets/Favicon-Phabricator-WM.svg';

export const API_ENDPOINTS = {
  commons: {
    api: "https://commons.wikimedia.org/w/api.php", 
    link: "https://commons.wikimedia.org/wiki/",
    logo: commonsLogo,
    name: "Wikimedia Commons"
  },
  meta: {
    api: "https://meta.wikimedia.org/w/api.php", 
    link: "https://meta.wikimedia.org/wiki/",
    logo: metaLogo,
    name: "Meta-Wiki"
  },
  wikipedia: {
    api: "https://fr.wikipedia.org/w/api.php", 
    link: "https://fr.wikipedia.org/wiki/",
    logo: wikipediaLogo,
    name: "Wikipedia (fr)"
  },/*
  wikipediaOc: {
    api: "https://oc.wikipedia.org/w/api.php", 
    link: "https://oc.wikipedia.org/wiki/",
    logo: wikipediaLogo,
    name: "Wikipedia (oc)"
  }, */
  wikidata: {
    api: "https://www.wikidata.org/w/api.php", 
    link: "https://www.wikidata.org/wiki/",
    logo: wikidataLogo,
    name: "Wikidata"
  },
  gitlab: {
    api: "https://gitlab.wikimedia.org/api/v4/projects/repos%2FREPOSITORY/repository/commits",
    link: "https://gitlab.wikimedia.org/repos/REPOSITORY/",
    logo: gitlabLogo,
    name: "Gitlab"
  },
  github: {
    api: "https://api.github.com/repos/REPOSITORY/commits", 
    link: "https://github.com/USER/REPOSITORY/commits",
    logo: githubLogo,
    name: "Github"
  },
  phabricator: {
    token: "api-4xolyuqwec2tbo3o5ntq37h4j43k",
    api: "https://phabricator.wikimedia.org/api/",
    link: "https://phabricator.wikimedia.org/tag/lingua-libre/",
    logo: phabricatorLogo,
    name: "Phabricator"
  }
};

export const topPagesBySource = {
  commons:   [ "Help:Lingua Libre", "Commons:Lingua_Libre", "Commons talk:Lingua Libre" ],
  meta:      [ "Lingua Libre", "WikiTutur","Wikimedia Côte d'Ivoire/Groupe de Travail/Lingua Libre" ],
  wikipedia: [ "Lingua Libre", "Projet:Langues de France", "Projet:Lingua Libre", "Projet:Oc-a-thon" ],
  wikidata:  [ "Q60024037" ],
};
export const topCategories = ['Category:Lingua Libre', 'Category:WikiTutur']; // commons and meta
export const topGitRepos =[
  // 2024-26 version : Poslovitch, Pushkar, hugolpz. 
  {
    "repos": "wikimedia-france/lingua-libre/operations",
    "link": "https://gitlab.wikimedia.org/repos/wikimedia-france/lingua-libre/operations/",
    "source": "gitlab",
    "name": "operations"
  },
  {
    "repos": "wikimedia-france/lingua-libre/lingua-libre",
    "link": "https://gitlab.wikimedia.org/repos/wikimedia-france/lingua-libre/lingua-libre/",
    "source": "gitlab",
    "name": "lingua-libre"
  },
  {
    "repos": "wikimedia-france/lingua-libre/lingualibre.org",
    "link": "https://gitlab.wikimedia.org/repos/wikimedia-france/lingua-libre/lingualibre.org/",
    "source": "gitlab",
    "name": "lingualibre-org"
  },
  // 2016 Version : Vion
  {
    "repos": "wikimedia-france/Lingua-Libre",
    "link": "https://github.com/wikimedia-france/Lingua-Libre/",
    "source": "github",
    "name": "lingua-libre-legacy"
  },
  // 2018 version : 0x010C, hugolpz, Poslovitch
  {
    "repos": "lingua-libre/RecordWizard",
    "link": "https://github.com/lingua-libre/RecordWizard/",
    "source": "github",
    "name": "record-wizard"
  },
  {
    "repos": "lingua-libre/BlueLL",
    "link": "https://github.com/lingua-libre/BlueLL/",
    "source": "github",
    "name": "blue-ll"
  },
  {
    "repos": "lingua-libre/LinguaRecorder",
    "link": "https://github.com/lingua-libre/LinguaRecorder/",
    "source": "github",
    "name": "lingua-recorder"
  },
  {
    "repos": "lingua-libre/Lingua-Libre-Bot",
    "link": "https://github.com/lingua-libre/Lingua-Libre-Bot/",
    "source": "github",
    "name": "lingua-libre-bot"
  },
  {
    "repos": "lingua-libre/QueryViz",
    "link": "https://github.com/lingua-libre/QueryViz/",
    "source": "github",
    "name": "query-viz"
  },
  {
    "repos": "lingua-libre/CustomSubtitle",
    "link": "https://github.com/lingua-libre/CustomSubtitle/",
    "source": "github",
    "name": "custom-subtitle"
  },
  {
    "repos": "lingua-libre/Upload2Commons",
    "link": "https://github.com/lingua-libre/Upload2Commons/",
    "source": "github",
    "name": "upload-2-commons"
  },
  {
    "repos": "lingua-libre/operations",
    "link": "https://github.com/lingua-libre/operations/",
    "source": "github",
    "name": "operations-ll"
  },
  {
    "repos": "lingua-libre/llskin",
    "link": "https://github.com/lingua-libre/llskin/",
    "source": "github",
    "name": "ll-skin"
  },
  // Addons by ?
  {
    "repos": "lingua-libre/CommonsDownloadTool",
    "link": "https://github.com/lingua-libre/CommonsDownloadTool/",
    "source": "github",
    "name": "commons-download-tool"
  },
  // Addons by hugolpz
  {
    "repos": "lingua-libre/SignIt",
    "link": "https://github.com/lingua-libre/SignIt/",
    "source": "github",
    "name": "sign-it"
  },
  {
    "repos": "hugolpz/LanguagesGallery",
    "link": "https://github.com/hugolpz/LanguagesGallery/",
    "source": "github",
    "name": "languages-gallery"
  },
  /* // Sparql2Data : Mostly nightly bot update of the data
  {
    "repos": "hugolpz/Sparql2Data",
    "link": "https://github.com/hugolpz/Sparql2Data/",
    "source": "github",
    "name": "sparql2data"
  },*/
  {
    "repos": "hugolpz/Lingualibre-inventory-tool",
    "link": "https://github.com/hugolpz/Lingualibre-inventory-tool/",
    "source": "github",
    "name": "lingualibre-inventory-tool"
  },
  {
    "repos": "lingua-libre/unilex-extended",
    "link": "https://github.com/lingua-libre/unilex-extended/",
    "source": "github",
    "name": "unilex-extended"
  },
  {
    "repos": "hugolpz/NamesOfTheLand",
    "link": "https://github.com/hugolpz/NamesOfTheLand/",
    "source": "github",
    "name": "names-of-the-land"
  },
  {
    "repos": "nethahussain/lingualibre-ml-wikt-bot",
    "link": "https://github.com/nethahussain/lingualibre-ml-wikt-bot",
    "source": "github",
    "name": "lingualibre-ml-wikt-bot"
  },
  /* somehow buggy
  {
    "repos": "lingua-libre/LingualibreDownloadToolJS",
    "link": "https://github.com/lingua-libre/LingualibreDownloadToolJS/",
    "source": "github",
    "name": "lingualibre-download-tool-js"
  }, */
];

export const CHART_COLORS = [
  '#ffc107', '#17a2b8', '#007bff', '#28a745', '#e83e8c', 
  '#fd7e14', '#6f42c1', '#f03e3e', '#4057c0', '#20c997'
];

const specificColors = {
  '0': '#ffc107',     // Yellow
  '2': '#17a2b8',     // Cyan
  '4': '#3366CC',     // Blue
  '6': '#28a745',     // Green
  '10': '#e83e8c',    // Pink
  '12': '#fd7e14',    // Orange
  '14': '#6f42c1',    // Purple
  '102': '#59a8fc',   // Blue
  '1198': '#6c757d',  // Gray
  '6913': '#006699', // WMF blue
  '3393': '#3399CC', // WMF blue-lite
  '-1': '#e24329',    // From logo: dark-orange #e24329, orange #fc6d26, light-orange: #fca326
  '-2': '#892793',    // From logo: mid-purple #892793, dark-purple #492779
  'unknown': '#C0C0C0'
};

export const getNamespaceInfo = (ns, sourceKey) => {
  const mapping = namespaceMapping[ns];
  const sourceName = API_ENDPOINTS[sourceKey]?.name || sourceKey;
  
  let label = mapping?.name || `Namespace ${ns}`;
  let color = mapping?.color || getSharedColor(ns);

  // Source-aware overrides for common namespaces
  if (ns === '0' || ns === 0) {
    if (sourceKey === 'wikidata') label = 'Item';
    else label = `Main (${sourceName})`;
  } else if (ns === '102') {
    label = `Project (${sourceName})`;
  }

  return { name: label, color };
};

export const getSharedColor = (key, index = null) => {
  if (specificColors[key]) return specificColors[key];
  
  if (index !== null && index >= 0) {
    return CHART_COLORS[index % CHART_COLORS.length];
  }

  const intKey = parseInt(key, 10);
  if (!isNaN(intKey) && String(intKey) === String(key)) {
    const hue = (intKey * 137.508) % 360;
    return `hsl(${hue}, 60%, 50%)`;
  }

  let hash = 0;
  for (let i = 0; i < String(key).length; i++) {
    hash = String(key).charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 60%, 50%)`;
};

export const namespaceMapping = {
  '0': { name: 'Main (Meta)', color: getSharedColor('0') },
  // '1': { name: 'Talk' },
  // '2': { name: 'User', color: getSharedColor('2') },
  // '3': { name: 'User talk' },
  '4': { name: 'Commons:Lingua Libre', color: getSharedColor('4') },
  // 'Commons:Lingua Libre/List/',
  '5': { name: 'Commons talk:Lingua Libre', color: getSharedColor('5') },
  '6': { name: 'File', color: getSharedColor('6') },
  // '7': { name: 'File talk' },
  // '8': { name: 'MediaWiki' },
  // '9': { name: 'MediaWiki talk' },
  '10': { name: 'Template', color: getSharedColor('10') },
  '11': { name: 'Template talk', color: getSharedColor('11') },
  '12': { name: 'Help:Lingua Libre', color: getSharedColor('12') },
  '13': { name: 'Help talk:Lingua Libre', color: getSharedColor('13') },
  '14': { name: 'Category', color: getSharedColor('14') },
  // '15': { name: 'Category talk' },
  '102': { name: 'Project (Wikipedia)', color: getSharedColor('102') },
  // '106': { name: 'Institution' },
  '200': { name: 'Grants (Meta)', color: getSharedColor('200') },
  '1198': { name: 'Translations', color: getSharedColor('1198') },
  // Phabricators
  '6913': { name: 'Phabricator (lingua-libre)', color: getSharedColor('6913') },
  '3393': { name: 'Phabricator (lingua-libre-legacy)', color: getSharedColor('3393') },
  // Gitlab
  '-1': { name: 'Gitlab Commits', color: getSharedColor('-1') },
  // Github
  '-2': { name: 'Github Commits', color: getSharedColor('-2') },
  // Others
  'unknown': { name: 'Others', color: getSharedColor('unknown') }
};
