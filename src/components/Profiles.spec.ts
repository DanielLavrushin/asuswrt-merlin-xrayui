import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import Profiles from '@main/Profiles.vue';
import { EngineResponseConfig } from '@/modules/Engine';

describe('Profiles.vue', () => {
  const ModalStub = defineComponent({
    name: 'Modal',
    setup(_, { slots, expose }) {
      expose({ show: () => {}, close: () => {} });
      return () => h('div', slots.default?.());
    }
  });

  function mountWith(profile: string, profiles: string[] | undefined) {
    const uiResponse = ref({ xray: { profile, profiles } } as EngineResponseConfig);
    return mount(Profiles, {
      global: {
        provide: { uiResponse },
        stubs: { modal: ModalStub, hint: true },
        mocks: { $t: (key: string) => key }
      }
    });
  }
  const options = (wrapper: ReturnType<typeof mountWith>) => wrapper.findAll('select option').map((o) => o.text());

  it('shows the current profile when the backend lists none', () => {
    const wrapper = mountWith('config.json', []);
    expect(options(wrapper)).toEqual(['config']);
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('config.json');
  });

  it('sorts the listed profiles without duplicating the current one', () => {
    expect(options(mountWith('config.json', ['b.json', 'config.json', 'a.json']))).toEqual(['a', 'b', 'config']);
  });

  it('adds the current profile when it is missing from the list', () => {
    expect(options(mountWith('m.json', ['z.json', 'a.json']))).toEqual(['a', 'm', 'z']);
  });

  it('shows the current profile when the list is missing', () => {
    expect(() => mountWith('config.json', undefined)).not.toThrow();
    expect(options(mountWith('config.json', undefined))).toEqual(['config']);
  });

  it('does not mutate the list in the response', () => {
    const profiles = ['b.json', 'config.json', 'a.json'];
    mountWith('config.json', profiles);
    expect(profiles).toEqual(['b.json', 'config.json', 'a.json']);
  });
});
