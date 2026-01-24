<template>
  <tr ref="rowRef" class="unlocked">
    <th>
      {{ $t('com.OutboundCommon.label_tag') }}
      <hint v-html="$t('com.OutboundCommon.hint_tag')"></hint>
    </th>
    <td>
      <input type="text" class="input_20_table" v-model="proxy.tag" />
    </td>
  </tr>

  <tr class="unlocked">
    <th>
      {{ $t('com.OutboundCommon.label_subscription_url') }}
      <hint v-html="$t('com.OutboundCommon.hint_subscription_url')"></hint>
    </th>
    <td>
      <input type="text" class="input_32_table" v-model="proxy.surl" />
      <span class="row-buttons">
        <input class="button_gen button_gen_small" type="button" :title="$t('labels.delete')" value="&#10005;" v-show="isLocked" @click="clear_url" />
      </span>
    </td>
  </tr>
  <tr class="unlocked subscription-list" v-if="!proxy.surl && protocols.length > 0">
    <th>
      {{ $t('com.OutboundCommon.label_subscription_type') }}
      <hint v-html="$t('com.OutboundCommon.hint_subscription_type')"></hint>
    </th>
    <td>
      <select class="input_option" v-model="subscription" @change="apply_subscription">
        <option v-for="protocol in protocols" :key="protocol.tag" :value="protocol">
          {{ protocol.tag }}
        </option>
      </select>
    </td>
  </tr>

  <tr class="unlocked">
    <th>
      {{ $t('com.OutboundCommon.label_send_through') }}
      <hint v-html="$t('com.OutboundCommon.hint_send_through')"></hint>
    </th>
    <td>
      <input type="text" class="input_20_table" v-model="proxy.sendThrough" autocomplete="off" autocorrect="off" autocapitalize="off" />
      <span class="hint-color">default: 0.0.0.0</span>
    </td>
  </tr>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, watch, nextTick, inject, Ref } from 'vue';
  import { XrayOutboundObject } from '@/modules/OutboundObjects';
  import { IProtocolType } from '@/modules/Interfaces';
  import AllocateModal from '@modal/AllocateModal.vue';
  import Hint from '@main/Hint.vue';
  import { EngineResponseConfig } from '@modules/Engine';
  import { XrayParsedUrlObject } from '@modules/CommonObjects';
  import ProxyParser from '@modules/parsers/ProxyParser';

  export default defineComponent({
    name: 'OutboundCommon',
    components: { AllocateModal, Hint },
    props: { proxy: XrayOutboundObject<IProtocolType> },
    emits: ['apply-parsed'],
    setup(props, { emit }) {
      const proxy = ref<XrayOutboundObject<IProtocolType>>(props.proxy ?? new XrayOutboundObject<IProtocolType>());
      const isLocked = computed(() => !!proxy.value.surl?.trim());
      const rowRef = ref<HTMLElement | null>(null);
      const ui = inject<Ref<EngineResponseConfig>>('uiResponse')!;
      const subscription = ref<XrayParsedUrlObject | undefined>(undefined);

      const toggle = (state: boolean) => {
        nextTick(() => {
          const tables = rowRef.value?.closest('.formfontdesc')?.querySelectorAll('table') as NodeListOf<HTMLElement>;
          tables.forEach((table) => table.classList.toggle('locked', state));
        });
      };

      const clear_url = () => {
        proxy.value.surl = '';
      };

      const protocols = computed(() => {
        const coll = ui.value.xray?.subscriptions?.protocols?.[proxy.value.protocol];
        if (coll) {
          return coll
            .map((x) => {
              try {
                return new XrayParsedUrlObject(x);
              } catch (e) {
                return undefined;
              }
            })
            .filter((x) => x !== undefined) as XrayParsedUrlObject[];
        }
        return [];
      });

      const apply_subscription = () => {
        if (subscription.value) {
          const parser = new ProxyParser(subscription.value.url);
          const parsedProxy = parser.getOutbound();

          if (parsedProxy) emit('apply-parsed', parsedProxy);
        }
      };

      watch(isLocked, toggle, { immediate: true });

      return { protocols, subscription, proxy, isLocked, rowRef, clear_url, apply_subscription };
    }
  });
</script>
<style scoped lang="scss">
  .subscription-list {
    select {
      max-width: 200px;
    }
  }
</style>
