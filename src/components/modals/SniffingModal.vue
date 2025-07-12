<template>
  <modal ref="modal" :title="$t('com.SniffingModal.modal_title')" width="500">
    <div class="formfontdesc">
      <p>{{ $t('com.SniffingModal.modal_desc') }}</p>
      <table width="100%" class="FormTable modal-form-table">
        <thead>
          <tr>
            <td colspan="2">{{ $t('com.SniffingModal.label_settings') }}</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>
              {{ $t('com.SniffingModal.label_enabled') }}
              <hint v-html="$t('com.SniffingModal.hint_enabled')"></hint>
            </th>
            <td>
              <input type="radio" v-model="sniffing.enabled" class="input" :value="true" :id="'snifon'" />
              <label class="settingvalue" :for="'snifon'">{{ $t('labels.enabled') }}</label>
              <input type="radio" v-model="sniffing.enabled" class="input" :value="false" :id="'snifoff'" />
              <label class="settingvalue" :for="'snifoff'">{{ $t('labels.disabled') }}</label>
            </td>
          </tr>
          <tr v-if="sniffing.enabled">
            <th>
              {{ $t('com.SniffingModal.label_metadata_only') }}
              <hint v-html="$t('com.SniffingModal.hint_metadata_only')"></hint>
            </th>
            <td>
              <input type="radio" v-model="sniffing.metadataOnly" class="input" :value="true" :id="'metaon'" />
              <label class="settingvalue" :for="'metaon'">{{ $t('labels.enabled') }}</label>
              <input type="radio" v-model="sniffing.metadataOnly" class="input" :value="false" :id="'metaoff'" />
              <label class="settingvalue" :for="'metaoff'">{{ $t('labels.disabled') }}</label>
            </td>
          </tr>
          <tr v-if="sniffing.enabled && !sniffing.metadataOnly">
            <th>
              {{ $t('com.SniffingModal.label_dest_override') }}
              <hint v-html="$t('com.SniffingModal.hint_dest_override')"></hint>
            </th>
            <td>
              <slot v-for="(opt, index) in destOptions" :key="index">
                <input type="checkbox" v-model="sniffing.destOverride" class="input" :value="opt" :id="'destopt-' + index" />
                <label :for="'destopt-' + index" class="settingvalue">{{ opt.toUpperCase() }}</label>
              </slot>
            </td>
          </tr>
          <tr v-if="sniffing.enabled && sniffing.destOverride && sniffing.destOverride.length > 0">
            <th>
              {{ $t('com.SniffingModal.label_route_only') }}
              <hint v-html="$t('com.SniffingModal.hint_route_only')"></hint>
            </th>
            <td>
              <input type="checkbox" v-model="sniffing.routeOnly" class="input" :id="'snifrouteonly'" />
              <span class="hint-color">default: false</span>
            </td>
          </tr>
          <tr v-if="sniffing.enabled">
            <th>
              {{ $t('com.SniffingModal.label_domains_excluded') }}
              <hint v-html="$t('com.SniffingModal.hint_domains_excluded')"></hint>
            </th>
            <td>
              <a v-if="sniffing.domainsExcluded">{{ $t('labels.items', [sniffing.domainsExcluded.length]) }}</a>
              <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click.prevent="manage_domains_exclude" />
              <modal width="500" ref="modalDomains" :title="$t('com.SniffingModal.modal_domains_title')">
                <div class="formfontdesc">
                  <p>{{ $t('com.SniffingModal.modal_domains_desc') }}</p>
                  <div class="textarea-wrapper">
                    <textarea v-model="domainsExludedContent" class="input_100" rows="8"></textarea>
                  </div>
                </div>
              </modal>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" :value="$t('labels.save')" @click.prevent="save" />
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref, watch } from 'vue';
  import Modal from '@main/Modal.vue';
  import { XraySniffingObject } from '@/modules/CommonObjects';
  import { XrayInboundObject } from '@/modules/InboundObjects';
  import { IProtocolType } from '@/modules/Interfaces';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'SniffingModal',
    components: {
      Modal,
      Hint
    },
    props: {
      sniffing: XraySniffingObject
    },

    setup(props, { emit }) {
      const sniffing = ref<XraySniffingObject>(props.sniffing ?? new XraySniffingObject());
      const destOptions = XraySniffingObject.destOverrideOptions;
      const domainsExludedContent = ref<string>('');
      const modalDomains = ref();
      const modal = ref();
      const show = (inbound: XrayInboundObject<IProtocolType>) => {
        inbound.sniffing = sniffing.value = inbound.sniffing ?? new XraySniffingObject();
        modal.value.show();
      };

      const manage_domains_exclude = () => {
        domainsExludedContent.value = sniffing.value.domainsExcluded?.join('\n') ?? '';

        modalDomains.value.show(() => {
          sniffing.value.domainsExcluded = domainsExludedContent.value.split('\n').filter((x) => x.trim() !== '');
        });
      };

      const save = () => {
        emit('save', sniffing);
        if (!sniffing.value.enabled) {
          sniffing.value.metadataOnly = false;
          sniffing.value.destOverride = [];
          sniffing.value.routeOnly = false;
        }
        modal.value.close();
      };

      watch(
        () => sniffing.value.metadataOnly,
        (newmetadataOnly) => {
          if (newmetadataOnly) {
            sniffing.value.destOverride = [];
          }
        },
        { deep: true }
      );

      watch(
        () => sniffing.value.destOverride?.length,
        (val: number | undefined) => {
          val = val ?? 0;
          if (sniffing) {
            sniffing.value.routeOnly = sniffing.value.routeOnly && val > 0;
          }
        },
        { deep: true }
      );

      return {
        sniffing,
        destOptions,
        domainsExludedContent,
        modal,
        modalDomains,
        manage_domains_exclude,
        show,
        save
      };
    }
  });
</script>
