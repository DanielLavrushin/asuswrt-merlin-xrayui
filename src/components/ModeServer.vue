<template>
    <server-status></server-status>
    <inbounds @show-transport="show_transport" @show-sniffing="show_sniffing"></inbounds>
    <outbounds @show-transport="show_transport"></outbounds>
    <routing></routing>
    <sniffing-modal ref="sniffingModal" />
    <stream-settings-modal ref="transportModal" />
    <div id=" divApply" class="apply_gen">
        <input class="button_gen" @click.prevent="applyClientSettings()" type="button" value="Apply" />
    </div>

</template>

<script lang="ts">
import { defineComponent, ref, computed, nextTick } from "vue";
import engine from "../modules/Engine";

import Modal from "./Modal.vue";

import { XrayInboundObject, XrayOutboundObject, IProtocolType } from "../modules/XrayConfig";

import ServerStatus from "./ServerStatus.vue";
import Inbounds from "./Inbounds.vue";
import Outbounds from "./Outbounds.vue";
import Routing from "./Routing.vue";

import SniffingModal from "./modals/SniffingModal.vue";
import StreamSettingsModal from "./modals/StreamSettingsModal.vue";

export default defineComponent({
    name: "ModeServer",
    components: {
        Modal,
        Routing,
        Inbounds,
        Outbounds,
        ServerStatus,
        SniffingModal,
        StreamSettingsModal
    },
    methods: {

        async show_transport(proxy: XrayInboundObject<IProtocolType> | XrayOutboundObject<IProtocolType>) {
            this.transportModal.show(proxy);
        },
        async show_sniffing(proxy: XrayInboundObject<IProtocolType>) {
            this.sniffingModal.show(proxy);
        },

        async applyClientSettings() {
            let delay = 5000;
            window.showLoading(delay / 1000);
            window.hideLoading();
        },
    },

    setup() {
        const config = ref(engine.xrayConfig);
        const transportModal = ref();
        const sniffingModal = ref();

        return {
            config,
            transportModal,
            sniffingModal,
        };
    },
});
</script>

<style scoped></style>