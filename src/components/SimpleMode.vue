<template>
  <div class="simple-mode">
    <fieldset v-if="inbound">
      <legend>Inbound Settings</legend>
      <div class="form-row">
        {{ $t('com.InboundCommon.label_listen') }}
        <hint v-html="$t('com.InboundCommon.hint_listen')"></hint>
        <input
          type="text"
          maxlength="15"
          class="input_20_table"
          v-model="inbound.listen"
          onkeypress="return validator.isIPAddr(this, event);"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
        />
      </div>
      <div class="form-row">
        {{ $t('com.InboundCommon.label_port') }}
        <hint v-html="$t('com.InboundCommon.hint_port')"></hint>
        <input
          type="number"
          maxlength="5"
          class="input_6_table"
          v-model="inbound.port"
          autocorrect="off"
          autocapitalize="off"
          onkeypress="return validator.isNumber(this,event);"
        />
      </div>
      <div class="form-row" v-if="inbound.streamSettings && inbound.streamSettings.sockopt">
        <label for="simple-port">Enable Transparent Proxy</label>
        <input type="checkbox" v-model="tproxy" />
      </div>
      <div class="form-row" v-if="inbound.streamSettings && inbound.streamSettings.sockopt">
        <span class="row-buttons">
          <a class="button_gen button_gen_small" href="#" @click.prevent="show_sniffing(inbound)">
            {{ $t('labels.sniffing') }}
          </a>
        </span>
      </div>
    </fieldset>
    <fieldset v-if="proxy">
      <legend>Outbound Settings</legend>

      <div class="form-row">
        {{ $t(`com.${proxyTransCode}.label_address`) }}
        <hint v-html="$t(`com.${proxyTransCode}.hint_address`)"></hint>
        <input type="text" maxlength="255" class="input_20_table" v-model="proxyAddress" autocomplete="off" autocorrect="off" autocapitalize="off" />
      </div>

      <div class="form-row">
        {{ $t(`com.${proxyTransCode}.label_port`) }}
        <hint v-html="$t(`com.${proxyTransCode}.hint_port`)"></hint>
        <input type="number" maxlength="5" class="input_6_table" v-model="proxyPort" onkeypress="return validator.isNumber(this,event);" autocorrect="off" autocapitalize="off" />
      </div>

      <div class="form-row">
        User Id
        <input type="text" maxlength="255" class="input_20_table" v-model="proxyUserId" autocomplete="off" autocorrect="off" autocapitalize="off" />
      </div>

      <div class="form-row">
        User Flow
        <select v-model="proxyUserFlow" class="input_12_table">
          <option v-for="flow in flows" :value="flow" :key="flow">{{ flow }}</option>
        </select>
      </div>
    </fieldset>
    <fieldset v-if="proxy">
      <legend>{{ $t('com.Routing.title') }}</legend>
      <div class="form-row">
        Proxy
        <textarea v-model="routingProxyDomain"></textarea>
      </div>
      <div class="form-row">
        Block
        <textarea v-model="routingBlockDomain"></textarea>
      </div>

      <span class="hint-color"><a href="https://github.com/v2fly/domain-list-community/tree/master/data" target="_blank">community geosite database</a></span>
    </fieldset>
  </div>
