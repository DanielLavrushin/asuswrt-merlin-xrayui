<template>
  <modal ref="modal" title="Hosts List">
    <div class="formfontdesc">
      <table width="100%" bordercolor="#6b8fa3" class="FormTable SettingsTable tableApi_table">
        <thead>
          <tr>
            <td colspan="3">Addresses</td>
          </tr>
        </thead>
        <tbody>
          <tr class="row_title">
            <th>Domain</th>
            <th>Address(s) split with ;</th>
            <th style="min-width:120px"></th>
          </tr>
          <tr class="row_title">
            <td>
              <input v-model="host.domain" class="input_25_table" placeholder="domain" />
            </td>
            <td>
              <input v-model="host.address" type="text" class="input_25_table" placeholder="address" />
            </td>
            <td>
              <button class="add_btn" @click.prevent="add"></button>
            </td>
          </tr>
          <tr v-if="!hostsList.length" class="data_tr">
            <td colspan="3" style="color: #ffcc00">No hosts defined</td>
          </tr>
          <tr v-for="(host, index) in hostsList" :key="index" class="data_tr">
            <td>{{ host.domain }}</td>
            <td>{{ host.address }}</td>
            <td>
              <button @click.prevent="remove(host)" class="button_gen button_gen_small">remove</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </modal>
</template>
<script lang="ts">
import { defineComponent, onMounted, ref, watch } from "vue";
import Modal from "../Modal.vue";

export default defineComponent({
  name: "DnsHostsModal",
  components: {
    Modal,
  },
  props: {
    hosts: {
      type: Object,
      required: true,
    },
  },
  methods: {
    add() {
      if (this.host.domain && this.host.address) {
        let addr = this.host.address.indexOf(";") > -1 ? this.host.address.split(";") : this.host.address;
        this.hostsList.push({ domain: this.host.domain, address: addr });
        this.host.domain = "";
        this.host.address = "";
        this.syncHosts();
      }
    },
    remove(host: any) {
      this.hostsList.splice(this.hostsList.indexOf(host), 1);
      this.syncHosts();
    },
    show() {
      this.modal.show();
    },
    syncHosts() {
      const updatedHosts: { [key: string]: string | string[] } = {};
      this.hostsList.forEach((host) => {
        updatedHosts[host.domain] =
          typeof host.address === "string" && host.address.includes(";")
            ? host.address.split(";")
            : host.address;
      });
      this.$emit("update:hosts", updatedHosts);
    },
  },
  setup(props) {
    const modal = ref();
    const host = ref({ domain: "", address: "" });

    const hostsList = ref<any[]>([]);

    watch(
      () => props.hosts,
      (newHosts) => {
        hostsList.value = Object.keys(newHosts).map((key) => ({
          domain: key,
          address: Array.isArray(newHosts[key])
            ? newHosts[key].join(";")
            : newHosts[key],
        }));
      },
      { immediate: true, deep: true }
    );

    return {
      modal,
      host,
      hostsList
    };
  },
});
</script>

<style scoped></style>
