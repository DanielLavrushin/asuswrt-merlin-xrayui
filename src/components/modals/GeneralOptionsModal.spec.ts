jest.mock('@/modules/Engine', () => {
  const actual = jest.requireActual('@/modules/Engine');
  return {
    ...actual,
    __esModule: true,
    default: {
      submit: jest.fn(),
      executeWithLoadingProgress: jest.fn(async (action: () => Promise<void>) => action())
    }
  };
});

import { ref } from 'vue';
import engine, { EngineResponseConfig, SubmitActions } from '@/modules/Engine';
import { XrayObject } from '@/modules/XrayConfig';
import { XrayUiGlobal } from '@/global';

// jest resolves './GeneralOptionsModal' to the .vue file (moduleFileExtensions lists vue first)
const useGeneralOptions = (jest.requireActual('./GeneralOptionsModal.ts') as typeof import('./GeneralOptionsModal')).default;

describe('GeneralOptionsModal auto-restart options', () => {
  beforeEach(() => {
    window.xray = { router: {}, server: {}, custom_settings: { xray_startup: 'y' } } as unknown as XrayUiGlobal;
    (engine.submit as jest.Mock).mockClear();
  });

  it('is off by default, with a 5 minute check, 3 attempts and a 10 minute delay', () => {
    const { options, autorestart_intervals } = useGeneralOptions(new XrayObject(), ref(new EngineResponseConfig()));

    expect(options.autorestart).toBe(false);
    expect(options.autorestart_interval).toBe(5);
    expect(options.autorestart_retries).toBe(3);
    expect(options.autorestart_delay).toBe(10);
    expect(autorestart_intervals).toContain(options.autorestart_interval);
  });

  it('shows the saved values and sends them back on save', async () => {
    const ui = ref({ xray: { autorestart: true, autorestart_interval: 2, autorestart_retries: 0, autorestart_delay: 15 } } as EngineResponseConfig);
    const { options, hydrate, persist } = useGeneralOptions(new XrayObject(), ui);

    expect([options.autorestart, options.autorestart_interval, options.autorestart_retries, options.autorestart_delay]).toEqual([true, 2, 0, 15]);

    options.autorestart_retries = 5;
    await persist();
    expect(engine.submit).toHaveBeenCalledWith(
      SubmitActions.generalOptionsApply,
      expect.objectContaining({ autorestart: true, autorestart_interval: 2, autorestart_retries: 5, autorestart_delay: 15 })
    );

    hydrate();
    expect(options.autorestart_retries).toBe(0);
  });
});
