<template>
  <section class="rail-admin-page seat-map-page">
    <div class="seat-map-hero">
      <div>
        <p class="eyebrow">SEAT MAP</p>
        <h1>列车座位</h1>
        <p>按列车折叠查看座位编排，展开后以车厢分隔，直观看到每排座位与过道关系。</p>
      </div>
      <div class="seat-map-filter">
        <train-select-view v-model:value="params.trainCode" width="260px"></train-select-view>
        <a-button @click="handleQuery()">刷新列车</a-button>
      </div>
    </div>

    <div class="seat-legend">
      <span class="legend-title">座位列色</span>
      <span v-for="item in seatLegend" :key="item.code" class="legend-chip" :class="'seat-col--' + item.code">
        {{ item.code }} {{ item.name }}
      </span>
      <span class="legend-note">中间留白为过道，卡片默认折叠。</span>
    </div>

    <a-spin :spinning="loading">
      <div v-if="visibleTrains.length" class="train-seat-list">
        <article
            v-for="record in visibleTrains"
            :key="record.code"
            class="train-seat-card"
            :class="{ 'is-open': isExpanded(record.code) }">
          <button class="train-seat-card__head" type="button" @click="toggleTrain(record)">
            <span class="train-chip">{{ record.type || 'TR' }}</span>
            <span class="train-seat-card__title">
              <strong>{{ record.code }}</strong>
              <small>{{ record.start }} → {{ record.end }}</small>
            </span>
            <span class="train-seat-card__time">{{ record.startTime || '--' }} / {{ record.endTime || '--' }}</span>
            <span class="train-seat-card__summary">
              {{ getSeatSummary(record.code) }}
            </span>
            <span class="train-seat-card__arrow">{{ isExpanded(record.code) ? '收起' : '展开' }}</span>
          </button>

          <transition name="seat-collapse">
            <div v-if="isExpanded(record.code)" class="train-seat-card__body">
              <a-spin :spinning="getSeatState(record.code).loading">
                <div v-if="getCarriageGroups(record.code).length" class="carriage-map-list">
                  <section
                      v-for="carriage in getCarriageGroups(record.code)"
                      :key="carriage.index"
                      class="carriage-map">
                    <div class="carriage-map__head">
                      <div>
                        <p class="eyebrow">CARRIAGE {{ padIndex(carriage.index) }}</p>
                        <h2>{{ padIndex(carriage.index) }} 车厢 · {{ getSeatTypeName(carriage.seatType) }}</h2>
                      </div>
                      <span>{{ carriage.seats.length }} 座</span>
                    </div>

                    <div class="train-body-diagram">
                      <div class="train-body-diagram__nose"></div>
                      <div class="seat-grid">
                        <div v-for="row in carriage.rows" :key="row.row" class="seat-row">
                          <div class="seat-row__number">{{ padIndex(row.row) }}</div>
                          <div class="seat-cluster seat-cluster--left">
                            <span
                                v-for="seat in row.left"
                                :key="seat.id || seat.carriageSeatIndex || seat.row + seat.col"
                                class="seat-cell"
                                :class="'seat-col--' + seat.col"
                                :title="seatTitle(seat)">
                              <strong>{{ seat.row }}{{ seat.col }}</strong>
                              <small>#{{ seat.carriageSeatIndex }}</small>
                            </span>
                          </div>
                          <div class="seat-aisle">过道</div>
                          <div class="seat-cluster seat-cluster--right">
                            <span
                                v-for="seat in row.right"
                                :key="seat.id || seat.carriageSeatIndex || seat.row + seat.col"
                                class="seat-cell"
                                :class="'seat-col--' + seat.col"
                                :title="seatTitle(seat)">
                              <strong>{{ seat.row }}{{ seat.col }}</strong>
                              <small>#{{ seat.carriageSeatIndex }}</small>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
                <a-empty v-else description="暂无座位数据，请先在火车管理中生成座位" />
              </a-spin>
            </div>
          </transition>
        </article>
      </div>
      <a-empty v-else description="暂无列车数据" />
    </a-spin>
  </section>
</template>

<script>
import {computed, defineComponent, onMounted, ref} from 'vue';
import {notification} from "ant-design-vue";
import axios from "axios";
import TrainSelectView from "@/components/train-select.vue";

const emptySeatState = () => ({
  seats: [],
  loading: false,
  loaded: false,
});

