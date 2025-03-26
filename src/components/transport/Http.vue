<template>
  <tbody v-if="transport.xhttpSettings">
    <tr>
      <th>HTTP request method</th>
      <td>
        <select class="input_option" v-model="transport.xhttpSettings.method">
          <option v-for="opt in methods" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </select>
        <span class="hint-color">default: PUT</span>
      </td>
    </tr>
    <tr>
      <th>Domain Names</th>
      <td>
        <div class="textarea-wrapper">
          <textarea v-model="hosts" rows="25"></textarea>
        </div>
      </td>
    </tr>
    <tr>
      <th>The HTTP path</th>
      <td>
        <input type="text" maxlength="15" class="input_20_table" v-model="transport.xhttpSettings.path" />
        <span class="hint-color"></span>
      </td>
    </tr>
    <tr>
      <th>The connection health check</th>
      <td>
        <input type="number" maxlength="4" class="input_6_table" v-model="transport.xhttpSettings.read_idle_timeout" onkeypress="return validator.isNumber(this,event);" />
        <span class="hint-color">default: unset</span>
      </td>
    </tr>
    <tr>
      <th>The timeout for the health check</th>
      <td>
        <input type="number" maxlength="4" class="input_6_table" v-model="transport.xhttpSettings.health_check_timeout" onkeypress="return validator.isNumber(this,event);" />
        <span class="hint-color">default: 15</span>
      </td>
    </tr>
    <headers-mapping :headersMap="transport.xhttpSettings.headers" @on:header:update="onheaderapupdate" />
  </tbody>
</template>

<script lang="ts">
  import { defineComponent, ref, watch } from 'vue';
  import { XrayStreamSettingsObject } from '@/modules/CommonObjects';
  import { XrayOptions } from '@/modules/Options';
  import HeadersMapping from './HeadersMapping.vue';

  export default defineComponent({
    name: 'Http',
    components: {
      HeadersMapping
    },
    props: {
      transport: XrayStreamSettingsObject
    },
    setup(props) {
      const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());
      const hosts = ref<string>(transport.value.xhttpSettings?.host?.join('\n') ?? '');
      const onheaderapupdate = (headers: any) => {
        if (transport.value.xhttpSettings) transport.value.xhttpSettings.headers = headers;
      };
      watch(
        () => hosts.value,
        (newObj) => {
          if (newObj && transport.value.xhttpSettings) {
            transport.value.xhttpSettings.host = newObj.split('\n').filter((x) => x);
          }
        },
        { immediate: true }
      );

      return { transport, methods: XrayOptions.httpMethods, hosts, onheaderapupdate };
    }
  });
</script>
