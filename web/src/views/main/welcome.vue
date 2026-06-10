<template>
  <div class="welcome-page">
    <section class="welcome-hero">
      <div class="welcome-hero__copy">
        <p class="welcome-eyebrow">RailFlow Passenger</p>
        <h1>从余票检索到排队购票，<br><span>一站式完成出行预订。</span></h1>
        <p class="welcome-summary">
          当前项目覆盖会员登录、乘车人维护、车次余票查询、选座下单、双层验证码、
          排队购票、订单取消与车票查询，围绕高并发购票流程提供完整体验。
        </p>
        <div class="welcome-actions">
          <router-link class="primary-action" to="/ticket">开始查询余票 <arrow-right-outlined /></router-link>
          <router-link class="secondary-action" to="/passenger">维护乘车人</router-link>
        </div>
      </div>

      <div class="route-visual" aria-label="购票流程示意图">
        <div class="route-visual__line">
          <span class="route-station route-station--active"><i></i><b>检索</b><small>余票与车次</small></span>
          <span class="route-station"><i></i><b>核验</b><small>乘车人与验证码</small></span>
          <span class="route-station"><i></i><b>排队</b><small>异步削峰处理</small></span>
          <span class="route-station"><i></i><b>出票</b><small>查看我的车票</small></span>
        </div>
      </div>
    </section>

    <section class="welcome-section">
      <div class="section-heading">
        <p class="welcome-eyebrow">Core workflow</p>
        <h2>围绕真实购票链路设计</h2>
        <p>每个入口对应一个可操作环节，减少无关信息，让流程更清晰。</p>
      </div>
      <div class="feature-lines">
        <router-link class="feature-line" to="/passenger">
          <span class="feature-line__index">01</span>
          <span><strong>乘车人管理</strong><small>维护姓名、证件信息与乘客类型，为下单准备基础数据。</small></span>
          <arrow-up-right-outlined />
        </router-link>
        <router-link class="feature-line" to="/ticket">
          <span class="feature-line__index">02</span>
          <span><strong>余票查询与购票</strong><small>按日期和站点检索车次，进入选座、验证码和排队购票流程。</small></span>
          <arrow-up-right-outlined />
        </router-link>
        <router-link class="feature-line" to="/my-ticket">
          <span class="feature-line__index">03</span>
          <span><strong>我的车票</strong><small>集中查看已成功出票的车票记录，快速确认行程信息。</small></span>
          <arrow-up-right-outlined />
        </router-link>
        <router-link class="feature-line" to="/seat">
          <span class="feature-line__index">04</span>
          <span><strong>座位销售图</strong><small>按车次查看座位售卖情况，直观了解车厢内的余量分布。</small></span>
          <arrow-up-right-outlined />
        </router-link>
      </div>
    </section>

    <section class="architecture-note">
      <div>
        <p class="welcome-eyebrow">Concurrency design</p>
        <h2>高并发场景下的多层削峰</h2>
      </div>
      <p>
        系统通过前端验证码、服务端验证码、令牌控制、分布式锁、消息队列与排队反馈，
        将集中抢票请求拆分为可控链路，同时保障库存一致性与用户反馈速度。
      </p>
    </section>
  </div>
</template>

<script>
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'welcome-view'
});
</script>

<style scoped>
.welcome-page {
  max-width: 1280px;
  margin: 0 auto;
}

.welcome-hero {
  display: grid;
  min-height: 360px;
  padding: 28px 10px 34px;
  grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
  align-items: center;
  gap: 38px;
}

.welcome-eyebrow {
  margin: 0 0 12px;
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
  margin-bottom: 18px;
  color: var(--text);
  font-family: var(--display-font);
  font-size: clamp(34px, 4.6vw, 62px);
  font-weight: 500;
  letter-spacing: -0.045em;
  line-height: 1.08;
}

h1 span {
  color: var(--primary);
}

h2 {
  margin-bottom: 9px;
  color: var(--text);
  font-family: var(--display-font);
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.025em;
}

.welcome-summary {
  max-width: 680px;
  color: var(--text-soft);
  font-size: 15px;
  line-height: 1.9;
}

