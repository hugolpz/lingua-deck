<template>
  <details class="corner-card p-4" :open="open">
    <summary class="cursor-pointer font-bold">How to load the upload error logs</summary>

    <p class="mt-3">
      This page is for developers and advanced users, to help them understand the upload errors and how to feed this dashboard. The log files
      are not committed to the repository: fetch the latest one from the server and upload it below.
    </p>

    <h3 class="mt-3 text-sm font-bold text-progressive">1. Fetch the log</h3>
    <pre class="overflow-x-auto rounded bg-surface-muted p-3 text-sm"><code>git clone &lt;Lingua-Plus-repo&gt;    # clone repository
cd lingua-plus/src/modules/logs/data/
## Fetch raw data, replace `yug` by your lingualibre.wmcloud.org username
ssh -J yug@bastion.wmcloud.org yug@prod.lingualibre.eqiad1.wikimedia.cloud "cat /srv/lingua-libre/media/logs/upload_errors.log" &gt; ./upload_errors.log</code></pre>
    <h3 class="mt-3 text-sm font-bold text-progressive">2. Upload it</h3>
    <LogsUploadAndClean @loaded="$emit('loaded', $event)" @cleared="$emit('cleared')" />
  </details>
</template>

<script setup>
import LogsUploadAndClean from './LogsUploadAndClean.vue'

// Open while there is nothing to show, collapsed once logs are loaded
defineProps({ open: { type: Boolean, default: false } })
defineEmits(['loaded', 'cleared'])
</script>
