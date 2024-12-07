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
                    <th>Domain Strategy</th>
                    <td>
                        <select class="input_option" v-model="proxy.settings.domainStrategy">
                            <option></option>
                            <option v-for="opt in strategyOptions" :key="opt" :value="opt">
                                {{ opt }}
                            </option>
                        </select>
                        <span class="hint-color"></span>
                    </td>
                </tr>
                <tr>
                    <th>Redirect address</th>
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
                <tr>
                    <th>TCP Fragmentation</th>
                    <td>
                        <input type="checkbox" v-model="enableFragmentation" />
                        <span class="hint-color"></span>
                    </td>
                </tr>
            </tbody>
            <tbody v-if="enableFragmentation && proxy.settings.fragment">
                <tr>
                    <th>Fragment packet method</th>
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
                <tr>
                    <th>Fragment length</th>
                    <td>
                        <input type="text" class="input_20_table" v-model="proxy.settings.fragment.length"
                            autocomplete="off" autocorrect="off" autocapitalize="off" />
                        <span class="hint-color">length to make the cut</span>
                    </td>
                </tr>
                <tr>
                    <th>Fragment interval</th>
                    <td>
                        <input type="text" class="input_20_table" v-model="proxy.settings.fragment.interval"
                            autocomplete="off" autocorrect="off" autocapitalize="off" />
                        <span class="hint-color"></span>
                    </td>
                </tr>
            </tbody>
            <tbody>
                <tr>
                    <th>UDP noise</th>
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
                                        <th>Type</th>
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
                                        <th>Packet</th>
                                        <td>
                                            <input type="text" class="input_20_table" v-model="noiseItem.packet"
                                                autocomplete="off" autocorrect="off" autocapitalize="off" />
                                            <span class="hint-color"></span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Delay</th>
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
import { computed, defineComponent, ref } from "vue";
import OutboundCommon from "./OutboundCommon.vue";
import { XrayNoiseObject, XrayProtocol } from "../../modules/CommonObjects";
import { XrayFreedomOutboundObject, XrayOutboundObject } from "../../modules/OutboundObjects";
import Modal from "../Modal.vue";
export default defineComponent({
    name: "FreedomOutbound",
    components: {
        OutboundCommon,
        Modal
    },
    props: {
        proxy: XrayOutboundObject<XrayFreedomOutboundObject>,
    },
    methods: {
        modal_save_noise() {
            if (this.noiseItem) {
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
        const enableFragmentation = computed({
            get: () => proxy.value.settings.fragment != null,
            set: (value: boolean) => {
                if (value) {
                    proxy.value.settings.fragment = new XrayFreedomOutboundObject().fragment;
                } else {
                    proxy.value.settings.fragment = undefined;
                }
            },
        });

        return {
            proxy,
            modalNoise,
            modalNoises,
            noiseItem,
            enableFragmentation,
            strategyOptions: XrayFreedomOutboundObject.strategyOptions,
            fragmentOptions: XrayFreedomOutboundObject.fragmentOptions,
            noiseTypeOptions: XrayNoiseObject.typeOptions,
            proxyProtocolOptions: [{ key: 0, value: "disabled" }, { key: 1, value: "version 1" }, { key: 2, value: "version 2" }],
        };
    },
});
</script>
