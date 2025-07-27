<template>
  <div class="formfontdesc" v-if="proxy.settings">
    <p>{{ $t('com.VlessOutbound.modal_desc') }}</p>
    <table width="100%" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">{{ $t('com.VlessOutbound.modal_title') }}</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common v-model:proxy="proxy" @apply-parsed="applyParsed"></outbound-common>
        <tr>
          <th>
            {{ $t('com.VlessOutbound.label_address') }}
            <hint v-html="$t('com.VlessOutbound.hint_address')"></hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.vnext[0].address" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.VlessOutbound.label_port') }}
            <hint v-html="$t('com.VlessOutbound.hint_port')"></hint>
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
    <clients v-model:clients="users" v-model:proxy="proxy" mode="outbound"></clients>
  </div>
</template>
<script lang="ts">
  import { computed, defineComponent, ref, watch } from 'vue';
  import { XrayOutboundObject, XrayVlessOutboundObject } from '@/modules/OutboundObjects';
  import { XrayProtocol } from '@/modules/CommonObjects';
  import { XrayVlessClientObject } from '@/modules/ClientsObjects';
  import OutboundCommon from './OutboundCommon.vue';
  import Clients from '@clients/VlessClients.vue';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'VlessOutbound',
    components: {
      OutboundCommon,
      Clients,
      Hint
    },
    props: {
      proxy: XrayOutboundObject<XrayVlessOutboundObject>
    },
    setup(props, { emit }) {
      const proxy = ref<XrayOutboundObject<XrayVlessOutboundObject>>(
        props.proxy ?? new XrayOutboundObject<XrayVlessOutboundObject>(XrayProtocol.VLESS, new XrayVlessOutboundObject())
      );

      if (proxy.value.settings?.vnext.length == 0) {
        proxy.value.settings.vnext.push({
          address: '',
          port: 443,
          users: []
        });
      }

      const users = computed<XrayVlessClientObject[]>({
        get: () => proxy.value.settings?.vnext?.[0]?.users ?? [],
        set: (val) => {
          if (!proxy.value.settings) return;
          proxy.value.settings.vnext[0].users = val;
        }
      });

      watch(
        () => users.value.length,
        () => {
          if (proxy.value.settings) {
            proxy.value.settings.vnext[0].users = users.value;
          }
        }
      );

      const applyParsed = (parsed: XrayOutboundObject<XrayVlessOutboundObject>) => {
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
