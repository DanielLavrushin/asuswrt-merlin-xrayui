<template>
  <modal width="755" ref="modalList" :title="$t('com.PolicyModal.modal_title')">
    <table class="FormTable modal-form-table">
      <thead>
        <tr>
          <td colspan="4">{{ $t('com.PolicyModal.modal_title2') }}</td>
        </tr>
      </thead>
      <draggable v-if="policies.length" tag="tbody" :list="policies" handle=".drag-handle" @end="syncOrder">
        <template #item="{ element: r, index }">
          <tr>
            <th class="drag-handle" aria-label="Drag to reorder">
              <span class="grip" aria-hidden="true"></span>
              <label>
                <input type="checkbox" v-model="r.enabled" @change.prevent="on_off_rule(r, index)" />
                {{ $t('com.PolicyModal.rule_no', [index + 1]) }}
              </label>
            </th>
            <td style="color: #ffcc00">{{ r.name }}</td>
            <td>{{ r.mode }}</td>
            <td>
              <span class="row-buttons">
                <input class="button_gen button_gen_small" type="button" :value="$t('labels.edit')" @click.prevent="editRule(r)" />
                <input class="button_gen button_gen_small" type="button" value="&#10005;" :title="$t('labels.delete')" @click.prevent="deleteRule(r)" />
              </span>
            </td>
          </tr>
        </template>
      </draggable>
      <tbody v-else>
        <tr>
          <td colspan="4" style="color: #ffcc00">{{ $t('com.PolicyModal.no_rules_defined') }}</td>
        </tr>
      </tbody>
    </table>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" :value="$t('labels.add')" @click.prevent="addRule" />
    </template>
  </modal>
  <modal width="755" ref="modalAdd" title="Rule">
    <table class="FormTable modal-form-table">
      <tbody>
        <tr>
          <th>
            {{ $t('com.PolicyModal.label_friendly_name') }}
            <hint v-html="$t('com.PolicyModal.hint_friendly_name')"></hint>
          </th>
          <td>
            <input v-model="currentRule.name" type="text" class="input_25_table" />
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.PolicyModal.label_mode') }}
            <hint v-html="$t('com.PolicyModal.hint_mode')"></hint>
          </th>
          <td>
            <select class="input_option" v-model="currentRule.mode">
              <option v-for="opt in modes" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.PolicyModal.label_mac') }}
            <hint v-html="$t('com.PolicyModal.hint_mac')"></hint>
            <br />
            <div class="hint-color" v-show="currentRule.mode == 'redirect'">
              {{ $t('com.PolicyModal.hint_bypass_devices') }}
            </div>
            <div class="hint-color" v-show="currentRule.mode == 'bypass'">
              {{ $t('com.PolicyModal.hint_redirect_devices') }}
            </div>
          </th>
          <td class="flex-checkbox flex-checkbox-50 height-overflow" style="max-height: 240px">
            <label>
              <input type="checkbox" v-model="showAll" />
              {{ $t('com.PolicyModal.label_show_all') }}
            </label>
            <label v-if="devices.length > 10">
              <input type="text" v-model="deviceFilter" class="input_15_table" placeholder="filter devices" @input="applyDeviceFilter" />
            </label>
            <label
              v-for="device in devices"
              :key="device.mac"
              v-show="(showAll || device.isOnline) && device.isVisible"
              :class="{ online: showAll && device.isOnline }"
              :title="device.mac"
            >
              <input type="checkbox" :value="device.mac" v-model="currentRule.mac" />
              {{ device.name || device.mac }}
            </label>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.PolicyModal.label_wellknown_ports') }}
          </th>
          <td>
            <select v-model="vendor" class="input_option" @change="vendorChange">
              <option v-for="opt in vendors" :key="opt.name" :value="opt">
                {{ opt.name }}
              </option>
            </select>
            <span class="hint-color">
              [<a href="https://www.speedguide.net/ports.php" target="_blank">search1</a>] [<a
                href="https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml"
                target="_blank"
                >search2</a
              >]
            </span>
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.PolicyModal.label_tcp_ports') }}
            <hint v-html="$t('com.PolicyModal.hint_tcp_ports')"></hint>
            <br />
            <div class="hint-color" v-show="currentRule.mode == 'bypass'">
              {{ $t('com.PolicyModal.hint_bypass') }}
            </div>
            <div class="hint-color" v-show="currentRule.mode == 'redirect'">
              {{ $t('com.PolicyModal.hint_redirect') }}
            </div>
          </th>
          <td>
            <input v-model="currentRule.tcp" type="text" class="input_32_table" />
          </td>
        </tr>
        <tr>
          <th>
            {{ $t('com.PolicyModal.label_udp_ports') }}
            <hint v-html="$t('com.PolicyModal.hint_udp_ports')"></hint>
            <br />
            <div class="hint-color" v-show="currentRule.mode == 'bypass'">
              {{ $t('com.PolicyModal.hint_bypass') }}
            </div>
            <div class="hint-color" v-show="currentRule.mode == 'redirect'">
              {{ $t('com.PolicyModal.hint_redirect') }}
            </div>
          </th>
          <td>
            <input v-model="currentRule.udp" type="text" class="input_32_table" />
          </td>
        </tr>
      </tbody>
    </table>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" :value="$t('labels.save')" @click.prevent="saveRule" />
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import Modal from '@main/Modal.vue';
  import { XrayRoutingPolicy } from '@/modules/CommonObjects';
  import Hint from '@main/Hint.vue';
  import draggable from 'vuedraggable';

  class MacDevice {
    public mac!: string;
    public name?: string;
    public isOnline!: boolean;
    public isVisible!: boolean;
  }

  export default defineComponent({
    name: 'PolicyModal',
    components: {
      Modal,
      Hint,
      draggable
    },

    props: {
      policies: {
        type: Array<XrayRoutingPolicy>,
        required: true
      }
    },

    setup(props, { emit }) {
      const policies = ref<XrayRoutingPolicy[]>(props.policies);
      const currentRule = ref<XrayRoutingPolicy>(new XrayRoutingPolicy());
      const modalList = ref();
      const modalAdd = ref();
      const showAll = ref(false);
      const vendor = ref();
      const devices = ref<MacDevice[]>([]);
      const deviceFilter = ref('');

      window.xray.router.devices.forEach((device) => {
        devices.value.push({
          mac: device[0],
          name: device[1],
          isOnline: false,
          isVisible: deviceFilter.value ? device[1].toLowerCase().includes(deviceFilter.value.toLowerCase()) : true
        });
      });
      Object.getOwnPropertyNames(window.xray.router.devices_online).forEach((mac) => {
        const device = devices.value.find((x) => x.mac === mac);
        if (device) {
          device.isOnline = true;
        }
      });
      devices.value.sort((a, b) => (a.name || a.mac).localeCompare(b.name || b.mac));

      const on_off_rule = (rule: XrayRoutingPolicy, index: number) => {};
      const show = () => {
        policies.value = [...props.policies];
        modalList.value.show();
      };

      const normalizePorts = (ports: string) => {
        if (!ports) return '';

        return ports
          .replace(/\n/g, ',')
          .replace(/\-/g, ':')
          .replace(/[^0-9,\:]/g, '')
          .split(',')
          .filter((x) => x)
          .join(',')
          .trim();
      };

      const editRule = (rule: XrayRoutingPolicy) => {
        currentRule.value = rule;
        modalAdd.value?.show();
        emit('update:policies', policies.value);
      };
      const deleteRule = (rule: XrayRoutingPolicy) => {
        if (policies.value) {
          policies.value = policies.value.filter((r) => r !== rule);
        }
        emit('update:policies', policies.value);
      };

      const addRule = () => {
        currentRule.value = new XrayRoutingPolicy();
        modalAdd.value?.show();
      };
      const vendorChange = () => {
        if (vendor.value) {
          currentRule.value.tcp += (currentRule.value.tcp ? ',' : '') + vendor.value.tcp.split(',');
          currentRule.value.udp += (currentRule.value.udp ? ',' : '') + vendor.value.udp.split(',');
        }
        vendor.value = null;
      };
      const saveRule = () => {
        const newRule = new XrayRoutingPolicy();
        newRule.enabled = currentRule.value.enabled;
        newRule.name = currentRule.value.name;
        newRule.mac = [...(currentRule.value.mac || [])];
        newRule.mode = currentRule.value.mode;
        newRule.tcp = normalizePorts(currentRule.value.tcp!);
        newRule.udp = normalizePorts(currentRule.value.udp!);

        const ruleIndex = policies.value.indexOf(currentRule.value);
        if (ruleIndex === -1) {
          policies.value.push(newRule);
        } else {
          policies.value[ruleIndex] = newRule;
        }
        emit('update:policies', policies.value);
        modalAdd.value?.close();
      };

      const applyDeviceFilter = () => {
        devices.value.forEach((device) => {
          device.isVisible = deviceFilter.value && deviceFilter.value != '' ? (device.name || device.mac).toLowerCase().includes(deviceFilter.value.toLowerCase()) : true;
        });
      };
      const syncOrder = () => {
        emit('update:policies', policies.value);
      };
      return {
        policies,
        currentRule,
        devices,
        modalList,
        modalAdd,
        showAll,
        vendor,
        modes: XrayRoutingPolicy.modes,
        vendors: XrayRoutingPolicy.vendors,
        deviceFilter,
        show,
        vendorChange,
        on_off_rule,
        deleteRule,
        addRule,
        editRule,
        saveRule,
        applyDeviceFilter,
        syncOrder
      };
    }
  });
</script>
<style scoped>
  th :deep(.hint-color) {
    width: 100%;
  }
  .online {
    font-weight: bold;
    color: #00ff7f;
  }
</style>
