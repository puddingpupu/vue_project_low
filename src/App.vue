<template>
  <div class="app">
    <Editor v-model="state" :formData="formData"> </Editor>


    <!-- <Range :start="0" :end="100"></Range> -->
  </div>
</template>

<script>
import { provide, ref } from "vue";
import data from "./data.json";
import Editor from "./packages/editor";
import {registerConfig as config} from './utils/editor-config'
import Range from "./components/Range";
export default {
  components: {
    Editor,
    Range
  },
  setup() {
    const state = ref(data);

    provide('config',config);

    const formData=ref({
      username:'nagano',
      password:123,
      start:0,
      end:100
    })
    return {
      state,
      formData
    };
  },
};
</script>

<style>
.app {
  position: fixed;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
}
</style>
