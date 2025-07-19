<template>
  <tr ref="rowRef" class="unlocked">
    <th>
      {{ $t('com.OutboundCommon.label_tag') }}
      <hint v-html="$t('com.OutboundCommon.hint_tag')"></hint>
    </th>
    <td>
      <input type="text" class="input_20_table" v-model="proxy.tag" />
      <span class="hint-color"></span>
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
  import { defineComponent, ref, computed, watch, nextTick } from 'vue';
  import { XrayOutboundObject } from '@/modules/OutboundObjects';
  import { IProtocolType } from '@/modules/Interfaces';
  import AllocateModal from '@modal/AllocateModal.vue';
  import Hint from '@main/Hint.vue';

  export default defineComponent({
    name: 'OutboundCommon',
    components: { AllocateModal, Hint },
    props: { proxy: XrayOutboundObject<IProtocolType> },
    setup(props) {
      const proxy = ref<XrayOutboundObject<IProtocolType>>(props.proxy ?? new XrayOutboundObject<IProtocolType>());
      const isLocked = computed(() => !!proxy.value.surl?.trim());
      const rowRef = ref<HTMLElement | null>(null);

      const toggle = (state: boolean) => {
        nextTick(() => {
          const tables = rowRef.value?.closest('.formfontdesc')?.querySelectorAll('table') as NodeListOf<HTMLElement>;
          tables.forEach((table) => table.classList.toggle('locked', state));
        });
      };

      const clear_url = () => {
        proxy.value.surl = '';
      };

      watch(isLocked, toggle, { immediate: true });

      return { proxy, isLocked, rowRef, clear_url };
    }
  });
</script>
