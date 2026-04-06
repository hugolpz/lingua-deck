import commonsLogo from '../../assets/Commons-logo.svg';
import metaLogo from '../../assets/Wikimedia_Community_Logo.svg';
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

export const topPages = ['Help:Lingua Libre', 'Commons:Lingua_Libre', "Commons talk:Lingua Libre", "Lingua Libre"];
export const topCategories = ['Category:Lingua Libre'];
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
  '4': '#007bff',     // Blue
  '6': '#28a745',     // Green
  '10': '#e83e8c',    // Pink
  '12': '#fd7e14',    // Orange
  '14': '#6f42c1',    // Purple
  '1198': '#6c757d',  // Gray
  '-1': '#f03e3e',    // Red
  '-2': '#4057c0',    // Dark blue
  'unknown': '#adb5bd'
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
  // '106': { name: 'Institution' },
  '200': { name: 'Grants (Meta)', color: getSharedColor('200') },
  '1198': { name: 'Translations', color: getSharedColor('1198') },
  '6913': { name: 'Phabricator (lingua-libre)', color: getSharedColor('6913') },
  '3393': { name: 'Phabricator (lingua-libre-legacy)', color: getSharedColor('3393') },
  '-1': { name: 'Gitlab Commits', color: getSharedColor('-1') },
  '-2': { name: 'Github Commits', color: getSharedColor('-2') },
  'unknown': { name: 'Others', color: getSharedColor('unknown') }
};