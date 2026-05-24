import { ref, computed } from 'vue'
import { letterToColor } from '../utils/colors'

const meta = ref(null)
const cubeSize = ref(360)
const multicolorSize = ref(0)

const groups = computed(() => meta.value ? Object.keys(meta.value.mono) : [])
const coloredGroups = computed(() => groups.value.filter(k => k !== 'Colorless'))
const multiGroups = computed(() => meta.value ? meta.value.multicolor.map(g => g.colors) : [])

function colorlessSize() {
  return Math.floor(cubeSize.value - multicolorSize.value) * 0.227
}

function countByGroup(group) {
  if (!meta.value) return 0
  return meta.value.mono[group].reduce((sum, b) => sum + b.cardSlots, 0)
}

function groupSize() {
  if (!meta.value || coloredGroups.value.length === 0) return 0
  const delta = cubeSize.value % coloredGroups.value.length
  return Math.floor(
    (cubeSize.value - countByGroup('Colorless') - delta - multicolorSize.value) / coloredGroups.value.length
  )
}

function multiGroupSize() {
  if (multicolorSize.value === 0 || multiGroups.value.length === 0) return 0
  const mod = multicolorSize.value % multiGroups.value.length
  return (multicolorSize.value - mod) / multiGroups.value.length
}

function extraSlots() {
  const total = groups.value.reduce((sum, g) => sum + countByGroup(g), 0)
  return cubeSize.value - total - multicolorSize.value
}

function getTypes(group) {
  if (!group || !meta.value?.mono[group]) return []
  return meta.value.mono[group].reduce((arr, b) => {
    if (!arr.includes(b.type)) arr.push(b.type)
    return arr
  }, [])
}

function filterByType(group, type) {
  return meta.value.mono[group].filter(b => b.type === type)
}

function filterByMultiGroup(group) {
  return meta.value.multicolor.find(g => g.colors.join(',') === group.join(','))
}

function countByType(group, type) {
  return filterByType(group, type).reduce((sum, b) => sum + b.cardSlots, 0)
}

function openSlots(block) {
  return block.cardSlots - block.cards.length
}

function recalculateSlots() {
  if (!meta.value) return

  // Compute base cardSlots from statistical means
  getTypes('Colorless').forEach(type => {
    filterByType('Colorless', type).forEach(block => {
      block.cardSlots = Math.floor(colorlessSize() * block.mean)
    })
  })

  coloredGroups.value.forEach(group => {
    getTypes(group).forEach(type => {
      filterByType(group, type).forEach(block => {
        block.cardSlots = Math.floor(groupSize() * block.mean)
      })
    })
  })

  multiGroups.value.forEach(group => {
    filterByMultiGroup(group).blocks.forEach(block => {
      block.cardSlots = Math.floor(multiGroupSize() * block.mean)
    })
  })

  // Distribute rounding remainder into highest-variance slots
  coloredGroups.value.forEach(group => {
    const sorted = meta.value.mono[group].slice().sort((a, b) => b.stdev - a.stdev)
    const surplus = groupSize() - countByGroup(group)
    if (surplus > 0) sorted.slice(0, surplus).forEach(b => { b.cardSlots += 1 })
    if (surplus < 0) sorted.slice(0, -surplus).forEach(b => { b.cardSlots -= 1 })
  })
}

async function fetchMeta() {
  const data = await fetch('/data.json').then(r => r.json())
  meta.value = data
  recalculateSlots()
}

function findGroup(card) {
  if (!meta.value || !card?.category) return null

  let group = meta.value.mono['Colorless'].find(b => b.id === card.category)
  if (group) return group

  if (card.colors?.length === 1) {
    group = meta.value.mono[letterToColor(card.colors[0])]?.find(b => b.id === card.category)
    if (group) return group
  }

  return meta.value.multicolor.find(g => g.id === card.category) ?? null
}

function addCard(card) {
  if (!card?.category) return
  if (!card.colors && card.card_faces) {
    card.colors = card.card_faces[0].colors
  }
  const group = findGroup(card)
  if (group) group.cards.push(card)
}

function removeCard(card) {
  const group = findGroup(card)
  if (group) group.cards.splice(group.cards.indexOf(card), 1)
}

export function useCube() {
  return {
    meta,
    cubeSize,
    multicolorSize,
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
    addCard,
    removeCard,
  }
}
