<template>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable" v-if="dns">
        <thead>
            <tr>
                <td colspan="2">DNS</td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <th>Tag</th>
                <td>
                    <input type="text" class="input_20_table" v-model="dns.tag" />
                    <span class="hint-color"></span>
                </td>
            </tr>
            <tr v-if="dns.hosts">
                <th>Hosts</th>
                <td>
                    {{ Object.getOwnPropertyNames(dns.hosts).length }} item(s)
                    <input class="button_gen button_gen_small" type="button" value="Manage"
                        @click.prevent="manage_hosts()" />
                    <span class="hint-color"></span>
                    <dns-hosts-modal ref="modalHosts" v-model:hosts="dns.hosts"></dns-hosts-modal>
                </td>
            </tr>
            <tr v-if="dns.servers">
                <th>Servers</th>
                <td>
                    {{ dns.servers.length }} item(s)
                    <input class="button_gen button_gen_small" type="button" value="Manage"
                        @click.prevent="manage_servers()" />
                    <span class="hint-color"></span>
                    <dns-servers-modal ref="modalServers" v-model:servers="dns.servers"></dns-servers-modal>
                </td>
            </tr>
            <tr v-if="engine.mode == 'client'">
                <th>Client ip</th>
                <td>
                    <input type="text" maxlength="15" class="input_20_table" v-model="dns.clientIp"
                        onkeypress="return validator.isIPAddr(this, event);" autocomplete="off" autocorrect="off"
                        autocapitalize="off" />
                    <span class="hint-color"></span>
                </td>
            </tr>
            <tr>
                <th>Query strategy</th>
                <td>
                    <select class="input_option" v-model="dns.queryStrategy">
                        <option v-for="(opt, index) in strategyOptions" :key="index" :value="opt">
                            {{ opt }}
                        </option>
                    </select>
                    <span class="hint-color">default: UseIP</span>
                </td>
            </tr>
            <tr>
                <th>Disable cache</th>
                <td>
                    <input type="checkbox" v-model="dns.disableCache" />
                    <span class="hint-color">default: false</span>
                </td>
            </tr>
            <tr>
                <th>Disable fallback</th>
                <td>
                    <input type="checkbox" v-model="dns.disableFallback" />
                    <span class="hint-color">default: false</span>
                </td>
            </tr>
            <tr>
                <th>Disable fallbackI if match</th>
                <td>
                    <input type="checkbox" v-model="dns.disableFallbackIfMatch" />
                    <span class="hint-color">default: false</span>
                </td>
            </tr>
        </tbody>
    </table>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import engine from "../modules/Engine";
import { XrayDnsObject } from "../modules/CommonObjects";
import xrayConfig from "../modules/XrayConfig";
import DnsHostsModal from "./modals/DnsHostsModal.vue";
import DnsServersModal from "./modals/DnsServersModal.vue";

export default defineComponent({
    name: "Dns",
    components: {
        DnsHostsModal,
        DnsServersModal
    },

    methods: {
        manage_hosts() {
            this.modalHosts.show();
        },
        manage_servers() {
            this.modalServers.show();
        }
    },
    setup() {
        const config = ref(engine.xrayConfig);
        const dns = ref<XrayDnsObject>(config.value.dns ?? new XrayDnsObject());
        const modalHosts = ref();
        const modalServers = ref();

        watch(
            () => config.value.dns,
            (newObj) => {
                dns.value = newObj ?? new XrayDnsObject();
                if (!newObj) {
                    xrayConfig.dns = dns.value;
                }
            },
            { immediate: true }
        );

        return {
            engine,
            dns,
            modalHosts,
            modalServers,
            strategyOptions: XrayDnsObject.strategyOptions
        }
    },
});
</script>