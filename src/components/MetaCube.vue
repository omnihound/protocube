<template>
<vue-tabs>
    <v-tab title="Manage Cube">
    <div>
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
                    <div v-bind:key="group" class="column container" v-for="group in getGroups()">
                            {{ group }} ({{ countByGroup(group) }})
                            <div v-bind:key="[group,type].join('.')" class="notification" v-for="type in getTypes(group)">
                                {{ type }} ({{ countByType(group, type) }})
                                <ul v-bind:key="[group,type,stat.cmc].join('.')" v-for="stat in filterByType(group, type)">
                                    <li><span>cmc {{stat.cmc}}</span><button v-if="extraSlots() > 0" class="button is-small is-rounded" @click="addSlot(stat)">+</button><button v-if="stat.cardSlots > 0" class="button is-small is-rounded" @click="removeSlot(stat)">-</button></li>
                                    <li v-bind:key="[card.name, index].join('.')" v-for="(card,index) in stat.cards">
                                        <v-popover boundaries-element="body" placement="right">
                                            <span class="tooltip-target b3 is-size-7">{{card.name}}</span>
                                            <template slot="popover">
                                                <div v-if="card.image_uris" style="width: 200px">
                                                    <img :src="cardUrl(card)" />
                                                </div>
                                                <div v-if="!card.image_uris"  style="width: 350px">
                                                    <img style="width: 175px; height: auto;" :src="card.card_faces[0].image_uris.normal" />
                                                    <img style="width: 175px; height: auto;"  :src="card.card_faces[1].image_uris.normal" />
                                                </div>   
                                            </template>
                                        </v-popover>
                                        
                                        <button class="button is-small is-rounded" @click="removeCard(card)">-</button>
                                    </li>
                                    
                                    <li v-bind:key="[group,type,stat.cmc,n].join('.')" v-for="n in openSlots(stat)">
                                        <span class="is-size-7">Open Slot </span><button class="button is-small is-rounded" @click="$emit('open-modal', stat)">+</button>
                                    </li>
                                </ul>
                            </div>
                    </div>
                    <div class="column container">
                        Multicolor
                        <div v-bind:key="['other',group.join('-')].join('.')" class="notification" v-for="group in getMultiGroups()">
                            {{group.join(', ')}} 
                            <ul>
                                <li v-bind:key="[card.name, index].join('.')" v-for="(card,index) in filterByMultiGroup(group).cards">
                                        <v-popover boundaries-element="body" placement="right">
                                            <span class="tooltip-target b3 is-size-7">{{card.name}}</span>
                                            <template slot="popover">
                                                <div v-if="card.image_uris" style="width: 200px">
                                                    <img :src="cardUrl(card)" />
                                                </div>
                                                <div v-if="!card.image_uris"  style="width: 350px">
                                                    <img style="width: 175px; height: auto;" :src="card.card_faces[0].image_uris.normal" />
                                                    <img style="width: 175px; height: auto;" :src="card.card_faces[1].image_uris.normal" />
                                                </div>   
                                            </template>
                                        </v-popover>  
                                    
                                    <button class="button is-small is-rounded" @click="removeCard(card)">-</button>
                                </li>                             
                                <li v-bind:key="['other',group.join('-'), n].join('.')" v-for="n in ( filterByMultiGroup(group).cards ? multiGroupSize() - filterByMultiGroup(group).cards.length : 0 )">
                                    <span class="is-size-7">Open Slot </span><button class="button is-small is-rounded" @click="$emit('open-modal', filterByMultiGroup(group))">+</button>
                                </li>                               
                            </ul>
                        </div>
                    </div>
                </div>
        </section>
    </div>
    </v-tab>
</vue-tabs>

</template>


<script>
import {VueTabs, VTab} from 'vue-nav-tabs'
import {VPopover} from 'v-tooltip'

