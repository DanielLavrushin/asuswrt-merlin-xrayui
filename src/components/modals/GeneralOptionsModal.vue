<template>
  <modal ref="modal" :title="$t('com.GeneralOptionsModal.modal_title')" width="700">
    <div class="formfontdesc">
      <table class="FormTable modal-form-table">
        <tbody>
          <tr>
            <th>
              {{ $t('com.GeneralOptionsModal.label_enable_debug') }}
            </th>
            <td>
              <label class="go-option">
                <input type="checkbox" v-model="options.debug" />
              </label>
            </td>
          </tr>
          <tr>
            <th>{{ $t('com.GeneralOptionsModal.start_xray_on_reboot') }}</th>
            <td>
              <label class="go-option">
                <input type="checkbox" v-model="options.startup" @click="updatestartup" />
              </label>
            </td>
          </tr>
          <tr v-show="validateCheckConOption()">
            <th>{{ $t('com.GeneralOptionsModal.check_xray_connection') }}</th>
            <td>
              <label class="go-option">
                <input type="checkbox" v-model="options.check_connection" />
              </label>
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
              <label class="go-option">
                <input type="checkbox" v-model="options.skip_test" />
              </label>
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('com.GeneralOptionsModal.label_clients_check') }}
              <hint v-html="$t('com.GeneralOptionsModal.hint_clients_check')"></hint>
            </th>
            <td>
              <label class="go-option">
                <input type="checkbox" v-model="options.clients_check" />
              </label>
            </td>
          </tr>
        </tbody>
      </table>
      <table class="FormTable modal-form-table">
        <thead>
          <tr>
            <td colspan="2">{{ $t('com.GeneralOptionsModal.geodad_header') }}</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>
              {{ $t('com.GeneralOptionsModal.label_ipsec') }}
              <hint v-html="$t('com.GeneralOptionsModal.hint_ipsec')"></hint>
            </th>
            <td>
              <select class="input_option" v-model="options.ipsec">
                <option v-for="opt in ipsec_options" :value="opt">{{ opt }}</option>
              </select>
            </td>
          </tr>
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
            <td>
              <input v-model="options.geo_ip_url" type="text" class="input_32_table" />
            </td>
          </tr>
          <tr>
            <th>{{ $t('com.GeneralOptionsModal.label_geosite_url') }}</th>
            <td>
              <input v-model="options.geo_site_url" type="text" class="input_32_table" />
            </td>
          </tr>
          <tr>
            <th>{{ $t('com.GeneralOptionsModal.label_geosite_autoupdate') }}</th>
            <td>
              <label class="go-option">
                <input type="checkbox" v-model="options.geo_auto_update" />
              </label>
            </td>
          </tr>
        </tbody>
      </table>
      <table class="FormTable modal-form-table">
        <thead>
          <tr>
            <td colspan="2">{{ $t('com.GeneralOptionsModal.logs_header') }}</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>
              {{ $t('com.GeneralOptionsModal.label_logs_enable_dnsmasqlog') }}
              <hint v-html="$t('com.GeneralOptionsModal.hint_logs_enable_dnsmasqlog')"></hint>
            </th>
            <td>
              <label class="go-option">
                <input type="checkbox" v-model="options.logs_dnsmasq" />
              </label>
            </td>
          </tr>
          <tr>
            <th>{{ $t('com.GeneralOptionsModal.label_logs_enable_access') }}</th>
            <td>
              <label class="go-option">
                <input type="checkbox" v-model="options.logs_access" />
              </label>
            </td>
          </tr>
          <tr>
            <th>{{ $t('com.GeneralOptionsModal.label_logs_enable_error') }}</th>
            <td>
              <label class="go-option">
                <input type="checkbox" v-model="options.logs_error" />
              </label>
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
              <label class="go-option">
                <input type="checkbox" v-model="options.logs_dns" />
              </label>
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('com.GeneralOptionsModal.label_logs_max_size') }}
              <hint v-html="$t('com.GeneralOptionsModal.hint_logs_max_size')"></hint>
            </th>
            <td>
              <label class="go-option">
                <input v-model="options.logs_max_size" type="number" class="input_6_table" />
              </label>
              <span class="hint-color">MB</span>
            </td>
          </tr>
          <tr>
            <th>{{ $t('com.GeneralOptionsModal.label_logs_dor') }}</th>
            <td>
              <label class="go-option">
                <input type="checkbox" v-model="options.logs_dor" />
              </label>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <template #footer>
      <input class="button_gen button_gen_small" type="button" :value="$t('labels.save')" @click.prevent="save" />
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, inject, Ref, ref, watch } from 'vue';
  import engine, { EngineResponseConfig, SubmitActions } from '@/modules/Engine';
  import { XrayObject } from '@/modules/XrayConfig';
  import { XrayRoutingRuleObject } from '@/modules/CommonObjects';
  import Hint from '@main/Hint.vue';
  import Modal from '@main/Modal.vue';
  import { XrayInboundObject, XraySocksInboundObject } from '@/modules/InboundObjects';
  import { XrayProtocol } from '@/modules/Options';

  class GeneralOptions {
    public startup = false;
    public debug = false;
    public github_proxy = '';
    public logs_access = false;
    public logs_dnsmasq = false;
    public logs_error = false;
    public logs_dns = false;
    public logs_dor = false;
    public skip_test = false;
    public clients_check = false;
    public ipsec = 'off';
    public logs_max_size = 10;
    public logs_level = 'warning';
    public geo_ip_url = '';
    public geo_site_url = '';
    public geo_auto_update = false;
    public check_connection = false;
  }

  interface WellKnownGeodatSource {
    name: string;
    source: string;
    geoip_url: string;
    geosite_url: string;
  }

  export default defineComponent({
    name: 'GeneralOptionsModal',
    components: {
      Modal,
      Hint
    },
    props: {
      config: {
        type: XrayObject,
        required: true
      }
    },
    setup(props) {
      const uiResponse = inject<Ref<EngineResponseConfig>>('uiResponse')!;
      const config = ref<XrayObject>(props.config);
      const modal = ref();
      const conModal = ref();
      const gh_proxies = ref<string[]>([
        'https://ghfast.top/',
        'https://ghproxy.net/',
        'https://jiashu.1win.eu.org/',
        'https://gitproxy.click/',
        'https://gh-proxy.ygxz.in/',
        'https://github.moeyy.xyz/',
        'https://cdn.moran233.xyz/',
        'https://gh-proxy.com/',
        'https://git.886.be/'
      ]);
      const options = ref<GeneralOptions>(new GeneralOptions());
      const selected_wellknown = ref<WellKnownGeodatSource>();

      const known_geodat_sources = ref<WellKnownGeodatSource[]>([
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
      ]);

      const setwellknown = (event: Event) => {
        if (selected_wellknown.value) {
          options.value.geo_ip_url = selected_wellknown.value.geoip_url;
          options.value.geo_site_url = selected_wellknown.value.geosite_url;
        }
      };
      const save = async () => {
        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmitActions.generalOptionsApply, options.value);
        });
      };

      const show = () => {
        options.value = new GeneralOptions();
        options.value.startup = window.xray.custom_settings.xray_startup === 'y';
        options.value.logs_access = config.value.log?.access != 'none';
        options.value.logs_error = config.value.log?.error != 'none';
        options.value.logs_dns = config.value.log?.dnsLog ?? false;
        options.value.logs_level = config.value.log?.loglevel ?? 'warning';
        options.value.geo_ip_url = uiResponse?.value.geodata?.geoip_url ?? '';
        options.value.geo_site_url = uiResponse?.value.geodata?.geosite_url ?? '';
        options.value.geo_auto_update = uiResponse?.value.geodata?.auto_update ?? false;
        options.value.github_proxy = uiResponse?.value.xray?.github_proxy ?? '';
        options.value.logs_dnsmasq = uiResponse?.value.xray?.dnsmasq ?? false;
        options.value.logs_max_size = uiResponse?.value.xray?.logs_max_size ?? 10;
        options.value.logs_dor = uiResponse?.value.xray?.logs_dor ?? false;
        options.value.skip_test = uiResponse?.value.xray?.skip_test ?? false;
        options.value.clients_check = uiResponse?.value.xray?.clients_check ?? false;
        options.value.debug = uiResponse?.value.xray?.debug ?? false;
        options.value.ipsec = uiResponse?.value.xray?.ipsec ?? 'off';
        options.value.check_connection = uiResponse?.value.xray?.check_connection ?? false;
        modal.value.show();
      };

      const updatestartup = async () => {
        await engine.submit(SubmitActions.toggleStartupOption);
        window.xray.custom_settings.xray_startup = window.xray.custom_settings.xray_startup === 'y' ? 'n' : 'y';
      };

      const validateCheckConOption = () => {
        const outbound = props.config.outbounds?.find((o) => o.protocol !== XrayProtocol.FREEDOM && o.protocol !== XrayProtocol.BLACKHOLE);
        return outbound !== undefined;
      };

      return {
        options,
        modal,
        conModal,
        config: props.config,
        known_geodat_sources,
        selected_wellknown,
        gh_proxies,
        log_levels: ['none', 'debug', 'info', 'warning', 'error'],
        ipsec_options: ['off', 'bypass', 'redirect'],
        show,
        save,
        setwellknown,
        updatestartup,
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
