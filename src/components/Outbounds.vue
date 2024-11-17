<template>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable">
        <thead>
            <tr>
                <td colspan="2">Outbounds</td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <th>Create new</th>
                <td>
                    <select class="input_option" v-model="selectedProxyType" @change="edit_proxy()">
                        <option></option>
                        <option v-for="(opt, index) in availableProxies" :key="index" :value="opt.protocol">
                            {{ opt.protocol }}
                        </option>
                    </select>
                    <span class=" hint-color"> </span>
                </td>
            </tr>
            <slot v-for="(proxy, index) in config.outbounds">
                <tr v-if="proxy.settings">
                    <th>{{
                        proxy.protocol.toUpperCase() }}</th>
                    <td><a class="hint" href="#" @click.prevent="edit_proxy(proxy)"><i><strong>
                                    {{ proxy.tag ?? "no tag" }}
                                </strong></i>
                        </a>
                        <span class="row-buttons">
                            <a class="button_gen button_gen_small" href="#" @click="show_transport(proxy)">transport</a>
                            <a class="button_gen button_gen_small" href="#" @click="remove_proxy(proxy)">x</a>
                        </span>
                    </td>
                </tr>
            </slot>
        </tbody>
    </table>

    <modal ref="proxyModal" title="Outbound Settings">
        <component ref="proxyRef" :is="proxyComponent" :proxy="selectedProxy" />
        <template v-slot:footer>
            <input class="button_gen button_gen_small" type="button" value="Save" @click.prevent="save_proxy" />
        </template>
    </modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed, nextTick } from "vue";
import engine from "../modules/Engine";
import Modal from "./Modal.vue";
import { xrayProtocols, XrayOutboundObject, XrayProtocolMode, IProtocolType, XrayProtocolOption, XrayProtocol } from "../modules/XrayConfig";

import FreedomOutbound from "./outbounds/FreedomOutbound.vue";
import BlackholeOutbound from "./outbounds/BlackholeOutbound.vue";

export default defineComponent({
    name: "Outbounds",
    emits: ['show-transport', 'show-sniffing'],
    components: {
        Modal,
    },
    methods: {
        async show_transport(proxy: XrayOutboundObject<IProtocolType>) {
            this.$emit('show-transport', proxy);
        },

        save_protocol() {
            this.proxyModal.close();
        },

        async edit_proxy(proxy: XrayOutboundObject<IProtocolType> | undefined = undefined) {

            if (proxy) {
                this.selectedProxy = proxy;
                this.selectedProxyType = proxy.protocol;
            }

            await nextTick();

            this.proxyModal.show(() => {
                this.selectedProxy = undefined;
                this.selectedProxyType = undefined;
            });
        },

        async remove_proxy(proxy: XrayOutboundObject<IProtocolType>) {
            let index = this.config.outbounds.indexOf(proxy);
            this.config.outbounds.splice(index, 1);
        },

        async save_proxy() {
            let proxy = this.proxyRef.proxy;
            if (this.config.outbounds.filter(i => i != proxy && i.tag == proxy.tag).length > 0) {
                alert('Tag  already exists, please choose another one');
                return;
            }

            let index = this.config.outbounds.indexOf(proxy);
            if (index >= 0) {
                this.config.outbounds[index] = proxy;
            } else {
                this.config.outbounds.push(proxy);
            }

            this.proxyModal.close();
        },

    },

    setup() {
        const config = ref(engine.xrayConfig);
        const availableProxies = ref<XrayProtocolOption[]>(xrayProtocols.filter(p => (p.modes & XrayProtocolMode.Outbound)));
        const selectedProxyType = ref<string>();
        const selectedProxy = ref<any>();
        const proxyModal = ref();
        const proxyRef = ref();

        const proxyComponent = computed(() => {
            switch (selectedProxyType.value) {
                case XrayProtocol.FREEDOM:
                    return FreedomOutbound;
                case XrayProtocol.BLACKHOLE:
                    return BlackholeOutbound;
                case XrayProtocol.VMESS:
                default:
                    return null;
            }
        });

        return {
            config,
            proxyComponent,
            proxyRef,
            proxyModal,
            selectedProxy,
            availableProxies,
            selectedProxyType,
        };
    },
});
</script>

<style scoped></style>