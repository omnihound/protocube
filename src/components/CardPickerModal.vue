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
            <div class="lds-css" v-if="cards.length === 0" >
              <div style="width:100%;height:100%;margin:0 auto" class="lds-ball" >
                <div></div>
              </div>
            </div>
            <slot name="body">
              <carousel v-if="cards.length > 0" :perPageCustom="[[768, 3], [1024, 4]]">
                <slide v-bind:key="[card.id,index].join('.')" v-for="(card,index) in filterBySearch()" class="p-l-10 p-r-10">
                  <span class="is-size-7">{{ card.name }}</span>
                  <img v-if="card.image_uris" v-bind:src="card.image_uris.normal" @click="selectCard(card)" v-bind:class="{ 'is-focused': selected.id === card.id }" />
                  <div v-if="!card.image_uris">
                    <vue-flip width="100%" active-hover>
                      <div slot="front">
                        <img v-bind:src="card.card_faces[0].image_uris.normal" @click="selectCard(card)" v-bind:class="{ 'is-focused': selected.id === card.id }" />
                      </div>
                      <div slot="back">
                        <img v-bind:src="card.card_faces[1].image_uris.normal" @click="selectCard(card)" v-bind:class="{ 'is-focused': selected.id === card.id }" />
                      </div>
                    </vue-flip>
                  </div>
                </slide>
              </carousel>
            </slot>
          </div>

          <div class="modal-footer">
            <slot name="footer">
              <button class="modal-default-button" @click="$emit('close-modal', selected)">
                OK
              </button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>
<script>
import { Carousel, Slide } from 'vue-carousel';
import VueFlip from 'vue-flip';
import 'vue-nav-tabs/themes/vue-tabs.css'

export default {
    components: {
      Carousel,
      Slide,
      VueFlip
    },
    props: {
      query: Object
    },
    data: function() {
        return {
          search: '',
          cards: [],
          selected: {}
        }
    },
    computed: {
    },
    methods: {
      filterBySearch: function() {
        let cardRegex = new RegExp(this.search.toLowerCase(), 'g');
        return this.cards.filter(function (card){
          let oracle_text;

          if (card.card_faces) {
            oracle_text = card.card_faces.map((face) => face.oracle_text).join(' ');
          } else {
            oracle_text = card.oracle_text;
          }

          let matches = [card.name, oracle_text, card.type_line].join(' ').toLowerCase().match(cardRegex);
          if (!matches) return false;
          return matches.length > 0;
        })
      },
      selectCard: function(card) {
        if (card.id === this.selected.id) {
          this.selected = {};
        } else {
          this.selected = card;
          this.selected.category = this.query.id;
        }
      },
      scryFallQueryString: function(query) {
        let translator = {
          "White":"W",
          "Blue":"U",
          "Black":"B",
          "Red":"R",
          "Green":"G"
        };

        let typeStringArray = [];
        
        if (query.types) {
          typeStringArray = query.types.reduce((stringTypes, type) => {
            stringTypes.push(`type=${type}`)

            return stringTypes;
          }, []);
        }


        if (query.types && query.types.length === 1 && query.types[0] === 'Land') {
          return typeStringArray.join(' ');
        }

        if (query.colors.length === 0) {
          return [...typeStringArray, `cmc=${query.cmc}`, 'color=C'].join(' ');
        }

        if (query.colors.length === 1) {
          return [...typeStringArray, query.cmc ? `cmc=${query.cmc}` : '', `color=${translator[query.colors[0]]}`].join(' ');
        }

        //multicolor conditional
        let colorCombo = query.colors.map((token) => translator[token]).join('');

        return [...typeStringArray, query.cmc ? `cmc=${query.cmc}` : '',`id=${colorCombo} OR color=${colorCombo}`].join(' ');
      },
      queryCards: async function(query, page = 1) {
        let result = await this.$http.get(`https://api.scryfall.com/cards/search?order=name&page=${page}&q=${encodeURIComponent(this.scryFallQueryString(query))}`);

        this.cards = [...this.cards, ...result.body.data.sort((a, b) => ('' + a.name).localeCompare(b.name))];

        if(result.body.has_more) {
          setTimeout(this.queryCards(this.queryBody(this.query), page + 1), 100);
        }
      },
      queryBody: function(val) {
          let colors = [];

          if (val.colors) {
            colors = val.colors;
          } else if (val.color) {
            if (val.color !== "Colorless") {
            colors = [val.color];
            }
          }

          let types = null;
          if (val.color === "Colorless" && val.type === "Creature") {
            types = ['Artifact','Creature'];
          } else if (val.type) {
            types = [val.type]
          }

          return {cmc: val.cmc,
            colors,
            types
          };
      },
      cardUrl: function(card) {
        if (card.image_uris) {
          return card.image_uris.normal;
        }
      }
    },
    beforeMount() {
    },
    watch: {
      selected: function() {

      },
      query: {
        immediate: true, 
        handler (val) {
          this.cards = [];

          this.queryCards(this.queryBody(val));
        }
      }
    }
}
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

.modal-default-button {
  float: right;
}

/*
 * The following styles are auto-applied to elements with
 * transition="modal" when their visibility is toggled
 * by Vue.js.
 *
 * You can easily play with the modal transition by editing
 * these styles.
 */

.modal-enter {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter .modal-container,
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
    -webkit-transform: translate(0, 0);
    transform: translate(0, 0);
  }
  50% {
    -webkit-transform: translate(0, 108px);
    transform: translate(0, 108px);
    animation-timing-function: cubic-bezier(0, 0.45, 0.55, 0.9);
  }
  100% {
    -webkit-transform: translate(0, 0);
    transform: translate(0, 0);
  }
}
@-webkit-keyframes lds-ball {
  0%, 100% {
    animation-timing-function: cubic-bezier(0.45, 0, 0.9, 0.55);
  }
  0% {
    -webkit-transform: translate(0, 0);
    transform: translate(0, 0);
  }
  50% {
    -webkit-transform: translate(0, 108px);
    transform: translate(0, 108px);
    animation-timing-function: cubic-bezier(0, 0.45, 0.55, 0.9);
  }
  100% {
    -webkit-transform: translate(0, 0);
    transform: translate(0, 0);
  }
}
.lds-ball {
  position: relative;
}
.lds-ball div {
  position: absolute;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: hsl(171, 100%, 41%);
  left: 74px;
  top: 20px;
  -webkit-animation: lds-ball 1s linear infinite;
  animation: lds-ball 1s linear infinite;
}
.lds-ball {
  width: 200px !important;
  height: 200px !important;
  -webkit-transform: translate(-100px, -100px) scale(1) translate(100px, 100px);
  transform: translate(-100px, -100px) scale(1) translate(100px, 100px);
}
</style>
