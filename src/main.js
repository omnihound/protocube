import Vue from 'vue'
import VueResource from 'vue-resource'
import App from './App.vue'
import VueClipboard from 'vue-clipboard2'
import Toasted from 'vue-toasted';

Vue.use(Toasted, {
  duration: 2500
});
Vue.use(VueClipboard);
Vue.use(VueResource);
Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')
