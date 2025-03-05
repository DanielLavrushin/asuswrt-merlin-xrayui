<template>
  <!-- Render slot content normally -->
  <span class="xrayui-hint" ref="elm" v-show="visible">
    <slot></slot>
  </span>
</template>

<script>
  import { defineComponent, onMounted, ref } from "vue";
  import markdownit from "markdown-it";

  export default defineComponent({
    name: "Hint",
    props: {
      title: {
        type: String
      }
    },
    setup(props) {
      const elm = ref(null);
      const visible = ref(true);
      const content = ref("");
      const md = markdownit({ html: true, breaks: true });

      const showTooltip = () => {
        if (props.title) {
          window.overlib(content.value, OFFSETX, 0, RIGHT, DELAY, 400, WIDTH, 400, STICKY, CAPTION, props.title);
        } else {
          window.overlib(content.value, OFFSETX, 0, RIGHT, DELAY, 400, WIDTH, 400, STICKY);
        }
      };

      const hideTooltip = () => {
        const overDiv = document.getElementById("overDiv");
        if (overDiv && overDiv.parentElement) {
          overDiv.parentElement.removeChild(overDiv);
        }
      };

      onMounted(() => {
        const parent = elm.value?.parentElement;
        content.value = md.render(elm.value.innerHTML);
        if (parent) {
          parent.style.cursor = "help";
          parent.addEventListener("mouseover", showTooltip);
          parent.addEventListener("mouseout", hideTooltip);
        }
      });

      return {
        elm,
        visible,
        content,
        showTooltip,
        hideTooltip
      };
    }
  });
</script>

<style scoped>
  /* No extra styling needed */
</style>
