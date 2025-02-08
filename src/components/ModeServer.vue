<template>
  <server-status v-if="engine.mode == 'server'" v-model:config="config"></server-status>
  <client-status v-if="engine.mode == 'client'" v-model:config="config"></client-status>
  <inbounds @show-transport="show_transport" @show-sniffing="show_sniffing"></inbounds>
  <outbounds @show-transport="show_transport"></outbounds>
  <dns></dns>
  <routing></routing>
  <sniffing-modal ref="sniffingModal" />
  <stream-settings-modal ref="transportModal" />
  <div class="apply_gen">
    <input class="button_gen" @click.prevent="applySettings()" type="button" :value="$t('labels.apply')" />
  </div>
  <clients-online v-if="engine.mode == 'server'"></clients-online>
  <logs-manager v-if="config.log" v-model:logs="config.log"></logs-manager>
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
import LogsManager from "./Logs.vue";
import { XrayObject } from "@/modules/XrayConfig";

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
    StreamSettingsModal,
    LogsManager
  },
  props: {
    config: {
      type: XrayObject,
      required: true
    }
  },

  setup(props) {
    const config = ref(props.config);
    const transportModal = ref();
    const sniffingModal = ref();

    const show_transport = (proxy: XrayInboundObject<IProtocolType> | XrayOutboundObject<IProtocolType>, type: string) => {
      transportModal.value.show(proxy, type);
    }

    const show_sniffing = (proxy: XrayInboundObject<IProtocolType>) => {
      sniffingModal.value.show(proxy);
    }

    const applySettings = async () => {
      await engine.executeWithLoadingProgress(async () => {
        let cfg = engine.prepareServerConfig(config.value);
        await engine.submit(SubmtActions.configurationApply, cfg);
        await engine.loadXrayConfig();
      });
    };

    return {
      config,
      engine,
      transportModal,
      sniffingModal,
      applySettings,
      show_transport,
      show_sniffing
    };
  },
});
</script>

<style scoped>
.apply_gen {
  margin-bottom: 10px;
}
</style>
<style>
.FormTable tr.proxy-row th {
  font-weight: bold;
}

.FormTable tr.proxy-row:hover th {
  text-shadow: 2px 2px 25px #fc0;
}

.FormTable tr.proxy-row:hover>:last-child {
  border-right-color: #fc0;
}


.FormTable tr.proxy-row:hover>* {
  border-left-color: #fc0;
}
</style>
