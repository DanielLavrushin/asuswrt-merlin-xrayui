<template>
  <top-banner />
  <loading />
  <main-form />
  <asus-footer />
</template>

<script lang="ts">
  import { defineComponent, ref, onMounted, provide } from 'vue';
  import TopBanner from './components/asus/TopBanner.vue';
  import Loading from './components/asus/Loading.vue';
  import AsusFooter from './components/asus/Footer.vue';
  import MainForm from './components/MainForm.vue';

  import engine, { EngineResponseConfig, SubmitActions } from '@modules/Engine';

  export default defineComponent({
    name: 'App',
    components: {
      TopBanner,
      Loading,
      MainForm,
      AsusFooter
    },
    setup() {
      const uiResponse = ref(new EngineResponseConfig());
      window.scrollTo = () => {};

      const xrayConfig = engine.xrayConfig;
      provide('xrayConfig', xrayConfig);

      onMounted(async () => {
        try {
          // Ensure window.show_menu exists before calling
          if (typeof window.show_menu === 'function') {
            window.show_menu();
          }
          await engine.loadXrayConfig();
          await engine.submit(SubmitActions.initResponse, null, 0);
          // Use our delay helper instead of setTimeout inside an async function.
          await engine.delay(1000);
          uiResponse.value = await engine.getXrayResponse();
        } catch (error) {
          console.error('Error during initialization:', error);
        }
      });

      provide('uiResponse', uiResponse);

      return {
        engine,
        xrayConfig
      };
    }
  });
</script>

