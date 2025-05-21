<template>
  <div class="simple-mode">
    <h2>Simple XRAYUI Mode</h2>
    <div class="form-row">
      <label for="simple-port">Listening Port</label>
      <input class="input_32_table" type="number" v-model.number="port" min="1" max="5" required />
    </div>
    <div class="form-row">
      <label for="simple-port">Enable Transparent Proxy</label>
      <input type="checkbox" v-model="tproxy" />
    </div>
    <rule-group title="To Proxy" v-model:domains="rules.proxy.domains" v-model:ips="rules.proxy.ips" />
    <rule-group title="To Direct" v-model:domains="rules.direct.domains" v-model:ips="rules.direct.ips" />
    <rule-group title="To Block" v-model:domains="rules.block.domains" v-model:ips="rules.block.ips" />
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue';

  const RuleGroup = defineComponent({
    name: 'RuleGroup',
    props: {
      title: { type: String, required: true },
      domains: { type: String, default: '' },
      ips: { type: String, default: '' }
    },
    emits: ['update:domains', 'update:ips'],
    setup(props, { emit }) {
      const update = (key: 'domains' | 'ips', value: string) => emit(`update:${key}`, value);
      return { update };
    },
    template: `
    <fieldset class="rule-group">
      <legend>{{ title }}</legend>
      <div class="double-textarea">
        <textarea
          :placeholder="\`\${title} – Domains (one per line)\`"
          rows="12"
          :value="domains"
          @input="update('domains', $event.target.value)"
        ></textarea>
        <textarea
          :placeholder="\`\${title} – IPs (one per line)\`"
          rows="12"
          :value="ips"
          @input="update('ips', $event.target.value)"
        ></textarea>
      </div>
    </fieldset>
  `
  });

  export default defineComponent({
    name: 'SimpleMode',

    components: { RuleGroup },
    setup() {
      return {};
    }
  });
</script>
<style scoped>
  .simple-mode {
    background-color: #475a5f;

    padding: 8px;
    border-radius: 5px;
    border: 1px solid #222;

    .form-row {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    .form-row label {
      flex: 0 0 200px;
    }

    .hint {
      font-size: 0.8rem;
      color: #cbd5e1;
    }
    textarea {
      width: 100%;
    }
  }
</style>
