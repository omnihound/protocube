<template>
  <div>
    <div v-if="loading" class="loading-state">Loading cube data…</div>
    <div v-else-if="error" class="error-state">
      <span>⚠ {{ error }}</span>
      <button class="button is-small" @click="fetchMeta">Retry</button>
    </div>
    <template v-else>
    <section class="section">
      <div class="columns">
        <div class="column">
          <div class="field">
            <label class="label">Cube Size</label>
            <div class="control">
              <input v-model="cubeSize" class="input" type="number" step="15" placeholder="Cube Size">
              Extra Slots: {{ extraSlots() }}
            </div>
          </div>
        </div>
        <div class="column">
          <div class="field">
            <label class="label">Multicolor Size</label>
            <div class="control">
              <input v-model="multicolorSize" class="input" type="number" step="10" placeholder="Multicolor Size">
            </div>
          </div>
        </div>
        <div class="column">
          <div class="field">
            <label class="label">Export</label>
            <div class="control">
              <button class="button is-link is-fullwidth" @click="copyToClipboard">Copy to Clipboard</button>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="columns">
        <div v-bind:key="group" class="column container" v-for="group in groups">
          {{ group }} ({{ countByGroup(group) }})
          <div v-bind:key="[group,type].join('.')" class="notification" v-for="type in getTypes(group)">
            {{ type }} ({{ countByType(group, type) }})
            <ul v-bind:key="[group,type,stat.cmc].join('.')" v-for="stat in filterByType(group, type)">
              <li>
                <span>cmc {{stat.cmc}}</span>
                <button v-if="extraSlots() > 0" class="button is-small is-rounded" @click="stat.cardSlots++">+</button>
                <button v-if="stat.cardSlots > 0" class="button is-small is-rounded" @click="stat.cardSlots--">-</button>
              </li>
              <li v-bind:key="[card.name, index].join('.')" v-for="(card,index) in stat.cards">
                <VMenu placement="right">
                  <span class="tooltip-target b3 is-size-7">{{card.name}}</span>
                  <template #popper>
                    <div v-if="card.image_uris" style="width: 200px">
                      <img :src="card.image_uris.normal" />
                    </div>
                    <div v-if="!card.image_uris" style="width: 350px">
                      <img style="width: 175px; height: auto;" :src="card.card_faces[0].image_uris.normal" />
                      <img style="width: 175px; height: auto;" :src="card.card_faces[1].image_uris.normal" />
                    </div>
                  </template>
                </VMenu>
                <button class="button is-small is-rounded" @click="removeCard(card)">-</button>
              </li>
              <li v-bind:key="[group,type,stat.cmc,n].join('.')" v-for="n in openSlots(stat)">
                <span class="is-size-7">Open Slot </span>
                <button class="button is-small is-rounded" @click="$emit('open-modal', stat)">+</button>
              </li>
            </ul>
          </div>
        </div>
        <div class="column container">
          Multicolor
          <div v-bind:key="['other',group.join('-')].join('.')" class="notification" v-for="group in multiGroups">
            {{group.join(', ')}}
            <ul>
              <li v-bind:key="[card.name, index].join('.')" v-for="(card,index) in filterByMultiGroup(group).cards">
                <VMenu placement="right">
                  <span class="tooltip-target b3 is-size-7">{{card.name}}</span>
                  <template #popper>
                    <div v-if="card.image_uris" style="width: 200px">
                      <img :src="card.image_uris.normal" />
                    </div>
                    <div v-if="!card.image_uris" style="width: 350px">
                      <img style="width: 175px; height: auto;" :src="card.card_faces[0].image_uris.normal" />
                      <img style="width: 175px; height: auto;" :src="card.card_faces[1].image_uris.normal" />
                    </div>
                  </template>
                </VMenu>
                <button class="button is-small is-rounded" @click="removeCard(card)">-</button>
              </li>
              <li v-bind:key="['other',group.join('-'), n].join('.')" v-for="n in (filterByMultiGroup(group).cards ? multiGroupSize() - filterByMultiGroup(group).cards.length : 0)">
                <span class="is-size-7">Open Slot </span>
                <button class="button is-small is-rounded" @click="$emit('open-modal', filterByMultiGroup(group))">+</button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
    </template>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useCube } from '../composables/useCube'

const {
  meta,
  cubeSize,
  multicolorSize,
  loading,
  error,
  groups,
  multiGroups,
  extraSlots,
  getTypes,
  filterByType,
  filterByMultiGroup,
  countByGroup,
  countByType,
  multiGroupSize,
  openSlots,
  recalculateSlots,
  fetchMeta,
  removeCard,
} = useCube()

defineEmits(['open-modal'])

watch(cubeSize, recalculateSlots)
watch(multicolorSize, recalculateSlots)

function copyToClipboard() {
  if (!meta.value) return
  const toast = useToast()
  const list = []

  groups.value.forEach(group => {
    getTypes(group).forEach(type => {
      filterByType(group, type).forEach(block => {
        block.cards.forEach(card => list.push(card.name))
      })
    })
  })
  meta.value.multicolor.forEach(group => {
    group.cards.forEach(card => list.push(card.name))
  })

  navigator.clipboard.writeText(list.join('\r'))
    .then(() => toast.success('Copied list to the clipboard'))
    .catch(() => toast.error('Something went wrong!'))
}

fetchMeta()
</script>

<style scoped>
.loading-state {
  padding: 2rem;
  text-align: center;
  color: #888;
}

.error-state {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
  padding: 2rem;
  color: #cc3333;
}

.v-popper {
    display:inline-block;
    margin-left: .1em;
    margin-right: .1em;
}
ul > li > button {
    margin-top: .2em;
    margin-bottom: .2em;
    font-size: .60em !important;
}

.notification {
    padding: .5rem .5rem .5rem .5rem;
}
@media only screen and (min-width: 768px) {
    .transform-offset {
        position:relative;
        right: 150px;
    }
}
</style>
