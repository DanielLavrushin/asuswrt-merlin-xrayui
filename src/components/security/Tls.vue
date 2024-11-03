<template>
  <tr>
    <th>Server Name</th>
    <td>
      <input type="text" maxlength="4" class="input_25_table" />
      <span class="hint-color"></span>
    </td>
  </tr>
  <tr>
    <th>Reject unkown SNI</th>
    <td>
      <input type="checkbox" class="input" />
      <span class="hint-color">default: false</span>
    </td>
  </tr>
  <tr>
    <th>Allow Insecure</th>
    <td>
      <input type="checkbox" class="input" />
      <span class="hint-color">default: false</span>
    </td>
  </tr>
  <tr>
    <th>ALPN</th>
    <td>
      <input type="checkbox" class="input" :value="true" :id="'metaon'" />
      <label class="settingvalue" :for="'metaon'">H2</label>
      <input type="checkbox" class="input" :value="false" :id="'metaoff'" />
      <label class="settingvalue" :for="'metaoff'">HTTP/1.1</label>
    </td>
  </tr>
</template>

<script lang="ts">
  import { defineComponent } from "vue";

  export default defineComponent({
    name: "Tls",
  });
</script>
<style scoped></style>
