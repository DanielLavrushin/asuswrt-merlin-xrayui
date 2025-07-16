<template>
  <div class="formfontdesc">
    <p>
      User-space implementation of the Wireguard protocol. The Wireguard protocol is not specifically designed for circumvention purposes. If used as the outer layer for
      circumvention, its characteristics may lead to server blocking.
    </p>
    <table width="100%" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">Wireguard</td>
        </tr>
      </thead>
      <tbody>
        <inbound-common :inbound="inbound"></inbound-common>
        <tr>
          <th>
            Private Key
            <hint> The private key for the Wireguard protocol. **Required**. </hint>
          </th>
          <td>
            <input type="text" class="input_25_table" v-model="inbound.settings.secretKey" />
            <span class="hint-color"></span>
            <span class="row-buttons">
              <input class="button_gen button_gen_small" type="button" value="regenerate" @click.prevent="regen()" />
            </span>
          </td>
        </tr>
        <tr>
          <th>
            KERNEL Mode
            <hint> Enable kernel mode for the Wireguard protocol. The default value is `true` if it's supported and permission is sufficient. </hint>
          </th>
          <td>
            <input type="checkbox" v-model="inbound.settings.kernelMode" />
            <span class="hint-color">default: true</span>
          </td>
        </tr>
        <tr>
          <th>
            MTU
            <hint> Fragmentation size of the underlying Wireguard tun. The default value is `1420`. </hint>
          </th>
          <td>
            <input v-model="inbound.settings.mtu" type="number" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);" />
            <span class="hint-color">default: 1420</span>
          </td>
        </tr>
      </tbody>
    </table>
    <clients :clients="inbound.settings.peers" :privateKey="privatekey"></clients>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import engine, { SubmitActions } from '@/modules/Engine';
  import Clients from '@clients/WireguardClients.vue';
  import InboundCommon from './InboundCommon.vue';
  import { XrayInboundObject, XrayWireguardInboundObject } from '@/modules/InboundObjects';
  import { XrayProtocol } from '@/modules/CommonObjects';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'WireguardInbound',

    components: {
      Clients,
      InboundCommon,
      Hint
    },

    props: {
      inbound: XrayInboundObject<XrayWireguardInboundObject>
    },

    setup(props) {
      const inbound = ref<XrayInboundObject<XrayWireguardInboundObject>>(
        props.inbound ?? new XrayInboundObject<XrayWireguardInboundObject>(XrayProtocol.WIREGUARD, new XrayWireguardInboundObject())
      );
      const privatekey = ref<string>(inbound.value.settings.secretKey);
      const regen = async (privatekey: string | undefined = undefined) => {
        const delay = 2000;
        window.showLoading(delay);
        await engine.submit(SubmitActions.regenerateWireguardKeys, privatekey, delay);
        let result = await engine.getXrayResponse();
        if (inbound.value.settings) {
          privatekey = result.wireguard?.privateKey!;
          inbound.value.settings.secretKey = result.wireguard?.privateKey!;
        }
        window.hideLoading();
      };

      return {
        inbound,
        privatekey,
        authentications: ['noauth', 'password'],
        regen
      };
    }
  });
</script>
