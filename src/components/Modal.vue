<template>
  <Teleport to="#xrayui-modals">
    <div class="xray-modal-overlay" v-if="isVisible" @mousedown.self="close" role="dialog" aria-modal="true">
      <div class="xray-modal-content" @click.stop :style="{ width }">
        <header class="xray-modal-header">
          <h2>
            <slot name="title">
              {{ title }}
            </slot>
          </h2>
          <button class="close-btn" @click="close" aria-label="Close modal">×</button>
        </header>
        <div class="xray-modal-body">
          <slot></slot>
        </div>
        <footer class="xray-modal-footer">
          <span class="row-buttons">
            <slot name="footer">
              <button @click.prevent="close" class="button_gen button_gen_small">
                {{ $t('labels.close') }}
              </button>
            </slot>
          </span>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
  import { defineComponent, ref, onBeforeUnmount } from 'vue';

  export default defineComponent({
    name: 'Modal',
    emits: ['close'],
    props: {
      title: {
        type: String,
        default: 'Modal Title'
      },
      width: {
        type: String,
        default: '755'
      }
    },
    setup(props, { emit }) {
      const isVisible = ref(false);
      let onCloseCallback: () => void = () => {};

      const show = (onClose?: () => void) => {
        isVisible.value = true;
        console.log('Modal shown, width:', props.width);
        if (onClose) onCloseCallback = onClose;
        // Add Escape key listener when modal is shown
        document.addEventListener('keydown', handleKeyDown);
      };

      const close = () => {
        isVisible.value = false;
        emit('close');
        if (typeof onCloseCallback === 'function') {
          onCloseCallback();
        }
        // Remove Escape key listener when modal is closed
        document.removeEventListener('keydown', handleKeyDown);
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          close();
        }
      };

      onBeforeUnmount(() => {
        document.removeEventListener('keydown', handleKeyDown);
      });

      return { isVisible, show, close, width: props.width.endsWith('%') ? props.width : `${props.width.replace('px', '')}px` };
    }
  });
</script>
<style scoped lang="scss">
  .xray-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(6px);
    z-index: 400;

    display: flex;
    justify-content: center;
    overflow-y: auto;
    padding: 2rem 1rem;
    align-items: center;

    &:not(:last-child) {
      background-color: rgba(0, 0, 0, 0) !important;
      backdrop-filter: initial !important;
    }

    .xray-modal-content {
      background-color: #4d595d;
      border-radius: 5px;
      max-width: 100%;
      padding: 5px;
      position: relative;
      border: 1px solid #222;

      width: clamp(320px, var(--modal-width, 755px), 90vw);
      max-height: calc(100vh - 4rem);
      overflow-y: auto;

      .xray-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-left: 5px;
        font-weight: bold;
        line-height: 140%;
        color: #ffffff;

        h2 {
          margin: 0;
        }
      }
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }

    .xray-modal-body {
      text-align: center;
      margin-top: 10px;

      :deep(a) {
        color: #ffcc00;
        text-decoration: underline;
      }

      :deep(.modal-form-table) {
        width: 100%;

        td {
          text-align: left;
        }
      }
    }

    .xray-modal-footer {
      margin-top: 20px;
      text-align: center;
    }
  }
</style>
