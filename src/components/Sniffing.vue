<template>
  <tr>
    <th>
      <a class="hintstyle" href="javascript:void(0);"
        onmouseover="hint(this,'Traffic sniffing is mainly used in transparent proxies.');">Sniffing</a>
    </th>
    <td>
      <input type="radio" v-model="sniffing.enabled" class="input" :value="true" :id="'snifon'" />
      <label class="settingvalue" :for="'snifon'">Enabled</label>
      <input type="radio" v-model="sniffing.enabled" class="input" :value="false" :id="'snifoff'" />
      <label class="settingvalue" :for="'snifoff'">Disabled</label>
    </td>
  </tr>
  <tr v-if="sniffing.enabled">
    <th>
      <a class="hintstyle" href="javascript:void(0);"
        onmouseover="hint(this,'When enabled, only use the connection\'s metadata to sniff the target address. ');">Metadata
        only</a>
    </th>
    <td>
      <input type="radio" v-model="sniffing.metadataOnly" class="input" :value="true" :id="'metaon'" />
      <label class="settingvalue" :for="'metaon'">Enabled</label>
      <input type="radio" v-model="sniffing.metadataOnly" class="input" :value="false" :id="'metaoff'" />
      <label class="settingvalue" :for="'metaoff'">Disabled</label>
    </td>
  </tr>
  <tr v-if="sniffing.enabled && !sniffing.metadataOnly">
    <th>
      <a class="hintstyle" href="javascript:void(0);"
        onmouseover="hint(this,'When the traffic is of a specified type, reset the destination of the current connection to the target address included in the list.');">Destination
        Override</a>
    </th>
    <td>
      <slot v-for="(opt, index) in destOptions" :key="index">
        <input type="checkbox" v-model="sniffing.destOverride" class="input" :value="opt" :id="'destopt-' + index" />
        <label :for="'destopt-' + index" class="settingvalue">{{ opt.toUpperCase() }}</label>
      </slot>
    </td>
  </tr>
  <tr v-if="sniffing.enabled && sniffing.destOverride.length > 0">
    <th>
      <a class="hintstyle" href="javascript:void(0);"
        onmouseover="hint(this,'Use the sniffed domain name for routing only, and keep the target address as the IP address. ');">Route
        only</a>
    </th>
    <td>
      <input type="checkbox" v-model="sniffing.routeOnly" class="input" :id="'snifrouteonly'" />
      <span class="hint-color">default: false</span>
    </td>
  </tr>
  <tr v-if="sniffing.enabled">
    <th>
      <a class="hintstyle" href="javascript:void(0);"
        onmouseover="hint(this,'A list of domain names. If the traffic sniffing result matches a domain name in this list, the target address will not be reset.');">Domains
        Excluded</a>
    </th>
    <td>
      <a>{{ sniffing.domainsExcluded.length }} domain(s)</a>
      <input class="button_gen button_gen_small" type="button" value="Manage" @click.prevent="manage_domains_exclude" />
      <modal width="400" ref="modalRef" title="A list of domain names">
        <p>If the traffic sniffing result matches a domain name in this list, the target address will not be reset.</p>
        <div class="textarea-wrapper">
          <textarea v-model="domainsExludedContent" class="input_100" rows="8"></textarea>
        </div>
      </modal>
    </td>
  </tr>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import Modal from "./Modal.vue";
import xrayConfig, { XraySniffingObject } from "../modules/XrayConfig";

export default defineComponent({
  name: "Sniffing",
  components: {
    Modal,
  },
  setup() {
    const sniffing = ref<XraySniffingObject>(xrayConfig?.inbounds[0]?.sniffing ?? new XraySniffingObject());
    const destOptions = XraySniffingObject.destOverrideOptions;
    const domainsExludedContent = ref<string>("");
    const modalRef = ref();

    watch(
      () => xrayConfig?.inbounds[0]?.sniffing,
      (newSniffing) => {
        sniffing.value = newSniffing ?? new XraySniffingObject();
        if (!newSniffing) {
          xrayConfig.inbounds[0].sniffing = sniffing.value;
        }
      },
      { immediate: true }
    );

    watch(
      () => xrayConfig?.inbounds[0]?.sniffing?.metadataOnly,
      (newmetadataOnly) => {
        if (newmetadataOnly) {
          sniffing.value.destOverride = [];
        }
      },
      { deep: true }
    );
    watch(
      () => xrayConfig?.inbounds[0]?.sniffing?.destOverride.length,
      (val: number | undefined) => {
        val = val ?? 0;
        if (xrayConfig.inbounds[0].sniffing) {
          xrayConfig.inbounds[0].sniffing.routeOnly = xrayConfig.inbounds[0].sniffing?.routeOnly && val > 0;
        }
      },
      { deep: true }
    );

    const manage_domains_exclude = () => {
      domainsExludedContent.value = sniffing.value.domainsExcluded.join("\n");
      modalRef.value.show(() => {
        sniffing.value.domainsExcluded = domainsExludedContent.value.split("\n").filter((x) => x.trim() !== "");
      });
    };

    return { sniffing, destOptions, domainsExludedContent, modalRef, manage_domains_exclude };
  },
});
</script>
<style scoped></style>
