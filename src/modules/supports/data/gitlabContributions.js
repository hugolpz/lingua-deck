// List of repositories and path patterns for contribution analysis
// Each entry contains a `repository_url` pointing to a GitLab raw base
// and `file_paths` listing path patterns (globs or regex-aware strings)

export default [
  {
    repository_url: "http://gitlab.wikimedia.org/repos/wikimedia-france/lingua-libre/lingua-libre/raw/master/",
    file_paths: [
      { type: "frontend", path: "./docker-compose.yml" },
      { type: "frontend", path: "./Dockerfile" },
      { type: "frontend", path: "./front-end/src/components/**" },
      { type: "frontend", path: "./front-end/src/router/**" },
      { type: "frontend", path: "./front-end/src/stores/**" },
      { type: "frontend", path: "./front-end/src/utils/**" },
      { type: "frontend", path: "./front-end/src/views/**" },
      { type: "frontend", path: "./front-end/src/App.vue" },
      { type: "frontend", path: "./front-end/src/i18n.js" },
      { type: "frontend", path: "./front-end/src/main.js" },
      { type: "frontend", path: "./front-end/src/TODO.md" },
      { type: "frontend", path: "./manage.py" },
      { type: "frontend", path: "./media/batches-cleaner.sh" },
      { type: "frontend", path: "./README.md" },
      { type: "frontend", path: "./requirements.txt" }
      // Additional logical groups in the project:
      // lingualibre, locutors, upload_batches, user_profile
    ]
  }
]
