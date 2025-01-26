<template>
    <div class="formfontdesc">
        <p>Freedom is an outbound protocol that can be used to send (normal) TCP or UDP data to any network.
        </p>
        <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
            <thead>
                <tr>
                    <td colspan="2">Freedom</td>
                </tr>
            </thead>
            <tbody>
                <outbound-common :proxy="proxy"></outbound-common>
                <tr>
                    <th>Domain Strategy
                        <hint>
                            When the destination address is a domain name, configure the corresponding value for
                            Freedom's behavior:
                            <ul>
                                <li>`AsIs`: Freedom resolves the domain name using the system DNS server and connects to
                                    it.</li>
                                <li>`UseIP, UseIPv4, and UseIPv6`: Xray resolves the domain name using the built-in DNS
                                    server and connects to it.</li>
                            </ul>
                            <blockquote>
                                **Note**:
                                When using the `UseIP` mode and the `sendThrough` field is specified in the outbound
                                connection configuration, `Freedom` will automatically determine the required IP type,
                                `IPv4` or `IPv6`, based on the value of `sendThrough`.
                            </blockquote>
                            <blockquote>
                                **Note**:
                                When using the `UseIPv4` or `UseIPv6` mode, `Freedom` will only use the corresponding
                                `IPv4`
                                or `IPv6` address. If `sendThrough` specifies a mismatched local address, the connection
                                will fail.
                            </blockquote>
                        </hint>
                    </th>
                    <td>
                        <select class="input_option" v-model="proxy.settings.domainStrategy">
                            <option></option>
                            <option v-for="opt in strategyOptions" :key="opt" :value="opt">
                                {{ opt }}
                            </option>
                        </select>
                        <span class="hint-color">default: AsIs</span>
                    </td>
                </tr>
                <tr>
                    <th>Redirect address
                        <hint>
                            Freedom will force all data to be sent to the specified address (instead of the address
                            specified in the inbound).

                            It is a string value, for example: `127.0.0.1:80`, `:1234`.

                            When the address is not specified, such as `:443`, `Freedom` will not modify the original
                            destination address. When the port is `0`, such as `xray.com:0`, `Freedom` will not modify
                            the
                            original port.
                        </hint>
                    </th>
                    <td>
                        <input type="text" class="input_20_table" v-model="proxy.settings.redirect" autocomplete="off"
                            autocorrect="off" autocapitalize="off" />
                        <span class="hint-color"></span>
                    </td>
                </tr>
                <tr>
                    <th>PROXY protocol</th>
                    <td>
                        <select class="input_option" v-model="proxy.settings.proxyProtocol">
                            <option v-for="opt in proxyProtocolOptions" :value="opt.key">
                                {{ opt.value }}
                            </option>
                        </select>
                        <span class="hint-color"></span>
                    </td>
                </tr>
            </tbody>
            <tbody v-if="proxy.settings.fragment">
                <tr>
                    <th>Fragment packet method
                        <hint>
                            A key-value map used to control TCP fragmentation, under some circumstances it can cheat the
                            censor system, like bypass a SNI blacklist.
                            <ul>
                                <li>`1-3` - segmentation at the TCP layer, applying to the beginning 1 to 3 data writes
                                    by
                                    the client.</li>
                                <li>`tlshello` - TLS client hello packet fragmentation.</li>
                            </ul>
                        </hint>
                    </th>
                    <td>
                        <select class="input_option" v-model="proxy.settings.fragment.packets">
                            <option></option>
                            <option v-for="opt in fragmentOptions" :key="opt" :value="opt">
                                {{ opt }}
                            </option>
                        </select>
                        <span class="hint-color"></span>
                    </td>
                </tr>
                <tr v-if="proxy.settings.fragment.packets !== ''">
                    <th>Fragment length
                        <hint>
                            length to make the cut
                        </hint>
                    </th>
                    <td>
                        <input type="text" class="input_20_table" v-model="proxy.settings.fragment.length"
                            autocomplete="off" autocorrect="off" autocapitalize="off" />
                        <span class="hint-color">length to make the cut</span>
                    </td>
                </tr>
                <tr v-if="proxy.settings.fragment.packets !== ''">
                    <th>Fragment interval
                        <hint>
                            time between fragments (ms)
                        </hint>
                    </th>
                    <td>
                        <input type="text" class="input_20_table" v-model="proxy.settings.fragment.interval"
                            autocomplete="off" autocorrect="off" autocapitalize="off" />
                        <span class="hint-color"></span>
                    </td>
                </tr>
            </tbody>
            <tbody v-if="proxy.settings.noises">
                <tr>
                    <th>UDP noise

                        <hint>
                            An array used to control UDP noise, under some circumstances it can bypass some udp based
                            protocol restrictions. xray will loop through this array and send each noise packet one by
                            one
                        </hint>
                    </th>
                    <td>
                        {{ proxy.settings.noises.length }} item(s)
                        <input class="button_gen button_gen_small" type="button" value="manage"
                            @click.prevent="manage_noises" />
                        <modal width="500" ref="modalNoises" title="Manage noise entries">
                            <table class="FormTable modal-form-table">
                                <tbody>
                                    <tr v-for="(noise, index) in proxy.settings.noises" :key="index">
                                        <td>{{ noise }}</td>
                                        <td>
                                            <input class="button_gen button_gen_small" type="button" value="edit"
                                                @click.prevent="modal_noise_open(noise)" />
                                            <input class="button_gen button_gen_small" type="button" value="remove"
                                                @click.prevent="proxy.settings.noises.splice(index, 1)" />
                                        </td>
                                    </tr>
                                    <tr v-if="!proxy.settings.noises.length" class="data_tr">
                                        <td colspan="3" style="color: #ffcc00">no entries</td>
                                    </tr>
                                </tbody>
                            </table>
                            <template v-slot:footer>
                                <input class="button_gen button_gen_small" type="button" value="add new"
                                    @click.prevent="modal_noise_open()" />
                                <input class="button_gen button_gen_small" type="button" value="close"
                                    @click.prevent="modal_noises_close()" />
                            </template>
                        </modal>
                        <modal width="400" ref="modalNoise" title="Noise Entry">
                            <table class="FormTable modal-form-table" v-if="noiseItem">
                                <tbody>
                                    <tr>
                                        <th>Type
                                            <hint>
                                                Three types are supported.
                                                <ul>
                                                    <li>`rand` - generates a random byte</li>
                                                    <li>`str` - uses a user input string</li>
                                                    <li>`base64` - uses a user input base64 encoded string</li>
                                                </ul>
                                            </hint>
                                        </th>
                                        <td>
                                            <select class="input_option" v-model="noiseItem.type">
                                                <option v-for="opt in noiseTypeOptions" :key="opt" :value="opt">
                                                    {{ opt }}
                                                </option>
                                            </select>
                                            <span class="hint-color"></span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Packet
                                            <hint>
                                                If type is set to
                                                <ul>
                                                    <li>`rand` - takes a range `50-100` or a single value `50`</li>
                                                    <li>`str` - takes a string</li>
                                                    <li>`base64` - takes a `base64` encoded string</li>
                                                </ul>
                                            </hint>
                                        </th>
                                        <td>
                                            <input type="text" class="input_20_table" v-model="noiseItem.packet"
                                                autocomplete="off" autocorrect="off" autocapitalize="off" />
                                            <span class="hint-color"></span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Delay
                                            <hint>
                                                The delay before sending real data (ms). can be a string range like
                                                `10-20` or a single integer

                                                If not specified, the default value is `0`.
                                            </hint>
                                        </th>
                                        <td>
                                            <input type="text" class="input_20_table" v-model="noiseItem.delay"
                                                autocomplete="off" autocorrect="off" autocapitalize="off" />
                                            <span class="hint-color"></span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <template v-slot:footer>
                                <input class="button_gen button_gen_small" type="button" value="save"
                                    @click.prevent="modal_save_noise()" />
                            </template>
                        </modal>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import OutboundCommon from "./OutboundCommon.vue";
