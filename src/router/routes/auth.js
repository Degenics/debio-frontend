const authRoutes = [
  {
    path: '/login',
    name: 'login',
    meta: { public: true },
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "" */ '../../views/Login')
  },
  {
    path: '/register',
    name: 'register',
    meta: { public: true },
    component: () => import(/* webpackChunkName */ '../../views/Dashboard/Lab/Register')
  }
]

export default authRoutes