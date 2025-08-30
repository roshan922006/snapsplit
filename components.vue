<template>
  <div class="balance-summary">
    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div class="loading-shimmer h-24 rounded-lg"></div>
      <div class="loading-shimmer h-32 rounded-lg"></div>
      <div class="loading-shimmer h-40 rounded-lg"></div>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Overall Balance Card -->
      <Card class="balance-card" :class="overallBalanceClass">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-800 mb-1">Your Overall Balance</h3>
              <p class="text-sm text-gray-600">
                {{ overallBalance >= 0 ? 'You are owed' : 'You owe' }}
              </p>
            </div>
            <div class="text-right">
              <div class="expense-amount text-2xl" :class="overallBalanceClass">
                <span class="currency-symbol">₹</span>{{ Math.abs(overallBalance).toFixed(2) }}
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Individual Balances -->
      <Card v-if="individualBalances.length > 0">
        <template #header>
          <div class="px-6 pt-6 pb-2">
            <h3 class="text-lg font-semibold text-gray-800">Individual Balances</h3>
            <p class="text-sm text-gray-600 mt-1">Who owes whom</p>
          </div>
        </template>
        <template #content>
          <div class="space-y-3">
            <div 
              v-for="balance in individualBalances" 
              :key="balance.userId"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div class="flex items-center space-x-3">
                <Avatar 
                  :image="balance.user.avatar" 
                  :label="balance.user.name.charAt(0)"
                  size="large"
                  shape="circle"
                  class="flex-shrink-0"
                />
                <div>
                  <p class="font-medium text-gray-800">{{ balance.user.name }}</p>
                  <p class="text-sm text-gray-600">{{ balance.user.email }}</p>
                </div>
              </div>
              <div class="text-right">
                <div class="expense-amount" :class="getBalanceClass(balance.amount)">
                  <span class="currency-symbol">₹</span>{{ Math.abs(balance.amount).toFixed(2) }}
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  {{ balance.amount >= 0 ? 'owes you' : 'you owe' }}
                </p>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Pending Settlements -->
      <Card v-if="pendingSettlements.length > 0">
        <template #header>
          <div class="px-6 pt-6 pb-2">
            <h3 class="text-lg font-semibold text-gray-800">Pending Settlements</h3>
            <p class="text-sm text-gray-600 mt-1">Outstanding payments</p>
          </div>
        </template>
        <template #content>
          <div class="space-y-3">
            <div 
              v-for="settlement in pendingSettlements" 
              :key="settlement.id"
              class="flex items-center justify-between p-4 border border-orange-200 bg-orange-50 rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <div class="flex items-center space-x-2">
                  <Avatar 
                    :image="getUser(settlement.fromUser)?.avatar" 
                    :label="getUser(settlement.fromUser)?.name?.charAt(0) || 'U'"
                    size="normal"
                    shape="circle"
                  />
                  <i class="pi pi-arrow-right text-gray-400"></i>
                  <Avatar 
                    :image="getUser(settlement.toUser)?.avatar" 
                    :label="getUser(settlement.toUser)?.name?.charAt(0) || 'U'"
                    size="normal"
                    shape="circle"
                  />
                </div>
                <div>
                  <p class="font-medium text-gray-800">
                    {{ getUser(settlement.fromUser)?.name || 'Unknown' }} 
                    → 
                    {{ getUser(settlement.toUser)?.name || 'Unknown' }}
                  </p>
                  <p class="text-sm text-gray-600">
                    Due: {{ formatDate(settlement.dueDate) }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <div class="expense-amount text-orange-600">
                  <span class="currency-symbol">₹</span>{{ parseFloat(settlement.amount).toFixed(2) }}
                </div>
                <Tag 
                  value="Pending" 
                  severity="warn" 
                  class="mt-1"
                />
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Quick Actions -->
      <Card v-if="individualBalances.length > 0">
        <template #header>
          <div class="px-6 pt-6 pb-2">
            <h3 class="text-lg font-semibold text-gray-800">Quick Actions</h3>
          </div>
        </template>
        <template #content>
          <div class="flex flex-wrap gap-3">
            <Button 
              label="Settle All Debts" 
              icon="pi pi-check-circle"
              severity="success"
              size="small"
              @click="settleAllDebts"
              :disabled="!hasDebts"
            />
            <Button 
              label="Request Payments" 
              icon="pi pi-send"
              severity="info"
              size="small"
              @click="requestPayments"
              :disabled="!hasCredits"
            />
            <Button 
              label="View Details" 
              icon="pi pi-eye"
              severity="secondary"
              size="small"
              outlined
              @click="viewDetails"
            />
          </div>
        </template>
      </Card>

      <!-- Empty State -->
      <Card v-if="individualBalances.length === 0 && !loading">
        <template #content>
          <div class="text-center py-8">
            <i class="pi pi-wallet text-4xl text-gray-400 mb-4"></i>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">No Balances</h3>
            <p class="text-gray-600 mb-4">
              You're all settled up! Add some expenses to see balances here.
            </p>
            <Button 
              label="Add Expense" 
              icon="pi pi-plus"
              severity="success"
              @click="$emit('add-expense')"
            />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useExpenseStore } from '../stores/expenseStore.js'
import { useUserStore } from '../stores/userStore.js'
import Card from 'primevue/card'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const emit = defineEmits(['add-expense', 'settle-debt', 'request-payment', 'view-details'])

const expenseStore = useExpenseStore()
const userStore = useUserStore()

// Computed properties
const loading = computed(() => expenseStore.loading || userStore.loading)

const overallBalance = computed(() => {
  if (!userStore.currentUser) return 0
  return expenseStore.getUserBalance(userStore.currentUser.id) || 0
})

const overallBalanceClass = computed(() => {
  if (overallBalance.value > 0) return 'positive'
  if (overallBalance.value < 0) return 'negative'
  return 'neutral'
})

const individualBalances = computed(() => {
  const balances = []
  const currentUserId = userStore.currentUser?.id
  
  if (!currentUserId) return balances
  
  Object.entries(expenseStore.balances).forEach(([userId, amount]) => {
    if (userId !== currentUserId && Math.abs(amount) > 0.01) {
      const user = userStore.getUserById(userId)
      if (user) {
        // Flip the sign to show from current user's perspective
        const adjustedAmount = -amount
        balances.push({
          userId,
          user,
          amount: adjustedAmount
        })
      }
    }
  })
  
  return balances.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
})

const pendingSettlements = computed(() => {
  const currentUserId = userStore.currentUser?.id
  if (!currentUserId) return []
  
  return expenseStore.getPendingSettlements.filter(settlement => 
    settlement.fromUser === currentUserId || settlement.toUser === currentUserId
  )
})

const hasDebts = computed(() => {
  return individualBalances.value.some(balance => balance.amount < 0)
})

const hasCredits = computed(() => {
  return individualBalances.value.some(balance => balance.amount > 0)
})