export default {
    name: "MetaCube",
    components: {
        VPopover,
        VueTabs,
        VTab
    },
    props: {
        change: Object
    },
    data: function() {
        return {
            meta: null,
            cubeSize: 360,
            multicolorSize: 0
        }
    },
    methods: {
        cardUrl(card) {
            if (card.image_uris) {
                return card.image_uris.normal;
            }
        },
        getMeta() {
            this.$http.get('data.json').then((response) => {
                this.meta = response.body;
                this.normalizeMeta();
                this.computeFlexSlots();
            });
        },
        normalizeMeta() {
          if (!this.meta) {
              return;
          }

          this.getTypes('Colorless').forEach((type) => {
            this.meta.mono['Colorless']
            .filter((statBlock) => statBlock.type === type)
            .forEach((statBlock) => {
              statBlock.cardSlots = Math.floor(this.colorlessSize() * statBlock.mean);
            });
          });

          var groups = this.getColoredGroups();
          groups.forEach((group) => {
              this.getTypes(group).forEach((type) => {
                  this.meta.mono[group].filter((statBlock) => {
                      return statBlock.type === type;
                  }).forEach((statBlock) => {
                      statBlock.cardSlots = Math.floor(this.groupSize() * statBlock.mean);
                  });
              });
          });
  
          var multiGroups = this.getMultiGroups();
          multiGroups.forEach((group) => {
              this.filterByMultiGroup(group).blocks.forEach((statBlock) => {
                  statBlock.cardSlots = Math.floor(this.multiGroupSize() * statBlock.mean);
              });
          });
        },
        computeFlexSlots() {
          if (!this.meta) {
              return;
          }
  
          var groups = this.getColoredGroups();
          groups.forEach((group) => {
            var slotsAvailable = this.groupSize() - this.countByGroup(group);

            var query = this.meta.mono[group].slice();
            if (slotsAvailable > 0) {

              query.sort((a,b) => {return b.stdev - a.stdev}).slice(0, slotsAvailable).forEach((statBlock) => {
                  statBlock.cardSlots += 1;
              });
            }

            var slotsToCull = this.countByGroup(group) - this.groupSize();
            if (slotsToCull > 0) {
              query.sort((a,b) => {return b.stdev - a.stdev}).slice(0, slotsToCull).forEach((statBlock) => {
                  statBlock.cardSlots -= 1;
              });
            }
          });
        },
        getGroups() {
          if (!this.meta) {
              return [];
          }

          return Object.keys(this.meta.mono);
        },
        getColoredGroups() {
          if (!this.meta) {
              return [];
          }

          return Object.keys(this.meta.mono).filter((key) => key !== 'Colorless');
        },
        getMultiGroups() {
            if (!this.meta) {
                return [];
            }

            return this.meta.multicolor.map((group) => { return group.colors });
        },
        getTypes(group) {
          if (!group || !this.meta) {
              return;
          }
          var colorObj = this.meta.mono[group];
  
          if (!colorObj) {
              return;
          }
  
          return colorObj.reduce((array, value) => {
              var type = value.type;
              if (array.indexOf(type) === -1) {
                  array.push(type)
              }
  
              return array;
          }, []);
        },
        filterByType(group, type) {
          return this.meta.mono[group].filter((statBlock) => {
              return statBlock.type === type;
          });
        },
        filterByMultiGroup(group) {
          return this.meta.multicolor.filter((groupObj) => {
            return JSON.stringify(groupObj.colors) === JSON.stringify(group)
          })[0];
        },
        countByType(group, type) {
            return this.filterByType(group, type).reduce((count, statBlock) => {
              count += statBlock.cardSlots;
              return count;
            }, 0);
        },
        countByGroup(group) {
            return this.meta.mono[group].reduce((count, statBlock) => {
              count += statBlock.cardSlots;
              return count;
            }, 0);
        },
        countByMultiGroup(group) {
            return this.filterByMultiGroup(group).blocks.reduce((count, statBlock) => {
              count += statBlock.cardSlots;
              return count;
            }, 0);
        },
        openSlots(block) {
          return block.cardSlots - block.cards.length;
        },
        colorlessSize() {
          //This value probably belongs in the data payload, but just hardcode for now
          return Math.floor(this.cubeSize - this.multicolorSize) * 0.227;
        },
        groupSize() {
          var groups = this.getColoredGroups();
          var deltaGroup = this.cubeSize % groups.length;
          return Math.floor((this.cubeSize - this.countByGroup('Colorless') - deltaGroup - this.multicolorSize) / groups.length);
        },
        extraSlots() {
          var groups = this.getGroups();
          var totalGroupSize = groups.map((group) => { return this.countByGroup(group) }).reduce((sum, count) => { return sum + count }, 0)
          return this.cubeSize - totalGroupSize - this.multicolorSize;
        },
        multiGroupSize() {
          var multiGroups = this.getMultiGroups();
          if (this.multicolorSize === 0) {
              return 0;
          }

          var modCount = this.multicolorSize % multiGroups.length;

          return (this.multicolorSize - modCount) / multiGroups.length;
        },
        removeCard(card) {
          let group = this.meta.mono["Colorless"].filter((group) => {
              return group.id === card.category;
          });

          if (group.length === 0 && card.colors && card.colors.length === 1) {
              group = this.meta.mono[this.translateColor(card.colors[0])].filter((group) => {
                  return group.id === card.category;
              });
          } 
          
          if (group.length === 0) {
              group = this.meta.multicolor.filter((group) => {
                  return group.id === card.category;
              });
          }

          group[0].cards.splice(group[0].cards.indexOf(card), 1)
        },
        addSlot(block) {
            block.cardSlots += 1;
        },
        removeSlot(block) {
            block.cardSlots -= 1;
        },
        translateColor(token) {
            let translator = {
                "W":"White",
                "U":"Blue",
                "B":"Black",
                "R":"Red",
                "G":"Green"
            };

            return translator[token];
        },
        copyToClipboard() {
            let list = [];
            if (!this.meta) {
                return list;
            }
    
            var groups = this.getGroups();
            groups.forEach((group) => {
                this.getTypes(group).forEach((type) => {
                    this.meta.mono[group].filter((statBlock) => {
                        return statBlock.type === type;
                    }).forEach((statBlock) => {
                        let names = statBlock.cards.map(card => card.name);
                        list = [...list, ...names];
                    });
                });
            });
            this.meta.multicolor.forEach((group) => {
                let names = group.cards.map(card => card.name);
                list = [...list, ...names];
            });

            const cubeList = list.join('\r');

            this.$copyText(cubeList).then(function (e) {
                this.$toasted.show('Copied list to the clipboard');
            }.bind(this), function (e) {
                this.$toasted.show('Something went wrong!');
            }.bind(this));

            //
        }
    },
    computed: {
    },
    beforeMount() {
        this.getMeta();
    },
    watch: {
      cubeSize() {
          this.normalizeMeta();
          this.computeFlexSlots();
      },
      multicolorSize() {
          this.normalizeMeta();
          this.computeFlexSlots();
      },
      change: {
        immediate: true,
        handler(val) {
            if (!val) {
                return;
            }

            if (!this.meta) {
                return;
            }

            if (!val.colors) {
                val.colors = val.card_faces[0].colors;
            }

            let group = this.meta.mono["Colorless"].filter((group) => {
                return group.id === val.category;
            });

            if (group.length === 0 && val.colors && val.colors.length === 1) {
                group = this.meta.mono[this.translateColor(val.colors[0])].filter((group) => {
                    return group.id === val.category;
                });
            } 
            
            if (group.length === 0) {
                group = this.meta.multicolor.filter((group) => {
                    return group.id === val.category;
                });
            }

            if (group[0]) {
                group[0].cards.push(val);
            }
        }
      }
    }
  }
</script>

<style scoped>
.v-popover {
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