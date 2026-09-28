<template>
  <modal width="755" ref="modalList" :title="$t('com.BalancerModal.modal_title')">
    <table class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="5">{{ $t('com.BalancerModal.modal_title2') }}</td>
        </tr>
      </thead>
      <tbody v-if="balancers.length">
        <tr v-for="(b, index) in balancers" :key="index">
          <th>
            {{ $t('com.BalancerModal.balancer_no', [index + 1]) }}
          </th>
          <td style="color: #ffcc00">{{ b.tag || 'unnamed' }}</td>
          <td>{{ b.strategy?.type || 'random' }}</td>
          <td>
            <span :class="['balancer-now', nowClass(b)]" :title="nowText(b) + '\n' + $t('com.BalancerModal.hint_now')">{{ nowText(b) }}</span>
          </td>
          <td>
            <span class="row-buttons">
              <input class="button_gen button_gen_small" type="button" :value="$t('labels.edit')" @click.prevent="editBalancer(b)" />
              <input class="button_gen button_gen_small" type="button" value="&#10005;" :title="$t('labels.delete')" @click.prevent="deleteBalancer(b)" />
            </span>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td colspan="5" style="color: #ffcc00">{{ $t('com.BalancerModal.no_balancers_defined') }}</td>
        </tr>
      </tbody>
    </table>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" :value="$t('labels.add')" @click.prevent="addBalancer" />
    </template>
  </modal>
  <modal width="755" ref="modalAdd" :title="$t('com.BalancerModal.modal_edit_title')">
    <table class="FormTable modal-form-table">
      <tbody>
        <tr>
          <th>
            {{ $t('com.BalancerModal.label_tag') }}
            <hint v-html="$t('com.BalancerModal.hint_tag')"></hint>
          </th>
          <td>
            <input v-model="currentBalancer.tag" type="text" class="input_25_table" />
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.BalancerModal.label_strategy') }}
            <hint v-html="$t('com.BalancerModal.hint_strategy')"></hint>
          </th>
          <td>
            <select class="input_option" v-model="currentBalancer.strategy!.type">
              <option v-for="opt in strategyOptions" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.BalancerModal.label_selector') }}
            <hint v-html="$t('com.BalancerModal.hint_selector')"></hint>
          </th>
          <td>
            <div class="textarea-wrapper">
              <textarea v-model="selectorText" rows="6" :placeholder="$t('com.BalancerModal.placeholder_selector')"></textarea>
            </div>
            <div class="hint-color" v-if="matchingOutbounds.length">
              {{ $t('com.BalancerModal.label_matching') }}: {{ matchingOutbounds.join(', ') }}
            </div>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.BalancerModal.label_fallback_tag') }}
            <hint v-html="$t('com.BalancerModal.hint_fallback_tag')"></hint>
          </th>
          <td>
            <select class="input_option" v-model="currentBalancer.fallbackTag">
              <option value="">{{ $t('com.BalancerModal.none') }}</option>
              <option v-for="opt in outboundTags" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" :value="$t('labels.save')" @click.prevent="saveBalancer" />
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, inject, Ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import Modal from '@main/Modal.vue';
  import { XrayBalancerObject, XrayBalancerStrategyObject } from '@/modules/CommonObjects';
  import xrayConfig from '@/modules/XrayConfig';
  import Hint from '@main/Hint.vue';
  import { EngineResponseConfig } from '@/modules/Engine';
  import { balancerNow } from '@/modules/LiveStatus';
  import { describeViewShort } from '@/modules/BalancerStatus';

  export default defineComponent({
    name: 'BalancerModal',
    components: { Modal, Hint },
    props: {
      balancers: {
        type: Array as () => XrayBalancerObject[],
        default: () => [] as XrayBalancerObject[]
      }
    },
    setup(props, { emit }) {
      const { t } = useI18n();
      const uiResponse = inject<Ref<EngineResponseConfig> | undefined>('uiResponse', undefined);
      const balancers = ref<XrayBalancerObject[]>(props.balancers);
      const currentBalancer = ref<XrayBalancerObject>(new XrayBalancerObject());
      const modalList = ref<InstanceType<typeof Modal> | null>(null);
      const modalAdd = ref<InstanceType<typeof Modal> | null>(null);
      const selectorText = ref('');

      const outboundTags = computed(() =>
        xrayConfig.outbounds
          .filter((o) => !o.isSystem())
          .map((o) => o.tag)
          .filter((tag): tag is string => !!tag)
      );

      const matchingOutbounds = computed(() => {
        const prefixes = selectorText.value
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
        if (!prefixes.length) return [];
        return outboundTags.value.filter((tag) => prefixes.some((prefix) => tag.startsWith(prefix)));
      });

      const nowText = (b: XrayBalancerObject) => {
        if (!uiResponse?.value?.xray?.check_connection) return t('com.BalancerModal.now_needs_check');
        const now = balancerNow(b);
        switch (now.state) {
          case 'no-data':
            return t('com.BalancerModal.now_no_data');
          case 'not-applied':
            return t('com.BalancerModal.now_not_applied');
          case 'unused':
            return t('com.BalancerModal.now_unused');
          default:
            return describeViewShort(now.view, (key, args) => t(key, args));
        }
      };

      const nowClass = (b: XrayBalancerObject) => {
        if (!uiResponse?.value?.xray?.check_connection) return 'muted';
        const now = balancerNow(b);
        return now.state === 'view' ? now.view.kind : 'muted';
      };

      const show = () => {
        balancers.value = [...props.balancers];
        modalList.value?.show();
      };

      const addBalancer = () => {
        currentBalancer.value = new XrayBalancerObject();
        currentBalancer.value.strategy = new XrayBalancerStrategyObject();
        selectorText.value = '';
        modalAdd.value?.show();
      };

      const editBalancer = (b: XrayBalancerObject) => {
        currentBalancer.value = b;
        if (!b.strategy) {
          b.strategy = new XrayBalancerStrategyObject();
        }
        selectorText.value = (b.selector || []).join('\n');
        modalAdd.value?.show();
      };

      const deleteBalancer = (b: XrayBalancerObject) => {
        balancers.value = balancers.value.filter((x) => x !== b);
        emit('update:balancers', balancers.value);
      };

      const saveBalancer = () => {
        const newB = new XrayBalancerObject();
        newB.tag = currentBalancer.value.tag;
        newB.fallbackTag = currentBalancer.value.fallbackTag || undefined;
        newB.strategy = new XrayBalancerStrategyObject();
        newB.strategy.type = currentBalancer.value.strategy?.type || 'random';
        newB.selector = selectorText.value
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);

        const idx = balancers.value.indexOf(currentBalancer.value);
        if (idx === -1) balancers.value.push(newB);
        else balancers.value[idx] = newB;

        emit('update:balancers', balancers.value);
        modalAdd.value?.close();
      };

      return {
        balancers,
        currentBalancer,
        modalList,
        modalAdd,
        selectorText,
        outboundTags,
        matchingOutbounds,
        strategyOptions: XrayBalancerStrategyObject.typeOptions,
        nowText,
        nowClass,
        show,
        addBalancer,
        editBalancer,
        deleteBalancer,
        saveBalancer
      };
    }
  });
</script>
<style scoped lang="scss">
  .balancer-now {
    display: inline-block;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: middle;
    cursor: help;
    &.next,
    &.fallback,
    &.default {
      color: $c_purple;
    }
    &.tied,
    &.rotating {
      color: rgba($c_purple, 0.8);
    }
    &.muted {
      opacity: 0.6;
    }
  }
</style>
