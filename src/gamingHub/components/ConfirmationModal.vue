<script setup>
import { defineProps, defineEmits } from 'vue'

// Props for the confirmation modal
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    default: 'Are you sure you want to perform this action?'
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  // Array of items to show in a list
  items: {
    type: Array,
    default: () => []
  },
  warning: {
    type: String,
    default: ''
  },
  // Button style variants
  confirmVariant: {
    type: String,
    default: 'danger', // 'danger', 'primary', 'warning'
    validator: (value) => ['danger', 'primary', 'warning', 'success'].includes(value)
  }
})

// Emits for parent component communication
const emit = defineEmits([
  'confirm',
  'cancel',
  'close'
])

// Event handlers
const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
}

const handleOverlayClick = () => {
  emit('cancel')
  emit('close')
}

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    handleCancel()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="modal-overlay"
      @click="handleOverlayClick"
      @keydown="handleKeyDown"
      tabindex="-1"
    >
      <div
        class="confirmation-modal"
        @click.stop
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title"
      >
        <!-- Modal Header -->
        <div class="modal-header">
          <h3 class="modal-title" :id="title">{{ title }}</h3>
        </div>

        <!-- Modal Content -->
        <div class="modal-content">
          <p class="modal-text">{{ message }}</p>

          <!-- Optional items list -->
          <ul v-if="items.length > 0" class="modal-list">
            <li v-for="item in items" :key="item" class="modal-list-item">
              {{ item }}
            </li>
          </ul>

          <!-- Optional warning -->
          <p v-if="warning" class="modal-warning">
            <strong>{{ warning }}</strong>
          </p>
        </div>

        <!-- Modal Actions -->
        <div class="modal-actions">
          <button
            class="btn btn--ghost"
            @click="handleCancel"
            ref="cancelButton"
          >
            {{ cancelText }}
          </button>
          <button
            class="btn"
            :class="`btn--${confirmVariant}`"
            @click="handleConfirm"
            ref="confirmButton"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
// Modal Overlay
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

// Modal Container
.confirmation-modal {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-xl);
  border: 1px solid var(--card-border);
  max-width: 90%;
  width: 400px;
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.5);
  animation: slideIn 0.3s ease;
  max-height: 90vh;
  overflow-y: auto;
}

// Modal Header
.modal-header {
  padding: var(--space-4) var(--space-4) 0;
  border-bottom: 1px solid var(--card-border);
  margin-bottom: var(--space-4);
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
  padding-bottom: var(--space-3);
}

// Modal Content
.modal-content {
  padding: 0 var(--space-4) var(--space-4);
}

.modal-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-3) 0;
  line-height: 1.4;
}

.modal-list {
  margin: var(--space-3) 0;
  padding-left: var(--space-4);
  list-style-type: disc;
}

.modal-list-item {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: var(--space-1) 0;
  line-height: 1.3;
}

.modal-warning {
  font-size: var(--font-size-sm);
  color: var(--error-color);
  margin: var(--space-3) 0 0 0;
  font-weight: var(--font-weight-bold);
  padding: var(--space-2) var(--space-3);
  background-color: var(--error-light);
  border-radius: var(--border-radius-md);
  border-left: 4px solid var(--error-color);
}

// Modal Actions
.modal-actions {
  padding: var(--space-4);
  border-top: 1px solid var(--card-border);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  background-color: var(--bg-secondary);
  border-radius: 0 0 var(--border-radius-xl) var(--border-radius-xl);
}

// Animations
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>