<style lang="scss">
  #Loading,
  #overDiv {
    z-index: 9999;
  }

  .hint {
    color: $c_yellow !important;
    text-decoration: underline;
    cursor: pointer;

    &.tag {
      text-decoration: none;
    }
  }

  input[type='checkbox'],
  input[type='radio'] {
    vertical-align: bottom;
  }

  input::placeholder {
    color: $c_yellow;
    font-weight: bold;
    opacity: 0.5;
    font-style: italic;
  }

  .hint-color {
    color: $c_yellow;
    float: right;
    margin-right: 5px;

    a {
      text-decoration: underline;
      color: $c_yellow;
    }
  }

  .hint-small {
    font-size: 8pt;
  }

  .FormTable {
    margin-bottom: 14px;

    // Proxy label styles
    .proxy-label {
      color: white;
      padding: 2px 10px;
      border-radius: 4px;
      margin-left: 4px;
      font-weight: bold;
      background-color: #929ea1;
      box-shadow: 0 0 2px #000;

      &.tag {
        border: 1px solid $c_yellow;
        text-decoration: none;
        background: transparent;
        color: $c_yellow;

        &:hover {
          box-shadow: 0 0 5px $c_yellow;
        }
      }
      &.reality {
        background-color: rgb(95, 1, 95);
      }
      &.tls {
        background-color: rgb(136, 5, 5);
      }
      &.tcp {
        background-color: rgb(35, 46, 46);
      }
      &.kcp {
        background-color: rgb(0, 114, 0);
      }
      &.ws {
        background-color: rgb(2, 0, 150);
      }
      &.xhttp {
        background-color: rgb(153, 130, 0);
      }
      &.grpc {
        background-color: rgb(207, 78, 2);
      }
      &.httpupgrade {
        background-color: rgb(2, 82, 119);
      }
      &.splithttp {
        background-color: rgb(94, 10, 59);
      }

      &.tproxy {
        background: rgb(207, 78, 2);
      }
    }

    td,
    th {
      vertical-align: middle;
    }

    td {
      span.label {
        color: white;
        padding: 3px 5px;
        border-radius: 4px;
        margin: 4px 0 0 0;
        font-weight: bold;
      }

      span {
        &.label-error {
          background-color: red;
        }
        &.label-success {
          background-color: green;
        }
        &.label-warning {
          background-color: $c_yellow;
          color: #596e74;
        }
      }

      &.height-overflow {
        max-height: 140px;
        overflow: hidden;
        overflow-y: scroll;
        scrollbar-width: thin;
        scrollbar-color: #ffffff #576d73;
      }

      // Hint colors inside td
      .hint-color {
        margin-left: 5px;
        vertical-align: middle;
      }
    }

    .drag-handle {
      cursor: grab;
      user-select: none;
      padding-left: 0.25rem;

      .grip {
        display: inline-block;
        width: 0.8rem;
        height: 1rem;
        background-image: radial-gradient(white 1px, transparent 1px);
        background-size: 4px 4px;
        background-repeat: repeat-y;
        opacity: 0.55;
        transition: opacity 0.15s ease-in-out;
        vertical-align: text-top;
      }

      &:hover .grip {
        opacity: 0.85;
      }
      &:active,
      &.dragging {
        cursor: grabbing;
      }
    }
    .sortable-chosen {
      td,
      th {
        background: #2e2e2e;
        color: #fc0;
      }
    }

    .vuedraggable-ghost {
      opacity: 0.4 !important;
    }
  }

  .row-buttons {
    float: right;

    label {
      margin-right: 10px;
      vertical-align: middle;
    }
  }

  .button_gen_small {
    min-width: auto;
    border-radius: 4px;
    padding: 3px 5px 5px 5px;
    margin: 2px;
    font-weight: normal;
    height: 20px;
    font-size: 11px;
    color: white !important;
    text-decoration: none !important;
  }

  .input_100_table {
    width: 70%;
  }

  .textarea-wrapper {
    margin: 0 10px 0 2px;
  }

  textarea {
    color: #ffffff;
    background: #596d74;
    border: 1px solid #929ea1;
    font-family: Courier New, Courier, monospace;
    font-size: 13px;
    width: 100%;
    padding: 3px;
    box-sizing: content-box;
    height: 100px;
  }

  .formfontdesc {
    margin-left: 0;
    p {
      text-align: left;
      margin-bottom: 10px;
    }
  }

  .button_info {
    background: initial;
    background-color: $c_yellow;
    font-weight: bold;
    border-radius: 10px;
    padding: 3px 8px 5px 8px;
  }

  select {
    vertical-align: middle;

    > option[disabled] {
      color: $c_yellow;
    }
  }

  .xrayui-hint {
    display: none;
  }

  #overDiv {
    blockquote {
      margin: 10px;
      padding: 0 0 0 1em;
      border-left: 3px solid #ffcc00;
    }
  }

  .flex-checkbox {
    border: none !important;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;

    > * {
      flex: 0 1 calc(25%);
    }

    &.flex-checkbox-25 {
      > * {
        flex: 0 1 calc(25%);
      }
    }

    &.flex-checkbox-50 {
      > * {
        flex: 0 1 calc(50%);
      }
    }
  }

  blockquote {
    margin: 10px 0;
    padding: 5px;
    border-left: 3px solid $c_yellow;
  }

  /* ROG OVERRIDES  */
  .xrayui-rog {
    textarea {
      background: rgb(62, 3, 13) !important;
      border-color: rgb(145, 7, 31) !important;
    }
    .button_gen_small:hover {
      height: 20px !important;
      width: auto !important;
      min-width: auto !important;
      border-radius: 4px !important;
      padding: 3px 5px 5px 5px !important;
      margin: 2px !important;
      font-weight: normal !important;
      font-size: 12px !important;
    }
    .xray-modal-content {
      background-color: #000 !important;
    }
    .logs-area-content {
      background-color: #000 !important;
      scrollbar-color: #ffffff rgb(145, 7, 31) !important;
    }

    .FormTable {
      tr:hover th {
        text-shadow: 2px 2px 25px rgb(145, 7, 31) !important;
      }

      tr:hover > * {
        border-left-color: rgb(145, 7, 31) !important;
      }

      tr:hover > :last-child {
        border-right-color: rgb(145, 7, 31) !important;
      }
    }

    .configArea {
      background-color: rgb(62, 3, 13) !important;
      text-align: left;
      height: 500px;
      overflow: scroll;
      scrollbar-width: thin;
      scrollbar-color: #ffffff rgb(145, 7, 31) !important;
    }
  }

  /* TUF OVERRIDES  */
  .xrayui-tuf {
    textarea {
      color: #ffffff !important;
      background-color: rgb(55, 55, 55) !important;
      border-color: rgb(76, 76, 76) !important;
    }
    .button_gen_small {
      width: initial !important;
      &:hover {
        height: 20px !important;
        width: auto !important;
        min-width: auto !important;
        border-radius: 4px !important;
        padding: 3px 5px 5px 5px !important;
        margin: 2px !important;
        font-weight: normal !important;
        font-size: 12px !important;
      }
    }
    .xray-modal-content {
      background-color: rgba(38, 38, 38, 0.9) !important;
    }
    .logs-area-content {
      background-color: rgba(38, 38, 38, 0.9) !important;
      scrollbar-color: #ffffff rgb(17, 17, 17) !important;
    }

    .FormTable {
      font-family: Arial, Helvetica, sans-serif !important;
      tr:hover th {
        text-shadow: 2px 2px 25px rgb(255, 165, 35) !important;
      }

      tr:hover > * {
        border-left-color: rgb(255, 165, 35) !important;
      }

      tr:hover > :last-child {
        border-right-color: rgb(255, 165, 35) !important;
      }
    }

    .configArea {
      background-color: rgba(68, 79, 83, 0.9) !important;
      text-align: left;
      height: 500px;
      overflow: scroll;
      scrollbar-width: thin;
      scrollbar-color: rgba(68, 79, 83, 0.9) rgba(38, 38, 38, 0.9) !important;
    }
    .hint-color {
      color: rgb(8, 255, 240) !important;
    }
  }
</style>