export default defineComponent({
  name: "train-seat-view",
  components: {TrainSelectView},
  setup() {
    const SEAT_TYPE_ARRAY = window.SEAT_TYPE_ARRAY;
    const trains = ref([]);
    const seatStates = ref({});
    const expandedTrainCodes = ref([]);
    const loading = ref(false);
    const params = ref({
      trainCode: null
    });

    const seatLegend = [
      { code: 'A', name: '窗' },
      { code: 'B', name: '中' },
      { code: 'C', name: '过道' },
      { code: 'D', name: '过道' },
      { code: 'F', name: '窗' },
    ];

    const visibleTrains = computed(() => {
      if (!params.value.trainCode) {
        return trains.value;
      }
      return trains.value.filter(item => item.code === params.value.trainCode);
    });

    const getSeatState = (code) => {
      if (!seatStates.value[code]) {
        seatStates.value = {
          ...seatStates.value,
          [code]: emptySeatState()
        };
      }
      return seatStates.value[code];
    };

    const setSeatState = (code, patch) => {
      seatStates.value = {
        ...seatStates.value,
        [code]: {
          ...getSeatState(code),
          ...patch
        }
      };
    };

    const isExpanded = (code) => expandedTrainCodes.value.includes(code);
    const padIndex = (value) => String(value || 0).padStart(2, '0');
    const getSeatTypeName = (type) => (SEAT_TYPE_ARRAY || []).find(item => item.code === type)?.desc || type || '座位';
    const seatTitle = (seat) => `${seat.trainCode} · ${padIndex(seat.carriageIndex)}车 · ${seat.row}${seat.col}`;

    const sortSeat = (a, b) => {
      const colOrder = {A: 1, B: 2, C: 3, D: 4, F: 5};
      const rowDiff = Number(a.row || 0) - Number(b.row || 0);
      if (rowDiff !== 0) {
        return rowDiff;
      }
      return (colOrder[a.col] || 99) - (colOrder[b.col] || 99);
    };

    const loadSeats = async (code, force = false) => {
      const state = getSeatState(code);
      if (state.loaded && !force) {
        return;
      }
      setSeatState(code, { loading: true });
      try {
        const response = await axios.get("/admin/train-seat/query-list", {
          params: {
            page: 1,
            pageSize: 2000,
            trainCode: code
          }
        });
        const data = response.data;
        if (data.success) {
          setSeatState(code, {
            seats: (data.content?.rows || []).sort(sortSeat),
            loaded: true
          });
        } else {
          notification.error({description: data.message});
        }
      } finally {
        setSeatState(code, { loading: false });
      }
    };

    const toggleTrain = (record) => {
      if (isExpanded(record.code)) {
        expandedTrainCodes.value = expandedTrainCodes.value.filter(code => code !== record.code);
        return;
      }
      expandedTrainCodes.value = [...expandedTrainCodes.value, record.code];
      loadSeats(record.code);
    };

    const getCarriageGroups = (code) => {
      const groups = new Map();
      getSeatState(code).seats.forEach(seat => {
        const index = seat.carriageIndex || 0;
        if (!groups.has(index)) {
          groups.set(index, {
            index,
            seatType: seat.seatType,
            seats: [],
            rows: []
          });
        }
        groups.get(index).seats.push(seat);
      });

      return Array.from(groups.values())
          .sort((a, b) => Number(a.index) - Number(b.index))
          .map(group => {
            const rows = new Map();
            group.seats.sort(sortSeat).forEach(seat => {
              if (!rows.has(seat.row)) {
                rows.set(seat.row, {
                  row: seat.row,
                  left: [],
                  right: []
                });
              }
              const row = rows.get(seat.row);
              if (['A', 'B', 'C'].includes(seat.col)) {
                row.left.push(seat);
              } else {
                row.right.push(seat);
              }
            });
            return {
              ...group,
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

    const getSeatSummary = (code) => {
      const groups = getCarriageGroups(code);
      if (!getSeatState(code).loaded) {
        return '待展开';
      }
      const total = groups.reduce((sum, group) => sum + group.seats.length, 0);
      return `${groups.length} 节 / ${total} 座`;
    };

    const handleQuery = () => {
      loading.value = true;
      axios.get("/admin/train/query-list", {
        params: {
          page: 1,
          pageSize: 100
        }
      }).then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          trains.value = data.content.rows;
        } else {
          notification.error({description: data.message});
        }
      });
    };

    onMounted(() => {
      handleQuery();
    });

    return {
      SEAT_TYPE_ARRAY,
      trains,
      seatStates,
      expandedTrainCodes,
      loading,
      params,
      seatLegend,
      visibleTrains,
      getSeatState,
      getCarriageGroups,
      getSeatSummary,
      getSeatTypeName,
      isExpanded,
      padIndex,
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

.seat-map-page {
  color: var(--text);
}

.seat-map-hero {
  position: relative;
  display: flex;
  overflow: hidden;
  padding: 26px 28px;
  border: 1px solid var(--line);
  border-radius: 24px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  background:
      linear-gradient(135deg, rgba(255, 255, 252, 0.9), rgba(241, 247, 245, 0.82)),
      radial-gradient(circle at 90% 10%, rgba(65, 151, 169, 0.18), transparent 30%);
  box-shadow: var(--shadow-soft);
}

:root[data-theme='dark'] .seat-map-hero {
  background:
      linear-gradient(135deg, rgba(43, 45, 45, 0.92), rgba(34, 39, 40, 0.78)),
      radial-gradient(circle at 90% 10%, rgba(65, 151, 169, 0.16), transparent 30%);
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

.train-seat-list {
  display: grid;
  gap: 14px;
}

.train-seat-card {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: linear-gradient(145deg, var(--surface-strong), var(--surface-muted));
  box-shadow: 0 12px 28px rgba(31, 41, 46, 0.05);
}

.train-seat-card.is-open {
  border-color: rgba(65, 151, 169, 0.28);
}

.train-seat-card__head {
  display: grid;
  width: 100%;
  padding: 16px 18px;
  border: 0;
  grid-template-columns: 52px minmax(180px, 1fr) 160px 140px 72px;
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

.train-chip {
  display: grid;
  width: 44px;
  height: 44px;
  border-radius: 15px 7px 15px 7px;
  color: #fff;
  font-weight: 900;
  background: linear-gradient(135deg, #202326, #397f91);
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
  border-radius: 20px;
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
  border-radius: 28px 14px 14px 28px;
  grid-template-columns: 56px 1fr;
  background:
      linear-gradient(90deg, rgba(32, 35, 38, 0.08), transparent 12%),
      rgba(255, 255, 255, 0.34);
}

:root[data-theme='dark'] .train-body-diagram {
  background:
      linear-gradient(90deg, rgba(255, 255, 255, 0.07), transparent 12%),
      rgba(255, 255, 255, 0.035);
}

.train-body-diagram__nose {
  background:
      linear-gradient(135deg, transparent 0 43%, rgba(32, 35, 38, 0.92) 44% 56%, transparent 57%),
      linear-gradient(180deg, #3b8997, #75a982);
}

.seat-grid {
  display: grid;
  gap: 8px;
  padding: 16px;
  min-width: 620px;
}

.seat-row {
  display: grid;
  grid-template-columns: 42px minmax(160px, 1fr) 70px minmax(120px, 0.72fr);
  align-items: center;
  gap: 10px;
}

.seat-row__number {
  color: var(--text-faint);
  font-family: "SFMono-Regular", Consolas, monospace;
  font-weight: 800;
  text-align: center;
}

.seat-cluster {
  display: flex;
  gap: 8px;
}

.seat-cluster--right {
  justify-content: flex-start;
}

.seat-aisle {
  display: grid;
  height: 34px;
  border: 1px dashed var(--line-strong);
  border-radius: 999px;
  color: var(--text-faint);
  font-size: 11px;
  place-items: center;
}

.seat-cell {
  display: grid;
  width: 48px;
  height: 42px;
  border: 1px solid rgba(255, 255, 255, 0.34);
  border-radius: 12px 12px 7px 7px;
  place-items: center;
  color: #fff;
  box-shadow: 0 7px 16px rgba(32, 35, 38, 0.08);
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

.seat-col--A {
  background: linear-gradient(145deg, #1f7d8d, #55adbd);
}

.seat-col--B {
  background: linear-gradient(145deg, #4c7b5f, #7faf82);
}

.seat-col--C {
  background: linear-gradient(145deg, #24475e, #5d85a5);
}

.seat-col--D {
  background: linear-gradient(145deg, #32523f, #6f9f79);
}

.seat-col--F {
  background: linear-gradient(145deg, #171b1e, #535f67);
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

@media (max-width: 980px) {
  .seat-map-hero,
  .seat-map-filter,
  .carriage-map__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .train-seat-card__head {
    grid-template-columns: 48px 1fr;
  }

  .train-seat-card__time,
  .train-seat-card__summary,
  .train-seat-card__arrow {
    grid-column: 2;
    justify-self: start;
  }

  .train-body-diagram {
    overflow-x: auto;
  }
}
</style>
