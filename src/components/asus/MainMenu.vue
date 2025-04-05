<template>
  <div id="mainMenu"></div>
</template>

<script lang="ts">
  import { defineComponent, onMounted } from 'vue';

  export default defineComponent({
    name: 'MainMenu',
    setup() {
      onMounted(async () => {
        if (typeof window.show_menu === 'function') {
          window.show_menu();
        }
      });

      return {};
    }
  });
</script>
