<template>
  <div class="admin-overview">
    <section class="admin-overview__header">
      <div>
        <p class="overview-eyebrow">RailFlow Operations Center</p>
        <h1>铁路售票系统管理台</h1>
        <p class="overview-summary">
          用于维护车站与车次基础数据、生成每日运行数据、监控购票订单、管理令牌余量并执行批次调度任务。
        </p>
      </div>
      <div class="overview-status">
        <span class="overview-status__dot"></span>
        <span><b>工作台已就绪</b><small>选择左侧模块开始维护数据</small></span>
      </div>
    </section>

    <section class="overview-section">
      <div class="section-title">
        <p class="overview-eyebrow">Operational domains</p>
        <h2>核心管理域</h2>
      </div>
      <div class="domain-list">
        <router-link class="domain-row" to="/base/station">
          <span class="domain-row__icon"><database-outlined /></span>
          <span><strong>基础数据</strong><small>维护车站、火车、列车车站、车厢与座位信息。</small></span>
          <arrow-up-right-outlined />
        </router-link>
        <router-link class="domain-row" to="/business/daily-train">
          <span class="domain-row__icon"><calendar-outlined /></span>
          <span><strong>每日运行数据</strong><small>管理每日车次、车站、车厢、座位与余票。</small></span>
          <arrow-up-right-outlined />
        </router-link>
        <router-link class="domain-row" to="/business/confirm-order">
          <span class="domain-row__icon"><file-search-outlined /></span>
          <span><strong>订单监控</strong><small>查询确认订单处理状态，定位排队购票链路问题。</small></span>
          <arrow-up-right-outlined />
        </router-link>
        <router-link class="domain-row" to="/batch/job">
          <span class="domain-row__icon"><schedule-outlined /></span>
          <span><strong>批次调度</strong><small>查询、暂停、重排并即时运行后台调度任务。</small></span>
          <arrow-up-right-outlined />
        </router-link>
      </div>
    </section>

    <section class="overview-footer">
      <div>
        <p class="overview-eyebrow">Recommended sequence</p>
        <h2>日常数据准备流程</h2>
      </div>
      <ol>
        <li><span>01</span>维护车站与列车基础数据</li>
        <li><span>02</span>生成每日车次及座位数据</li>
        <li><span>03</span>检查令牌余量与余票状态</li>
        <li><span>04</span>监控订单与后台调度任务</li>
      </ol>
    </section>
  </div>
</template>

<script>
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'admin-welcome-view'
});
</script>

<style scoped>
.admin-overview {
  max-width: 1180px;
  margin: 0 auto;
}

.admin-overview__header {
  display: grid;
  min-height: 210px;
  padding: 18px 8px 34px;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 32px;
}

.overview-eyebrow {
  margin: 0 0 10px;
  color: var(--primary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 12px;
  color: var(--text);
  font-family: var(--display-font);
  font-size: clamp(32px, 4.5vw, 56px);
  font-weight: 500;
  letter-spacing: -0.045em;
}

h2 {
  margin-bottom: 0;
  color: var(--text);
  font-family: var(--display-font);
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.025em;
}

.overview-summary {
  max-width: 760px;
  margin-bottom: 0;
  color: var(--text-soft);
  font-size: 15px;
  line-height: 1.85;
}

.overview-status {
  display: flex;
  padding: 8px 0;
  align-items: center;
  gap: 10px;
}

.overview-status__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 0 5px rgba(18, 18, 20, 0.13);
  animation: status-pulse 2.4s ease-in-out infinite;
}

.overview-status b,
.overview-status small {
  display: block;
}

.overview-status b {
  color: var(--text);
  font-size: 13px;
}

.overview-status small {
  margin-top: 4px;
  color: var(--text-faint);
  font-size: 11px;
}

.overview-section {
  padding: 31px 8px;
  border-top: 1px solid var(--line);
}

.domain-list {
  display: grid;
  margin-top: 20px;
  border-top: 1px solid var(--line);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.domain-row {
  display: grid;
  padding: 20px 12px;
  border-bottom: 1px solid var(--line);
  grid-template-columns: 38px minmax(0, 1fr) 20px;
  align-items: center;
  gap: 12px;
  color: var(--text);
  text-decoration: none;
  transition: background 180ms ease, padding 180ms ease;
}

.domain-row:nth-child(odd) {
  border-right: 1px solid var(--line);
}

.domain-row:hover {
  padding-right: 18px;
  padding-left: 18px;
  background: var(--primary-soft);
}

.domain-row__icon {
  display: grid;
  width: 34px;
  height: 34px;
  border: 1px solid var(--line);
  border-radius: 11px;
  color: var(--primary);
  background: var(--surface);
  place-items: center;
}

.domain-row strong,
.domain-row small {
  display: block;
}

.domain-row strong {
  margin-bottom: 5px;
  font-size: 15px;
}

.domain-row small {
  color: var(--text-soft);
  font-size: 12px;
  line-height: 1.6;
}

.overview-footer {
  display: grid;
  margin-top: 24px;
  padding: 24px 8px 8px;
  border-top: 1px solid var(--line);
  grid-template-columns: minmax(210px, 0.72fr) minmax(0, 1.28fr);
  gap: 24px;
}

.overview-footer ol {
  display: grid;
  margin: 0;
  padding: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  list-style: none;
}

.overview-footer li {
  color: var(--text-soft);
  font-size: 13px;
}

.overview-footer li span {
  display: block;
  margin-bottom: 4px;
  color: var(--primary);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

@keyframes status-pulse {
  50% {
    box-shadow: 0 0 0 8px rgba(18, 18, 20, 0.04);
  }
}

@media (max-width: 780px) {
  .admin-overview__header,
  .overview-footer {
    display: block;
  }

  .overview-status {
    margin-top: 18px;
  }

  .domain-list {
    display: block;
  }

  .domain-row:nth-child(odd) {
    border-right: 0;
  }

  .overview-footer ol {
    margin-top: 18px;
  }
}
</style>
