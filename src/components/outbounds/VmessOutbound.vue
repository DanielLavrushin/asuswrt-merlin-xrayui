<template>
  <div class="formfontdesc">
    <p v-html="$t('com.VmessOutbound.modal_desc')"></p>
    <table width="100%" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2" v-html="$t('com.VmessOutbound.modal_title')"></td>
        </tr>
      </thead>
      <tbody v-if="proxy.settings">
        <outbound-common v-model:proxy="proxy" @apply-parsed="applyParsed"></outbound-common>
        <tr>
          <th>
            {{ $t('com.VmessOutbound.label_address') }}
            <hint v-html="$t('com.VmessOutbound.hint_address')"></hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.vnext[0].address" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.VmessOutbound.label_port') }}
            <hint v-html="$t('com.VmessOutbound.hint_port')"></hint>
          </th>
          <td>
            <input
              type="number"
              maxlength="5"
              class="input_6_table"
              v-model="proxy.settings.vnext[0].port"
              autocorrect="off"
              autocapitalize="off"
              onkeypress="return validator.isNumber(this,event);"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <clients :clients="users" :proxy="proxy" mode="outbound"></clients>
  </div>
</template>
<script lang="ts">
  import { defineComponent, ref, watch } from 'vue';
  import { XrayOutboundObject, XrayVmessOutboundObject } from '@/modules/OutboundObjects';
  import { XrayProtocol } from '@/modules/CommonObjects';
  import { XrayVmessClientObject } from '@/modules/ClientsObjects';
  import OutboundCommon from './OutboundCommon.vue';
  import Clients from '@clients/VmessClients.vue';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'VmessOutbound',
    components: {
      OutboundCommon,
      Clients,
      Hint
    },
    props: {
      proxy: XrayOutboundObject<XrayVmessOutboundObject>
    },
    setup(props, { emit }) {
      const proxy = ref<XrayOutboundObject<XrayVmessOutboundObject>>(
        props.proxy ?? new XrayOutboundObject<XrayVmessOutboundObject>(XrayProtocol.VMESS, new XrayVmessOutboundObject())
      );

      if (proxy.value.settings?.vnext.length == 0) {
        proxy.value.settings?.vnext.push({
          address: '',
          port: 443,
          users: []
        });
      }

      const users = ref(proxy.value.settings?.vnext[0].users as XrayVmessClientObject[]);
      watch(
        () => users.value.length,
        () => {
          if (!proxy.value.settings) return;
          proxy.value.settings.vnext[0].users = users.value;
        }
      );

      const applyParsed = (parsed: XrayOutboundObject<XrayVmessOutboundObject>) => {
        proxy.value.tag = proxy.value.tag || parsed.tag;
        proxy.value.surl = undefined;
        if (!parsed.settings?.vnext?.length || !proxy.value.settings?.vnext?.length) return;
        const src = parsed.settings.vnext[0];
        const dst = proxy.value.settings.vnext[0];
        dst.address = src.address;
        dst.port = src.port;
        dst.users?.splice(0, dst.users.length, ...(src.users ?? []));

        if (parsed.streamSettings) {
          proxy.value.streamSettings = parsed.streamSettings;
        }

        emit('update:proxy', proxy.value);
      };
      return {
        proxy,
        users,
        applyParsed
      };
    }
  });
</script>
