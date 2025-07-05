jest.mock('@modules/Engine', () => {
  const original = jest.requireActual('@modules/Engine');
  const SubmitActions = {
    initResponse: 'initResponse'
  };

  // 3) the engine object with the properties your setup uses
  const engine = {
    xrayConfig: {}, // for provide('xrayConfig', …)
    loadXrayConfig: jest.fn().mockResolvedValue(undefined), // for await engine.loadXrayConfig()
    submit: jest.fn().mockResolvedValue(undefined), // for await engine.submit(...)
    delay: jest.fn().mockResolvedValue(undefined), // for await engine.delay(...)
    getXrayResponse: jest.fn().mockResolvedValue(new original.EngineResponseConfig())
  };

  return {
    ...original,
    __esModule: true,
    default: engine,
    EngineResponseConfig: original.EngineResponseConfig,
    SubmitActions: { ...original.SubmitActions, ...SubmitActions }
  };
});

import { shallowMount } from '@vue/test-utils';
import App from './App.vue';

describe('App.vue', () => {
  it('renders correctly', () => {
    const wrapper = shallowMount(App);
    expect(wrapper.exists()).toBe(true);
  });
});
