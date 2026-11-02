import { plainToInstance } from 'class-transformer';
import engine from '@modules/Engine';
import { XrayObject } from '@modules/XrayConfig';
import { XrayBurstObservatoryObject, XrayBurstObservatoryPingConfigObject } from '@modules/CommonObjects';

const roundTrip = (plain: object) => JSON.parse(JSON.stringify(engine.prepareServerConfig(engine.hydrateConfig(plainToInstance(XrayObject, { inbounds: [], outbounds: [], ...plain })))));

describe('burstObservatory', () => {
  it('keeps a hand-written burstObservatory as is', () => {
    const burstObservatory = { subjectSelector: ['p-', 'q-'], pingConfig: { destination: 'https://probe.example/204', connectivity: 'http://local.example/204', interval: '30s', sampling: 3, timeout: '10s' } };
    const config = engine.hydrateConfig(plainToInstance(XrayObject, { inbounds: [], outbounds: [], burstObservatory }));
    expect(config.burstObservatory).toBeInstanceOf(XrayBurstObservatoryObject);
    expect(config.burstObservatory?.pingConfig).toBeInstanceOf(XrayBurstObservatoryPingConfigObject);
    expect(roundTrip({ burstObservatory }).burstObservatory).toEqual(burstObservatory);
  });

  it('does not add defaults to a partial pingConfig and keeps the pingConfig Xray requires', () => {
    expect(roundTrip({ burstObservatory: { subjectSelector: ['p-'], pingConfig: { interval: '1m' } } }).burstObservatory).toEqual({ subjectSelector: ['p-'], pingConfig: { interval: '1m' } });
    expect(roundTrip({ burstObservatory: { subjectSelector: ['p-'] } }).burstObservatory).toEqual({ subjectSelector: ['p-'], pingConfig: {} });
  });

  it('leaves a configuration with a plain observatory unchanged', () => {
    const observatory = { subjectSelector: ['p-'], probeUrl: 'https://probe.example/204', probeInterval: '45s' };
    const saved = roundTrip({ observatory });
    expect(saved.observatory).toEqual(observatory);
    expect(saved).not.toHaveProperty('burstObservatory');
  });

  it('keeps the empty prefix that selects every outbound', () => {
    expect(roundTrip({ burstObservatory: { subjectSelector: [''], pingConfig: {} } }).burstObservatory).toEqual({ subjectSelector: [''], pingConfig: {} });
  });

  it('keeps selectors as written apart from duplicates, and drops empty ping fields and invalid sampling', () => {
    const burst = XrayBurstObservatoryObject.create(['', 'p-', 'p-', 'q-']);
    burst.pingConfig!.connectivity = '  ';
    burst.pingConfig!.sampling = '' as unknown as number;
    burst.normalize();
    expect(burst.subjectSelector).toEqual(['', 'p-', 'q-']);
    expect(burst.pingConfig).toEqual({ destination: XrayBurstObservatoryPingConfigObject.defaultDestination, interval: '1m', timeout: '5s' });
  });
});
