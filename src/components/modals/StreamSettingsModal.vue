<template>
  <modal ref="modal" :title="$t('com.StreamSettingsModal.modal_title')">
    <div class="formfontdesc">
      <p v-html="$t('com.StreamSettingsModal.modal_desc')"></p>
      <table width="100%" class="FormTable modal-form-table" :class="{ locked: isLocked }">
        <thead>
          <tr>
            <td colspan="2">
              {{ $t('com.StreamSettingsModal.title') }}
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>
              {{ $t('com.StreamSettingsModal.label_security') }}
              <hint v-html="$t('com.StreamSettingsModal.hint_security')"></hint>
            </th>
            <td>
              <select class="input_option" v-model="transport.security">
                <option v-for="(opt, index) in securityOptions" :key="index" :value="opt">{{ opt }}</option>
              </select>
              <span class="row-buttons" v-if="transport.security != 'none'">
                <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click="manage_security" />
              </span>
              <modal ref="securityModal" :title="$t('com.StreamSettingsModal.modal_security_title')" v-if="transport.security != 'none'">
                <component :is="securityComponent" :transport="transport" v-model:proxyType="proxyType" />
              </modal>
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('com.StreamSettingsModal.label_network') }}
              <hint v-html="$t('com.StreamSettingsModal.hint_network')"></hint>
            </th>
            <td>
              <select class="input_option" v-model="transport.network">
                <option v-for="(opt, index) in transportOptions" :key="index" :value="opt">{{ opt }}</option>
              </select>
              <span class="hint-color">default: tcp</span>
            </td>
          </tr>
          <tr class="unlocked">
            <th>
              {{ $t('com.StreamSettingsModal.label_tproxy') }}
              <hint v-html="$t('com.StreamSettingsModal.hint_tproxy')"></hint>
            </th>
            <td>
              <span class="row-buttons">
                <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click="manage_sockopt" />
                <modal ref="sockoptModal" title="Sockopt Settings">
                  <sockopt v-model:transport="transport"></sockopt>
                </modal>
              </span>
            </td>
          </tr>
        </tbody>
        <component :is="networkComponent" :transport="transport" :proxyType="proxyType" />
      </table>
    </div>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" :value="$t('labels.save')" @click.prevent="save" />
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref, computed } from 'vue';

  import { ITransportNetwork, IProtocolType } from '@/modules/Interfaces';
  import { XrayInboundObject } from '@/modules/InboundObjects';
  import { XrayOutboundObject } from '@/modules/OutboundObjects';
  import { XrayOptions } from '@/modules/Options';
  import {
    XrayStreamGrpcSettingsObject,
    XrayStreamTcpSettingsObject,
    XrayStreamKcpSettingsObject,
    XrayStreamHttpSettingsObject,
    XrayStreamWsSettingsObject,
    XrayStreamHttpUpgradeSettingsObject,
    XrayStreamSplitHttpSettingsObject
  } from '@/modules/TransportObjects';
  import { XrayStreamSettingsObject, XrayStreamRealitySettingsObject, XrayStreamTlsSettingsObject } from '@/modules/CommonObjects';

  import Hint from '@main/Hint.vue';
  import Modal from '@main/Modal.vue';

  import NetworkTcp from '../transport/Tcp.vue';
  import NetworkKcp from '../transport/Kcp.vue';
  import NetworkWs from '../transport/Ws.vue';
  import NetworkHttp from '../transport/Http.vue';
  import NetworkHttpUpgrade from '../transport/HttpUpgrade.vue';
  import NetworkGrpc from '../transport/Grpc.vue';
  import Sockopt from '../transport/Sockopt.vue';

  import SecurityTls from '../security/Tls.vue';
  import SecurityReality from '../security/Reality.vue';

  export default defineComponent({
    name: 'StreamSettingsModal',
    components: {
      Modal,
      Sockopt,
      Hint
    },
    props: {
      transport: XrayStreamSettingsObject
    },
    methods: {},
    setup(props, { emit }) {
      const modal = ref();
      const securityModal = ref();
      const sockoptModal = ref();
      const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());
      const network = ref<ITransportNetwork>();
      const proxyType = ref<string>('');
      const proxySubscribeUrl = ref<string>('');

      const isLocked = computed(() => !!proxySubscribeUrl.value?.trim());

      const networkComponent = computed(() => {
        switch (transport.value.network) {
          case 'tcp':
            transport.value.tcpSettings = transport.value.tcpSettings ?? new XrayStreamTcpSettingsObject();
            return NetworkTcp;
          case 'kcp':
            transport.value.kcpSettings = transport.value.kcpSettings ?? new XrayStreamKcpSettingsObject();
            return NetworkKcp;
          case 'ws':
            transport.value.wsSettings = transport.value.wsSettings ?? new XrayStreamWsSettingsObject();
            return NetworkWs;
          case 'xhttp':
            transport.value.xhttpSettings = transport.value.xhttpSettings ?? new XrayStreamHttpSettingsObject();
            return NetworkHttp;
          case 'httpupgrade':
            transport.value.httpupgradeSettings = transport.value.httpupgradeSettings ?? new XrayStreamHttpUpgradeSettingsObject();
            return NetworkHttpUpgrade;
          case 'grpc':
            transport.value.grpcSettings = transport.value.grpcSettings ?? new XrayStreamGrpcSettingsObject();
            return NetworkGrpc;
          default:
            return null;
        }
      });

      const securityComponent = computed(() => {
        switch (transport.value.security) {
          case 'tls':
            transport.value.tlsSettings = transport.value.tlsSettings ?? new XrayStreamTlsSettingsObject();
            return SecurityTls;
          case 'reality':
            transport.value.realitySettings = transport.value.realitySettings ?? new XrayStreamRealitySettingsObject();
            return SecurityReality;

          default:
            return null;
        }
      });

      const manage_security = () => {
        securityModal.value.show();
      };
      const manage_sockopt = () => {
        sockoptModal.value.show();
      };

      const show = (proxy: XrayInboundObject<IProtocolType> | XrayOutboundObject<IProtocolType>, pxtype: string) => {
        proxy.streamSettings = transport.value = proxy.streamSettings ?? new XrayStreamSettingsObject();
        proxyType.value = pxtype;

        proxySubscribeUrl.value = (proxy as XrayOutboundObject<IProtocolType>).surl ?? '';
        console.log('proxySubscribeUrl', proxySubscribeUrl.value);
        modal.value.show();
      };
      const save = () => {
        emit('save', transport.value);
        modal.value.close();
      };

      return {
        transport,
        network,
        modal,
        securityModal,
        sockoptModal,
        networkComponent,
        securityComponent,
        proxyType,
        securityOptions: XrayOptions.securityOptions,
        transportOptions: XrayOptions.transportOptions,
        manage_security,
        manage_sockopt,
        show,
        save,
        isLocked
      };
    }
  });
</script>
