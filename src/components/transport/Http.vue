<template>
  <tbody v-if="transport.xhttpSettings">
    <tr>
      <th>CDN Host / Virtual Host</th>
      <td>
        <input type="text" class="input_20_table" v-model="transport.xhttpSettings.host" />
      </td>
    </tr>
    <tr>
      <th>Transfer Mode</th>
      <td>
        <select class="input_option" v-model="transport.xhttpSettings.mode">
          <option v-for="opt in modes" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </select>
        <span class="hint-color">default: auto</span>
      </td>
    </tr>
    <tr>
      <th>Request Path</th>
      <td>
        <input type="text" class="input_20_table" v-model="transport.xhttpSettings.path" />
      </td>
    </tr>
    <tr>
      <th>Header-padding bytes (range)</th>
      <td>
        <input type="text" placeholder="100-1000" class="input_20_table" v-model="extra.xPaddingBytes" />
      </td>
    </tr>

    <tr>
      <th>Disable gRPC disguise</th>
      <td><input type="checkbox" v-model="extra.noGRPCHeader" /></td>
    </tr>

    <tr>
      <th>Disable SSE disguise</th>
      <td><input type="checkbox" v-model="extra.noSSEHeader" /></td>
    </tr>

    <tr>
      <th>Max POST size (bytes)</th>
      <td>
        <input type="number" min="1" class="input_20_table" v-model.number="extra.scMaxEachPostBytes" />
      </td>
    </tr>

    <tr>
      <th>Min interval between POSTs (ms)</th>
      <td>
        <input type="number" min="0" class="input_20_table" v-model.number="extra.scMinPostsIntervalMs" />
      </td>
    </tr>

    <tr>
      <th>Max buffered POSTs (server)</th>
      <td>
        <input type="number" min="1" class="input_20_table" v-model.number="extra.scMaxBufferedPosts" />
      </td>
    </tr>

    <tr>
      <th>Keep-alive interval for stream-up (s)</th>
      <td>
        <input type="text" placeholder="20-80" class="input_20_table" v-model="extra.scStreamUpServerSecs" />
      </td>
    </tr>
    <tr>
      <th>XMUX · Max concurrent streams</th>
      <td>
        <input type="text" placeholder="16-32" class="input_20_table" v-model="xmux.maxConcurrency" />
      </td>
    </tr>

    <tr>
      <th>XMUX · Max base connections</th>
      <td>
        <input type="number" min="0" class="input_20_table" v-model.number="xmux.maxConnections" />
      </td>
    </tr>

    <tr>
      <th>XMUX · Max reuses per connection</th>
      <td>
        <input type="number" min="0" class="input_20_table" v-model.number="xmux.cMaxReuseTimes" />
      </td>
    </tr>

    <tr>
      <th>XMUX · Max HTTP requests per connection</th>
      <td>
        <input type="text" placeholder="600-900" class="input_20_table" v-model="xmux.hMaxRequestTimes" />
      </td>
    </tr>

    <tr>
      <th>XMUX · Max connection age (s)</th>
      <td>
        <input type="text" placeholder="1800-3000" class="input_20_table" v-model="xmux.hMaxReusableSecs" />
      </td>
    </tr>

    <tr>
      <th>XMUX · Keep-alive period (s)</th>
      <td>
        <input type="number" min="-1" class="input_20_table" v-model.number="xmux.hKeepAlivePeriod" />
      </td>
    </tr>
  </tbody>
</template>
<script lang="ts">
  import { computed, defineComponent, ref, watch } from 'vue';
  import { XrayStreamSettingsObject, XrayXmuxObject } from '@/modules/CommonObjects';
  import { XrayOptions } from '@/modules/Options';
  import HeadersMapping from './HeadersMapping.vue';
  import { XrayStreamHttpSettingsObject, XrayXhttpExtraObject } from '@/modules/TransportObjects';

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
      const extra = computed(() => transport.value.xhttpSettings!.extra ?? (transport.value.xhttpSettings!.extra = new XrayXhttpExtraObject()));
      const xmux = computed(() => extra.value.xmux ?? (extra.value.xmux = new XrayXmuxObject()));

      return {
        transport,
        modes: XrayStreamHttpSettingsObject.modes,
        methods: XrayOptions.httpMethods,
        extra,
        xmux
      };
    }
  });
</script>
