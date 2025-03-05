<template>
  <tbody v-if="transport.splithttpSettings">
    <tr>
      <th>The HTTP path</th>
      <td>
        <input type="text" maxlength="15" class="input_20_table" v-model="transport.splithttpSettings.path" />
        <span class="hint-color"></span>
      </td>
    </tr>
    <tr>
      <th>The Host header</th>
      <td>
        <input type="text" maxlength="15" class="input_20_table" v-model="transport.splithttpSettings.host" />
        <span class="hint-color"></span>
      </td>
    </tr>
    <headers-mapping :headersMap="transport.splithttpSettings.headers" @on:header:update="onheaderapupdate" />
    <tr>
      <th>The maximum size of upload chunks</th>
      <td>
        <input type="number" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);" v-model="transport.splithttpSettings.scMaxEachPostBytes" />
        <span class="hint-color">default: 1mb (in bytes)</span>
      </td>
    </tr>
    <tr>
      <th>The number of concurrent uploads to run</th>
      <td>
        <input type="number" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);" v-model="transport.splithttpSettings.scMaxConcurrentPosts" />
        <span class="hint-color">default: 100 for client, 200 for server</span>
      </td>
    </tr>
    <tr>
      <th>Time to pass between upload requests at a minimum</th>
      <td>
        <input type="number" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);" v-model="transport.splithttpSettings.scMinPostsIntervalMs" />
        <span class="hint-color">default: 30</span>
      </td>
    </tr>
    <tr>
      <th>The maximum number of streams reused in each connection</th>
      <td>
        <input type="number" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);" v-model="transport.splithttpSettings.xmux.maxConcurrency" />
        <span class="hint-color">default: 0 (infinite)</span>
      </td>
    </tr>
    <tr>
      <th>The maximum number of connections to open</th>
      <td>
        <input type="number" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);" v-model="transport.splithttpSettings.xmux.maxConnections" />
        <span class="hint-color">default: 0 (infinite)</span>
      </td>
    </tr>
    <tr>
      <th>A connection can be reused at most several times</th>
      <td>
        <input type="number" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);" v-model="transport.splithttpSettings.xmux.cMaxReuseTimes" />
        <span class="hint-color">default: 0 (infinite)</span>
      </td>
    </tr>
    <tr>
      <th>How long can a connection "survive" at most</th>
      <td>
        <input type="number" maxlength="4" class="input_6_table" onkeypress="return validator.isNumber(this,event);" v-model="transport.splithttpSettings.xmux.cMaxLifetimeMs" />
        <span class="hint-color">default: 0 (infinite)</span>
      </td>
    </tr>
  </tbody>
</template>

<script lang="ts">
  import { defineComponent, ref } from "vue";
  import { XrayStreamSettingsObject } from "../../modules/CommonObjects";

  import HeadersMapping from "./HeadersMapping.vue";
  export default defineComponent({
    name: "SplitHttp",
    components: {
      HeadersMapping
    },
    props: {
      transport: XrayStreamSettingsObject
    },
    setup(props) {
      const transport = ref<XrayStreamSettingsObject>(props.transport ?? new XrayStreamSettingsObject());
      const onheaderapupdate = (headers: any) => {
        if (transport.value.splithttpSettings) transport.value.splithttpSettings.headers = headers;
      };
      return { transport, onheaderapupdate };
    }
  });
</script>
