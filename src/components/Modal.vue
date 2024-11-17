<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="isVisible" @mousedown.self="close">
      <div class="modal-content" @click.stop :style="{ width: width + 'px' }">
        <header class="modal-header">
          <h2>
            <slot name="title">
              {{ title }}
            </slot>
          </h2>
          <button class="close-btn" @click="close">×</button>
        </header>
        <div class="modal-body">
          <slot></slot>
        </div>
        <footer class="modal-footer">
          <span class="row-buttons">
            <slot name="footer">
              <button @click.prevent="close" class="button_gen button_gen_small">Close</button>
            </slot>
          </span>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "Modal",
  emits: ["close"],
  props: {
    title: {
      type: String,
      default: "Modal Title",
    },
    width: {
      type: String,
      default: "755",
    },
  },
  methods: {
    onClosePressed() { },
    async show(onClose: () => void) {
      this.isVisible = true;
      this.onClosePressed = onClose;

    },
    async close() {
      this.isVisible = false;

      this.$emit("close");
      if (this.onClosePressed && typeof this.onClosePressed === "function") {
        this.onClosePressed();
      }
    },
  },
  setup() {
    const isVisible = ref(false);
    return { isVisible };
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
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-overlay:not(:last-child) {
  background-color: rgba(0, 0, 0, 0) !important;
  backdrop-filter: initial !important;
}

.modal-content {
  background-color: #4d595d;
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

.modal-body>>>.modal-form-table {
  width: 100%;
}

.modal-body>>>.modal-form-table td {
  text-align: left;
  line-height: 23px;
}
</style>
