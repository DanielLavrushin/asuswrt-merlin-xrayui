<template>
  <modal width="755" ref="modalList" :title="$t('components.RulesModal.modal_title')">
    <table class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="4">{{ $t("components.RulesModal.modal_title2") }}</td>
        </tr>
      </thead>
      <tbody v-if="allRules.length">
        <tr v-for="(r, index) in allRules.filter((r) => !r.isSystem())" :key="index">
          <th>
            <label>
              <input type="checkbox" v-model="r.enabled" @change.prevent="on_off_rule(r, index)" />
              {{ $t("components.RulesModal.rule_no", [index + 1]) }}
            </label>
          </th>
          <td style="color: #ffcc00">{{ !r.name || r.name == "" ? getRuleName(r) : r.name }}</td>
          <td>{{ r.outboundTag }}</td>
          <td>
            <text v-show="r.isSystem()">system rule</text>
            <span class="row-buttons">
              <input class="button_gen button_gen_small" type="button" value="&#8593;" :title="$t('labels.redorder')" @click="reorderRule(r)" v-if="index > 0" />
              <input class="button_gen button_gen_small" type="button" :value="$t('labels.edit')" @click.prevent="editRule(r)" />
              <input class="button_gen button_gen_small" type="button" value="&#10005;" :title="$t('labels.delete')" @click.prevent="deleteRule(r)" />
            </span>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td colspan="4" style="color: #ffcc00">{{ $t("components.RulesModal.no_rules_defined") }}</td>
        </tr>
      </tbody>
    </table>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" :value="$t('components.RulesModal.add_new_rule')" @click.prevent="addRule" />
    </template>
  </modal>
  <modal width="755" ref="modalAdd" title="Rule">
    <table class="FormTable modal-form-table">
      <tbody>
        <tr>
          <th>
            {{ $t("components.RulesModal.label_friendly_name") }}
            <hint v-html="$t('components.RulesModal.hint_friendly_name')"></hint>
          </th>
          <td>
            <input v-model="currentRule.name" type="text" class="input_25_table" :readonly="currentRule.isSystem()" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t("components.RulesModal.label_outbound_tag") }}
            <hint v-html="$t('components.RulesModal.hint_outbound_tag')"></hint>
          </th>
          <td>
            <select class="input_option" v-model="currentRule.outboundTag">
              <option v-for="opt in outbounds" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t("components.RulesModal.label_inbound_tags") }}
            <hint v-html="$t('components.RulesModal.hint_inbound_tags')"></hint>
          </th>
          <td>
            <div v-for="(opt, index) in inbounds" :key="index">
              <label :for="'inbound-' + index" class="settingvalue">
                <input v-model="currentRule.inboundTag" type="checkbox" class="input" :value="opt" :id="'inbound-' + index" />
                {{ opt.toUpperCase() }}
              </label>
            </div>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t("components.RulesModal.label_users") }}
            <hint v-html="$t('components.RulesModal.hint_users')"></hint>
          </th>
          <td class="flex-checkbox">
            <div v-for="(opt, index) in users" :key="index">
              <label :for="'user-' + index" class="settingvalueclass">
                <input v-model="currentRule.user" type="checkbox" class="input" :value="opt" :id="'inbound-' + index" />
                {{ opt }}
              </label>
            </div>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t("components.RulesModal.label_domain_matcher") }}
            <hint v-html="$t('components.RulesModal.hint_domain_matcher')"></hint>
          </th>
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
          <th>
            {{ $t("components.RulesModal.label_network") }}
            <hint v-html="$t('components.RulesModal.hint_network')"></hint>
          </th>
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
          <th>
            {{ $t("components.RulesModal.label_protocols") }}
            <hint v-html="$t('components.RulesModal.hint_protocols')"></hint>
          </th>
          <td>
            <div v-for="(opt, index) in protocolOptions" :key="index">
              <input type="checkbox" v-model="currentRule.protocol" class="input" :value="opt" :id="'protoopt-' + index" />
              <label :for="'protoopt-' + index" class="settingvalue">
                {{ opt }}
              </label>
            </div>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t("components.RulesModal.label_domains") }}
            <hint v-html="$t('components.RulesModal.hint_domains')"></hint>
          </th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="domains" rows="10"></textarea>
            </div>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t("components.RulesModal.label_target_ips") }}
            <hint v-html="$t('components.RulesModal.hint_target_ips')"></hint>
          </th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="ips" rows="10"></textarea>
            </div>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t("components.RulesModal.label_target_ports") }}
            <hint v-html="$t('components.RulesModal.hint_target_ports')"></hint>
          </th>
          <td>
            <input v-model="currentRule.port" type="text" class="input_25_table" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t("components.RulesModal.label_source_ips") }}
            <hint v-html="$t('components.RulesModal.hint_source_ips')"></hint>
          </th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="source" rows="3"></textarea>
            </div>
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t("components.RulesModal.label_source_ports") }}
            <hint v-html="$t('components.RulesModal.hint_source_ports')"></hint>
          </th>
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
      <input class="button_gen button_gen_small" type="button" :value="$t('labels.save')" @click.prevent="saveRule" />
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, watch } from "vue";
  import Modal from "../Modal.vue";
  import xrayConfig from "../../modules/XrayConfig";
  import { XrayRoutingRuleObject, XrayRoutingObject } from "../../modules/CommonObjects";
  import Hint from "../Hint.vue";

  import { useI18n } from "vue-i18n";

  export default defineComponent({
    name: "RulesModal",
    components: {
      Hint,
      Modal
    },
    props: {
      rules: {
        type: Array as () => XrayRoutingRuleObject[],
        default: () => []
      },
      disabled_rules: {
        type: Array as () => XrayRoutingRuleObject[],
        default: () => []
      }
    },
    setup(props, { emit }) {
      const { t } = useI18n();
      const rules = ref<XrayRoutingRuleObject[]>([...props.rules.filter((r) => !r.isSystem())]);
      const disabledRules = ref<XrayRoutingRuleObject[]>([...props.disabled_rules]);

      const allRules = computed(() => {
        return [...rules.value, ...disabledRules.value].sort((a, b) => (a.idx || 0) - (b.idx || 0));
      });

      const currentRule = ref<XrayRoutingRuleObject>(new XrayRoutingRuleObject());
      const modalList = ref<InstanceType<typeof Modal> | null>(null);
      const modalAdd = ref<InstanceType<typeof Modal> | null>(null);

      const ips = ref<string>("");
      const domains = ref<string>("");
      const source = ref<string>("");

      const outbounds = ref<string[]>([]);
      const inbounds = ref<string[]>([]);
      const users = ref<string[]>([]);

      // Methods
      const deleteRule = (rule: XrayRoutingRuleObject) => {
        const arr = rule.enabled ? rules : disabledRules;
        const index = arr.value.indexOf(rule);

        if (!confirm(t("components.RulesModal.alert_delete_rule_confirm"))) return;

        arr.value.splice(index, 1);
        emit("update:rules", rules.value);
        emit("update:disabled_rules", disabledRules.value);
      };

      const addRule = () => {
        currentRule.value = new XrayRoutingRuleObject();
        domains.value = "";
        ips.value = "";
        source.value = "";
        currentRule.value.inboundTag = [];
        currentRule.value.protocol = [];
        currentRule.value.user = [];
        modalAdd.value?.show(() => {});
      };

      const editRule = (rule: XrayRoutingRuleObject) => {
        currentRule.value = rule;
        domains.value = rule.domain ? rule.domain.join("\n") : "";
        ips.value = rule.ip ? rule.ip.join("\n") : "";
        source.value = rule.source ? rule.source.join("\n") : "";
        modalAdd.value?.show(() => {});
      };

      const saveRule = () => {
        const newRule = new XrayRoutingRuleObject();
        newRule.enabled = currentRule.value.enabled;
        newRule.idx = currentRule.value.idx;
        newRule.name = currentRule.value.name;
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

        const rulesArr = newRule.enabled ? rules : disabledRules;
        const indexOfRule = rulesArr.value.indexOf(currentRule.value);
        if (indexOfRule >= 0) {
          rulesArr.value[indexOfRule] = newRule;
        } else {
          rulesArr.value.push(newRule);
        }

        reindexRules();

        emit("update:rules", rules.value);
        emit("update:disabled_rules", disabledRules.value);
        modalAdd.value?.close();
      };

      const getRuleName = (rule: XrayRoutingRuleObject): string => {
        const summarize = (arr?: string[]): string => {
          if (!arr || arr.length === 0) return "n/a";
          return arr.length > 3 ? arr.slice(0, 3).join(", ") + " …" : arr.join(", ");
        };

        const outbound = rule.outboundTag || "n/a";
        const domains = summarize(rule.domain);
        const ips = summarize(rule.ip);

        return `to ${outbound} | dmns: ${domains} | ips: ${ips}`;
      };

      const reorderRule = (rule: XrayRoutingRuleObject) => {
        let index = allRules.value.indexOf(rule);
        allRules.value.splice(index, 1);
        allRules.value.splice(index - 1, 0, rule);
        reindexRules();
        emit("update:rules", rules.value);
        emit("update:disabled_rules", disabledRules.value);
      };
      const show = (onCloseAction: (rules: XrayRoutingRuleObject[], disabledRules: XrayRoutingRuleObject[]) => void) => {
        currentRule.value = new XrayRoutingRuleObject();
        inbounds.value = xrayConfig.inbounds
          .filter((o) => !o.isSystem())
          .map((o) => o.tag)
          .filter((tag): tag is string => tag !== undefined);

        outbounds.value = xrayConfig.outbounds
          .filter((o) => !o.isSystem())
          .map((o) => o.tag)
          .filter((tag): tag is string => tag !== undefined);

        domains.value = currentRule.value.domain ? currentRule.value.domain.join("\n") : "";
        ips.value = currentRule.value.ip ? currentRule.value.ip.join("\n") : "";
        source.value = currentRule.value.source ? currentRule.value.source.join("\n") : "";
        users.value = [];

        xrayConfig.inbounds.forEach((proxy) => {
          const userNames = proxy?.settings?.getUserNames?.() ?? [];
          users.value = users.value.concat(userNames);
        });
        xrayConfig.outbounds.forEach((proxy) => {
          const userNames = proxy?.settings?.getUserNames?.() ?? [];
          users.value = users.value.concat(userNames);
        });
        users.value = [...new Set(users.value)];
        disabledRules.value = [...props.disabled_rules];
        rules.value = [...props.rules];

        disabledRules.value.forEach((r, idx) => {
          r.enabled = false;
        });

        modalList.value?.show(() => {
          reindexRules();
          onCloseAction(rules.value, disabledRules.value);
        });
      };

      const on_off_rule = (rule: XrayRoutingRuleObject, index: number) => {
        const stillEnabled: XrayRoutingRuleObject[] = [];
        const nowDisabled: XrayRoutingRuleObject[] = [];
        for (const r of allRules.value) {
          if (r.enabled) stillEnabled.push(r);
          else nowDisabled.push(r);
        }
        rules.value = stillEnabled;
        disabledRules.value = nowDisabled;

        reindexRules();
        emit("update:rules", rules.value);
        emit("update:disabled_rules", disabledRules.value);
      };

      const reindexRules = () => {
        allRules.value.forEach((r, idx) => {
          r.idx = idx;
        });
        rules.value = rules.value.sort((a, b) => (a.idx || 0) - (b.idx || 0));
        disabledRules.value = disabledRules.value.sort((a, b) => (a.idx || 0) - (b.idx || 0));
      };
      // Expose to template
      return {
        rules,
        allRules,
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
        on_off_rule,
        domainMatcherOptions: XrayRoutingObject.domainMatcherOptions,
        networkOptions: XrayRoutingRuleObject.networkOptions,
        protocolOptions: XrayRoutingRuleObject.protocolOptions
      };
    }
  });
</script>

<style scoped>
  .FormTable tr th {
    width: auto;
  }

  .FormTable tr:hover th {
    text-shadow: 2px 2px 25px #fc0;
  }

  .FormTable tr:hover > * {
    border-left-color: #fc0;
  }

  .FormTable tr:hover > :last-child {
    border-right-color: #fc0;
  }

  .FormTable tbody tr.rule-system td text {
    float: left;
    padding-left: 5px;
  }

  .FormTable tbody tr.rule-system td {
    color: rgb(255, 0, 255);
  }
</style>
