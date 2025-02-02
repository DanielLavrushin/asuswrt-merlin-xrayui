<template>
  <modal ref="modal" title="Servers">
    <div class="formfontdesc">
      <p>A list of DNS servers, which can be either DNS addresses (in string form) or DnsServerObjects (advanced
        options).</p>
      <table width="100%" bordercolor="#6b8fa3" class="FormTable SettingsTable tableApi_table">
        <thead>
          <tr>
            <td colspan="2">List</td>
          </tr>
        </thead>
        <tbody>
          <tr class="row_title">
            <th>Server</th>
            <th></th>
          </tr>
          <tr class="row_title">
            <td>
              <input v-model="server.address" class="input_25_table" placeholder="address" />
            </td>
            <td>
              <button @click.prevent="advanced()" class="button_gen button_gen_small">advanced</button>
              <button @click.prevent="addSimple()" class="button_gen button_gen_small">add</button>
            </td>
          </tr>
          <tr v-if="!servers.length" class="data_tr">
            <td colspan="2" style="color: #ffcc00">No hosts defined</td>
          </tr>
          <tr v-for="(server, index) in servers" :key="index" class="data_tr">
            <td>{{ getServer(server) }}</td>
            <td>
              <button v-if="typeof server === 'string' == false" @click.prevent="manage(server, index)"
                class="button_gen button_gen_small">manage</button>
              <button @click.prevent="remove(server)" class="button_gen button_gen_small">&#10005;</button>
              <a class="button_gen button_gen_small" href="#" @click="reorder(server, index)"
                v-if="index > 0">&#8593;</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </modal>

  <!-- Advanced Modal -->
  <modal ref="modalAdvanced" title="Advanced options" width="500px">
    <div class="formfontdesc">
      <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
        <thead>
          <tr>
            <td colspan="2">Server Settings</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Address
            </th>
            <td>
              <input type="text" v-model="server.address" class="input_25_table" placeholder="address" />
            </td>
          </tr>
          <tr>
            <th>Client ip
            </th>
            <td>
              <input type="text" v-model="server.clientIP" class="input_25_table" placeholder="client ip" />
            </td>
          </tr>
          <tr>
            <th>Port
            </th>
            <td>
              <input type="number" v-model="server.port" class="input_6_table" placeholder="port" />
              <span class="hint-color">default: 53</span>
            </td>
          </tr>
          <tr>
            <th>Domains</th>
            <td>
              <div class="textarea-wrapper">
                <textarea v-model="domains" rows="10"></textarea>
              </div>
            </td>
          </tr>
          <tr>
            <th>Expected IPs</th>
            <td>
              <div class="textarea-wrapper">
                <textarea v-model="ips" rows="10"></textarea>
              </div>
            </td>
          </tr>
          <tr>
            <th>Skip fallback</th>
            <td>
              <input type="checkbox" v-model="server.skipFallback" />
              <span class="hint-color">default: false</span>
            </td>
          </tr>
        </tbody>
      </table>

    </div>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" value="Save" @click.prevent="addOrUpdateComplex()" />
    </template>
  </modal>
</template>
<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { XrayDnsServerObject } from "../../modules/CommonObjects";
import Modal from "../Modal.vue";

export default defineComponent({
  name: "DnsServersModal",
  components: {
    Modal,
  },
  props: {
    servers: {
      type: Array<(string | XrayDnsServerObject)>,
      required: true,
    },
  },
  methods: {
    addSimple() {
      if (this.server.address.trim()) {
        this.servers.push(this.server.address.trim());
        this.server.address = "";
      }
    },
    reorder(server: string | XrayDnsServerObject, index: number) {
      this.servers.splice(index, 1);
      this.servers.splice(index - 1, 0, server);
    },
    addOrUpdateComplex() {
      this.server.domains = this.domains.split("\n").filter(Boolean);
      this.server.expectIPs = this.ips.split("\n").filter(Boolean);

      if (this.editIndex !== null) {
        this.servers[this.editIndex] = { ...this.server };
      } else {
        this.servers.push({ ...this.server });
      }

      this.server = new XrayDnsServerObject();
      this.domains = "";
      this.ips = "";
      this.editIndex = null;
      this.modalAdvanced.close();
    },
    advanced() {
      this.modalAdvanced.show();
    },
    manage(server: string | XrayDnsServerObject, index: number) {
      if (typeof server === "string") {
        this.server = new XrayDnsServerObject();
        this.server.address = server;
      } else {
        this.server = { ...server };
        this.domains = (server.domains ?? []).join("\n");
        this.ips = (server.expectIPs ?? []).join("\n");
      }
      this.editIndex = index;
      this.modalAdvanced.show();
    },
    remove(server: string | XrayDnsServerObject) {
      if (!confirm("Are you sure you want to remove this server?")) return;
      this.servers.splice(this.servers.indexOf(server), 1);
    },
    show() {
      this.modal.show();
    },

  },
  setup(props) {
    const modal = ref();
    const modalAdvanced = ref();
    const server = ref<XrayDnsServerObject>(new XrayDnsServerObject());
    const domains = ref<string>(server.value.domains?.join('\n') ?? '');
    const ips = ref<string>(server.value.expectIPs?.join('\n') ?? '');
    const editIndex = ref<number | null>(null);

    const getServer = (server: string | XrayDnsServerObject) => {
      if (typeof server === "string") {
        return server;
      }
      return server.address;
    };
    return {
      modal,
      modalAdvanced,
      server,
      domains,
      ips,
      editIndex,
      getServer,
      XrayDnsServerObject
    };
  },
});
</script>

<style scoped></style>
