<template>
  <section class="rail-admin-page train-command">
    <div class="train-command__hero">
      <div>
        <p class="eyebrow">TRAIN COMPOSITION</p>
        <h1>火车管理</h1>
        <p class="hero-copy">以列车为主线维护基础车次、经停站与车厢编组，展开后即可处理一列车的完整结构。</p>
      </div>
      <div class="hero-actions">
        <a-button @click="handleQuery()">刷新</a-button>
        <a-button type="primary" @click="onAddTrain">新增列车</a-button>
      </div>
    </div>

    <div class="train-command__toolbar">
      <div class="toolbar-stat">
        <strong>{{ pagination.total }}</strong>
        <span>基础列车</span>
      </div>
      <div class="toolbar-note">点击行左侧箭头展开经停站与车厢。座位图在“列车座位”中按列车查看。</div>
    </div>

    <a-table
        class="train-table"
        :dataSource="trains"
        :columns="columns"
        :pagination="pagination"
        :loading="loading"
        :row-key="record => record.code"
        :expanded-row-keys="expandedTrainCodes"
        @expand="handleExpand"
        @change="handleTableChange">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'code'">
          <div class="train-code">
            <span class="train-code__badge">{{ record.type || 'TR' }}</span>
            <div>
              <strong>{{ record.code }}</strong>
              <span>{{ getTrainTypeName(record.type) }}</span>
            </div>
          </div>
        </template>
        <template v-else-if="column.dataIndex === 'route'">
          <div class="route-line">
            <span>{{ record.start }}</span>
            <i></i>
            <span>{{ record.end }}</span>
          </div>
        </template>
        <template v-else-if="column.dataIndex === 'time'">
          <span class="mono-time">{{ record.startTime || '--' }} - {{ record.endTime || '--' }}</span>
        </template>
        <template v-else-if="column.dataIndex === 'detail'">
          <div v-if="getTrainDetail(record.code).loaded" class="detail-chips">
            <span>{{ getTrainDetail(record.code).stations.length }} 站</span>
            <span>{{ getTrainDetail(record.code).carriages.length }} 节车厢</span>
          </div>
          <span v-else class="detail-placeholder">
            {{ getTrainDetail(record.code).loading ? '加载中' : '待展开' }}
          </span>
        </template>
        <template v-else-if="column.dataIndex === 'action'">
          <a-space>
            <a @click.stop="loadTrainDetail(record.code, true)">同步结构</a>
            <a @click.stop="onEditTrain(record)">编辑</a>
            <a-popconfirm
                title="生成座位会覆盖已有座位，确认继续？"
                @confirm="generateSeat(record)"
                ok-text="确认"
                cancel-text="取消">
              <a @click.stop>生成座位</a>
            </a-popconfirm>
            <a-popconfirm
                title="删除后不可恢复，确认删除？"
                @confirm="onDeleteTrain(record)"
                ok-text="确认"
                cancel-text="取消">
              <a class="danger-link" @click.stop>删除</a>
            </a-popconfirm>
          </a-space>
        </template>
      </template>

      <template #expandedRowRender="{ record }">
        <div class="train-expanded">
          <a-spin :spinning="getTrainDetail(record.code).loading">
            <div class="composition-grid">
              <section class="rail-panel rail-panel--stations">
                <div class="panel-head">
                  <div>
                    <p class="eyebrow">ROUTE STOPS</p>
                    <h2>{{ record.code }} 经停站</h2>
                  </div>
                  <a-button size="small" @click="onAddStation(record)">新增车站</a-button>
                </div>
                <div v-if="getTrainDetail(record.code).stations.length" class="station-timeline">
                  <article
                      v-for="station in getTrainDetail(record.code).stations"
                      :key="station.id || station.index"
                      class="station-node">
                    <div class="station-node__index">{{ padIndex(station.index) }}</div>
                    <div class="station-node__body">
                      <strong>{{ station.name }}</strong>
                      <span>{{ station.inTime || '--' }} / {{ station.outTime || '--' }}</span>
                    </div>
                    <div class="station-node__meta">{{ station.km || 0 }} km</div>
                    <div class="station-node__actions">
                      <a @click="onEditStation(station)">编辑</a>
                      <a-popconfirm
                          title="删除后不可恢复，确认删除？"
                          @confirm="onDeleteStation(station, record.code)"
                          ok-text="确认"
                          cancel-text="取消">
                        <a class="danger-link">删除</a>
                      </a-popconfirm>
                    </div>
                  </article>
                </div>
                <a-empty v-else description="暂无经停站，先为这列车添加站点" />
              </section>

              <section class="rail-panel rail-panel--carriages">
                <div class="panel-head">
                  <div>
                    <p class="eyebrow">CARRIAGE SET</p>
                    <h2>{{ record.code }} 车厢编组</h2>
                  </div>
                  <a-button size="small" @click="onAddCarriage(record)">新增车厢</a-button>
                </div>
                <div v-if="getTrainDetail(record.code).carriages.length" class="carriage-line">
                  <article
                      v-for="carriage in getTrainDetail(record.code).carriages"
                      :key="carriage.id || carriage.index"
                      class="carriage-unit">
                    <div class="carriage-unit__nose"></div>
                    <div class="carriage-unit__content">
                      <strong>{{ padIndex(carriage.index) }} 车</strong>
                      <span>{{ getSeatTypeName(carriage.seatType) }}</span>
                      <small>{{ carriage.rowCount || 0 }} 排 / {{ carriage.seatCount || 0 }} 座</small>
                    </div>
                    <div class="carriage-unit__actions">
                      <a @click="onEditCarriage(carriage)">编辑</a>
                      <a-popconfirm
                          title="删除后不可恢复，确认删除？"
                          @confirm="onDeleteCarriage(carriage, record.code)"
                          ok-text="确认"
                          cancel-text="取消">
                        <a class="danger-link">删除</a>
                      </a-popconfirm>
                    </div>
                  </article>
                </div>
                <a-empty v-else description="暂无车厢，添加车厢后可生成座位" />
              </section>
            </div>
          </a-spin>
        </div>
      </template>
    </a-table>

    <a-modal v-model:open="trainVisible" title="列车信息" :width="720" @ok="handleTrainOk"
             ok-text="确认" cancel-text="取消">
      <a-form :model="train" :label-col="{span: 5}" :wrapper-col="{ span: 19 }">
        <a-form-item label="车次编号">
          <a-input v-model:value="train.code" :disabled="!!train.id"></a-input>
        </a-form-item>
        <a-form-item label="车次类型">
          <a-select v-model:value="train.type">
            <a-select-option v-for="item in TRAIN_TYPE_ARRAY" :key="item.code" :value="item.code">
              {{ item.desc }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="始发站">
          <station-select-view v-model:value="train.start"></station-select-view>
        </a-form-item>
        <a-form-item label="始发站拼音">
          <a-input v-model:value="train.startPinyin" disabled/>
        </a-form-item>
        <a-form-item label="出发时间">
          <a-time-picker v-model:value="train.startTime" valueFormat="HH:mm:ss" placeholder="请选择时间"/>
        </a-form-item>
        <a-form-item label="终点站">
          <station-select-view v-model:value="train.end"></station-select-view>
        </a-form-item>
        <a-form-item label="终点站拼音">
          <a-input v-model:value="train.endPinyin" disabled/>
        </a-form-item>
        <a-form-item label="到站时间">
          <a-time-picker v-model:value="train.endTime" valueFormat="HH:mm:ss" placeholder="请选择时间"/>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="stationVisible" title="经停站" :width="720" @ok="handleStationOk"
             ok-text="确认" cancel-text="取消">
      <a-form :model="trainStation" :label-col="{span: 5}" :wrapper-col="{ span: 19 }">
        <a-form-item label="车次编号">
          <a-input v-model:value="trainStation.trainCode" disabled/>
        </a-form-item>
        <a-form-item label="站序">
          <a-input-number v-model:value="trainStation.index" :min="1" style="width: 100%"/>
        </a-form-item>
        <a-form-item label="站名">
          <station-select-view v-model:value="trainStation.name"></station-select-view>
        </a-form-item>
        <a-form-item label="站名拼音">
          <a-input v-model:value="trainStation.namePinyin" disabled/>
        </a-form-item>
        <a-form-item label="进站时间">
          <a-time-picker v-model:value="trainStation.inTime" valueFormat="HH:mm:ss" placeholder="请选择时间"/>
        </a-form-item>
        <a-form-item label="出站时间">
          <a-time-picker v-model:value="trainStation.outTime" valueFormat="HH:mm:ss" placeholder="请选择时间"/>
        </a-form-item>
        <a-form-item label="停留时间">
          <a-time-picker v-model:value="trainStation.stopTime" valueFormat="HH:mm:ss" disabled/>
        </a-form-item>
        <a-form-item label="里程">
          <a-input-number v-model:value="trainStation.km" :min="0" style="width: 100%" addon-after="km"/>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="carriageVisible" title="车厢编组" :width="680" @ok="handleCarriageOk"
             ok-text="确认" cancel-text="取消">
      <a-form :model="trainCarriage" :label-col="{span: 5}" :wrapper-col="{ span: 19 }">
        <a-form-item label="车次编号">
          <a-input v-model:value="trainCarriage.trainCode" disabled/>
        </a-form-item>
        <a-form-item label="车厢号">
          <a-input-number v-model:value="trainCarriage.index" :min="1" style="width: 100%"/>
        </a-form-item>
        <a-form-item label="座位类型">
          <a-select v-model:value="trainCarriage.seatType">
            <a-select-option v-for="item in SEAT_TYPE_ARRAY" :key="item.code" :value="item.code">
              {{ item.desc }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="排数">
          <a-input-number v-model:value="trainCarriage.rowCount" :min="1" style="width: 100%"/>
        </a-form-item>
      </a-form>
    </a-modal>
  </section>
</template>

<script>
import {defineComponent, ref, onMounted, watch} from 'vue';
import {notification} from "ant-design-vue";
import axios from "axios";
import {pinyin} from "pinyin-pro";
import dayjs from "dayjs";
import StationSelectView from "@/components/station-select.vue";

const emptyTrain = () => ({
  id: undefined,
  code: undefined,
  type: undefined,
  start: undefined,
  startPinyin: undefined,
  startTime: undefined,
  end: undefined,
  endPinyin: undefined,
  endTime: undefined,
});

const emptyStation = (trainCode, index = 1) => ({
  id: undefined,
  trainCode,
  index,
  name: undefined,
  namePinyin: undefined,
  inTime: undefined,
  outTime: undefined,
  stopTime: undefined,
  km: undefined,
});

const emptyCarriage = (trainCode, index = 1) => ({
  id: undefined,
  trainCode,
  index,
  seatType: undefined,
  seatCount: undefined,
  rowCount: undefined,
  colCount: undefined,
});

const emptyDetail = () => ({
  stations: [],
  carriages: [],
  loading: false,
  loaded: false,
});

export default defineComponent({
  name: "train-view",
  components: {StationSelectView},
  setup() {
    const TRAIN_TYPE_ARRAY = window.TRAIN_TYPE_ARRAY;
    const SEAT_TYPE_ARRAY = window.SEAT_TYPE_ARRAY;

    const trainVisible = ref(false);
    const stationVisible = ref(false);
    const carriageVisible = ref(false);
    const train = ref(emptyTrain());
    const trainStation = ref(emptyStation());
    const trainCarriage = ref(emptyCarriage());
    const trains = ref([]);
    const trainDetails = ref({});
    const expandedTrainCodes = ref([]);
    const pagination = ref({
      total: 0,
      current: 1,
      pageSize: 10,
    });
    const loading = ref(false);

    const columns = [
      { title: '车次', dataIndex: 'code', key: 'code', width: 180 },
      { title: '线路', dataIndex: 'route', key: 'route' },
      { title: '运行时间', dataIndex: 'time', key: 'time', width: 190 },
      { title: '结构', dataIndex: 'detail', key: 'detail', width: 180 },
      { title: '操作', dataIndex: 'action', key: 'action', width: 280 }
    ];

    const byIndex = (a, b) => Number(a.index || a.carriageIndex || 0) - Number(b.index || b.carriageIndex || 0);
    const getTrainTypeName = (type) => (TRAIN_TYPE_ARRAY || []).find(item => item.code === type)?.desc || type || '--';
    const getSeatTypeName = (type) => (SEAT_TYPE_ARRAY || []).find(item => item.code === type)?.desc || type || '--';
    const padIndex = (value) => String(value || 0).padStart(2, '0');

    const getTrainDetail = (code) => {
      if (!trainDetails.value[code]) {
        trainDetails.value = {
          ...trainDetails.value,
          [code]: emptyDetail()
        };
      }
      return trainDetails.value[code];
    };

    const setTrainDetail = (code, patch) => {
      trainDetails.value = {
        ...trainDetails.value,
        [code]: {
          ...getTrainDetail(code),
          ...patch
        }
      };
    };

    const queryAllRows = async (url, params = {}) => {
      const pageSize = 100;
      let page = 1;
      let total = 0;
      let rows = [];

      do {
        const response = await axios.get(url, {
          params: {
            ...params,
            page,
            pageSize
          }
        });
        const data = response.data;
        if (!data.success) {
          notification.error({description: data.message});
          return rows;
        }

        const content = data.content || {};
        const pageRows = content.rows || [];
        total = Number(content.total || pageRows.length);
        rows = [...rows, ...pageRows];
        page += 1;
      } while (rows.length < total);

      return rows;
    };

    const loadTrainDetail = async (code, force = false) => {
      const detail = getTrainDetail(code);
      if (detail.loaded && !force) {
        return;
      }
      setTrainDetail(code, { loading: true });
      try {
        const [stations, carriages] = await Promise.all([
          queryAllRows("/admin/train-station/query-list", { trainCode: code }),
          queryAllRows("/admin/train-carriage/query-list", { trainCode: code })
        ]);
        setTrainDetail(code, {
          stations: stations.sort(byIndex),
          carriages: carriages.sort(byIndex),
          loaded: true
        });
      } finally {
        setTrainDetail(code, { loading: false });
      }
    };

    const handleExpand = (expanded, record) => {
      if (expanded) {
        expandedTrainCodes.value = [...new Set([...expandedTrainCodes.value, record.code])];
        loadTrainDetail(record.code);
      } else {
        expandedTrainCodes.value = expandedTrainCodes.value.filter(code => code !== record.code);
      }
    };

    watch(() => train.value.start, () => {
      train.value.startPinyin = window.Tool?.isNotEmpty(train.value.start)
          ? pinyin(train.value.start, {toneType: 'none'}).replaceAll(" ", "")
          : "";
    }, {immediate: true});

    watch(() => train.value.end, () => {
      train.value.endPinyin = window.Tool?.isNotEmpty(train.value.end)
          ? pinyin(train.value.end, {toneType: 'none'}).replaceAll(" ", "")
          : "";
    }, {immediate: true});

    watch(() => trainStation.value.name, () => {
      trainStation.value.namePinyin = window.Tool?.isNotEmpty(trainStation.value.name)
          ? pinyin(trainStation.value.name, {toneType: 'none'}).replaceAll(" ", "")
          : "";
    }, {immediate: true});

    const refreshStopTime = () => {
      if (!trainStation.value.inTime || !trainStation.value.outTime) {
        trainStation.value.stopTime = undefined;
        return;
      }
      const diff = dayjs(trainStation.value.outTime, "HH:mm:ss")
          .diff(dayjs(trainStation.value.inTime, "HH:mm:ss"), "second");
      trainStation.value.stopTime = dayjs("00:00:00", "HH:mm:ss")
          .second(Math.max(diff, 0))
          .format("HH:mm:ss");
    };

    watch(() => trainStation.value.inTime, refreshStopTime, {immediate: true});
    watch(() => trainStation.value.outTime, refreshStopTime, {immediate: true});

    const onAddTrain = () => {
      train.value = emptyTrain();
      trainVisible.value = true;
    };

    const onEditTrain = (record) => {
      train.value = window.Tool.copy(record);
      trainVisible.value = true;
    };

    const onAddStation = (record) => {
      const nextIndex = getTrainDetail(record.code).stations.length + 1;
      trainStation.value = emptyStation(record.code, nextIndex);
      stationVisible.value = true;
    };

    const onEditStation = (record) => {
      trainStation.value = window.Tool.copy(record);
      stationVisible.value = true;
    };

    const onAddCarriage = (record) => {
      const nextIndex = getTrainDetail(record.code).carriages.length + 1;
      trainCarriage.value = emptyCarriage(record.code, nextIndex);
      carriageVisible.value = true;
    };

    const onEditCarriage = (record) => {
      trainCarriage.value = window.Tool.copy(record);
      carriageVisible.value = true;
    };

    const handleTrainOk = () => {
      axios.post("/admin/train/save", train.value).then((response) => {
        const data = response.data;
        if (data.success) {
          notification.success({description: "保存成功"});
          trainVisible.value = false;
          handleQuery({
            page: pagination.value.current,
            pageSize: pagination.value.pageSize
          });
        } else {
          notification.error({description: data.message});
        }
      });
    };

    const handleStationOk = () => {
      axios.post("/admin/train-station/save", trainStation.value).then((response) => {
        const data = response.data;
        if (data.success) {
          notification.success({description: "经停站保存成功"});
          stationVisible.value = false;
          loadTrainDetail(trainStation.value.trainCode, true);
        } else {
          notification.error({description: data.message});
        }
      });
    };

    const handleCarriageOk = () => {
      axios.post("/admin/train-carriage/save", trainCarriage.value).then((response) => {
        const data = response.data;
        if (data.success) {
          notification.success({description: "车厢保存成功"});
          carriageVisible.value = false;
          loadTrainDetail(trainCarriage.value.trainCode, true);
        } else {
          notification.error({description: data.message});
        }
      });
    };

    const onDeleteTrain = (record) => {
      axios.delete("/admin/train/delete/" + record.id).then((response) => {
        const data = response.data;
        if (data.success) {
          notification.success({description: "删除成功"});
          handleQuery({
            page: pagination.value.current,
            pageSize: pagination.value.pageSize,
          });
        } else {
          notification.error({description: data.message});
        }
      });
    };

    const onDeleteStation = (record, trainCode) => {
      axios.delete("/admin/train-station/delete/" + record.id).then((response) => {
        const data = response.data;
        if (data.success) {
          notification.success({description: "经停站已删除"});
          loadTrainDetail(trainCode, true);
        } else {
          notification.error({description: data.message});
        }
      });
    };

    const onDeleteCarriage = (record, trainCode) => {
      axios.delete("/admin/train-carriage/delete/" + record.id).then((response) => {
        const data = response.data;
        if (data.success) {
          notification.success({description: "车厢已删除"});
          loadTrainDetail(trainCode, true);
        } else {
          notification.error({description: data.message});
        }
      });
    };

    const handleQuery = (param) => {
      if (!param) {
        param = {
          page: 1,
          pageSize: pagination.value.pageSize
        };
      }
      loading.value = true;
      axios.get("/admin/train/query-list", {
        params: {
          page: param.page,
          pageSize: param.pageSize
        }
      }).then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          trains.value = data.content.rows;
          pagination.value.current = param.page;
          pagination.value.total = data.content.total;
          trains.value.forEach(item => getTrainDetail(item.code));
        } else {
          notification.error({description: data.message});
        }
      });
    };

    const handleTableChange = (page) => {
      pagination.value.pageSize = page.pageSize;
      handleQuery({
        page: page.current,
        pageSize: page.pageSize
      });
    };

    const generateSeat = (record) => {
      loading.value = true;
      axios.get("/admin/train/generate-seat/" + record.code).then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          notification.success({description: "座位生成成功，可前往列车座位查看"});
        } else {
          notification.error({description: data.message});
        }
      });
    };

    onMounted(() => {
      handleQuery({
        page: 1,
        pageSize: pagination.value.pageSize
      });
    });

    return {
      TRAIN_TYPE_ARRAY,
      SEAT_TYPE_ARRAY,
      train,
      trainStation,
      trainCarriage,
      trainVisible,
      stationVisible,
      carriageVisible,
      trains,
      trainDetails,
      expandedTrainCodes,
      pagination,
      columns,
      loading,
      getTrainDetail,
      getTrainTypeName,
      getSeatTypeName,
      padIndex,
      handleExpand,
      handleTableChange,
      handleQuery,
      loadTrainDetail,
      onAddTrain,
      onEditTrain,
      onDeleteTrain,
      handleTrainOk,
      onAddStation,
      onEditStation,
      onDeleteStation,
      handleStationOk,
      onAddCarriage,
      onEditCarriage,
      onDeleteCarriage,
      handleCarriageOk,
      generateSeat
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

.train-command {
  color: var(--text);
}

.train-command__hero {
  position: relative;
  display: flex;
  overflow: hidden;
  min-height: 176px;
  padding: 26px 28px;
  border: 1px solid var(--line);
  border-radius: 24px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(236, 236, 234, 0.74)),
      radial-gradient(circle at 92% 16%, rgba(18, 18, 20, 0.08), transparent 28%);
  box-shadow: var(--shadow-soft);
}

