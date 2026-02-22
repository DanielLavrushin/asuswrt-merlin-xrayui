<template>
  <modal ref="modal" :title="$t('com.GeneralOptionsModal.modal_title')" width="700">
    <div class="formfontdesc">
      <div class="go-tabs-nav">
        <button v-for="(tab, idx) in tabs" :key="idx" :class="{ active: currentTab.n === tab.n }" @click="currentTab = tab">
          {{ tab.t }}
        </button>
      </div>

      <div v-show="currentTab.n === 'general'">
        <table class="FormTable modal-form-table">
          <tbody>
            <tr>
              <th>{{ $t('com.GeneralOptionsModal.label_enable_debug') }}</th>
              <td>
                <label class="go-option"><input type="checkbox" v-model="options.debug" /></label>
              </td>
            </tr>
            <tr>
              <th>
                {{ $t('com.GeneralOptionsModal.start_xray_on_reboot') }}
              </th>
              <td>
                <label class="go-option"><input type="checkbox" v-model="options.startup" @click="updatestartup" /></label>
              </td>
            </tr>
            <tr v-if="options.startup">
              <th>
                {{ $t('com.GeneralOptionsModal.startup_delay') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_startup_delay')"></hint>
              </th>
              <td>
                <input type="number" maxlength="4" class="input_6_table" v-model="options.startup_delay" />
              </td>
            </tr>
            <tr>
              <th>
                {{ $t('com.GeneralOptionsModal.sleep_time') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_sleep_time')"></hint>
              </th>
              <td>
                <input type="number" maxlength="4" class="input_6_table" v-model="options.sleep_time" />
              </td>
            </tr>
            <tr v-show="validateCheckConOption()">
              <th>{{ $t('com.GeneralOptionsModal.check_xray_connection') }}</th>
              <td>
                <label class="go-option"><input type="checkbox" v-model="options.check_connection" /></label>
              </td>
            </tr>
            <tr v-if="options.check_connection">
              <th>
                {{ $t('com.GeneralOptionsModal.label_probe_url') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_probe_url')"></hint>
              </th>
              <td>
                <input v-model="options.probe_url" type="text" class="input_32_table" />
              </td>
            </tr>
            <tr>
              <th>
                {{ $t('com.GeneralOptionsModal.label_gh_proxy') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_gh_proxy')"></hint>
              </th>
              <td>
                <select class="input_option" v-model="options.github_proxy">
                  <option></option>
                  <option v-for="proxy in gh_proxies" :value="proxy">{{ proxy }}</option>
                </select>
              </td>
            </tr>
            <tr>
              <th>
                {{ $t('com.GeneralOptionsModal.label_skip_test') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_skip_test')"></hint>
              </th>
              <td>
                <label class="go-option"><input type="checkbox" v-model="options.skip_test" /></label>
              </td>
            </tr>
            <tr>
              <th>
                {{ $t('com.GeneralOptionsModal.label_clients_check') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_clients_check')"></hint>
              </th>
              <td>
                <label class="go-option"><input type="checkbox" v-model="options.clients_check" /></label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-show="currentTab.n === 'dns'">
        <table class="FormTable modal-form-table">
          <tbody>
            <tr>
              <th>
                {{ $t('com.GeneralOptionsModal.label_ipset') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_ipset')"></hint>
              </th>
              <td>
                <select class="input_option" v-model="options.ipsec">
                  <option v-for="opt in ipset_options" :value="opt">{{ opt }}</option>
                </select>
              </td>
            </tr>
            <tr>
              <th>
                {{ $t('com.GeneralOptionsModal.label_dns_leak') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_dns_leak')"></hint>
              </th>
              <td>
                <label class="go-option"><input type="checkbox" v-model="options.dns_only" /></label>
                <span class="hint-color">
                  <a :href="$t('guide.dns_leak')" target="_blank">{{ $t('labels.help') }}</a></span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-show="currentTab.n === 'geodata'">
        <table class="FormTable modal-form-table">
          <tbody>
            <tr>
              <th>{{ $t('com.GeneralOptionsModal.wellknown_geodata') }}</th>
              <td>
                <select class="input_option" v-model="selected_wellknown" @change="setwellknown">
                  <option></option>
                  <option v-for="source in known_geodat_sources" :value="source">{{ source.name }}</option>
                </select>
                <span class="hint-color">
                  <a v-if="selected_wellknown?.source" :href="selected_wellknown?.source" target="_blank">{{ selected_wellknown?.name }}</a>
                </span>
              </td>
            </tr>
            <tr>
              <th>{{ $t('com.GeneralOptionsModal.label_geoip_url') }}</th>
              <td><input v-model="options.geo_ip_url" type="text" class="input_32_table" /></td>
            </tr>
            <tr>
              <th>{{ $t('com.GeneralOptionsModal.label_geosite_url') }}</th>
              <td><input v-model="options.geo_site_url" type="text" class="input_32_table" /></td>
            </tr>
            <tr>
              <th>{{ $t('com.GeneralOptionsModal.label_geosite_autoupdate') }}</th>
              <td>
                <label class="go-option"><input type="checkbox" v-model="options.geo_auto_update" /></label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-show="currentTab.n === 'hooks'" v-if="options.hooks">
        <table class="FormTable modal-form-table">
          <tbody>
            <tr>
              <th>
                {{ $t('com.GeneralOptionsModal.label_hooks_before_firewall_start') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_hooks_before_firewall_start')"></hint>
              </th>
              <td>
                <div class="textarea-wrapper">
                  <textarea v-model.trim="options.hooks.before_firewall_start"></textarea>
                </div>
              </td>
            </tr>
            <tr>
              <th>
                {{ $t('com.GeneralOptionsModal.label_hooks_after_firewall_start') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_hooks_after_firewall_start')"></hint>
              </th>
              <td>
                <div class="textarea-wrapper">
                  <textarea v-model.trim="options.hooks.after_firewall_start"></textarea>
                </div>
              </td>
            </tr>
            <tr>
              <th>
                {{ $t('com.GeneralOptionsModal.label_hooks_after_firewall_cleanup') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_hooks_after_firewall_cleanup')"></hint>
              </th>
              <td>
                <div class="textarea-wrapper">
                  <textarea v-model.trim="options.hooks.after_firewall_cleanup"></textarea>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-show="currentTab.n === 'logs'">
        <table class="FormTable modal-form-table">
          <tbody>
            <tr>
              <th>
                {{ $t('com.GeneralOptionsModal.label_logs_enable_dnsmasqlog') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_logs_enable_dnsmasqlog')"></hint>
              </th>
              <td>
                <label class="go-option"><input type="checkbox" v-model="options.logs_dnsmasq" /></label>
              </td>
            </tr>
            <tr>
              <th>{{ $t('com.GeneralOptionsModal.label_logs_enable_access') }}</th>
              <td>
                <label class="go-option"><input type="checkbox" v-model="options.logs_access" /></label>
              </td>
            </tr>
            <tr>
              <th>{{ $t('com.GeneralOptionsModal.label_logs_enable_error') }}</th>
              <td>
                <label class="go-option"><input type="checkbox" v-model="options.logs_error" /></label>
              </td>
            </tr>
            <tr v-if="options.logs_error">
              <th>{{ $t('com.GeneralOptionsModal.label_logs_level') }}</th>
              <td>
                <select class="input_option" v-model="options.logs_level">
                  <option v-for="level in log_levels" :value="level">{{ level }}</option>
                </select>
                <span class="hint-color">`none` also turn-off access logs</span>
              </td>
            </tr>
            <tr>
              <th>{{ $t('com.GeneralOptionsModal.label_logs_enable_dns') }}</th>
              <td>
                <label class="go-option"><input type="checkbox" v-model="options.logs_dns" /></label>
              </td>
            </tr>
            <tr>
              <th>
                {{ $t('com.GeneralOptionsModal.label_logs_max_size') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_logs_max_size')"></hint>
              </th>
              <td>
                <label class="go-option"><input v-model="options.logs_max_size" type="number" class="input_6_table" /></label>
                <span class="hint-color">MB</span>
              </td>
            </tr>
            <tr>
              <th>{{ $t('com.GeneralOptionsModal.label_logs_dor') }}</th>
              <td>
                <label class="go-option"><input type="checkbox" v-model="options.logs_dor" /></label>
              </td>
            </tr>
            <tr v-if="ui?.integration?.scribe">
              <th>
                {{ $t('com.GeneralOptionsModal.label_logs_scribe') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_logs_scribe')"></hint>
              </th>
              <td>
                <label class="go-option"><input type="checkbox" v-model="options.logs_scribe" /></label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-show="currentTab.n === 'subscriptions'">
        <table class="FormTable modal-form-table">
          <tbody>
            <tr>
              <th>
                {{ $t('com.GeneralOptionsModal.label_subscription_links') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_subscription_links')"></hint>
              </th>
              <td>
                <div class="textarea-wrapper">
                  <textarea v-model="subscriptionLinks"></textarea>
                  <span class="row-buttons">
                    <button class="button_gen button_gen_small" @click.prevent="fetch_subscription_protocols">
                      {{ $t('com.GeneralOptionsModal.button_subscription_fetch') }}
                    </button>
                  </span>
                </div>
              </td>
            </tr>
            <tr>
              <th>
                {{ $t('com.GeneralOptionsModal.label_subscription_auto_refresh') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_subscription_auto_refresh')"></hint>
              </th>
              <td>
                <select class="input_option" v-model="options.subscription_auto_refresh">
                  <option value="disabled">{{ $t('labels.disabled') }}</option>
                  <option value="3h">{{ $t('com.GeneralOptionsModal.sub_refresh_3h') }}</option>
                  <option value="6h">{{ $t('com.GeneralOptionsModal.sub_refresh_6h') }}</option>
                  <option value="12h">{{ $t('com.GeneralOptionsModal.sub_refresh_12h') }}</option>
                </select>
              </td>
            </tr>
            <tr v-if="options.check_connection">
              <th>
                {{ $t('com.GeneralOptionsModal.label_subscription_auto_fallback') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_subscription_auto_fallback')"></hint>
              </th>
              <td>
                <label class="go-option"><input type="checkbox" v-model="options.subscription_auto_fallback" /></label>
              </td>
            </tr>
            <tr v-else>
              <th>
                {{ $t('com.GeneralOptionsModal.label_subscription_auto_fallback') }}
              </th>
              <td style="color: #ffcc00">
                {{ $t('com.GeneralOptionsModal.warn_auto_fallback_requires_observatory') }}
              </td>
            </tr>
            <tr v-if="options.check_connection && options.subscription_auto_fallback">
              <th>
                {{ $t('com.GeneralOptionsModal.label_subscription_fallback_interval') }}
                <hint v-html="$t('com.GeneralOptionsModal.hint_subscription_fallback_interval')"></hint>
              </th>
              <td>
                <select class="input_option" v-model.number="options.subscription_fallback_interval">
                  <option :value="2">2 min</option>
                  <option :value="5">5 min</option>
                  <option :value="10">10 min</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <input class="button_gen button_gen_small" type="button" :value="$t('labels.save')" @click.prevent="save" />
    </template>
  </modal>
</template>
<script lang="ts" setup>
  import { ref, inject, Ref, computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import Modal from '@main/Modal.vue';
  import Hint from '@main/Hint.vue';
  import useGeneralOptions from './GeneralOptionsModal';
  import { XrayObject } from '@/modules/XrayConfig';
  import { EngineResponseConfig, EngineSubscriptions } from '@/modules/Engine';
  import engine, { SubmitActions } from '@/modules/Engine';
  import { XrayProtocol } from '@/modules/Options';
  import axios from 'axios';

  const props = defineProps<{ config: XrayObject }>();
  const ui = inject<Ref<EngineResponseConfig>>('uiResponse')!;

  const { t } = useI18n();
  const { options, log_levels, ipset_options, hydrate, persist } = useGeneralOptions(props.config, ui);

  const modal = ref();

  const tabs = [
    { n: 'general', t: t('com.GeneralOptionsModal.tab_general') },
    { n: 'dns', t: t('com.GeneralOptionsModal.tab_dns') },
    { n: 'geodata', t: t('com.GeneralOptionsModal.tab_geodata') },
    { n: 'hooks', t: t('com.GeneralOptionsModal.tab_hooks') },
    { n: 'logs', t: t('com.GeneralOptionsModal.tab_logs') },
    { n: 'subscriptions', t: t('com.GeneralOptionsModal.tab_subscriptions') }
  ];
  const currentTab = ref(tabs[0]);

  const gh_proxies = [
    'https://proxy.lavrush.in/xray/',
    'https://ghfast.top/',
    'https://ghproxy.net/',
    'https://jiashu.1win.eu.org/',
    'https://gitproxy.click/',
    'https://gh-proxy.ygxz.in/',
    'https://github.moeyy.xyz/',
    'https://cdn.moran233.xyz/',
    'https://gh-proxy.com/',
    'https://git.886.be/'
  ];

  const known_geodat_sources = [
    {
      name: 'Loyalsoldier source',
      source: 'https://github.com/Loyalsoldier/v2ray-rules-dat',
      geoip_url: 'https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geoip.dat',
      geosite_url: 'https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat'
    },
    {
      name: 'RUNET Freedom source',
      source: 'https://github.com/runetfreedom/russia-v2ray-rules-dat',
      geoip_url: 'https://raw.githubusercontent.com/runetfreedom/russia-v2ray-rules-dat/release/geoip.dat',
      geosite_url: 'https://raw.githubusercontent.com/runetfreedom/russia-v2ray-rules-dat/release/geosite.dat'
    },
    {
      name: 'Nidelon source',
      source: 'https://github.com/Nidelon/ru-block-v2ray-rules',
      geoip_url: 'https://github.com/Nidelon/ru-block-v2ray-rules/releases/latest/download/geoip.dat',
      geosite_url: 'https://github.com/Nidelon/ru-block-v2ray-rules/releases/latest/download/geosite.dat'
    },
    {
      name: 'DustinWin source',
      source: 'https://github.com/DustinWin/ruleset_geodata',
      geoip_url: 'https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo/geoip.dat',
      geosite_url: 'https://github.com/DustinWin/ruleset_geodata/releases/download/mihomo/geosite.dat'
    },
    {
      name: 'Chocolate4U source',
      source: 'https://github.com/Chocolate4U/Iran-v2ray-rules',
      geoip_url: 'https://raw.githubusercontent.com/Chocolate4U/Iran-v2ray-rules/release/geoip.dat',
      geosite_url: 'https://raw.githubusercontent.com/Chocolate4U/Iran-v2ray-rules/release/geosite.dat'
    }
  ];

  const selected_wellknown = ref<any>();

  const subscriptionLinks = computed({
    get() {
      return options.subscriptions?.links?.join('\n') || '';
    },
    set(newValue) {
      if (!options.subscriptions) {
        options.subscriptions = new EngineSubscriptions();
      }
      options.subscriptions.links = newValue
        .split('\n')
        .map((link: string) => link.trim())
        .filter((link: string) => link.length > 0);
    }
  });

  const setwellknown = () => {
    if (selected_wellknown.value) {
      options.geo_ip_url = selected_wellknown.value.geoip_url;
      options.geo_site_url = selected_wellknown.value.geosite_url;
    }
  };

  const updatestartup = async () => {
    await engine.submit(SubmitActions.toggleStartupOption);
    window.xray.custom_settings.xray_startup = window.xray.custom_settings.xray_startup === 'y' ? 'n' : 'y';
  };

  const validateCheckConOption = () => {
    const outbound = props.config.outbounds?.find((o) => o.protocol !== XrayProtocol.FREEDOM && o.protocol !== XrayProtocol.BLACKHOLE);
    return outbound !== undefined;
  };

  const fetch_subscription_protocols = async () => {
    await engine.executeWithLoadingProgress(async () => {
      await engine.submit(SubmitActions.subscribeFetchProtocols, options.subscriptions?.links?.join('|'));
    }, false);
    try {
      const subsResp = await axios.get<Record<string, string[]>>(`/ext/xrayui/subscriptions.json?_=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache', Expires: '0' }
      });
      if (ui.value.xray) {
        if (!ui.value.xray.subscriptions) {
          ui.value.xray.subscriptions = new EngineSubscriptions();
        }
        ui.value.xray.subscriptions.protocols = subsResp.data;
      }
    } catch (e) {
      console.error('Error loading subscriptions after fetch:', e);
    }
  };

  const show = () => {
    hydrate();
    modal.value.show();
  };
  defineExpose({ show });
  const save = persist;
</script>

<style scoped>
  .go-tabs-nav {
    display: flex;
    background: #4d595d; /* dark bar (bjælke) */
    padding: 0 4px;
    border-radius: 4px 4px 0 0;
  }

  .go-tabs-nav button {
    min-width: 90px; /* same width as Merlin tabs */
    padding: 6px 14px;
    color: #e0e0e0;
    font-size: 13px;
    border: 1px solid #000;
    border-bottom: none;
    background: linear-gradient(#2b393f 0%, #1c242a 100%);
    border-radius: 4px 4px 0 0;
    margin-right: 2px;
    cursor: pointer;
  }

  .go-tabs-nav button:last-child {
    margin-right: 0;
  }

  .go-tabs-nav button.active {
    background: linear-gradient(#3477aa 0%, #215c9f 100%);
    color: #fff;
    border-color: #1e3d58 #1e3d58 #19232b; /* hide (skjul) bottom edge */
    z-index: 2;
  }

  .go-tabs-nav button:hover:not(.active) {
    filter: brightness(1.15);
  }

  .go-option {
    cursor: pointer;
    margin-right: 10px;
  }
  .go-option:hover {
    text-shadow: 0 0 5px #000;
  }
</style>
