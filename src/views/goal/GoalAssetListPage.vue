<template>
  <div class="goal-asset-list-page">
    <!-- Top Section: Goal Asset Progress -->
    <section class="goal-progress-section goal-card">
      <!-- 빈 카드 표시 -->
      <div
        v-if="!assetGoal || assetGoalDeleted || assetGoal.totalAmount === 0"
        class="goal-card empty-goal-card"
        @click="openAssetGoalCreateModal"
      >
        <div>목표 자산을 추가하세요</div>
        <div>+</div>
      </div>

      <!-- 목표 자산이 있을 때 자산 현황 표시 -->
      <div v-else class="progress-bar-container" @click="openAssetGoalDetailModal">
        <p class="goal-description">
          김리치님의 목표 자산 현황<br />
          <strong>{{ assetGoal.title }} : {{ assetGoal.totalAmount.toLocaleString() }}원</strong
          >까지 <strong>{{ assetGoal.remaindate }}</strong
          >일 남았습니다 💪
        </p>
        <p class="current-amount">
          현재 <strong>{{ assetGoal.currentAmount.toLocaleString() }}</strong
          >원 모았습니다 😁
        </p>
        <div class="progress-bar">
          <div
            class="progress"
            :style="{ width: (assetGoal.currentAmount / assetGoal.totalAmount) * 100 + '%' }"
          ></div>
        </div>
      </div>
    </section>

    <div style="margin-top: 100px;">
    <!-- Middle Section: Consumption Suggestion -->
    <section class="text-left">
      <div class="main-title">소비 목표를 세워 목표 자금을 형성할 수 있어요</div>
      <div class="sub_title">우선순위별로 소비 목표가 달성돼요 😁</div>
    </section>

    <!-- 목표 카드 리스트 -->
    <section class="goal-cards">
      <div
        v-for="(goal, index) in goals"
        :key="goal.id"
        class="goal-card"
        :draggable="true"
        @dragstart="onDragStart(goal, $event)"
        @dragover.prevent
        @drop="onDrop(goal)"
        @click="openGoalDetailModal(goal)"
      >
        <p class="goal-index">{{ index + 1 }}. {{ goal.title }}</p>
        <p class="goal-amount">{{ goal.totalAmount.toLocaleString() }}원 / {{ goal.gather.toLocaleString() }}원</p>
        <div class="progress-bar">
          <div
            class="progress"
            :style="{ width: (goal.gather / goal.totalAmount) * 100 + '%' }"
          ></div>
        </div>
        <p class="goal-progress">{{ ((goal.gather / goal.totalAmount) * 100).toFixed(2) }}% 달성</p>
      </div>

      <!-- Add Goal Button -->
      <div class="goal-card add-goal" @click="openCreateModal">
        <p>+</p>
      </div>
    </section>

    <!-- 달성된 목표 축하 메시지 -->
    <div v-if="goalAchieved" class="goal-achieved-message">
      🎉 목표를 달성했습니다! 축하합니다! 🎉
    </div>
  </div>

    <!-- 모달 컴포넌트 -->
    <ConsumeGoalCreateModal ref="goalCreateModal" @registerGoal="addNewGoal" />
    <ConsumeGoalDetailModal
      ref="goalDetailModal"
      @deleteGoal="deleteGoal"
      @achieveGoal="achieveGoal"
    />
    <AssetGoalDetailModal ref="assetGoalDetailModal" @goalDeleted="onAssetGoalDeleted" />
    <AssetGoalCreateModal ref="assetGoalCreateModal" @registerGoal="addNewAssetGoal" />
  </div>

  <!-- 로딩 상태 표시 -->
  <div v-if="isLoading" class="loading-spinner">Loading...</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ConsumeGoalCreateModal from '../../components/modal/goal/ConsumeGoalCreateModal.vue'
import ConsumeGoalDetailModal from '../../components/modal/goal/ConsumeGoalDetailModal.vue'
import AssetGoalDetailModal from '../../components/modal/goal/AssetGoalDetailModal.vue'
import AssetGoalCreateModal from '../../components/modal/goal/AssetGoalCreateModal.vue'
import Instance from '@/AxiosInstance.js'

// 로딩 상태
const isLoading = ref(false)

// 목표 데이터
const goals = ref([])

// 목표 달성 상태
const goalAchieved = ref(false)

