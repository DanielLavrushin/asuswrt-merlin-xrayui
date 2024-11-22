<template>
  <modal width="755" ref="modalList" title="Manage TLS Certificate">
    <table class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="3">Rule</td>
        </tr>
      </thead>
      <tbody v-if="rules.length">
        <tr v-for="(r, index) in rules">
          <td>rule #{{ index }}</td>
          <td>
          </td>
          <td>
            <span class="row-buttons">
              <input class="button_gen button_gen_small" type="button" value="Edit" @click.prevent="edit_rule(index)" />
              <input class="button_gen button_gen_small" type="button" value="Delete"
                @click.prevent="delete_rule(index)" />
            </span>
          </td>
        </tr>
      </tbody>
      <tbody v-if="!rules.length">
        <tr>
          <td colspan="3" style="color: #ffcc00">no rules defined</td>
        </tr>
      </tbody>
    </table>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" value="Add" @click.prevent="add_rule" />
    </template>
  </modal>
  <modal width="755" ref="modalAdd" title="Rule">
    <table class="FormTable modal-form-table">
      <tbody>
        <tr>
          <th>Outbound Connection</th>
          <td>
            <select class="input_option" v-model="rule.outboundTag">
              <option></option>
              <option v-for="opt in outbounds" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>Inbound Connection</th>
          <td>
            <template v-for="(opt, index) in inbounds" :key="index">
              <input v-model="rule.inboundTag" type="checkbox" class="input" :value="opt" :id="'inbound-' + index" />
              <label :for="'inbound-' + index" class="settingvalue">{{ opt.toUpperCase() }}</label>
            </template>
          </td>
        </tr>
        <tr>
          <th>Domain Matcher</th>
          <td>
            <select class="input_option" v-model="rule.domainMatcher">
              <option v-for="opt in domainMatcherOptions" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
            <span class="hint-color">default: hybrid</span>
          </td>
        </tr>
        <tr>
          <th>Network</th>
          <td>
            <select class="input_option" v-model="rule.network">
              <option v-for="opt in networkOptions" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>Protocols</th>
          <td>
            <slot v-for="(opt, index) in protocolOptions" :key="index">
              <input type="checkbox" v-model="rule.protocol" class="input" :value="opt" :id="'protoopt-' + index" />
              <label :for="'protoopt-' + index" class="settingvalue">{{ opt }}</label>
            </slot>
          </td>
        </tr>
        <tr>
          <th>Domains</th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="domains" rows="10"></textarea>
            </div>
          </td>
        </tr>
        <tr>
          <th>Target Ip List</th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="ips" rows="10"></textarea>
            </div>
          </td>
        </tr>
        <tr>
          <th>Target Port</th>
          <td>
            <input v-model="rule.port" type="text" class="input_25_table" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>Source Ip List</th>
          <td>
            <input v-model="rule.source" type="text" class="input_25_table" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>Source Port</th>
          <td>
            <input v-model="rule.sourcePort" type="text" class="input_25_table" />
            <span class="hint-color"></span>
          </td>
        </tr>

        <tr>
          <th>Users</th>
          <td>
            <slot v-for="(opt, index) in users" :key="index">
              <input type="checkbox" v-model="rule.user" class="input" :value="opt" :id="'useropt-' + index" />
              <label :for="'useropt-' + index" class="settingvalue">{{ opt }}</label>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" value="Save" @click.prevent="save_rule" />
    </template>
  </modal>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import Modal from "../Modal.vue";
import xrayConfig from "../../modules/XrayConfig";
import { XrayRoutingRuleObject, XrayRoutingObject } from "../../modules/CommonObjects";

export default defineComponent({
  name: "RulesModal",
  props: {
    rules: Array as () => XrayRoutingRuleObject[],
  },

  components: {
    Modal,
  },
  methods: {
    delete_rule(index: number) {
      this.rules.splice(index, 1);
    },
    save_rule() {
      this.modalAdd.close();

      this.rule.domain = this.domains?.split('\n').filter((x) => x.length > 0);
      this.rule.ip = this.ips?.split('\n').filter((x) => x.length > 0);

      if (this.rules.indexOf(this.rule) === -1) {
        this.rules.push(this.rule);
      }
    },
    edit_rule(index: number) {
      this.rule = this.rules[index];
      this.add_rule();
    },
    add_rule() {
      this.rule = this.rule ?? new XrayRoutingRuleObject();
      this.domains = this.rule.domain?.join('\n');
      this.ips = this.rule.ip?.join('\n');
      this.source = this.rule.source?.join('\n');
      const users = new Array<any>();   // xrayConfig.inbounds[0]?.settings?.clients.map((c) => c.email!) ?? [];

      this.modalAdd.show();

    },
    show() {
      this.modalList.show();
      this.rules = this.$props.rules ?? new Array<XrayRoutingRuleObject>();
    },

  },
  setup(props) {
    const rules = ref(props.rules ?? new Array<XrayRoutingRuleObject>());
    const rule = ref<XrayRoutingRuleObject>(new XrayRoutingRuleObject());
    rule.value.outboundTag = "block";
    const modalList = ref();
    const modalAdd = ref();

    const ips = ref<string | undefined>(rule.value.ip?.join('\n') ?? '');
    const domains = ref<string | undefined>(rule.value.domain?.join('\n') ?? '');
    const source = ref<string | undefined>(rule.value.source?.join('\n') ?? '');

    const outbounds = ref();
    const inbounds = ref();


    watch(() => xrayConfig.inbounds.length, () => {
      inbounds.value = xrayConfig.inbounds.map((o) => o.tag);
    });
    watch(() => xrayConfig.inbounds.length, () => {
      outbounds.value = xrayConfig.outbounds.map((o) => o.tag);
    });


    const users = new Array<any>();   // xrayConfig.inbounds[0]?.settings?.clients.map((c) => c.email!) ?? [];

    return {
      domainMatcherOptions: XrayRoutingObject.domainMatcherOptions,
      networkOptions: XrayRoutingRuleObject.networkOptions,
      protocolOptions: XrayRoutingRuleObject.protocolOptions,
      domains, ips, rule, rules, source,
      modalList,
      modalAdd,
      xrayConfig,
      outbounds,
      inbounds,
      users,
    };
  },
});
</script>