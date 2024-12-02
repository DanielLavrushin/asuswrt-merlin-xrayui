<template>
  <modal ref="modal" title="Transports specify how Xray communicates with peers">
    <div class="formfontdesc">
      <p>Transports specify how to achieve stable data transmission. Both ends of a connection often need to specify the same transport protocol to successfully establish a connection. Like, if one end uses WebSocket, the other end must also use WebSocket, or else the connection cannot be established.</p>
      <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
        <thead>
          <tr>
            <td colspan="2">Settings</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Security</th>
            <td>
              <select class="input_option" v-model="transport.security">
                <option v-for="(opt, index) in securityOptions" :key="index" :value="opt">{{ opt }}</option>
              </select>
              <span class="row-buttons" v-if="transport.security != 'none'">
                <input class="button_gen button_gen_small" type="button" value="settings" @click="manage_security" />
              </span>
              <modal ref="securityModal" title="Security Settings" v-if="transport.security != 'none'">
                <component :is="securityComponent" :transport="transport" />
              </modal>
            </td>
          </tr>
          <tr>
            <th>Network</th>
            <td>
              <select class="input_option" v-model="transport.network">
                <option v-for="(opt, index) in transportOptions" :key="index" :value="opt">{{ opt }}</option>
              </select>
              <span class="hint-color">default: tcp</span>
            </td>
          </tr>
        </tbody>
        <component :is="networkComponent" :transport="transport" />
      </table>
    </div>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" value="Save" @click.prevent="save" />
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref, computed } from "vue";

  import { ITransportNetwork, IProtocolType } from "../../modules/Interfaces";
  import { XrayInboundObject } from "../../modules/InboundObjects";
  import { XrayOptions } from "../../modules/Options";
  import { XrayStreamGrpcSettingsObject, XrayStreamTcpSettingsObject, XrayStreamKcpSettingsObject, XrayStreamHttpSettingsObject, XrayStreamWsSettingsObject, XrayStreamHttpUpgradeSettingsObject, XrayStreamSplitHttpSettingsObject } from "../../modules/TransportObjects";
  import { XrayStreamSettingsObject, XrayStreamRealitySettingsObject, XrayStreamTlsSettingsObject } from "../../modules/CommonObjects";

  import Modal from "../Modal.vue";

  import NetworkTcp from "../transport/Tcp.vue";
  import NetworkKcp from "../transport/Kcp.vue";
  import NetworkWs from "../transport/Ws.vue";
  import NetworkHttp from "../transport/Http.vue";
  import NetworkHttpUpgrade from "../transport/HttpUpgrade.vue";
  import NetworkSplitHttp from "../transport/SplitHttp.vue";
  import NetworkGrpc from "../transport/Grpc.vue";

  import SecurityTls from "../security/Tls.vue";
  import SecurityReality from "../security/Reality.vue";

  export default defineComponent({
    name: "StreamSettingsModal",
    components: {
      Modal,
    },
    props: {
      transport: XrayStreamSettingsObject,
    },
    methods: {
      manage_security() {
        this.securityModal.show();
      },
      show(inbound: XrayInboundObject<IProtocolType>) {
        inbound.streamSettings = this.transport = inbound.streamSettings ?? new XrayStreamSettingsObject();

        this.modal.show();
      },
      save() {
        this.$emit("save", this.transport);
        this.modal.close();
      },
    },
    setup(props) {
      const modal = ref();
      const securityModal = ref();
      const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());
      const network = ref<ITransportNetwork>();

      const networkComponent = computed(() => {
        switch (transport.value.network) {
          case "tcp":
            transport.value.tcpSettings = transport.value.tcpSettings ?? new XrayStreamTcpSettingsObject();
            return NetworkTcp;
          case "kcp":
            transport.value.kcpSettings = transport.value.kcpSettings ?? new XrayStreamKcpSettingsObject();
            return NetworkKcp;
          case "ws":
            transport.value.wsSettings = transport.value.wsSettings ?? new XrayStreamWsSettingsObject();
            return NetworkWs;
          case "http":
            transport.value.httpSettings = transport.value.httpSettings ?? new XrayStreamHttpSettingsObject();
            return NetworkHttp;
          case "httpupgrade":
            transport.value.httpupgradeSettings = transport.value.httpupgradeSettings ?? new XrayStreamHttpUpgradeSettingsObject();
            return NetworkHttpUpgrade;
          case "splithttp":
            transport.value.splithttpSettings = transport.value.splithttpSettings ?? new XrayStreamSplitHttpSettingsObject();
            return NetworkSplitHttp;
          case "grpc":
            transport.value.grpcSettings = transport.value.grpcSettings ?? new XrayStreamGrpcSettingsObject();
            return NetworkGrpc;
          default:
            return null;
        }
      });

      const securityComponent = computed(() => {
        switch (transport.value.security) {
          case "tls":
            transport.value.tlsSettings = transport.value.tlsSettings ?? new XrayStreamTlsSettingsObject();
            return SecurityTls;
          case "reality":
            transport.value.realitySettings = transport.value.realitySettings ?? new XrayStreamRealitySettingsObject();
            return SecurityReality;

          default:
            return null;
        }
      });

      return {
        transport,
        network,
        modal,
        securityModal,
        networkComponent,
        securityComponent,
        securityOptions: XrayOptions.securityOptions,
        transportOptions: XrayOptions.transportOptions,
      };
    },
  });
</script>
