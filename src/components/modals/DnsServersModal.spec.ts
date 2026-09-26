import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import DnsServersModal from '@modal/DnsServersModal.vue';

const ModalStub = defineComponent({
  name: 'ModalStub',
  setup(_, { slots, expose }) {
    expose({ show: () => undefined, close: () => undefined });
    return () => h('div', slots.default?.());
  }
});

describe('DnsServersModal rule domains', () => {
  const mountModal = () =>
    shallowMount(DnsServersModal, {
      props: { servers: [] },
      global: { stubs: { modal: ModalStub, hint: true, draggable: true, teleport: true }, mocks: { $t: (k: string) => k } }
    }).vm as unknown as { domainHint: (list?: string[]) => string };

  it('shows domains as plain text', () => {
    expect(mountModal().domainHint(['domain:<img src=x onerror=alert(1)>', 'full:a&b.example', 'geosite:"x"'])).toBe(
      'domain:&lt;img src=x onerror=alert(1)&gt;<br/>full:a&amp;b.example<br/>geosite:&quot;x&quot;'
    );
  });

  it('keeps ordinary domains unchanged', () => {
    expect(mountModal().domainHint(['geosite:google', 'domain:example.com'])).toBe('geosite:google<br/>domain:example.com');
    expect(mountModal().domainHint(undefined)).toBe('');
  });
});
