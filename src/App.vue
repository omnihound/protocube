<template>
  <div id="app">
    <MetaCube v-bind:change="change" v-on:open-modal="onOpenModal" />
    <!-- use the modal component, pass in the prop -->
    <Modal v-bind:query="query" v-if="showModal" v-on:close-modal="onCloseModal">
      <!--
        you can use custom content here to overwrite
        default content
      -->
    </modal>
  </div>
</template>

<script>
import MetaCube from './components/MetaCube.vue'
import Modal from './components/CardPickerModal.vue'

export default {
  name: 'app',
  data: function(){
    return {
      showModal: false,
      query: {},
      change: {}
    }
  },
  methods: {
    onOpenModal: function (query) {
      this.showModal = true;
      this.query = query;
    },
    onCloseModal: function (change) {
      this.showModal = false;
      this.change = change;
    }
  },
  components: {
    MetaCube,
    Modal
  }
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