.welcome-actions {
  display: flex;
  margin-top: 26px;
  flex-wrap: wrap;
  gap: 10px;
}

.primary-action,
.secondary-action {
  display: inline-flex;
  padding: 11px 17px;
  border-radius: 9px;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.primary-action {
  color: var(--on-primary);
  background: var(--primary);
  box-shadow: 0 8px 18px rgba(10, 11, 12, 0.18);
}

.secondary-action {
  border: 1px solid var(--line-strong);
  color: var(--text);
  background: var(--surface);
}

.primary-action:hover,
.secondary-action:hover {
  transform: translateY(-2px);
}

.route-visual {
  position: relative;
  display: flex;
  min-height: 240px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: linear-gradient(145deg, var(--surface-strong), var(--surface-muted));
  box-shadow: var(--shadow-soft);
  align-items: center;
}

.route-visual__line {
  position: relative;
  z-index: 1;
  display: grid;
  width: 100%;
  padding: 0 26px;
  grid-template-columns: repeat(4, 1fr);
}

.route-visual__line::before {
  position: absolute;
  top: 12px;
  right: 36px;
  left: 36px;
  height: 2px;
  content: "";
  background: linear-gradient(90deg, var(--primary), rgba(18, 18, 20, 0.16));
}

.route-station {
  position: relative;
  color: var(--text-soft);
}

.route-station i {
  position: relative;
  z-index: 1;
  display: block;
  width: 15px;
  height: 15px;
  margin: 5px auto 18px;
  border: 3px solid var(--surface-strong);
  border-radius: 50%;
  background: #b9c3cb;
  box-shadow: 0 0 0 3px rgba(18, 18, 20, 0.08);
}

.route-station--active i {
  background: var(--primary);
  box-shadow: 0 0 0 5px rgba(18, 18, 20, 0.12);
  animation: station-pulse 2s ease-in-out infinite;
}

.route-station b,
.route-station small {
  display: block;
  text-align: center;
}

.route-station b {
  color: var(--text);
  font-size: 13px;
}

.route-station small {
  margin-top: 5px;
  font-size: 10px;
}

.welcome-section {
  padding: 42px 10px;
  border-top: 1px solid var(--line);
}

.section-heading p:last-child {
  color: var(--text-soft);
}

.feature-lines {
  margin-top: 24px;
  border-top: 1px solid var(--line);
}

.feature-line {
  display: grid;
  padding: 18px 6px;
  border-bottom: 1px solid var(--line);
  grid-template-columns: 54px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 12px;
  color: var(--text);
  text-decoration: none;
  transition: padding 180ms ease, background 180ms ease;
}

.feature-line:hover {
  padding-right: 14px;
  padding-left: 14px;
  background: var(--primary-soft);
}

.feature-line__index {
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.feature-line strong,
.feature-line small {
  display: block;
}

.feature-line strong {
  margin-bottom: 5px;
  font-size: 15px;
}

.feature-line small {
  color: var(--text-soft);
  font-size: 13px;
  line-height: 1.6;
}

.architecture-note {
  display: grid;
  margin: 18px 0 6px;
  padding: 24px 8px 8px;
  border-top: 1px solid var(--line);
  grid-template-columns: minmax(220px, 0.78fr) minmax(0, 1.22fr);
  align-items: center;
  gap: 28px;
}

.architecture-note p:last-child {
  margin: 0;
  color: var(--text-soft);
  line-height: 1.9;
}

@keyframes station-pulse {
  50% {
    box-shadow: 0 0 0 8px rgba(18, 18, 20, 0.05);
  }
}

@media (max-width: 860px) {
  .welcome-hero {
    display: block;
    min-height: auto;
    padding-top: 10px;
  }

  .route-visual {
    min-height: 220px;
    margin-top: 28px;
  }

  .architecture-note {
    display: block;
  }
}

@media (max-width: 560px) {
  h1 {
    font-size: 36px;
  }

  .route-visual__line {
    padding: 0 14px;
  }

  .route-station small {
    display: none;
  }
}
</style>
