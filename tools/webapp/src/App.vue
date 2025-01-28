<template>
  <header>
    <h1>XRAYUI Control Panel</h1>
  </header>
  <div class="container">
    <section class="status">
      <h2>Service Status</h2>
      <p>
        Status: <strong>{{ status }}</strong>
      </p>
      <p>
        Running: <strong>{{ isRunning ? "Yes" : "No" }}</strong>
      </p>
      <div class="controls">
        <button @click="startService" :disabled="isRunning" class="button">Start</button>
        <button @click="stopService" :disabled="!isRunning" class="button">Stop</button>
        <button @click="restartService" class="button">Restart</button>
      </div>
    </section>

    <section class="configuration">
      <h2>Configuration</h2>
      <textarea v-model="config" placeholder="Enter your Xray configuration here..."></textarea>
      <button @click="updateConfig">Apply Configuration</button>
    </section>

    <section class="logs">
      <h2>Real-Time Logs</h2>
      <pre>{{ logData }}</pre>
    </section>

    <section v-if="error" class="error">
      <p>Error: {{ error }}</p>
    </section>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref } from "vue";
  import axios from "axios";

  export default defineComponent({
    name: "App",
    setup() {
      const status = ref("");
      const isRunning = ref(false);
      const config = ref("");
      const logData = ref("");
      const error = ref("");

      const startService = async () => {
        alert("start");
      };
      const stopService = async () => {};
      const restartService = async () => {};
      const updateConfig = async () => {};
      return {
        status,
        isRunning,
        config,
        logData,
        error,
        startService,
        stopService,
        restartService,
        updateConfig
      };
    }
  });
</script>

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: Arial, Helvetica, MS UI Gothic, MS P Gothic, Microsoft Yahei UI, sans-serif;
    color: #fff;
    background-color: #21333e;
    padding: 20px;
  }

  header {
    text-align: center;
    margin-bottom: 30px;
  }

  h1 {
    text-shadow: 1px 1px 0px black;
    font-weight: bolder;
    font-size: 2em;
  }

  .container {
    max-width: 600px;
    margin: 0 auto;
  }

  section {
    background-color: #4d595d;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  h2 {
    text-shadow: 1px 1px 0px black;
    margin-bottom: 10px;
    border-bottom: 2px solid white;
    padding-bottom: 5px;
  }

  p {
    margin-bottom: 10px;
  }

  .controls {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .button {
    padding: 0 0.7em 0 0.7em;
    text-shadow: 1px 1px 0px black;
    font-weight: bolder;
    text-shadow: 1px 1px 0px black;
    font-family: Verdana, MS UI Gothic, MS P Gothic, Microsoft Yahei UI, sans-serif;
    color: white;
    background: linear-gradient(#233438 0%, #0f1011 100%);
    border-radius: 8px;
    border: 0;
    padding: 10px 15px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 1em;
    margin: 5px 0;
    border-radius: 5px;
    cursor: pointer;
    flex: 1 1 30%;
    margin-right: 5px;
  }
  .button:hover {
    background: linear-gradient(#09639c 0%, #003047 100%);
  }

  .button:last-child {
    margin-right: 0;
  }

  .button:disabled {
    background-color: #888;
    cursor: not-allowed;
  }

  textarea {
    width: 100%;
    height: 150px;
    padding: 10px;
    margin-top: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
    resize: vertical;
    background-color: #3a4b5e;
    color: #fff;
  }

  pre {
    background-color: #1e2a38;
    padding: 10px;
    border-radius: 5px;
    height: 200px;
    overflow-y: scroll;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .error {
    background-color: #ff4d4d;
    padding: 10px;
    border-radius: 5px;
    text-align: center;
  }
</style>
