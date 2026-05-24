<template>
    <transition name="modal">
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">

          <div class="modal-header">
            <slot name="header">
            </slot>
          </div>

          <div class="modal-body">
            <div class="field">
              <div class="control">
                <input v-model="search" class="input is-primary" type="text" placeholder="Search for text!">
              </div>
            </div>
            <div class="lds-css" v-if="queryLoading">
              <div style="width:100%;height:100%;margin:0 auto" class="lds-ball">
                <div></div>
              </div>
            </div>
            <div v-else-if="queryError" class="query-error">
              ⚠ {{ queryError }}
            </div>
            <div v-else-if="filteredCards.length === 0" class="query-empty">
              No cards match your search.
            </div>
            <slot name="body">
              <Carousel v-if="!queryLoading && !queryError && filteredCards.length > 0" :breakpoints="{ 768: { itemsToShow: 3 }, 1024: { itemsToShow: 4 } }">
                <Slide v-bind:key="[card.id,index].join('.')" v-for="(card,index) in filteredCards" class="p-l-10 p-r-10">
                  <div style="width:100%">
                    <span class="is-size-7">{{ card.name }}</span>
                    <img v-if="card.image_uris" v-bind:src="card.image_uris.normal" @click="selectCard(card)" v-bind:class="{ 'is-focused': selected.id === card.id }" />
                    <div v-if="!card.image_uris" class="flip-card" v-bind:class="{ 'is-focused': selected.id === card.id }" @click="selectCard(card)">
                      <div class="flip-card-inner">
                        <div class="flip-card-front">
                          <img v-bind:src="card.card_faces[0].image_uris.normal" />
                        </div>
                        <div class="flip-card-back">
                          <img v-bind:src="card.card_faces[1].image_uris.normal" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Slide>
                <template #addons>
                  <Navigation />
                </template>
              </Carousel>
            </slot>
          </div>

          <div class="modal-footer">
            <slot name="footer">
              <button
                class="confirm-button"
                :class="{ 'confirm-button--selected': selected.id }"
                @click="$emit('close-modal', selected)"
              >
                {{ selected.id ? 'Add Card' : 'Cancel' }}
              </button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>
<script setup>
import { ref, computed, watch } from 'vue'
import { Carousel, Slide, Navigation } from 'vue3-carousel'
import 'vue3-carousel/dist/carousel.css'
import { colorToLetter } from '../utils/colors'

const props = defineProps({ query: Object })
const emit = defineEmits(['close-modal'])

const search = ref('')
const debouncedSearch = ref('')
const cards = ref([])
const selected = ref({})
const queryError = ref(null)
const queryLoading = ref(false)

let searchTimeout = null
watch(search, val => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { debouncedSearch.value = val }, 300)
})

const filteredCards = computed(() => {
  if (!debouncedSearch.value) return cards.value
  const term = debouncedSearch.value.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const cardRegex = new RegExp(term)
  return cards.value.filter(card => {
    const oracleText = card.card_faces
      ? card.card_faces.map(f => f.oracle_text).join(' ')
      : card.oracle_text
    const pt = card.card_faces
      ? card.card_faces.filter(f => f.power != null).map(f => `${f.power}/${f.toughness}`).join(' ')
      : (card.power != null ? `${card.power}/${card.toughness}` : '')
    return cardRegex.test([card.name, oracleText, card.type_line, pt].join(' ').toLowerCase())
  })
})

function selectCard(card) {
  if (card.id === selected.value.id) {
    selected.value = {}
  } else {
    selected.value = { ...card, category: props.query.id }
  }
}

function scryfallQueryString(query) {
  const typeFilters = (query.types ?? []).map(t => `type=${t}`)

  if (query.types?.length === 1 && query.types[0] === 'Land') {
    return typeFilters.join(' ')
  }

  if (query.colors.length === 0 || query.types?.some(t => t === 'Artifact')) {
    return [...typeFilters, `cmc=${query.cmc}`].join(' ')
  }

  if (query.colors.length === 1) {
    const l = colorToLetter(query.colors[0])
    return [...typeFilters, query.cmc ? `cmc=${query.cmc}` : '', `(id=${l} OR color=${l})`].join(' ')
  }

  const combo = query.colors.map(colorToLetter).join('')
  return [...typeFilters, query.cmc ? `cmc=${query.cmc}` : '', `(id=${combo} OR color=${combo})`].join(' ')
}

