export default [
  {
    path: '',
    name: 'snap-split-dashboard',
    component: () => import('./Index.vue')
  },
  {
    path: 'expenses',
    name: 'snap-split-expenses',
    component: () => import('./Index.vue')
  },
  {
    path: 'balances',
    name: 'snap-split-balances',
    component: () => import('./Index.vue')
  },
  {
    path: 'settlements',
    name: 'snap-split-settlements',
    component: () => import('./Index.vue')
  },
  {
    path: 'groups',
    name: 'snap-split-groups',
    component: () => import('./Index.vue')
  },
  {
    path: 'analytics',
    name: 'snap-split-analytics',
    component: () => import('./Index.vue')
  }
]