:root[data-theme='dark'] .train-command__hero {
  background:
      linear-gradient(135deg, rgba(36, 37, 39, 0.92), rgba(28, 29, 31, 0.74)),
      radial-gradient(circle at 92% 16%, rgba(243, 243, 241, 0.08), transparent 28%);
}

.train-command__hero::before {
  position: absolute;
  right: 28px;
  bottom: 26px;
  width: 46%;
  height: 3px;
  content: "";
  background: repeating-linear-gradient(90deg, rgba(18, 18, 20, 0.7) 0 34px, transparent 34px 44px);
  transform: skewX(-18deg);
}

.train-command__hero::after {
  position: absolute;
  right: 62px;
  bottom: 43px;
  width: 210px;
  height: 42px;
  content: "";
  border: 1px solid var(--line-strong);
  border-radius: 18px 6px 6px 18px;
  background: linear-gradient(90deg, rgba(18, 18, 20, 0.18), rgba(18, 18, 20, 0.06));
  clip-path: polygon(0 50%, 12% 0, 100% 0, 100% 100%, 12% 100%);
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--primary);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.24em;
}

.train-command__hero h1 {
  margin: 0;
  color: var(--text);
  font-family: var(--display-font);
  font-size: clamp(30px, 5vw, 54px);
  font-weight: 700;
  letter-spacing: -0.04em;
}

