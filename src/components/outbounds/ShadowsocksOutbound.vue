<template>
  <div class="formfontdesc">
    <p>Shadowsocks protocol is compatible with most other implementations.</p>
    <table width="100%" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">Shadowsocks</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common :proxy="proxy"></outbound-common>
        <tr>
          <th>
            Shadowsocks server
            <hint> The address of the Shadowsocks server. **Required**. </hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.servers[0].address" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color">required</span>
          </td>
        </tr>
        <tr>
          <th>
            Proxy port
            <hint> The port of the Shadowsocks server. **Required**. </hint>
          </th>
          <td>
            <input type="number" maxlength="5" class="input_6_table" v-model="proxy.settings.servers[0].port" autocorrect="off" autocapitalize="off" onkeypress="return validator.isNumber(this,event);" />
            <span class="hint-color">required</span>
          </td>
        </tr>
        <tr>
          <th>
            Email address
            <hint> The email address, optional, used to identify the user. </hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.servers[0].email" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color">optional</span>
          </td>
        </tr>
        <tr>
          <th>
            Encryption method
            <hint> The encryption method used by the Shadowsocks server. **Required**. </hint>
          </th>
          <td>
            <select class="input_option" v-model="proxy.settings.servers[0].method">
              <option v-for="(opt, index) in encryptions" :key="index" :value="opt.e">
                {{ opt.e }}
              </option>
            </select>
            <span class="hint-color">required</span>
          </td>
        </tr>
        <tr v-show="!['none', 'plain'].includes(proxy.settings.servers[0].method)">
          <th>
            Password
            <hint> The password for authentication. **Required**. </hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.servers[0].password" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <button @click.prevent="generate_password()" class="button_gen button_gen_small">generate</button>
            <span class="hint-color">required</span>
          </td>
        </tr>
        <tr>
          <th>
            UDP over TCP
            <hint> When enabled, UDP over TCP (UOT) will be used. </hint>
          </th>
          <td>
            <input type="checkbox" v-model="proxy.settings.servers[0].uot" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script lang="ts">
  import engine from '@/modules/Engine';
  import { defineComponent, ref } from 'vue';
  import OutboundCommon from './OutboundCommon.vue';
  import { XrayOutboundObject } from '@/modules/OutboundObjects';
  import { XrayShadowsocksOutboundObject } from '@/modules/OutboundObjects';
  import { XrayProtocol } from '@/modules/Options';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'HttpOutbound',
    components: {
      OutboundCommon,
      Hint
    },
    props: {
      proxy: XrayOutboundObject<XrayShadowsocksOutboundObject>
    },
    methods: {
      generate_password() {
        const selectedEnc = this.encryptions.find((e) => e.e === this.proxy.settings.servers[0].method);
        this.proxy.settings.servers[0].password = engine.generateRandomBase64(selectedEnc?.l);
      }
    },
    setup(props) {
      const proxy = ref<XrayOutboundObject<XrayShadowsocksOutboundObject>>(props.proxy ?? new XrayOutboundObject<XrayShadowsocksOutboundObject>(XrayProtocol.SHADOWSOCKS, new XrayShadowsocksOutboundObject()));
      const encryptions = [
        { e: '2022-blake3-aes-128-gcm', l: 16 },
        { e: '2022-blake3-aes-256-gcm', l: 32 },
        { e: '2022-blake3-chacha20-poly1305', l: 32 },
        { e: 'aes-256-gcm', l: 32 },
        { e: 'aes-128-gcm', l: 16 },
        { e: 'chacha20-ietf-poly1305', l: 32 },
        { e: 'none', l: 0 },
        { e: 'plain', l: 0 }
      ];

      const generate_password = () => {
        const selectedEnc = encryptions.find((e) => e.e === proxy.value.settings.servers[0].method);
        proxy.value.settings.servers[0].password = engine.generateRandomBase64(selectedEnc?.l);
      };
      return {
        proxy,
        encryptions,
        generate_password
      };
    }
  });
</script>