// Methods
const getBalanceClass = (amount) => {
  if (amount > 0) return 'positive'
  if (amount < 0) return 'negative'
  return 'neutral'
}

const getUser = (userId) => {
  return userStore.getUserById(userId)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const settleAllDebts = () => {
  emit('settle-debt', individualBalances.value.filter(b => b.amount < 0))
}

const requestPayments = () => {
  emit('request-payment', individualBalances.value.filter(b => b.amount > 0))
}

const viewDetails = () => {
  emit('view-details')
}

// Lifecycle
onMounted(async () => {
  try {
    if (userStore.users.length === 0) {
      await userStore.fetchUsers()
    }
    await expenseStore.calculateBalances()
  } catch (error) {
    console.error('Failed to load balance data:', error)
  }
})

// Watch for changes in expenses and recalculate balances
watch(
  () => expenseStore.expenses.length,
  async () => {
    await expenseStore.calculateBalances()
  }
)

watch(
  () => expenseStore.settlements.length,
  async () => {
    await expenseStore.calculateBalances()
  }
)
</script>

<style scoped>
.balance-summary {
  max-width: 100%;
}

.balance-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background-color: var(--color-balance-settled);
}

.balance-card.positive::before {
  background-color: var(--color-balance-owing);
}

.balance-card.negative::before {
  background-color: var(--color-balance-owed);
}

.expense-amount.positive {
  color: var(--color-expense-positive);
}

.expense-amount.negative {
  color: var(--color-expense-negative);
}

.expense-amount.neutral {
  color: var(--color-expense-neutral);
}

