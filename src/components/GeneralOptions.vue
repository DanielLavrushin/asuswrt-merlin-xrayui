<template>
  <tr>
    <th>General options</th>
    <td>
      <label class="go-option">
        <input type="checkbox" v-model="startup" @click="updatestartup" /> Start Xray on
        startup</label>
      <label class="go-option">
        <input type="checkbox" v-model="checkconenabled" @change="setcheckconnection" /> Check connection to xray
        server</label>
      <modal ref="connModal" title="Enable Connection Check" width="450">
        <div class="formfontdesc">
          <p>
            This option verifies that the actual connection is working by sending a request to
            <a href="https://freeipapi.com/" target="_blank">freeipapi.com</a> through the outbound proxy at startup.
          </p>
          <p>
            XRAYUI will insert a system rule into the routing rules and create a SOCKS inbound proxy for this check.
            These system settings are tagged with `sys` and will remain hidden in the UI.
          </p>
        </div>
        <template #footer>
          <input class="button_gen button_gen_small" type="button" value="cancel" @click.prevent="concheckcancel" />
          <input class="button_gen button_gen_small" type="button" value="accept" @click.prevent="concheckaccept" />
        </template>
      </modal>
    </td>
  </tr>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import engine, { SubmtActions } from "../modules/Engine";
import { XrayObject } from "@/modules/XrayConfig";
import { XrayProtocol, XrayRoutingRuleObject } from "@/modules/CommonObjects";

import Modal from "./Modal.vue";
import { XrayInboundObject, XraySocksInboundObject } from "@/modules/InboundObjects";

export default defineComponent({
  name: "GeneralOptions",
  components: {
    Modal,
  },
  props: {
    config: {
      type: XrayObject,
      required: true,
    }
  },
  setup(props) {
    const connModal = ref();

    const startup = ref<boolean>(window.xray.custom_settings.xray_startup === "y");

    const checkconenabled = ref<boolean>(props.config.routing?.rules?.find((r) => r.name === XrayRoutingRuleObject.connectionCheckRuleName) !== undefined);

    watch(() => props.config.routing?.rules, (rules) => {
      checkconenabled.value = rules?.find((r) => r.name === XrayRoutingRuleObject.connectionCheckRuleName) !== undefined;
    });

    const updatestartup = async () => {
      await engine.submit(SubmtActions.toggleStartupOption);
      window.xray.custom_settings.xray_startup = window.xray.custom_settings.xray_startup === "y" ? "n" : "y";
    };

    const setcheckconnection = async () => {
      if (checkconenabled.value) {
        connModal.value.show();
      } else {
        const rule = props.config.routing?.rules?.find((r) => r.name === XrayRoutingRuleObject.connectionCheckRuleName);
        if (rule) {
          props.config.routing?.rules?.splice(props.config.routing?.rules?.indexOf(rule), 1);
        }

        const socks = props.config.inbounds?.find((i) => i.tag === "sys:socks-in");
        if (socks) {
          props.config.inbounds?.splice(props.config.inbounds?.indexOf(socks), 1);
        }
      }



    };
    const concheckcancel = async () => {
      checkconenabled.value = false;
      connModal.value.close();
    };
    const concheckaccept = async () => {
      if (checkconenabled.value) {
        const socks = new XrayInboundObject<XraySocksInboundObject>(XrayProtocol.SOCKS, new XraySocksInboundObject());
        socks.listen = "127.0.0.1";
        socks.tag = "sys:socks-in";
        socks.port = 1080;
        props.config.inbounds.push(socks);

        if (props.config.routing) {
          const rule = new XrayRoutingRuleObject();
          rule.name = XrayRoutingRuleObject.connectionCheckRuleName;
          rule.domain = ["freeipapi.com"];

          const outbound = props.config.outbounds?.find((o) => o.protocol !== XrayProtocol.FREEDOM && o.protocol !== XrayProtocol.BLACKHOLE);
          rule.outboundTag = outbound?.tag;

          props.config.routing.rules = [rule].concat(props.config.routing.rules || []);
        }
        connModal.value.close();
        await engine.executeWithLoadingProgress(async () => {
          let cfg = engine.prepareServerConfig(props.config);
          await engine.submit(SubmtActions.configurationApply, cfg);
          await engine.loadXrayConfig();
        });
      }
    };

    return {
      startup,
      connModal,
      checkconenabled,
      config: props.config,
      updatestartup,
      setcheckconnection,
      concheckcancel,
      concheckaccept,
    };
  },
});
</script>

<style scoped>
.go-option {
  cursor: pointer;
  margin-right: 10px;
}

.go-option:hover {
  text-shadow: 0 0 5px #000;
}
</style>