<template>
  <header>
    <h1>{{ hello }}</h1>
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
      const hello = "Hello, XRAYUI Web App!";
      const data = ref("");
      const resp = ref("");
      const doRequest = async () => {
        const response = await axios.post("/cgi-bin/test.sh", {
          data: data.value
        });
        resp.value = response.data;
      };
      return { hello, data, resp, doRequest };
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
    font-family: Arial, sans-serif;
    background-color: #f5f5f5;
    color: #333;
    padding: 20px;
  }

  header {
    text-align: center;
    margin-bottom: 30px;
  }

  h1 {
    font-size: 2em;
    color: #4caf50;
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