</template>
<script lang="ts">
  import engine from '@/modules/Engine';
  import { XrayDokodemoDoorInboundObject, XrayInboundObject } from '@/modules/InboundObjects';
  import { XrayProtocol } from '@/modules/Options';
  import { computed, defineComponent, ref, watch } from 'vue';
  import Hint from '@main/Hint.vue';
  import { XrayBlackholeOutboundObject, XrayFreedomOutboundObject, XrayOutboundObject, XrayVlessOutboundObject } from '@/modules/OutboundObjects';
  import { XrayVmessClientObject } from '@/modules/ClientsObjects';
  import { IProtocolType } from '@/modules/Interfaces';
  import { XrayRoutingRuleObject } from '@/modules/CommonObjects';

  export default defineComponent({
    name: 'SimpleMode',
    components: {
      Hint
    },
    setup(props, { emit }) {
      const show_sniffing = async (inbound: XrayInboundObject<IProtocolType>) => {
        emit('show-sniffing', inbound);
      };

      const config = ref(engine.xrayConfig);

      const inbound = computed(() => config.value.inbounds.find((i) => i.protocol === XrayProtocol.DOKODEMODOOR) as XrayInboundObject<XrayDokodemoDoorInboundObject> | undefined);

      const proxy = computed(
        () =>
          config.value.outbounds.find((i) => i.protocol === XrayProtocol.VLESS || i.protocol === XrayProtocol.VMESS) as
            | XrayOutboundObject<XrayVlessOutboundObject | XrayVmessClientObject>
            | undefined
      );

      const blackhole = computed(() => config.value.outbounds.find((i) => i.protocol === XrayProtocol.BLACKHOLE) as XrayOutboundObject<XrayBlackholeOutboundObject> | undefined);

      const freedom = computed(() => config.value.outbounds.find((i) => i.protocol === XrayProtocol.FREEDOM) as XrayOutboundObject<XrayFreedomOutboundObject> | undefined);

      const tproxy = computed({
        get: () => inbound.value?.streamSettings?.sockopt?.tproxy === 'tproxy',

        set: (val: boolean) => {
          if (!inbound.value?.streamSettings?.sockopt) return;
          inbound.value.streamSettings.sockopt.tproxy = val ? 'tproxy' : undefined;
        }
      });

      const firstVnext = computed(() => {
        const settings = proxy.value?.settings as any;
        return settings && Array.isArray(settings.vnext) ? settings.vnext[0] : undefined;
      });

      const proxyAddress = computed({
        get: () => firstVnext.value?.address ?? '',
        set: (val: string) => {
          if (firstVnext.value) firstVnext.value.address = val.trim();
        }
      });

      const proxyPort = computed({
        get: () => firstVnext.value?.port ?? 0,
        set: (val: number | string) => {
          if (firstVnext.value) firstVnext.value.port = Number(val) || 0;
        }
      });

      const proxyUserId = computed({
        get: () => firstVnext.value?.users?.[0]?.id ?? '',
        set: (val: string) => {
          if (firstVnext.value && firstVnext.value.users && firstVnext.value.users.length > 0) {
            firstVnext.value.users[0].id = val.trim();
          }
        }
      });

      const proxyUserFlow = computed({
        get: () => firstVnext.value?.users?.[0]?.flow ?? '',
        set: (val: string) => {
          if (firstVnext.value && firstVnext.value.users && firstVnext.value.users.length > 0) {
            firstVnext.value.users[0].flow = val.trim();
          }
        }
      });

      const proxyTransCode = computed(() => {
        if (!proxy.value) return '';
        const proto = proxy.value.protocol;
        switch (proto) {
          case XrayProtocol.VLESS:
            return 'VlessOutbound';
          case XrayProtocol.VMESS:
            return 'VmessOutbound';
          default:
            return '';
        }
      });

      const getOrCreateRoutingRule = (ruleName: string, outboundTag: string) => {
        if (!config.value.routing) config.value.routing = { domainStrategy: 'AsIs', rules: [] } as any;
        let rule = config.value.routing?.rules?.find((r) => r.name === ruleName) as XrayRoutingRuleObject | undefined;
        if (!rule) {
          rule = new XrayRoutingRuleObject();
          rule.name = ruleName;
          rule.type = 'field';
          rule.outboundTag = outboundTag || '';
          rule.domain = [];
          config.value.routing?.rules?.push(rule);
        }
        rule.outboundTag = outboundTag || '';
        return rule;
      };

      const routingProxyRule = computed(() => {
        return getOrCreateRoutingRule('sys:simple.proxy', proxy.value?.tag!);
      });

      const routingBlockRule = computed(() => {
        return getOrCreateRoutingRule('sys:simple.block', blackhole.value?.tag!);
      });

      const routingProxyDomain = computed({
        get: () => (routingProxyRule.value.domain ?? []).join('\n'),
        set: (val: string) => {
          routingProxyRule.value.domain = val.split('\n').map((line) => line.trimEnd());
        }
      });

      const routingBlockDomain = computed({
        get: () => (routingBlockRule.value.domain ?? []).join('\n'),
        set: (val: string) => {
          routingBlockRule.value.domain = val.split('\n').map((line) => line.trimEnd());
        }
      });

      return {
        routingProxyRule,
        routingBlockRule,
        routingProxyDomain,
        routingBlockDomain,
        inbound,
        tproxy,
        proxy,
        proxyAddress,
        proxyPort,
        proxyTransCode,
        proxyUserId,
        proxyUserFlow,
        flows: ['xtls-rprx-vision', 'xtls-rprx-vision-udp443'],
        show_sniffing
      };
    }
  });
