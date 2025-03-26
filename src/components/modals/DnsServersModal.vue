<template>
  <modal ref="modal" title="Servers">
    <div class="formfontdesc">
      <p>{{ $t('components.DnsServersModal.modal_desc') }}</p>
      <table width="100%" bordercolor="#6b8fa3" class="FormTable SettingsTable tableApi_table">
        <thead>
          <tr>
            <td colspan="2">{{ $t('components.DnsServersModal.list') }}</td>
          </tr>
        </thead>
        <tbody>
          <tr class="row_title">
            <th>{{ $t('components.DnsServersModal.server') }}</th>
            <th></th>
          </tr>
          <tr class="row_title">
            <td>
              <input v-model="server.address" class="input_25_table" placeholder="address" />
            </td>
            <td>
              <button @click.prevent="advanced()" class="button_gen button_gen_small">{{ $t('components.DnsServersModal.advanced') }}</button>
              <button @click.prevent="addSimple()" class="button_gen button_gen_small">{{ $t('labels.add') }}</button>
            </td>
          </tr>
          <tr v-if="!servers.length" class="data_tr">
            <td colspan="2" style="color: #ffcc00">{{ $t('components.DnsServersModal.no_hosts_defined') }}</td>
          </tr>
          <tr v-for="(server, index) in servers" :key="index" class="data_tr">
            <td>{{ getServer(server) }}</td>
            <td>
              <button v-if="(typeof server === 'string') == false" @click.prevent="manage(server, index)" class="button_gen button_gen_small">{{ $t('labels.edit') }}</button>
              <button @click.prevent="remove(server)" class="button_gen button_gen_small">&#10005;</button>
              <a class="button_gen button_gen_small" href="#" @click="reorder(server, index)" v-if="index > 0">&#8593;</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </modal>

  <!-- Advanced Modal -->
  <modal ref="modalAdvanced" :title="$t('components.DnsServersModal.modal_server_title')" width="500px">
    <div class="formfontdesc">
      <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
        <thead>
          <tr>
            <td colspan="2">{{ $t('components.DnsServersModal.modal_server_title2') }}</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>
              {{ $t('components.DnsServersModal.label_address') }}
            </th>
            <td>
              <input type="text" v-model="server.address" class="input_25_table" placeholder="address" />
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('components.DnsServersModal.label_client_ip') }}
              <hint v-html="$t('components.DnsServersModal.hint_client_ip')"></hint>
            </th>
            <td>
              <input type="text" v-model="server.clientIP" class="input_25_table" placeholder="client ip" />
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('components.DnsServersModal.label_port') }}
              <hint v-html="$t('components.DnsServersModal.hint_port')"></hint>
            </th>
            <td>
              <input type="number" v-model="server.port" class="input_6_table" placeholder="port" />
              <span class="hint-color">default: 53</span>
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('components.DnsServersModal.label_domains') }}
              <hint v-html="$t('components.DnsServersModal.hint_domains')"></hint>
            </th>
            <td>
              <div class="textarea-wrapper">
                <textarea v-model="domains" rows="10"></textarea>
              </div>
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('components.DnsServersModal.label_expected_ips') }}
              <hint v-html="$t('components.DnsServersModal.hint_expected_ips')"></hint>
            </th>
            <td>
              <div class="textarea-wrapper">
                <textarea v-model="ips" rows="10"></textarea>
              </div>
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('components.DnsServersModal.label_skip_fallback') }}
              <hint v-html="$t('components.DnsServersModal.hint_skip_fallback')"></hint>
            </th>
            <td>
              <input type="checkbox" v-model="server.skipFallback" />
              <span class="hint-color">default: false</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" :value="$t('labels.save')" @click.prevent="addOrUpdateComplex()" />
    </template>
  </modal>
</template>
<script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { XrayDnsServerObject } from '../../modules/CommonObjects';
  import Modal from '../Modal.vue';
  import Hint from '../Hint.vue';

  export default defineComponent({
    name: 'DnsServersModal',
    components: {
      Modal,
      Hint
    },
    props: {
      servers: {
        type: Array<string | XrayDnsServerObject>,
        required: true
      }
    },
    methods: {
      addSimple() {
        if (!this.server?.address) return;
        if (this.server.address.trim()) {
          this.servers.push(this.server.address.trim());
          this.server.address = '';
        }
      },
      reorder(server: string | XrayDnsServerObject, index: number) {
        this.servers.splice(index, 1);
        this.servers.splice(index - 1, 0, server);
      },
      addOrUpdateComplex() {
        this.server.domains = this.domains.split('\n').filter(Boolean);
        this.server.expectIPs = this.ips.split('\n').filter(Boolean);

        if (this.editIndex !== null) {
          this.servers[this.editIndex] = { ...this.server };
        } else {
          this.servers.push({ ...this.server });
        }

        this.server = new XrayDnsServerObject();
        this.domains = '';
        this.ips = '';
        this.editIndex = null;
        this.modalAdvanced.close();
      },
      advanced() {
        this.modalAdvanced.show();
      },
      manage(server: string | XrayDnsServerObject, index: number) {
        if (typeof server === 'string') {
          this.server = new XrayDnsServerObject();
          this.server.address = server;
        } else {
          this.server = { ...server };
          this.domains = (server.domains ?? []).join('\n');
          this.ips = (server.expectIPs ?? []).join('\n');
        }
        this.editIndex = index;
        this.modalAdvanced.show();
      },
      remove(server: string | XrayDnsServerObject) {
        if (!confirm('Are you sure you want to remove this server?')) return;
        this.servers.splice(this.servers.indexOf(server), 1);
      },
      show() {
        this.modal.show();
      }
    },
    setup(props) {
      const modal = ref();
      const modalAdvanced = ref();
      const server = ref<XrayDnsServerObject>(new XrayDnsServerObject());
      const domains = ref<string>(server.value.domains?.join('\n') ?? '');
      const ips = ref<string>(server.value.expectIPs?.join('\n') ?? '');
      const editIndex = ref<number | null>(null);

      const getServer = (server: string | XrayDnsServerObject) => {
        if (typeof server === 'string') {
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
    }
  });
</script>

<style scoped></style>
