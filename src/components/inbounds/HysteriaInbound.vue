<template>
  <div class="formfontdesc">
    <p>{{ $t('com.HysteriaInbound.modal_desc') }}</p>
    <table width="100%" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">{{ $t('com.HysteriaInbound.modal_title') }}</td>
        </tr>
      </thead>
      <tbody>
        <inbound-common :inbound="inbound"></inbound-common>
      </tbody>
    </table>
    <clients :clients="inbound.settings.clients" :proxy="inbound"></clients>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import Clients from '@clients/HysteriaClients.vue';
  import InboundCommon from './InboundCommon.vue';
  import { XrayProtocol, XrayStreamSettingsObject, XrayStreamTlsSettingsObject } from '@/modules/CommonObjects';
  import { XrayInboundObject, XrayHysteriaInboundObject } from '@/modules/InboundObjects';
  import { XrayStreamHysteriaSettingsObject } from '@/modules/TransportObjects';

  export default defineComponent({
    name: 'HysteriaInbound',
    components: {
      Clients,
      InboundCommon
    },
    props: {
      inbound: XrayInboundObject<XrayHysteriaInboundObject>
    },
    setup(props) {
      const inbound = ref<XrayInboundObject<XrayHysteriaInboundObject>>(
        props.inbound ?? new XrayInboundObject<XrayHysteriaInboundObject>(XrayProtocol.HYSTERIA, new XrayHysteriaInboundObject())
      );

      if (!inbound.value.streamSettings) {
        inbound.value.streamSettings = new XrayStreamSettingsObject();
      }
      inbound.value.streamSettings.network = 'hysteria';
      inbound.value.streamSettings.security = 'tls';

      // Hysteria is QUIC/UDP — sniffing is TCP-stream oriented and can interfere with the handshake.
      inbound.value.sniffing = undefined;
      // tproxy on a QUIC listener breaks reply routing (IP_TRANSPARENT reverse path).
      if (inbound.value.streamSettings.sockopt?.tproxy === 'tproxy') {
        inbound.value.streamSettings.sockopt.tproxy = undefined;
      }

      if (!inbound.value.streamSettings.hysteriaSettings) {
        inbound.value.streamSettings.hysteriaSettings = new XrayStreamHysteriaSettingsObject();
      }

      if (!inbound.value.streamSettings.tlsSettings) {
        inbound.value.streamSettings.tlsSettings = new XrayStreamTlsSettingsObject();
        inbound.value.streamSettings.tlsSettings.alpn = ['h3'];
      }

      return {
        inbound
      };
    }
  });
</script>