</script>
<style lang="scss">
  :root {
    --c-bg: rgb(40, 58, 70);
    --c-panel: #475a5f;
    --c-border: #374045;
    --c-accent: rgb(0, 114, 0);
    --c-text: #e5e7eb;
    --c-dark: #1f2a30;
  }
</style>
<style scoped lang="scss">
  .simple-mode {
    background: var(--c-panel);
    padding: 1rem;
    border: 1px solid var(--c-border);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    color: var(--c-text);
    font-size: 0.95rem;

    fieldset {
      border: 0;
      padding: 1.25rem 1rem 1rem;
      margin: 0;

      position: relative;
      background: var(--c-bg);
      border-radius: 0.5rem;
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    legend {
      position: relative;
      padding: 0 0.5rem;
      margin-left: 0;

      font-size: 1.05rem;
      font-weight: 600;
      color: var(--c-text);
      letter-spacing: 0.2px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 0.25rem 0.75rem;
      align-items: center;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }

      label {
        user-select: none;
      }

      input[type='text'] {
        width: 100%;
        max-width: 24rem;
        padding: 0.35rem 0.5rem;
        border-radius: 0.3rem;
        border: 1px solid var(--c-border);
        background: var(--c-dark);
        color: var(--c-text);
        transition: border-color 0.2s ease, box-shadow 0.2s ease;

        &:focus {
          outline: none;
          border-color: var(--c-border);
          box-shadow: 0 0 0 1px var(--c-border);
        }
      }

      input[type='number'] {
        width: 100%;
        max-width: 8rem;
        padding: 0.35rem 0.5rem;
        border-radius: 0.3rem;
        border: 1px solid var(--c-border);
        background: var(--c-dark);
        color: var(--c-text);
        transition: border-color 0.2s ease, box-shadow 0.2s ease;

        &:focus {
          outline: none;
          border-color: var(--c-border);
          box-shadow: 0 0 0 1px var(--c-border);
        }
      }

      input[type='checkbox'] {
        appearance: none;
        width: 2.5rem;
        height: 1.25rem;
        outline: 1px solid var(--c-panel);
        border-radius: 1.25rem;
        position: relative;
        cursor: pointer;
        transition: background 0.2s ease;

        &::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 1rem;
          height: 1rem;
          background: var(--c-text);
          border-radius: 50%;
          transition: transform 0.2s ease;
        }

        &:checked {
          background: var(--c-accent);

          &::before {
            transform: translateX(1.25rem);
          }
        }

        &:focus-visible {
          outline: 1px solid var(--c-border);
          outline-offset: 2px;
        }
      }
      select {
        width: 100%;
        max-width: 12rem;
        border-radius: 0.3rem;
        border: 1px solid var(--c-border);
        background: var(--c-dark);
        height: 30px;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
        &:focus {
          outline: none;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
</style>
