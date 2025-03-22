<template>
  <div class="formfontdesc" v-if="logs">
    <table width="100%" bordercolor="#6b8fa3" class="FormTable">
      <thead>
        <tr>
          <td colspan="2">Logs</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>Auto refresh</th>
          <td>
            <input type="checkbox" class="input_option" v-model="follow" />
          </td>
        </tr>
        <tr>
          <th>Logs Type to load</th>
          <td>
            <select class="input_option" v-model="file">
              <option :value="FILE_ACCESS" v-if="logs.access !== 'none'">Access Logs</option>
              <option :value="FILE_ERROR" v-if="logs.error !== 'none'">Error Logs</option>
            </select>
          </td>
        </tr>
        <tr>
          <td class="logs-area-row" colspan="2">
            <pre class="logs-area-content" v-if="file === FILE_ERROR">{{ logsContent }}</pre>
            <div v-if="file === FILE_ACCESS" class="scrollable-table">
              <table class="FormTable logsTable">
                <thead>
                  <tr>
                    <td>Time</td>
                    <td>Source</td>
                    <td>Target</td>
                    <td>Inbound</td>
                    <td>Outbound</td>
                  </tr>
                </thead>
                <tbody class="logs-area-content">
                  <tr v-for="(log, index) in parsedLogs" :key="index">
                    <td>{{ log.time }}</td>
                    <td>
                      <text v-show="!log.source_device">{{ log.source }}</text>
                      <a class="device" v-show="log.source_device" :title="log.source">{{ log.source_device }}</a>
                    </td>
                    <td>{{ log.target }}:{{ log.target_port }}</td>
                    <td>{{ log.inbound }}</td>
                    <td>{{ log.outbound }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
  import { defineComponent, onMounted, ref, watch, computed } from "vue";
  import axios from "axios";
  import engine, { SubmtActions } from "../modules/Engine";
  import { XrayLogObject } from "@/modules/CommonObjects";
  class AccessLogEntry {
    public time?: string;
    public source?: string;
    public source_device?: string;
    public target?: string;
    public target_port?: string;
    public inbound?: string;
    public outbound?: string;

    constructor(match: RegExpMatchArray) {
      // match[1] now contains the full datetime string (e.g., "2025/02/19 17:06:49")
      const utcDateTimeStr = match[1];
      // Convert "YYYY/MM/DD HH:mm:ss" to ISO format "YYYY-MM-DDTHH:mm:ssZ"
      const isoDateTime = utcDateTimeStr.replace(/\//g, "-").replace(" ", "T") + "Z";
      const localDate = new Date(isoDateTime);
      this.time = localDate.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      this.source = match[2];
      this.target = match[3];
      this.target_port = match[4];
      this.inbound = match[5];
      this.outbound = match[6];
    }
  }
  export default defineComponent({
    name: "Logs",
    props: {
      logs: {
        type: XrayLogObject,
        required: true
      }
    },
    setup(props) {
      const follow = ref<boolean>(false);
      const FILE_ACCESS = "/ext/xrayui/xray_access_partial.asp";
      const FILE_ERROR = "/ext/xrayui/xray_error_partial.asp";
      const file = ref<string>(FILE_ACCESS);
      const logs = ref<XrayLogObject>(props.logs);
      const logsContent = ref<string>("");
      const devices = Object.fromEntries(Object.entries(window.xray.router.devices_online).map(([mac, device]) => [device.ip, device]));
      const parsedLogs = ref<AccessLogEntry[]>([]);
      const parseLogs = () => {
        return logsContent.value
          .split("\n")
          .map((line) => {
            // 2025/02/19 17:06:49 from 192.168.1.100:61132 accepted tcp:target:443 [outbound -> inbound]
            const regex = /^(\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}:\d{2})(?:\.\d+)? from (\d{1,3}(?:\.\d{1,3}){3})(?::\d+)? accepted (?:tcp|udp):([^:]+):(\d+) \[([^ ]+) -> ([^\]]+)\]$/;
            const match = line.match(regex);
            if (match) {
              let logentry = new AccessLogEntry(match);
              if (logentry.source) {
                logentry.source_device = devices[logentry.source]?.name;
              }
              return logentry;
            }
            return null;
          })
          .filter((entry) => entry !== null);
      };

      const fetchLogs = async () => {
        if (!follow.value) {
          return;
        }

        await engine.submit(SubmtActions.fetchXrayLogs);
        await setTimeout(async () => {
          const response = await axios.get(file.value);
          logsContent.value = response.data;
          parsedLogs.value = parseLogs();
        }, 1000);
      };

      onMounted(async () => {
        setInterval(async () => {
          await fetchLogs();
        }, 2000);

        watch(
          () => props.logs,
          (val) => {
            logs.value = val;
          }
        );
      });

      return {
        follow,
        file,
        logs,
        logsContent,
        parsedLogs,
        engine,
        FILE_ACCESS,
        FILE_ERROR
      };
    }
  });
</script>
<style scoped lang="scss">
  .scrollable-table {
    max-height: 200px;
    overflow-y: auto;
    display: block;
    scrollbar-width: thin;
    scrollbar-color: #ffffff #576d73;
    table {
      width: 100%;
      border-collapse: collapse;

      th,
      td {
        border-color: #888;
      }
    }
  }

  .device {
    font-weight: bold;
    color: greenyellow;
  }
  .logs-area-row {
    padding: 0;
    margin: 0;
    overflow: hidden;
  }

  .logs-area-content {
    line-height: normal;
    max-height: 200px;
    width: 100%;
    max-width: 738px;
    overflow-x: scroll;
    overflow-y: scroll;
    margin: 0;
    color: #ffffff;
    background-color: #576d73;
    font-family: Courier New, Courier, monospace;
    font-size: 11px;
    scrollbar-width: thin;
    scrollbar-color: #ffffff #576d73;

    td {
      overflow: hidden;
      text-wrap: none;
      white-space: nowrap;
    }
  }
</style>
