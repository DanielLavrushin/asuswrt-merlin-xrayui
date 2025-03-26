<template>
  <tr>
    <th>{{ $t('components.ImportConfig.import_config_file') }}</th>
    <td>
      <span class="row-buttons">
        <a class="button_gen button_gen_small" href="#" @click.prevent="show">{{ $t('labels.import') }}</a>
      </span>
      <import-config-modal ref="parserModal" v-model:config="config"></import-config-modal>
    </td>
  </tr>
</template>

<script>
  import { defineComponent, ref } from 'vue';
  import Modal from './Modal.vue';
  import ImportConfigModal from './modals/ImportConfigModal.vue';
  import { XrayObject } from '@/modules/XrayConfig';

  export default defineComponent({
    name: 'ImportConfig',
    components: {
      Modal,
      ImportConfigModal
    },
    props: {
      config: XrayObject
    },
    setup(props) {
      const parserModal = ref();
      const show = () => {
        parserModal.value.show();
      };
      return {
        parserModal,
        config: props.config,
        show
      };
    }
  });
</script>
<style scoped></style>
