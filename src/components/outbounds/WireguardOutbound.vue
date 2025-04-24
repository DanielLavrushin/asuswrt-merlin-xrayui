<template>
  <div class="formfontdesc">
    <p>Wireguard is a standard implementation of the Wireguard protocol. The Wireguard protocol is not specifically designed for circumvention purposes. If used as the outer layer for circumvention, its characteristics may lead to server blocking.</p>
    <table width="100%" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">Wireguard</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common :proxy="proxy"></outbound-common>
        <tr>
          <th>
            Secret key
            <hint> The private key for the Wireguard protocol. **Required**. </hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.privateKey" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color">required</span>
          </td>
        </tr>
        <tr>
          <th>
            One or more IP addresses
            <hint> Wireguard will create a virtual network interface tun locally. Use one or more IP addresses, including `IPv6`. </hint>
          </th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="addresses" rows="25"></textarea>
            </div>
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            MTU
            <hint> The fragment size of the underlying `tun` device in Wireguard. </hint>
          </th>
          <td>
            <input v-model="proxy.settings.mtu" type="number" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);" />
            <span class="hint-color">default: 1420</span>
          </td>
        </tr>
        <tr>
          <th>
            Workers
            <hint> The number of threads used by Wireguard. </hint>
          </th>
          <td>
            <input v-model="proxy.settings.workers" type="number" maxlength="2" min="0" max="32" class="input_6_table" onkeypress="return validator.isNumber(this,event);" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            Domain strategy
            <hint> If you do not write this parameter, or leave it blank, the default value is `ForceIP`. When the destination address is a domain name, use the Xray-core built-in DNS server to get an IP (if no `dns` configuration is written, system DNS is used), and send a connection to this IP via wireguard. </hint>
          </th>
          <td>
            <select class="input_option" v-model="proxy.settings.domainStrategy">
              <option v-for="(opt, index) in strategyOptions" :key="index" :value="opt">
                {{ opt }}
              </option>
            </select>
            <span class="hint-color">default: ForceIP</span>
          </td>
        </tr>
        <tr>
          <th>
            Reserved Bytes
            <hint> Wireguard Reserved Bytes. When connecting to warp via wireguard, due to cloudflare limitations, some IPs in Hong Kong and Los Angeles need to have a reserved value in order to connect successfully. The value of reserved can be obtained using third-party tools such as `warp-reg`, `warp-reg.sh`. </hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="reserved" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color">optional, comma-separated numbers</span>
          </td>
        </tr>
        <tr>
          <th>
            Peers
            <hint> A list of Wireguard servers, where each item is a server configuration. </hint>
          </th>
          <td>
            {{ proxy.settings.peers.length }} item(s)
            <input class="button_gen button_gen_small" type="button" value="manage" @click.prevent="manage_peers" />
            <modal width="500" ref="modalPeers" title="Manage peers">
              <table class="FormTable modal-form-table">
                <tbody>
                  <tr v-for="(peer, index) in proxy.settings.peers" :key="index">
                    <td>{{ peer.endpoint }}</td>
                    <td>
                      <span class="row-buttons">
                        <input class="button_gen button_gen_small" type="button" value="edit" @click.prevent="modal_peer_open(peer)" />
                        <input class="button_gen button_gen_small" type="button" :title="$t('labels.delete')" value="&#10005;" @click.prevent="proxy.settings.peers.splice(index, 1)" />
                      </span>
                    </td>
                  </tr>
                  <tr v-if="!proxy.settings.peers.length" class="data_tr">
                    <td colspan="3" style="color: #ffcc00">no peers</td>
                  </tr>
                </tbody>
              </table>
              <template v-slot:footer>
                <input class="button_gen button_gen_small" type="button" value="add new" @click.prevent="modal_peer_open()" />
                <input class="button_gen button_gen_small" type="button" value="close" @click.prevent="modal_peers_close()" />
              </template>
            </modal>
            <modal width="400" ref="modalPeer" title="Peer">
              <table class="FormTable modal-form-table" v-if="peerItem">
                <tbody>
                  <tr>
                    <th>
                      Server address
                      <hint> The server address. **Required**. </hint>
                    </th>
                    <td>
                      <input type="text" class="input_20_table" v-model="peerItem.endpoint" autocomplete="off" autocorrect="off" autocapitalize="off" />
                      <span class="hint-color">required</span>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      Server's public key
                      <hint> The server's public key used for verification. **Required**. </hint>
                    </th>
                    <td>
                      <input type="text" class="input_20_table" v-model="peerItem.publicKey" autocomplete="off" autocorrect="off" autocapitalize="off" />
                      <span class="hint-color">required</span>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      Additional symmetric encryption key
                      <hint> An additional symmetric encryption key.. </hint>
                    </th>
                    <td>
                      <input type="text" class="input_20_table" v-model="peerItem.preSharedKey" autocomplete="off" autocorrect="off" autocapitalize="off" />
                      <span class="hint-color">optional</span>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      Keep alive
                      <hint> The interval of keep-alive packets in seconds. The default is 0, which means no keep-alive. </hint>
                    </th>
                    <td>
                      <input v-model="peerItem.keepAlive" type="number" maxlength="2" min="0" max="32" class="input_6_table" onkeypress="return validator.isNumber(this,event);" />
                      <span class="hint-color">default: 0, optional, in seconds</span>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      Allowed IPs
                      <hint> Only allow traffic from specific source IP addresses in Wireguard. </hint>
                    </th>
                    <td>
                      <div class="textarea-wrapper">
                        <textarea v-model="peerIps" rows="25"></textarea>
                      </div>
                      <span class="hint-color">optional</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <template v-slot:footer>
                <input class="button_gen button_gen_small" type="button" value="save" @click.prevent="modal_save_peer()" />
              </template>
            </modal>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script lang="ts">
  import { defineComponent, ref, watch } from 'vue';
  import OutboundCommon from './OutboundCommon.vue';
  import { XrayOutboundObject } from '@/modules/OutboundObjects';
  import { XrayWireguardOutboundObject } from '@/modules/OutboundObjects';
  import { XrayPeerObject } from '@/modules/CommonObjects';
  import { XrayProtocol } from '@/modules/Options';
  import Modal from '@main/Modal.vue';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'HttpOutbound',
    components: {
      OutboundCommon,
      Modal,
      Hint
    },
    props: {
      proxy: XrayOutboundObject<XrayWireguardOutboundObject>
    },

    setup(props) {
      const proxy = ref<XrayOutboundObject<XrayWireguardOutboundObject>>(props.proxy ?? new XrayOutboundObject<XrayWireguardOutboundObject>(XrayProtocol.WIREGUARD, new XrayWireguardOutboundObject()));
      const peerItem = ref<XrayPeerObject>();
      const addresses = ref<string>(proxy.value.settings.address.join('\n') ?? '');
      const peerIps = ref<string>('');
      const modalPeer = ref();
      const modalPeers = ref();
      const reserved = ref<string>(proxy.value.settings.reserved?.join(', ') ?? '');

      const modal_save_peer = () => {
        if (peerItem) {
          if (proxy.value.settings.peers.indexOf(peerItem.value!) === -1) {
            proxy.value.settings.peers.push(peerItem.value!);
          }
        }
        modalPeer.value.close();
      };

      const modal_peers_close = () => {
        modalPeers.value.close();
      };

      const manage_peers = () => {
        modalPeers.value.show();
      };

      const modal_peer_open = (peer?: XrayPeerObject | undefined) => {
        if (peer) {
          peerItem.value = peer;
        } else {
          peerItem.value = new XrayPeerObject();
        }
        peerIps.value = peerItem.value.allowedIPs?.join('\n') ?? '';
        modalPeer.value.show();
      };

      watch(
        () => reserved.value,
        (newObj) => {
          if (newObj) {
            proxy.value.settings.reserved = newObj.split(',').map((x) => parseInt(x.trim()));
          }
        },
        { immediate: true }
      );

      watch(
        () => addresses.value,
        (newObj) => {
          if (newObj) {
            proxy.value.settings.address = newObj.split('\n').filter((x) => x);
          }
        },
        { immediate: true }
      );

      watch(
        () => peerIps.value,
        (newObj) => {
          if (newObj && peerItem.value) {
            peerItem.value.allowedIPs = newObj.split('\n').filter((x) => x);
          }
        },
        { immediate: true }
      );

      return {
        proxy,
        reserved,
        addresses,
        peerItem,
        modalPeer,
        modalPeers,
        peerIps,
        strategyOptions: XrayWireguardOutboundObject.strategyOptions,
        modal_save_peer,
        modal_peers_close,
        manage_peers,
        modal_peer_open
      };
    }
  });
</script>
