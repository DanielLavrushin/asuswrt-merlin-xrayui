<template>
  <modal ref="modal" title="Servers">
    <div class="formfontdesc">
      <p>{{ $t('com.DnsServersModal.modal_desc') }}</p>
      <table class="FormTable modal-form-table">
        <thead>
          <tr>
            <td colspan="2">{{ $t('com.DnsServersModal.list') }}</td>
          </tr>
        </thead>
        <tbody>
          <tr class="data_tr">
            <td>
              <input v-model="server.address" class="input_25_table" placeholder="address" v-show="server.address != 'fakedns'" />
              <a href="#" v-show="server.address == 'fakedns'" style="color: #ffcc00" @click.prevent="set_fakedns()">{{ server.address }}</a>
            </td>
            <td>
              <button @click.prevent="show_advanced()" class="button_gen button_gen_small">{{ $t('com.DnsServersModal.advanced') }}</button>
              <button @click.prevent="addSimple()" class="button_gen button_gen_small">{{ $t('labels.add') }}</button>
              <button v-if="hasFakeDns && server.address !== 'fakedns'" @click.prevent="set_fakedns(true)" class="button_gen button_gen_small">
                {{ $t('com.FakeDns.fakedns') }}
              </button>
            </td>
          </tr>
          <tr v-if="!servers.length" class="data_tr">
            <td colspan="2" style="color: #ffcc00">{{ $t('com.DnsServersModal.no_hosts_defined') }}</td>
          </tr>
        </tbody>
        <draggable v-if="servers.length" tag="tbody" :list="servers" item-key="idx" handle=".drag-handle">
          <template #item="{ element: server, index }">
            <tr class="data_tr">
              <td class="drag-handle" aria-label="Drag to reorder"><span class="grip" aria-hidden="true"></span>{{ getServer(server) }}</td>
              <td>
                <button v-if="(typeof server === 'string') == false" @click.prevent="manage(server, index)" class="button_gen button_gen_small">{{ $t('labels.edit') }}</button>
                <button @click.prevent="remove(server)" class="button_gen button_gen_small">&#10005;</button>
                <a class="button_gen button_gen_small" href="#" @click="reorder(server, index)" v-if="index > 0">&#8593;</a>
              </td>
            </tr>
          </template>
        </draggable>
      </table>
    </div>
  </modal>

  <!-- Advanced Modal -->
  <modal ref="modalAdvanced" :title="$t('com.DnsServersModal.modal_server_title')">
    <div class="formfontdesc">
      <table width="100%" class="FormTable modal-form-table">
        <thead>
          <tr>
            <td colspan="2">{{ $t('com.DnsServersModal.modal_server_title2') }}</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>
              {{ $t('com.DnsServersModal.label_address') }}
            </th>
            <td>
              <input v-model="server.address" class="input_25_table" placeholder="address" v-show="server.address != 'fakedns'" />
              <a href="#" v-show="server.address == 'fakedns'" style="color: #ffcc00" @click.prevent="set_fakedns()">{{ server.address }}</a>
              <button v-if="hasFakeDns && server.address !== 'fakedns'" @click.prevent="set_fakedns()" class="button_gen button_gen_small">
                {{ $t('com.FakeDns.fakedns') }}
              </button>
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('com.DnsServersModal.label_client_ip') }}
              <hint v-html="$t('com.DnsServersModal.hint_client_ip')"></hint>
            </th>
            <td>
              <input type="text" v-model="server.clientIP" class="input_25_table" placeholder="client ip" />
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('com.DnsServersModal.label_port') }}
              <hint v-html="$t('com.DnsServersModal.hint_port')"></hint>
            </th>
            <td>
              <input type="number" v-model="server.port" class="input_6_table" placeholder="port" />
              <span class="hint-color">default: 53</span>
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('com.DnsServersModal.label_domain_rules') }}
              <hint v-html="$t('com.DnsServersModal.hint_domain_rules')"></hint>
            </th>
            <td>
              {{ server.rules?.length ?? 0 }} item(s)
              <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click.prevent="manage_rules()" />
              <modal ref="modalRules" :title="$t('com.DnsServersModal.modal_rules_list')" width="400">
                <table class="FormTable modal-form-table">
                  <tbody>
                    <tr v-for="r in rules" :key="r.idx">
                      <td>
                        <input type="checkbox" v-model="server.rules" :value="r" />
                      </td>
                      <td>
                        {{ r.name }}
                        <hint v-html="r.domain?.join('<br/>')" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </modal>
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('com.DnsServersModal.label_domains') }}
              <hint v-html="$t('com.DnsServersModal.hint_domains')"></hint>
            </th>
            <td>
              <div class="textarea-wrapper" v-if="server.rules?.length == 0">
                <textarea v-model="domains" rows="10"></textarea>
              </div>
              <span class="hint-color" v-if="server.rules && server.rules.length > 0">
                {{ $t('com.DnsServersModal.hint_domains_disabled') }}
              </span>
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('com.DnsServersModal.label_expected_ips') }}
              <hint v-html="$t('com.DnsServersModal.hint_expected_ips')"></hint>
            </th>
            <td>
              <div class="textarea-wrapper" v-if="server.rules?.length == 0">
                <textarea v-model="ips" rows="10"></textarea>
              </div>
              <span class="hint-color" v-if="server.rules && server.rules.length > 0">
                {{ $t('com.DnsServersModal.hint_ips_disabled') }}
              </span>
            </td>
          </tr>
          <tr>
            <th>
              {{ $t('com.DnsServersModal.label_skip_fallback') }}
              <hint v-html="$t('com.DnsServersModal.hint_skip_fallback')"></hint>
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
  import { computed, defineComponent, ref } from 'vue';
  import { XrayDnsServerObject, XrayRoutingRuleObject } from '@/modules/CommonObjects';
  import Modal from '@main/Modal.vue';
  import Hint from '@main/Hint.vue';
  import xrayConfig from '@/modules/XrayConfig';
  import { plainToInstance } from 'class-transformer';
  import draggable from 'vuedraggable';

  export default defineComponent({
    name: 'DnsServersModal',
    components: {
      Modal,
      Hint,
      draggable
    },
    props: {
      servers: {
        type: Array<string | XrayDnsServerObject>,
        required: true
      }
    },
    setup(props) {
      const modal = ref();
      const modalAdvanced = ref();
      const modalRules = ref();
      const server = ref<XrayDnsServerObject>(new XrayDnsServerObject());
      const domains = ref<string>(server.value.domains?.join('\n') ?? '');
      const ips = ref<string>(server.value.expectIPs?.join('\n') ?? '');
      const editIndex = ref<number | null>(null);
      const rules = ref<XrayRoutingRuleObject[]>([]);
      const getServer = (server: string | XrayDnsServerObject) => {
        if (typeof server === 'string') {
          return server;
        }
        return server.address;
      };

      const addSimple = () => {
        if (!server.value?.address) return;
        if (server.value.address.trim()) {
          props.servers.push(server.value.address.trim());
          server.value.address = '';
        }
      };

      const reorder = (server: string | XrayDnsServerObject, index: number) => {
        props.servers.splice(index, 1);
        props.servers.splice(index - 1, 0, server);
      };

      const remove = (server: string | XrayDnsServerObject) => {
        if (!confirm('Are you sure you want to remove this server?')) return;
        props.servers.splice(props.servers.indexOf(server), 1);
      };
      const show = () => {
        modal.value.show();
      };

      const show_advanced = (s?: XrayDnsServerObject) => {
        if (!s) {
          server.value = new XrayDnsServerObject();
        }
        rules.value = xrayConfig.routing?.rules?.filter((r) => !r.isSystem() && (r.domain || r.ip)) ?? [];
        modalAdvanced.value.show();
      };

      const manage = (s: string | XrayDnsServerObject, index: number) => {
        server.value = new XrayDnsServerObject();
        if (typeof s === 'string') {
          server.value.address = s;
        } else {
          server.value = { ...s };
          domains.value = (server.value.domains ?? []).join('\n');
          ips.value = (server.value.expectIPs ?? []).join('\n');
        }
        editIndex.value = index;
        show_advanced(server.value);
      };

      const addOrUpdateComplex = () => {
        server.value.domains = domains.value.split('\n').filter(Boolean);
        server.value.expectIPs = ips.value.split('\n').filter(Boolean);
        const serverInstance = plainToInstance(XrayDnsServerObject, { ...server.value });
        if (editIndex.value !== null) {
          props.servers[editIndex.value] = serverInstance;
        } else {
          props.servers.push(serverInstance);
        }

        server.value = new XrayDnsServerObject();
        domains.value = '';
        ips.value = '';
        editIndex.value = null;

        modalAdvanced.value.close();
      };

      const manage_rules = () => {
        modalRules.value.show();
      };

      const hasFakeDns = computed(() => {
        return xrayConfig.fakedns && xrayConfig.fakedns.length > 0 && !props.servers.some((s) => typeof s === 'string' && s === 'fakedns');
      });
      const set_fakedns = (isSimple?: boolean) => {
        server.value.address = server.value.address === 'fakedns' ? '' : 'fakedns';
        if (isSimple) {
          addSimple();
        }
      };
      return {
        modal,
        modalAdvanced,
        modalRules,
        server,
        domains,
        ips,
        editIndex,
        rules,
        hasFakeDns,
        manage,
        reorder,
        remove,
        show,
        addSimple,
        manage_rules,
        getServer,
        addOrUpdateComplex,
        show_advanced,
        set_fakedns,
        XrayDnsServerObject
      };
    }
  });
</script>

<style scoped></style>
