<template>
    <modal ref="modal" :title="$t('components.GeneralOptionsModal.modal_title')" width="600">
        <div class="formfontdesc">
            <table class="FormTable modal-form-table">
                <tbody>
                    <tr>
                        <th>{{ $t('components.GeneralOptionsModal.start_xray_on_reboot') }}</th>
                        <td>
                            <label class="go-option">
                                <input type="checkbox" v-model="startup" @click="updatestartup" />
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th>{{ $t('components.GeneralOptionsModal.check_xray_connection') }}</th>
                        <td>
                            <label class="go-option" v-show="validateCheckConOption()">
                                <input type="checkbox" v-model="checkconenabled" @change="setcheckconnection" />
                            </label>
                            <modal ref="conModal" :title="$t('components.generalOptionsModal.modalConnectTitle')"
                                width="450">
                                <div class="formfontdesc"
                                    v-html="$t('components.GeneralOptionsModal.modalConnectCheckDescription')">
                                </div>
                                <template #footer>
                                    <input class="button_gen button_gen_small" type="button"
                                        :value="$t('labels.cancel')" @click.prevent="concheckcancel" />
                                    <input class="button_gen button_gen_small" type="button"
                                        :value="$t('labels.accept')" @click.prevent="concheckaccept" />
                                </template>
                            </modal>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <template #footer>
        </template>
    </modal>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import engine, { SubmtActions } from "../../modules/Engine";
import { XrayObject } from "@/modules/XrayConfig";
import { XrayProtocol, XrayRoutingRuleObject } from "@/modules/CommonObjects";

import Modal from "./../Modal.vue";
import { XrayInboundObject, XraySocksInboundObject } from "@/modules/InboundObjects";

export default defineComponent({
    name: "GeneralOptionsModal",
    components: {
        Modal
    },
    props: {
        config: {
            type: XrayObject,
            required: true
        }
    },
    setup(props) {
        const modal = ref();
        const conModal = ref();

        const startup = ref<boolean>(window.xray.custom_settings.xray_startup === "y");

        const checkconenabled = ref<boolean>(props.config.routing?.rules?.find((r) => r.name === XrayRoutingRuleObject.connectionCheckRuleName) !== undefined);

        watch(
            () => props.config.routing?.rules,
            (rules) => {
                checkconenabled.value = rules?.find((r) => r.name === XrayRoutingRuleObject.connectionCheckRuleName) !== undefined;
            }
        );

        const show = () => {
            modal.value.show();
        };

        const updatestartup = async () => {
            await engine.submit(SubmtActions.toggleStartupOption);
            window.xray.custom_settings.xray_startup = window.xray.custom_settings.xray_startup === "y" ? "n" : "y";
        };

        const setcheckconnection = async () => {
            if (checkconenabled.value) {
                conModal.value.show();
            } else {
                const rule = props.config.routing?.rules?.find((r) => r.name === XrayRoutingRuleObject.connectionCheckRuleName);
                if (rule) {
                    props.config.routing?.rules?.splice(props.config.routing?.rules?.indexOf(rule), 1);
                }

                const socks = props.config.inbounds?.find((i) => i.tag === "sys:socks-in");
                if (socks) {
                    props.config.inbounds?.splice(props.config.inbounds?.indexOf(socks), 1);
                }
            }
        };
        const concheckcancel = async () => {
            checkconenabled.value = false;
            conModal.value.close();
        };
        const validateCheckConOption = () => {
            const outbound = props.config.outbounds?.find((o) => o.protocol !== XrayProtocol.FREEDOM && o.protocol !== XrayProtocol.BLACKHOLE);
            return engine.mode === "client" && outbound !== undefined;
        };

        const concheckaccept = async () => {
            if (checkconenabled.value) {
                const socks = new XrayInboundObject<XraySocksInboundObject>(XrayProtocol.SOCKS, new XraySocksInboundObject());
                socks.listen = "127.0.0.1";
                socks.tag = "sys:socks-in";
                socks.port = 1080;
                props.config.inbounds.push(socks);

                if (props.config.routing) {
                    const rule = new XrayRoutingRuleObject();
                    rule.name = XrayRoutingRuleObject.connectionCheckRuleName;
                    rule.domain = ["ip-api.com"];

                    const outbound = props.config.outbounds?.find((o) => o.protocol !== XrayProtocol.FREEDOM && o.protocol !== XrayProtocol.BLACKHOLE);
                    rule.outboundTag = outbound?.tag;

                    props.config.routing.rules = [rule].concat(props.config.routing.rules || []);
                }
                conModal.value.close();
                await engine.executeWithLoadingProgress(async () => {
                    let cfg = engine.prepareServerConfig(props.config);
                    await engine.submit(SubmtActions.configurationApply, cfg);
                    await engine.loadXrayConfig();
                });
            }
        };

        return {
            startup,
            modal,
            conModal,
            checkconenabled,
            config: props.config,
            show,
            updatestartup,
            setcheckconnection,
            concheckcancel,
            concheckaccept,
            validateCheckConOption
        };
    }
});
</script>

<style scoped>
.go-option {
    cursor: pointer;
    margin-right: 10px;
}

.go-option:hover {
    text-shadow: 0 0 5px #000;
}
</style>