<template>
  <div class="snap-split-dashboard min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <i class="pi pi-wallet text-white text-xl"></i>
            </div>
            <div>
              <h1 class="text-xl font-bold text-dark">SnapSplit</h1>
              <p class="text-sm text-gray-600">Smart Expense Management</p>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <!-- Current User -->
            <div v-if="userStore.currentUser" class="flex items-center gap-2">
              <Avatar 
                :image="userStore.currentUser.avatar" 
                :label="userStore.currentUser.name.charAt(0)"
                size="normal"
                shape="circle"
              />
              <div class="hidden sm:block">
                <p class="text-sm font-medium text-dark">{{ userStore.currentUser.name }}</p>
                <p class="text-xs text-gray-500">{{ userStore.currentUser.email }}</p>
              </div>
            </div>
            
            <!-- Quick Actions -->
            <Button 
              icon="pi pi-plus" 
              label="Add Expense"
              @click="showExpenseForm = true"
              class="bg-accent hover:bg-green-600 border-accent"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Tab Navigation -->
      <Tabs v-model:value="activeTab" class="mb-8">
        <TabList class="flex flex-wrap gap-2 mb-6">
          <Tab value="dashboard" class="flex items-center gap-2">
            <i class="pi pi-home"></i>
            <span>Dashboard</span>
          </Tab>
          <Tab value="expenses" class="flex items-center gap-2">
            <i class="pi pi-receipt"></i>
            <span>Expenses</span>
          </Tab>
          <Tab value="balances" class="flex items-center gap-2">
            <i class="pi pi-wallet"></i>
            <span>Balances</span>
          </Tab>
          <Tab value="settlements" class="flex items-center gap-2">
            <i class="pi pi-money-bill"></i>
            <span>Settlements</span>
          </Tab>
          <Tab value="groups" class="flex items-center gap-2">
            <i class="pi pi-users"></i>
            <span>Groups</span>
          </Tab>
          <Tab value="analytics" class="flex items-center gap-2">
            <i class="pi pi-chart-line"></i>
            <span>Analytics</span>
          </Tab>
        </TabList>

        <TabPanels>
          <!-- Dashboard Tab -->
          <TabPanel value="dashboard">
            <div class="space-y-8">
              <!-- Quick Stats -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card class="text-center">
                  <template #content>
                    <div class="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
                      <i class="pi pi-receipt text-blue-600 text-xl"></i>
                    </div>
                    <div class="text-2xl font-bold text-dark mb-1">{{ totalExpenses }}</div>
                    <div class="text-sm text-gray-600">Total Expenses</div>
                  </template>
                </Card>

                <Card class="text-center">
                  <template #content>
                    <div class="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4">
                      <i class="pi pi-wallet text-green-600 text-xl"></i>
                    </div>
                    <div class="text-2xl font-bold text-dark mb-1">₹{{ formatAmount(totalAmount) }}</div>
                    <div class="text-sm text-gray-600">Total Amount</div>
                  </template>
                </Card>

                <Card class="text-center">
                  <template #content>
                    <div class="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-lg mx-auto mb-4">
                      <i class="pi pi-users text-amber-600 text-xl"></i>
                    </div>
                    <div class="text-2xl font-bold text-dark mb-1">{{ activeGroups }}</div>
                    <div class="text-sm text-gray-600">Active Groups</div>
                  </template>
                </Card>

                <Card class="text-center">
                  <template #content>
                    <div class="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-4">
                      <i class="pi pi-clock text-orange-600 text-xl"></i>
                    </div>
                    <div class="text-2xl font-bold text-dark mb-1">{{ pendingSettlements }}</div>
                    <div class="text-sm text-gray-600">Pending Settlements</div>
                  </template>
                </Card>
              </div>

              <!-- Recent Activity & Balance Summary -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Recent Expenses -->
                <Card>
                  <template #header>
                    <div class="p-6 pb-0">
                      <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-dark">Recent Expenses</h3>
                        <Button 
                          label="View All" 
                          text 
                          size="small"
                          @click="activeTab = 'expenses'"
                        />
                      </div>
                    </div>
                  </template>
                  <template #content>
                    <div v-if="recentExpenses.length === 0" class="text-center py-8 text-gray-500">
                      <i class="pi pi-receipt text-4xl mb-3"></i>
                      <p>No expenses yet</p>
                    </div>
                    <div v-else class="space-y-4">
                      <div 
                        v-for="expense in recentExpenses.slice(0, 5)" 
                        :key="expense.id"
                        class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div class="flex-1">
                          <p class="font-medium text-dark">{{ expense.description }}</p>
                          <p class="text-sm text-gray-600">
                            {{ formatDate(expense.date) }} • {{ getGroupName(expense.groupId) }}
                          </p>
                        </div>
                        <div class="text-right">
                          <p class="font-semibold text-dark">₹{{ formatAmount(expense.amount) }}</p>
                          <p class="text-xs text-gray-500">{{ getUserName(expense.paidBy) }}</p>
                        </div>
                      </div>
                    </div>
                  </template>
                </Card>

                <!-- Balance Summary -->
                <BalanceSummary @add-expense="showExpenseForm = true" />
              </div>
            </div>
          </TabPanel>

          <!-- Expenses Tab -->
          <TabPanel value="expenses">
            <ExpenseList 
              @expense-selected="handleExpenseSelected"
              @edit-expense="handleEditExpense"
              @expense-deleted="handleExpenseDeleted"
            />
          </TabPanel>

          <!-- Balances Tab -->
          <TabPanel value="balances">
            <BalanceSummary 
              @add-expense="showExpenseForm = true"
              @settle-debt="handleSettleDebt"
              @request-payment="handleRequestPayment"
              @view-details="handleViewBalanceDetails"
            />
          </TabPanel>

          <!-- Settlements Tab -->
          <TabPanel value="settlements">
            <SettlementTracker />
          </TabPanel>

          <!-- Groups Tab -->
          <TabPanel value="groups">
            <GroupManager />
          </TabPanel>

          <!-- Analytics Tab -->
          <TabPanel value="analytics">
            <SpendingAnalytics />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <!-- Expense Form Dialog -->
    <Dialog 
      v-model:visible="showExpenseForm"
      header="Add New Expense"
      modal
      class="w-full max-w-4xl"
      :closable="true"
    >
      <ExpenseForm 
        :expense="selectedExpense"
        :group-id="selectedGroupId"
        @saved="handleExpenseSaved"
        @cancelled="handleExpenseFormCancelled"
        @deleted="handleExpenseDeleted"
      />
    </Dialog>

    <!-- Expense Details Dialog -->
    <Dialog 
      v-model:visible="showExpenseDetails"
      header="Expense Details"
      modal
      class="w-full max-w-2xl"
    >
      <div v-if="selectedExpense" class="space-y-6">
        <!-- Expense Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <p class="text-lg font-semibold text-dark">{{ selectedExpense.description }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <p class="text-2xl font-bold text-accent">₹{{ formatAmount(selectedExpense.amount) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <p class="text-dark">{{ formatDate(selectedExpense.date) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Paid By</label>
            <div class="flex items-center gap-2">
              <Avatar 
                :image="getPaidByUser(selectedExpense.paidBy)?.avatar"
                :label="getPaidByUser(selectedExpense.paidBy)?.name?.charAt(0)"
                size="small"
              />
              <span class="text-dark">{{ getUserName(selectedExpense.paidBy) }}</span>
            </div>
          </div>
        </div>

        <!-- Split Details -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Split Details</label>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-3">
              <Tag :value="getSplitTypeLabel(selectedExpense.splitType)" />
              <span class="text-sm text-gray-600">
                {{ getParticipants(selectedExpense.participants).length }} participants
              </span>
            </div>
            <div class="space-y-2">
              <div 
                v-for="participant in getParticipants(selectedExpense.participants)"
                :key="participant.id"
                class="flex items-center justify-between"
              >
                <div class="flex items-center gap-2">
                  <Avatar 
                    :image="participant.avatar"
                    :label="participant.name?.charAt(0)"
                    size="small"
                  />
                  <span class="text-dark">{{ participant.name }}</span>
                </div>
                <span class="font-medium text-dark">
                  ₹{{ formatAmount(parseFloat(selectedExpense.amount) / getParticipants(selectedExpense.participants).length) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-4 border-t">
          <Button 
            label="Edit" 
            icon="pi pi-pencil"
            @click="handleEditExpense(selectedExpense)"
            class="flex-1"
          />
          <Button 
            label="Close" 
            outlined
            @click="showExpenseDetails = false"
            class="flex-1"
          />
        </div>
      </div>
    </Dialog>

    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card class="w-64 text-center">
        <template #content>
          <ProgressSpinner class="mb-4" />
          <p class="text-dark">Loading...</p>
        </template>
      </Card>
    </div>

    <!-- Toast Notifications -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'

// PrimeVue Components
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Avatar from 'primevue/avatar'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import Toast from 'primevue/toast'

// App Components
import ExpenseForm from './components/ExpenseForm.vue'
import ExpenseList from './components/ExpenseList.vue'
import BalanceSummary from './components/BalanceSummary.vue'
import SettlementTracker from './components/SettlementTracker.vue'
import GroupManager from './components/GroupManager.vue'
import SpendingAnalytics from './components/SpendingAnalytics.vue'

// Stores
import { useExpenseStore } from './stores/expenseStore.js'
import { useUserStore } from './stores/userStore.js'
import { useGroupStore } from './stores/groupStore.js'

// Initialize stores and services
const expenseStore = useExpenseStore()
const userStore = useUserStore()
const groupStore = useGroupStore()
const toast = useToast()

// Reactive state
const activeTab = ref('dashboard')
const showExpenseForm = ref(false)
const showExpenseDetails = ref(false)
const selectedExpense = ref(null)
const selectedGroupId = ref(null)
const loading = ref(false)

// Computed properties
const totalExpenses = computed(() => expenseStore.expenses.length)

const totalAmount = computed(() => expenseStore.getTotalExpenses)

const activeGroups = computed(() => {
  const groupIds = new Set(expenseStore.expenses.map(expense => expense.groupId))
  return groupIds.size
})

const pendingSettlements = computed(() => expenseStore.getPendingSettlements.length)

const recentExpenses = computed(() => {
  return [...expenseStore.expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)
})

// Methods
const formatAmount = (amount) => {
  return parseFloat(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const getUserName = (userId) => {
  const user = userStore.getUserById(userId)
  return user ? user.name : 'Unknown User'
}

const getPaidByUser = (userId) => {
  return userStore.getUserById(userId)
}

const getGroupName = (groupId) => {
  const group = groupStore.getGroupById(groupId)
  return group ? group.name : 'Unknown Group'
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
  const labels = {
    equal: 'Equal Split',
    weighted: 'Weighted Split',
    percentage: 'Percentage Split',
    custom: 'Custom Split'
  }
  return labels[splitType] || splitType
}

// Event handlers
const handleExpenseSelected = (expense) => {
  selectedExpense.value = expense
  showExpenseDetails.value = true
}

const handleEditExpense = (expense) => {
  selectedExpense.value = expense
  showExpenseDetails.value = false
  showExpenseForm.value = true
}

const handleExpenseSaved = (expense) => {
  showExpenseForm.value = false
  selectedExpense.value = null
  
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: selectedExpense.value ? 'Expense updated successfully' : 'Expense created successfully',
    life: 3000
  })
}

const handleExpenseFormCancelled = () => {
  showExpenseForm.value = false
  selectedExpense.value = null
}

const handleExpenseDeleted = (expenseId) => {
  showExpenseForm.value = false
  showExpenseDetails.value = false
  selectedExpense.value = null
  
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Expense deleted successfully',
    life: 3000
  })
}

const handleSettleDebt = (debts) => {
  // Handle debt settlement
  console.log('Settling debts:', debts)
  toast.add({
    severity: 'info',
    summary: 'Settlement',
    detail: 'Settlement process initiated',
    life: 3000
  })
}

const handleRequestPayment = (credits) => {
  // Handle payment requests
  console.log('Requesting payments:', credits)
  toast.add({
    severity: 'info',
    summary: 'Payment Request',
    detail: 'Payment requests sent',
    life: 3000
  })
}

const handleViewBalanceDetails = () => {
  activeTab.value = 'settlements'
}

// Initialize data
const initializeApp = async () => {
  loading.value = true
  
  try {
    // Load all necessary data
    await Promise.all([
      userStore.fetchUsers(),
      groupStore.fetchGroups(),
      expenseStore.fetchExpenses()
    ])
    
    // Set current user if not already set
    if (!userStore.currentUser && userStore.users.length > 0) {
      userStore.setCurrentUser(userStore.users[0])
    }
    
    // Calculate balances
    await expenseStore.calculateBalances()
    
    toast.add({
      severity: 'success',
      summary: 'Welcome to SnapSplit',
      detail: 'Your expense data has been loaded successfully',
      life: 3000
    })
  } catch (error) {
    console.error('Failed to initialize app:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load application data',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  initializeApp()
})
</script>

<style scoped>
.snap-split-dashboard {
  font-family: var(--font-secondary);
}

.snap-split-dashboard h1,
.snap-split-dashboard h2,
.snap-split-dashboard h3 {
  font-family: var(--font-primary);
}

/* Tab styling */
.p-tabs .p-tablist .p-tab {
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.p-tabs .p-tablist .p-tab:hover {
  background-color: rgba(29, 198, 144, 0.1);
}

.p-tabs .p-tablist .p-tab.p-tab-active {
  background-color: var(--color-accent);
  color: white;
}

/* Card hover effects */
.p-card {
  transition: all 0.3s ease;
  border-radius: var(--radius);
}

.p-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-strong);
}

/* Loading shimmer animation */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
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

/* Responsive adjustments */
@media (max-width: 768px) {
  .snap-split-dashboard {
    padding: 0;
  }
  
  .p-tabs .p-tablist {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .p-tabs .p-tablist .p-tab {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
  }
}
</style>
