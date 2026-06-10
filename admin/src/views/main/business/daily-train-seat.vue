<template>
  <section class="rail-admin-page daily-seat-map-page">
    <div class="seat-map-hero">
      <div>
        <p class="eyebrow">DAILY SEAT MAP</p>
        <h1>每日座位图</h1>
        <p>按日期和车次折叠查看当日座位，展开后以车厢分隔，并标出每个座位的售卖状态。</p>
      </div>
      <div class="seat-map-filter">
        <a-date-picker v-model:value="params.date" valueFormat="YYYY-MM-DD" placeholder="选择日期"/>
        <train-select-view v-model:value="params.trainCode" width="240px"></train-select-view>
        <a-button @click="handleQuery()">刷新车次</a-button>
      </div>
    </div>

    <div class="seat-legend">
      <span class="legend-title">座位列色</span>
      <span v-for="item in seatLegend" :key="item.code" class="legend-chip" :class="'seat-col--' + item.code">
        {{ item.code }} {{ item.name }}
      </span>
      <span class="legend-chip legend-chip--sold">已售</span>
      <span class="legend-note">中间留白为过道，卡片默认折叠，展开后再加载座位数量。</span>
    </div>

    <a-spin :spinning="loading">
      <div v-if="dailyTrains.length" class="train-seat-list">
        <article
            v-for="record in dailyTrains"
            :key="makeDailyKey(record)"
            class="train-seat-card"
            :class="{ 'is-open': isExpanded(record) }">
          <button class="train-seat-card__head" type="button" @click="toggleTrain(record)">
            <span class="date-badge">{{ formatDate(record.date) || '--' }}</span>
            <span class="train-chip">{{ record.type || 'TR' }}</span>
            <span class="train-seat-card__title">
              <strong>{{ record.code }}</strong>
              <small>{{ record.start }} → {{ record.end }}</small>
            </span>
            <span class="train-seat-card__time">{{ record.startTime || '--' }} / {{ record.endTime || '--' }}</span>
            <span class="train-seat-card__summary">
              {{ getSeatSummary(record) }}
            </span>
            <span class="train-seat-card__arrow">{{ isExpanded(record) ? '收起' : '展开' }}</span>
          </button>

          <transition name="seat-collapse">
            <div v-if="isExpanded(record)" class="train-seat-card__body">
              <a-spin :spinning="getSeatState(record).loading">
                <div v-if="getCarriageGroups(record).length" class="carriage-map-list">
                  <section
                      v-for="carriage in getCarriageGroups(record)"
                      :key="carriage.index"
                      class="carriage-map">
                    <div class="carriage-map__head">
                      <div>
                        <p class="eyebrow">CARRIAGE {{ padIndex(carriage.index) }}</p>
                        <h2>{{ padIndex(carriage.index) }} 车厢 · {{ getSeatTypeName(carriage.seatType) }}</h2>
                      </div>
                      <span>{{ carriage.seats.length }} 座 · 已售 {{ carriage.soldCount }}</span>
                    </div>

                    <div class="train-body-diagram">
                      <div class="train-body-diagram__nose"></div>
                      <div class="seat-grid">
                        <div v-for="row in carriage.rows" :key="row.row" class="seat-row">
                          <div class="seat-row__number">{{ padIndex(row.row) }}</div>
                          <div class="seat-cluster seat-cluster--left">
                            <span
                                v-for="seat in row.left"
                                :key="seatKey(seat)"
                                class="seat-cell"
                                :class="['seat-col--' + seat.col, { 'is-sold': isSold(seat) }]"
                                :title="seatTitle(seat)">
                              <strong>{{ seatLabel(seat) }}</strong>
                              <small>{{ isSold(seat) ? '已售' : '可售' }}</small>
                            </span>
                          </div>
                          <div class="seat-aisle">过道</div>
                          <div class="seat-cluster seat-cluster--right">
                            <span
                                v-for="seat in row.right"
                                :key="seatKey(seat)"
                                class="seat-cell"
                                :class="['seat-col--' + seat.col, { 'is-sold': isSold(seat) }]"
                                :title="seatTitle(seat)">
                              <strong>{{ seatLabel(seat) }}</strong>
                              <small>{{ isSold(seat) ? '已售' : '可售' }}</small>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
                <a-empty v-else description="暂无当日座位数据，请先生成每日车次座位" />
              </a-spin>
            </div>
          </transition>
        </article>
      </div>
      <a-empty v-else description="暂无每日车次数据" />
    </a-spin>
  </section>
