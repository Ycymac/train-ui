<template>
  <a-layout-sider class="app-sider" width="224">
    <div class="app-sider__inner">
      <div class="app-sider__label">Passenger workspace</div>
      <div class="app-sider__scroll">
        <a-menu v-model:selectedKeys="selectedKeys" mode="inline">
          <a-menu-item key="/welcome">
            <router-link to="/welcome"><home-outlined /> 概览</router-link>
          </a-menu-item>
          <a-menu-item key="/passenger">
            <router-link to="/passenger"><team-outlined /> 乘车人管理</router-link>
          </a-menu-item>
          <a-menu-item key="/ticket">
            <router-link to="/ticket"><search-outlined /> 余票查询</router-link>
          </a-menu-item>
          <a-menu-item key="/my-ticket">
            <router-link to="/my-ticket"><idcard-outlined /> 我的车票</router-link>
          </a-menu-item>
          <a-menu-item key="/seat">
            <router-link to="/seat"><apartment-outlined /> 座位销售图</router-link>
          </a-menu-item>
          <a-menu-item key="/admin">
            <router-link to="/admin"><info-circle-outlined /> 管理台说明</router-link>
          </a-menu-item>
        </a-menu>
      </div>
      <div class="app-sider__footer">
        <strong>RailFlow Passenger</strong>
        车票查询、乘车人与订单流程
      </div>
    </div>
  </a-layout-sider>
</template>

<script>
import {defineComponent, ref, watch} from 'vue';
import router from '@/router';

export default defineComponent({
  name: 'sider-view',
  setup() {
    const selectedKeys = ref([]);
    watch(() => router.currentRoute.value.path, (path) => {
      selectedKeys.value = [path];
    }, {immediate: true});
    return {
      selectedKeys
    };
  }
});
</script>