.hero-copy {
  max-width: 560px;
  margin: 12px 0 0;
  color: var(--text-soft);
  font-size: 15px;
  line-height: 1.9;
}

.hero-actions {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 10px;
}

.train-command__toolbar {
  display: flex;
  padding: 12px 4px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.toolbar-stat {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.toolbar-stat strong {
  color: var(--text);
  font-family: var(--display-font);
  font-size: 34px;
  line-height: 1;
}

.toolbar-stat span,
.toolbar-note {
  color: var(--text-soft);
  font-size: 13px;
}

.train-table :deep(.ant-table) {
  border-radius: 18px;
}

.train-code {
  display: flex;
  align-items: center;
  gap: 12px;
}

.train-code__badge {
  display: grid;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md) var(--radius-sm) var(--radius-md) var(--radius-sm);
  color: #fff;
  font-weight: 900;
  background: linear-gradient(135deg, #2b2c2e, #0c0d0e);
  place-items: center;
}

.train-code strong,
.train-code span {
  display: block;
}

.train-code strong {
  color: var(--text);
  font-size: 16px;
  line-height: 1.2;
}

.train-code span {
  margin-top: 3px;
  color: var(--text-faint);
  font-size: 12px;
}

.route-line {
  display: grid;
  grid-template-columns: max-content minmax(72px, 1fr) max-content;
  align-items: center;
  gap: 10px;
  color: var(--text);
  font-weight: 700;
}

.route-line i {
  height: 2px;
  background: linear-gradient(90deg, var(--success), var(--primary));
}

.mono-time {
  color: var(--text-soft);
  font-family: "SFMono-Regular", Consolas, monospace;
}

.detail-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.detail-chips span {
  padding: 4px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--text-soft);
  background: var(--surface-strong);
  font-size: 12px;
}

.detail-placeholder {
  color: var(--text-faint);
  font-size: 13px;
}

.danger-link {
  color: #b94a48 !important;
}

.train-expanded {
  padding: 6px 0 14px;
}

.composition-grid {
  display: grid;
  grid-template-columns: minmax(320px, 1.05fr) minmax(320px, 0.95fr);
  gap: 18px;
}

.rail-panel {
  position: relative;
  overflow: hidden;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: linear-gradient(145deg, var(--surface-strong), var(--surface-muted));
  box-shadow: 0 12px 28px rgba(31, 41, 46, 0.05);
}

.rail-panel::before {
  position: absolute;
  inset: auto -18px -28px auto;
  width: 150px;
  height: 150px;
  content: "";
  border: 1px solid var(--line);
  transform: rotate(18deg);
}

.panel-head {
  position: relative;
  z-index: 1;
  display: flex;
  margin-bottom: 16px;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.panel-head h2 {
  margin: 0;
  color: var(--text);
  font-family: var(--display-font);
  font-size: 24px;
  font-weight: 700;
}

.station-timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.station-node {
  display: grid;
  grid-template-columns: 44px 1fr max-content max-content;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.36);
}

:root[data-theme='dark'] .station-node {
  background: rgba(255, 255, 255, 0.04);
}

.station-node__index {
  display: grid;
  width: 36px;
  height: 36px;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  color: var(--text);
  font-weight: 900;
  background: var(--primary-soft);
  place-items: center;
}

.station-node__body strong,
.station-node__body span {
  display: block;
}

.station-node__body strong {
  color: var(--text);
  font-size: 15px;
}

.station-node__body span,
.station-node__meta {
  color: var(--text-soft);
  font-size: 12px;
}

.station-node__actions,
.carriage-unit__actions {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.carriage-line {
  display: grid;
  gap: 12px;
}

.carriage-unit {
  display: grid;
  grid-template-columns: 30px 1fr max-content;
  align-items: stretch;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.36);
}

:root[data-theme='dark'] .carriage-unit {
  background: rgba(255, 255, 255, 0.04);
}

.carriage-unit__nose {
  background:
      linear-gradient(135deg, transparent 0 46%, rgba(18, 18, 20, 0.94) 47% 53%, transparent 54%),
      linear-gradient(180deg, #3a3b3d, #131416);
}

.carriage-unit__content {
  padding: 12px 14px;
}

.carriage-unit__content strong,
.carriage-unit__content span,
.carriage-unit__content small {
  display: block;
}

.carriage-unit__content strong {
  color: var(--text);
  font-size: 15px;
}

.carriage-unit__content span {
  margin-top: 4px;
  color: var(--primary);
  font-weight: 700;
}

.carriage-unit__content small {
  margin-top: 4px;
  color: var(--text-faint);
}

.carriage-unit__actions {
  padding: 12px 14px;
  align-items: center;
}

@media (max-width: 1180px) {
  .composition-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .train-command__hero,
  .train-command__toolbar,
  .panel-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .station-node,
  .carriage-unit {
    grid-template-columns: 1fr;
  }

  .station-node__actions,
  .carriage-unit__actions {
    padding-left: 0;
  }
}
</style>
