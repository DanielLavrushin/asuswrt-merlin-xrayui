<template>
    <tr>
        <th>{{ $t('components.HeadersMapping.label_headers_row') }}</th>
        <td>
            <div class="textarea-wrapper">
                <spot v-for="(obj, index) in headers" :key="index">
                    <input type="text" class="input_15_table" v-model="obj.key"
                        :placeholder="$t('components.HeadersMapping.pl_header_key')" /> : <input type="text"
                        class="input_20_table" v-model="obj.value"
                        :placeholder="$t('components.HeadersMapping.pl_header_value')" />
                    <input class="button_gen button_gen_small" type="button" value="&#10005;"
                        @click.prevent="remove_header(obj)" />
                </spot>
                <span class="row-buttons">
                    <input class="button_gen button_gen_small" type="button" :value="$t('labels.add')"
                        @click.prevent="add_new_header()" />
                </span>
            </div>
        </td>
    </tr>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { XrayOptions } from "../../modules/Options";

export default defineComponent({
    name: "Http",
    props: {
        headersMap: Object,
    },
    emits: ["on:header:update"],
    methods: {
        remove_header(obj: any) {
            this.headers.splice(this.headers.indexOf(obj), 1);
        },
        add_new_header() {
            this.headers.push({ key: "", value: "" });
        },
    },
    setup(props, { emit }) {

        const headersMap = ref(props.headersMap ?? {});
        const headers = ref<{ key: string; value: any }[]>([]);

        if (headersMap.value) {
            headers.value = Object.entries(headersMap.value).map(([key, value]) => ({ key, value, }));
        }

        watch(
            headers,
            (newHeaders) => {
                if (headersMap.value) {
                    headersMap.value = Object.fromEntries(
                        newHeaders.map(({ key, value }) => [key, value])
                    );
                    emit("on:header:update", headersMap.value);
                }
            },
            { deep: true }
        );

        return { headersMap, headers, methods: XrayOptions.httpMethods };
    },
});
</script>
