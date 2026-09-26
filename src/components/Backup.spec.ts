import { mount, shallowMount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import Backup from '@main/Backup.vue';

jest.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (k: string) => k })
}));

jest.mock('@/modules/Engine', () => {
  const original = jest.requireActual('@/modules/Engine');
  return {
    __esModule: true,
    default: {
      ...original.default,
      submit: jest.fn().mockResolvedValue(undefined),
      executeWithLoadingProgress: jest.fn(async (cb: () => Promise<any>) => {
        await cb();
      }),
      checkLoadingProgress: jest.fn().mockResolvedValue(true)
    },
    SubmitActions: original.SubmitActions
  };
});
import engine, { EngineResponseConfig, SubmitActions } from '@/modules/Engine';

describe('Backup.vue', () => {
  const closeSpy = jest.fn();
  const TeleportStub = defineComponent({
    name: 'teleport',
    setup(_, { slots }) {
      return () => slots.default?.();
    }
  });

  const ModalStub = defineComponent({
    name: 'modal',
    props: { title: String, width: String },
    setup(_, { slots, expose }) {
      expose({
        show: () => {},
        close: closeSpy
      });
      return () => h('div', { 'data-test': 'modal-stub' }, slots.default?.());
    }
  });
  const fakeUiResponse = ref<EngineResponseConfig>();
  fakeUiResponse.value = {
    xray: {
      backups: ['backup1.json', 'backup2.json'],
      ipsec: '',
      debug: false,
      clients_check: false,
      test: '',
      uptime: 0,
      ui_version: '',
      core_version: '',
      profile: '',
      profiles: [],
      github_proxy: '',
      dnsmasq: false,
      logs_max_size: 0,
      logs_dor: false,
      skip_test: false,
      check_connection: false,
      startup_delay: 0,
      sleep_time: 0
    }
  };

  function mountComponent() {
    return mount(Backup, {
      global: {
        provide: {
          uiResponse: fakeUiResponse
        },
        stubs: {
          teleport: TeleportStub,
          modal: ModalStub,
          hint: true
        },
        mocks: {
          $t: (key: string, params?: Record<string, any>) => {
            return key;
          }
        }
      }
    });
  }
  let wrapper: ReturnType<typeof mountComponent>;

  beforeAll(() => {
    HTMLFormElement.prototype.submit = function () {};
    window.showLoading = jest.fn();
    window.confirm = jest.fn(() => true);
  });
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    closeSpy.mockClear();

    wrapper = mountComponent();
    await nextTick();
  });

  it('should create a backup', async () => {
    await wrapper.vm.create_backup();

    await nextTick();
    expect(engine.submit).toHaveBeenCalledTimes(1);
  });

  describe('download', () => {
    let clicked: { href: string | null; download: string }[];
    const answer = (type: string, ok = true) => {
      global.fetch = jest.fn().mockResolvedValue({ ok, headers: { get: (name: string) => (name === 'Content-Type' ? type : null) } }) as unknown as typeof fetch;
    };

    beforeEach(() => {
      clicked = [];
      jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        clicked.push({ href: this.getAttribute('href'), download: this.download });
      });
    });
    afterEach(() => jest.restoreAllMocks());

    it('downloads through the login-protected name and keeps the file name', async () => {
      answer('text/txt');
      await wrapper.vm.download('xrayui-20260926-101500.tar.gz');

      expect(global.fetch).toHaveBeenCalledWith('/ext/xrayui/backup/xrayui-20260926-101500.tar.gz.cab', { method: 'HEAD', cache: 'no-store' });
      expect(clicked).toEqual([{ href: '/ext/xrayui/backup/xrayui-20260926-101500.tar.gz.cab', download: 'xrayui-20260926-101500.tar.gz' }]);
    });

    it('does not save the login page as a backup when the session has expired', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      answer('text/html');
      await wrapper.vm.download('xrayui-20260926-101500.tar.gz');

      expect(clicked).toEqual([]);
    });

    it('still starts the download when the check cannot be made', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
      await wrapper.vm.download('xrayui-20260926-101500.tar.gz');

      expect(clicked).toHaveLength(1);
    });
  });

  it('should render backups list', async () => {
    await wrapper.vm.show_backup_modal();
    await nextTick();

    expect(wrapper.vm.backups).toEqual(fakeUiResponse.value?.xray!.backups!);

    expect(wrapper.text()).toContain('backup1.json');
    expect(wrapper.text()).toContain('backup2.json');

    await wrapper.vm.clearAll();
    await nextTick();

    expect(engine.submit).toHaveBeenCalledTimes(1);
    expect(engine.submit).toHaveBeenCalledWith(SubmitActions.clearBackup, null, expect.any(Number));
  });
});
