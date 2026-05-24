<template>
  <div class="formfontdesc">
    <p>{{ $t('com.WireguardOutbound.modal_desc') }}</p>
    <table width="100%" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">{{ $t('com.WireguardOutbound.modal_title') }}</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common :proxy="proxy"></outbound-common>
        <tr>
          <th>
            {{ $t('com.WireguardOutbound.label_secret_key') }}
            <hint v-html="$t('com.WireguardOutbound.hint_secret_key')"></hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.secretKey" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color">required</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.WireguardOutbound.label_address') }}
            <hint v-html="$t('com.WireguardOutbound.hint_address')"></hint>
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
            {{ $t('com.WireguardOutbound.label_mtu') }}
            <hint v-html="$t('com.WireguardOutbound.hint_mtu')"></hint>
          </th>
          <td>
            <input v-model="proxy.settings.mtu" type="number" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);" />
            <span class="hint-color">default: 1420</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.WireguardOutbound.label_workers') }}
            <hint v-html="$t('com.WireguardOutbound.hint_workers')"></hint>
          </th>
          <td>
            <input v-model="proxy.settings.workers" type="number" maxlength="2" min="0" max="32" class="input_6_table" onkeypress="return validator.isNumber(this,event);" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.WireguardOutbound.label_domain_strategy') }}
            <hint v-html="$t('com.WireguardOutbound.hint_domain_strategy')"></hint>
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
            {{ $t('com.WireguardOutbound.label_no_kernel_tun') }}
            <hint v-html="$t('com.WireguardOutbound.hint_no_kernel_tun')"></hint>
          </th>
          <td>
            <input type="checkbox" v-model="proxy.settings.noKernelTun" />
            <span class="hint-color">default: false</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.WireguardOutbound.label_reserved') }}
            <hint v-html="$t('com.WireguardOutbound.hint_reserved')"></hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="reserved" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color">optional, comma-separated numbers</span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.WireguardOutbound.label_peers') }}
            <hint v-html="$t('com.WireguardOutbound.hint_peers')"></hint>
          </th>
          <td>
            {{ $t('labels.items', [proxy.settings?.peers.length ?? 0]) }}
            <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click.prevent="manage_peers" />
            <modal width="500" ref="modalPeers" :title="$t('com.WireguardOutbound.modal_peers_title')">
              <table class="FormTable modal-form-table">
                <tbody>
                  <tr v-for="(peer, index) in proxy.settings.peers" :key="index">
                    <td>{{ peer.endpoint }}</td>
                    <td>
                      <span class="row-buttons">
                        <input class="button_gen button_gen_small" type="button" :value="$t('labels.edit')" @click.prevent="modal_peer_open(peer)" />
                        <input class="button_gen button_gen_small" type="button" :title="$t('labels.delete')" value="&#10005;" @click.prevent="proxy.settings.peers.splice(index, 1)" />
                      </span>
                    </td>
                  </tr>
                  <tr v-if="!proxy.settings.peers.length" class="data_tr">
                    <td colspan="2" style="color: #ffcc00">{{ $t('com.WireguardOutbound.text_no_peers') }}</td>
                  </tr>
                </tbody>
              </table>
              <template v-slot:footer>
                <input class="button_gen button_gen_small" type="button" :value="$t('com.WireguardOutbound.text_add_new')" @click.prevent="modal_peer_open()" />
                <input class="button_gen button_gen_small" type="button" :value="$t('labels.close')" @click.prevent="modal_peers_close()" />
              </template>
            </modal>
            <modal width="400" ref="modalPeer" :title="$t('com.WireguardOutbound.modal_peer_title')">
              <table class="FormTable modal-form-table" v-if="peerItem">
                <tbody>
                  <tr>
                    <th>
                      {{ $t('com.WireguardOutbound.label_peer_endpoint') }}
                      <hint v-html="$t('com.WireguardOutbound.hint_peer_endpoint')"></hint>
                    </th>
                    <td>
                      <input type="text" class="input_20_table" v-model="peerItem.endpoint" autocomplete="off" autocorrect="off" autocapitalize="off" />
                      <span class="hint-color">required</span>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      {{ $t('com.WireguardOutbound.label_peer_public_key') }}
                      <hint v-html="$t('com.WireguardOutbound.hint_peer_public_key')"></hint>
                    </th>
                    <td>
                      <input type="text" class="input_20_table" v-model="peerItem.publicKey" autocomplete="off" autocorrect="off" autocapitalize="off" />
                      <span class="hint-color">required</span>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      {{ $t('com.WireguardOutbound.label_peer_pre_shared_key') }}
                      <hint v-html="$t('com.WireguardOutbound.hint_peer_pre_shared_key')"></hint>
                    </th>
                    <td>
                      <input type="text" class="input_20_table" v-model="peerItem.preSharedKey" autocomplete="off" autocorrect="off" autocapitalize="off" />
                      <span class="hint-color">optional</span>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      {{ $t('com.WireguardOutbound.label_peer_keep_alive') }}
                      <hint v-html="$t('com.WireguardOutbound.hint_peer_keep_alive')"></hint>
                    </th>
                    <td>
                      <input v-model="peerItem.keepAlive" type="number" maxlength="2" min="0" max="32" class="input_6_table" onkeypress="return validator.isNumber(this,event);" />
                      <span class="hint-color">default: 0, optional, in seconds</span>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      {{ $t('com.WireguardOutbound.label_peer_allowed_ips') }}
                      <hint v-html="$t('com.WireguardOutbound.hint_peer_allowed_ips')"></hint>
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
                <input class="button_gen button_gen_small" type="button" :value="$t('labels.save')" @click.prevent="modal_save_peer()" />
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