</template>

<script>
import {defineComponent, onMounted, ref} from 'vue';
import {notification} from "ant-design-vue";
import axios from "axios";
import dayjs from "dayjs";
import TrainSelectView from "@/components/train-select.vue";

const emptySeatState = () => ({
  seats: [],
  loading: false,
  loaded: false,
});

export default defineComponent({
  name: "daily-train-seat-view",
  components: {TrainSelectView},
  setup() {
    const SEAT_TYPE_ARRAY = window.SEAT_TYPE_ARRAY;
    const dailyTrains = ref([]);
    const seatStates = ref({});
    const expandedDailyKeys = ref([]);
    const loading = ref(false);
    const params = ref({
      date: null,
      trainCode: null
    });

    const seatLegend = [
      { code: 'A', name: '窗' },
      { code: 'B', name: '中' },
      { code: 'C', name: '过道' },
      { code: 'D', name: '过道' },
      { code: 'F', name: '窗' },
    ];

    const formatDate = (value) => {
      if (!value) {
        return undefined;
      }
      if (typeof value === 'number') {
        return dayjs(value).format("YYYY-MM-DD");
      }
      if (/^\d+$/.test(String(value))) {
        return dayjs(Number(value)).format("YYYY-MM-DD");
      }
      if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) {
        return String(value).slice(0, 10);
      }
      const parsed = dayjs(value);
      return parsed.isValid() ? parsed.format("YYYY-MM-DD") : value;
    };

    const makeDailyKey = (record) => `${formatDate(record.date) || 'no-date'}-${record.code || record.trainCode || 'no-code'}`;
    const getSeatState = (record) => {
      const key = typeof record === 'string' ? record : makeDailyKey(record);
      if (!seatStates.value[key]) {
        seatStates.value = {
          ...seatStates.value,
          [key]: emptySeatState()
        };
      }
      return seatStates.value[key];
    };

    const setSeatState = (record, patch) => {
      const key = typeof record === 'string' ? record : makeDailyKey(record);
      seatStates.value = {
        ...seatStates.value,
        [key]: {
          ...getSeatState(key),
          ...patch
        }
      };
    };

    const isExpanded = (record) => expandedDailyKeys.value.includes(makeDailyKey(record));
    const padIndex = (value) => String(value || 0).padStart(2, '0');
    const getSeatTypeName = (type) => (SEAT_TYPE_ARRAY || []).find(item => item.code === type)?.desc || type || '座位';
    const seatRow = (seat) => seat.row || seat.seatRow || Math.ceil(Number(seat.carriageSeatIndex || 0) / 5) || 0;
    const seatLabel = (seat) => `${seatRow(seat)}${seat.col || ''}`;
    // 以逻辑座位身份（车厢 + 排 + 列）作为唯一标识，而非 seat.id。
    // 每日座位表可能为同一物理座位生成多条 id 不同的记录，若按 id 去重会把同一座位
    // 当成多个座位渲染（每个座位重复出现）。一个座位由 (carriageIndex, row, col) 唯一确定。
    const seatKey = (seat) => `${seat.carriageIndex || 0}-${seatRow(seat)}-${seat.col || ''}`;

    const isSold = (seat) => {
      const sell = seat.sell;
      if (sell === undefined || sell === null || sell === '') {
        return false;
      }
      return Number(sell) > 0 || /[1-9]/.test(String(sell));
    };

    const seatTitle = (seat) => {
      const status = isSold(seat) ? '已售' : '可售';
      return `${formatDate(seat.date)} · ${seat.trainCode} · ${padIndex(seat.carriageIndex)}车 · ${seatLabel(seat)} · ${status}`;
    };

    const sortSeat = (a, b) => {
      const colOrder = {A: 1, B: 2, C: 3, D: 4, F: 5};
      const carriageDiff = Number(a.carriageIndex || 0) - Number(b.carriageIndex || 0);
      if (carriageDiff !== 0) {
        return carriageDiff;
      }
      const rowDiff = Number(seatRow(a)) - Number(seatRow(b));
      if (rowDiff !== 0) {
        return rowDiff;
      }
      const colDiff = (colOrder[a.col] || 99) - (colOrder[b.col] || 99);
      if (colDiff !== 0) {
        return colDiff;
      }
      return Number(a.carriageSeatIndex || 0) - Number(b.carriageSeatIndex || 0);
    };

    const queryAllRows = async (url, queryParams = {}) => {
      const pageSize = 100;
      let page = 1;
      let hasMore = true;
      let rows = [];

      // 注意：每日座位按 date + trainCode 过滤，但后端返回的 total 可能是未过滤的总量，
      // 不能用 rows.length < total 作为翻页条件，否则会把同一页过滤结果重复累加（座位重复渲染）。
      // 这里以“是否取到完整一页”判断是否还有下一页。
      while (hasMore) {
        const response = await axios.get(url, {
          params: {
            ...queryParams,
            page,
            pageSize
          }
        });
        const data = response.data;
        if (!data.success) {
          notification.error({description: data.message});
          break;
        }

        const content = data.content || {};
        const pageRows = content.rows || [];
        rows = [...rows, ...pageRows];
        page += 1;

        // 取不满一页说明已是最后一页
        hasMore = pageRows.length >= pageSize;
      }

      // 兜底去重，防止后端分页边界返回重复行
      const seen = new Set();
      return rows.filter(row => {
        const key = seatKey(row);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    };

    const queryAllSeats = (record) => {
      const date = formatDate(record.date);
      const trainCode = record.code || record.trainCode;
      return queryAllRows("/admin/daily-train-seat/query-list", {date, trainCode});
    };

    const loadSeats = async (record, force = false) => {
      const state = getSeatState(record);
      if (state.loaded && !force) {
        return;
      }
      setSeatState(record, { loading: true });
      try {
        const seats = await queryAllSeats(record);
        setSeatState(record, {
          seats: seats.sort(sortSeat),
          loaded: true
        });
      } finally {
        setSeatState(record, { loading: false });
      }
    };

    const toggleTrain = (record) => {
      const key = makeDailyKey(record);
      if (isExpanded(record)) {
        expandedDailyKeys.value = expandedDailyKeys.value.filter(item => item !== key);
        return;
      }
      expandedDailyKeys.value = [...expandedDailyKeys.value, key];
      loadSeats(record);
    };

    const getCarriageGroups = (record) => {
      const groups = new Map();
      getSeatState(record).seats.forEach(seat => {
        const index = seat.carriageIndex || 0;
        if (!groups.has(index)) {
          groups.set(index, {
            index,
            seatType: seat.seatType,
            seats: [],
            rows: [],
            soldCount: 0
          });
        }
        groups.get(index).seats.push(seat);
      });

      return Array.from(groups.values())
          .sort((a, b) => Number(a.index) - Number(b.index))
          .map(group => {
            const rows = new Map();
            group.seats.sort(sortSeat).forEach(seat => {
              const rowNo = seatRow(seat);
              if (!rows.has(rowNo)) {
                rows.set(rowNo, {
                  row: rowNo,
                  left: [],
                  right: []
                });
              }
              const row = rows.get(rowNo);
              if (['A', 'B', 'C'].includes(seat.col)) {
                row.left.push(seat);
              } else {
                row.right.push(seat);
              }
            });
            return {
              ...group,
              soldCount: group.seats.filter(isSold).length,
              rows: Array.from(rows.values())
                  .sort((a, b) => Number(a.row) - Number(b.row))
                  .map(row => ({
                    ...row,
                    left: row.left.sort(sortSeat),
                    right: row.right.sort(sortSeat)
                  }))
            };
          });
    };

    const getSeatSummary = (record) => {
      const state = getSeatState(record);
      if (!state.loaded) {
        return state.loading ? '加载中' : '待展开';
      }
      const groups = getCarriageGroups(record);
      const total = groups.reduce((sum, group) => sum + group.seats.length, 0);
      const sold = groups.reduce((sum, group) => sum + group.soldCount, 0);
      return `${groups.length} 节 / ${total} 座 · 已售 ${sold}`;
    };

    const handleQuery = async () => {
      loading.value = true;
      try {
        dailyTrains.value = await queryAllRows("/admin/daily-train/query-list", {
          date: params.value.date,
          code: params.value.trainCode
        });
        dailyTrains.value.forEach(item => getSeatState(item));
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      handleQuery();
    });

    return {
      dailyTrains,
      seatStates,
      expandedDailyKeys,
      loading,
      params,
      seatLegend,
      formatDate,
      makeDailyKey,
      getSeatState,
      getCarriageGroups,
      getSeatSummary,
      getSeatTypeName,
      isExpanded,
      isSold,
      padIndex,
      seatLabel,
      seatKey,
      seatTitle,
      toggleTrain,
      handleQuery
    };
  },
});
</script>

<style scoped>
.rail-admin-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.daily-seat-map-page {
  color: var(--text);
}

.seat-map-hero {
  position: relative;
  display: flex;
  overflow: hidden;
  padding: 26px 28px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(236, 236, 234, 0.74)),
      radial-gradient(circle at 90% 10%, rgba(18, 18, 20, 0.08), transparent 30%);
  box-shadow: var(--shadow-soft);
}

