<template>
  <modal ref="modal" title="Traffic sniffing">
    <div class="formfontdesc">
      <p>Traffic sniffing is mainly used in transparent proxies</p>
      <table width="100%" bordercolor="#6b8fa3" class="FormTable modal-form-table">
        <thead>
          <tr>
            <td colspan="2">Settings</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>
              Sniffing
              <hint>
                Whether to enable traffic sniffing.
              </hint>
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
              Metadata only
              <hint>
                When enabled, only use the connection's metadata to sniff the target address. In this case, sniffer
                other than `fakedns` (including `fakedns+others`) cannot be activated.
                <p>
                  If metadata-only is `disabled`, the client must send data before the proxy server actually establishes
                  the connection. This behavior is incompatible with protocols that require the server to initiate the
                  first message, such as the SMTP protocol.
                </p>
              </hint>
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
              Destination Override
              <hint>
                When the traffic is of a specified type, reset the destination of the current connection to the target
                address included in the list.

                ["fakedns+others"] is equivalent to ["http", "tls", "quic", "fakedns"], and when the IP address is in
                the FakeIP range but no domain records are hit, http, tls, and quic will be used for matching. This
                option is only effective when metadataOnly is set to false.
              </hint>
            </th>
            <td>
              <slot v-for="(opt, index) in destOptions" :key="index">
                <input type="checkbox" v-model="sniffing.destOverride" class="input" :value="opt"
                  :id="'destopt-' + index" />
                <label :for="'destopt-' + index" class="settingvalue">{{ opt.toUpperCase() }}</label>
              </slot>
            </td>
          </tr>
          <tr v-if="sniffing.enabled && sniffing.destOverride && sniffing.destOverride.length > 0">
            <th>
              Route only
              <hint>
                Use the sniffed domain name for routing only, and keep the target address as the IP address. The default
                value is `false`.

                This option requires `destOverride` to be enabled.

                <blockquote>
                  When it is possible to ensure that the proxied connection can obtain correct DNS resolution, by using
                  `routeOnly` and enabling `destOverride`, and setting the routing matching strategy `domainStrategy` to
                  `AsIs`,
                  it is possible to achieve domain and IP separation without DNS resolution throughout the process. The
                  IP used when encountering an IP rule match is the original IP of the domain.
                </blockquote>
              </hint>
            </th>
            <td>
              <input type="checkbox" v-model="sniffing.routeOnly" class="input" :id="'snifrouteonly'" />
              <span class="hint-color">default: false</span>
            </td>
          </tr>
          <tr v-if="sniffing.enabled">
            <th>Domains Excluded
              <hint>
                A list of domain names. If the traffic sniffing result matches a domain name in this list, the target
                address will not be reset.
                <blockquote>
                  **Warning**
                  Currently, `domainsExcluded` does not support domain name matching in the routing sense. This option
                  may
                  change in the future and cross-version compatibility is not guaranteed.
                </blockquote>
              </hint>
            </th>
            <td>
              <a v-if="sniffing.domainsExcluded">{{ sniffing.domainsExcluded.length }} domain(s)</a>
              <input class="button_gen button_gen_small" type="button" value="Manage"
                @click.prevent="manage_domains_exclude" />
              <modal width="400" ref="modalDomains" title="A list of domain names">
                <div class="formfontdesc">
                  <p>If the traffic sniffing result matches a domain name in this list, the target address will not be
                    reset.</p>
                  <div class="textarea-wrapper">
                    <textarea v-model="domainsExludedContent" class="input_100" rows="8"></textarea>
                  </div>
                </div>
              </modal>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <template v-slot:footer>
      <input class="button_gen button_gen_small" type="button" value="Save" @click.prevent="save" />
    </template>
  </modal>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import Modal from "../Modal.vue";
import { XraySniffingObject } from "../../modules/CommonObjects";
import { XrayInboundObject } from "../../modules/InboundObjects";
import { IProtocolType } from "../../modules/Interfaces";
import Hint from "../Hint.vue";

export default defineComponent({
  name: "SniffingModal",
  components: {
    Modal,
    Hint
  },
  props: {
    sniffing: XraySniffingObject,
  },
  methods: {
    show(inbound: XrayInboundObject<IProtocolType>) {
      inbound.sniffing = this.sniffing = inbound.sniffing ?? new XraySniffingObject();
      this.modal.show();
    },
    save() {
      this.$emit("save", this.sniffing);
      this.modal.close();
    },
  },
  setup(props) {
    const sniffing = ref<XraySniffingObject>(props.sniffing ?? new XraySniffingObject());
    const destOptions = XraySniffingObject.destOverrideOptions;
    const domainsExludedContent = ref<string>("");
    const modalDomains = ref();
    const modal = ref();

    watch(
      () => sniffing.value.metadataOnly,
      (newmetadataOnly) => {
        if (newmetadataOnly) {
          sniffing.value.destOverride = [];
        }
      },
      { deep: true }
    );

    watch(
      () => sniffing.value.destOverride?.length,
      (val: number | undefined) => {
        val = val ?? 0;
        if (sniffing) {
          sniffing.value.routeOnly = sniffing.value.routeOnly && val > 0;
        }
      },
      { deep: true }
    );

    const manage_domains_exclude = () => {
      domainsExludedContent.value = sniffing.value.domainsExcluded?.join("\n") ?? "";
      modalDomains.value.show(() => {
        sniffing.value.domainsExcluded = domainsExludedContent.value.split("\n").filter((x) => x.trim() !== "");
      });
    };

    return {
      sniffing,
      destOptions,
      domainsExludedContent,
      modal,
      modalDomains,
      manage_domains_exclude
    };
  },
});
</script>
<style scoped></style>
