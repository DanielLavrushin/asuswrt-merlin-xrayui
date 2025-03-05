<template>
  <div class="formfontdesc">
    <p>VLESS is a stateless lightweight transport protocol that consists of inbound and outbound parts. It can serve as a bridge between Xray clients and servers.</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">VLESS</td>
        </tr>
      </thead>
      <tbody>
        <inbound-common :inbound="inbound"></inbound-common>
      </tbody>
    </table>
    <vless-clients :clients="inbound.settings.clients" :proxy="inbound"></vless-clients>
  </div>
</template>
<script lang="ts">
  import { defineComponent, ref } from "vue";
  import VlessClients from "../clients/VlessClients.vue";
  import InboundCommon from "./InboundCommon.vue";
  import { XrayProtocol } from "../../modules/CommonObjects";
  import { XrayInboundObject } from "../../modules/InboundObjects";
  import { XrayVlessInboundObject } from "../../modules/InboundObjects";

  export default defineComponent({
    name: "VmessInbound",
    components: {
      VlessClients,
      InboundCommon
    },
    props: {
      inbound: XrayInboundObject<XrayVlessInboundObject>
    },
    setup(props) {
      const inbound = ref<XrayInboundObject<XrayVlessInboundObject>>(props.inbound ?? new XrayInboundObject<XrayVlessInboundObject>(XrayProtocol.VLESS, new XrayVlessInboundObject()));
      return {
        inbound
      };
    }
  });
</script>
