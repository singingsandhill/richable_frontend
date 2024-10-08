<template>
  <div class="modal fade" id="assetGoalCreateModal" tabindex="-1" aria-labelledby="assetGoalCreateLabel" aria-hidden="true" ref="modal">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="assetGoalCreateLabel" style="font-weight: bold;">목표 자산 항목 등록</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- 목표명 입력 필드 추가 -->
          <div class="mb-3">
            <label class="form-label" style="font-weight: bold;">목표명</label>
            <input type="text" v-model="formData.title" class="form-control" placeholder="목표명을 입력해 주세요" />
          </div>
          
          <!-- 분류 선택 -->
          <div class="mb-3">
            <label class="form-label" style="font-weight: bold;">분 류</label>
            <select v-model="formData.type" class="form-select">
              <option value="자산">자산</option> <!-- 정확한 카테고리 값 사용 -->
              <option value="소비">소비</option>
            </select>
          </div>

          <!-- 목표량 입력 -->
          <div class="mb-3">
            <label class="form-label" style="font-weight: bold;">목표량</label>
            <div class="input-group">
              <input type="number" v-model="formData.amount" class="form-control" placeholder="목표 금액을 입력해 주세요" />
              <span class="input-group-text">원</span>
            </div>
          </div>
        </div>
        <div class="modal-footer d-flex justify-content-between">
          <button type="button" class="btn" data-bs-dismiss="modal" style="background-color: white; border: 1px solid #020202; color: #020202; font-weight: bold;">취소</button>
          <button type="button" class="btn text-white" style="background-color: #FF0062;" @click="submitGoal">등록</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue';
import axios from 'axios';
import { Modal } from 'bootstrap';
import Instance from '@/AxiosInstance.js';

// 등록할 목표 자산 데이터를 위한 formData 상태 관리
const formData = ref({
  title: '',         // 목표명 추가
  type: '자산',  // 카테고리 "자산 형성" 설정
  amount: null,      // 목표량
});

// emit 함수 정의 (이벤트를 부모 컴포넌트로 전송)
const emit = defineEmits(['registerGoal']);

const modal = ref(null);
let modalInstance = null;

// 모달 열기 함수
const show = () => {
  if (!modalInstance && modal.value) {
    modalInstance = new Modal(modal.value, {
      backdrop: 'static',
      keyboard: true,
    });
    modalInstance.show();
  } else if (modalInstance) {
    modalInstance.show();
  }
};

// 목표 자산 등록 함수
const submitGoal = async () => {
  if (formData.value.amount && formData.value.amount > 0 && formData.value.title) {
    try {
      // 서버로 목표 자산 생성 요청 보내기
      const response = await Instance.post('/goal/set', {
        category: formData.value.type,  // 카테고리 "자산 형성" 전송
        amount: formData.value.amount,  // 목표 금액 전송
        title: formData.value.title,    // 사용자 입력 목표명 전송
        date: new Date().getTime()      // 현재 시간 전송
      });

      if (response.data.success) {
        console.log('Goal successfully created:', response.data.response.data);
        emit('registerGoal', { ...formData.value });
        modalInstance.hide();  // 모달을 닫음
        resetForm();  // 폼 리셋
      } else {
        console.error('Failed to create goal:', response.data);
        alert('목표 자산 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('목표 자산 등록 중 오류가 발생했습니다.');
    }
  } else {
    alert("모든 필드를 입력해 주세요.");
  }
};

// 폼 리셋 함수
const resetForm = () => {
  formData.value = {
    title: '',          // 기본 값으로 초기화
    type: '자산 형성',   // 카테고리 초기화
    amount: null,
  };
};

// expose show 메서드
defineExpose({ show });
</script>

<style scoped>
.modal-header {
  font-weight: bold;
}

.input-group-text {
  border: none;
  background: transparent;
}

.modal-footer .btn {
  border-radius: 6px;
  padding: 8px 16px;
}
</style>