.loading-shimmer {
  background: linear-gradient(90deg, 
    var(--color-shade) 25%, 
    rgba(234, 234, 224, 0.5) 50%, 
    var(--color-shade) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.currency-symbol {
  font-size: 0.875em;
  opacity: 0.8;
  margin-right: 0.125rem;
}
</style>





Expense form

<template>
  <div class="expense-form-container">
    <Card class="w-full">
      <template #header>
        <div class="flex items-center justify-between p-6 pb-0">
          <div class="flex items-center gap-3">
            <i class="pi pi-plus-circle text-2xl text-amber-500"></i>
            <div>
              <h3 class="text-xl font-semibold text-dark">
                {{ isEditing ? 'Edit Expense' : 'Add New Expense' }}
              </h3>
              <p class="text-sm text-gray-600 mt-1">
                {{ isEditing ? 'Update expense details and split configuration' : 'Create a new expense and configure how to split it' }}
              </p>
            </div>
          </div>
          <Button
            v-if="showReceiptUpload"
            :label="showReceiptSection ? 'Hide Receipt' : 'Upload Receipt'"
            :icon="showReceiptSection ? 'pi pi-eye-slash' : 'pi pi-camera'"
            @click="toggleReceiptSection"
            class="p-button-outlined p-button-sm"
          />
        </div>
      </template>

      <template #content>
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Receipt Upload Section -->
          <div v-if="showReceiptSection" class="mb-6">
            <ReceiptUpload
              @receiptProcessed="handleReceiptProcessed"
              @createExpense="handleReceiptExpense"
              @editData="handleReceiptEdit"
            />
          </div>

          <!-- Basic Expense Details -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label for="description" class="block text-sm font-medium text-dark">
                Description *
              </label>
              <InputText
                id="description"
                v-model="formData.description"
                placeholder="Enter expense description"
                :class="{ 'p-invalid': errors.description }"
                class="w-full"
              />
              <small v-if="errors.description" class="p-error">{{ errors.description }}</small>
            </div>

            <div class="space-y-2">
              <label for="amount" class="block text-sm font-medium text-dark">
                Amount *
              </label>
              <InputNumber
                id="amount"
                v-model="formData.amount"
                mode="currency"
                currency="USD"
                locale="en-US"
                :min="0"
                :max="999999"
                :class="{ 'p-invalid': errors.amount }"
                class="w-full"
                placeholder="0.00"
              />
              <small v-if="errors.amount" class="p-error">{{ errors.amount }}</small>
            </div>

            <div class="space-y-2">
              <label for="date" class="block text-sm font-medium text-dark">
                Date *
              </label>
              <DatePicker
                id="date"
                v-model="formData.date"
                dateFormat="mm/dd/yy"
                :class="{ 'p-invalid': errors.date }"
                class="w-full"
                placeholder="Select date"
              />
              <small v-if="errors.date" class="p-error">{{ errors.date }}</small>
            </div>

            <div class="space-y-2">
              <label for="group" class="block text-sm font-medium text-dark">
                Group *
              </label>
              <Select
                id="group"
                v-model="formData.groupId"
                :options="availableGroups"
                optionLabel="name"
                optionValue="id"
                placeholder="Select a group"
                :class="{ 'p-invalid': errors.groupId }"
                class="w-full"
                @change="handleGroupChange"
              />
              <small v-if="errors.groupId" class="p-error">{{ errors.groupId }}</small>
            </div>
          </div>

          <!-- Paid By Section -->
          <div class="space-y-4">
            <h4 class="text-lg font-semibold text-dark flex items-center gap-2">
              <i class="pi pi-user text-amber-500"></i>
              Who Paid?
            </h4>
            
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div
                v-for="member in groupMembers"
                :key="member.id"
                :class="paidByCardClasses(member.id)"
                @click="formData.paidBy = member.id"
              >
                <div class="flex items-center gap-3">
                  <Avatar
                    :image="member.avatar"
                    :label="member.name.charAt(0)"
                    size="normal"
                    shape="circle"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-dark truncate">{{ member.name }}</p>
                    <p class="text-xs text-gray-500 truncate">{{ member.email }}</p>
                  </div>
                  <i
                    v-if="formData.paidBy === member.id"
                    class="pi pi-check text-amber-500"
                  ></i>
                </div>
              </div>
            </div>
            <small v-if="errors.paidBy" class="p-error">{{ errors.paidBy }}</small>
          </div>

          <!-- Split Configuration -->
          <div class="space-y-4">
            <h4 class="text-lg font-semibold text-dark flex items-center gap-2">
              <i class="pi pi-share-alt text-amber-500"></i>
              How to Split?
            </h4>

            <!-- Split Type Selection -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div
                v-for="type in splitTypes"
                :key="type.value"
                :class="splitTypeCardClasses(type.value)"
                @click="formData.splitType = type.value"
              >
                <div class="text-center">
                  <i :class="type.icon" class="text-2xl mb-2"></i>
                  <p class="font-medium text-sm">{{ type.label }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ type.description }}</p>
                </div>
              </div>
            </div>

            <!-- Participants Selection -->
            <div class="space-y-3">
              <label class="block text-sm font-medium text-dark">
                Who's Involved? *
              </label>
              
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <div
                  v-for="member in groupMembers"
                  :key="member.id"
                  :class="participantCardClasses(member.id)"
                  @click="toggleParticipant(member.id)"
                >
                  <div class="flex items-center gap-3">
                    <Avatar
                      :image="member.avatar"
                      :label="member.name.charAt(0)"
                      size="normal"
                      shape="circle"
                    />
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-dark truncate">{{ member.name }}</p>
                      <p class="text-xs text-gray-500 truncate">{{ member.email }}</p>
                    </div>
                    <Checkbox
                      :modelValue="isParticipantSelected(member.id)"
                      @change="toggleParticipant(member.id)"
                      :binary="true"
                    />
                  </div>
                </div>
              </div>
              <small v-if="errors.participants" class="p-error">{{ errors.participants }}</small>
            </div>

            <!-- Split Details Based on Type -->
            <div v-if="selectedParticipants.length > 0" class="space-y-4">
              <!-- Equal Split (Default - No additional config needed) -->
              <div v-if="formData.splitType === 'equal'" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-2">
                  <i class="pi pi-users text-blue-600"></i>
                  <h5 class="font-semibold text-blue-800">Equal Split</h5>
                </div>
                <p class="text-sm text-blue-700 mb-3">
                  Each person pays: <span class="font-bold">${{ equalSplitAmount.toFixed(2) }}</span>
                </p>
                <div class="space-y-2">
                  <div
                    v-for="participant in selectedParticipants"
                    :key="participant.id"
                    class="flex justify-between items-center text-sm"
                  >
                    <span class="text-blue-700">{{ participant.name }}</span>
                    <span class="font-semibold text-blue-800">${{ equalSplitAmount.toFixed(2) }}</span>
                  </div>
                </div>
              </div>

              <!-- Weighted Split -->
              <div v-else-if="formData.splitType === 'weighted'" class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-3">
                  <i class="pi pi-chart-bar text-purple-600"></i>
                  <h5 class="font-semibold text-purple-800">Weighted Split</h5>
                </div>
                <div class="space-y-3">
                  <div
                    v-for="participant in selectedParticipants"
                    :key="participant.id"
                    class="flex items-center gap-4"
                  >
                    <Avatar
                      :image="participant.avatar"
                      :label="participant.name.charAt(0)"
                      size="small"
                      shape="circle"
                    />
                    <div class="flex-1">
                      <label class="text-sm font-medium text-purple-700">{{ participant.name }}</label>
                    </div>
                    <div class="flex items-center gap-2">
                      <InputNumber
                        v-model="formData.splitData.weights[participant.id]"
                        :min="0"
                        :max="10"
                        :step="0.1"
                        placeholder="1.0"
                        class="w-20"
                        @input="calculateWeightedAmounts"
                      />
                      <span class="text-sm text-purple-600 w-16 text-right">
                        ${{ getWeightedAmount(participant.id).toFixed(2) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Percentage Split -->
              <div v-else-if="formData.splitType === 'percentage'" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-3">
                  <i class="pi pi-percentage text-yellow-600"></i>
                  <h5 class="font-semibold text-yellow-800">Percentage Split</h5>
                </div>
                <div class="space-y-3">
                  <div
                    v-for="participant in selectedParticipants"
                    :key="participant.id"
                    class="flex items-center gap-4"
                  >
                    <Avatar
                      :image="participant.avatar"
                      :label="participant.name.charAt(0)"
                      size="small"
                      shape="circle"
                    />
                    <div class="flex-1">
                      <label class="text-sm font-medium text-yellow-700">{{ participant.name }}</label>
                    </div>
                    <div class="flex items-center gap-2">
                      <InputNumber
                        v-model="formData.splitData.percentages[participant.id]"
                        :min="0"
                        :max="100"
                        suffix="%"
                        placeholder="0"
                        class="w-24"
                        @input="calculatePercentageAmounts"
                      />
                      <span class="text-sm text-yellow-600 w-16 text-right">
                        ${{ getPercentageAmount(participant.id).toFixed(2) }}
                      </span>
                    </div>
                  </div>
                  <div class="flex justify-between items-center pt-2 border-t border-yellow-200">
                    <span class="text-sm font-medium text-yellow-700">Total:</span>
                    <span :class="totalPercentageClasses">{{ totalPercentage }}%</span>
                  </div>
                </div>
              </div>

              <!-- Custom Split -->
              <div v-else-if="formData.splitType === 'custom'" class="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-3">
                  <i class="pi pi-cog text-pink-600"></i>
                  <h5 class="font-semibold text-pink-800">Custom Split</h5>
                </div>
                <div class="space-y-3">
                  <div
                    v-for="participant in selectedParticipants"
                    :key="participant.id"
                    class="flex items-center gap-4"
                  >
                    <Avatar
                      :image="participant.avatar"
                      :label="participant.name.charAt(0)"
                      size="small"
                      shape="circle"
                    />
                    <div class="flex-1">
                      <label class="text-sm font-medium text-pink-700">{{ participant.name }}</label>
                    </div>
                    <div class="flex items-center gap-2">
                      <InputNumber
                        v-model="formData.splitData.customAmounts[participant.id]"
                        mode="currency"
                        currency="USD"
                        locale="en-US"
                        :min="0"
                        placeholder="0.00"
                        class="w-32"
                      />
                    </div>
                  </div>
                  <div class="flex justify-between items-center pt-2 border-t border-pink-200">
                    <span class="text-sm font-medium text-pink-700">Total:</span>
                    <span :class="customTotalClasses">${{ customTotal.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Additional Notes -->
          <div class="space-y-2">
            <label for="notes" class="block text-sm font-medium text-dark">
              Additional Notes
            </label>
            <Textarea
              id="notes"
              v-model="formData.notes"
              rows="3"
              placeholder="Add any additional notes about this expense..."
              class="w-full"
            />
          </div>

          <!-- Form Actions -->
          <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Button
              type="submit"
              :label="isEditing ? 'Update Expense' : 'Create Expense'"
              :icon="isEditing ? 'pi pi-check' : 'pi pi-plus'"
              :loading="loading"
              :disabled="!isFormValid"
              class="flex-1 bg-amber-500 border-amber-500 hover:bg-amber-600"
            />
            <Button
              type="button"
              label="Cancel"
              icon="pi pi-times"
              @click="handleCancel"
              class="flex-1 p-button-outlined"
            />
            <Button
              v-if="isEditing"
              type="button"
              label="Delete"
              icon="pi pi-trash"
              @click="handleDelete"
              class="p-button-outlined p-button-danger"
            />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Avatar from 'primevue/avatar'
import Checkbox from 'primevue/checkbox'
import ReceiptUpload from './ReceiptUpload.vue'
import { useExpenseStore } from '../stores/expenseStore.js'
import { useUserStore } from '../stores/userStore.js'
import { useGroupStore } from '../stores/groupStore.js'

// Props
const props = defineProps({
  expense: {
    type: Object,
    default: null
  },
  groupId: {
    type: String,
    default: null
  },
  showReceiptUpload: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['saved', 'cancelled', 'deleted'])

// Stores
const expenseStore = useExpenseStore()
const userStore = useUserStore()
const groupStore = useGroupStore()

// Reactive state
const loading = ref(false)
const showReceiptSection = ref(false)
const errors = ref({})

// Form data
const formData = ref({
  description: '',
  amount: 0,
  date: new Date(),
  groupId: props.groupId || '',
  paidBy: '',
  splitType: 'equal',
  participants: [],
  splitData: {
    weights: {},
    percentages: {},
    customAmounts: {}
  },
  notes: ''
})

// Split types configuration
const splitTypes = [
  {
    value: 'equal',
    label: 'Equal',
    description: 'Split equally',
    icon: 'pi pi-users text-blue-500'
  },
  {
    value: 'weighted',
    label: 'Weighted',
    description: 'By weight/ratio',
    icon: 'pi pi-chart-bar text-purple-500'
  },
  {
    value: 'percentage',
    label: 'Percentage',
    description: 'By percentage',
    icon: 'pi pi-percentage text-yellow-500'
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Custom amounts',
    icon: 'pi pi-cog text-pink-500'
  }
]

// Computed properties
const isEditing = computed(() => !!props.expense)

const availableGroups = computed(() => groupStore.getUserGroups)

const currentGroup = computed(() => {
  if (!formData.value.groupId) return null
  return groupStore.getGroupById(formData.value.groupId)
})

const groupMembers = computed(() => {
  if (!currentGroup.value) return []
  return Array.isArray(currentGroup.value.members) 
    ? currentGroup.value.members 
    : JSON.parse(currentGroup.value.members || '[]')
})

const selectedParticipants = computed(() => {
  return groupMembers.value.filter(member => 
    formData.value.participants.includes(member.id)
  )
})

const equalSplitAmount = computed(() => {
  if (selectedParticipants.value.length === 0) return 0
  return formData.value.amount / selectedParticipants.value.length
})

const totalPercentage = computed(() => {
  return Object.values(formData.value.splitData.percentages).reduce((sum, val) => sum + (val || 0), 0)
})

const totalPercentageClasses = computed(() => [
  'text-sm font-semibold',
  {
    'text-green-600': totalPercentage.value === 100,
    'text-red-600': totalPercentage.value !== 100,
    'text-yellow-600': totalPercentage.value > 100
  }
])

const customTotal = computed(() => {
  return Object.values(formData.value.splitData.customAmounts).reduce((sum, val) => sum + (val || 0), 0)
})

const customTotalClasses = computed(() => [
  'text-sm font-semibold',
  {
    'text-green-600': Math.abs(customTotal.value - formData.value.amount) < 0.01,
    'text-red-600': Math.abs(customTotal.value - formData.value.amount) >= 0.01
  }
])

const isFormValid = computed(() => {
  return formData.value.description.trim() &&
         formData.value.amount > 0 &&
         formData.value.date &&
         formData.value.groupId &&
         formData.value.paidBy &&
         formData.value.participants.length > 0 &&
         validateSplitData()
})

// Methods
function validateSplitData() {
  const { splitType, amount, participants, splitData } = formData.value
  
  switch (splitType) {
    case 'equal':
      return true
    case 'weighted':
      return participants.every(id => splitData.weights[id] > 0)
    case 'percentage':
      return totalPercentage.value === 100
    case 'custom':
      return Math.abs(customTotal.value - amount) < 0.01
    default:
      return false
  }
}

function paidByCardClasses(userId) {
  return [
    'p-3 border rounded-lg cursor-pointer transition-all duration-200',
    {
      'border-amber-500 bg-amber-50': formData.value.paidBy === userId,
      'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50': formData.value.paidBy !== userId
    }
  ]
}

function splitTypeCardClasses(type) {
  return [
    'p-4 border rounded-lg cursor-pointer transition-all duration-200',
    {
      'border-amber-500 bg-amber-50': formData.value.splitType === type,
      'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50': formData.value.splitType !== type
    }
  ]
}

function participantCardClasses(userId) {
  return [
    'p-3 border rounded-lg cursor-pointer transition-all duration-200',
    {
      'border-amber-500 bg-amber-50': isParticipantSelected(userId),
      'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50': !isParticipantSelected(userId)
    }
  ]
}

function isParticipantSelected(userId) {
  return formData.value.participants.includes(userId)
}

function toggleParticipant(userId) {
  const index = formData.value.participants.indexOf(userId)
  if (index > -1) {
    formData.value.participants.splice(index, 1)
    // Clean up split data
    delete formData.value.splitData.weights[userId]
    delete formData.value.splitData.percentages[userId]
    delete formData.value.splitData.customAmounts[userId]
  } else {
    formData.value.participants.push(userId)
    // Initialize split data
    formData.value.splitData.weights[userId] = 1
    formData.value.splitData.percentages[userId] = 0
    formData.value.splitData.customAmounts[userId] = 0
  }
}

function handleGroupChange() {
  // Reset participants and paid by when group changes
  formData.value.participants = []
  formData.value.paidBy = ''
  formData.value.splitData = {
    weights: {},
    percentages: {},
    customAmounts: {}
  }
}

function calculateWeightedAmounts() {
  // Weights are used in the calculation service
}

function getWeightedAmount(userId) {
  const weight = formData.value.splitData.weights[userId] || 1
  const totalWeight = Object.values(formData.value.splitData.weights).reduce((sum, w) => sum + (w || 1), 0)
  return (formData.value.amount * weight) / totalWeight
}

function calculatePercentageAmounts() {
  // Percentages are validated to sum to 100%
}

function getPercentageAmount(userId) {
  const percentage = formData.value.splitData.percentages[userId] || 0
  return (formData.value.amount * percentage) / 100
}

function toggleReceiptSection() {
  showReceiptSection.value = !showReceiptSection.value
}

function handleReceiptProcessed(data) {
  // Receipt processed successfully
  console.log('Receipt processed:', data)
}

function handleReceiptExpense(expenseData) {
  // Auto-fill form with receipt data
  formData.value.description = expenseData.description
  formData.value.amount = expenseData.amount
  formData.value.date = new Date(expenseData.date)
  formData.value.notes = `Receipt from ${expenseData.merchantName}`
  
  showReceiptSection.value = false
}

function handleReceiptEdit(data) {
  // Handle receipt data editing
  console.log('Edit receipt data:', data)
}

function validateForm() {
  errors.value = {}
  
  if (!formData.value.description.trim()) {
    errors.value.description = 'Description is required'
  }
  
  if (!formData.value.amount || formData.value.amount <= 0) {
    errors.value.amount = 'Amount must be greater than 0'
  }
  
  if (!formData.value.date) {
    errors.value.date = 'Date is required'
  }
  
  if (!formData.value.groupId) {
    errors.value.groupId = 'Group is required'
  }
  
  if (!formData.value.paidBy) {
    errors.value.paidBy = 'Please select who paid'
  }
  
  if (formData.value.participants.length === 0) {
    errors.value.participants = 'At least one participant is required'
  }
  
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    const expenseData = {
      ...formData.value,
      participants: JSON.stringify(formData.value.participants.map(id => ({ userId: id })))
    }
    
    if (isEditing.value) {
      await expenseStore.updateExpense(props.expense.id, expenseData)
    } else {
      await expenseStore.createExpense(expenseData)
    }
    
    emit('saved', expenseData)
  } catch (error) {
    console.error('Failed to save expense:', error)
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  emit('cancelled')
}

async function handleDelete() {
  if (!isEditing.value) return
  
  loading.value = true
  
  try {
    await expenseStore.deleteExpense(props.expense.id)
    emit('deleted', props.expense.id)
  } catch (error) {
    console.error('Failed to delete expense:', error)
  } finally {
    loading.value = false
  }
}

// Initialize form data
function initializeForm() {
  if (props.expense) {
    // Edit mode - populate form with existing data
    formData.value = {
      description: props.expense.description || '',
      amount: parseFloat(props.expense.amount) || 0,
      date: new Date(props.expense.date),
      groupId: props.expense.groupId || '',
      paidBy: props.expense.paidBy || '',
      splitType: props.expense.splitType || 'equal',
      participants: JSON.parse(props.expense.participants || '[]').map(p => p.userId || p),
      splitData: {
        weights: {},
        percentages: {},
        customAmounts: {}
      },
      notes: props.expense.notes || ''
    }
    
    // Initialize split data for existing participants
    formData.value.participants.forEach(userId => {
      formData.value.splitData.weights[userId] = 1
      formData.value.splitData.percentages[userId] = 0
      formData.value.splitData.customAmounts[userId] = 0
    })
  } else {
    // Create mode - set defaults
    if (props.groupId) {
      formData.value.groupId = props.groupId
    }
    
    // Set current user as default payer if available
    if (userStore.currentUser) {
      formData.value.paidBy = userStore.currentUser.id
    }
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    userStore.fetchUsers(),
    groupStore.fetchGroups()
  ])
  
  initializeForm()
})

// Watchers
watch(() => props.expense, () => {
  initializeForm()
}, { deep: true })

watch(() => formData.value.splitType, (newType) => {
  // Reset split data when type changes
  if (newType === 'percentage') {
    const equalPercentage = Math.floor(100 / selectedParticipants.value.length)
    selectedParticipants.value.forEach(participant => {
      formData.value.splitData.percentages[participant.id] = equalPercentage
    })
  } else if (newType === 'custom') {
    selectedParticipants.value.forEach(participant => {
      formData.value.splitData.customAmounts[participant.id] = equalSplitAmount.value
    })
  }
})
</script>

<style scoped>
.expense-form-container {
  max-width: 1000px;
  margin: 0 auto;
}

@media (max-width: 640px) {
  .grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .grid-cols-3 {
    grid-template-columns: 1fr;
  }
  
  .grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>



Expence list


<template>
  <div class="expense-list-container">
    <!-- Header with filters and search -->
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <div class="flex-1">
        <IconField>
          <InputText
            v-model="searchQuery"
            placeholder="Search expenses..."
            class="w-full"
          />
        </IconField>
      </div>
      
      <div class="flex gap-2">
        <Select
          v-model="selectedGroup"
          :options="groupOptions"
          option-label="name"
          option-value="id"
          placeholder="All Groups"
          class="w-40"
          show-clear
        />
        
        <Select
          v-model="selectedSplitType"
          :options="splitTypeOptions"
          option-label="label"
          option-value="value"
          placeholder="Split Type"
          class="w-32"
          show-clear
        />
        
        <Select
          v-model="sortBy"
          :options="sortOptions"
          option-label="label"
          option-value="value"
          placeholder="Sort By"
          class="w-32"
        />
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="expenseStore.loading" class="space-y-4">
      <Card v-for="i in 3" :key="i" class="loading-shimmer">
        <template #content>
          <div class="flex justify-between items-start">
            <div class="space-y-2 flex-1">
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div class="h-6 bg-gray-200 rounded w-20"></div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Empty state -->
    <Card v-else-if="filteredExpenses.length === 0" class="text-center py-12">
      <template #content>
        <div class="text-gray-500">
          <i class="pi pi-receipt text-4xl mb-4 block"></i>
          <h3 class="text-lg font-semibold mb-2">No expenses found</h3>
          <p class="text-sm">
            {{ searchQuery || selectedGroup || selectedSplitType 
               ? 'Try adjusting your filters' 
               : 'Start by adding your first expense' }}
          </p>
        </div>
      </template>
    </Card>

    <!-- Expense list -->
    <div v-else class="space-y-4">
      <Card
        v-for="expense in paginatedExpenses"
        :key="expense.id"
        class="expense-item hover:shadow-lg transition-all duration-300 cursor-pointer"
        @click="$emit('expense-selected', expense)"
      >
        <template #content>
          <div class="flex justify-between items-start">
            <!-- Expense details -->
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="font-semibold text-lg text-gray-900">
                  {{ expense.description }}
                </h3>
                <Tag
                  :value="getSplitTypeLabel(expense.splitType)"
                  :class="getSplitTypeClass(expense.splitType)"
                  class="text-xs"
                />
              </div>
              
              <div class="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div class="flex items-center gap-1">
                  <i class="pi pi-calendar text-xs"></i>
                  <span>{{ formatDate(expense.date) }}</span>
                </div>
                
                <div class="flex items-center gap-1">
                  <i class="pi pi-user text-xs"></i>
                  <span>Paid by {{ getPaidByName(expense.paidBy) }}</span>
                </div>
                
                <div class="flex items-center gap-1" v-if="getGroupName(expense.groupId)">
                  <i class="pi pi-users text-xs"></i>
                  <span>{{ getGroupName(expense.groupId) }}</span>
                </div>
              </div>

              <!-- Participants -->
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500">Split between:</span>
                <div class="member-avatar-stack">
                  <Avatar
                    v-for="participant in getParticipants(expense.participants).slice(0, 4)"
                    :key="participant.id"
                    :image="participant.avatar"
                    :label="participant.name?.charAt(0)"
                    size="small"
                    shape="circle"
                    class="member-avatar"
                    v-tooltip.top="participant.name"
                  />
                  <Avatar
                    v-if="getParticipants(expense.participants).length > 4"
                    :label="`+${getParticipants(expense.participants).length - 4}`"
                    size="small"
                    shape="circle"
                    class="member-avatar bg-gray-200 text-gray-600"
                  />
                </div>
              </div>
            </div>

            <!-- Amount and actions -->
            <div class="text-right">
              <div class="expense-amount text-2xl font-bold text-gray-900 mb-2">
                <span class="currency-symbol">₹</span>{{ formatAmount(expense.amount) }}
              </div>
              
              <div class="flex gap-1">
                <Button
                  icon="pi pi-pencil"
                  size="small"
                  text
                  rounded
                  class="text-gray-500 hover:text-blue-600"
                  @click.stop="$emit('edit-expense', expense)"
                  v-tooltip.top="'Edit expense'"
                />
                <Button
                  icon="pi pi-trash"
                  size="small"
                  text
                  rounded
                  class="text-gray-500 hover:text-red-600"
                  @click.stop="confirmDelete(expense)"
                  v-tooltip.top="'Delete expense'"
                />
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Pagination -->
      <Paginator
        v-if="totalPages > 1"
        :rows="itemsPerPage"
        :total-records="filteredExpenses.length"
        :first="(currentPage - 1) * itemsPerPage"
        @page="onPageChange"
        class="mt-6"
      />
    </div>

    <!-- Delete confirmation dialog -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useExpenseStore } from '../stores/expenseStore.js'
import { useUserStore } from '../stores/userStore.js'
import { useGroupStore } from '../stores/groupStore.js'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Paginator from 'primevue/paginator'
import ConfirmDialog from 'primevue/confirmdialog'

// Props and emits
const props = defineProps({
  groupId: {
    type: String,
    default: null
  },
  filters: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['expense-selected', 'edit-expense', 'expense-deleted'])

// Stores
const expenseStore = useExpenseStore()
const userStore = useUserStore()
const groupStore = useGroupStore()
const confirm = useConfirm()
const toast = useToast()

// Reactive data
const searchQuery = ref('')
const selectedGroup = ref(props.groupId || null)
const selectedSplitType = ref(null)
const sortBy = ref('date-desc')
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Options
const splitTypeOptions = ref([
  { label: 'Equal Split', value: 'equal' },
  { label: 'Weighted Split', value: 'weighted' },
  { label: 'Percentage Split', value: 'percentage' },
  { label: 'Custom Split', value: 'custom' }
])

const sortOptions = ref([
  { label: 'Date (Newest)', value: 'date-desc' },
  { label: 'Date (Oldest)', value: 'date-asc' },
  { label: 'Amount (High)', value: 'amount-desc' },
  { label: 'Amount (Low)', value: 'amount-asc' },
  { label: 'Description (A-Z)', value: 'description-asc' }
])

// Computed properties
const groupOptions = computed(() => {
  return groupStore.groups.map(group => ({
    id: group.id,
    name: group.name
  }))
})

const filteredExpenses = computed(() => {
  let expenses = [...expenseStore.expenses]

  // Apply group filter
  if (selectedGroup.value) {
    expenses = expenses.filter(expense => expense.groupId === selectedGroup.value)
  }

  // Apply split type filter
  if (selectedSplitType.value) {
    expenses = expenses.filter(expense => expense.splitType === selectedSplitType.value)
  }

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    expenses = expenses.filter(expense => 
      expense.description.toLowerCase().includes(query) ||
      getPaidByName(expense.paidBy).toLowerCase().includes(query) ||
      getGroupName(expense.groupId)?.toLowerCase().includes(query)
    )
  }

  // Apply sorting
  expenses.sort((a, b) => {
    switch (sortBy.value) {
      case 'date-desc':
        return new Date(b.date) - new Date(a.date)
      case 'date-asc':
        return new Date(a.date) - new Date(b.date)
      case 'amount-desc':
        return parseFloat(b.amount) - parseFloat(a.amount)
      case 'amount-asc':
        return parseFloat(a.amount) - parseFloat(b.amount)
      case 'description-asc':
        return a.description.localeCompare(b.description)
      default:
        return 0
    }
  })

  return expenses
})

const paginatedExpenses = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredExpenses.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredExpenses.value.length / itemsPerPage.value)
})

// Methods
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatAmount = (amount) => {
  return parseFloat(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const getPaidByName = (userId) => {
  const user = userStore.getUserById(userId)
  return user ? user.name : 'Unknown User'
}

const getGroupName = (groupId) => {
  const group = groupStore.getGroupById(groupId)
  return group ? group.name : null
}

const getParticipants = (participantsData) => {
  try {
    const participants = typeof participantsData === 'string' 
      ? JSON.parse(participantsData) 
      : participantsData || []
    
    return participants.map(participant => {
      const userId = typeof participant === 'string' ? participant : participant.userId
      const user = userStore.getUserById(userId)
      return user || { id: userId, name: 'Unknown User', avatar: null }
    })
  } catch (error) {
    console.error('Error parsing participants:', error)
    return []
  }
}

const getSplitTypeLabel = (splitType) => {
  const option = splitTypeOptions.value.find(opt => opt.value === splitType)
  return option ? option.label : splitType
}

const getSplitTypeClass = (splitType) => {
  const classMap = {
    equal: 'split-indicator equal',
    weighted: 'split-indicator weighted',
    percentage: 'split-indicator percentage',
    custom: 'split-indicator custom'
  }
  return classMap[splitType] || 'split-indicator'
}

const confirmDelete = (expense) => {
  confirm.require({
    message: `Are you sure you want to delete "${expense.description}"?`,
    header: 'Delete Expense',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Delete',
      severity: 'danger'
    },
    accept: () => {
      deleteExpense(expense)
    }
  })
}

const deleteExpense = async (expense) => {
  try {
    await expenseStore.deleteExpense(expense.id)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Expense deleted successfully',
      life: 3000
    })
    emit('expense-deleted', expense)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete expense',
      life: 3000
    })
  }
}

