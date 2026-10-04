export const data = {
  "sponsors": [
    { "id": "wmf", "name": "Wikimedia Foundation", "type": "Foundation" },
    { "id": "wmfr", "name": "Wikimedia France", "type": "Chapter" },
    { "id": "wmch", "name": "Wikimedia Suisse", "type": "Chapter" },
    { "id": "wmca", "name": "Wikimedia Canada", "type": "Chapter" },
    { "id": "wmpt", "name": "Wikimedia Portugal", "type": "Chapter" },
    { "id": "wmid", "name": "Wikimedia Indonesia", "type": "Chapter" },
    { "id": "wmf-irg", "name": "India Rapid Project grants", "type": "Foundation" },
    { "id": "gsoc", "name": "Google Summer of Code", "type": "Company" },
    { "id": "mesr", "name": "Ministère de l'enseignement supérieur et de la recherche", "type": "Institution" },
    { "id": "dglflf", "name": "Direction Générale de la Langue Française et des Langues de France", "type": "Institution" },
    { "id": "2if", "name": "Institut International pour la Francophonie", "type": "Chapter" },
    { "id": "uppa", "name": "Université de Pau Pays de l'Adour", "type": "Institution" },
    { "id": "urfistOc", "name": "URFIST Occitanie", "type": "Institution" },
    { "id": "tdc", "name": "Toulouse Digital Campus", "type": "Institution" },
    { "id": "canet", "name": "Médiathèque of Canet-en-Roussillon", "type": "Institution" },
    { "id": "vion", "name": "Nicolas Vion", "type": "Individual" },
    { "id": "yug", "name": "Yug", "type": "Individual" },
  ],
  "grants":[
    {
      id: "2004-nv",
      starts: "2004-01",
      sponsorId: "vion",
      amount: undefined,
      unit: undefined,
      description: "Shtooka recorder",
      projectIds: ["2004-nv"]
    },
    {
      id: "2016-wmfr",
      starts: "2016-01",
      sponsorId: "wmfr",
      amount: 8000,
      unit: "EUR", // USD|EUR|workdays|others
      precision: "est.", // est. (estimate), default: exact
      description: "Lingua Libre PHP",
      projectIds: ["2016-wmfr"]
    },
    {
      id: "2018-wmf",
      starts: "2017-07",
      sponsorId: "wmf",
      amount: 30600,
      unit: "EUR",
      description: "Lingua Libre 0x010C's recoding",
      projectIds: ["2018-wmf"]
    },
    {
      id: "2019-wmfr",
      starts: "2019-01",
      sponsorId: "wmfr",
      amount: 8000,
      unit: "EUR",
      description: "Lingua Libre Service Civique 2022.Eavq/Eavqwiki",
      projectIds: ["2019-wmfr"]
    },
    {
      id: "2019-2if",
      starts: "2019-05",
      sponsorId: "2if",
      amount: 1150,
      unit: "EUR",
      description: "Lingua Librist in Residence for DDF - 2IF",
      projectIds: ["2019-2if"]
    },
    {
      id: "2020-yug",
      starts: "2020-05",
      sponsorId: "yug",
      amount: 300,
      unit: "EUR",
      description: "Cantonese recording project",
      projectIds: ["2020-yug"]
    },
    {
      id: "2020-wmca",
      starts: "2020",
      sponsorId: "wmca",
      amount: 5814.85,
      unit: "USD",
      description: "Kits Lingua Libre ",
      projectIds: ["2020-wmca"]
    },
    {
      id: "2021-wmfr",
      starts: "2021-02",
      sponsorId: "wmfr",
      amount: 29647.06, // 29 647,06 + 11 411,76 = 41 058,82
      unit: "EUR",
      description: "Prestation WikiValley 2021.",
      projectIds: ["2021-wmfr"]
    },
    {
      id: "2021-wmfr",
      starts: "2021-02",
      sponsorId: "wmfr",
      amount: 11411.76,
      unit: "EUR",
      description: "Prestation WikiValley 2021.",
      projectIds: ["2021-wmfr"]
    },
    {
      id: "2021-tdc",
      starts: "2021-12",
      sponsorId: "tdc",
      amount: 8,
      unit: "workdays",
      description: "VueJS recordings checker",
      projectIds: ["2021-tdc"]
    },
    {
      id: "2022-wmfr",
      starts: "2022-09",
      sponsorId: "wmfr",
      amount: 8000,
      unit: "EUR",
      description: "Lingua Libre Service Civique Mélody 2022",
      projectIds: ["2022-wmfr"]
    },
    {
      id: "2023-urfistOc",
      starts: "2023-02",
      sponsorId: "mesr",
      amount: 8000,
      unit: "EUR",
      description: "Wikimedien en résidence 2023-2024.",
      projectIds: ["2023-urfistOc"]
    },
    {
      id: "2023-canet",
      starts: "2023-01",
      sponsorId: "canet",
      amount: undefined,
      unit: undefined,
      description: "Youth voices of Roussilon",
      projectIds: ["2023-canet"]
    },
    {
      id: "2023-wmf-wikitutur",
      starts: "2023-01",
      sponsorId: "wmid",
      amount: 5000,
      unit: "USD",
      description: "Indonesian languages recording projects",
      projectIds: ["2023-wmf-wikitutur"]
    },
    {
      id: "2023-wmfr-feasability",
      starts: "2023-04",
      sponsorId: "wmfr",
      amount: 12000,
      unit: "EUR",
      precision: "est.",
      description: "Lingua Libre Internship 2023",
      projectIds: ["2023-wmfr-feasability"]
    },
    {
      id: "2023-wmfr-prototype",
      starts: "2023-09",
      sponsorId: "wmfr",
      amount: 12637,
      unit: "EUR",
      precision: "est.",
      description: "Lingua Libre Internship 2023",
      projectIds: ["2023-wmfr-prototype"]
    },
    {
      id: "2024-gsoc-django",
      starts: "2024-02",
      sponsorId: "gsoc",
      amount: 6000,
      unit: "EUR",
      precision: "est.",
      description: "Lingua Libre GSoC24",
      projectIds: ["2024-gsoc-django"]
    },
    {
      id: "2024-gsoc-signit",
      starts: "2024-02",
      sponsorId: "gsoc",
      amount: 4000,
      unit: "EUR",
      precision: "est.",
      description: "Lingua Libre SignIt GSoC24",
      projectIds: ["2024-gsoc-signit"]
    },
    {
      id: "2024-wmfr-pushkar",
      starts: "2024-10",
      sponsorId: "wmfr",
      amount: 2000,
      unit: "EUR",
      description: "Lingua Libre Django Freelance 1",
      projectIds: ["2024-wmfr-pushkar"]
    },
    {
      id: "2025-wmf-irg",
      starts: "2025-09",
      sponsorId: "wmf-irg",
      amount: 1626,
      unit: "USD",
      description: "50K Malayalam Words",
      projectIds: ["2025-wmf-irg"]
    },
    {
      id: "2025-wmfr-pushkar",
      starts: "2025-02",
      sponsorId: "wmfr",
      amount: 2000,
      unit: "EUR",
      description: "Lingua Libre Django Freelance 2",
      projectIds: ["2025-wmfr-pushkar"]
    },
    {
      id: "2025-wmfr-coordination",
      starts: "2025-02",
      sponsorId: "wmfr",
      amount: 4200,
      unit: "EUR",
      description: "Lingua Libre Django Coordination",
      projectIds: ["2025-wmfr-coordination"]
    },
    {
      id: "2025-wmfr-wikipages",
      starts: "2025-02",
      sponsorId: "wmfr",
      amount: 1800,
      unit: "EUR",
      description: "Lingua Libre Django Coordination",
      projectIds: ["2025-wmfr-wikipages"]
    }
  ]
}