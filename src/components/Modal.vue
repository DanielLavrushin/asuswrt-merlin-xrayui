<template>
  <div class="modal-overlay" v-if="isVisible" @click="close">
    <div class="modal-content" @click.stop>
      <header class="modal-header">
        <h2>{{ title }}</h2>
        <button class="close-btn" @click="close">×</button>
      </header>
      <div class="modal-body">
        <slot></slot>
        <!-- Content of the modal will be inserted here -->
      </div>
      <footer class="modal-footer">
        <button @click.prevent="close" class="button_gen button_gen_small">Close</button>
      </footer>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref } from "vue";

  export default defineComponent({
    name: "Modal",
    props: {
      title: {
        type: String,
        default: "Modal Title",
      },
    },
    setup() {
      const isVisible = ref(false);
      let onClosePressed = () => {};
      const show = (onClose: () => void) => {
        isVisible.value = true;

        onClosePressed = onClose;
      };

      const close = () => {
        isVisible.value = false;
        if (onClosePressed) {
          onClosePressed();
        }
      };

      return { isVisible, show, close };
    },
  });
</script>

<style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background-color: #2b373b;
    border-radius: 5px;
    width: 650px;
    max-width: 100%;
    padding: 5px;
    position: relative;
    border: 1px solid #222;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: 5px;
    font-weight: bold;
    line-height: 140%;
    color: #ffffff;
  }

  .modal-header h2 {
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
  }

  .modal-body {
    text-align: center;
    margin-top: 20px;
  }

  .modal-footer {
    margin-top: 20px;
    text-align: center;
  }

  .modal-body >>> textarea {
    color: #ffffff;
    background-color: #576d73;
    border: 2px ridge #777;
    border-style: solid;
    font-family: Courier New, Courier, monospace;
    font-size: 13px;
    width: 500px;
  }
</style>
