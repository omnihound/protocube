<template>
  <section v-if="tagCloud.length > 0" class="section tag-cloud-section">
    <div class="tag-cloud-header">
      <h2 class="tag-cloud-title">Keywords &amp; Subtypes</h2>
      <button v-if="selectedTags.size > 0" class="clear-btn" @click="clearSelectedTags">clear filters</button>
    </div>
    <div class="tag-cloud">
      <span
        v-for="{ tag, count } in shuffled"
        :key="tag"
        class="tag-word"
        :class="{ 'is-selected': selectedTags.has(tag) }"
        :style="tagStyle(tag, count)"
        :title="`${tag}: ${count}`"
        @click="toggleTag(tag)"
      >{{ tag }}</span>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useCube } from '../composables/useCube'

const { tagCloud, selectedTags, toggleTag, clearSelectedTags } = useCube()

const maxCount = computed(() => tagCloud.value[0]?.count ?? 1)
const minCount = computed(() => tagCloud.value[tagCloud.value.length - 1]?.count ?? 1)

const shuffled = computed(() => tagCloud.value.slice().sort(() => Math.random() - 0.5))

function scale(count) {
  const lo = minCount.value
  const hi = maxCount.value
  return hi === lo ? 0.5 : (count - lo) / (hi - lo)
}

function tagStyle(tag, count) {
  if (selectedTags.value.has(tag)) return { fontSize: (0.8 + scale(count) * 1.6).toFixed(2) + 'rem' }
  const t = scale(count)
  const l = Math.round(65 - t * 35)
  return {
    fontSize: (0.8 + t * 1.6).toFixed(2) + 'rem',
    color: `hsl(171, 70%, ${l}%)`,
  }
}
</script>

<style scoped>
.tag-cloud-section {
  padding-top: 0;
}

.tag-cloud-header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.tag-cloud-title {
  font-size: 1rem;
  font-weight: 600;
  color: #555;
}

.clear-btn {
  border: none;
  background: none;
  font-size: 0.8rem;
  color: #aaa;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.clear-btn:hover {
  color: #555;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.25rem 0.75rem;
  line-height: 1;
}

.tag-word {
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s;
  white-space: nowrap;
  user-select: none;
}

.tag-word:not(.is-selected):hover {
  color: hsl(171, 100%, 30%) !important;
}

.tag-word.is-selected {
  color: hsl(171, 100%, 41%);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
