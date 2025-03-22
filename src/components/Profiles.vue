<template>
  <tr v-if="profile">
    <th>
      {{ $t("components.Profiles.manager") }}
      <hint v-html="$t('components.Profiles.hint')"></hint>
    </th>
    <td>
      <select v-model="profile" class="input_option" @change="change_profile()">
        <option v-for="p in profiles" :value="p" :key="p">{{ p.replace(".json", "") }}</option>
      </select>
      <input class="button_gen button_gen_small" type="button" :value="$t('labels.manage')" @click.prevent="manage()" />
      <modal ref="modal" :title="$t('components.Profiles.modal_title')" width="400">
        <table class="FormTable modal-form-table">
          <tbody>
            <tr v-for="p in profiles" :key="p">
              <td>{{ p }}</td>
              <td>
                <input v-if="p !== uiResponse.xray.profile" class="button_gen button_gen_small" type="button" value="&#10005;" :title="$t('labels.delete')" @click.prevent="deleteProfile(p)" />
              </td>
            </tr>
            <tr>
              <td>
                <input v-model="profile_name" class="input_25_table" placeholder="new profile name" />
              </td>
              <td>
                <input class="button_gen button_gen_small" type="button" :value="$t('labels.add')" @click.prevent="add" />
              </td>
            </tr>
          </tbody>
        </table>
      </modal>
    </td>
  </tr>
</template>
<script lang="ts">
  import { defineComponent, ref, watch, inject, Ref } from "vue";
  import Modal from "./Modal.vue";
  import Hint from "./Hint.vue";
  import engine, { EngineResponseConfig, SubmtActions } from "../modules/Engine";

  export default defineComponent({
    name: "Profiles",
    components: {
      Modal,
      Hint
    },
    props: {},
    setup(props) {
      const profile = ref();
      const modal = ref();
      const profile_name = ref("");
      const profiles = ref<string[]>([]);
      const uiResponse = inject<Ref<EngineResponseConfig>>("uiResponse")!;

      watch(
        () => uiResponse?.value,
        (newVal) => {
          if (newVal) {
            if (newVal?.xray) {
              profile.value = newVal.xray.profile;
              profiles.value = newVal.xray.profiles;
            }
          }
        }
      );
      const change_profile = async () => {
        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmtActions.changeProfile, { profile: profile.value }, 3000);
        });
      };
      const delete_profile = async (p: string) => {
        await engine.executeWithLoadingProgress(async () => {
          await engine.submit(SubmtActions.deleteProfile, { profile: p }, 1000);
        }, false);
      };
      const manage = () => {
        profile_name.value = "";
        modal.value.show();
      };
      const deleteProfile = async (p: string) => {
        if (confirm("Are you sure you want to delete config profile " + p + "?")) {
          profiles.value = profiles.value.filter((x) => x !== p);
          await delete_profile(p);
        }
      };
      const add = async () => {
        profile_name.value =
          profile_name.value
            .trim()
            .replace(/[^a-zA-Z0-9]/g, "_")
            .replace(".json", "") + ".json";
        if (profiles.value.indexOf(profile_name.value) === -1) {
          profiles.value.push(profile_name.value);
          modal.value.close();
          profile.value = profile_name.value;
          await change_profile();
        } else {
          alert("Profile already exists");
        }
      };
      return {
        profile,
        profile_name,
        profiles,
        modal,
        uiResponse,
        manage,
        change_profile,
        delete_profile,
        add,
        deleteProfile
      };
    }
  });
</script>
<style scoped lang="scss"></style>
