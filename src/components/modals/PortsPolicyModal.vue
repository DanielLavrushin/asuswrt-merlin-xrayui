<template>
  <modal ref="modal" :title="$t('components.PortsPolicyModal.modal_title')" width="700px">
    <div class="formfontdesc">
      <div style="text-align: left;" v-html="$t('components.PortsPolicyModal.modal_desc')"></div>
      <table class="FormTable modal-form-table">
        <tbody v-if="ports">
          <tr>
            <th>
              {{ $t('components.PortsPolicyModal.label_mode') }}
            </th>
            <td>
              <select v-model="ports.mode" class="input_option" @change="modeChange">
                <option v-for="opt in modes" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('components.PortsPolicyModal.label_wellknown_ports') }}
            </th>
            <td>
              <select v-model="vendor" class="input_option" @change="vendorChange">
                <option v-for="opt in vendors" :key="opt.name" :value="opt">
                  {{ opt.name }}
                </option>
              </select>
              <span class="hint-color">
                [<a href="https://www.speedguide.net/ports.php" target="_blank">search1</a>]
                [<a href="https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml"
                  target="_blank">search2</a>]
              </span>
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('components.PortsPolicyModal.label_tcp_ports') }}
              <hint v-html="$t('components.PortsPolicyModal.hint_tcp_ports')"></hint>
              <br />
              <div class="hint-color" v-show="ports.mode == 'bypass'">
                {{ $t('components.PortsPolicyModal.hint_bypass') }}
              </div>
              <div class="hint-color" v-show="ports.mode == 'redirect'">
                {{ $t('components.PortsPolicyModal.hint_redirect') }}
              </div>
            </th>
            <td>
              <div class="textarea-wrapper">
                <textarea v-model="tcp" rows="25"></textarea>
              </div>
            </td>
          </tr>
          <tr>
            <th> {{ $t('components.PortsPolicyModal.label_udp_ports') }}
              <hint v-html="$t('components.PortsPolicyModal.hint_udp_ports')"></hint>
              <br />
              <div class="hint-color" v-show="ports.mode == 'bypass'">
                {{ $t('components.PortsPolicyModal.hint_bypass') }}
              </div>
              <div class="hint-color" v-show="ports.mode == 'redirect'">
                {{ $t('components.PortsPolicyModal.hint_redirect') }}
              </div>
            </th>
            <td>
              <div class="textarea-wrapper">
                <textarea v-model="udp" rows="25"></textarea>
              </div>
            </td>
          </tr>

        </tbody>
      </table>
    </div>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" value="save" @click.prevent="save" />
    </template>
  </modal>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import Modal from "../Modal.vue";
import { XrayPortsPolicy } from "@/modules/CommonObjects";
import Hint from "../Hint.vue";

export default defineComponent({
  name: "PortsPolicyModal",
  components: {
    Modal,
    Hint
  },
  data() {
    return {
    };
  },
  props: {
    ports: {
      type: XrayPortsPolicy,
      required: true
    }
  },

  setup(props, { emit }) {
    const ports = ref<XrayPortsPolicy>(props.ports);
    const modal = ref();
    const vendor = ref();
    const tcp = ref("");
    const udp = ref("");

    const show = () => {
      modal.value.show();
    };
    const normalizePorts = (ports: string) => {
      if (!ports) return "";

      return ports
        .replace(/\n/g, ',')
        .replace(/\-/g, ':')
        .replace(/[^0-9,\:]/g, "")
        .split(',')
        .filter(x => x).join(",")
        .trim();

    };

    const save = () => {
      if (props.ports) {
        props.ports.mode = ports.value.mode;
        props.ports.tcp = normalizePorts(tcp.value);
        props.ports.udp = normalizePorts(udp.value);

        emit("update:ports", props.ports);
      }
      modal.value.close();
    };
    const vendorChange = () => {
      if (vendor.value) {
        tcp.value += (tcp.value ? '\n' : '') + vendor.value.tcp.split(",").join("\n");
        udp.value += (udp.value ? '\n' : '') + vendor.value.udp.split(",").join("\n");
      }
      vendor.value = null;
    };

    const modeChange = () => {
      if (props.ports?.mode === "bypass") {
        tcp.value = XrayPortsPolicy.defaultPorts.join("\n");
        udp.value = XrayPortsPolicy.defaultPorts.join("\n");
      }
    };
    watch(
      () => props.ports,
      (obj) => {
        if (obj) {
          if (ports.value) {
            ports.value.mode = obj.mode;
          }
          tcp.value = obj.tcp?.split(",").join("\n") ?? "";
          udp.value = obj.udp?.split(",").join("\n") ?? "";
        }
      },
      { immediate: true }
    );



    return {
      tcp,
      udp,
      ports: props.ports,
      modal,
      modes: XrayPortsPolicy.modes,
      vendor,
      vendors: XrayPortsPolicy.vendors,
      show,
      save,
      modeChange,
      vendorChange
    }
  }
});
</script>
<style scoped>
th :deep(.hint-color) {
  width: 100%;
}
</style>
