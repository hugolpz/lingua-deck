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
    "repos": "lingua-libre/WikibaseSerializationJavaScript",
    "link": "https://github.com/lingua-libre/WikibaseSerializationJavaScript/",
    "source": "github",
    "name": "wikibase-serialization-js"
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
  },/* // Sparql2Data : Mostly nightly bot update of the data
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
    "repos": "lingua-libre/LingualibreDownloadToolJS",
    "link": "https://github.com/lingua-libre/LingualibreDownloadToolJS/",
    "source": "github",
    "name": "lingualibre-download-tool-js"
  },
];