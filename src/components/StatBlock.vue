<template>
    <ul>
        <li><span>cmc {{stat.cmc}}</span><button v-if="extraSlots > 0" class="button is-small is-rounded" @click="addSlot()">+</button><button class="button is-small is-rounded" @click="removeSlot()">-</button></li>
        <li v-bind:key="[card.name, index].join('.')" v-for="(card,index) in stat.cards">
            <v-popover offset="16">
                <span class="tooltip-target b3 is-size-7">{{card.name}}</span>
                <template slot="popover">
                    <img :src="cardUrl(card.multiverseid)" />
                </template>
            </v-popover>    
            
            <button class="button is-small is-rounded" @click="removeCard(card)">-</button>
        </li>
        
        
        <li v-bind:key="[stat.color,stat.type,stat.cmc,n].join('.')" v-for="n in openSlots()">
            <span class="is-size-7">Open Slot </span><button class="button is-small is-rounded" @click="$emit('open-modal', stat)">+</button>
        </li>
    </ul>
</template>

<script>
import {VTooltip, VPopover} from 'v-tooltip';

export default {
    name: "StatBlock",
    components: {
        VTooltip, VPopover
    },
    props: {
        stat: Object,
        extraSlots: Number
    },
    data: function() {
        return {
            cardSlots: 0
        }
    },
    methods: {
        openSlots() {
            return this.cardSlots - this.stat.cards.length;
        },
        removeCard(card) {
            return card;
        },
        addSlot() {
            this.stat.cardSlots = this.stat.cardSlots + 1;
            this.cardSlots = this.stat.cardSlots;
        },
        removeSlot() {
            this.stat.cardSlots = this.stat.cardSlots - 1;
            this.cardSlots = this.stat.cardSlots;
        }
    },
    beforeMount() {
        this.cardSlots = this.stat.cardSlots;
    },
    watch: {
        cardSlots() {
            this.stat.cardSlots = this.cardSlots;
        }
    }
}
</script>

<style scoped>

</style>
