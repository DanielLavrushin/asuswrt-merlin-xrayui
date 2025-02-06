declare module "*.vue" {
  import { DefineComponent } from "vue";
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const component: DefineComponent<object, object, any>;
  export default component;
}

declare module "*.json" {
  const value: any;
  export default value;
}
