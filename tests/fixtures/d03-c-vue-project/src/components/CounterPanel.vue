<script setup lang="ts">
import { ref } from 'vue'
import { NButton } from 'naive-ui'

const props = withDefaults(defineProps<{ initialCount?: number; disabled?: boolean }>(), {
  initialCount: 0,
  disabled: false,
})
const count = ref(props.initialCount)

function increment() {
  if (!props.disabled) count.value += 1
}

function reset() {
  if (!props.disabled) count.value = 0
}
</script>

<template>
  <section class="counter-panel" aria-label="计数器">
    <p class="counter-label">当前数值</p>
    <output class="counter-value" aria-label="当前数值" aria-live="polite">{{ count }}</output>
    <div class="counter-actions">
      <NButton type="primary" :disabled="disabled" @click="increment">加一</NButton>
      <NButton :disabled="disabled" @click="reset">重置</NButton>
    </div>
  </section>
</template>

<style scoped>
.counter-panel {
  box-sizing: border-box;
  width: min(100%, 360px);
  margin: 24px auto;
  padding: 32px;
  border: 1px solid #c9d6ce;
  border-radius: 12px;
  background: #f5f8f4;
  color: #19352b;
}

.counter-label {
  margin: 0;
  font-size: 14px;
  letter-spacing: 0.08em;
}

.counter-value {
  display: block;
  margin: 12px 0 24px;
  font-family: Georgia, 'Songti SC', serif;
  font-size: 72px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.counter-actions {
  display: flex;
  gap: 12px;
}
</style>
