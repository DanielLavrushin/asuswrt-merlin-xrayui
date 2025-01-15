<template>
    <server-status v-if="engine.mode == 'server'"></server-status>
    <client-status v-if="engine.mode == 'client'"></client-status>
    <inbounds @show-transport="show_transport" @show-sniffing="show_sniffing"></inbounds>
    <outbounds @show-transport="show_transport"></outbounds>
    <dns></dns>
    <routing></routing>
    <sniffing-modal ref="sniffingModal" />
    <stream-settings-modal ref="transportModal" />
    <div id=" divApply" class="apply_gen">
        <input class="button_gen" @click.prevent="applyClientSettings()" type="button" value="Apply" />
    </div>
    <clients-online v-if="engine.mode == 'server'"></clients-online>
    <version></version>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import engine, { SubmtActions } from "../modules/Engine";

import Modal from "./Modal.vue";

import { IProtocolType } from "../modules/Interfaces";
import { XrayInboundObject } from "../modules/InboundObjects";
import { XrayOutboundObject } from "../modules/OutboundObjects";

import ServerStatus from "./ServerStatus.vue";
import ClientStatus from "./ClientStatus.vue";
import Inbounds from "./Inbounds.vue";
import Outbounds from "./Outbounds.vue";
import Routing from "./Routing.vue";
import Dns from "./Dns.vue";
import Version from "./Version.vue";
import ClientsOnline from "./ClientsOnline.vue";

import SniffingModal from "./modals/SniffingModal.vue";
import StreamSettingsModal from "./modals/StreamSettingsModal.vue";

export default defineComponent({
    name: "ModeServer",
    components: {
        Modal,
        Routing,
        Inbounds,
        Dns,
        Version,
        Outbounds,
        ServerStatus,
        ClientStatus,
        SniffingModal,
        ClientsOnline,
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
            let delay = 10000;
            window.showLoading(delay, "waiting");
            let config = await engine.prepareServerConfig();

            await engine.submit(SubmtActions.ConfigurationApply, config, delay);
            await engine.loadXrayConfig();
            window.hideLoading();
            window.location.reload();
        },
    },

    setup() {
        const config = ref(engine.xrayConfig);
        const transportModal = ref();
        const sniffingModal = ref();

        return {
            config,
            engine,
            transportModal,
            sniffingModal,
        };
    },
});
</script>

<style scoped></style>