<template>
  <tbody>
    <tr>
      <th>
        {{ $t('com.Xhttp.label_xPaddingObfsMode') }}
        <hint v-html="$t('com.Xhttp.hint_xPaddingObfsMode')"></hint>
      </th>
      <td><input type="checkbox" v-model="padding.xPaddingObfsMode" /></td>
    </tr>
    <tr v-if="padding.xPaddingObfsMode">
      <th>
        {{ $t('com.Xhttp.label_xPaddingPlacement') }}
        <hint v-html="$t('com.Xhttp.hint_xPaddingPlacement')"></hint>
      </th>
      <td>
        <select class="input_option" v-model="padding.xPaddingPlacement">
          <option v-for="opt in paddingPlacements" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <span class="hint-color">default: queryInHeader</span>
      </td>
    </tr>
    <tr v-if="padding.xPaddingObfsMode">
      <th>
        {{ $t('com.Xhttp.label_xPaddingMethod') }}
        <hint v-html="$t('com.Xhttp.hint_xPaddingMethod')"></hint>
      </th>
      <td>
        <select class="input_option" v-model="padding.xPaddingMethod">
          <option v-for="opt in paddingMethods" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <span class="hint-color">default: repeat-x</span>
      </td>
    </tr>
    <tr v-if="padding.xPaddingObfsMode">
      <th>
        {{ $t('com.Xhttp.label_xPaddingKey') }}
        <hint v-html="$t('com.Xhttp.hint_xPaddingKey')"></hint>
      </th>
      <td>
        <input type="text" placeholder="x_padding" class="input_20_table" v-model="padding.xPaddingKey" />
      </td>
    </tr>
    <tr v-if="padding.xPaddingObfsMode">
      <th>
        {{ $t('com.Xhttp.label_xPaddingHeader') }}
        <hint v-html="$t('com.Xhttp.hint_xPaddingHeader')"></hint>
      </th>
      <td>
        <input type="text" placeholder="X-Padding" class="input_20_table" v-model="padding.xPaddingHeader" />
      </td>
    </tr>
  </tbody>
</template>

<script lang="ts">
  import { defineComponent, ref, type PropType } from 'vue';
  import Hint from '@main/Hint.vue';
  import { XrayXhttpExtraObject } from '@/modules/TransportObjects';
  import { XrayOptions } from '@/modules/Options';

  export default defineComponent({
    name: 'XhttpPadding',
    components: { Hint },
    props: {
      settings: { type: Object as PropType<XrayXhttpExtraObject>, required: true }
    },
    setup(props) {
      return {
        padding: ref(props.settings),
        paddingPlacements: XrayOptions.xhttpPaddingPlacements,
        paddingMethods: XrayOptions.xhttpPaddingMethods
      };
    }
  });
</script>
