<script setup lang="ts">
import { useConfig } from "../main";

const cfg = useConfig()
</script>

<template>
  <div class="q-px-lg plugin-base">
    <div>
      <label>
        Visualizer Dampening
      <input type="number" v-model="cfg.visualizerDampening" id="visualizerdampen" />
      </label>
    </div>
      <label>
        Visualizer Style
        <select class="c-select" v-model="cfg.visualizerColoring">
          <option value="cider-red">Cider Red</option>
          <option value="spectrogram">Spectrogram</option>
          <option value="album-art">Album Art</option>
        </select>
      </label>
    </div>
</template>

<style scoped></style>