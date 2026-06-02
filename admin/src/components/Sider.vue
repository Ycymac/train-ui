<template>
  <a-layout-sider class="app-sider" width="236">
    <div class="app-sider__inner">
      <div class="app-sider__label">Operations workspace</div>
      <div class="app-sider__scroll">
        <a-menu v-model:selectedKeys="selectedKeys" v-model:openKeys="openKeys" mode="inline">
          <a-menu-item key="/welcome">
            <router-link to="/welcome"><home-outlined /> 工作台概览</router-link>
          </a-menu-item>
          <a-menu-item key="/about">
            <router-link to="/about"><info-circle-outlined /> 系统说明</router-link>
          </a-menu-item>

          <a-sub-menu key="member">
            <template #title><span><team-outlined /> 会员管理</span></template>
            <a-menu-item key="/member/ticket">
              <router-link to="/member/ticket">会员车票</router-link>
            </a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="business">
            <template #title><span><line-chart-outlined /> 业务管理</span></template>
            <a-menu-item key="/business/sk-token">
              <router-link to="/business/sk-token">令牌余量</router-link>
            </a-menu-item>
            <a-menu-item key="/business/confirm-order">
              <router-link to="/business/confirm-order">订单信息</router-link>
            </a-menu-item>
            <a-menu-item key="/business/daily-train-ticket">
              <router-link to="/business/daily-train-ticket">余票信息</router-link>
            </a-menu-item>
            <a-menu-item key="/business/daily-train">
              <router-link to="/business/daily-train">每日车次</router-link>
            </a-menu-item>
            <a-menu-item key="/business/daily-train-station">
              <router-link to="/business/daily-train-station">每日车站</router-link>
            </a-menu-item>
            <a-menu-item key="/business/daily-train-carriage">
              <router-link to="/business/daily-train-carriage">每日车厢</router-link>
            </a-menu-item>
            <a-menu-item key="/business/daily-train-seat">
              <router-link to="/business/daily-train-seat">每日座位</router-link>
            </a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="base">
            <template #title><span><database-outlined /> 基础数据</span></template>
            <a-menu-item key="/base/station">
              <router-link to="/base/station">车站管理</router-link>
            </a-menu-item>
            <a-menu-item key="/base/train">
              <router-link to="/base/train">火车管理</router-link>
            </a-menu-item>
            <a-menu-item key="/base/train-station">
              <router-link to="/base/train-station">列车车站</router-link>
            </a-menu-item>
            <a-menu-item key="/base/train-carriage">
              <router-link to="/base/train-carriage">火车车厢</router-link>
            </a-menu-item>
            <a-menu-item key="/base/train-seat">
              <router-link to="/base/train-seat">列车座位</router-link>
            </a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="batch">
            <template #title><span><schedule-outlined /> 批次管理</span></template>
            <a-menu-item key="/batch/job">
              <router-link to="/batch/job">任务管理</router-link>
            </a-menu-item>
          </a-sub-menu>
        </a-menu>
      </div>
      <div class="app-sider__footer">
        <strong>RailFlow Operations</strong>
        数据维护、订单监控与任务调度
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
    const openKeys = ref(['member', 'business', 'base', 'batch']);
    watch(() => router.currentRoute.value.path, (path) => {
      selectedKeys.value = [path];
    }, {immediate: true});
    return {
      openKeys,
      selectedKeys
    };
  }
});
</script>
