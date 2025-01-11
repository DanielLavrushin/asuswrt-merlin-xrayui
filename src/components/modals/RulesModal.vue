<template>
  <modal width="755" ref="modalList" title="Routing Rules">
    <table class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="3">Available rules</td>
        </tr>
      </thead>
      <tbody v-if="rules.length">
        <tr v-for="(r, index) in rules" :key="index">
          <td>rule #{{ index + 1 }}</td>
          <td style="color: #ffcc00">{{ getRuleName(r) }}</td>
          <td>
            <span class="row-buttons">
              <input class="button_gen button_gen_small" type="button" value="&#8593;" @click="reorderRule(r, index)"
                v-if="index > 0" />
              <input class="button_gen button_gen_small" type="button" value="Edit" @click.prevent="editRule(index)" />
              <input class="button_gen button_gen_small" type="button" value="&#10005;"
                @click.prevent="deleteRule(index)" />
            </span>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td colspan="3" style="color: #ffcc00">no rules defined</td>
        </tr>
      </tbody>
    </table>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" value="Add" @click.prevent="addRule" />
    </template>
  </modal>
  <modal width="755" ref="modalAdd" title="Rule">
    <table class="FormTable modal-form-table">
      <tbody>
        <tr>
          <th>Outbound Connection</th>
          <td>
            <select class="input_option" v-model="currentRule.outboundTag">
              <option value="" disabled>Select Outbound</option>
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
            <div v-for="(opt, index) in inbounds" :key="index">
              <input v-model="currentRule.inboundTag" type="checkbox" class="input" :value="opt"
                :id="'inbound-' + index" />
              <label :for="'inbound-' + index" class="settingvalue">
                {{ opt.toUpperCase() }}
              </label>
            </div>
          </td>
        </tr>
        <tr>
          <th>Domain Matcher</th>
          <td>
            <select class="input_option" v-model="currentRule.domainMatcher">
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
            <select class="input_option" v-model="currentRule.network">
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
            <div v-for="(opt, index) in protocolOptions" :key="index">
              <input type="checkbox" v-model="currentRule.protocol" class="input" :value="opt"
                :id="'protoopt-' + index" />
              <label :for="'protoopt-' + index" class="settingvalue">
                {{ opt }}
              </label>
            </div>
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
          <th>Target IP List</th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="ips" rows="10"></textarea>
            </div>
          </td>
        </tr>
        <tr>
          <th>Target Port</th>
          <td>
            <input v-model="currentRule.port" type="text" class="input_25_table" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>Source IP List</th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="source" rows="3"></textarea>
            </div>
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>Source Port</th>
          <td>
            <input v-model="currentRule.sourcePort" type="text" class="input_25_table" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <!-- <tr>
          <th>Users</th>
          <td>
            <div v-for="(opt, index) in users" :key="index">
              <input type="checkbox" v-model="currentRule.user" class="input" :value="opt" :id="'useropt-' + index" />
              <label :for="'useropt-' + index" class="settingvalue">
                {{ opt }}
              </label>
            </div>
          </td>
        </tr>
        -->
      </tbody>
    </table>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" value="Save" @click.prevent="saveRule" />
    </template>
  </modal>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from "vue";
import Modal from "../Modal.vue";
import xrayConfig from "../../modules/XrayConfig";
import { XrayRoutingRuleObject, XrayRoutingObject } from "../../modules/CommonObjects";

