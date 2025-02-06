<template>
  <modal width="755" ref="modalList" title="Routing Rules">
    <table class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="4">Available rules</td>
        </tr>
      </thead>
      <tbody v-if="rules.length">
        <tr v-for="(r, index) in rules.filter((r) => !r.isSystem())" :key="index">
          <td>rule #{{ index + 1 }}</td>
          <td style="color: #ffcc00">{{ !r.name || r.name == "" ? getRuleName(r) : r.name }}</td>
          <td>{{ r.outboundTag }}</td>
          <td>
            <text v-show="r.isSystem()">system rule</text>
            <span class="row-buttons">
              <input class="button_gen button_gen_small" type="button" value="&#8593;" @click="reorderRule(r)" v-if="index > 0" />
              <input class="button_gen button_gen_small" type="button" value="Edit" @click.prevent="editRule(r)" />
              <input class="button_gen button_gen_small" type="button" value="&#10005;" @click.prevent="deleteRule(r)" />
            </span>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td colspan="4" style="color: #ffcc00">no rules defined</td>
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
          <th>
            Friendly name
            <hint> A friendly name for the rule. </hint>
          </th>
          <td>
            <input v-model="currentRule.name" type="text" class="input_25_table" :readonly="currentRule.isSystem()" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            Outbound Connection
            <hint> The tag of the outbound proxy. This rule will take effect when the outbound connection matches the tag. </hint>
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
            Inbound Connection
            <hint> An array where each item represents an inbound proxy tag. This rule will take effect when the inbound connection matches any of the tags in the array. </hint>
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
            Apply to users
            <hint> Apply this rule to specific users. This rule will take effect when the source user matches any of the email. </hint>
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
            Domain Matcher
            <hint>
              The domain name matching algorithm, which uses different algorithms based on different settings. This option affects all RuleObject that do not have a separately specified matching algorithm.
              <ul>
                <li>**hybrid**: Use the new domain name matching algorithm, which is faster and takes up less space. Default value.</li>
                <li>**linear**: Use the original domain name matching algorithm.</li>
              </ul>
            </hint>
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
            Network
            <hint> This can be **tcp**, **udp**, or **tcp,udp**. This rule will take effect when the connection method is the specified one. </hint>
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
            Protocols
            <hint>
              An array where each item represents a protocol. This rule will take effect when the protocol of the current connection matches any of the protocols in the array.
              <blockquote>The `sniffing` option in the inbound proxy must be enabled to detect the protocol type used by the connection.</blockquote>
            </hint>
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
            Domains
            <hint>
              An array where each item is a domain match.
              <ul>
                <li>Plain string: If this string matches any part of the target domain, the rule takes effect.</li>
                <li>Regular expression: Starts with **regexp:** followed by a regular expression.</li>
                <li>Subdomain (recommended): Starts with **domain:** followed by a domain. When this domain is the target domain or a subdomain of the target domain, the rule takes effect. For example, "domain:xray.com" matches "www.xray.com" and "xray.com", but not "wxray.com".</li>
                <li>Exact match: Starts with **full:** followed by a domain. When this domain is an exact match for the target domain, the rule takes effect. For example, "full:xray.com" matches "xray.com" but not "www.xray.com".</li>
                <li>Predefined domain list: Starts with **geosite:** followed by a name such as `geosite:google` or `geosite:youtube`. Ensure to get latest geodata (press `update metadata` in the `routing` section).</li>
                <li>Load domains from a file: Formatted as **ext:file:tag**, where the file is stored in the resource directory and has the same format as geosite.dat. The tag must exist in the file.</li>
              </ul>
            </hint>
          </th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="domains" rows="10"></textarea>
            </div>
          </td>
        </tr>
        <tr>
          <th>
            Target IP List
            <hint> An array where each item represents an IP range. This rule will take effect when the target IP matches any of the IP ranges in the array. </hint>
          </th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="ips" rows="10"></textarea>
            </div>
          </td>
        </tr>
        <tr>
          <th>
            Target Port
            <hint>
              The target port range, which can take on three forms:
              <ul>
                <li>`a-b`: a and b are both positive integers less than `65536`. This range is a closed interval, and this rule will take effect when the target port falls within this range.</li>
                <li>`a`: a is a positive integer less than `65536`. This rule will take effect when the target port is a.</li>
                <li>A mixture of the above two forms, separated by commas ",". For example: `53,443,1000-2000`.</li>
              </ul>
            </hint>
          </th>
          <td>
            <input v-model="currentRule.port" type="text" class="input_25_table" />
            <span class="hint-color"></span>
          </td>
        </tr>
        <tr>
          <th>
            Source IP List
            <hint> An array where each item represents an IP range in the format of IP, CIDR, GeoIP, or loading IP from a file. This rule will take effect when the source IP matches any of the IP ranges in the array. </hint>
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
            Source Port
            <hint>
              The source port, which can take on three forms:
              <ul>
                <li>`a-b`: a and b are both positive integers less than `65536`. This range is a closed interval, and this rule will take effect when the target port falls within this range.</li>
                <li>`a`: a is a positive integer less than `65536`. This rule will take effect when the target port is a.</li>
                <li>A mixture of the above two forms, separated by commas ",". For example: `53,443,1000-2000`.</li>
              </ul>
            </hint>
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
      <input class="button_gen button_gen_small" type="button" value="Save" @click.prevent="saveRule" />
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref, watch, computed } from "vue";
  import Modal from "../Modal.vue";
  import xrayConfig from "../../modules/XrayConfig";
  import { XrayRoutingRuleObject, XrayRoutingObject } from "../../modules/CommonObjects";
  import Hint from "../Hint.vue";

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
      }
    },
    setup(props, { emit }) {
      const rules = ref<XrayRoutingRuleObject[]>([...props.rules.filter((r) => !r.isSystem())]);

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

      // Methods
      const deleteRule = (rule: XrayRoutingRuleObject) => {
        const index = rules.value.indexOf(rule);
        if (!confirm("Are you sure you want to delete this rule?")) return;
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
        modalAdd.value?.show(() => {});
      };

      const editRule = (rule: XrayRoutingRuleObject) => {
        const index = rules.value.indexOf(rule);
        currentIndex.value = index;
        const ruleToEdit = { ...rules.value[index] };
        ruleToEdit.inboundTag = [...(ruleToEdit.inboundTag || [])];
        ruleToEdit.protocol = [...(ruleToEdit.protocol || [])];
        ruleToEdit.user = [...(ruleToEdit.user || [])];
        currentRule.value = ruleToEdit;
        domains.value = ruleToEdit.domain ? ruleToEdit.domain.join("\n") : "";
        ips.value = ruleToEdit.ip ? ruleToEdit.ip.join("\n") : "";
        source.value = ruleToEdit.source ? ruleToEdit.source.join("\n") : "";
        modalAdd.value?.show(() => {});
      };

      const saveRule = () => {
        const newRule = new XrayRoutingRuleObject();
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

        if (currentIndex.value > -1) {
          rules.value[currentIndex.value] = newRule;
        } else {
          rules.value.push(newRule);
        }

        modalAdd.value?.close();
        emit("update:rules", rules.value);
      };

      const getRuleName = (rule: XrayRoutingRuleObject): string => {
        const summarize = (arr?: string[]): string => {
          if (!arr || arr.length === 0) return "n/a";
          return arr.length > 3 ? arr.slice(0, 3).join(", ") + " …" : arr.join(", ");
        };

        const outbound = rule.outboundTag || "n/a";
        const inbound = rule.inboundTag && rule.inboundTag.length > 0 ? rule.inboundTag.join(", ") : "all";
        const domains = summarize(rule.domain);
        const ips = summarize(rule.ip);

        return `${inbound} to ${outbound} | dmns: ${domains} | ips: ${ips}`;
      };

      const reorderRule = (rule: XrayRoutingRuleObject) => {
        const currIndex = rules.value.indexOf(rule);

        rules.value.splice(currIndex, 1);
        rules.value.splice(currIndex - 1, 0, rule);
        emit("update:rules", rules.value);
      };
      const show = () => {
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
        rules.value = [...props.rules];
        modalList.value?.show();
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

<style scoped>
  .FormTable tbody tr.rule-system td text {
    float: left;
    padding-left: 5px;
  }

  .FormTable tbody tr.rule-system td {
    color: rgb(255, 0, 255);
  }
</style>
