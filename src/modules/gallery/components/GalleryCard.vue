<template>
  <div class="bg-white shadow-lg flex flex-col justify-between" :id="language.iso">
    <!-- Card Content -->
    <div class="p-4">
      <!-- Title -->
      <h3 class="text-2xl font-normal mb-4 capitalize">
        {{ language.languageLabelNative || language.itemLabel || language.languageLabel }}
      </h3>
      <span class="text-base">
        {{ meaningfulNumber(language.population, 'short', 'Unknown number of') }} speakers worldwide
      </span>

      <!-- Data Grid -->
      <div class="grid grid-cols-2 gap-x-8 gap-y-4 mt-4">
        
        <!-- Data Item 1: Speakers -->
        <div class="flex-shrink-0">
          <h4 class="text-gray-600 text-sm font-normal mb-1 flex items-center">
            <svg class='inline-block h-5 w-5 mr-1.5 fill-current' width='13' height='13' viewBox='0 0 13 13'>
              <path d='M7.9 8.5c-.2.1-.2.4 0 .5l.2.5-.2.5c-.2.1-.2.3 0 .5l.2.1.3-.1a1.4 1.4 0 0 0 0-2 .4.4 0 0 0-.5 0ZM9.4 7.2v.6a2.4 2.4 0 0 1 0 3.4v.5l.3.2s.2 0 .3-.2a3.2 3.2 0 0 0 0-4.5.4.4 0 0 0-.6 0Z'></path>
              <path d='M11.6 6.1a.4.4 0 0 0-.6 0v.5a4 4 0 0 1 0 5.7v.6h.6a4.8 4.8 0 0 0 0-6.8ZM8 6.5c0-.3 0-.5-.3-.7l-1.1-.6C6 2.2 3.4.2.4 0 .2 0 0 .2 0 .4s.2.4.4.4c2.6 0 5 2.1 5.5 4.7l.1.3 1.3.7-1.2.7-.2.3-.2.7H3.2c-.2 0-.4.1-.4.4A3 3 0 0 0 4 10.9c-1 .8-2.2 1.3-3.5 1.3-.2 0-.4.2-.4.4s.2.4.4.4c1.6 0 3.2-.7 4.4-1.9v-.3l-.1-.3c-.6-.3-1-1-1-1.6H6c.1 0 .3 0 .3-.2l.3-1 1-.6c.3 0 .5-.3.5-.6Z'></path>
              <path d='M3.1 5.5h.4l.1-.3V4.9a.4.4 0 0 0-.5 0H3l-.1.3v.2l.2.1Z'></path>
            </svg>
            Speakers
          </h4>
          <p class="font-light text-lg">{{ meaningfulNumber(language.speakers) }}</p>
        </div>
        
        <!-- Data Item 2: Gender Split -->
        <div class="flex-shrink-0">
          <h4 class="text-gray-600 text-sm font-normal mb-1 flex items-center">
            <svg class='inline-block h-5 w-5 mr-1.5 fill-current' width='13' height='13' viewBox='0 0 25 25'>
              <path d='M16.923 17.318c.201.612.461 1.251.463 1.895v3.79c0 .598-.215.997-.827.997-.613 0-.638-.399-.638-.997v-3.89c.103-.797-.397-1.396-.907-1.894-.306-.3-.245-.323-.204-.612.102-.4.143-.757.816-.699 2.96-.299 5.912-1.681 5.912-6.368 0-1.097-.603-2.194-1.419-3.091-.307-.3-.307-.699-.205-.998.307-.797.307-1.98.102-2.778-.51.1-1.711.4-3.038 1.296-.205.2-.51.2-.817.1a12.487 12.487 0 0 0-6.635 0c-.306.1-.612.1-.919-.1-1.225-.897-2.535-1.196-3.046-1.296-.205.798-.205 1.981.101 2.778.102.4.102.798-.204.998-.816.897-1.225 1.994-1.225 3.091 0 4.687 2.57 6.061 5.532 6.36.408 0 .714.3.816.7.102.397 0 .419-.204.619-.51.498-.714 1.097-.714 1.795v3.889c0 .598-.017.997-.629.997-.613 0-.835-.399-.835-.997v-1.888c-3.062.498-4.006-1.197-4.924-2.294-.408-.5-.714-.897-1.123-.997-.51-.1-1.302-.505-1.098-1.004.102-.498.714-.705 1.225-.506 1.02.3 1.633.997 2.245 1.695.817 1.097 1.531 1.895 3.675 1.496.05-1.199.248-1.547.455-2.087-2.858-.598-6.069-2.393-6.069-7.678 0-1.496.51-2.892 1.429-3.99-.408-1.395-.306-2.692.306-3.988a.91.91 0 0 1 .613-.599c.408-.1 1.543-.299 4.298 1.397 2.247-.499 4.979-.499 7.123 0 2.654-1.696 3.89-1.496 4.298-1.397.306.1.51.3.613.599.51 1.296.612 2.593.306 3.889A6.175 6.175 0 0 1 23 9.54c0 5.684-3.627 7.28-6.077 7.778z' />
            </svg>
            Gender split
          </h4>
          <p class="font-light text-lg flex justify-between">
            <span>♀{{ meaningfulNumber(language.speakersFemales) }}</span>
            <span class="text-base">{{ language.speakersOthers ? meaningfulNumber(language.speakersOthers,'shorter') : '' }}</span>
            <span>{{ meaningfulNumber(language.speakersMales) }}♂</span>
          </p>
          <div class="progress-bar-container mt-1">
            <div class="sr-only">{{ percent(language.speakersFemales, language.speakers) }}%</div>
            <div class="progress-bar progress-females" :style="{ width: percent(+language.speakersFemales, language.speakers)+'%'}"></div>
            <div class="sr-only">{{ percent(language.speakersOthers, language.speakers) }}%</div>
            <div class="progress-bar progress-others" :style="{ 
              width: percent(language.speakersOthers, language.speakers)+'%',
              left: percent(+language.speakersFemales, language.speakers)+'%'
            }"></div>
          </div>
        </div>
        
        <!-- Data Item 3: Words vs Records -->
        <div class="flex-shrink-0">
          <h4 class="text-gray-600 text-sm font-normal mb-1 flex items-center">
            <svg class='inline-block h-5 w-5 mr-1.5 fill-current' width='13' height='13' viewBox='0 0 13 13'>
              <path d='M5.8 2.3h5.6a.4.4 0 1 0 0-.8H5.8a.4.4 0 1 0 0 .8ZM7.2 10.7H.4a.4.4 0 1 0 0 .8h6.8a.4.4 0 1 0 0-.8ZM.4 5.4H10a.4.4 0 1 0 0-.8H.4c-.2 0-.4.2-.4.4s.2.4.4.4ZM0 8c0 .2.2.4.4.4h12.2a.4.4 0 1 0 0-.8H.4c-.2 0-.4.2-.4.4ZM9.8 10.7H9a.4.4 0 1 0 0 .8h.7c.1.2.1.6-.1.8-.2.2-.2.4 0 .6l.2.1.3-.1c.6-.6.6-1.5 0-2.1l-.3-.1ZM12.3 10.7h-.9a.4.4 0 1 0 0 .8h.7c.2.2.2.6 0 .8-.2.2-.2.4 0 .6l.2.1.3-.1c.6-.6.5-1.5 0-2.1l-.3-.1ZM3.2 2.3H4a.4.4 0 1 0 0-.8h-.7a.7.7 0 0 1 .1-.8c.2-.2.2-.4 0-.6a.4.4 0 0 0-.5 0c-.6.6-.6 1.5 0 2.1l.3.1ZM.7 2.3h.9a.4.4 0 1 0 0-.8H.9a.7.7 0 0 1 0-.8c.2-.2.2-.4 0-.6a.4.4 0 0 0-.5 0C0 .7 0 1.6.4 2.2l.3.1Z'></path>
            </svg>
            Unique words vs recordings ratio
          </h4>
          <p class="font-light text-lg flex justify-between">
            <span>{{ meaningfulNumber(language.words) }}</span>
            <span>{{ meaningfulNumber(language.records) }}</span>
          </p>
          <div class="progress-bar-container mt-1">
            <div class="sr-only">{{ percent(language.words, language.records) }}%</div>
            <div class="progress-bar progress-words" :style="{ width: percent(language.words, language.records)+'%'}"></div>
          </div>
        </div>

        <!-- Data Item 4: Recordings Gender Split -->
        <div class="flex-shrink-0">
          <h4 class="text-gray-600 text-sm font-normal mb-1 flex items-center">
            <svg class='inline-block h-5 w-5 mr-1.5 fill-current' width='13' height='13' viewBox='0 0 13 13'>
              <path d='M6.904 1.386c0-.517-.775-.517-.775 0V6.48c0 .103.041.193.112.266l3.685 3.785c.186.236.381.15.541 0a.378.378 0 0 0 0-.54L6.894 6.323z' />
              <path d='M12.267 6.104A5.79 5.79 0 0 0 6.883.72c-.337-.01-.466-.004-.775.01A5.762 5.762 0 0 0 .735 6.104a5.06 5.06 0 0 0 0 .776c.194 3.008 2.702 5.404 5.76 5.404 3.06 0 5.568-2.396 5.761-5.404.032-.363.027-.5.011-.776zM1.49 6.493c0-2.763 2.244-5.027 5.007-5.027a5.026 5.026 0 0 1 5.016 5.017A5.027 5.027 0 0 1 6.5 11.5a5.014 5.014 0 0 1-5.01-5.008z' />
            </svg>
            Recordings gender split
          </h4>
          <p class="font-light text-lg flex justify-between">
            <span>{{ meaningfulNumber(language.recordsFemale, "short", 0) }}</span>
            <span class="text-base">{{ meaningfulNumber(language.recordsOthers, "shorter", '') }}</span>
            <span>{{ meaningfulNumber(language.recordsMale, "short", 0) }}</span>
          </p>
          <div class="progress-bar-container mt-1">
            <div class="sr-only">{{ percent(language.recordsFemale, language.records) || 0 }}%</div>
            <div class="progress-bar progress-females" :style="{ width: percent(language.recordsFemale, language.records) +'%'}"></div>
            <div class="progress-bar progress-others" :style="{ 
              width: percent(language.recordsOthers, language.records)+'%',
              left: percent(language.recordsFemale, language.records)+'%'
            }"></div>
          </div>
        </div>

      </div>
    </div>
    
    <!-- Card Footer -->
    <div class="flex">
      <a class="flex-1 bg-gray-50/50 border-none font-semibold tracking-wider text-center uppercase py-4 transition-all hover:bg-gray-200"
         href="https://lingualibre.org/app">
        Contribute
      </a>
      <a class="flex-1 bg-gray-50/50 border-none font-semibold tracking-wider text-center uppercase py-4 transition-all hover:bg-gray-200"
         :href="datasetUrl">
        Download
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  language: {
    type: Object,
    required: true
  }
});

