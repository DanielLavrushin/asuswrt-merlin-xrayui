<template>
  <table class="FormTable" style="width: 100%">
    <thead>
      <tr>
        <td colspan="2">
          Routing
          <hint>
            The routing module can send inbound data through different outbound connections according to different rules
            to achieve on-demand proxying.
            <p>A common use case is to split domestic and foreign traffic. Xray can use its internal mechanisms to
              determine the traffic from different regions and then send them to different outbound proxies.</p>
          </hint>
        </td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>
          Domain Strategy
          <hint>
            The domain name resolution strategy, which uses different strategies based on different settings.
            <ul>
              <li>**AsIs**: Use only the domain name for routing selection. Default value.</li>
              <li>
                **IPIfNonMatch**: If the domain name does not match any rule, resolve the domain name into an IP address
                (A record or AAAA record) and match it again
                <ul>
                  <li>When a domain name has multiple A records, it will try to match all A records until one of them
                    matches a rule</li>
                  <li>The resolved IP only works for routing selection, and the original domain name is still used in
                    the forwarded packets</li>
                </ul>
              </li>
              <li>**IPOnDemand**: If any IP-based rules are encountered during matching, immediately resolve the domain
                name into an IP address for matching</li>
            </ul>
          </hint>
        </th>
        <td>
          <select class="input_option" v-model="routing.domainStrategy">
            <option v-for="opt in domainStrategyOptions" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
          <span class="hint-color">default: AsIs</span>
        </td>
      </tr>
      <tr>
        <th>
          Domain Matcher
          <hint>
            The domain name matching algorithm, which uses different algorithms based on different settings. This option
            affects all RuleObject that do not have a separately specified matching algorithm.
            <ul>
              <li>**hybrid**: Use the new domain name matching algorithm, which is faster and takes up less space.
                Default value.</li>
              <li>**linear**: Use the original domain name matching algorithm.</li>
            </ul>
          </hint>
        </th>
        <td>
          <select class="input_option" v-model="routing.domainMatcher">
            <option v-for="opt in domainMatcherOptions" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
          <span class="hint-color">default: hybrid</span>
        </td>
      </tr>
      <tr v-if="routing.rules">
        <th>
          Rules
          <hint>
            An array corresponding to a list of rules. For each connection, the routing will judge these rules from top
            to bottom in order. When it encounters the first effective rule, it will forward the connection to the
            outboundTag or balancerTag specified by the rule.
            <blockquote>When no rules match, the traffic is sent out by the first outbound by default.</blockquote>
          </hint>
        </th>
        <td>
          {{ countRules() }} item(s)
          <input class="button_gen button_gen_small" type="button" value="manage" @click.prevent="manage_rules()" />
          <span class="hint-color"></span>
          <rules-modal ref="modal" v-model:rules="routing.rules"></rules-modal>
        </td>
      </tr>
      <tr v-if="routing.rules">
        <th>
          GeoIp/GeoSite Metadata
          <hint> Update the GeoIP and GeoSite metadata files. This operation will take some time, please be patient.
          </hint>
        </th>
        <td>
          <input class="button_gen button_gen_small" type="button" value="manage local files"
            @click.prevent="manage_geodat()" />
          <geodat-modal ref="geodatModal"></geodat-modal>
          <input class="button_gen button_gen_small" type="button" value="update community files"
            @click.prevent="update_geodat()" />
          <span class="hint-small" v-if="daysPassed > 1"> updated {{ daysPassed }} days ago</span>
          <span class="hint-color"> [<a href="https://github.com/Loyalsoldier/v2ray-rules-dat/releases"
              target="_blank">source</a>, <a href="https://github.com/v2fly/domain-list-community/tree/master/data"
              target="_blank">geosite</a>] </span>
        </td>
      </tr>
      <tr v-if="engine.mode == 'client' && routing.portsPolicy">
        <th>
          Ports Bypass/Redirect Policy
          <hint>
            By default, the mode `redirect` is used, meaning that traffic on all ports is redirected to the inbound port
            of xray. Specify any additional ports that should be routed through or bypass Xray.
            <ul>
              <li><strong>redirect</strong>: Traffic on all ports is redirected to the inbound port. You define the
                ports that should NOT be redirected to Xray.</li>
              <li><strong>bypass</strong>: Traffic on all ports bypasses Xray. You define the ports that should be
                explicitly redirected to Xray.</li>
            </ul>
          </hint>
        </th>
        <td>
          mode: {{ routing.portsPolicy.mode }}
          <input class="button_gen button_gen_small" type="button" value="manage"
            @click.prevent="manage_redirect_ports()" />
          <ports-policy-modal ref="modalRedirectPorts" v-model:ports="routing.portsPolicy"></ports-policy-modal>
        </td>
      </tr>
      <!-- <tr>
                    <th>Balancers</th>
                    <td>
                        {{ routing.rules.length }} item(s)
                        <input class="button_gen button_gen_small" type="button" value="Manage"
                            @click.prevent="manage_balancers()" />
                        <span class="hint-color"></span>
                    </td>
                </tr>
                -->
    </tbody>
  </table>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";

import { XrayRoutingObject } from "../modules/CommonObjects";
import xrayConfig from "../modules/XrayConfig";
import engine, { SubmtActions } from "../modules/Engine";
import RulesModal from "./modals/RulesModal.vue";
import Hint from "./Hint.vue";
import PortsPolicyModal from "./modals/PortsPolicyModal.vue";
import GeodatModal from "./modals/GeodatModal.vue";
export default defineComponent({
  name: "Routing",
  components: {
    Hint,
    RulesModal,
    PortsPolicyModal,
    GeodatModal
  },

  setup() {
    const modal = ref();
    const geodatModal = ref();
    const modalRedirectPorts = ref();
    const daysPassed = ref(0);
    const routing = ref<XrayRoutingObject>(xrayConfig.routing || new XrayRoutingObject());

    const manage_geodat = async () => {
      await geodatModal.value.show();
    };
    const update_geodat = async () => {
      await engine.executeWithLoadingProgress(async () => {
        await engine.submit(SubmtActions.geodataCommunityUpdate, null, 1000);
      });
    };

    watch(
      () => xrayConfig?.routing,
      (newObj) => {
        routing.value = newObj ?? new XrayRoutingObject();
        if (!newObj) {
          xrayConfig.routing = routing.value;
        }
      },
      { immediate: true }
    );

    const manage_redirect_ports = async () => {
      modalRedirectPorts.value.show();
    };

    const manage_rules = async () => {
      modal.value.show();
    };

    const load_geodat_dates = async () => {
      await engine.submit(SubmtActions.geodataCommunityDates, null, 1000);
      const result = await engine.getXrayResponse();
      if (result.geodata?.community) {
        const date = new Date(result.geodata.community["geosite.dat"]);
        const df = Date.now() - date.getTime();
        daysPassed.value = Math.floor(df / (1000 * 60 * 60 * 24));
      }
    };
    const countRules = () => {
      return routing.value.rules?.filter((r) => !r.isSystem()).length;
    };
    load_geodat_dates();

    return {
      engine,
      geodatModal,
      routing,
      daysPassed,
      modal,
      modalRedirectPorts,
      update_geodat,
      manage_geodat,
      manage_rules,
      manage_redirect_ports,
      countRules,
      domainStrategyOptions: XrayRoutingObject.domainStrategyOptions,
      domainMatcherOptions: XrayRoutingObject.domainMatcherOptions
    };
  }
});
</script>