:root[data-theme='dark'] .seat-map-hero {
  background:
      linear-gradient(135deg, rgba(36, 37, 39, 0.92), rgba(28, 29, 31, 0.74)),
      radial-gradient(circle at 90% 10%, rgba(243, 243, 241, 0.08), transparent 30%);
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--primary);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.24em;
}

.seat-map-hero h1 {
  margin: 0;
  color: var(--text);
  font-family: var(--display-font);
  font-size: clamp(30px, 5vw, 54px);
  font-weight: 700;
  letter-spacing: -0.04em;
}

.seat-map-hero p:not(.eyebrow) {
  max-width: 580px;
  margin: 12px 0 0;
  color: var(--text-soft);
  font-size: 15px;
  line-height: 1.85;
}

.seat-map-filter {
  display: flex;
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

.seat-legend {
  display: flex;
  flex-wrap: wrap;
  padding: 0 4px;
  align-items: center;
  gap: 8px;
}

.legend-title,
.legend-note {
  color: var(--text-soft);
  font-size: 12px;
}

.legend-chip {
  display: inline-flex;
  min-width: 66px;
  padding: 5px 9px;
  border-radius: 999px;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

.legend-chip--sold {
  border: 1px solid var(--line-strong);
  color: var(--text-soft);
  background: repeating-linear-gradient(135deg, rgba(18, 18, 20, 0.16) 0 5px, rgba(255, 255, 255, 0.2) 5px 10px);
}

.train-seat-list {
  display: grid;
  gap: 14px;
}

.train-seat-card {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: linear-gradient(145deg, var(--surface-strong), var(--surface-muted));
  box-shadow: 0 12px 28px rgba(31, 41, 46, 0.05);
}

.train-seat-card.is-open {
  border-color: var(--line-strong);
}

.train-seat-card__head {
  display: grid;
  width: 100%;
  padding: 16px 18px;
  border: 0;
  grid-template-columns: 122px 52px minmax(180px, 1fr) 160px 190px 72px;
  align-items: center;
  gap: 14px;
  color: var(--text);
  cursor: pointer;
  text-align: left;
  background: transparent;
}

.train-seat-card__head:hover {
  background: var(--primary-soft);
}

.date-badge {
  display: inline-flex;
  padding: 7px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  justify-content: center;
  color: var(--text-soft);
  background: var(--surface-strong);
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 12px;
}

.train-chip {
  display: grid;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md) var(--radius-sm) var(--radius-md) var(--radius-sm);
  color: #fff;
  font-weight: 900;
  background: linear-gradient(135deg, #2b2c2e, #0c0d0e);
  place-items: center;
}

.train-seat-card__title strong,
.train-seat-card__title small {
  display: block;
}

.train-seat-card__title strong {
  color: var(--text);
  font-size: 17px;
}

.train-seat-card__title small,
.train-seat-card__time,
.train-seat-card__summary,
.train-seat-card__arrow {
  color: var(--text-soft);
  font-size: 13px;
}

.train-seat-card__time {
  font-family: "SFMono-Regular", Consolas, monospace;
}

.train-seat-card__arrow {
  justify-self: end;
  font-weight: 800;
  color: var(--primary);
}

.train-seat-card__body {
  padding: 0 18px 20px;
}

.carriage-map-list {
  display: grid;
  gap: 18px;
}

.carriage-map {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.36);
}

:root[data-theme='dark'] .carriage-map {
  background: rgba(255, 255, 255, 0.04);
}

.carriage-map__head {
  display: flex;
  margin-bottom: 14px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.carriage-map__head h2 {
  margin: 0;
  color: var(--text);
  font-family: var(--display-font);
  font-size: 23px;
  font-weight: 700;
}

.carriage-map__head span {
  padding: 5px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--text-soft);
  background: var(--surface-strong);
  font-size: 12px;
}

.train-body-diagram {
  display: grid;
  overflow: hidden;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-lg) var(--radius-sm) var(--radius-sm) var(--radius-lg);
  grid-template-columns: 56px 1fr;
  background:
      linear-gradient(90deg, rgba(18, 18, 20, 0.08), transparent 12%),
      rgba(255, 255, 255, 0.34);
}

