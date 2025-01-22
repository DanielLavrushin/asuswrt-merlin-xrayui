<template>
  <modal ref="modal" title="Ports Bypass/Redirect Policy" width="700px">
    <div class="formfontdesc">
      <div style="text-align: left;">
        By default, the mode <strong>redirect</strong> is used, meaning that traffic on all ports is
        redirected to the inbound port of xray.
        Specify any additional ports that should be routed through or bypass Xray.
        <ul>
          <li>
            <strong>redirect</strong>: Traffic on all ports is redirected to the inbound port. You define
            the ports that should NOT be redirected to Xray.
          </li>
          <li>
            <strong>bypass</strong>: Traffic on all ports bypasses Xray. You define the ports that should be
            explicitly redirected to Xray.
          </li>
        </ul>
      </div>
      <table class="FormTable modal-form-table">
        <tbody v-if="ports">
          <tr>
            <th>
              Mode
            </th>
            <td>
              <select v-model="ports.mode" class="input_option" @change="modeChange">
                <option></option>
                <option v-for="opt in modes" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </td>
          </tr>
          <tr>
            <th>
              Apply well-known service ports
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
            <th>TCP ports
              <hint>
                Only allowed characters are numbers, commas, and dashes. You may use a new line for each port.
                <br />
                Example: 80,443,8080,1000-2000
              </hint><br />
              <div class="hint-color" v-show="ports.mode == 'bypass'">
                these ports will be redirected to xray
              </div>
              <div class="hint-color" v-show="ports.mode == 'redirect'">
                these ports will bypass xray
              </div>
            </th>
            <td>
              <div class="textarea-wrapper">
                <textarea v-model="tcp" rows="25"></textarea>
              </div>
            </td>
          </tr>
          <tr>
            <th>UDP ports
              <hint>
                Only allowed characters are numbers, commas, and dashes. You may use a new line for each port.
                <br />
                Example: 80,443,8080,1000-2000
              </hint>
              <div class="hint-color" v-show="ports.mode == 'bypass'">
                these ports will be redirected to xray
              </div>
              <div class="hint-color" v-show="ports.mode == 'redirect'">
                these ports will bypass xray
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
    ports: XrayPortsPolicy,
  },

  setup(props, { emit }) {
    const ports = ref<XrayPortsPolicy>(props.ports ?? new XrayPortsPolicy());
    const modal = ref();
    const vendor = ref();
    const tcp = ref("");
    const udp = ref("");

    const show = () => {
      modal.value.show();
    };
    const normalizePorts = (ports: string) => {
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
        if (tcp.value) {
          props.ports.tcp = normalizePorts(tcp.value);
        }
        if (udp.value) {
          props.ports.udp = normalizePorts(udp.value);

        }

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
th>>>.hint-color {
  width: 100%;
}
</style>
