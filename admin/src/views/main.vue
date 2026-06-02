<template>
  <a-layout class="train-shell">
    <header-view></header-view>
    <a-layout class="train-shell__body">
      <sider-view></sider-view>
      <a-layout class="train-workspace">
        <a-layout-content class="train-workspace__content">
          <router-view v-slot="{ Component, route }">
            <transition name="page">
              <component :is="Component" :key="route.path"></component>
            </transition>
          </router-view>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>
<script>
import { defineComponent } from 'vue';
import HeaderView from "@/components/Header.vue";
import SiderView from "@/components/Sider.vue";

export default defineComponent({
  components: {
    SiderView,
    HeaderView
  },
  setup() {
    return {
    };
  },
});
</script>