:root[data-theme='dark'] .train-body-diagram {
  background:
      linear-gradient(90deg, rgba(255, 255, 255, 0.07), transparent 12%),
      rgba(255, 255, 255, 0.035);
}

.train-body-diagram__nose {
  background:
      linear-gradient(135deg, transparent 0 43%, rgba(18, 18, 20, 0.92) 44% 56%, transparent 57%),
      linear-gradient(180deg, #3a3b3d, #131416);
}

.seat-grid {
  display: grid;
  gap: 7px;
  padding: 16px;
  min-width: 0;
}

.seat-row {
  display: grid;
  grid-template-columns: 38px max-content 58px max-content;
  align-items: center;
  justify-content: start;
  gap: 8px;
}

.seat-row__number {
  color: var(--text-faint);
  font-family: "SFMono-Regular", Consolas, monospace;
  font-weight: 800;
  text-align: center;
}

.seat-cluster {
  display: flex;
  gap: 6px;
}

.seat-cluster--right {
  justify-content: flex-start;
}

.seat-aisle {
  display: grid;
  height: 30px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius-sm);
  color: var(--text-faint);
  font-size: 11px;
  place-items: center;
}

.seat-cell {
  position: relative;
  display: grid;
  width: 44px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: var(--radius-sm);
  place-items: center;
  color: #fff;
  box-shadow: 0 4px 10px rgba(10, 11, 12, 0.12);
}

