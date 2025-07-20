<template>
  <table class="FormTable" style="width: 100%">
    <thead>
      <tr>
        <td colspan="2">
          {{ $t('com.Routing.title') }}
          <hint v-html="$t('com.Routing.hint_title')"></hint>
        </td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>
          {{ $t('com.Routing.label_domain_strategy') }}
          <hint v-html="$t('com.Routing.hint_domain_strategy')"></hint>
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
          {{ $t('com.Routing.label_domain_matcher') }}
          <hint v-html="$t('com.Routing.hint_domain_matcher')"></hint>
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
      <tr v-if="routing.policies">
        <th>
          {{ $t('com.Routing.label_policies') }}
          <hint v-html="$t('com.Routing.hint_policies')"></hint>
        </th>
        <td>
          {{ routing.policies.length }} item(s)
          <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click.prevent="manage_policy()" />
          <policy-modal ref="policyModal" v-model:policies="routing.policies"></policy-modal>
        </td>
      </tr>
      <tr v-if="routing.rules">
        <th>
          {{ $t('com.Routing.label_rules') }}
          <hint v-html="$t('com.Routing.hint_rules')"></hint>
        </th>
        <td>
          {{ countRules() }} item(s)
          <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click.prevent="manage_rules()" />
          <rules-modal ref="modal" v-model:rules="routing.rules" v-model:disabled_rules="routing.disabled_rules"></rules-modal>
        </td>
      </tr>
      <tr v-if="routing.rules">
        <th>
          {{ $t('com.Routing.label_geodat_metadata') }}
          <hint v-html="$t('com.Routing.hint_geodat_metadata')"></hint>
        </th>
        <td>
          <input class="button_gen button_gen_small" type="button" :value="$t('com.Routing.manage_local_files')" @click.prevent="manage_geodat()" />
          <geodat-modal ref="geodatModal"></geodat-modal>
          <input class="button_gen button_gen_small" type="button" :value="$t('com.Routing.update_community_files')" @click.prevent="update_geodat()" />
          <span class="hint-small" v-if="daysPassed > 1"> updated {{ daysPassed }} days ago</span>
          <span class="hint-color"> [<a href="https://github.com/v2fly/domain-list-community/tree/master/data" target="_blank">geosite</a>] </span>
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
  import { defineComponent, ref, watch, inject, Ref } from 'vue';

  import { XrayRoutingObject, XrayRoutingRuleObject } from '@/modules/CommonObjects';
  import xrayConfig from '@/modules/XrayConfig';
  import engine, { EngineResponseConfig, SubmitActions } from '@/modules/Engine';
  import PolicyModal from '@modal/PolicyModal.vue';
  import RulesModal from '@modal/RulesModal.vue';
  import Hint from '@main/Hint.vue';
  import GeodatModal from '@modal/GeodatModal.vue';
  export default defineComponent({
    name: 'Routing',
    components: {
      Hint,
      RulesModal,
      PolicyModal,
      GeodatModal
    },
    setup() {
      const modal = ref();
      const policyModal = ref();
      const geodatModal = ref();
      const daysPassed = ref(0);
      const routing = ref<XrayRoutingObject>(xrayConfig.routing || new XrayRoutingObject());
      const uiResponse = inject<Ref<EngineResponseConfig>>('uiResponse')!;

      const manage_geodat = async () => {
        await geodatModal.value.show();
      };
      const update_geodat = async () => {
        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmitActions.geodataCommunityUpdate, null, 1000);
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
              const date = new Date(newVal?.geodata.community['geosite.dat']);
              const df = Date.now() - date.getTime();
              daysPassed.value = Math.floor(df / (1000 * 60 * 60 * 24));
            }
          }
        }
      );

      const manage_policy = async () => {
        policyModal.value.show();
      };

      const manage_rules = async () => {
        modal.value.show((rules: XrayRoutingRuleObject[], disabled_rules: XrayRoutingRuleObject[]) => {});
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
        policyModal,
        update_geodat,
        manage_geodat,
        manage_rules,
        manage_policy,
        countRules,
        domainStrategyOptions: XrayRoutingObject.domainStrategyOptions,
        domainMatcherOptions: XrayRoutingObject.domainMatcherOptions
      };
    }
  });
</script>
