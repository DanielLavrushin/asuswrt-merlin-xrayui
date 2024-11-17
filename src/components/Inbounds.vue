<template>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable">
        <thead>
            <tr>
                <td colspan="2">Inbounds</td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <th>Create new</th>
                <td>
                    <select class="input_option" v-model="selectedInboundType" @change="edit_inbound()">
                        <option></option>
                        <option v-for="(opt, index) in availableProxies" :key="index" :value="opt.protocol">
                            {{ opt.protocol }}
                        </option>
                    </select>
                    <span class=" hint-color"> </span>
                </td>
            </tr>
            <slot v-for="(inbound, index) in config.inbounds">
                <tr v-if="inbound.settings">
                    <th>{{
                        inbound.protocol.toUpperCase() }}</th>
                    <td><a class="hint" href="#" @click.prevent="edit_inbound(inbound)"><i><strong>
                                    {{ inbound.tag ?? "no tag" }}
                                </strong></i>
                        </a>
                        <span class="row-buttons">
                            <a class="button_gen button_gen_small" href="#"
                                @click="show_transport(inbound)">transport</a>
                            <a class="button_gen button_gen_small" href="#" @click="show_sniffing(inbound)">sniffing</a>
                            <a class="button_gen button_gen_small" href="#" @click="remove_inbound(inbound)">x</a>
                        </span>
                    </td>
                </tr>
            </slot>
        </tbody>
    </table>

    <modal ref="inboundModal" title="Inbound Settings">
        <component ref="inboundComponentRef" :is="inboundComponent" :inbound="selectedInbound" />
        <template v-slot:footer>
            <input class="button_gen button_gen_small" type="button" value="Save" @click.prevent="save_inbound" />
        </template>
    </modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed, nextTick } from "vue";
import engine from "../modules/Engine";
import Modal from "./Modal.vue";
import { xrayProtocols, XrayInboundObject, XrayProtocolMode, IProtocolType, XrayProtocolOption, XrayProtocol } from "../modules/XrayConfig";
import DocodemoDoorInbound from "./inbounds/DocodemoDoorInbound.vue";
import VmessInbound from "./inbounds/VmessInbound.vue";


export default defineComponent({
    name: "Inbounds",
    emits: ['show-transport', 'show-sniffing'],
    components: {
        Modal,
        DocodemoDoorInbound,
        VmessInbound,
    },
    methods: {
        async show_transport(inbound: XrayInboundObject<IProtocolType>) {
            this.$emit('show-transport', inbound);
        },
        async show_sniffing(inbound: XrayInboundObject<IProtocolType>) {
            this.$emit('show-sniffing', inbound);
        },
        save_protocol() {
            this.inboundModal.close();
        },

        async edit_inbound(inbound: XrayInboundObject<IProtocolType> | undefined = undefined) {

            if (inbound) {
                this.selectedInbound = inbound;
                this.selectedInboundType = inbound.protocol;
            }

            await nextTick();

            this.inboundModal.show(() => {
                this.selectedInbound = undefined;
                this.selectedInboundType = undefined;
            });
        },

        async remove_inbound(inbound: XrayInboundObject<IProtocolType>) {
            let index = this.config.inbounds.indexOf(inbound);
            this.config.inbounds.splice(index, 1);
        },

        async save_inbound() {
            let inbound = this.inboundComponentRef.inbound;
            if (this.config.inbounds.filter(i => i != inbound && i.tag == inbound.tag).length > 0) {
                alert('Tag  already exists, please choose another one');
                return;
            }

            let index = this.config.inbounds.indexOf(inbound);
            if (index >= 0) {
                this.config.inbounds[index] = inbound;
            } else {
                this.config.inbounds.push(inbound);
            }

            this.inboundModal.close();
        },

    },

    setup() {
        const config = ref(engine.xrayConfig);
        const availableProxies = ref<XrayProtocolOption[]>(xrayProtocols.filter(p => (p.modes & XrayProtocolMode.Inbound)));
        const selectedInboundType = ref<string>();
        const selectedInbound = ref<any>();
        const inboundModal = ref();
        const inboundComponentRef = ref();

        const inboundComponent = computed(() => {
            switch (selectedInboundType.value) {
                case XrayProtocol.DOKODEMODOOR:
                    return DocodemoDoorInbound;
                case XrayProtocol.VMESS:
                    return VmessInbound;
                default:
                    return null;
            }
        });

        return {
            config,
            inboundComponent,
            inboundComponentRef,
            inboundModal,
            selectedInbound,
            availableProxies,
            selectedInboundType,
        };
    },
});
</script>

<style scoped></style>