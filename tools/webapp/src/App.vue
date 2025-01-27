<template>
  <header>
    <h1>XRAYUI</h1>
  </header>
  <div class="container">
    <form id="postForm">
      <label for="data">Enter Data:</label>
      <textarea i placeholder="Type your data here..." v-model="data"></textarea>
      <a @click="doRequest" class="button">Send POST Request</a>
    </form>

    <div class="response" id="response">
      {{ resp }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import axios from "axios";

export default defineComponent({
  name: "App",
  setup() {
    const data = ref("");
    const resp = ref("");
    const doRequest = async () => {
      const response = await axios.post("/cgi-bin/test.sh", {
        data: data.value
      });
      resp.value = response.data;
    };
    return { data, resp, doRequest };
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
}

.container {
  max-width: 600px;
  margin: 0 auto;
}

.button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 15px 25px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 1em;
  margin: 10px 0;
  border-radius: 5px;
  cursor: pointer;
  width: 100%;
}

button:hover {
  background-color: #45a049;
}

textarea {
  width: 100%;
  height: 100px;
  padding: 10px;
  margin-top: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
  resize: vertical;
}

.response {
  background-color: #fff;
  padding: 15px;
  margin-top: 20px;
  border-radius: 5px;
  border: 1px solid #ccc;
  word-wrap: break-word;
  white-space: pre-wrap;
}
</style>
