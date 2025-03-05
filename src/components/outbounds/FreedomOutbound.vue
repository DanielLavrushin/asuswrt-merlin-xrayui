<template>
  <div class="formfontdesc">
    <p>{{ $t("components.FreedomOutbound.modal_desc") }}</p>
    <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="2">{{ $t("components.FreedomOutbound.modal_title") }}</td>
        </tr>
      </thead>
      <tbody>
        <outbound-common :proxy="proxy"></outbound-common>
        <tr>
          <th>
            {{ $t("components.FreedomOutbound.label_domain_strategy") }}
            <hint v-html="$t('components.FreedomOutbound.hint_domain_strategy')"></hint>
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
          <th>
            {{ $t("components.FreedomOutbound.label_redirect") }}
            <hint v-html="$t('components.FreedomOutbound.hint_redirect')"></hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.redirect" autocomplete="off" autocorrect="off" autocapitalize="off" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t("components.FreedomOutbound.label_proxy_protocol") }}
            <hint v-html="$t('components.FreedomOutbound.hint_proxy_protocol')"></hint>
          </th>
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
          <th>
            {{ $t("components.FreedomOutbound.label_fragment") }}
            <hint v-html="$t('components.FreedomOutbound.hint_fragment')"></hint>
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
          <th>
            {{ $t("components.FreedomOutbound.label_fragment_length") }}
            <hint v-html="$t('components.FreedomOutbound.hint_fragment_length')"></hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.fragment.length" autocomplete="off" autocorrect="off" autocapitalize="off" />
          </td>
        </tr>
        <tr v-if="proxy.settings.fragment.packets !== ''">
          <th>
            {{ $t("components.FreedomOutbound.label_fragment_interval") }}
            <hint v-html="$t('components.FreedomOutbound.hint_fragment_interval')"></hint>
          </th>
          <td>
            <input type="text" class="input_20_table" v-model="proxy.settings.fragment.interval" autocomplete="off" autocorrect="off" autocapitalize="off" />
          </td>
        </tr>
      </tbody>
      <tbody v-if="proxy.settings.noises">
        <tr>
          <th>
            {{ $t("components.FreedomOutbound.label_udp_noise") }}
            <hint v-html="$t('components.FreedomOutbound.hint_udp_noise')"></hint>
          </th>
          <td>
            {{ $t("labels.items", [proxy.settings.noises.length]) }}
            <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click.prevent="manage_noises" />
            <modal width="500" ref="modalNoises" :title="$t('components.FreedomOutbound.modal_udp_noise_title')">
              <table class="FormTable modal-form-table">
                <tbody>
                  <tr v-for="(noise, index) in proxy.settings.noises" :key="index">
                    <td>{{ noise }}</td>
                    <td>
                      <input class="button_gen button_gen_small" type="button" :value="$t('labels.edit')" @click.prevent="modal_noise_open(noise)" />
                      <input class="button_gen button_gen_small" type="button" :value="$t('labels.remove')" @click.prevent="proxy.settings.noises.splice(index, 1)" />
                    </td>
                  </tr>
                  <tr v-if="!proxy.settings.noises.length" class="data_tr">
                    <td colspan="3" style="color: #ffcc00">no entries</td>
                  </tr>
                </tbody>
              </table>
              <template v-slot:footer>
                <input class="button_gen button_gen_small" type="button" :value="$t('labels.add')" @click.prevent="modal_noise_open()" />
                <input class="button_gen button_gen_small" type="button" :value="$t('labels.close')" @click.prevent="modal_noises_close()" />
              </template>
            </modal>
            <modal width="400" ref="modalNoise" :title="$t('components.FreedomOutbound.modal_udp_noise_entry_title')">
              <table class="FormTable modal-form-table" v-if="noiseItem">
                <tbody>
                  <tr>
                    <th>
                      {{ $t("components.FreedomOutbound.label_udp_noise_type") }}
                      <hint v-html="$t('components.FreedomOutbound.hint_udp_noise_type')"></hint>
                    </th>
                    <td>
                      <select class="input_option" v-model="noiseItem.type">
                        <option v-for="opt in noiseTypeOptions" :key="opt" :value="opt">
                          {{ opt }}
                        </option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      {{ $t("components.FreedomOutbound.label_udp_noise_packet") }}
                      <hint v-html="$t('components.FreedomOutbound.hint_udp_noise_packet')"> </hint>
                    </th>
                    <td>
                      <input type="text" class="input_20_table" v-model="noiseItem.packet" autocomplete="off" autocorrect="off" autocapitalize="off" />
                    </td>
                  </tr>
                  <tr>
                    <th>
                      {{ $t("components.FreedomOutbound.label_udp_noise_delay") }}
                      <hint v-html="$t('components.FreedomOutbound.hint_udp_noise_delay')"></hint>
                    </th>
                    <td>
                      <input type="text" class="input_20_table" v-model="noiseItem.delay" autocomplete="off" autocorrect="off" autocapitalize="off" />
                    </td>
                  </tr>
                </tbody>
              </table>
              <template v-slot:footer>
                <input class="button_gen button_gen_small" type="button" :value="$t('labels.save')" @click.prevent="modal_save_noise()" />
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
      proxy: XrayOutboundObject<XrayFreedomOutboundObject>
    },
    setup(props) {
      const proxy = ref<XrayOutboundObject<XrayFreedomOutboundObject>>(props.proxy ?? new XrayOutboundObject<XrayFreedomOutboundObject>(XrayProtocol.FREEDOM, new XrayFreedomOutboundObject()));
      const noiseItem = ref<XrayNoiseObject>();
      const modalNoise = ref();
      const modalNoises = ref();

      const modal_save_noise = () => {
        if (noiseItem.value && proxy.value.settings.noises) {
          if (!proxy.value.settings.noises.includes(noiseItem.value)) {
            proxy.value.settings.noises.push(noiseItem.value);
          }
        }
        modalNoise.value.close();
      };

      const modal_noises_close = () => {
        modalNoises.value.close();
      };

      const manage_noises = () => {
        modalNoises.value.show();
      };

      const modal_noise_open = (noise?: XrayNoiseObject) => {
        noiseItem.value = noise ? noise : new XrayNoiseObject();
        modalNoise.value.show();
      };

      return {
        proxy,
        modalNoise,
        modalNoises,
        noiseItem,
        strategyOptions: XrayFreedomOutboundObject.strategyOptions,
        fragmentOptions: XrayFreedomOutboundObject.fragmentOptions,
        noiseTypeOptions: XrayNoiseObject.typeOptions,
        proxyProtocolOptions: [
          { key: 0, value: "disabled" },
          { key: 1, value: "version 1" },
          { key: 2, value: "version 2" }
        ],
        modal_save_noise,
        modal_noises_close,
        manage_noises,
        modal_noise_open
      };
    }
  });
</script>