// 드래그 시작 시 호출
let draggedGoal = null
const onDragStart = (goal, event) => {
  draggedGoal = goal
}

// 드롭 시 호출
const onDrop = async (targetGoal) => {
  const draggedIndex = goals.value.indexOf(draggedGoal);
  const targetIndex = goals.value.indexOf(targetGoal);

  // 목표를 드래그한 후 새로운 위치로 이동
  goals.value.splice(draggedIndex, 1); // 기존 위치에서 삭제
  goals.value.splice(targetIndex, 0, draggedGoal); // 새 위치에 삽입

  // 드래그 후 모든 목표의 priority 값을 다시 설정
  for (let i = 0; i < goals.value.length; i++) {
    goals.value[i].priority = i + 1;
  }

  // 목표 우선순위 업데이트 API 호출
  try {
    await Promise.all(
      goals.value.map((goal) => {
        const priorityUpdate = {
          index: goal.id,
          priority: goal.priority
        }
        return Instance.put('/goal/priority', priorityUpdate, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
      })
    )
    console.log('우선순위가 성공적으로 업데이트되었습니다.')
  } catch (error) {
    console.error('우선순위 업데이트에 실패했습니다.', error)
  }

  draggedGoal = null
  await fetchGoals()
}

// assetGoal 변수 정의 (자산 목표 데이터를 관리)
const assetGoal = ref(null)
const assetGoalDeleted = ref(false) // 자산 목표 삭제 여부

// 모달 제어를 위한 ref
const goalCreateModal = ref(null)
const goalDetailModal = ref(null)
const assetGoalDetailModal = ref(null)
const assetGoalCreateModal = ref(null)

// 목표 추가 함수
const addNewGoal = (newGoal) => {
  const newId = goals.value.length + 1
  goals.value.push({
    id: newId,
    title: newGoal.title,
    totalAmount: newGoal.totalAmount,
    gather: 0 // 새로운 목표는 현재 모금액 0으로 시작
  })
  console.log('새로운 목표가 추가되었습니다!')
}

// 새로운 자산 목표 추가 함수
const addNewAssetGoal = (newAssetGoal) => {
  assetGoal.value = {
    totalAmount: newAssetGoal.amount,
    currentAmount: newAssetGoal.gather || 0, // gather 값이 있으면 그 값을 설정하고, 없으면 0으로 설정
    remaindate: newAssetGoal.remaindate || 0 // 나머지 날짜도 설정
  }
  assetGoalDeleted.value = false
  console.log('자산 목표가 추가되었습니다!')
}

// 목표 소비 생성 모달 열기 함수
const openCreateModal = () => {
  if (goalCreateModal.value) {
    goalCreateModal.value.show()
  }
}

// 목표 세부 정보 모달 열기 함수
const openGoalDetailModal = (goal) => {
  if (goalDetailModal.value) {
    goalDetailModal.value.show({
      id: goal.id,
      type: '소비',
      name: goal.title,
      amount: goal.totalAmount,
      progress: goal.progress
    })
  }
}

// 자산 목표 세부 모달 열기 함수
const openAssetGoalDetailModal = () => {
  const goalData = {
    type: '자산',
    amount: assetGoal.value.totalAmount,
    index: assetGoal.value.index, 
    category: assetGoal.value.category 
  }
  assetGoalDetailModal.value.show(goalData)
}

// 자산 목표 추가 모달 열기 함수
const openAssetGoalCreateModal = () => {
  if (assetGoalCreateModal.value) {
    assetGoalCreateModal.value.show()
  }
}

// 자산 목표 삭제 후 처리
const onAssetGoalDeleted = () => {
  assetGoalDeleted.value = true
  console.log('자산 목표가 삭제되었습니다.')
}

// 목표 달성 처리
const achieveGoal = (goalId) => {
  const goalIndex = goals.value.findIndex((goal) => goal.id === goalId)
  if (goalIndex !== -1) {
    goals.value.splice(goalIndex, 1)
    console.log('목표를 달성했습니다!')
    goalAchieved.value = true  // 목표가 달성되면 메시지를 표시
    setTimeout(() => {
      goalAchieved.value = false  // 3초 후 메시지를 숨김
    }, 3000)
  }
}

// 목표 삭제 처리 (사용자 확인 포함)
const deleteGoal = (goalId) => {
  if (confirm('정말로 이 목표를 삭제하시겠습니까?')) {
    goals.value = goals.value.filter((goal) => goal.id !== goalId)
    console.log('목표가 삭제되었습니다.')
  }
}

// 자산 목표를 API에서 가져오는 함수
const fetchAssetGoal = async () => {
  try {
    const response = await Instance.get('/goal/')
    if (response.data && response.data.response && response.data.response.data) {
      const assetGoalData = response.data.response.data
      assetGoal.value = {
        index: assetGoalData.index,
        totalAmount: assetGoalData.amount,
        currentAmount: assetGoalData.gather,
        remaindate: assetGoalData.remaindate,
        category: '자산'
      }
    } else {
      console.error('자산 목표를 불러오지 못했습니다.')
    }
  } catch (error) {
    console.error('자산 목표 로드 중 오류가 발생했습니다.', error)
  }
}

// API를 통한 소비 목표 데이터 가져오기
const fetchGoals = async () => {
  isLoading.value = true
  try {
    const response = await Instance.get('/goal/outcome')
    if (response.data.success) {
      const fetchedGoals = response.data.response.data
        .map((goal) => ({
          id: goal.index,
          title: goal.title,
          totalAmount: goal.amount,
          gather: goal.gather || 0,
          priority: goal.priority,
          progress: (goal.gather / (goal.amount || 1)) * 100
        }))
        .sort((a, b) => a.priority - b.priority)

      goals.value = fetchedGoals
    }
  } catch (error) {
    console.error('소비 목표를 불러오지 못했습니다.', error)
  } finally {
    isLoading.value = false
  }
}

// 페이지 로드 시 목표 데이터를 가져옴
onMounted(async () => {
  await fetchAssetGoal()
  await fetchGoals()
})
</script>

<style scoped>
*{
  font-family: pretendard;
}

.goal-asset-list-page {
  padding: 20px;
  background-color: #FAFAFB;
  min-height: 100vh;
}

.goal-card {
  background-color: #ffffff;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  cursor: pointer;
  font-size: 18px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.goal-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.progress-bar-container {
  margin: 20px 0;
  padding: 15px;
  border-radius: 10px;
  background: #FAFAFB;
}

.goal-description {
  font-size: 20px;
  color: #333;
  margin-bottom: 10px;
}

.current-amount {
  font-size: 18px;
  font-weight: bold;
  color: #ff6584;
}

.progress-bar {
  width: 100%;
  background-color: #e0e0e0;
  height: 20px;
  border-radius: 10px;
  margin: 15px 0;
}

.progress {
  background: linear-gradient(90deg, #ffb9c9,  #ff6584);
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.consumption-suggestion {
  text-align: left;
  padding: 20px;
  color: var(--4, #1D1616);
font-feature-settings: 'dlig' on;
font-family: Pretendard;
font-size: 24px;
font-style: normal;
font-weight: 800;
line-height: 27px; /* 112.5% */
}

.goal-cards {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.add-goal {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border: 2px dashed #ccc;
  font-size: 28px;
  color: #aaa;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.add-goal:hover {
  background-color: #e0e0e0;
  color: #888;
}

.goal-index {
  font-weight: bold;
  font-size: 22px;
  color: #414158;
}

.goal-amount {
  font-size: 18px;
  color: #8a8aa8;
}

.goal-progress {
  font-size: 16px;
  color: #414158;
  margin-top: 10px;
}

.sub-title{
  color: var(--3, #414158);
  font-family: Pretendard;
  font-size: 18px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%; /* 27px */
  letter-spacing: -0.36px;
}

.main-title{
  margin-top : 8xp;
  color: var(--3, #414158);
  font-feature-settings: 'dlig' on;
  font-family: Pretendard;
  font-size: 18px;
  font-style: normal;
  font-weight: 700;
  line-height: 27px; /* 135% */  
}

.loading-spinner {
  text-align: center;
  font-size: 20px;
  color: #ff6584;
}

/* 목표 달성 시 축하 메시지 스타일 */
.goal-achieved-message {
  text-align: center;
  font-size: 24px;
  color: #ff6584;
  margin-top: 20px;
  animation: fadeInOut 3s ease-in-out;
}

/* 목표 달성 애니메이션 */
@keyframes fadeInOut {
  0% {
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>