export default defineComponent({
  name: "RulesModal",
  components: {
    Modal
  },
  props: {
    rules: {
      type: Array as () => XrayRoutingRuleObject[],
      default: () => []
    }
  },
  setup(props, { emit }) {
    // Reactive state
    const rules = ref<XrayRoutingRuleObject[]>([...props.rules]);

    const currentRule = ref<XrayRoutingRuleObject>(new XrayRoutingRuleObject());
    const currentIndex = ref<number>(-1);
    const modalList = ref<InstanceType<typeof Modal> | null>(null);
    const modalAdd = ref<InstanceType<typeof Modal> | null>(null);

    const ips = ref<string>("");
    const domains = ref<string>("");
    const source = ref<string>("");

    const outbounds = ref<string[]>([]);
    const inbounds = ref<string[]>([]);
    const users = ref<string[]>([]);

    watch(
      () => xrayConfig.inbounds.length,
      () => {
        if (xrayConfig.inbounds?.length > 0) {
          inbounds.value = xrayConfig.inbounds.map((o) => o.tag).filter((tag): tag is string => tag !== undefined);
          if (xrayConfig.dns?.tag?.length) {
            inbounds.value.push(xrayConfig.dns.tag);
          }
        }
      },
      { immediate: true }
    );

    watch(
      () => xrayConfig.outbounds.length,
      () => {
        outbounds.value = xrayConfig.outbounds.map((o) => o.tag).filter((tag): tag is string => tag !== undefined);


      },
      { immediate: true }
    );

    watch(
      () => xrayConfig.inbounds,
      (newInbounds) => {
        if (newInbounds.length > 0) {
          //  users.value =  newInbounds[0]?.settings?.clients?.map((c: { email: string }) => c.email) ?? [];
        }
      },
      { immediate: true }
    );

    watch(currentRule, (newRule) => {
      domains.value = newRule.domain ? newRule.domain.join("\n") : "";
      ips.value = newRule.ip ? newRule.ip.join("\n") : "";
      source.value = newRule.source ? newRule.source.join("\n") : "";
    });

    // Methods
    const deleteRule = (index: number) => {
      rules.value.splice(index, 1);
      emit("update:rules", rules.value);
    };

    const addRule = () => {
      currentIndex.value = -1;
      currentRule.value = new XrayRoutingRuleObject();
      domains.value = "";
      ips.value = "";
      source.value = "";
      currentRule.value.inboundTag = [];
      currentRule.value.protocol = [];
      currentRule.value.user = [];
      modalAdd.value?.show(() => { });
    };

    const editRule = (index: number) => {
      currentIndex.value = index;
      const ruleToEdit = { ...rules.value[index] };
      ruleToEdit.inboundTag = [...(ruleToEdit.inboundTag || [])];
      ruleToEdit.protocol = [...(ruleToEdit.protocol || [])];
      ruleToEdit.user = [...(ruleToEdit.user || [])];
      currentRule.value = ruleToEdit;
      domains.value = ruleToEdit.domain ? ruleToEdit.domain.join("\n") : "";
      ips.value = ruleToEdit.ip ? ruleToEdit.ip.join("\n") : "";
      source.value = ruleToEdit.source ? ruleToEdit.source.join("\n") : "";
      modalAdd.value?.show(() => { });
    };

    const saveRule = () => {
      const newRule = new XrayRoutingRuleObject();
      newRule.outboundTag = currentRule.value.outboundTag;
      newRule.inboundTag = [...(currentRule.value.inboundTag || [])];
      newRule.domainMatcher = currentRule.value.domainMatcher;
      newRule.network = currentRule.value.network;
      newRule.protocol = [...(currentRule.value.protocol || [])];
      newRule.user = [...(currentRule.value.user || [])];
      newRule.domain = domains.value
        ? domains.value
          .split("\n")
          .map((d) => d.trim())
          .filter((d) => d)
        : [];
      newRule.ip = ips.value
        ? ips.value
          .split("\n")
          .map((ip) => ip.trim())
          .filter((ip) => ip)
        : [];
      newRule.source = source.value
        ? source.value
          .split("\n")
          .map((s) => s.trim())
          .filter((s) => s)
        : [];
      newRule.sourcePort = currentRule.value.sourcePort;
      newRule.port = currentRule.value.port;

      if (currentIndex.value > -1) {
        rules.value[currentIndex.value] = newRule;
      } else {
        rules.value.push(newRule);
      }

      modalAdd.value?.close();
      emit("update:rules", rules.value);
    };

    const getRuleName = (rule: XrayRoutingRuleObject): string => {
      const outbound = rule.outboundTag || "No Outbound";
      const inbound = rule.inboundTag && rule.inboundTag.length > 0 ? `Inbound: ${rule.inboundTag.join(", ")}` : "No Inbound";
      const domains = rule.domain && rule.domain.length > 0 ? `Domains: ${rule.domain.slice(0, 2).join(", ")}${rule.domain.length > 2 ? "..." : ""}` : "No Domains";
      const ip = rule.ip && rule.ip.length > 0 ? `IPs: ${rule.ip.slice(0, 2).join(", ")}${rule.ip.length > 2 ? "..." : ""}` : "No IPs";

      return `${outbound} : ${inbound} | ${domains} | ${ip}`;
    };

    const reorderRule = (rule: XrayRoutingRuleObject, index: number) => {
      rules.value.splice(index, 1);
      rules.value.splice(index - 1, 0, rule);
      emit("update:rules", rules.value);
    };
    const show = () => {
      rules.value = [...props.rules];
      modalList.value?.show(() => { });
    };

    // Expose to template
    return {
      rules,
      currentRule,
      modalList,
      modalAdd,
      ips,
      domains,
      source,
      outbounds,
      inbounds,
      users,
      deleteRule,
      addRule,
      editRule,
      saveRule,
      show,
      reorderRule,
      getRuleName,
      domainMatcherOptions: XrayRoutingObject.domainMatcherOptions,
      networkOptions: XrayRoutingRuleObject.networkOptions,
      protocolOptions: XrayRoutingRuleObject.protocolOptions
    };
  }
});
</script>

<style scoped></style>
