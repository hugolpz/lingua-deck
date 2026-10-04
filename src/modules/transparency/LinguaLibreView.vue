<template>
  <div class="page">
    <AppBreadcrumb :items="crumbs" share-title="Lingua Libre transparency" />

    <header class="mb-8 text-center">
      <h1 class="mb-2 text-3xl">Lingua Libre funding</h1>
      <p class="text-secondary">Overview of budgets via Sankey diagram and the projects behind them.</p>
    </header>

    <section class="budget-section card mb-12 p-4">
      <Flowchart />
    </section>

    <section class="budget-section mb-12">
      <h2 class="mb-4 text-2xl">Projects</h2>
      <p v-if="projectsError" class="text-secondary">{{ projectsError }}</p>
      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ProjectCard
          v-for="project in projects"
          :key="project.id"
          :project="project"
          :sponsors="sponsorsOf(project.id)"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import Flowchart from '@/modules/transparency/components/Flowchart.vue';
import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
import ProjectCard from '@/modules/transparency/components/ProjectCard.vue';
import { data } from '@/modules/transparency/data/data.js';
import { projectsDataExtractor } from '@/modules/transparency/data/projectsDataExtractor.js';
import { addEURToProjectsAndFreelancers, cleanProjectTitles, inferFreelancerPayouts } from '@/modules/transparency/data/projectsDataCleaner.js';

const crumbs = [
  { label: 'Transparency', to: '/transparency' },
  { label: 'Lingua Libre', to: '/transparency/lingualibre' },
];

const projects = ref([]);
const projectsError = ref('');

const sponsorsOf = (projectId) =>
  data.grants
    .filter((g) => g.projectIds?.includes(projectId))
    .map((g) => data.sponsors.find((s) => s.id === g.sponsorId))
    .filter(Boolean);

onMounted(async () => {
  try {
    const { projects: extracted = [] } = await projectsDataExtractor();
    projects.value = addEURToProjectsAndFreelancers(inferFreelancerPayouts(cleanProjectTitles(extracted)), data)
      .sort((a, b) => (b.starts ?? '').localeCompare(a.starts ?? ''));
  } catch (e) {
    projectsError.value = `Could not load projects: ${e.message}`;
  }
});
</script>
