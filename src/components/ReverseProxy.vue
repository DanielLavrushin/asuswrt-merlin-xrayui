<template>
  <table class="FormTable" style="width: 100%">
    <thead>
      <tr>
        <td colspan="2">
          {{ $t('com.ReverseProxy.title') }}
          <hint v-html="$t('com.ReverseProxy.hint_title')"></hint>
        </td>
      </tr>
    </thead>
    <tbody>
      <tr v-if="reverse.bridges">
        <th>
          {{ $t('com.ReverseProxy.label_bridges') }}
          <hint v-html="$t('com.ReverseProxy.hint_bridges')"></hint>
        </th>
        <td>
          {{ reverse.bridges.length }} item(s)
          <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click.prevent="manage(XrayReverseItemType.BRIDGE)" />
          <reverse-items-modal ref="bridgeModal" v-model:items="reverse.bridges"></reverse-items-modal>
        </td>
      </tr>
      <tr v-if="reverse.portals">
        <th>
          {{ $t('com.ReverseProxy.label_portals') }}
          <hint v-html="$t('com.ReverseProxy.hint_portals')"></hint>
        </th>
        <td>
          {{ reverse.portals.length }} item(s)
          <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click.prevent="manage(XrayReverseItemType.PORTAL)" />
          <reverse-items-modal ref="portalModal" v-model:items="reverse.portals"></reverse-items-modal>
        </td>
      </tr>
    </tbody>
  </table>
</template>
<script lang="ts">
  import { defineComponent, inject, ref, Ref, watch } from 'vue';
  import Hint from '@main/Hint.vue';
  import Modal from '@main/Modal.vue';
  import { XrayReverseObject, XrayReverseItemType } from '@/modules/CommonObjects';
  import xrayConfig from '@/modules/XrayConfig';
  import ReverseItemsModal from '@modal/ReverseItemsModal.vue';

  export default defineComponent({
    name: 'ReverseProxy',
    components: {
      Hint,
      Modal,
      ReverseItemsModal
    },
    setup() {
      const bridgeModal = ref();
      const portalModal = ref();
      const reverse = ref<XrayReverseObject>(xrayConfig.reverse || new XrayReverseObject());

      const manage = (type: string) => {
        if (type === XrayReverseItemType.BRIDGE) {
          bridgeModal.value.show(type);
        } else if (type === XrayReverseItemType.PORTAL) {
          portalModal.value.show(type);
        }
      };

      watch(
        () => xrayConfig?.reverse,
        (newObj) => {
          reverse.value = newObj ?? new XrayReverseObject();
          if (!newObj) {
            xrayConfig.reverse = reverse.value;
          }
        },
        { immediate: true }
      );

      return { bridgeModal, portalModal, reverse, XrayReverseItemType, manage };
    }
  });
</script>
