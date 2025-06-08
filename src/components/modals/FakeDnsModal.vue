<template>
  <modal ref="modal" :title="$t('com.FakeDns.label')" width="500">
    <div class="formfontdesc">
      <table width="100%" class="FormTable modal-form-table">
        <thead>
          <tr>
            <td>
              {{ $t('com.FakeDns.label_ip_pool') }}
              <hint v-html="$t('com.FakeDns.hint_ip_pool')"></hint>
            </td>
            <td>
              {{ $t('com.FakeDns.label_pool_size') }}
              <hint v-html="$t('com.FakeDns.hint_pool_size')"></hint>
            </td>
            <td width="1"></td>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(s, idx) in servers" :key="idx">
            <td>
              <input type="text" class="input_20_table" v-model.trim="s.ipPool" />
            </td>
            <td>
              <input type="number" class="input_20_table" v-model.number="s.poolSize" min="1" max="65535" />
            </td>
            <td>
              <button class="button_gen button_gen_small" @click.prevent="removeRow(idx)" :title="$t('labels.delete')">&#10005;</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <button class="button_gen button_gen_small" @click.prevent="addRow">{{ $t('labels.add') }}</button>
      <input class="button_gen button_gen_small" type="button" :value="$t('labels.save')" @click.prevent="save" />
    </template>
  </modal>
</template>

<script lang="ts">
  import { defineComponent, ref, watch } from 'vue';
  import { cloneDeep } from 'lodash-es';
  import Modal from '@main/Modal.vue';
  import Hint from '@main/Hint.vue';
  import { XrayFakeDnsObject } from '@/modules/CommonObjects';

  export default defineComponent({
    name: 'FakeDnsModal',
    components: { Modal, Hint },
    props: {
      servers: {
        type: Array as () => XrayFakeDnsObject[],
        required: true
      }
    },
    emits: ['update:servers'],
    setup(props, { emit }) {
      const modal = ref<InstanceType<typeof Modal>>();
      const servers = ref<XrayFakeDnsObject[]>(cloneDeep(props.servers));

      watch(
        () => props.servers,
        (value) => (servers.value = cloneDeep(value))
      );

      const show = () => modal.value?.show();

      const addRow = () => servers.value.push({ ipPool: '', poolSize: 65535 } as XrayFakeDnsObject);

      const removeRow = (idx: number) => servers.value.splice(idx, 1);

      const save = () => {
        const cleaned = servers.value.filter((s) => s.ipPool?.trim() !== '' && Number(s.poolSize) > 0);
        emit('update:servers', cleaned);
        modal.value?.close();
      };

      return { modal, servers, show, addRow, removeRow, save };
    }
  });
</script>