.seat-cell.is-sold {
  color: rgba(255, 255, 255, 0.78);
  filter: saturate(0.45);
}

.seat-cell.is-sold::after {
  position: absolute;
  inset: 4px;
  content: "";
  border-radius: 3px;
  background: repeating-linear-gradient(135deg, rgba(18, 18, 20, 0.32) 0 5px, transparent 5px 10px);
  pointer-events: none;
}

.seat-cell strong,
.seat-cell small {
  position: relative;
  z-index: 1;
}

.seat-cell strong {
  font-size: 13px;
  line-height: 1;
}

.seat-cell small {
  opacity: 0.75;
  font-size: 9px;
  line-height: 1;
}

/* 可售座位五色标记（构成主义五原色），不再使用蓝色系 */
.seat-col--A {
  background: #d8412f;
}

.seat-col--B {
  background: #e8a022;
}

.seat-col--C {
  background: #2f8f57;
}

.seat-col--D {
  background: #2f5fd0;
}

.seat-col--F {
  background: #1c1d1f;
}

.seat-collapse-enter-active,
.seat-collapse-leave-active {
  transition: opacity 180ms ease, transform 220ms ease;
}

.seat-collapse-enter-from,
.seat-collapse-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 1180px) {
  .train-seat-card__head {
    grid-template-columns: 118px 48px 1fr;
  }

  .train-seat-card__time,
  .train-seat-card__summary,
  .train-seat-card__arrow {
    grid-column: 3;
    justify-self: start;
  }
}

@media (max-width: 760px) {
  .seat-map-hero,
  .seat-map-filter,
  .carriage-map__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .seat-map-filter {
    justify-content: flex-start;
  }

  .train-seat-card__head {
    grid-template-columns: 1fr;
  }

  .train-seat-card__time,
  .train-seat-card__summary,
  .train-seat-card__arrow {
    grid-column: auto;
  }

  .train-body-diagram {
    overflow-x: auto;
  }
}
</style>