const onPageChange = (event) => {
  currentPage.value = Math.floor(event.first / event.rows) + 1
}

// Watch for prop changes
watch(() => props.groupId, (newGroupId) => {
  selectedGroup.value = newGroupId
})

watch(() => props.filters, (newFilters) => {
  if (newFilters.splitType) {
    selectedSplitType.value = newFilters.splitType
  }
  if (newFilters.search) {
    searchQuery.value = newFilters.search
  }
}, { deep: true })

// Reset pagination when filters change
watch([searchQuery, selectedGroup, selectedSplitType], () => {
  currentPage.value = 1
})

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      expenseStore.fetchExpenses(),
      userStore.fetchUsers(),
      groupStore.fetchGroups()
    ])
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load data',
      life: 3000
    })
  }
})
</script>

<style scoped>
.expense-list-container {
  max-width: 100%;
}

.expense-item {
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.expense-item:hover {
  border-left-color: var(--color-accent);
  transform: translateY(-2px);
}

.member-avatar-stack {
  display: flex;
  margin-left: -0.5rem;
}

.member-avatar-stack .member-avatar {
  margin-left: -0.5rem;
  border: 2px solid white;
  transition: transform 0.15s ease;
}

.member-avatar-stack .member-avatar:hover {
  transform: translateY(-2px);
  z-index: 10;
}

.split-indicator {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.split-indicator.equal {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.split-indicator.weighted {
  background-color: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.split-indicator.percentage {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.split-indicator.custom {
  background-color: rgba(236, 72, 153, 0.1);
  color: #ec4899;
}

.loading-shimmer {
  background: linear-gradient(90deg, 
    #f3f4f6 25%, 
    rgba(243, 244, 246, 0.5) 50%, 
    #f3f4f6 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.currency-symbol {
  font-size: 0.875em;
  opacity: 0.8;
  margin-right: 0.125rem;
}

@media (max-width: 640px) {
  .member-avatar-stack {
    margin-left: -0.25rem;
  }
  
  .member-avatar-stack .member-avatar {
    margin-left: -0.25rem;
    width: 2rem;
    height: 2rem;
  }
}
</style>





Groupmanagerlist


<template>
  <div class="group-manager p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-dark">Group Manager</h2>
        <p class="text-gray-600 mt-1">Create and manage your expense groups</p>
      </div>
      <Button 
        @click="showCreateDialog = true"
        icon="pi pi-plus"
        label="Create Group"
        class="bg-accent hover:bg-green-600 border-accent"
      />
    </div>

    <!-- Groups List -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card 
        v-for="group in userGroups" 
        :key="group.id"
        class="group-card hover:shadow-lg transition-shadow cursor-pointer"
        @click="selectGroup(group)"
      >
        <template #header>
          <div class="relative">
            <div class="h-32 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-lg"></div>
            <div class="absolute -bottom-4 left-4">
              <AvatarGroup>
                <Avatar 
                  v-for="(member, index) in getGroupMembers(group.id).slice(0, 3)"
                  :key="member.id"
                  :image="member.avatar"
                  :label="member.name.charAt(0)"
                  size="large"
                  shape="circle"
                  class="border-2 border-white"
                />
                <Avatar 
                  v-if="getGroupMembers(group.id).length > 3"
                  :label="`+${getGroupMembers(group.id).length - 3}`"
                  size="large"
                  shape="circle"
                  class="bg-gray-500 text-white border-2 border-white"
                />
              </AvatarGroup>
            </div>
          </div>
        </template>
        
        <template #title>
          <div class="mt-4">{{ group.name }}</div>
        </template>
        
        <template #subtitle>
          <div class="text-gray-600">{{ group.description }}</div>
        </template>
        
        <template #content>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Members</span>
              <span class="font-semibold">{{ getGroupMembers(group.id).length }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Total Expenses</span>
              <span class="font-semibold text-accent">₹{{ group.totalExpenses.toFixed(2) }}</span>
            </div>
          </div>
        </template>
        
        <template #footer>
          <div class="flex gap-2">
            <Button 
              @click.stop="editGroup(group)"
              icon="pi pi-pencil"
              size="small"
              text
              class="text-amber-600 hover:bg-amber-50"
            />
            <Button 
              @click.stop="manageMembers(group)"
              icon="pi pi-users"
              size="small"
              text
              class="text-blue-600 hover:bg-blue-50"
            />
            <Button 
              @click.stop="confirmDeleteGroup(group)"
              icon="pi pi-trash"
              size="small"
              text
              severity="danger"
              class="ml-auto"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- Empty State -->
    <div v-if="userGroups.length === 0 && !loading" class="text-center py-12">
      <div class="text-6xl text-gray-300 mb-4">👥</div>
      <h3 class="text-xl font-semibold text-gray-700 mb-2">No Groups Yet</h3>
      <p class="text-gray-500 mb-6">Create your first group to start splitting expenses</p>
      <Button 
        @click="showCreateDialog = true"
        icon="pi pi-plus"
        label="Create Your First Group"
        class="bg-accent hover:bg-green-600 border-accent"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card v-for="i in 3" :key="i" class="animate-pulse">
        <template #header>
          <div class="h-32 bg-gray-200 rounded-t-lg"></div>
        </template>
        <template #content>
          <div class="space-y-3">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            <div class="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Create/Edit Group Dialog -->
    <Dialog 
      v-model:visible="showCreateDialog"
      :header="editingGroup ? 'Edit Group' : 'Create New Group'"
      modal
      class="w-full max-w-md"
    >
      <form @submit.prevent="saveGroup" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
          <InputText 
            v-model="groupForm.name"
            placeholder="Enter group name"
            class="w-full"
            :class="{ 'p-invalid': errors.name }"
          />
          <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <Textarea 
            v-model="groupForm.description"
            placeholder="Enter group description"
            rows="3"
            class="w-full"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Members</label>
          <MultiSelect 
            v-model="groupForm.members"
            :options="availableUsers"
            optionLabel="name"
            optionValue="id"
            placeholder="Select members"
            class="w-full"
            :class="{ 'p-invalid': errors.members }"
          >
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <Avatar :image="option.avatar" :label="option.name.charAt(0)" size="small" />
                <div>
                  <div class="font-medium">{{ option.name }}</div>
                  <div class="text-sm text-gray-500">{{ option.email }}</div>
                </div>
              </div>
            </template>
          </MultiSelect>
          <small v-if="errors.members" class="text-red-500">{{ errors.members }}</small>
        </div>
        
        <div class="flex gap-2 pt-4">
          <Button 
            type="submit"
            :label="editingGroup ? 'Update Group' : 'Create Group'"
            :loading="loading"
            class="flex-1 bg-accent hover:bg-green-600 border-accent"
          />
          <Button 
            type="button"
            label="Cancel"
            outlined
            @click="cancelGroupForm"
            class="flex-1"
          />
        </div>
      </form>
    </Dialog>

    <!-- Member Management Dialog -->
    <Dialog 
      v-model:visible="showMembersDialog"
      header="Manage Members"
      modal
      class="w-full max-w-lg"
    >
      <div v-if="selectedGroup" class="space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="font-semibold">Current Members</h4>
          <Button 
            @click="showAddMemberDialog = true"
            icon="pi pi-plus"
            label="Add Member"
            size="small"
            class="bg-accent hover:bg-green-600 border-accent"
          />
        </div>
        
        <div class="space-y-2">
          <div 
            v-for="member in getGroupMembers(selectedGroup.id)"
            :key="member.id"
            class="flex items-center justify-between p-3 border rounded-lg"
          >
            <div class="flex items-center gap-3">
              <Avatar :image="member.avatar" :label="member.name.charAt(0)" />
              <div>
                <div class="font-medium">{{ member.name }}</div>
                <div class="text-sm text-gray-500">{{ member.email }}</div>
              </div>
            </div>
            <Button 
              @click="removeMemberFromGroup(member.id)"
              icon="pi pi-times"
              size="small"
              text
              severity="danger"
              :disabled="getGroupMembers(selectedGroup.id).length <= 1"
            />
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Add Member Dialog -->
    <Dialog 
      v-model:visible="showAddMemberDialog"
      header="Add Member"
      modal
      class="w-full max-w-md"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Select User</label>
          <Select 
            v-model="newMemberId"
            :options="availableMembersToAdd"
            optionLabel="name"
            optionValue="id"
            placeholder="Choose a user to add"
            class="w-full"
          >
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <Avatar :image="option.avatar" :label="option.name.charAt(0)" size="small" />
                <div>
                  <div class="font-medium">{{ option.name }}</div>
                  <div class="text-sm text-gray-500">{{ option.email }}</div>
                </div>
              </div>
            </template>
          </Select>
        </div>
        
        <div class="flex gap-2">
          <Button 
            @click="addMemberToGroup"
            label="Add Member"
            :disabled="!newMemberId"
            :loading="loading"
            class="flex-1 bg-accent hover:bg-green-600 border-accent"
          />
          <Button 
            @click="showAddMemberDialog = false"
            label="Cancel"
            outlined
            class="flex-1"
          />
        </div>
      </div>
    </Dialog>

    <!-- Confirmation Dialog -->
    <ConfirmDialog />
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useGroupStore } from '../stores/groupStore.js'
import { useUserStore } from '../stores/userStore.js'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import MultiSelect from 'primevue/multiselect'
import Select from 'primevue/select'
import Avatar from 'primevue/avatar'
import AvatarGroup from 'primevue/avatargroup'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

const groupStore = useGroupStore()
const userStore = useUserStore()
const toast = useToast()
const confirm = useConfirm()

// Reactive state
const showCreateDialog = ref(false)
const showMembersDialog = ref(false)
const showAddMemberDialog = ref(false)
const editingGroup = ref(null)
const selectedGroup = ref(null)
const newMemberId = ref(null)

const groupForm = ref({
  name: '',
  description: '',
  members: []
})

const errors = ref({})

// Computed properties
const loading = computed(() => groupStore.loading || userStore.loading)
const userGroups = computed(() => groupStore.getUserGroups)
const availableUsers = computed(() => userStore.users)

const availableMembersToAdd = computed(() => {
  if (!selectedGroup.value) return []
  
  const currentMemberIds = groupStore.getGroupMembers(selectedGroup.value.id).map(m => m.id)
  return userStore.users.filter(user => !currentMemberIds.includes(user.id))
})

// Methods
const selectGroup = (group) => {
  groupStore.setCurrentGroup(group)
  toast.add({
    severity: 'info',
    summary: 'Group Selected',
    detail: `Switched to ${group.name}`,
    life: 3000
  })
}

const editGroup = (group) => {
  editingGroup.value = group
  groupForm.value = {
    name: group.name,
    description: group.description,
    members: groupStore.getGroupMembers(group.id).map(m => m.id)
  }
  showCreateDialog.value = true
}

const manageMembers = (group) => {
  selectedGroup.value = group
  showMembersDialog.value = true
}

const validateForm = () => {
  errors.value = {}
  
  if (!groupForm.value.name.trim()) {
    errors.value.name = 'Group name is required'
  }
  
  if (groupForm.value.members.length === 0) {
    errors.value.members = 'At least one member is required'
  }
  
  return Object.keys(errors.value).length === 0
}

const saveGroup = async () => {
  if (!validateForm()) return
  
  try {
    const memberObjects = userStore.getUsersByIds(groupForm.value.members)
    
    if (editingGroup.value) {
      await groupStore.updateGroup(editingGroup.value.id, {
        name: groupForm.value.name,
        description: groupForm.value.description,
        members: memberObjects
      })
      toast.add({
        severity: 'success',
        summary: 'Group Updated',
        detail: 'Group has been updated successfully',
        life: 3000
      })
    } else {
      await groupStore.createGroup({
        name: groupForm.value.name,
        description: groupForm.value.description,
        members: memberObjects
      })
      toast.add({
        severity: 'success',
        summary: 'Group Created',
        detail: 'New group has been created successfully',
        life: 3000
      })
    }
    
    cancelGroupForm()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to save group',
      life: 5000
    })
  }
}

const cancelGroupForm = () => {
  showCreateDialog.value = false
  editingGroup.value = null
  groupForm.value = {
    name: '',
    description: '',
    members: []
  }
  errors.value = {}
}

const confirmDeleteGroup = (group) => {
  confirm.require({
    message: `Are you sure you want to delete "${group.name}"? This action cannot be undone.`,
    header: 'Delete Group',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Delete',
      severity: 'danger'
    },
    accept: () => deleteGroup(group.id)
  })
}

const deleteGroup = async (groupId) => {
  try {
    await groupStore.deleteGroup(groupId)
    toast.add({
      severity: 'success',
      summary: 'Group Deleted',
      detail: 'Group has been deleted successfully',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to delete group',
      life: 5000
    })
  }
}

const addMemberToGroup = async () => {
  if (!newMemberId.value || !selectedGroup.value) return
  
  try {
    const user = userStore.getUserById(newMemberId.value)
    if (!user) throw new Error('User not found')
    
    await groupStore.addMember(selectedGroup.value.id, user)
    
    toast.add({
      severity: 'success',
      summary: 'Member Added',
      detail: `${user.name} has been added to the group`,
      life: 3000
    })
    
    newMemberId.value = null
    showAddMemberDialog.value = false
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to add member',
      life: 5000
    })
  }
}

const removeMemberFromGroup = async (memberId) => {
  if (!selectedGroup.value) return
  
  const member = userStore.getUserById(memberId)
  if (!member) return
  
  confirm.require({
    message: `Remove ${member.name} from this group?`,
    header: 'Remove Member',
    icon: 'pi pi-question-circle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Remove',
      severity: 'danger'
    },
    accept: async () => {
      try {
        await groupStore.removeMember(selectedGroup.value.id, memberId)
        toast.add({
          severity: 'success',
          summary: 'Member Removed',
          detail: `${member.name} has been removed from the group`,
          life: 3000
        })
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to remove member',
          life: 5000
        })
      }
    }
  })
}

const getGroupMembers = (groupId) => {
  return groupStore.getGroupMembers(groupId)
}

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      userStore.fetchUsers(),
      groupStore.fetchGroups()
    ])
    
    // Set current user if not set
    if (!userStore.currentUser && userStore.users.length > 0) {
      userStore.setCurrentUser(userStore.users[0])
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load data',
      life: 5000
    })
  }
})

// Watch for dialog close to reset add member form
watch(showAddMemberDialog, (newVal) => {
  if (!newVal) {
    newMemberId.value = null
  }
})
</script>

<style scoped>
.group-card {
  transition: all 0.3s ease;
}

.group-card:hover {
  transform: translateY(-2px);
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}
</style>