const meaningfulNumber = (num, suffixType='short', zero=null) => {
  let na, k, M;
  suffixType == 'shorter' || suffixType == 'short' ? (na='n.a.', k='k', M='M')
    : suffixType == 'long' ? (na='Undocumented', k=' thousands', M=' millions')
    : (na='', k=',000', M=',000,000');
  if(zero) { na = zero }
  
  const numStr = 
    num == undefined ? ''+na
    : num == 0 ? 0
    : num < 1000 ? num
    : num < 10000 && suffixType != 'shorter' ? num
    : num < 100000 ? (Math.round(num / 100)/10) + k
    : num < 1000000 ? (Math.round(num / 1000)) + k
    : num < 20000000 ? (Math.round(num / 100000)/10) + M
    : num < 200000000 ? (Math.round(num / 1000000)) + M
    : (Math.round(num / 10000000)*10) + M;
  return numStr;
};

const percent = (num, all) => {
  return Math.round(100*num/all*10)/10;
};

const datasetUrl = computed(() => {
  return 'https://lingualibre.org/datasets/' + 
    [props.language.language.split("/").pop(), props.language.iso, props.language.languageLabel].join('-') + '.zip';
});
</script>

<style scoped>
/* Progress bar styles */
.progress-bar-container {
  position: relative;
  height: 0.5rem;
  background: #629ff4;
  width: 100%;
}

.progress-bar {
  position: absolute;
  top: 0;
  height: 100%;
}

.progress-default { z-index: 1; background: #517FC1; }
.progress-females { z-index: 3; background: #F19359; }
.progress-others { z-index: 2; background: #FAD965; }
.progress-words { z-index: 2; background: #9b90ff; }
</style>
