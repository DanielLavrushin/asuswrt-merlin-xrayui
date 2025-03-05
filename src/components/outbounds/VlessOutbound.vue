<template>
  <div class="formfontdesc">
    <p>{{ $t("components.VlessOutbound.modal_desc") }}</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">{{ $t("components.VlessOutbound.modal_title") }}</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common :proxy="proxy"></outbound-common>
        <tr>
          <th>
            {{ $t("components.VlessOutbound.label_address") }}
            <hint v-html="$t('components.VlessOutbound.hint_address')"></hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.vnext[0].address" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t("components.VlessOutbound.label_port") }}
            <hint v-html="$t('components.VlessOutbound.hint_port')"></hint>
          </th>
          <td>
            <input type="number" maxlength="5" class="input_6_table" v-model="proxy.settings.vnext[0].port" autocorrect="off" autocapitalize="off" onkeypress="return validator.isNumber(this,event);" />
          </td>
        </tr>
      </tbody>
    </table>
    <clients :clients="users" mode="outbound"></clients>
  </div>
</template>
<script lang="ts">
  import { defineComponent, ref, watch } from "vue";
  import { XrayOutboundObject, XrayVlessOutboundObject } from "../../modules/OutboundObjects";
  import { XrayProtocol } from "../../modules/CommonObjects";
  import { XrayVlessClientObject } from "../../modules/ClientsObjects";
  import OutboundCommon from "./OutboundCommon.vue";
  import Clients from "./../clients/VlessClients.vue";
  import Hint from "./../Hint.vue";

  export default defineComponent({
    name: "VlessOutbound",
    components: {
      OutboundCommon,
      Clients,
      Hint
    },
    props: {
      proxy: XrayOutboundObject<XrayVlessOutboundObject>
    },
    setup(props) {
      const proxy = ref<XrayOutboundObject<XrayVlessOutboundObject>>(props.proxy ?? new XrayOutboundObject<XrayVlessOutboundObject>(XrayProtocol.VLESS, new XrayVlessOutboundObject()));

      if (proxy.value.settings.vnext.length == 0) {
        proxy.value.settings.vnext.push({
          address: "",
          port: 443,
          users: []
        });
      }

      const users = ref(proxy.value.settings.vnext[0].users as XrayVlessClientObject[]);
      watch(
        () => users.value.length,
        () => {
          proxy.value.settings.vnext[0].users = users.value;
        }
      );
      return {
        proxy,
        users
      };
    }
  });
</script>