import { XrayNoiseObject, XrayProtocol } from "../../modules/CommonObjects";
import { XrayFreedomOutboundObject, XrayOutboundObject } from "../../modules/OutboundObjects";
import Modal from "../Modal.vue";
import Hint from "./../Hint.vue";

export default defineComponent({
    name: "FreedomOutbound",
    components: {
        OutboundCommon,
        Modal,
        Hint
    },
    props: {
        proxy: XrayOutboundObject<XrayFreedomOutboundObject>,
    },
    methods: {
        modal_save_noise() {
            if (this.noiseItem && this.proxy.settings.noises) {
                if (this.proxy.settings.noises.indexOf(this.noiseItem) === -1) {
                    this.proxy.settings.noises.push(this.noiseItem);
                }
            }
            this.modalNoise.close();
        },
        modal_noises_close() {
            this.modalNoises.close();
        },
        manage_noises() {
            this.modalNoises.show();
        },
        modal_noise_open(noise?: XrayNoiseObject | undefined) {
            if (noise) {
                this.noiseItem = noise;
            } else {
                this.noiseItem = new XrayNoiseObject();
            }
            this.modalNoise.show();
        },
    },
    setup(props) {
        const proxy = ref<XrayOutboundObject<XrayFreedomOutboundObject>>(props.proxy ?? new XrayOutboundObject<XrayFreedomOutboundObject>(XrayProtocol.FREEDOM, new XrayFreedomOutboundObject()));

        if (!props.proxy?.settings) {
            proxy.value.settings = new XrayFreedomOutboundObject();
        }

        const noiseItem = ref<XrayNoiseObject>();
        const modalNoise = ref();
        const modalNoises = ref();



        return {
            proxy,
            modalNoise,
            modalNoises,
            noiseItem,
            strategyOptions: XrayFreedomOutboundObject.strategyOptions,
            fragmentOptions: XrayFreedomOutboundObject.fragmentOptions,
            noiseTypeOptions: XrayNoiseObject.typeOptions,
            proxyProtocolOptions: [{ key: 0, value: "disabled" }, { key: 1, value: "version 1" }, { key: 2, value: "version 2" }],
        };
    },
});
</script>
