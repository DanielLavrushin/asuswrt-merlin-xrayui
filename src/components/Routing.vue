<template>
  <table class="FormTable" style="width: 100%">
    <thead>
      <tr>
        <td colspan="2">Routing</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>Domain Strategy</th>
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
        <th>Domain Matcher</th>
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
        <th>Rules</th>
        <td>
          {{ routing.rules.length }} item(s)
          <input class="button_gen button_gen_small" type="button" value="Manage" @click.prevent="manage_rules()" />
          <span class="hint-color"></span>
          <rules-modal ref="modal" v-model:rules="routing.rules"></rules-modal>
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

  import RulesModal from "./modals/RulesModal.vue";

  export default defineComponent({
    name: "Routing",
    components: {
      RulesModal
    },
    methods: {
      async manage_balancers() {},
      async manage_rules() {
        this.modal.show();
      }
    },
    setup() {
      const modal = ref();
      const routing = ref<XrayRoutingObject>(xrayConfig.routing || new XrayRoutingObject());
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
      return {
        routing,
        modal,
        domainStrategyOptions: XrayRoutingObject.domainStrategyOptions,
        domainMatcherOptions: XrayRoutingObject.domainMatcherOptions
      };
    }
  });
</script>
