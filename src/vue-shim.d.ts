declare module '*.vue' {
  import { DefineComponent } from 'vue';
  /* eslint-disable-next-line */
  const component: DefineComponent<object, object, any>;
  export default component;
}

declare module '*.json' {
  const value: unknown;
  export default value;
}
