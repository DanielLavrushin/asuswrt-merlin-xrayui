<template>
  <tr>
    <th>Tag</th>
    <td>
      <input type="text" class="input_20_table" v-model="inbound.tag" />
      <span class="hint-color"></span>
    </td>
  </tr>
  <tr>
    <th>The listening address</th>
    <td>
      <input type="text" maxlength="15" class="input_20_table" v-model="inbound.listen" onkeypress="return validator.isIPAddr(this, event);" autocomplete="off" autocorrect="off" autocapitalize="off" />
      <span class="hint-color"></span>
    </td>
  </tr>
  <tr>
    <th>Port</th>
    <td>
      <span style="float: left" v-if="engine.mode == 'server'">
        <input type="text" id="po1" maxlength="5" class="input_6_table" v-model="port1" autocorrect="off" autocapitalize="off" onkeypress="return validator.isNumber(this,event);" />
        -
        <input type="text" maxlength="5" class="input_6_table" v-model="port2" autocorrect="off" autocapitalize="off" onkeypress="return validator.isNumber(this,event);" />
      </span>
      <span v-else>
        <input type="text" id="po1" maxlength="5" class="input_6_table" v-model="port1" autocorrect="off" autocapitalize="off" onkeypress="return validator.isNumber(this,event);" />
      </span>
      <span class="row-buttons">
        <a class="button_gen button_gen_small" href="#" @click="show_allocate(inbound)">Port allocation</a>
      </span>
      <allocate-modal ref="allocateModal" />
    </td>
  </tr>
</template>

<script lang="ts">
  import { defineComponent, ref, watch } from "vue";
  import AllocateModal from "../modals/AllocateModal.vue";
  import { XrayInboundObject } from "../../modules/InboundObjects";
  import { IProtocolType } from "../../modules/Interfaces";
  import engine from "../../modules/Engine";

  export default defineComponent({
    name: "InboundCommon",
    components: {
      AllocateModal,
    },
    props: {
      inbound: XrayInboundObject<IProtocolType>,
    },
    methods: {
      async show_allocate(inbound: XrayInboundObject<IProtocolType>) {
        this.allocateModal.show(inbound);
      },
    },
    setup(props) {
      const getPorts = (ports: string | number): number[] => {
        if (typeof ports === "string") {
          const [port1, port2] = ports.split("-").map((port) => parseInt(port, 10));
          return [port1, port2 || port1];
        } else {
          return [ports, ports];
        }
      };

      const port1 = ref<number>(0);
      const port2 = ref<number>(0);
      const allocateModal = ref();
      const inbound = ref<XrayInboundObject<IProtocolType>>(props.inbound ?? new XrayInboundObject<IProtocolType>());

      if (inbound.value.port) {
        const ports = getPorts(inbound.value.port);
        port1.value = ports[0];
        port2.value = ports[1];
      }

      watch(
        () => inbound.value.port,
        (newPort) => {
          const ports = getPorts(newPort);
          port1.value = ports[0];
          port2.value = ports[1];
        },
        { immediate: true }
      );

      watch([port1, port2], ([newPort1, newPort2]) => {
        if (engine.mode === "server") {
          if (newPort1 !== newPort2) {
            inbound.value.port = `${newPort1}-${newPort2}`;
          } else {
            inbound.value.port = newPort1;
          }
        } else {
          inbound.value.port = newPort1;
        }
      });

      return {
        allocateModal,
        inbound,
        port1,
        port2,
        engine,
      };
    },
  });
</script>