function queryBody(val) {
  let colors = []
  if (val.colors) {
    colors = val.colors
  } else if (val.color && val.color !== 'Colorless') {
    colors = [val.color]
  }

  let types = null
  if (val.color === 'Colorless' && val.type === 'Creature') {
    types = ['Artifact', 'Creature']
  } else if (val.type) {
    types = [val.type]
  }

  return { cmc: val.cmc, colors, types }
}

async function queryCards(query, page = 1) {
  if (page === 1) {
    queryLoading.value = true
    queryError.value = null
  }
  try {
    const url = `https://api.scryfall.com/cards/search?order=name&page=${page}&q=${encodeURIComponent(scryfallQueryString(query))}`
    const response = await fetch(url).then(r => r.json())

    if (response.object === 'error') {
      queryError.value = response.details ?? 'No cards found for this slot.'
      return
    }

    const batch = response.data.map(card => ({
      id: card.id,
      colors: card.colors,
      name: card.name,
      cmc: card.cmc,
      power: card.power ?? null,
      toughness: card.toughness ?? null,
      image_uris: card.image_uris ?? null,
      type_line: card.type_line,
      oracle_text: card.oracle_text,
      card_faces: card.card_faces ?? null,
    })).sort((a, b) => a.name.localeCompare(b.name))

    cards.value = [...cards.value, ...batch]

    if (response.has_more) {
      await queryCards(query, page + 1)
    }
  } catch (e) {
    queryError.value = 'Could not reach Scryfall. Check your connection and try again.'
  } finally {
    if (page === 1) queryLoading.value = false
  }
}

watch(() => props.query, (val) => {
  cards.value = []
  selected.value = {}
  debouncedSearch.value = ''
  search.value = ''
  queryCards(queryBody(val))
}, { immediate: true })
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, .5);
  display: table;
  transition: opacity .3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  width: 1000px;
  margin: 0px auto;
  padding: 20px 30px;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
  transition: all .3s ease;
  font-family: Helvetica, Arial, sans-serif;
}

.modal-header h3 {
  margin-top: 0;
  color: #42b983;
}

.modal-body {
  margin: 20px 0;
}

.query-error,
.query-empty {
  padding: 2rem;
  text-align: center;
  color: #888;
}

.query-error {
  color: #cc3333;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.confirm-button {
  border: none;
  border-radius: 4px;
  padding: 8px 28px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  background-color: #e0e0e0;
  color: #666;
  transition: background-color 0.15s, color 0.15s;
}

.confirm-button.confirm-button--selected {
  background-color: hsl(171, 100%, 41%);
  color: #fff;
}

.confirm-button.confirm-button--selected:hover {
  background-color: hsl(171, 100%, 34%);
}

/* Push nav buttons into the gutter so they don't overlay cards */
:deep(.carousel) {
  padding: 0 46px;
}

:deep(.carousel__prev),
:deep(.carousel__next) {
  --vc-nav-background: rgba(30, 30, 30, 0.82);
  --vc-nav-color: #fff;
  --vc-nav-border-radius: 50%;
  --vc-nav-width: 36px;
  --vc-nav-height: 36px;
  transition: background-color 0.15s;
}

:deep(.carousel__prev:hover),
:deep(.carousel__next:hover) {
  --vc-nav-background: hsl(171, 100%, 41%);
}

.flip-card {
  perspective: 1000px;
  width: 100%;
  cursor: pointer;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  aspect-ratio: 63 / 88;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}

.flip-card:hover .flip-card-inner {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-card-back {
  transform: rotateY(180deg);
}

.flip-card-front img,
.flip-card-back img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4.5% / 3.5%;
}

.flip-card.is-focused .flip-card-inner {
  outline: 0.475em solid rgba(0, 209, 178, 0.75);
  border-radius: 4.5% / 3.5%;
}

.modal-enter-from {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}

img.is-focused {
    border: 0.475em solid rgba(0,209,178,0.75);
    border-radius: 18px;
}

.p-l-10 {
  padding-left: 10px;
}

.p-r-10 {
  padding-right: 10px;
}

@keyframes lds-ball {
  0%, 100% {
    animation-timing-function: cubic-bezier(0.45, 0, 0.9, 0.55);
  }
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(0, 108px);
    animation-timing-function: cubic-bezier(0, 0.45, 0.55, 0.9);
  }
  100% {
    transform: translate(0, 0);
  }
}

.lds-ball {
  position: relative;
  width: 200px !important;
  height: 200px !important;
  transform: translate(-100px, -100px) scale(1) translate(100px, 100px);
}

.lds-ball div {
  position: absolute;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: hsl(171, 100%, 41%);
  left: 74px;
  top: 20px;
  animation: lds-ball 1s linear infinite;
}
</style>
