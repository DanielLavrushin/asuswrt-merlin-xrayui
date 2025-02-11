<template>
  <table class="FormTable" style="width: 100%">
    <thead>
      <tr>
        <td colspan="2">
          {{ $t("components.Routing.title") }}
          <hint v-html="$t('components.Routing.hint_title')"></hint>
        </td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>
          {{ $t("components.Routing.label_domain_strategy") }}
          <hint v-html="$t('components.Routing.hint_domain_strategy')"></hint>
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
          {{ $t("components.Routing.label_domain_matcher") }}
          <hint v-html="$t('components.Routing.hint_domain_matcher')"></hint>
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
          {{ $t("components.Routing.label_rules") }}
          <hint v-html="$t('components.Routing.hint_rules')"></hint>
        </th>
        <td>
          {{ countRules() }} item(s)
          <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click.prevent="manage_rules()" />
          <span class="hint-color"></span>
          <rules-modal ref="modal" v-model:rules="routing.rules"></rules-modal>
        </td>
      </tr>
      <tr v-if="routing.rules">
        <th>
          {{ $t("components.Routing.label_geodat_metadata") }}
          <hint v-html="$t('components.Routing.hint_geodat_metadata')"></hint>
        </th>
        <td>
          <input class="button_gen button_gen_small" type="button" :value="$t('components.Routing.manage_local_files')" @click.prevent="manage_geodat()" />
          <geodat-modal ref="geodatModal"></geodat-modal>
          <input class="button_gen button_gen_small" type="button" :value="$t('components.Routing.update_community_files')" @click.prevent="update_geodat()" />
          <span class="hint-small" v-if="daysPassed > 1"> updated {{ daysPassed }} days ago</span>
          <span class="hint-color"> [<a href="https://github.com/Loyalsoldier/v2ray-rules-dat/releases" target="_blank">source</a>, <a href="https://github.com/v2fly/domain-list-community/tree/master/data" target="_blank">geosite</a>] </span>
        </td>
      </tr>
      <tr v-if="engine.mode == 'client' && routing.portsPolicy">
        <th>
          {{ $t("components.Routing.label_ports_policy") }}
          <hint v-html="$t('components.Routing.hint_ports_policy')"></hint>
        </th>
        <td>
          mode: {{ routing.portsPolicy.mode }}
          <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click.prevent="manage_redirect_ports()" />
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
  import { defineComponent, ref, watch, inject, onMounted, Ref } from "vue";

  import { XrayRoutingObject } from "../modules/CommonObjects";
  import xrayConfig from "../modules/XrayConfig";
  import engine, { EngineResponseConfig, SubmtActions } from "../modules/Engine";
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
      const uiResponse = inject<Ref<EngineResponseConfig>>("uiResponse")!;

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

      watch(
        () => uiResponse?.value,
        (newVal) => {
          if (newVal) {
            if (newVal?.geodata?.community) {
              const date = new Date(newVal?.geodata.community["geosite.dat"]);
              const df = Date.now() - date.getTime();
              daysPassed.value = Math.floor(df / (1000 * 60 * 60 * 24));
            }
          }
        }
      );
      const manage_redirect_ports = async () => {
        modalRedirectPorts.value.show();
      };

      const manage_rules = async () => {
        modal.value.show();
      };

      const countRules = () => {
        return routing.value.rules?.filter((r) => !r.isSystem()).length;
      };

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
