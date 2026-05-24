<template>
  <div id="app">
    <MetaCube v-on:open-modal="onOpenModal" />
    <Modal v-bind:query="query" v-if="showModal" v-on:close-modal="onCloseModal" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MetaCube from './components/MetaCube.vue'
import Modal from './components/CardPickerModal.vue'
import { useCube } from './composables/useCube'

const { addCard } = useCube()
const showModal = ref(false)
const query = ref({})

function onOpenModal(q) {
  showModal.value = true
  query.value = q
}

function onCloseModal(card) {
  showModal.value = false
  addCard(card)
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

li.tab a .title {
    font-size: 1rem;
}
</style>
