<template>
    <div class="formfontdesc">
        <p>Wireguard is a standard implementation of the Wireguard protocol. The Wireguard protocol is not specifically
            designed for circumvention purposes. If used as the outer layer for circumvention, its characteristics may
            lead to server blocking.</p>
        <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
            <thead>
                <tr>
                    <td colspan="2">Wireguard</td>
                </tr>
            </thead>
            <tbody>
                <outbound-common :proxy="proxy"></outbound-common>
                <tr>
                    <th>Secret key</th>
                    <td>
                        <input type="text" class="input_20_table" v-model="proxy.settings.privateKey" autocomplete="off"
                            autocorrect="off" autocapitalize="off" />
                        <span class="hint-color">required</span>
                    </td>
                </tr>
                <tr>
                    <th>One or more IP addresses</th>
                    <td>
                        <div class="textarea-wrapper">
                            <textarea v-model="addresses" rows="25"></textarea>
                        </div>
                        <span class="hint-color"></span>
                    </td>
                </tr>
                <tr>
                    <th>MTU</th>
                    <td>
                        <input v-model="proxy.settings.mtu" type="number" maxlength="4" class="input_6_table"
                            onkeypress="return validator.isNumber(this,event);" />
                        <span class="hint-color">default: 1420</span>
                    </td>
                </tr>
                <tr>
                    <th>Workers</th>
                    <td>
                        <input v-model="proxy.settings.workers" type="number" maxlength="2" min="0" max="32"
                            class="input_6_table" onkeypress="return validator.isNumber(this,event);" />
                        <span class="hint-color"></span>
                    </td>
                </tr>
                <tr>
                    <th>Domain strategy</th>
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
                    <th>Reserved Bytes</th>
                    <td>
                        <input type="text" class="input_20_table" v-model="reserved" autocomplete="off"
                            autocorrect="off" autocapitalize="off" />
                        <span class="hint-color">optional, comma-separated numbers</span>
                    </td>
                </tr>
                <tr>
                    <th>Peers</th>
                    <td>
                        {{ proxy.settings.peers.length }} item(s)
                        <input class="button_gen button_gen_small" type="button" value="manage"
                            @click.prevent="manage_peers" />
                        <modal width="500" ref="modalPeers" title="Manage peers">
                            <table class="FormTable modal-form-table">
                                <tbody>
                                    <tr v-for="(peer, index) in proxy.settings.peers" :key="index">
                                        <td>{{ peer.endpoint }}</td>
                                        <td>
                                            <span class="row-buttons">
                                                <input class="button_gen button_gen_small" type="button" value="edit"
                                                    @click.prevent="modal_peer_open(peer)" />
                                                <input class="button_gen button_gen_small" type="button" value="remove"
                                                    @click.prevent="proxy.settings.peers.splice(index, 1)" />
                                            </span>
                                        </td>
                                    </tr>
                                    <tr v-if="!proxy.settings.peers.length" class="data_tr">
                                        <td colspan="3" style="color: #ffcc00">no peers</td>
                                    </tr>
                                </tbody>
                            </table>
                            <template v-slot:footer>
                                <input class="button_gen button_gen_small" type="button" value="add new"
                                    @click.prevent="modal_peer_open()" />
                                <input class="button_gen button_gen_small" type="button" value="close"
                                    @click.prevent="modal_peers_close()" />
                            </template>
                        </modal>
                        <modal width="400" ref="modalPeer" title="Peer">
                            <table class="FormTable modal-form-table" v-if="peerItem">
                                <tbody>
                                    <tr>
                                        <th>Server address</th>
                                        <td>
                                            <input type="text" class="input_20_table" v-model="peerItem.endpoint"
                                                autocomplete="off" autocorrect="off" autocapitalize="off" />
                                            <span class="hint-color">required</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Server's public key</th>
                                        <td>
                                            <input type="text" class="input_20_table" v-model="peerItem.publicKey"
                                                autocomplete="off" autocorrect="off" autocapitalize="off" />
                                            <span class="hint-color">required</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Additional symmetric encryption key</th>
                                        <td>
                                            <input type="text" class="input_20_table" v-model="peerItem.preSharedKey"
                                                autocomplete="off" autocorrect="off" autocapitalize="off" />
                                            <span class="hint-color">optional</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Keep alive</th>
                                        <td>
                                            <input v-model="peerItem.keepAlive" type="number" maxlength="2" min="0"
                                                max="32" class="input_6_table"
                                                onkeypress="return validator.isNumber(this,event);" />
                                            <span class="hint-color">default: 0, optional, in seconds</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Allowed IPs</th>
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
                                <input class="button_gen button_gen_small" type="button" value="save"
                                    @click.prevent="modal_save_peer()" />
                            </template>
                        </modal>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import OutboundCommon from "./OutboundCommon.vue";
import { XrayOutboundObject } from "../../modules/OutboundObjects";
import { WireguardOutboundObject } from "../../modules/OutboundObjects";
import { XrayPeerObject } from "../../modules/CommonObjects";
import { XrayProtocol } from "../../modules/Options";
import Modal from "../Modal.vue";

export default defineComponent({
    name: "HttpOutbound",
    components: {
        OutboundCommon,
        Modal
    },
    props: {
        proxy: XrayOutboundObject<WireguardOutboundObject>,
    },
    methods: {
        modal_save_peer() {
            if (this.peerItem) {
                if (this.proxy.settings.peers.indexOf(this.peerItem) === -1) {
                    this.proxy.settings.peers.push(this.peerItem);
                }
            }
            this.modalPeer.close();
        },
        modal_peers_close() {
            this.modalPeers.close();
        },
        manage_peers() {
            this.modalPeers.show();
        },
        modal_peer_open(peer?: XrayPeerObject | undefined) {
            if (peer) {
                this.peerItem = peer;
            } else {
                this.peerItem = new XrayPeerObject();
            }
            this.peerIps = this.peerItem.allowedIPs?.join('\n') ?? '';
            this.modalPeer.show();
        },
    },
    setup(props) {
        const proxy = ref<XrayOutboundObject<WireguardOutboundObject>>(props.proxy ?? new XrayOutboundObject<WireguardOutboundObject>(XrayProtocol.WIREGUARD, new WireguardOutboundObject()));
        const peerItem = ref<XrayPeerObject>();
        const addresses = ref<string>(proxy.value.settings.address.join('\n') ?? '');
        const peerIps = ref<string>('');
        const modalPeer = ref();
        const modalPeers = ref();
        const reserved = ref<string>(proxy.value.settings.reserved?.join(', ') ?? '');

        watch(
            () => reserved.value,
            (newObj) => {
                if (newObj) {
                    proxy.value.settings.reserved = newObj.split(",").map((x) => parseInt(x.trim()));
                }
            },
            { immediate: true }
        );


        watch(
            () => addresses.value,
            (newObj) => {
                if (newObj) {
                    proxy.value.settings.address = newObj.split("\n").filter((x) => x);
                }
            },
            { immediate: true }
        );

        watch(
            () => peerIps.value,
            (newObj) => {
                if (newObj && peerItem.value) {
                    peerItem.value.allowedIPs = newObj.split("\n").filter((x) => x);
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
            strategyOptions: WireguardOutboundObject.strategyOptions
        };
    },
});
</script>