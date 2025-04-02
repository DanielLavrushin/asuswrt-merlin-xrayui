<template>
  <table width="100%" bordercolor="#6b8fa3" class="FormTable" v-if="dns">
    <thead>
      <tr>
        <td colspan="2">
          {{ $t('com.Dns.title') }}
          <hint v-html="$t('com.Dns.hint_title')"></hint>
        </td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>
          {{ $t('com.Dns.label_tag') }}
          <hint v-html="$t('com.Dns.hint_tag')"></hint>
        </th>
        <td>
          <input type="text" class="input_20_table" v-model="dns.tag" />
          <span class="hint-color"></span>
        </td>
      </tr>
      <tr v-if="dns.hosts">
        <th>
          {{ $t('com.Dns.label_hosts') }}
          <hint v-html="$t('com.Dns.hint_hosts')"></hint>
        </th>
        <td>
          {{ Object.getOwnPropertyNames(dns.hosts).length }} item(s)
          <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click.prevent="manage_hosts()" />
          <span class="hint-color"></span>
          <dns-hosts-modal ref="modalHosts" v-model:hosts="dns.hosts"></dns-hosts-modal>
        </td>
      </tr>
      <tr v-if="dns.servers">
        <th>
          {{ $t('com.Dns.label_servers') }}
          <hint v-html="$t('com.Dns.hint_servers')"></hint>
        </th>
        <td>
          {{ dns.servers.length }} item(s)
          <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click.prevent="manage_servers()" />
          <span class="hint-color"></span>
          <dns-servers-modal ref="modalServers" v-model:servers="dns.servers"></dns-servers-modal>
        </td>
      </tr>
      <tr>
        <th>
          {{ $t('com.Dns.label_client_ip') }}
          <hint v-html="$t('com.Dns.hint_client_ip')"></hint>
        </th>
        <td>
          <input type="text" maxlength="15" class="input_20_table" v-model="dns.clientIp" onkeypress="return validator.isIPAddr(this, event);" autocomplete="off" autocorrect="off" autocapitalize="off" />
          <span class="hint-color"></span>
        </td>
      </tr>
      <tr>
        <th>
          {{ $t('com.Dns.label_query_strategy') }}
          <hint v-html="$t('com.Dns.hint_query_strategy')"></hint>
        </th>
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
        <th>
          {{ $t('com.Dns.label_disable_cache') }}
          <hint v-html="$t('com.Dns.hint_disable_cache')"></hint>
        </th>
        <td>
          <input type="checkbox" v-model="dns.disableCache" />
          <span class="hint-color">default: false</span>
        </td>
      </tr>
      <tr>
        <th>
          {{ $t('com.Dns.label_disable_fallback') }}
          <hint v-html="$t('com.Dns.hint_disable_fallback')"></hint>
        </th>
        <td>
          <input type="checkbox" v-model="dns.disableFallback" />
          <span class="hint-color">default: false</span>
        </td>
      </tr>
      <tr>
        <th>
          {{ $t('com.Dns.label_fallback_if_match') }}
          <hint v-html="$t('com.Dns.hint_fallback_if_match')"></hint>
        </th>
        <td>
          <input type="checkbox" v-model="dns.disableFallbackIfMatch" />
          <span class="hint-color">default: false</span>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
  import { defineComponent, ref, watch } from 'vue';
  import engine from '@/modules/Engine';
  import { XrayDnsObject } from '@/modules/CommonObjects';
  import xrayConfig from '@/modules/XrayConfig';
  import DnsHostsModal from '@modal/DnsHostsModal.vue';
  import DnsServersModal from '@modal/DnsServersModal.vue';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'Dns',
    components: {
      Hint,
      DnsHostsModal,
      DnsServersModal
    },

    setup() {
      const config = ref(engine.xrayConfig);
      const dns = ref<XrayDnsObject>(config.value.dns ?? new XrayDnsObject());
      const modalHosts = ref();
      const modalServers = ref();
      const manage_hosts = () => {
        modalHosts.value.show();
      };
      const manage_servers = () => {
        modalServers.value.show();
      };
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
        strategyOptions: XrayDnsObject.strategyOptions,
        manage_hosts,
        manage_servers
      };
    }
  });
</script>
